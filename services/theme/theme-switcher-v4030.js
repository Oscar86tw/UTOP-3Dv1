
const STORAGE_KEY='utop-ui-theme';
const root=document.documentElement;
const button=document.getElementById('themeToggleBtn');
const meta=document.getElementById('browserThemeColor');

function normalize(value){
  return value==='light'?'light':'dark';
}

function readSaved(){
  try{return normalize(localStorage.getItem(STORAGE_KEY));}
  catch(_){return 'dark';}
}

function recordTheme(theme,source='user'){
  try{
    window.UTOP_DEBUG?.log?.(
      'ACTION',
      'UI',
      `介面主題切換為${theme==='light'?'白色':'深色'}`,
      {theme,source}
    );
  }catch(_){}
  window.dispatchEvent(new CustomEvent('utop-theme-change',{detail:{theme,source}}));
}

function applyTheme(theme,{save=true,source='user'}={}){
  const next=normalize(theme);
  root.dataset.theme=next;
  root.style.colorScheme=next;
  document.body?.classList.toggle('light-theme',next==='light');
  document.body?.classList.toggle('dark-theme',next==='dark');

  if(button){
    button.setAttribute('aria-pressed',String(next==='light'));
    button.title=next==='light'?'切換為深色介面':'切換為白色介面';
    const icon=button.querySelector('.theme-toggle-icon');
    const label=button.querySelector('.theme-toggle-label');
    if(icon)icon.textContent=next==='light'?'🌙':'☀';
    if(label)label.textContent=next==='light'?'深色介面':'白色介面';
  }

  if(meta)meta.setAttribute('content',next==='light'?'#ffffff':'#07111b');
  if(save){
    try{localStorage.setItem(STORAGE_KEY,next);}catch(_){}
  }
  recordTheme(next,source);
  return next;
}

function toggle(){
  applyTheme(root.dataset.theme==='light'?'dark':'light');
}

// Apply before user interaction. Dark remains the first-install default.
applyTheme(readSaved(),{save:false,source:'startup'});
button?.addEventListener('click',toggle);

window.UTOP_THEME=Object.freeze({
  get:()=>root.dataset.theme||'dark',
  set:theme=>applyTheme(theme),
  toggle
});
