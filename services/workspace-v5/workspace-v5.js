
const WORKSPACE_MODE_KEY='utop-v51-workspace-mode';
const WORKSPACE_RATIO_KEY='utop-v51-workspace-ratio';

const $=id=>document.getElementById(id);
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

let currentMode='split';
let currentRatio=70;

function getViews(){
 return $('mainViews');
}

function getSceneCard(){
 return document.querySelector('#mainViews > .scene-card');
}

function getPlanCard(){
 return document.querySelector('#mainViews > .plan-card');
}

function getSplitter(){
 return $('v5ViewSplitter');
}

function notifyResize(){
 window.dispatchEvent(new Event('resize'));

 requestAnimationFrame(()=>{
  window.dispatchEvent(new Event('resize'));

  try{
   window.UTOP_WORLD_ENGINE?.syncAll?.({record:false});
  }catch(_){}
 });
}

function updateButtons(){
 const modes={
  v5BalancedView:'split',
  v5Only3D:'3d',
  v5Only2D:'2d'
 };

 Object.entries(modes).forEach(([id,mode])=>{
  const button=$(id);
  if(!button)return;

  const active=currentMode===mode;
  button.classList.toggle('is-active',active);
  button.setAttribute('aria-pressed',String(active));
 });
}

function setRatio(value,{persist=true}={}){
 currentRatio=clamp(Number(value)||70,45,85);

 document.documentElement.style.setProperty(
  '--v51-3d-ratio',
  String(currentRatio)
 );

 if(persist){
  localStorage.setItem(
   WORKSPACE_RATIO_KEY,
   String(currentRatio)
  );
 }

 notifyResize();
 return currentRatio;
}

function applyMode(mode,{persist=true}={}){
 if(!['split','3d','2d'].includes(mode)){
  mode='split';
 }

 currentMode=mode;

 const sceneCard=getSceneCard();
 const planCard=getPlanCard();
 const splitter=getSplitter();
 const body=document.body;

 body.classList.remove(
  'v51-mode-split',
  'v51-mode-3d',
  'v51-mode-2d'
 );

 if(mode==='3d'){
  body.classList.add('v51-mode-3d');

  if(sceneCard)sceneCard.hidden=false;
  if(planCard)planCard.hidden=true;
  if(splitter)splitter.hidden=true;
 }else if(mode==='2d'){
  body.classList.add('v51-mode-2d');

  if(sceneCard)sceneCard.hidden=true;
  if(planCard)planCard.hidden=false;
  if(splitter)splitter.hidden=true;
 }else{
  body.classList.add('v51-mode-split');

  if(sceneCard)sceneCard.hidden=false;
  if(planCard)planCard.hidden=false;
  if(splitter)splitter.hidden=false;
 }

 updateButtons();

 if(persist){
  localStorage.setItem(WORKSPACE_MODE_KEY,currentMode);
 }

 notifyResize();
}

function toggleScene(){
 if(currentMode==='2d'){
  applyMode('split');
 }else{
  applyMode('2d');
 }
}

function togglePlan(){
 if(currentMode==='3d'){
  applyMode('split');
 }else{
  applyMode('3d');
 }
}

function installButtons(){
 $('v5BalancedView')?.addEventListener(
  'click',
  ()=>applyMode('split')
 );

 $('v5Only3D')?.addEventListener(
  'click',
  ()=>applyMode('3d')
 );

 $('v5Only2D')?.addEventListener(
  'click',
  ()=>applyMode('2d')
 );
}

function installCollapseButtons(){
 const sceneCard=getSceneCard();
 const planCard=getPlanCard();

 const sceneButton=[...(sceneCard?.querySelectorAll('button')||[])]
  .find(button=>(button.textContent||'').trim()==='收起');

 const planButton=[...(planCard?.querySelectorAll('button')||[])]
  .find(button=>(button.textContent||'').trim()==='收起');

 if(sceneButton){
  sceneButton.textContent='▼ 3D';
  sceneButton.onclick=event=>{
   event.preventDefault();
   event.stopImmediatePropagation();
   toggleScene();
  };
 }

 if(planButton){
  planButton.textContent='▼ 2D';
  planButton.onclick=event=>{
   event.preventDefault();
   event.stopImmediatePropagation();
   togglePlan();
  };
 }
}

function installSplitter(){
 const views=getViews();
 const splitter=getSplitter();

 if(!views||!splitter)return;

 let dragging=false;

 const update=event=>{
  if(!dragging||currentMode!=='split')return;

  const rect=views.getBoundingClientRect();
  const scrollTop=views.scrollTop||0;
  const pointerY=event.clientY-rect.top+scrollTop;
  const total=Math.max(1,views.scrollHeight-16);

  setRatio((pointerY/total)*100,{persist:false});
 };

 const finish=()=>{
  if(!dragging)return;

  dragging=false;
  splitter.classList.remove('is-dragging');
  document.body.classList.remove('v51-split-dragging');

  localStorage.setItem(
   WORKSPACE_RATIO_KEY,
   String(currentRatio)
  );

  notifyResize();
 };

 splitter.addEventListener('pointerdown',event=>{
  if(currentMode!=='split')return;

  dragging=true;
  splitter.setPointerCapture?.(event.pointerId);
  splitter.classList.add('is-dragging');
  document.body.classList.add('v51-split-dragging');
  update(event);
 });

 splitter.addEventListener('pointermove',update);
 splitter.addEventListener('pointerup',finish);
 splitter.addEventListener('pointercancel',finish);

 splitter.addEventListener('keydown',event=>{
  if(currentMode!=='split')return;

  if(event.key==='ArrowUp'){
   event.preventDefault();
   setRatio(currentRatio-3);
  }

  if(event.key==='ArrowDown'){
   event.preventDefault();
   setRatio(currentRatio+3);
  }
 });
}

function restoreSidebarTitles(){
 const sidebar=document.querySelector('.module-sidebar');
 if(!sidebar)return;

 sidebar.classList.add('v51-sidebar-final');

 const headers=[...sidebar.querySelectorAll('.sidebar-pane-header')];

 if(headers[0]){
  const strong=headers[0].querySelector('strong');
  const small=headers[0].querySelector('small');

  if(strong)strong.textContent='模組庫';
  if(small)small.textContent='點分類查看模組';
 }

 if(headers[1]){
  const strong=headers[1].querySelector('strong');
  const small=headers[1].querySelector('small');

  if(strong)strong.textContent='設備設定';
  if(small)small.textContent='選取設備後調整';
 }

 sidebar.querySelectorAll(
  '.pane-title-group strong,.pane-title-group small'
 ).forEach(element=>{
  element.hidden=false;
  element.style.removeProperty('display');
  element.style.removeProperty('visibility');
  element.style.removeProperty('opacity');
 });
}

function clearLegacyWorkspaceStorage(){
 [
  'utop-v5-workspace-ratio',
  'utop-v5-workspace-mode',
  'utop-v5-workspace-ratio-a1',
  'utop-v5-workspace-mode-a1',
  'utop-v5-workspace-alpha3',
  'utop-v5-workspace-alpha3-ratio'
 ].forEach(key=>localStorage.removeItem(key));
}

function restore(){
 clearLegacyWorkspaceStorage();

 const ratio=parseFloat(
  localStorage.getItem(WORKSPACE_RATIO_KEY)
 );

 if(Number.isFinite(ratio)){
  currentRatio=clamp(ratio,45,85);
  document.documentElement.style.setProperty(
   '--v51-3d-ratio',
   String(currentRatio)
  );
 }

 const mode=localStorage.getItem(WORKSPACE_MODE_KEY);

 applyMode(
  ['split','3d','2d'].includes(mode)
   ?mode
   :'split',
  {persist:false}
 );
}

document.addEventListener('DOMContentLoaded',()=>{
 installButtons();
 installCollapseButtons();
 installSplitter();
 restoreSidebarTitles();
 restore();

 document.documentElement.dataset.utopWorkspace='v5.1-final';
});

window.UTOP_WORKSPACE_MANAGER=Object.freeze({
 version:'5.1.0',
 setMode:applyMode,
 setRatio,
 toggleScene,
 togglePlan,
 refresh:notifyResize
});
