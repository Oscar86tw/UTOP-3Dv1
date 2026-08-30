
const VERSION="6.3.1";
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

function openDrawer(page="songs"){ $("#drawer")?.classList.add("on"); $("#mask")?.classList.add("on"); showDrawerPage(page); }
function closeDrawer(){ $("#drawer")?.classList.remove("on"); $("#mask")?.classList.remove("on"); }
function showDrawerPage(page){ $$(".drawer-menu button").forEach(b=>b.classList.toggle("on",b.dataset.page===page)); $$(".drawer-page").forEach(p=>p.classList.toggle("on",p.id==="page-"+page)); }

document.addEventListener("DOMContentLoaded",async()=>{
  try{
    $("#mask")?.classList.remove("on"); $("#readyOverlay")?.classList.remove("show");
    const songLoader=new PianoScore.SongLoader();
    const firstModel=await songLoader.load("lesson-01");

    const renderer=new PianoScore.ScoreRenderer($("#scoreSvg"));
    const transport=new PianoPractice.Transport({bpm:firstModel.bpm,countInBeats:4,totalBeats:firstModel.totalBeats});
    const playhead=new PianoPractice.Playhead($("#playhead"),{readyPct:.045,targetPct:.36});
    const metronome=new PianoPractice.Metronome(transport);
    const keyboard=new PianoPractice.Keyboard($("#keyboard"));
    const practice=new PianoPractice.PracticeController({model:firstModel,renderer,transport,playhead,metronome,keyboard});
    let activeSongId="lesson-01";

    function syncModelUi(model){
      $("#songTitle").textContent=model.title;
      $("#bpm").value=model.bpm;
      $("#bpmLabel").textContent=model.bpm;
      $("#bpmStatus").textContent="♩ "+model.bpm;

      const fullLayer=$("#fullSheetLayer");
      const fullImg=$("#fullSheetImage");
      const scoreTrack=$("#scoreTrack");
      const badge=$("#sheetSourceBadge");

      if(model.displayMode==="full-sheet-image" && model.sheetImageUrl){
        if(fullLayer) fullLayer.hidden=false;
        if(scoreTrack) scoreTrack.style.visibility="hidden";
        if(fullImg){
          fullImg.src=model.sheetImageUrl;
          fullImg.alt=model.sheetTitle||model.title;
        }
        if(badge){
          badge.textContent=`已核對完整 ${model.sheetPages||1} 頁樂譜 · Sheet ID ${model.sheetId||""}`;
        }
      }else{
        if(fullLayer) fullLayer.hidden=true;
        if(scoreTrack) scoreTrack.style.visibility="visible";
      }
    }

    async function selectSong(id){
      practice.reset();
      const model=await songLoader.load(id);
      activeSongId=id;
      practice.setModel(model);
      transport.setBpm(model.bpm);
      syncModelUi(model);
      $$("#songList .song-item").forEach(x=>x.classList.toggle("active",x.dataset.songId===id));

      if(window.PianoAudio){
        const notes=[...new Set(model.eventsForHand(practice.handMode).flatMap(e=>e.notes))];
        PianoAudio.preload(notes,88).catch(err=>PianoDiagnostics?.add({kind:"song-audio-preload",message:err?.message||String(err),stack:err?.stack||"",extra:{songId:id}}));
      }
      closeDrawer();
    }

    async function renderSongList(){
      const list=$("#songList"), songs=await songLoader.list();
      list.innerHTML="";
      songs.forEach(meta=>{
        const d=document.createElement("div");
        d.className="song-item"+(meta.id===activeSongId?" active":"");
        d.dataset.songId=meta.id;
        d.innerHTML=`<b>${meta.title}</b><small>${meta.composer||""} · ${meta.category||""}</small>`;
        d.onclick=()=>selectSong(meta.id).catch(err=>{
          PianoDiagnostics?.add({kind:"song-load",message:err?.message||String(err),stack:err?.stack||"",extra:{songId:meta.id}});
          window.__PIANO_BOOT_SHOW_ERROR__?.("歌曲切換失敗",err?.stack||err?.message||String(err));
        });
        list.appendChild(d);
      });
    }

    practice.render(); syncModelUi(firstModel); await renderSongList();

    $("#menuBtn").onclick=()=>openDrawer("songs"); $("#closeDrawer").onclick=closeDrawer; $("#mask").onclick=closeDrawer;
    $$(".drawer-menu button").forEach(b=>b.onclick=()=>showDrawerPage(b.dataset.page));
    $("#playBtn").onclick=()=>practice.startOrPause();
    $("#pauseBtn").onclick=()=>practice.pauseOnly();
    $("#restartBtn").onclick=()=>practice.restart();
    $("#practiceStart").onclick=()=>practice.startOrPause();
    $("#practiceReset").onclick=()=>practice.reset();

    $("#bpm").oninput=e=>{ const bpm=Number(e.target.value); transport.setBpm(bpm); $("#bpmLabel").textContent=bpm; $("#bpmStatus").textContent="♩ "+bpm; };
    $("#countBars").value="1"; $("#countBars").onchange=e=>transport.countInBeats=Number(e.target.value)*4;
    $("#metronome").onchange=e=>{ metronome.enabled=e.target.checked; if(metronome.enabled) metronome.reschedule(); else metronome.cancel(); };
    const metroVolume=$("#metronomeVolume");
    const metroVolumeValue=$("#metronomeVolumeValue");
    if(metroVolume){
      const updateMetroVolume=()=>{
        const value=Number(metroVolume.value);
        metronome.setVolume(value/100);
        if(metroVolumeValue) metroVolumeValue.textContent=value+"%";
      };
      metroVolume.oninput=updateMetroVolume;
      metroVolume.onchange=updateMetroVolume;
      updateMetroVolume();
    }

    $$("[data-hand]").forEach(btn=>btn.onclick=()=>{ $$("[data-hand]").forEach(x=>x.classList.toggle("on",x===btn)); practice.setHand(btn.dataset.hand); });
    $("#scoreSound").onchange=e=>{ if(!e.target.checked&&window.PianoAudio) PianoAudio.setMasterVolume(0); else if(window.PianoAudio) PianoAudio.setMasterVolume(Number($("#volume").value)/100); };
    const pianoVolume=$("#volume");
    const pianoVolumeValue=$("#pianoVolumeValue");
    if(pianoVolume){
      const updatePianoVolume=()=>{
        const value=Number(pianoVolume.value);
        window.PianoAudio?.setMasterVolume(value/100);
        if(pianoVolumeValue) pianoVolumeValue.textContent=value+"%";
      };
      pianoVolume.oninput=updatePianoVolume;
      pianoVolume.onchange=updatePianoVolume;
      updatePianoVolume();
    }

    const quality=$("#audioQuality"), qualityStatus=$("#audioQualityStatus");
    async function refreshQuality(){ if(!window.PianoAudio||!qualityStatus)return; const active=await PianoAudio.setProfile(quality?.value||"auto"); qualityStatus.textContent=active==="web-hifi"?"已啟用：網站內 Hi‑Fi 三角鋼琴":"目前使用：網站內示範鋼琴音源"; }
    if(quality){ quality.onchange=()=>refreshQuality().catch(err=>PianoDiagnostics?.add({kind:"audio-profile",message:err.message,stack:err.stack})); refreshQuality().catch(()=>{}); }


    let importedMidiModel=null;
    let importedElectronicScore=null;

    const midiInput=$("#midiInput");
    if(midiInput){
      midiInput.onchange=async e=>{
        const file=e.target.files?.[0];
        if(!file)return;

        try{
          $("#midiStatus").textContent="解析中…";
          const parsed=PianoImport.MidiParser.parse(await file.arrayBuffer());

          importedMidiModel=PianoImport.MidiToScore.convert(parsed,{
            title:file.name.replace(/\.(mid|midi)$/i,"")
          });

          importedElectronicScore=PianoImport.ElectronicScore.fromModel(importedMidiModel,{
            source:`MIDI:${file.name}`
          });

          $("#midiStatus").textContent="轉換完成";
          $("#midiEventCount").textContent=importedMidiModel.events.length;
          $("#midiTotalBeats").textContent=importedMidiModel.totalBeats;
          $("#midiBpm").textContent=importedMidiModel.bpm;
          $("#useMidiScore").disabled=false;
          $("#exportElectronicScore").disabled=false;
        }catch(err){
          $("#midiStatus").textContent="轉換失敗";
          PianoDiagnostics?.add({kind:"midi-import",message:err?.message||String(err),stack:err?.stack||""});
          window.__PIANO_BOOT_SHOW_ERROR__?.("MIDI 轉電子樂譜失敗",err?.stack||err?.message||String(err));
        }
      };
    }

    $("#useMidiScore").onclick=()=>{
      if(!importedMidiModel)return;

      importedMidiModel.displayMode="digital";
      practice.setModel(importedMidiModel);
      transport.setBpm(importedMidiModel.bpm);
      syncModelUi(importedMidiModel);

      $("#fullSheetLayer").hidden=true;
      $("#scoreTrack").style.visibility="visible";
      closeDrawer();
    };

    $("#exportElectronicScore").onclick=()=>{
      if(!importedElectronicScore)return;
      PianoImport.ElectronicScore.download(
        importedElectronicScore,
        `${importedElectronicScore.title||"electronic-score"}.json`
      );
    };

    $("#photoInput").onchange=e=>{ const f=e.target.files?.[0]; if(!f)return; const img=$("#photoPreview"); img.src=URL.createObjectURL(f); img.style.display="block"; $("#importMsg").textContent="圖片已載入；OMR → MusicXML 尚未接入，因此不會拿舊歌譜假裝新歌曲。"; };
    $("#saveImport").onclick=()=>{ $("#importMsg").textContent="目前只保存照片與歌曲名稱；OMR 尚未完成前，不會套用任何舊歌曲音符。"; };

    const errorBadge=$("#errorBadge"); if(errorBadge) errorBadge.onclick=()=>openDrawer("diagnostics"); window.openPianoDiagnostics=()=>openDrawer("diagnostics");
    if(window.PianoDiagnostics){
      const list=$("#diagnosticList");
      PianoDiagnostics.subscribe(logs=>{ if(!list)return; if(!logs.length){ list.innerHTML='<div class="section"><b>目前沒有錯誤紀錄 ✓</b></div>'; return; } list.innerHTML=logs.map(x=>`<div class="diag-item"><div class="diag-head"><span class="diag-title">${x.title} · ${x.category}</span><span class="diag-time">${new Date(x.time).toLocaleString()}</span></div><code>${String(x.message).replace(/[&<>]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[m]))}${x.source?`\n${x.source}:${x.line||0}:${x.column||0}`:""}</code><div class="diag-advice">${x.advice}</div></div>`).join(""); });
      $("#copyErrorReport").onclick=()=>PianoDiagnostics.copyReport(); $("#clearErrorReport").onclick=()=>PianoDiagnostics.clear();
    }

    window.addEventListener("resize",()=>practice.render());
    window.__PIANO_APP_READY__=true; document.dispatchEvent(new CustomEvent("piano-app-ready"));
  }catch(err){
    window.PianoDiagnostics?.add({kind:"app-init",message:err?.message||String(err),stack:err?.stack||"",source:"js/app.js"});
    window.__PIANO_BOOT_SHOW_ERROR__?.(err?.message||String(err),err?.stack||"");
  }
});
