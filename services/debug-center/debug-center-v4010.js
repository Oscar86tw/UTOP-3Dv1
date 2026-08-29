
const STORAGE_KEY='utop-v4-hidden-debug-events';
const MAX_EVENTS=500;
const engines=['Boot','Scene3D','Plan2D','ModuleLibrary','Device','Wiring','Simulation','Assets','Cloud','Runtime','UI'];
const state={events:[],health:Object.fromEntries(engines.map(x=>[x,'ok'])),filter:'ALL',search:'',open:false,issue:null,lastContext:null,lastAction:null,actionSequence:0};
const $=id=>document.getElementById(id);
const timeNow=()=>new Date().toLocaleTimeString('zh-TW',{hour12:false});
const safe=value=>{if(typeof value==='string')return value;try{return JSON.stringify(value,null,2)}catch{return String(value)}};

function restore(){try{const v=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');if(Array.isArray(v))state.events=v.slice(-MAX_EVENTS)}catch{}}
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state.events.slice(-MAX_EVENTS)))}catch{}}
function severity(level){return level==='ERROR'?2:level==='WARN'?1:0}
function markHealth(module,level){if(!state.health[module])state.health[module]='ok';const next=level==='ERROR'?'error':level==='WARN'?'warn':'ok';if(severity(level)>=severity(state.health[module]==='error'?'ERROR':state.health[module]==='warn'?'WARN':'INFO'))state.health[module]=next}
function record(level,module,message,detail=null,meta={}){const event={id:crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`,iso:new Date().toISOString(),time:timeNow(),level,module,message,detail:detail==null?null:safe(detail),meta};state.events.push(event);if(state.events.length>MAX_EVENTS)state.events.shift();if(level==='WARN'||level==='ERROR')markHealth(module,level);persist();render();return event}

function textOf(el){return el?.textContent?.replace(/\s+/g,' ').trim()||''}
function visible(el){if(!el)return false;const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&el.getClientRects().length>0}
function selectedDeviceContext(){
 const badge=$('selectedBadge')||document.querySelector('[data-selected-device],.selected-device-badge,.selection-badge');
 const heading=document.querySelector('#deviceInspectorShell .device-inspector-title,#settingsPane .settings-title,.inspector-device-name');
 return textOf(heading)||textOf(badge)||'未能辨識目前設備';
}
function currentContext(){
 const activeTab=document.querySelector('.view-tab.active,[data-view-tab].active,.tab-btn.active');
 const scene=$('sceneName')||document.querySelector('[data-scene-name],.scene-name');
 const status=$('statusText');
 return {
  url:location.href,
  viewport:`${innerWidth}x${innerHeight}`,
  activeView:textOf(activeTab)||'3D／2D工作區',
  selectedDevice:selectedDeviceContext(),
  scene:textOf(scene)||'目前場景',
  status:textOf(status)||'無狀態文字',
  focusedElement:document.activeElement?.id||document.activeElement?.name||document.activeElement?.tagName||'none',
  timestamp:new Date().toISOString()
 };
}
function refreshContext(){state.lastContext=currentContext();const target=$('debugContextPreview');if(target)target.textContent=safe(state.lastContext);return state.lastContext}
function describeControl(el){
 if(!el)return'未知控制項';
 return el.getAttribute('aria-label')||el.title||textOf(el)||el.id||el.name||el.dataset?.add||el.dataset?.action||el.tagName;
}
function startAction(el,eventType='click'){
 if(!el)return;
 const context=currentContext();
 state.actionSequence+=1;
 state.lastAction={id:`ACT-${String(state.actionSequence).padStart(4,'0')}`,eventType,control:describeControl(el),context,startedAt:new Date().toISOString()};
 record('ACTION','UI',`${eventType==='change'?'變更':'操作'}：${state.lastAction.control}`,{actionId:state.lastAction.id,context});
 setTimeout(()=>{
  const after=currentContext();
  record('INFO','Runtime',`操作後狀態：${state.lastAction?.control||'未知操作'}`,{actionId:state.lastAction?.id,before:context,after});
 },120);
}
function saveIssue(){
 const issue={
  action:$('debugIssueAction')?.value.trim()||state.lastAction?.control||'未填寫',
  expected:$('debugIssueExpected')?.value.trim()||'未填寫',
  actual:$('debugIssueActual')?.value.trim()||'未填寫',
  steps:$('debugIssueSteps')?.value.trim()||'請參考事件紀錄',
  context:refreshContext(),
  lastAction:state.lastAction,
  savedAt:new Date().toISOString()
 };
 state.issue=issue;
 record('WARN','DebugCenter','已建立問題描述：預期與實際結果不同',issue);
 buildReport();
 switchTab('report');
}
function clearIssueFields(){['debugIssueAction','debugIssueExpected','debugIssueActual','debugIssueSteps'].forEach(id=>{const el=$(id);if(el)el.value=''});state.issue=null;refreshContext()}
function summary(){const warnings=state.events.filter(x=>x.level==='WARN').length;const errors=state.events.filter(x=>x.level==='ERROR').length;return{warnings,errors,total:state.events.length,status:errors?'error':warnings?'warn':'ok'}}
function setOpen(open){state.open=open;const drawer=$('debugCenterDrawer');const backdrop=$('debugDrawerBackdrop');drawer?.classList.toggle('is-open',open);drawer?.setAttribute('aria-hidden',String(!open));backdrop?.toggleAttribute('hidden',!open);$('debugStatusBtn')?.setAttribute('aria-expanded',String(open));if(open)buildReport()}
function escapeHtml(s){return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}
function renderStatus(){const s=summary(),btn=$('debugStatusBtn'),dot=$('debugLargeDot');if(!btn)return;btn.classList.remove('is-ok','is-warn','is-error');btn.classList.add(`is-${s.status}`);dot?.classList.remove('is-ok','is-warn','is-error');dot?.classList.add(`is-${s.status}`);const label=btn.querySelector('.debug-status-label');if(label)label.textContent=s.status==='error'?'系統錯誤':s.status==='warn'?'系統注意':'系統正常';const count=$('debugStatusCount');if(count){count.hidden=!(s.errors||s.warnings);count.textContent=String(s.errors+s.warnings)}$('debugWarnCount').textContent=s.warnings;$('debugErrorCount').textContent=s.errors;$('debugEventCount').textContent=s.total;$('debugSummaryTitle').textContent=s.status==='error'?'偵測到系統錯誤':s.status==='warn'?'偵測到注意事項':'系統正常';$('debugSummaryText').textContent=s.status==='error'?'部分功能可能受到影響，請查看最近錯誤':s.status==='warn'?'系統仍可操作，但有項目需要注意':'目前沒有影響操作的錯誤'}
function renderRecent(){const target=$('debugRecentList');if(!target)return;const list=state.events.filter(x=>x.level==='ERROR'||x.level==='WARN').slice(-12).reverse();target.innerHTML=list.length?list.map(e=>`<article class="debug-event-card" data-level="${e.level}"><div class="debug-event-head"><span>${escapeHtml(e.level)}｜${escapeHtml(e.module)}</span><time>${escapeHtml(e.time)}</time></div><strong>${escapeHtml(e.message)}</strong>${e.detail?`<pre>${escapeHtml(e.detail)}</pre>`:''}</article>`).join(''):'<article class="debug-event-card" data-level="SUCCESS"><strong>目前沒有警告或錯誤</strong><pre>Debug Center 會在背景持續記錄。</pre></article>'}
function filtered(){const q=state.search.toLowerCase();return state.events.filter(e=>(state.filter==='ALL'||e.level===state.filter)&&(!q||`${e.module} ${e.message} ${e.detail||''}`.toLowerCase().includes(q)))}
function renderConsole(){const target=$('debugConsoleOutput');if(!target)return;target.textContent=filtered().map(e=>`[${e.time}] [${e.level}] [${e.module}] ${e.message}${e.detail?`\n${e.detail}`:''}`).join('\n')||'尚無符合條件的紀錄。';target.scrollTop=target.scrollHeight}
function renderHealth(){const target=$('debugHealthGrid');if(!target)return;target.innerHTML=Object.entries(state.health).map(([name,status])=>`<div class="debug-health-item is-${status}"><i></i><strong>${escapeHtml(name)}</strong><small>${status==='error'?'錯誤':status==='warn'?'注意':'正常'}</small></div>`).join('')}
function render(){renderStatus();renderRecent();renderConsole();renderHealth();if(state.open)buildReport()}
function format(e){return`[${e.time}] [${e.level}] [${e.module}] ${e.message}${e.detail?` | ${e.detail.replace(/\n/g,' ')}`:''}`}
function buildReport(){const errors=state.events.filter(e=>e.level==='ERROR'),warns=state.events.filter(e=>e.level==='WARN'),lastAction=[...state.events].reverse().find(e=>e.level==='ACTION');const context=refreshContext();const issue=state.issue;const issueText=issue?`\nPROBLEM DESCRIPTION\n----------------------------------------\nAction: ${issue.action}\nExpected: ${issue.expected}\nActual: ${issue.actual}\nReproduction steps: ${issue.steps}\nSelected device: ${issue.context?.selectedDevice||'Unknown'}\nActive view: ${issue.context?.activeView||'Unknown'}\nStatus: ${issue.context?.status||'Unknown'}\n`:`\nPROBLEM DESCRIPTION\n----------------------------------------\n尚未填寫「預期結果／實際結果」。請在問題描述頁籤補充，可大幅提高 AI 判斷準確度。\n`;const report=`UTOP V4 AI DEBUG REPORT\n========================================\nVersion: 4.0.1 Simulation Trace Foundation\nPage: ${location.href}\nBrowser: ${navigator.userAgent}\nViewport: ${innerWidth}x${innerHeight}\nGenerated: ${new Date().toLocaleString('zh-TW')}\nCurrent selected device: ${context.selectedDevice}\nCurrent view: ${context.activeView}\nCurrent status: ${context.status}\n${issueText}\nSUMMARY\n----------------------------------------\nEvents: ${state.events.length}\nWarnings: ${warns.length}\nErrors: ${errors.length}\nLast action: ${lastAction?.message||'None'}\n\nENGINE HEALTH\n----------------------------------------\n${Object.entries(state.health).map(([k,v])=>`- ${k}: ${v.toUpperCase()}`).join('\n')}\n\nRECENT ERRORS\n----------------------------------------\n${errors.slice(-12).map(format).join('\n')||'No errors recorded.'}\n\nRECENT WARNINGS\n----------------------------------------\n${warns.slice(-12).map(format).join('\n')||'No warnings recorded.'}\n\nEVENT TRACE\n----------------------------------------\n${state.events.slice(-120).map(format).join('\n')}\n\nREQUEST FOR AI\n----------------------------------------\n1. 請先找出第一個真正失敗的位置，不要只修最後的連鎖錯誤。\n2. 比對「預期結果」與「實際結果」，說明是哪一層沒有同步。\n3. 請提供完整替換程式碼，不要只給片段。\n4. 說明受影響的3D、2D、模組、設備設定、接線或模擬功能。\n5. 提供手機與電腦的驗證步驟，避免修正後版面再次跑掉。`;const target=$('debugReportOutput');if(target)target.value=report;return report}
function download(name,content,type='text/plain;charset=utf-8'){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),300)}
async function copyReport(){const text=buildReport();try{await navigator.clipboard.writeText(text);record('SUCCESS','DebugCenter','診斷報告已複製給 AI')}catch{$('debugReportOutput')?.select();document.execCommand('copy');record('SUCCESS','DebugCenter','診斷報告已使用相容模式複製')}}
function clear(){state.events=[];state.health=Object.fromEntries(engines.map(x=>[x,'ok']));persist();record('SUCCESS','DebugCenter','診斷紀錄已清除')}
function switchTab(name){document.querySelectorAll('[data-debug-tab]').forEach(x=>x.classList.toggle('active',x.dataset.debugTab===name));document.querySelectorAll('[data-debug-page]').forEach(x=>x.classList.toggle('active',x.dataset.debugPage===name));if(name==='report')buildReport()}

function bind(){
 $('debugStatusBtn')?.addEventListener('click',()=>setOpen(true));$('debugCloseBtn')?.addEventListener('click',()=>setOpen(false));$('debugDrawerBackdrop')?.addEventListener('click',()=>setOpen(false));
 document.querySelectorAll('[data-debug-tab]').forEach(x=>x.addEventListener('click',()=>switchTab(x.dataset.debugTab)));
 $('debugClearBtn')?.addEventListener('click',()=>{if(confirm('確定清除診斷紀錄？'))clear()});
 $('debugSaveIssueBtn')?.addEventListener('click',saveIssue);$('debugCaptureNowBtn')?.addEventListener('click',()=>{refreshContext();record('INFO','DebugCenter','已擷取目前操作狀態',state.lastContext)});$('debugClearIssueBtn')?.addEventListener('click',clearIssueFields);
 $('debugCopyReportBtn')?.addEventListener('click',copyReport);$('debugDownloadTxtBtn')?.addEventListener('click',()=>download('UTOP_V4_AI_Debug_Report.txt',buildReport()));$('debugDownloadJsonBtn')?.addEventListener('click',()=>download('UTOP_V4_Debug_Log.json',JSON.stringify({version:'4.0.0',health:state.health,events:state.events},null,2),'application/json'));
 $('debugLevelFilter')?.addEventListener('change',e=>{state.filter=e.currentTarget.value;renderConsole()});$('debugSearch')?.addEventListener('input',e=>{state.search=e.currentTarget.value;renderConsole()});
 document.querySelectorAll('[data-debug-test]').forEach(x=>x.addEventListener('click',()=>{const err=x.dataset.debugTest==='error';record(err?'ERROR':'WARN',err?'Render':'Simulation',err?'測試錯誤：3D／2D同步失敗':'測試警告：設備回應時間較長',{test:true})}));
 document.addEventListener('click',e=>{const button=e.target.closest('button');if(!button||button.closest('#debugCenterDrawer')||button.id==='debugStatusBtn')return;startAction(button,'click')},true);
 document.addEventListener('change',e=>{if(e.target.closest('#debugCenterDrawer'))return;const el=e.target;if(!['INPUT','SELECT','TEXTAREA'].includes(el.tagName))return;startAction(el,'change');record('INFO','Device',`欄位新值：${describeControl(el)}`,{type:el.type||el.tagName,value:el.type==='password'?'[hidden]':el.value})},true);
 window.addEventListener('error',e=>record('ERROR','Runtime',e.message,{file:e.filename,line:e.lineno,column:e.colno,stack:e.error?.stack||null}));
 window.addEventListener('unhandledrejection',e=>record('ERROR','Runtime','未處理的 Promise 錯誤',e.reason?.stack||e.reason));
 window.addEventListener('online',()=>record('SUCCESS','Cloud','網路已恢復'));window.addEventListener('offline',()=>record('ERROR','Cloud','瀏覽器目前離線'));
 window.addEventListener('utop-debug-event',e=>{const d=e.detail||{};record(d.level||'INFO',d.module||'Runtime',d.message||'UTOP事件',d.detail||null,d.meta||{})});
 const observer=new MutationObserver(mutations=>{if(!state.lastAction)return;const meaningful=mutations.some(m=>{const t=m.target;return t?.id==='selectedBadge'||t?.id==='statusText'||t?.closest?.('#planSvg,#sceneCanvas,.device-inspector,.workspace')});if(meaningful){clearTimeout(observer.timer);observer.timer=setTimeout(()=>{record('INFO','UI','畫面狀態已更新',{actionId:state.lastAction?.id,context:currentContext()})},180)}});
 observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','style','aria-selected']});
 refreshContext();
}

restore();bind();render();record('SUCCESS','DebugCenter','背景診斷服務已啟動');
window.UTOP_DEBUG=Object.freeze({record,open:()=>setOpen(true),close:()=>setOpen(false),report:buildReport,capture:refreshContext,saveIssue,getEvents:()=>[...state.events],setHealth:(module,status,detail)=>{state.health[module]=status;record(status==='error'?'ERROR':status==='warn'?'WARN':'SUCCESS',module,`狀態更新：${status}`,detail)}});
