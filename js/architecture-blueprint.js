(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
let data;
async function load(){
 const res=await fetch('./diagnostics/architecture-plan.json?ts='+Date.now(),{cache:'no-store'});
 if(!res.ok)throw new Error('架構藍圖載入失敗：'+res.status);
 data=await res.json(); render();
}
function render(){renderPrinciples();renderZones();renderFacades();renderEvents();renderMigration()}
function renderPrinciples(){
 $('principles').innerHTML=(data.principles||[]).map((x,i)=>`<article><span>${i+1}</span><p>${esc(x)}</p></article>`).join('');
}
function renderZones(){
 const q=$('searchInput').value.trim().toLowerCase();
 const zones=(data.zones||[]).filter(z=>!q||JSON.stringify(z).toLowerCase().includes(q));
 $('zoneGrid').innerHTML=zones.map(z=>`<article class="zone">
   <div class="zone-title"><div><strong>${esc(z.name)}</strong><code>${esc(z.folder)}</code></div><span>${esc(z.id)}</span></div>
   <p class="resp">${esc(z.responsibility)}</p>
   <div class="cols"><div><h3>可依賴</h3><ul>${(z.mayUse||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div><div class="deny"><h3>禁止</h3><ul>${(z.mustNot||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></div>
   <div class="split"><b>建議拆成</b>${(z.split||[]).map(x=>`<span>${esc(x)}</span>`).join('')}</div>
 </article>`).join('')||'<div class="empty">找不到符合條件的分區。</div>';
}
function renderFacades(){
 $('facadeGrid').innerHTML=(data.facades||[]).map(f=>`<article><strong>${esc(f.name)}</strong><p>${esc(f.owns)}</p><div>${(f.examples||[]).map(x=>`<code>${esc(x)}()</code>`).join('')}</div></article>`).join('');
}
function renderEvents(){
 $('eventList').innerHTML=(data.events||[]).map(e=>`<code>${esc(e)}</code>`).join('');
}
function renderMigration(){
 $('migrationList').innerHTML=(data.migration||[]).map(m=>`<article><span>${m.phase}</span><div><strong>${esc(m.title)}</strong><p>${esc(m.detail)}</p></div></article>`).join('');
}
$('searchInput').addEventListener('input',()=>data&&renderZones());
$('diagnosticBtn').addEventListener('click',()=>location.href='./architecture-diagnostic.html');
$('homeBtn').addEventListener('click',()=>location.href='./index.html');
load().catch(err=>{console.error(err);$('zoneGrid').innerHTML=`<div class="empty">${esc(err.message)}</div>`});
})();
