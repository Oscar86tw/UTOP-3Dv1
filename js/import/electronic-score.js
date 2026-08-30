
window.PianoImport = window.PianoImport || {};

PianoImport.ElectronicScore = {
  fromModel(model,meta={}){
    return {
      format:"PIANO-ELECTRONIC-SCORE",
      version:"1.0",
      id:meta.id||`import-${Date.now()}`,
      title:model.title,
      composer:meta.composer||model.composer||"",
      bpm:model.bpm,
      time:model.time,
      keySignature:model.keySignature,
      totalBeats:model.totalBeats,
      source:meta.source||"MIDI",
      events:model.events.map(e=>({
        beat:e.beat,
        duration:e.duration,
        hand:e.hand,
        notes:[...e.notes],
        velocity:e.velocity??88
      }))
    };
  },

  download(score,filename="electronic-score.json"){
    const blob=new Blob([JSON.stringify(score,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=filename;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
};
