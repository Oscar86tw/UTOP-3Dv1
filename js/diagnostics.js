
window.PianoDiagnostics = (() => {
  const STORE_KEY = "piano_learning_error_log_6.3.1";
  const MAX = 60;
  const listeners = new Set();

  function classify(message="", source="", stack=""){
    const text = `${message} ${source} ${stack}`;
    if(/Failed to fetch|NetworkError|fetch/i.test(text))
      return ["NETWORK","網路／檔案載入失敗","檢查檔案路徑、大小寫、GitHub Pages 部署與網路連線。"];
    if(/Audio sample|decodeAudioData|audio/i.test(text))
      return ["AUDIO","鋼琴音源錯誤","檢查 assets/audio/piano/、音檔格式、manifest 與檔名。"];
    if(/getUserMedia|NotAllowedError|microphone|Permission denied/i.test(text))
      return ["MIC","麥克風權限錯誤","確認 HTTPS、瀏覽器麥克風權限與裝置輸入。"];
    if(/localStorage|QuotaExceeded|storage/i.test(text))
      return ["STORAGE","網站儲存錯誤","檢查瀏覽器網站儲存空間或清理舊資料。"];
    if(/SyntaxError|Unexpected token/i.test(text))
      return ["SYNTAX","程式語法錯誤","依錯誤檔案與行號檢查 JavaScript／JSON。"];
    if(/TypeError|ReferenceError|undefined|null/i.test(text))
      return ["JAVASCRIPT","程式執行錯誤","依錯誤檔案與行號檢查最近修改、元素 ID 與初始化順序。"];
    return ["UNKNOWN","未分類錯誤","保留錯誤報告，後續依時間、檔案、行號與操作步驟修正。"];
  }

  function load(){
    try { return JSON.parse(localStorage.getItem(STORE_KEY)||"[]"); } catch { return []; }
  }
  function save(logs){
    try { localStorage.setItem(STORE_KEY, JSON.stringify(logs.slice(0,MAX))); } catch {}
  }
  function emit(){ listeners.forEach(fn=>{try{fn(load())}catch{}}); }

  function add({message="",source="",line=0,column=0,stack="",kind="runtime",extra=null}={}){
    const [category,title,advice] = classify(message,source,stack);
    const item = {
      id: Date.now()+"-"+Math.random().toString(16).slice(2),
      time: new Date().toISOString(),
      version: "6.3.1",
      kind, category, title, advice,
      message: String(message||"未知錯誤"),
      source: source||"",
      line: Number(line||0),
      column: Number(column||0),
      stack: String(stack||"").slice(0,3000),
      url: location.href,
      userAgent: navigator.userAgent,
      online: navigator.onLine,
      extra
    };
    const logs=load(); logs.unshift(item); save(logs); emit();
    showBadge();
    popup(item);
    return item;
  }


  let popupTimer = 0;

  function ensurePopup(){
    let p=document.getElementById("globalErrorPopup");
    if(p) return p;
    p=document.createElement("div");
    p.id="globalErrorPopup";
    p.className="error-popup";
    p.innerHTML=`
      <div class="error-popup-head">
        <div>
          <div class="error-popup-title" id="globalErrorPopupTitle">網站發生錯誤</div>
          <div class="error-popup-msg" id="globalErrorPopupMsg"></div>
          <div class="error-popup-meta" id="globalErrorPopupMeta"></div>
        </div>
        <button class="error-popup-close" id="globalErrorPopupClose">✕</button>
      </div>
      <div class="error-popup-actions">
        <button class="primary" id="globalErrorOpenReport">查看錯誤</button>
        <button id="globalErrorCopy">複製錯誤報告</button>
      </div>`;
    document.body.appendChild(p);
    p.querySelector("#globalErrorPopupClose").onclick=()=>p.classList.remove("on");
    p.querySelector("#globalErrorOpenReport").onclick=()=>{
      p.classList.remove("on");
      if(typeof window.openPianoDiagnostics==="function") window.openPianoDiagnostics();
      else document.getElementById("errorBadge")?.click();
    };
    p.querySelector("#globalErrorCopy").onclick=async()=>{
      await copyReport();
      p.querySelector("#globalErrorCopy").textContent="已複製 ✓";
    };
    return p;
  }

  function popup(item){
    if(!document.body) return;
    const p=ensurePopup();
    p.querySelector("#globalErrorPopupTitle").textContent=`${item.title}（${item.category}）`;
    p.querySelector("#globalErrorPopupMsg").textContent=item.message;
    p.querySelector("#globalErrorPopupMeta").textContent=
      `V${item.version} · ${item.source ? item.source.split("/").pop() : "頁面"}${item.line ? ":"+item.line : ""}`;
    p.classList.add("on");
    clearTimeout(popupTimer);
    popupTimer=setTimeout(()=>p.classList.remove("on"),12000);
  }

  function showBadge(){
    const badge=document.getElementById("errorBadge");
    if(!badge) return;
    const count=load().length;
    badge.textContent=count ? `⚠ ${count}` : "✓";
    badge.classList.toggle("has-error", count>0);
  }

  function clear(){ save([]); emit(); showBadge(); }

  function copyReport(){
    const text = JSON.stringify({app:"PIANO LEARNING",version:"6.3.1",generated:new Date().toISOString(),logs:load()},null,2);
    if(navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();
    return Promise.resolve();
  }

  function subscribe(fn){ listeners.add(fn); fn(load()); return ()=>listeners.delete(fn); }

  window.addEventListener("error", e => {
    if(e.target && e.target !== window){
      const src=e.target.src||e.target.href||"";
      add({kind:"resource",message:`資源載入失敗：${src||e.target.tagName}`,source:src});
      return;
    }
    add({message:e.message,source:e.filename,line:e.lineno,column:e.colno,stack:e.error?.stack||"",kind:"window.error"});
  }, true);

  window.addEventListener("unhandledrejection", e => {
    const r=e.reason;
    add({message:r?.message||String(r),stack:r?.stack||"",kind:"promise"});
  });

  window.addEventListener("offline", ()=>add({message:"裝置已離線",kind:"network-state"}));

  document.addEventListener("DOMContentLoaded", showBadge);
  return {add,load,clear,copyReport,subscribe,showBadge};
})();
