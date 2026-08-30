
window.PianoImport = window.PianoImport || {};

PianoImport.ImageScorePlayer = class ImageScorePlayer {
  constructor({image,playhead,audio}={}){
    this.image=image;
    this.playhead=playhead;
    this.audio=audio||window.PianoAudio;
    this.map=null;
    this.lastBeat=-.001;
  }

  setMap(map){
    this.map=map;
    this.lastBeat=-.001;
  }

  reset(){
    this.lastBeat=-.001;
  }

  playCrossed(fromBeat,toBeat){
    if(!this.map)return;
    const crossed=this.map.events.filter(e=>e.beat>fromBeat+1e-7 && e.beat<=toBeat+1e-7);
    crossed.forEach(e=>{
      e.notes.forEach(n=>{
        this.audio?.play(n,{velocity:88,volume:1}).catch(()=>{});
      });
    });
  }
};
