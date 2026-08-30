
window.PianoImport = window.PianoImport || {};

PianoImport.MidiToScore = class MidiToScore {
  static NAMES=["C","Cs","D","Ds","E","F","Fs","G","Gs","A","As","B"];

  static midiToName(midi){
    return this.NAMES[midi%12]+(Math.floor(midi/12)-1);
  }

  static detectHands(parsed){
    const tracks=parsed.tracks.filter(t=>t.notes.length);
    if(tracks.length<2) return null;
    const ranked=tracks.map(t=>({
      track:t,
      avg:t.notes.reduce((s,n)=>s+n.midi,0)/t.notes.length
    })).sort((a,b)=>b.avg-a.avg);
    return {
      right:new Set([ranked[0].track.index]),
      left:new Set(ranked.slice(1).map(x=>x.track.index))
    };
  }

  static keySignature(parsed){
    const k=parsed.keySignatures[0];
    if(!k || k.minor) return "C";
    const map={0:"C",1:"G",2:"D",3:"A",4:"E",5:"B",6:"Fs",7:"Cs","-1":"F","-2":"Bb","-3":"Eb","-4":"Ab","-5":"Db"};
    return map[k.sf]||"C";
  }

  static convert(parsed,{title="Imported MIDI",splitMidi=60}={}){
    const ppq=parsed.ppq;
    const handTracks=this.detectHands(parsed);
    const raw=[];

    parsed.tracks.forEach(track=>{
      track.notes.forEach(n=>{
        const hand=handTracks
          ? (handTracks.right.has(track.index)?"R":"L")
          : (n.midi>=splitMidi?"R":"L");

        raw.push({
          beat:Number((n.startTick/ppq).toFixed(6)),
          duration:Number((n.durationTick/ppq).toFixed(6)),
          notes:[this.midiToName(n.midi)],
          hand,
          velocity:n.velocity,
          midi:n.midi,
          sourceTrack:track.index
        });
      });
    });

    const grouped=new Map();
    raw.forEach(e=>{
      const key=`${e.hand}:${e.beat.toFixed(6)}:${e.duration.toFixed(6)}`;
      if(!grouped.has(key)) grouped.set(key,{...e,notes:[]});
      grouped.get(key).notes.push(...e.notes);
    });

    const events=[...grouped.values()].sort((a,b)=>a.beat-b.beat || a.hand.localeCompare(b.hand));
    const totalBeats=Math.ceil(events.reduce((m,e)=>Math.max(m,e.beat+e.duration),0));
    const ts=parsed.timeSignatures[0]||{numerator:4,denominator:4};
    const bpm=parsed.tempos[0]?.bpm||60;

    return new PianoScore.ScoreModel({
      title,
      bpm:Math.round(bpm*100)/100,
      time:[ts.numerator,ts.denominator],
      keySignature:this.keySignature(parsed),
      totalBeats,
      events
    });
  }
};
