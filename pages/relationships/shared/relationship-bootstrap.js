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
  try{const raw=h?.UTOP_STORAGE_API?.getProjectData?.();if(raw&&Array.isArray(raw.items)&&raw.items.length)return {version:'5.1.3.65',generatedAt:new Date().toISOString(),projectName:h?.document?.title||'UTOP-3D',items:raw.items,wires:Array.isArray(raw.wires)?raw.wires:[],shortcuts:Array.isArray(raw.shortcuts)?raw.shortcuts:[]}}catch{}
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
 setTimeout(()=>{if(window.__UTOP_RELATIONSHIP_3D_READY__)return;const g=document.getElementById('graph');if(!g)return;let n=document.getElementById('relationship3dLoadNotice');if(!n){n=document.createElement('div');n.id='relationship3dLoadNotice';n.style.cssText='position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);padding:14px 18px;border-radius:12px;background:#fff;color:#111;border:1px solid #ccd6e3;box-shadow:0 8px 30px rgba(0,0,0,.15);font-size:14px;z-index:20';n.textContent='3D 關聯圖核心尚未啟動，請重新讀取或重新整理頁面。';g.parentElement?.appendChild(n)}},1800);
})();
