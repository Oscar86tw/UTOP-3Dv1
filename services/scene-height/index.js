const DEFAULT_RANGE=Object.freeze({
  min:-20,
  max:20,
  step:0.1,
  source:'default'
});

let activeRange={...DEFAULT_RANGE};

function finite(value,fallback){
  const number=Number(value);
  return Number.isFinite(number)?number:fallback;
}

export function normalizeHeightRange(range={}){
  let min=finite(range.min,DEFAULT_RANGE.min);
  let max=finite(range.max,DEFAULT_RANGE.max);
  if(min>max)[min,max]=[max,min];

  // 至少保留1公尺可調範圍。
  if(Math.abs(max-min)<1){
    const center=(min+max)/2;
    min=center-.5;
    max=center+.5;
  }

  return {
    min:Math.floor(min*10)/10,
    max:Math.ceil(max*10)/10,
    step:Math.max(.01,finite(range.step,DEFAULT_RANGE.step)),
    source:String(range.source||'scene')
  };
}

export function setSceneHeightRange(range={}){
  activeRange=normalizeHeightRange(range);
  window.UTOP_SCENE_HEIGHT_RANGE={...activeRange};
  window.dispatchEvent(new CustomEvent('utop-scene-height-range-change',{
    detail:{...activeRange}
  }));
  return {...activeRange};
}

export function getSceneHeightRange(){
  const external=window.UTOP_SCENE_HEIGHT_RANGE;
  if(external){
    activeRange=normalizeHeightRange(external);
  }
  return {...activeRange};
}

export function resetSceneHeightRange(){
  return setSceneHeightRange(DEFAULT_RANGE);
}

export function normalizeHeight(value,minOrRange,maxValue){
  let range;
  if(minOrRange&&typeof minOrRange==='object'){
    range=normalizeHeightRange(minOrRange);
  }else if(Number.isFinite(Number(minOrRange))||Number.isFinite(Number(maxValue))){
    range=normalizeHeightRange({
      min:finite(minOrRange,DEFAULT_RANGE.min),
      max:finite(maxValue,DEFAULT_RANGE.max)
    });
  }else{
    range=getSceneHeightRange();
  }

  const number=Number(value);
  if(!Number.isFinite(number))return Math.min(range.max,Math.max(range.min,0));
  return Math.min(range.max,Math.max(range.min,number));
}

export function applyHeightToObject(item){
  const range=getSceneHeightRange();
  const height=normalizeHeight(
    item?.y??item?.params?.installationHeight??0,
    range
  );
  item.y=height;

  if(item?.params){
    item.params.installationHeight=height;
  }
  if(item?.mesh){
    item.mesh.position.y=height;
  }
  return height;
}

if(typeof window!=='undefined'&&!window.UTOP_SCENE_HEIGHT_RANGE){
  window.UTOP_SCENE_HEIGHT_RANGE={...DEFAULT_RANGE};
}
