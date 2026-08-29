// UTOP V5.1.3.24 模組庫專業設備圖｜依官方產品外觀重新繪製
const MODULE_IMAGE_MAP = Object.freeze({
  'PARKING-BARRIER-001': './assets/module-images/parking-barrier-001.svg',
  'PARKING-LIGHT-001': './assets/module-images/parking-light-001.svg',
  'LANE-LOOP-001': './assets/module-images/lane-loop-001.svg',
  'LANE-LOOP-DETECTOR-001': './assets/module-images/lane-loop-detector-001.svg',
  'LANE-INFRARED-001': './assets/module-images/lane-infrared-001.svg',
  'LANE-RADAR-001': './assets/module-images/lane-radar-001.svg',
  'LANE-UHF-001': './assets/module-images/lane-uhf-001.svg',
  'LANE-LPR-001': './assets/module-images/lane-lpr-001.svg',
  'LANE-CARD-001': './assets/module-images/lane-card-001.svg',
  'ACCESS-INTERCOM-001': './assets/module-images/access-intercom-001.svg',
  'WARNING-BEACON-001': './assets/module-images/warning-beacon-001.svg',
  'SAFETY-ESTOP-001': './assets/module-images/safety-estop-001.svg',
  'DISPLAY-LANE-ARROW-001': './assets/module-images/display-lane-arrow-001.svg',
  'DISPLAY-PARKING-COUNT-001': './assets/module-images/display-parking-count-001.svg',
  'LANE-BOLLARD-001': './assets/module-images/lane-bollard-001.svg',
  'BUILDING-HEIGHT-BAR-001': './assets/module-images/building-height-bar-001.svg',
  'ACCESS-CTRL-001': './assets/module-images/access-ctrl-001.svg',
  'CCTV-IPCAM-001': './assets/module-images/cctv-ipcam-001.svg',
  'NETWORK-POE-001': './assets/module-images/network-poe-001.svg',
  'CONTROL-RELAY-001': './assets/module-images/control-relay-001.svg',
  'POWER-SUPPLY-001': './assets/module-images/power-supply-001.svg',
  'CONTROL-DELAY-TIMER-001': './assets/module-images/control-delay-timer-001.svg',
  'CONTROL-OFF-DELAY-001': './assets/module-images/control-off-delay-001.svg',
  'CONTROL-ON-DELAY-001': './assets/module-images/control-on-delay-001.svg',
  'LK-103／SIGNAL-2WAY-001': './assets/module-images/lk-103-signal-2way-001.svg',
  'LK-103A／SIGNAL-3WAY-001': './assets/module-images/lk-103a-signal-3way-001.svg',
  'COUNTDOWN-TIMER-001': './assets/module-images/countdown-timer-001.svg',
  'LANE-LED-001': './assets/module-images/lane-led-001.svg',
  'ACCESS-SHUTTER-001': './assets/module-images/access-shutter-001.svg'
});

function normalizeModuleId(value=''){ return String(value).trim(); }
function applyModuleImages(){
  document.querySelectorAll('.module-card').forEach((card)=>{
    const idNode=card.querySelector('small');
    const moduleId=normalizeModuleId(idNode?.textContent);
    const src=MODULE_IMAGE_MAP[moduleId];
    const thumb=card.querySelector('.thumb');
    if(!thumb || !src) return;
    card.dataset.moduleId=moduleId;
    const image=document.createElement('img');
    image.className='module-product-image';
    image.alt=(card.querySelector('h3')?.textContent||moduleId)+' 模組圖片';
    image.loading='lazy';
    image.decoding='async';
    image.src=src;
    image.addEventListener('load',()=>thumb.classList.add('has-product-image'),{once:true});
    image.addEventListener('error',()=>image.remove(),{once:true});
    thumb.prepend(image);
  });
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',applyModuleImages,{once:true}); else applyModuleImages();
window.UTOP_MODULE_IMAGE_MAP=MODULE_IMAGE_MAP;
