
window.PianoAudio = (() => {
  const state = {
    ctx: null,
    config: null,
    profile: "auto",
    buffers: new Map(),
    loading: new Map(),
    activeProfile: "demo",
    master: null,
    initialized: false
  };

  const NOTE_PC = {C:0,Cs:1,D:2,Ds:3,E:4,F:5,Fs:6,G:7,Gs:8,A:9,As:10,B:11};
  const PC_NOTE = ["C","Cs","D","Ds","E","F","Fs","G","Gs","A","As","B"];

  function noteToMidi(note){
    const m = /^([A-G])([sb]?)(\d)$/.exec(note.replace("#","s"));
    if(!m) return 60;
    let pc = NOTE_PC[m[1] + (m[2]||"")];
    return (Number(m[3])+1)*12 + pc;
  }
  function midiToNote(midi){
    return PC_NOTE[midi%12] + (Math.floor(midi/12)-1);
  }
  function velocityLayer(v){
    const layers = [4,8,11,15];
    const norm = Math.max(1, Math.min(127, v ?? 88));
    const target = norm / 127 * 15;
    return layers.reduce((best,x)=>Math.abs(x-target)<Math.abs(best-target)?x:best, layers[0]);
  }
  function rootToMidi(root){
    return noteToMidi(root);
  }
  function nearestRoot(note){
    const p = state.config.profiles["web-hifi"];
    const midi = noteToMidi(note);
    let best = null, bestDist = 999;
    for(const root of p.sampleRoots){
      const d = Math.abs(rootToMidi(root)-midi);
      if(d < bestDist){ bestDist=d; best=root; }
    }
    return {root:best, semitones:midi-rootToMidi(best)};
  }
  async function ensureContext(){
    if(!state.ctx){
      state.ctx = new (window.AudioContext||window.webkitAudioContext)({latencyHint:"interactive"});
      state.master = state.ctx.createGain();
      state.master.gain.value = .82;
      state.master.connect(state.ctx.destination);
    }
    if(state.ctx.state==="suspended") await state.ctx.resume();
  }
  async function loadConfig(){
    if(state.config) return state.config;
    const r = await fetch("data/audio-profile.json", {cache:"no-store"});
    state.config = await r.json();
    return state.config;
  }
  async function probeHifi(){
    try{
      const r = await fetch("assets/audio/piano/grand/manifest.json", {cache:"no-store"});
      if(!r.ok) return false;
      const m = await r.json();
      return !!m.installed;
    }catch{ return false; }
  }
  async function init(profile="auto", {activateAudio=false}={}){
    await loadConfig();
    state.profile = profile;
    if(profile==="web-hifi" || profile==="auto"){
      state.activeProfile = await probeHifi() ? "web-hifi" : "demo";
    }else{
      state.activeProfile = "demo";
    }
    if(activateAudio) await ensureContext();
    state.initialized = true;
    document.dispatchEvent(new CustomEvent("piano-audio-ready",{detail:{profile:state.activeProfile}}));
    return state.activeProfile;
  }

  async function fetchDecode(key, url){
    if(state.buffers.has(key)) return state.buffers.get(key);
    if(state.loading.has(key)) return state.loading.get(key);
    const task = (async()=>{
      const r = await fetch(url);
      if(!r.ok) throw new Error(`Audio sample not found: ${url}`);
      const b = await state.ctx.decodeAudioData(await r.arrayBuffer());
      state.buffers.set(key,b);
      state.loading.delete(key);
      return b;
    })();
    state.loading.set(key,task);
    return task;
  }

  async function loadDemo(note){
    const url = `assets/audio/piano/demo/${note}.wav`;
    return {buffer:await fetchDecode("demo:"+note,url), playbackRate:1};
  }

  async function loadHifi(note, velocity=88){
    const layer = velocityLayer(velocity);
    const {root,semitones} = nearestRoot(note);
    const base = `assets/audio/piano/grand/v${layer}`;
    const candidates = [
      `${base}/${root}v${layer}.ogg`,
      `${base}/${root}v${layer}.mp3`
    ];
    let lastErr;
    for(const url of candidates){
      try{
        const buf = await fetchDecode(`hifi:${layer}:${root}:${url.split(".").pop()}`,url);
        return {buffer:buf, playbackRate:Math.pow(2,semitones/12)};
      }catch(e){ lastErr=e; }
    }
    throw lastErr;
  }

  async function play(note, {velocity=88, volume=1, when=0, duration=null}={}){
    if(!state.initialized) await init(state.profile);
    await ensureContext();

    let sample;
    try{
      sample = state.activeProfile==="web-hifi"
        ? await loadHifi(note,velocity)
        : await loadDemo(note);
    }catch{
      state.activeProfile="demo";
      sample = await loadDemo(note);
    }

    const src = state.ctx.createBufferSource();
    const gain = state.ctx.createGain();
    src.buffer = sample.buffer;
    src.playbackRate.value = sample.playbackRate;
    gain.gain.value = Math.max(0,Math.min(1.4,volume)) * (.45 + velocity/127*.55);
    src.connect(gain).connect(state.master);
    const t = state.ctx.currentTime + when;
    src.start(t);
    if(duration){
      gain.gain.setValueAtTime(gain.gain.value,t+Math.max(.05,duration-.08));
      gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
      src.stop(t+duration+.04);
    }
    return src;
  }

  async function preload(notes, velocity=88){
    if(!state.initialized) await init(state.profile);
    await ensureContext();
    const uniq = [...new Set(notes)];
    const tasks = uniq.map(n => state.activeProfile==="web-hifi" ? loadHifi(n,velocity) : loadDemo(n));
    return Promise.allSettled(tasks);
  }

  function setMasterVolume(v){
    if(state.master) state.master.gain.value=Math.max(0,Math.min(1,Number(v)));
  }

  async function setProfile(profile){
    state.profile=profile;
    return init(profile,{activateAudio:false});
  }

  function info(){
    return {
      configured: state.profile,
      active: state.activeProfile,
      cachedSamples: state.buffers.size
    };
  }

  return {init,play,preload,setMasterVolume,setProfile,info};
})();
