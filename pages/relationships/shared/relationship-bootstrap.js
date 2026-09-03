(()=>{
 const valid=x=>!!(x&&Array.isArray(x.items)&&x.items.length>0);
 function host(){
  try{if(window.parent&&window.parent!==window&&window.parent.location.origin===location.origin)return window.parent}catch{}
  try{if(window.opener&&!window.opener.closed&&window.opener.location.origin===location.origin)return window.opener}catch{}
  return null;
 }
 function fromHost(){
  const h=host();
  try{const api=h?.UTOP_RELATIONSHIP_API;const x=api?.getSnapshot?.();if(valid(x))return x}catch{}
  try{const raw=h?.UTOP_STORAGE_API?.getProjectData?.();if(raw&&Array.isArray(raw.items)&&raw.items.length)return {version:'5.1.3.64',generatedAt:new Date().toISOString(),projectName:h?.document?.title||'UTOP-3D',items:raw.items,wires:Array.isArray(raw.wires)?raw.wires:[],shortcuts:Array.isArray(raw.shortcuts)?raw.shortcuts:[]}}catch{}
  return null;
 }
 function cached(){
  try{const x=JSON.parse(sessionStorage.getItem('utop3d.relationship.live')||'null');if(valid(x))return x}catch{}
  try{const x=JSON.parse(localStorage.getItem('utop3d.relationship.snapshot')||'null');if(valid(x))return x}catch{}
  return null;
 }
 function updateCounters(x){
  if(!valid(x))return;
  window.__UTOP_RELATIONSHIP_SNAPSHOT__=x;
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=String(v)};
  set('statModules',x.items.length);
  set('statLinks',Array.isArray(x.wires)?x.wires.length:0);
  const groups=new Set((x.items||[]).map(i=>i.type||'other'));
  set('statGroups',groups.size);
 }
 window.__UTOP_RELATIONSHIP_GET_LIVE__=()=>fromHost()||cached();
 const initial=window.__UTOP_RELATIONSHIP_GET_LIVE__();if(initial)updateCounters(initial);
 window.addEventListener('message',e=>{if(e.origin!==location.origin||e.data?.type!=='UTOP_RELATIONSHIP_SNAPSHOT')return;if(valid(e.data.snapshot))updateCounters(e.data.snapshot)});
 setTimeout(()=>{const x=window.__UTOP_RELATIONSHIP_GET_LIVE__();if(x)updateCounters(x)},60);
 setTimeout(()=>{const x=window.__UTOP_RELATIONSHIP_GET_LIVE__();if(x)updateCounters(x)},300);
})();
