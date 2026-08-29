(()=>{
'use strict';
const state={data:null,files:[]};
const $=(id)=>document.getElementById(id);
const riskLabel={critical:'超大型',high:'大型',medium:'中型',normal:'一般'};
const fmt=(n)=>Number(n||0).toLocaleString('zh-TW');
async function load(){
  const res=await fetch('./diagnostics/project-metrics.json?ts='+Date.now(),{cache:'no-store'});
  if(!res.ok) throw new Error('診斷資料載入失敗：'+res.status);
  state.data=await res.json();state.files=state.data.files||[];
  renderSummary();renderRecommendations();renderFiles();renderFamilies();
}
function renderSummary(){const s=state.data.summary||{};$('mFiles').textContent=fmt(s.totalFiles);$('mLines').textContent=fmt(s.totalLines);$('mCritical').textContent=fmt(s.critical);$('mHigh').textContent=fmt(s.high);$('mRuntime').textContent=fmt(s.runtimeShowcaseCount)}
function renderRecommendations(){
 const limit=$('priorityFilter').value;let list=state.data.recommendations||[];if(limit!=='all')list=list.filter(x=>x.priority<=Number(limit));
 $('recommendationList').innerHTML=list.map(x=>`<article class="rec"><span class="num">${x.priority}</span><h3>${escapeHtml(x.title)}</h3><p><b>${escapeHtml(x.area)}</b></p><p>${escapeHtml(x.reason)}</p><code>建議拆成：${escapeHtml(x.target)}</code></article>`).join('');
}
function renderFiles(){
 const q=$('searchInput').value.trim().toLowerCase(),risk=$('riskFilter').value;
 const rows=state.files.filter(x=>(risk==='all'||x.risk===risk)&&(!q||x.path.toLowerCase().includes(q))).slice(0,250);
 $('fileRows').innerHTML=rows.map((x,i)=>`<tr><td>${i+1}</td><td class="path">${escapeHtml(x.path)}</td><td>${x.type}</td><td>${fmt(x.lines)}</td><td>${x.kb} KB</td><td><span class="risk ${x.risk}">${riskLabel[x.risk]}</span></td></tr>`).join('');
}
function renderFamilies(){
 const entries=Object.entries(state.data.families||{}).sort((a,b)=>b[1].lines-a[1].lines).slice(0,12);
 $('familyGrid').innerHTML=entries.map(([name,v])=>`<article class="family"><strong>${escapeHtml(name)}</strong><div class="stats">${fmt(v.count)} 個檔案 · ${fmt(v.lines)} 行</div><ul>${(v.top||[]).slice(0,4).map(f=>`<li>${escapeHtml(f.path.split('/').pop())} · ${fmt(f.lines)} 行</li>`).join('')}</ul></article>`).join('');
}
function escapeHtml(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
$('homeBtn').addEventListener('click',()=>location.href='./index.html');$('blueprintBtn')?.addEventListener('click',()=>location.href='./architecture-blueprint.html');$('refreshBtn').addEventListener('click',()=>load().catch(showError));$('priorityFilter').addEventListener('change',renderRecommendations);$('searchInput').addEventListener('input',renderFiles);$('riskFilter').addEventListener('change',renderFiles);
function showError(err){console.error(err);$('recommendationList').innerHTML=`<div class="rec"><h3>診斷資料載入失敗</h3><p>${escapeHtml(err.message)}</p></div>`}
load().catch(showError);
})();
