
window.PianoImport = window.PianoImport || {};

PianoImport.MidiParser = class MidiParser {
  static readVLQ(view,state){
    let value=0, b=0, guard=0;
    do{
      if(state.i>=view.byteLength) throw new Error("MIDI VLQ 超出檔案範圍");
      b=view.getUint8(state.i++);
      value=(value<<7)|(b&0x7f);
      if(++guard>4) throw new Error("MIDI VLQ 格式錯誤");
    }while(b&0x80);
    return value;
  }

  static text(view,start,len){
    let s="";
    for(let i=0;i<len;i++) s+=String.fromCharCode(view.getUint8(start+i));
    return s;
  }

  static parse(buffer){
    const view=new DataView(buffer);
    let p=0;
    const text4=()=>{const s=this.text(view,p,4);p+=4;return s;};
    const u32=()=>{const v=view.getUint32(p);p+=4;return v;};
    const u16=()=>{const v=view.getUint16(p);p+=2;return v;};

    if(text4()!=="MThd") throw new Error("不是標準 MIDI 檔案");
    const headerLength=u32();
    const format=u16();
    const trackCount=u16();
    const division=u16();
    if(division&0x8000) throw new Error("目前不支援 SMPTE MIDI timing");
    const ppq=division;
    p=8+headerLength;

    const tracks=[], tempos=[], timeSignatures=[], keySignatures=[];

    for(let ti=0;ti<trackCount;ti++){
      if(this.text(view,p,4)!=="MTrk") throw new Error(`MIDI Track ${ti+1} 標頭錯誤`);
      p+=4;
      const len=view.getUint32(p); p+=4;
      const end=p+len;
      const state={i:p};
      let tick=0, running=0, trackName="";
      const active=new Map(), notes=[];

      while(state.i<end){
        tick+=this.readVLQ(view,state);
        let status=view.getUint8(state.i++);
        if(status<0x80){
          state.i--;
          status=running;
        }else running=status;

        if(status===0xff){
          const type=view.getUint8(state.i++);
          const l=this.readVLQ(view,state);
          const start=state.i;

          if(type===0x03) trackName=this.text(view,start,l);
          if(type===0x51 && l===3){
            const us=(view.getUint8(start)<<16)|(view.getUint8(start+1)<<8)|view.getUint8(start+2);
            tempos.push({tick,usPerQuarter:us,bpm:60000000/us});
          }
          if(type===0x58 && l>=2){
            timeSignatures.push({tick,numerator:view.getUint8(start),denominator:2**view.getUint8(start+1)});
          }
          if(type===0x59 && l>=2){
            keySignatures.push({tick,sf:view.getInt8(start),minor:view.getUint8(start+1)===1});
          }
          state.i+=l;
          continue;
        }

        if(status===0xf0 || status===0xf7){
          const l=this.readVLQ(view,state);
          state.i+=l;
          continue;
        }

        const hi=status&0xf0, ch=status&0x0f;
        const d1=view.getUint8(state.i++);
        let d2=0;
        if(hi!==0xc0 && hi!==0xd0) d2=view.getUint8(state.i++);

        if(hi===0x90 && d2>0){
          const key=`${ch}:${d1}`;
          if(!active.has(key)) active.set(key,[]);
          active.get(key).push({tick,velocity:d2,channel:ch,midi:d1});
        }else if(hi===0x80 || (hi===0x90 && d2===0)){
          const key=`${ch}:${d1}`;
          const stack=active.get(key);
          if(stack?.length){
            const n=stack.shift();
            notes.push({
              startTick:n.tick,
              endTick:tick,
              durationTick:Math.max(1,tick-n.tick),
              velocity:n.velocity,
              channel:n.channel,
              midi:n.midi
            });
          }
        }
      }

      p=end;
      tracks.push({index:ti,name:trackName,notes});
    }

    return {
      format,trackCount,ppq,tracks,
      tempos:tempos.sort((a,b)=>a.tick-b.tick),
      timeSignatures:timeSignatures.sort((a,b)=>a.tick-b.tick),
      keySignatures:keySignatures.sort((a,b)=>a.tick-b.tick)
    };
  }
};
