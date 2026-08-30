
window.PianoImport = window.PianoImport || {};

PianoImport.ImageScoreMap = class ImageScoreMap {
  constructor(){
    this.events=[];
    this.meta={
      title:"",
      bpm:60,
      time:[4,4],
      keySignature:"C",
      source:"IMAGE-SCORE"
    };
  }

  setMeta(meta={}){
    this.meta={...this.meta,...meta};
  }

  addEvent({beat,notes,hand="R",xNorm,yNorm,widthNorm=.02,heightNorm=.04,duration=1}){
    const evt={
      id:`img-${this.events.length}`,
      beat:Number(beat)||0,
      notes:Array.isArray(notes)?notes:[notes],
      hand,
      xNorm:Number(xNorm)||0,
      yNorm:Number(yNorm)||0,
      widthNorm:Number(widthNorm)||.02,
      heightNorm:Number(heightNorm)||.04,
      duration:Number(duration)||1
    };
    evt.notes.forEach(PianoCore.Note.parse);
    this.events.push(evt);
    this.events.sort((a,b)=>a.beat-b.beat);
    return evt;
  }

  clear(){
    this.events=[];
  }

  toScoreModel(){
    const totalBeats=this.events.reduce((m,e)=>Math.max(m,e.beat+e.duration),0);
    return new PianoScore.ScoreModel({
      title:this.meta.title||"Image Score",
      bpm:this.meta.bpm||60,
      time:this.meta.time||[4,4],
      keySignature:this.meta.keySignature||"C",
      totalBeats:Math.ceil(totalBeats),
      events:this.events.map(e=>({
        beat:e.beat,
        notes:[...e.notes],
        duration:e.duration,
        hand:e.hand
      }))
    });
  }

  export(){
    return {
      format:"PIANO-IMAGE-ELECTRONIC-SCORE",
      version:"1.0",
      meta:this.meta,
      events:this.events
    };
  }

  import(data){
    if(!data || data.format!=="PIANO-IMAGE-ELECTRONIC-SCORE"){
      throw new Error("不是有效的圖片電子樂譜檔案");
    }
    this.meta={...this.meta,...(data.meta||{})};
    this.events=[];
    (data.events||[]).forEach(e=>this.addEvent(e));
  }
};
