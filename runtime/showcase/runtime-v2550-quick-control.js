import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { normalizeHeight, applyHeightToObject } from '../../services/scene-height/index.js';
import { LABEL_MODES, shouldShowLabel } from '../../services/label-service/index.js';
import { applyPartsVisibility } from '../../services/parts-visibility/index.js';
import { ROAD_MARKINGS } from '../../services/road-marking/index.js';


const $=id=>document.getElementById(id);
const defs={
 barrier:{name:'柵欄機',assetId:'PARKING-BARRIER-001',defaults:{armLength:4,rotation:0,armSide:'right',openTime:4,closeTime:4,autoCloseEnabled:false,autoCloseSeconds:5,state:'CLOSED',angle:0,showLabel:true},di:[['DI1','開啟','open'],['DI2','關閉','close'],['DI3','停止','stop'],['DI4','防砸','safety'],['DI5','復歸','reset']],do:[['DO1','全開到位','fullyOpen'],['DO2','全關到位','fullyClosed'],['DO3','運轉中','running'],['DO4','故障','fault']]},
 traffic:{name:'車道紅綠燈',assetId:'PARKING-LIGHT-001',defaults:{rotation:0,mode:'red',showLabel:true},di:[['DI1','紅燈','red'],['DI2','綠燈','green'],['DI3','全關','off']],do:[['DO1','紅燈亮','redOn'],['DO2','綠燈亮','greenOn']]},
 timer:{name:'倒數計時器',assetId:'COUNTDOWN-TIMER-001',defaults:{rotation:0,seconds:10,remaining:10,state:'IDLE',showLabel:true},di:[['DI1','開始','start'],['DI2','暫停／繼續','pause'],['DI3','重設','reset']],do:[['DO1','倒數完成','done'],['DO2','倒數中','running'],['DO3','暫停中','paused'],['DO4','待機','idle']]},
 relay:{name:'繼電器',assetId:'CONTROL-RELAY-001',defaults:{rotation:0,on:false,showLabel:true},di:[['DI1','吸合','on'],['DI2','釋放','off']],do:[['DO1','NO輸出','no'],['DO2','NC輸出','nc']]},
 loop:{name:'地感線圈',assetId:'LANE-LOOP-001',defaults:{rotation:0,width:1.8,length:3,detected:false,showLabel:true},di:[['DI1','車輛進入','vehicle'],['DI2','車輛離開','clear']],do:[['DO1','車輛偵測','detected']]},
 infrared:{name:'紅外線對射',assetId:'LANE-INFRARED-001',defaults:{rotation:0,distance:4,blocked:false,showBeam:true,showLabel:true},di:[['DI1','光束遮斷','blocked'],['DI2','光束恢復','clear']],do:[['DO1','遮斷輸出','blocked'],['DO2','正常輸出','normal']]},
 uhf:{name:'UHF／eTag讀頭',assetId:'LANE-UHF-001',defaults:{rotation:0,readDistance:8,detected:false,lastTag:'E-TAG-001',showLabel:true},di:[['DI1','模擬讀取標籤','read'],['DI2','清除讀取','clear']],do:[['DO1','讀取成功','detected'],['DO2','讀取脈衝','pulse']]},
 cardreader:{name:'車道卡機',assetId:'LANE-CARD-001',defaults:{rotation:0,state:'IDLE',showLabel:true},di:[['DI1','有效卡','valid'],['DI2','無效卡','invalid'],['DI3','清除狀態','clear']],do:[['DO1','允許通行','granted'],['DO2','拒絕通行','denied']]},
 ledpanel:{name:'紅綠燈倒數顯示器',assetId:'LANE-LED-001',defaults:{rotation:0,mode:'red',seconds:10,remaining:10,state:'IDLE',blinkLastFive:true,buzzerLastFive:true,showLabel:true},di:[['DI1','紅燈','red'],['DI2','綠燈','green'],['DI3','開始倒數','start'],['DI4','重設倒數','reset'],['DI5','全關','off']],do:[['DO1','紅燈亮','redOn'],['DO2','綠燈亮','greenOn'],['DO3','倒數完成','done'],['DO4','最後五秒','lastFive']]},
 lpr:{name:'車牌辨識攝影機',assetId:'LANE-LPR-001',defaults:{rotation:0,state:'IDLE',plate:'ABC-1234',confidence:98,showLabel:true},di:[['DI1','辨識有效車牌','valid'],['DI2','辨識無效車牌','invalid'],['DI3','清除結果','clear']],do:[['DO1','辨識成功','recognized'],['DO2','辨識失敗','denied']]}
};
const state={globalMovementLocked:false,globalLabelsVisible:true,items:[],wires:[],selectedId:null,next:1,pending:null,activeWires:new Set(),activeTab:'properties'};

const GRAPHICS_STORAGE_KEY='utop3d.graphics.v1';
const GRAPHICS_PRESETS=Object.freeze({
 battery:{
  preset:'battery',sceneAssets:false,lighting:false,highQualityModels:false,
  sceneLibrary:false,animations:false,shadowQuality:'off',
  textureQuality:'low',antialias:'off',pixelRatio:.75,vegetation:'off'
 },
 smooth:{
  preset:'smooth',sceneAssets:true,lighting:false,highQualityModels:false,
  sceneLibrary:true,animations:true,shadowQuality:'low',
  textureQuality:'medium',antialias:'fxaa',pixelRatio:1,vegetation:'low'
 },
 high:{
  preset:'high',sceneAssets:true,lighting:true,highQualityModels:true,
  sceneLibrary:true,animations:true,shadowQuality:'medium',
  textureQuality:'high',antialias:'msaa',pixelRatio:1.5,vegetation:'medium'
 },
 ultra:{
  preset:'ultra',sceneAssets:true,lighting:true,highQualityModels:true,
  sceneLibrary:true,animations:true,shadowQuality:'high',
  textureQuality:'4k',antialias:'msaa',pixelRatio:2,vegetation:'high'
 },
 custom:{
  preset:'custom',sceneAssets:true,lighting:true,highQualityModels:true,
  sceneLibrary:true,animations:true,shadowQuality:'medium',
  textureQuality:'high',antialias:'msaa',pixelRatio:1.5,vegetation:'medium'
 }
});

function detectRecommendedGraphicsPreset(){
 const mobile=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
 const memory=Number(navigator.deviceMemory||0);
 const cores=Number(navigator.hardwareConcurrency||0);
 if(mobile)return 'smooth';
 if(memory&&memory<=4)return 'smooth';
 if(cores&&cores<=4)return 'smooth';
 return 'high';
}

function loadGraphicsSettings(){
 try{
  const saved=JSON.parse(localStorage.getItem(GRAPHICS_STORAGE_KEY)||'null');
  if(saved&&typeof saved==='object'){
   return {...GRAPHICS_PRESETS.high,...saved,preset:saved.preset||'custom'};
  }
 }catch(error){
  console.warn('[UTOP-3D] 畫質設定讀取失敗',error);
 }
 const preset=detectRecommendedGraphicsPreset();
 return {...GRAPHICS_PRESETS[preset]};
}

let graphicsSettings=loadGraphicsSettings();
let graphicsSettingsDraft={...graphicsSettings};

function saveGraphicsSettings(){
 try{
  localStorage.setItem(GRAPHICS_STORAGE_KEY,JSON.stringify(graphicsSettings));
 }catch(error){
  console.warn('[UTOP-3D] 畫質設定儲存失敗',error);
 }
}

function getShadowMapSize(quality){
 return quality==='high'?2048:quality==='medium'?1024:quality==='low'?512:256;
}

function applyGraphicsSettings(settings,{save=true}={}){
 graphicsSettings={...GRAPHICS_PRESETS.custom,...settings};
 const root=document.documentElement;

 root.classList.toggle('gfx-scene-assets-off',!graphicsSettings.sceneAssets);
 root.classList.toggle('gfx-scene-library-off',!graphicsSettings.sceneLibrary);
 root.classList.toggle('gfx-animations-off',!graphicsSettings.animations);
 root.classList.toggle('gfx-models-low',!graphicsSettings.highQualityModels);
 root.dataset.graphicsPreset=graphicsSettings.preset||'custom';
 root.dataset.textureQuality=graphicsSettings.textureQuality;
 root.dataset.vegetation=graphicsSettings.vegetation;

 const ratio=Math.max(.5,Math.min(2,Number(graphicsSettings.pixelRatio)||1));
 renderer.setPixelRatio(ratio);
 renderer.setSize(
  Math.max(1,renderer.domElement.clientWidth),
  Math.max(1,renderer.domElement.clientHeight),
  false
 );

 const lightingOn=graphicsSettings.lighting!==false;
 const shadowOn=lightingOn&&graphicsSettings.shadowQuality!=='off';
 renderer.shadowMap.enabled=shadowOn;
 renderer.toneMapping=lightingOn?THREE.ACESFilmicToneMapping:THREE.NoToneMapping;
 renderer.toneMappingExposure=lightingOn?1.08:1;

 scene.fog=lightingOn?new THREE.FogExp2(0xb7c1c7,.018):null;

 if(typeof sun!=='undefined'){
  sun.visible=lightingOn;
  sun.castShadow=shadowOn;
  const mapSize=getShadowMapSize(graphicsSettings.shadowQuality);
  if(sun.shadow?.mapSize){
   sun.shadow.mapSize.set(mapSize,mapSize);
   if(sun.shadow.map){
    sun.shadow.map.dispose();
    sun.shadow.map=null;
   }
  }
 }
 if(typeof fillLight!=='undefined')fillLight.visible=lightingOn;
 if(typeof environmentGroup!=='undefined')environmentGroup.visible=graphicsSettings.sceneAssets!==false;
 if(typeof sceneEnvironmentRoot!=='undefined')sceneEnvironmentRoot.visible=graphicsSettings.sceneAssets!==false;

 group.traverse(object=>{
  if(object.isMesh){
   object.castShadow=shadowOn&&graphicsSettings.highQualityModels!==false;
   object.receiveShadow=shadowOn;
   if(object.material&&'flatShading' in object.material){
    object.material.flatShading=graphicsSettings.highQualityModels===false;
    object.material.needsUpdate=true;
   }
  }
 });

 if(graphicsSettings.animations===false){
  state.items.forEach(item=>{
   if(item.type==='barrier'&&item.runtime?.target!=null){
    item.params.angle=item.runtime.target;
    item.params.state=item.params.angle>=89?'OPEN':'CLOSED';
    item.runtime.target=null;
    rebuild(item);
   }
  });
  renderPlan();
 }

 if(save)saveGraphicsSettings();
 updateGraphicsSettingsUI();
 renderer.render(scene,camera);
}

function populateGraphicsSettingsUI(settings=graphicsSettings){
 const set=(id,value)=>{
  const element=$(id);
  if(!element)return;
  if(element.type==='checkbox')element.checked=Boolean(value);
  else element.value=String(value);
 };
 set('gfxSceneAssets',settings.sceneAssets);
 set('gfxLighting',settings.lighting);
 set('gfxHighQualityModels',settings.highQualityModels);
 set('gfxSceneLibrary',settings.sceneLibrary);
 set('gfxAnimations',settings.animations);
 set('gfxShadowQuality',settings.shadowQuality);
 set('gfxTextureQuality',settings.textureQuality);
 set('gfxAntialias',settings.antialias);
 set('gfxPixelRatio',settings.pixelRatio);
 set('gfxVegetation',settings.vegetation);

 document.querySelectorAll('[data-quality-preset]').forEach(button=>{
  button.classList.toggle('active',button.dataset.qualityPreset===settings.preset);
 });

 const hint=$('graphicsDeviceHint');
 if(hint){
  const recommended=detectRecommendedGraphicsPreset();
  hint.textContent=`系統建議：${recommended==='smooth'?'流暢':'高畫質'}模式。實際效果可依裝置再調整。`;
 }
}

function readGraphicsSettingsFromUI(){
 const checked=id=>Boolean($(id)?.checked);
 const value=id=>$(id)?.value;
 return {
  preset:graphicsSettingsDraft.preset||'custom',
  sceneAssets:checked('gfxSceneAssets'),
  lighting:checked('gfxLighting'),
  highQualityModels:checked('gfxHighQualityModels'),
  sceneLibrary:checked('gfxSceneLibrary'),
  animations:checked('gfxAnimations'),
  shadowQuality:value('gfxShadowQuality')||'medium',
  textureQuality:value('gfxTextureQuality')||'high',
  antialias:value('gfxAntialias')||'msaa',
  pixelRatio:Number(value('gfxPixelRatio')||1.5),
  vegetation:value('gfxVegetation')||'medium'
 };
}

function markGraphicsCustom(){
 graphicsSettingsDraft.preset='custom';
 document.querySelectorAll('[data-quality-preset]').forEach(button=>{
  button.classList.toggle('active',button.dataset.qualityPreset==='custom');
 });
}

function updateGraphicsSettingsUI(){
 if(!$('graphicsSettingsDialog'))return;
 graphicsSettingsDraft={...graphicsSettings};
 populateGraphicsSettingsUI(graphicsSettingsDraft);
}

const sceneSettings={
  labelMode:localStorage.getItem('utopLabelMode')||LABEL_MODES.ALL,
  roadMarkings:{centerLine:{...ROAD_MARKINGS.centerLine}},
  selectedWireId:null
};

const get=id=>state.items.find(i=>i.id===id);const clone=o=>JSON.parse(JSON.stringify(o));

const PLAN_CENTER_X=380;
const PLAN_CENTER_Y=325;
const PLAN_X_PPM=50;
const PLAN_Z_PPM=34;
const SCENE_BOUNDS=Object.freeze({
 minX:-7.4,
 maxX:7.4,
 minZ:-8.2,
 maxZ:8.2
});

function clampNumber(value,min,max){
 return Math.max(min,Math.min(max,Number(value)||0));
}

function clampDevicePosition(item,x=item.x,z=item.z){
 const nextX=clampNumber(x,SCENE_BOUNDS.minX,SCENE_BOUNDS.maxX);
 const nextZ=clampNumber(z,SCENE_BOUNDS.minZ,SCENE_BOUNDS.maxZ);
 item.x=nextX;
 item.z=nextZ;
 if(item.mesh)item.mesh.position.set(nextX,item.y||0,nextZ);
 return item;
}

function isDeviceMovementLocked(item){
 return state.globalMovementLocked===true||item?.params?.positionLocked===true;
}

function updateGlobalLockButton(){
 const button=$('globalLockToggle');
 if(!button)return;
 const locked=state.globalMovementLocked===true;
 button.classList.toggle('active',locked);
 button.classList.toggle('inactive',!locked);
 button.setAttribute('aria-pressed',locked?'true':'false');
 button.textContent=locked?'🔒 全固定：開啟':'🔓 全固定：關閉';
}

function setGlobalMovementLocked(locked){
 state.globalMovementLocked=Boolean(locked);
 updateGlobalLockButton();
 renderPlan();
 if(state.selectedId)renderInspector();
 markDirty();
}




function safeSetPointerCapture(element,pointerId){
  if(!element||typeof element.setPointerCapture!=='function')return false;
  try{
    if(typeof element.hasPointerCapture==='function'&&element.hasPointerCapture(pointerId)){
      return true;
    }
    element.setPointerCapture(pointerId);
    return true;
  }catch(error){
    console.warn('[UTOP-3D] setPointerCapture skipped',error);
    return false;
  }
}

function safeReleasePointerCapture(element,pointerId){
  if(!element||typeof element.releasePointerCapture!=='function')return;
  try{
    if(typeof element.hasPointerCapture!=='function'||element.hasPointerCapture(pointerId)){
      element.releasePointerCapture(pointerId);
    }
  }catch(error){
    console.warn('[UTOP-3D] releasePointerCapture skipped',error);
  }
}

function normalizeLegacyDeviceName(type,name){
  if(type!=='relay')return name;
  const value=String(name||'').trim();
  if(value==='測試繼電器')return '繼電器';
  const match=value.match(/^測試繼電器\s*(\d+)$/);
  if(match)return `繼電器${match[1]}`;
  return value||'繼電器';
}


let __utopResizeFrame=0;
function scheduleUtopResize(callback){
 cancelAnimationFrame(__utopResizeFrame);
 __utopResizeFrame=requestAnimationFrame(callback);
}

const scene=new THREE.Scene();
scene.background=new THREE.Color(0xb7c1c7);
scene.fog=new THREE.FogExp2(0xb7c1c7,.018);

const camera=new THREE.PerspectiveCamera(46,1,.1,120);
camera.position.set(10.8,10.2,13.6);

const renderer=new THREE.WebGLRenderer({
 canvas:$('sceneCanvas'),
 antialias:true,
 powerPreference:'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.08;

const orbit=new OrbitControls(camera,renderer.domElement);
orbit.enableDamping=true;
orbit.dampingFactor=.075;
orbit.target.set(0,.8,0);
orbit.minDistance=4;
orbit.maxDistance=32;
orbit.maxPolarAngle=Math.PI*.49;

function makeNoiseTexture(base='#555',grain=28,size=256){
 const canvas=document.createElement('canvas');
 canvas.width=canvas.height=size;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle=base;
 ctx.fillRect(0,0,size,size);
 const image=ctx.getImageData(0,0,size,size);
 for(let i=0;i<image.data.length;i+=4){
  const n=(Math.random()-.5)*grain;
  image.data[i]=Math.max(0,Math.min(255,image.data[i]+n));
  image.data[i+1]=Math.max(0,Math.min(255,image.data[i+1]+n));
  image.data[i+2]=Math.max(0,Math.min(255,image.data[i+2]+n));
 }
 ctx.putImageData(image,0,0);
 const texture=new THREE.CanvasTexture(canvas);
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
 texture.colorSpace=THREE.SRGBColorSpace;
 return texture;
}

function makePaverTexture(){
 const canvas=document.createElement('canvas');
 canvas.width=canvas.height=256;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle='#aaa7a0';
 ctx.fillRect(0,0,256,256);
 ctx.strokeStyle='rgba(65,60,55,.45)';
 ctx.lineWidth=2;
 const w=48,h=30;
 for(let y=0;y<280;y+=h){
  const offset=(Math.floor(y/h)%2)*w/2;
  for(let x=-w;x<280;x+=w)ctx.strokeRect(x+offset,y,w,h);
 }
 const texture=new THREE.CanvasTexture(canvas);
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
 texture.repeat.set(3,8);
 texture.colorSpace=THREE.SRGBColorSpace;
 return texture;
}

scene.add(new THREE.HemisphereLight(0xeaf6ff,0x56634d,1.25));
const sun=new THREE.DirectionalLight(0xffffff,2.15);
sun.position.set(-7,14,9);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-14;
sun.shadow.camera.right=14;
sun.shadow.camera.top=16;
sun.shadow.camera.bottom=-16;
sun.shadow.camera.near=.5;
sun.shadow.camera.far=45;
sun.shadow.bias=-.00025;
scene.add(sun);

const fillLight=new THREE.DirectionalLight(0xcce7ff,.55);
fillLight.position.set(10,7,-8);
scene.add(fillLight);

const groundTexture=makeNoiseTexture('#626c72',24,256);
groundTexture.repeat.set(6,6);
const ground=new THREE.Mesh(
 new THREE.PlaneGeometry(20,20),
 new THREE.MeshStandardMaterial({map:groundTexture,color:0x7a858a,roughness:1})
);
ground.rotation.x=-Math.PI/2;
ground.receiveShadow=true;
scene.add(ground);

const asphaltTexture=makeNoiseTexture('#454a4d',34,256);
asphaltTexture.repeat.set(5,18);
const road=new THREE.Mesh(
 new THREE.PlaneGeometry(8,18),
 new THREE.MeshStandardMaterial({map:asphaltTexture,color:0x585d60,roughness:.96})
);
road.rotation.x=-Math.PI/2;
road.position.y=.01;
road.receiveShadow=true;
scene.add(road);

const paverTexture=makePaverTexture();
[-5.55,5.55].forEach(x=>{
 const sidewalk=new THREE.Mesh(
  new THREE.PlaneGeometry(2.7,18),
  new THREE.MeshStandardMaterial({map:paverTexture,color:0xc2beb5,roughness:.92})
 );
 sidewalk.rotation.x=-Math.PI/2;
 sidewalk.position.set(x,.018,0);
 sidewalk.receiveShadow=true;
 scene.add(sidewalk);

 const curb=new THREE.Mesh(
  new THREE.BoxGeometry(.22,.18,18),
  new THREE.MeshStandardMaterial({color:0xbfc4c6,roughness:.85})
 );
 curb.position.set(x+(x<0?1.46:-1.46),.09,0);
 curb.castShadow=true;
 curb.receiveShadow=true;
 scene.add(curb);
});

const grassTexture=makeNoiseTexture('#52713e',38,256);
grassTexture.repeat.set(2,18);
[-7.45,7.45].forEach(x=>{
 const grass=new THREE.Mesh(
  new THREE.PlaneGeometry(1.05,18),
  new THREE.MeshStandardMaterial({map:grassTexture,color:0x678b50,roughness:1})
 );
 grass.rotation.x=-Math.PI/2;
 grass.position.set(x,.02,0);
 grass.receiveShadow=true;
 scene.add(grass);
});


const sceneEnvironmentRoot=new THREE.Group();
sceneEnvironmentRoot.name='sceneEnvironmentRoot';
scene.add(sceneEnvironmentRoot);

const SCENE_DEFINITIONS=Object.freeze({
 'basic-lane':{
  name:'基礎車道',
  background:0xb7c1c7,
  fogColor:0xb7c1c7,
  roadColor:0x585d60,
  groundColor:0x7a858a
 },
 'community-entry':{
  name:'社區入口',
  background:0xc9d8dd,
  fogColor:0xc9d8dd,
  roadColor:0x454b4e,
  groundColor:0x87948d
 },
 'basement-entry':{
  name:'地下室入口',
  background:0x5e666b,
  fogColor:0x5e666b,
  roadColor:0x353a3d,
  groundColor:0x656b6e
 },
 'showcase-hualongchao':{
  name:'樺龍潮+',
  background:0xaed5ec,
  fogColor:0xb8d6e6,
  roadColor:0x343a3d,
  groundColor:0x788177
 }
});

let currentSceneId='basic-lane';
let selectedSceneId='basic-lane';

function clearSceneEnvironment(){
 while(sceneEnvironmentRoot.children.length){
  const object=sceneEnvironmentRoot.children.pop();
  object.traverse?.(child=>{
   child.geometry?.dispose?.();
   if(child.material){
    const materials=Array.isArray(child.material)?child.material:[child.material];
    materials.forEach(material=>material.dispose?.());
   }
  });
 }
}

function createEnvironmentBox(size,position,color,options={}){
 const mesh=new THREE.Mesh(
  new THREE.BoxGeometry(size.x,size.y,size.z),
  new THREE.MeshStandardMaterial({
   color,
   roughness:options.roughness??.8,
   metalness:options.metalness??0
  })
 );
 mesh.position.set(position.x,position.y,position.z);
 mesh.castShadow=options.castShadow!==false;
 mesh.receiveShadow=true;
 sceneEnvironmentRoot.add(mesh);
 return mesh;
}

function buildBasicLaneScene(){
 // Existing road remains visible; add only light border accents.
 createEnvironmentBox(
  {x:.22,y:.18,z:17},
  {x:-4.12,y:.09,z:0},
  0xbec4c6
 );
 createEnvironmentBox(
  {x:.22,y:.18,z:17},
  {x:4.12,y:.09,z:0},
  0xbec4c6
 );
}

function buildCommunityEntryScene(){
 // Guard house
 createEnvironmentBox(
  {x:2.4,y:2.4,z:2.6},
  {x:5.55,y:1.2,z:-3.8},
  0xe1d9c8,
  {roughness:.72}
 );
 createEnvironmentBox(
  {x:2.7,y:.16,z:2.9},
  {x:5.55,y:2.48,z:-3.8},
  0x5d6670,
  {roughness:.55,metalness:.08}
 );

 // Window
 const windowMaterial=new THREE.MeshStandardMaterial({
  color:0x7dc8e7,
  roughness:.18,
  metalness:.12,
  transparent:true,
  opacity:.72
 });
 const windowMesh=new THREE.Mesh(
  new THREE.BoxGeometry(1.5,.85,.06),
  windowMaterial
 );
 windowMesh.position.set(5.55,1.45,-2.47);
 sceneEnvironmentRoot.add(windowMesh);

 // Safety island
 createEnvironmentBox(
  {x:1.7,y:.22,z:5.2},
  {x:2.6,y:.11,z:1.2},
  0x72797b
 );

 // Planters / greenery
 [-6.6,6.6].forEach(x=>{
  for(let z=-6;z<=6;z+=2.4){
   const shrub=new THREE.Mesh(
    new THREE.SphereGeometry(.38,14,10),
    new THREE.MeshStandardMaterial({color:0x4f7e3d,roughness:1})
   );
   shrub.scale.set(1.15,.8,1);
   shrub.position.set(x,.36,z);
   shrub.castShadow=true;
   shrub.receiveShadow=true;
   sceneEnvironmentRoot.add(shrub);
  }
 });
}


function createEnvironmentMaterial(color,options={}){
 return new THREE.MeshStandardMaterial({
  color,
  roughness:options.roughness??.82,
  metalness:options.metalness??0,
  transparent:options.transparent??false,
  opacity:options.opacity??1,
  side:options.side??THREE.FrontSide
 });
}

function addEnvironmentMesh(geometry,material,position,rotation={}){
 const mesh=new THREE.Mesh(geometry,material);
 mesh.position.set(position.x||0,position.y||0,position.z||0);
 mesh.rotation.set(rotation.x||0,rotation.y||0,rotation.z||0);
 mesh.castShadow=true;
 mesh.receiveShadow=true;
 sceneEnvironmentRoot.add(mesh);
 return mesh;
}

function addBuildingTower(x,z,width,depth,height,floors){
 const shell=addEnvironmentMesh(
  new THREE.BoxGeometry(width,height,depth),
  createEnvironmentMaterial(0xcfd3d5,{roughness:.78}),
  {x,y:height/2,z}
 );

 const darkFace=createEnvironmentMaterial(0x555d62,{roughness:.72});
 const balcony=createEnvironmentMaterial(0xe7e9e8,{roughness:.68});

 for(let floor=1;floor<floors;floor++){
  addEnvironmentMesh(
   new THREE.BoxGeometry(width+.25,.13,depth+.18),
   balcony,
   {x,y:(height/floors)*floor,z}
  ).castShadow=false;
 }

 for(const side of [-1,1]){
  addEnvironmentMesh(
   new THREE.BoxGeometry(.34,height+.35,depth+.35),
   balcony,
   {x:x+side*(width/2-.42),y:height/2,z}
  );
 }

 addEnvironmentMesh(
  new THREE.BoxGeometry(width*.28,height*.86,depth+.12),
  darkFace,
  {x,y:height*.48,z:z+.03}
 );

 addEnvironmentMesh(
  new THREE.BoxGeometry(width+.8,.28,depth+.8),
  balcony,
  {x,y:height+.14,z}
 );

 for(let gx=-width/2;gx<=width/2;gx+=.65){
  addEnvironmentMesh(
   new THREE.BoxGeometry(.12,1.2,.14),
   balcony,
   {x:x+gx,y:height+.75,z:z-depth/2+.15}
  );
 }
 return shell;
}

function addShrubRow(xStart,xEnd,z,step=.75){
 for(let x=xStart;x<=xEnd;x+=step){
  const shrub=addEnvironmentMesh(
   new THREE.SphereGeometry(.3,10,8),
   createEnvironmentMaterial(0x4f783d,{roughness:1}),
   {x,y:.28,z}
  );
  shrub.scale.set(1.05,.75,.9);
 }
}

function addParkingStall(x,z,width=2.25,length=4.6,rotation=0){
 const material=new THREE.MeshBasicMaterial({color:0xf0f2ef});
 const group=new THREE.Group();

 const left=new THREE.Mesh(new THREE.BoxGeometry(.035,.018,length),material);
 left.position.set(-width/2,.025,0);
 group.add(left);

 const right=new THREE.Mesh(new THREE.BoxGeometry(.035,.018,length),material);
 right.position.set(width/2,.025,0);
 group.add(right);

 const end=new THREE.Mesh(new THREE.BoxGeometry(width,.018,.035),material);
 end.position.set(0,.025,-length/2);
 group.add(end);

 group.position.set(x,-1.52,z);
 group.rotation.y=rotation;
 sceneEnvironmentRoot.add(group);
}

function addCeilingPipe(x,y,z,length,color=0xd9d6c9){
 const pipe=addEnvironmentMesh(
  new THREE.CylinderGeometry(.055,.055,length,10),
  createEnvironmentMaterial(color,{roughness:.55,metalness:.08}),
  {x,y,z},
  {z:Math.PI/2}
 );
 return pipe;
}

function buildHuaLongChaoShowcase(){
 // 社區外道路與人行道
 addEnvironmentMesh(
  new THREE.BoxGeometry(18,.08,3.2),
  createEnvironmentMaterial(0x3d4346,{roughness:.96}),
  {x:0,y:.04,z:8.1}
 );
 addEnvironmentMesh(
  new THREE.BoxGeometry(18,.12,1.25),
  createEnvironmentMaterial(0xb7b4aa,{roughness:.9}),
  {x:0,y:.07,z:6.1}
 );

 // 社區雙棟大樓
 addBuildingTower(-4.7,-10.8,5.0,3.6,13.5,14);
 addBuildingTower(3.0,-11.4,5.4,3.8,14.8,15);
 createEnvironmentBox(
  {x:4.2,y:4.8,z:3.2},
  {x:-.4,y:2.4,z:-9.6},
  0xc5c9cb,
  {roughness:.75}
 );

 // 圍牆與庭園
 createEnvironmentBox(
  {x:5.4,y:1.1,z:.32},
  {x:-5.8,y:.55,z:-6.8},
  0xd9dcdb
 );
 createEnvironmentBox(
  {x:4.8,y:1.1,z:.32},
  {x:5.9,y:.55,z:-6.8},
  0xd9dcdb
 );
 addShrubRow(-7.8,-3.4,-6.45,.7);
 addShrubRow(3.5,7.8,-6.45,.7);

 // 下坡車道
 const rampLength=11.2;
 const slope=.105;
 const ramp=addEnvironmentMesh(
  new THREE.BoxGeometry(6.4,.18,rampLength),
  createEnvironmentMaterial(0x7b7c79,{roughness:.95}),
  {x:1.2,y:-.48,z:-.4},
  {x:-slope}
 );
 ramp.name='huaLongChaoRamp';

 for(let z=-4.8;z<=4.4;z+=.38){
  addEnvironmentMesh(
   new THREE.BoxGeometry(5.9,.025,.045),
   createEnvironmentMaterial(0xa8a69f,{roughness:.92}),
   {x:1.2,y:-.25+(z+.4)*.0105,z},
   {x:-slope}
  );
 }

 // 坡道磁磚牆
 const wallMat=createEnvironmentMaterial(0xb9bab7,{roughness:.86});
 addEnvironmentMesh(
  new THREE.BoxGeometry(.32,3.1,rampLength+.4),
  wallMat,
  {x:-2.15,y:1.06,z:-.4},
  {x:-slope}
 );
 addEnvironmentMesh(
  new THREE.BoxGeometry(.32,3.1,rampLength+.4),
  wallMat,
  {x:4.55,y:1.06,z:-.4},
  {x:-slope}
 );

 for(let y=.28;y<2.65;y+=.34){
  for(const x of [-1.96,4.36]){
   addEnvironmentMesh(
    new THREE.BoxGeometry(.025,.025,rampLength),
    createEnvironmentMaterial(0x8c8d89,{roughness:1}),
    {x,y,z:-.4},
    {x:-slope}
   );
  }
 }

 createEnvironmentBox(
  {x:.5,y:1.15,z:11.5},
  {x:-2.32,y:3.18,z:-.4},
  0x747873,
  {roughness:1}
 );
 createEnvironmentBox(
  {x:.5,y:1.15,z:11.5},
  {x:4.72,y:3.18,z:-.4},
  0x747873,
  {roughness:1}
 );

 // 地下入口與凸面鏡
 createEnvironmentBox(
  {x:7.0,y:.55,z:.65},
  {x:1.2,y:2.42,z:-5.55},
  0xb4b6b4
 );
 const sign=addEnvironmentMesh(
  new THREE.BoxGeometry(4.4,.62,.12),
  createEnvironmentMaterial(0x3e4b52,{roughness:.75}),
  {x:1.2,y:2.48,z:-5.18}
 );
 sign.name='parkingSign';

 addEnvironmentMesh(
  new THREE.CylinderGeometry(.35,.35,.08,24),
  createEnvironmentMaterial(0xe15d38,{roughness:.35,metalness:.12}),
  {x:1.2,y:1.45,z:-5.05},
  {x:Math.PI/2}
 );
 addEnvironmentMesh(
  new THREE.CylinderGeometry(.25,.25,.085,24),
  createEnvironmentMaterial(0x8fc6d8,{roughness:.2,metalness:.35}),
  {x:1.2,y:1.45,z:-5.0},
  {x:Math.PI/2}
 );

 // 左轉平台及鐵捲門
 addEnvironmentMesh(
  new THREE.BoxGeometry(9.5,.18,5.8),
  createEnvironmentMaterial(0x3a423f,{roughness:.9}),
  {x:-4.0,y:-1.55,z:-7.4}
 );

 addEnvironmentMesh(
  new THREE.BoxGeometry(.16,2.5,4.2),
  createEnvironmentMaterial(0x9c9f9e,{roughness:.65,metalness:.35}),
  {x:-8.3,y:-.3,z:-7.1}
 ).name='huaLongChaoRollingDoor';

 for(let y=-1.42;y<.82;y+=.17){
  addEnvironmentMesh(
   new THREE.BoxGeometry(.025,.025,4.1),
   createEnvironmentMaterial(0x626766,{roughness:.7,metalness:.25}),
   {x:-8.2,y,z:-7.1}
  );
 }

 // B1
 addEnvironmentMesh(
  new THREE.BoxGeometry(11.5,.12,9.0),
  createEnvironmentMaterial(0x3d8654,{roughness:.58}),
  {x:-4.0,y:-1.62,z:-12.2}
 );

 for(let x=-8.1;x<=-.2;x+=2.65){
  addParkingStall(x,-13.8,2.25,4.4,0);
 }

 addEnvironmentMesh(
  new THREE.BoxGeometry(.05,.025,7.4),
  new THREE.MeshBasicMaterial({color:0xf2f2ed}),
  {x:1.05,y:-1.53,z:-11.6}
 );

 for(const x of [-7.0,-2.2]){
  for(const z of [-10.0,-14.7]){
   createEnvironmentBox(
    {x:.72,y:3.05,z:.72},
    {x,y:-.03,z},
    0xd9d4c9,
    {roughness:.8}
   );
   createEnvironmentBox(
    {x:.75,y:.14,z:.75},
    {x,y:.42,z},
    0x6fa65a,
    {roughness:.8}
   );
  }
 }

 addEnvironmentMesh(
  new THREE.BoxGeometry(11.8,.25,9.4),
  createEnvironmentMaterial(0xddd8ca,{roughness:.86}),
  {x:-4.0,y:1.25,z:-12.2}
 );

 for(let z=-15.5;z<=-9;z+=2.2){
  createEnvironmentBox(
   {x:11.6,y:.32,z:.35},
   {x:-4.0,y:.9,z},
   0xc8c2b5,
   {roughness:.82}
  );
 }

 for(const z of [-10.2,-12.2,-14.2]){
  addCeilingPipe(-4.0,1.02,z,10.4,0xe8e3d8);
 }

 for(const x of [-7.3,-4.0,-.8]){
  const lamp=addEnvironmentMesh(
   new THREE.BoxGeometry(1.35,.08,.18),
   createEnvironmentMaterial(0xfff0c9,{roughness:.35}),
   {x,y:.78,z:-12.2}
  );
  lamp.material.emissive=new THREE.Color(0xffdd9d);
  lamp.material.emissiveIntensity=.75;

  const point=new THREE.PointLight(0xffe7b5,.55,6);
  point.position.set(x,.65,-12.2);
  sceneEnvironmentRoot.add(point);
 }

 camera.position.set(12.5,10.8,15.5);
 orbit.target.set(0,-.2,-4.0);
 orbit.update();
}

function buildBasementEntryScene(){
 // Side walls
 createEnvironmentBox(
  {x:.35,y:3.8,z:17},
  {x:-4.3,y:1.9,z:0},
  0xa8abad
 );
 createEnvironmentBox(
  {x:.35,y:3.8,z:17},
  {x:4.3,y:1.9,z:0},
  0xa8abad
 );

 // Ceiling entrance beam
 createEnvironmentBox(
  {x:8.9,y:.45,z:1},
  {x:0,y:3.55,z:-6.8},
  0x777d80
 );

 // Down-ramp visual plane
 const ramp=new THREE.Mesh(
  new THREE.PlaneGeometry(7.8,9),
  new THREE.MeshStandardMaterial({
   color:0x303538,
   roughness:.96
  })
 );
 ramp.rotation.x=-Math.PI/2+.075;
 ramp.position.set(0,.06,2.7);
 ramp.receiveShadow=true;
 sceneEnvironmentRoot.add(ramp);

 // Ceiling lamps
 for(let z=-5;z<=5;z+=2.5){
  const lamp=new THREE.PointLight(0xffe5b5,.75,7);
  lamp.position.set(0,3.05,z);
  sceneEnvironmentRoot.add(lamp);

  const fixture=new THREE.Mesh(
   new THREE.BoxGeometry(1.2,.08,.25),
   new THREE.MeshStandardMaterial({
    color:0xf4e4bd,
    emissive:0xffd68c,
    emissiveIntensity:.65
   })
  );
  fixture.position.set(0,3.12,z);
  sceneEnvironmentRoot.add(fixture);
 }
}

function applyScene(sceneId,{save=true}={}){
 const definition=SCENE_DEFINITIONS[sceneId]||SCENE_DEFINITIONS['basic-lane'];
 currentSceneId=sceneId in SCENE_DEFINITIONS?sceneId:'basic-lane';
 selectedSceneId=currentSceneId;

 clearSceneEnvironment();

 scene.background=new THREE.Color(definition.background);
 if(graphicsSettings.lighting!==false){
  scene.fog=new THREE.FogExp2(definition.fogColor,.018);
 }

 if(typeof road!=='undefined'&&road.material){
  road.material.color.setHex(definition.roadColor);
 }
 if(typeof ground!=='undefined'&&ground.material){
  ground.material.color.setHex(definition.groundColor);
 }

 if(currentSceneId==='community-entry')buildCommunityEntryScene();
 else if(currentSceneId==='basement-entry')buildBasementEntryScene();
 else if(currentSceneId==='showcase-hualongchao')buildHuaLongChaoShowcase();
 else buildBasicLaneScene();

 sceneEnvironmentRoot.visible=graphicsSettings.sceneAssets!==false;

 document.querySelectorAll('[data-scene-id]').forEach(card=>{
  card.classList.toggle('selected',card.dataset.sceneId===currentSceneId);
 });
 if($('currentSceneLabel')){
  $('currentSceneLabel').textContent=`目前場景：${definition.name}`;
 }
 renderPlanSceneBackground();
 if(save)markDirty();
 renderer.render(scene,camera);
}

const group=new THREE.Group();
scene.add(group);

function createCenterLine3D(){
  const lineGroup=new THREE.Group();
  lineGroup.name='utopRoadCenterLine';
  const settings=sceneSettings.roadMarkings.centerLine;

  if(!settings.visible){
    scene.add(lineGroup);
    return lineGroup;
  }

  const segmentLength=settings.dashLength+settings.dashGap;
  const count=Math.floor(settings.roadLength/segmentLength);
  const start=-settings.roadLength/2;

  for(let index=0;index<count;index++){
    const dash=new THREE.Mesh(
      new THREE.PlaneGeometry(settings.width,settings.dashLength),
      new THREE.MeshStandardMaterial({
        color:settings.color,
        roughness:.82,
        metalness:0,
        side:THREE.DoubleSide
      })
    );

    dash.rotation.x=-Math.PI/2;
    dash.position.set(
      0,
      .025,
      start+settings.dashLength/2+index*segmentLength
    );
    lineGroup.add(dash);
  }

  scene.add(lineGroup);
  return lineGroup;
}

const roadCenterLine3D=createCenterLine3D();
function createRoadArrow(z,direction=1){
 const arrow=new THREE.Group();
 const material=new THREE.MeshStandardMaterial({color:0xf3f1df,roughness:.75});
 const stem=new THREE.Mesh(new THREE.PlaneGeometry(.18,1.15),material);
 stem.rotation.x=-Math.PI/2;
 stem.position.z=-.18*direction;
 arrow.add(stem);
 const head=new THREE.Mesh(new THREE.ConeGeometry(.38,.8,3),material);
 head.rotation.x=-Math.PI/2;
 head.rotation.z=direction<0?Math.PI:0;
 head.position.z=.62*direction;
 arrow.add(head);
 arrow.position.set(-1.65,.028,z);
 scene.add(arrow);
}
createRoadArrow(-6.2,1);
createRoadArrow(6.2,-1);



const mat=(c,options={})=>new THREE.MeshStandardMaterial({
 color:c,
 roughness:options.roughness??.58,
 metalness:options.metalness??.12,
 transparent:options.transparent??false,
 opacity:options.opacity??1,
 envMapIntensity:options.envMapIntensity??.42
});
function applyMeshQuality(root){
 if(!root)return;
 root.traverse(object=>{
  if(object.isMesh){
   object.castShadow=true;
   object.receiveShadow=true;
  }
 });
}


function makeTextTexture(text){
 const c=document.createElement('canvas');c.width=512;c.height=256;
 const x=c.getContext('2d');x.fillStyle='#070707';x.fillRect(0,0,c.width,c.height);
 x.fillStyle='#ff2929';x.font='bold 150px monospace';x.textAlign='center';x.textBaseline='middle';x.shadowColor='#ff2929';x.shadowBlur=24;x.fillText(text,256,135);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}

function createNameLabel(text){
  const canvas=document.createElement('canvas');
  canvas.width=512;
  canvas.height=128;

  const context=canvas.getContext('2d');
  context.clearRect(0,0,canvas.width,canvas.height);

  context.fillStyle='rgba(5,17,27,.84)';
  if(typeof context.roundRect==='function'){
    context.beginPath();
    context.roundRect(5,5,502,118,20);
    context.fill();
    context.strokeStyle='rgba(115,195,240,.8)';
    context.lineWidth=4;
    context.stroke();
  }else{
    context.fillRect(5,5,502,118);
    context.strokeStyle='rgba(115,195,240,.8)';
    context.lineWidth=4;
    context.strokeRect(5,5,502,118);
  }

  context.fillStyle='#ffffff';
  context.font='bold 39px "Microsoft JhengHei",sans-serif';
  context.textAlign='center';
  context.textBaseline='middle';
  context.fillText(String(text||'設備').slice(0,22),256,64);

  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;

  const material=new THREE.SpriteMaterial({
    map:texture,
    transparent:true,
    depthTest:false,
    depthWrite:false
  });

  const sprite=new THREE.Sprite(material);
  sprite.name='utopNameLabel';
  sprite.position.set(0,2.5,0);
  sprite.scale.set(2.8,.7,1);
  sprite.renderOrder=1000;
  return sprite;
}

function refreshNameLabels(){
  state.items.forEach(item=>{
    const label=item.mesh?.getObjectByName?.('utopNameLabel');
    if(!label)return;

    label.visible=state.globalLabelsVisible!==false&&item.params.showLabel!==false&&shouldShowLabel(sceneSettings.labelMode,{
      selected:item.id===state.selectedId,
      hovered:false
    });
  });
}

function makeModel(item){
 const g=new THREE.Group(),p=item.params;
 if(item.type==='barrier'){
   const body=new THREE.Mesh(new THREE.BoxGeometry(.72,1.62,.62),mat(0xf39a12,{roughness:.44,metalness:.18}));body.position.y=.81;body.castShadow=true;g.add(body);
   const top=new THREE.Mesh(new THREE.BoxGeometry(.78,.18,.67),mat(0xffb52e));top.position.y=1.69;g.add(top);
   const pivot=new THREE.Group();const sign=p.armSide==='right'?1:-1;pivot.position.set(sign*.38,1.52,0);
   const arm=new THREE.Mesh(new THREE.BoxGeometry(p.armLength,.15,.16),mat(0xf5f5f5));arm.position.x=sign*p.armLength/2;pivot.add(arm);
   for(let x=.55;x<p.armLength;x+=.78){const s=new THREE.Mesh(new THREE.BoxGeometry(.34,.16,.025),mat(0xd51f29));s.position.set(sign*x,0,.092);pivot.add(s)}
   pivot.rotation.z=THREE.MathUtils.degToRad(sign*p.angle);g.add(pivot);g.userData.pivot=pivot;
 }else if(item.type==='traffic'){
   const pole=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1.5,16),mat(0x676767));pole.position.y=.75;g.add(pole);
   const box=new THREE.Mesh(new THREE.BoxGeometry(.58,1.15,.34),mat(0x181818));box.position.y=1.85;g.add(box);
   const red=new THREE.Mesh(new THREE.SphereGeometry(.16,20,12),mat(p.mode==='red'?0xff1c1c:0x421515));red.position.set(0,2.08,.2);g.add(red);
   const green=new THREE.Mesh(new THREE.SphereGeometry(.16,20,12),mat(p.mode==='green'?0x20e070:0x143b22));green.position.set(0,1.65,.2);g.add(green);
 }else if(item.type==='timer'){
   const pole=new THREE.Mesh(new THREE.BoxGeometry(.1,1.3,.1),mat(0x666666));pole.position.y=.65;g.add(pole);
   const box=new THREE.Mesh(new THREE.BoxGeometry(1.35,.82,.22),mat(0x181818));box.position.y=1.75;g.add(box);
   const displayMat=new THREE.MeshBasicMaterial({map:makeTextTexture(String(Math.max(0,Math.ceil(p.remaining))).padStart(2,'0'))});
   const display=new THREE.Mesh(new THREE.PlaneGeometry(1.12,.62),displayMat);display.position.set(0,1.75,.116);g.add(display);g.userData.display=display;
 }else if(item.type==='loop'){
   const width=Math.max(.8,Number(p.width)||1.8);
   const length=Math.max(1,Number(p.length)||3);
   const thickness=.06;
   const frameHeight=.045;
   const material=mat(p.detected?0x44dd77:0xe4b82f,{
     roughness:.5,
     metalness:.08
   });

   const horizontalGeometry=new THREE.BoxGeometry(
     width,
     frameHeight,
     thickness
   );
   const verticalGeometry=new THREE.BoxGeometry(
     thickness,
     frameHeight,
     length
   );

   const top=new THREE.Mesh(horizontalGeometry,material);
   top.position.set(0,frameHeight/2,-length/2);
   g.add(top);

   const bottom=new THREE.Mesh(horizontalGeometry,material);
   bottom.position.set(0,frameHeight/2,length/2);
   g.add(bottom);

   const left=new THREE.Mesh(verticalGeometry,material);
   left.position.set(-width/2,frameHeight/2,0);
   g.add(left);

   const right=new THREE.Mesh(verticalGeometry,material);
   right.position.set(width/2,frameHeight/2,0);
   g.add(right);
 }else if(item.type==='infrared'){
   const distance=Math.max(1,Math.min(20,Number(p.distance)||4));
   const half=distance/2;

   [-half,half].forEach((x,index)=>{
     const post=new THREE.Mesh(new THREE.BoxGeometry(.18,1.45,.18),mat(0x404a50,{roughness:.5,metalness:.28}));
     post.position.set(x,.725,0);
     g.add(post);

     const head=new THREE.Mesh(new THREE.BoxGeometry(.28,.34,.22),mat(0x171b1e));
     head.position.set(x,1.32,0);
     g.add(head);

     const lens=new THREE.Mesh(
       new THREE.SphereGeometry(.055,14,8),
       mat(index?0x37c9ff:0xff4b4b)
     );
     lens.position.set(x,1.33,.13);
     g.add(lens);
   });

   if(p.showBeam!==false){
     const beam=new THREE.Mesh(
       new THREE.CylinderGeometry(.018,.018,distance,12),
       new THREE.MeshBasicMaterial({
         color:p.blocked?0xff3535:0x43dfff,
         transparent:true,
         opacity:p.blocked?.2:.72
       })
     );
     beam.rotation.z=Math.PI/2;
     beam.position.set(0,1.33,0);
     g.add(beam);
   }
 }else if(item.type==='uhf'){
 const body=new THREE.Mesh(new THREE.BoxGeometry(.9,1.1,.18),mat(0xe8ebed));body.position.y=.65;g.add(body);const face=new THREE.Mesh(new THREE.BoxGeometry(.72,.82,.035),mat(p.detected?0x49b8ff:0x7d858a));face.position.set(0,.67,.105);g.add(face);
 }else if(item.type==='cardreader'){
 const body=new THREE.Mesh(new THREE.BoxGeometry(.55,1.35,.5),mat(0x747c82,{roughness:.46,metalness:.24}));body.position.y=.675;g.add(body);const face=new THREE.Mesh(new THREE.BoxGeometry(.4,.55,.05),mat(0x15191c));face.position.set(0,1.02,.28);g.add(face);const col=p.state==='GRANTED'?0x2ee078:p.state==='DENIED'?0xff3b3b:0x2d7fab;const screen=new THREE.Mesh(new THREE.BoxGeometry(.28,.12,.03),mat(col));screen.position.set(0,1.15,.32);g.add(screen);
 }else if(item.type==='ledpanel'){
 const box=new THREE.Mesh(new THREE.BoxGeometry(1.8,1,.16),mat(0x17191b,{roughness:.4,metalness:.2}));box.position.y=1.35;g.add(box);const red=new THREE.Mesh(new THREE.CircleGeometry(.22,28),mat(p.mode==='red'?0xff2222:0x421515));red.position.set(-.52,1.52,.09);g.add(red);const green=new THREE.Mesh(new THREE.CircleGeometry(.22,28),mat(p.mode==='green'?0x22e56e:0x153b24));green.position.set(-.52,1.12,.09);g.add(green);const dm=new THREE.MeshBasicMaterial({map:makeTextTexture(String(Math.max(0,Math.ceil(p.remaining))).padStart(2,'0'))});const display=new THREE.Mesh(new THREE.PlaneGeometry(.72,.55),dm);display.position.set(.38,1.35,.091);g.add(display);
 }else if(item.type==='lpr'){
 const body=new THREE.Mesh(new THREE.BoxGeometry(.75,.52,.72),mat(0xe7eaec,{roughness:.38,metalness:.24}));body.position.y=.52;g.add(body);const front=new THREE.Mesh(new THREE.BoxGeometry(.55,.34,.045),mat(0x181b1e));front.position.set(0,.53,.385);g.add(front);const lens=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.08,24),mat(p.state==='VALID'?0x35d77a:p.state==='INVALID'?0xff4141:0x2c3941));lens.rotation.x=Math.PI/2;lens.position.set(0,.53,.43);g.add(lens);const hood=new THREE.Mesh(new THREE.BoxGeometry(.82,.08,.82),mat(0xc7cbce));hood.position.set(0,.82,0);g.add(hood);
 }else{
 const box=new THREE.Mesh(new THREE.BoxGeometry(.82,.58,.5),mat(p.on?0x3b9b5b:0x4a555d));box.position.y=.3;g.add(box);const led=new THREE.Mesh(new THREE.SphereGeometry(.05,14,8),mat(p.on?0x44ff79:0x223329));led.position.set(0,.48,.26);g.add(led);
 }
 g.rotation.y=THREE.MathUtils.degToRad(p.rotation||0);g.userData.id=item.id;g.add(createNameLabel(item.name));return g;
}
function add(type,saved={}){
 const d=defs[type];
 if(!d)throw new Error(`未知的設備類型：${type}`);

 const savedHeight=saved.y??saved.params?.installationHeight??0;
 const migratedParams={...(saved.params||{})};
 if(type==='barrier'&&migratedParams.travelTime!=null){
   if(migratedParams.openTime==null)migratedParams.openTime=migratedParams.travelTime;
   if(migratedParams.closeTime==null)migratedParams.closeTime=migratedParams.travelTime;
   delete migratedParams.travelTime;
 }
 if(migratedParams.showLabel==null)migratedParams.showLabel=true;
 if(migratedParams.positionLocked==null)migratedParams.positionLocked=false;
 if(type==='barrier'){
   if(migratedParams.autoCloseEnabled==null)migratedParams.autoCloseEnabled=false;
   if(migratedParams.autoCloseSeconds==null)migratedParams.autoCloseSeconds=5;
 }
 const item={
   id:saved.id||`${type}_${state.next++}`,
   type,
   name:normalizeLegacyDeviceName(type,saved.name||d.name),
   x:saved.x??0,
   y:normalizeHeight(savedHeight,0,10),
   z:saved.z??0,
   params:{
     ...clone(d.defaults),
     installationHeight:normalizeHeight(savedHeight,0,10),
     partsVisibility:{
       bracket:true,
       base:true,
       ...(migratedParams.partsVisibility||{})
     },
     ...migratedParams
   },
   runtime:{
     target:null,
     start:0,
     from:0,
     duration:0,
     lastTick:0,
     autoCloseTimer:null,
     autoCloseDueAt:0,
     lastDisplayedSecond:null
   }
 };

 item.mesh=makeModel(item);
 item.mesh.position.set(item.x,item.y,item.z);
 applyHeightToObject(item);
 applyPartsVisibility(item);
 group.add(item.mesh);
 state.items.push(item);
 select(item.id);
 refreshNameLabels();
 markDirty();
 return item;
}
function rebuild(i){
 group.remove(i.mesh);
 i.mesh=makeModel(i);
 i.y=normalizeHeight(i.y??i.params?.installationHeight??0,0,10);
 clampDevicePosition(i,i.x,i.z);
 i.mesh.position.set(i.x,i.y,i.z);
 applyHeightToObject(i);
 applyPartsVisibility(i);
 group.add(i.mesh);
 refreshNameLabels();
}
function select(id){state.selectedId=id;refreshNameLabels();renderAll()}
function outputs(i){
 const p=i.params;
 if(i.type==='barrier')return{fullyOpen:p.state==='OPEN',fullyClosed:p.state==='CLOSED',running:['OPENING','CLOSING'].includes(p.state),fault:p.state==='FAULT'};
 if(i.type==='traffic')return{redOn:p.mode==='red',greenOn:p.mode==='green'};
 if(i.type==='timer')return{
  done:p.state==='DONE',
  running:p.state==='RUNNING',
  paused:p.state==='PAUSED',
  idle:p.state==='IDLE'
 };
 if(i.type==='loop')return{detected:p.detected};if(i.type==='infrared')return{blocked:p.blocked,normal:!p.blocked};if(i.type==='uhf')return{detected:p.detected,pulse:p.detected};if(i.type==='cardreader')return{granted:p.state==='GRANTED',denied:p.state==='DENIED'};if(i.type==='ledpanel')return{redOn:p.mode==='red',greenOn:p.mode==='green',done:p.state==='DONE',lastFive:p.state==='RUNNING'&&p.remaining<=5};if(i.type==='lpr')return{recognized:p.state==='VALID',denied:p.state==='INVALID'};
 return{no:p.on,nc:!p.on};
}
function cancelBarrierAutoClose(i){
 if(!i?.runtime)return;
 if(i.runtime.autoCloseTimer){
  clearTimeout(i.runtime.autoCloseTimer);
  i.runtime.autoCloseTimer=null;
 }
 i.runtime.autoCloseDueAt=0;
}

function scheduleBarrierAutoClose(i){
 cancelBarrierAutoClose(i);
 if(!i?.params?.autoCloseEnabled||i.params.state!=='OPEN')return;

 const seconds=Math.max(1,Math.min(999,Number(i.params.autoCloseSeconds)||5));
 i.runtime.autoCloseDueAt=Date.now()+seconds*1000;
 const status=$('statusText');
 if(status)status.textContent=`${i.name}：${seconds}秒後自動關閉`;

 i.runtime.autoCloseTimer=setTimeout(()=>{
  i.runtime.autoCloseTimer=null;
  i.runtime.autoCloseDueAt=0;
  if(i.params.autoCloseEnabled&&i.params.state==='OPEN'){
   motion(i,0,'CLOSING');
   const current=$('statusText');
   if(current)current.textContent=`${i.name}：自動關閉計時完成`;
  }
 },seconds*1000);
}


function controlCountdownTimer(item,action){
 if(!item||item.type!=='timer'||!item.params)return;
 const p=item.params;
 const now=performance.now();

 if(action==='start'){
  if(p.state==='RUNNING')return;
  if(p.remaining<=0||p.state==='DONE'){
   p.remaining=Math.max(1,Number(p.seconds)||10);
  }
  p.state='RUNNING';
  item.runtime.lastTick=now;
  item.runtime.lastDisplayedSecond=null;
 }else if(action==='pause'){
  if(p.state==='RUNNING'){
   p.state='PAUSED';
   item.runtime.lastTick=0;
  }else if(p.state==='PAUSED'){
   p.state='RUNNING';
   item.runtime.lastTick=now;
  }else{
   return;
  }
 }else if(action==='reset'){
  p.state='IDLE';
  p.remaining=Math.max(1,Number(p.seconds)||10);
  item.runtime.lastTick=0;
  item.runtime.lastDisplayedSecond=null;
 }else{
  return;
 }

 rebuild(item);
 renderPlan();
 if(item.id===state.selectedId){
  renderQuick(item);
  refreshTimerInspectorStatus(item);
 }
 propagate(item);
 markDirty();
}

function refreshTimerInspectorStatus(item){
 if(!item||item.id!==state.selectedId)return;
 const statusBox=document.querySelector('#tabContent .field-group:nth-child(2) p');
 if(statusBox)statusBox.innerHTML=statusText(item);

 document.querySelectorAll('[data-input]').forEach(button=>{
  button.classList.remove('timer-control-active','timer-control-paused','timer-control-done');
  if(item.type!=='timer')return;
  if(button.dataset.input==='start'&&item.params.state==='RUNNING'){
   button.classList.add('timer-control-active');
  }
  if(button.dataset.input==='pause'&&item.params.state==='PAUSED'){
   button.classList.add('timer-control-paused');
  }
  if(button.dataset.input==='reset'&&item.params.state==='DONE'){
   button.classList.add('timer-control-done');
  }
 });
}

function input(i,key){
 if(!i||!state.items.includes(i)){
  console.warn('[UTOP-3D] 忽略失效的設備控制事件',key);
  return;
 }
 const p=i.params;
 if(i.type==='barrier'){
   if(key==='open'){
    cancelBarrierAutoClose(i);
    motion(i,90,'OPENING');
   }
   if(key==='close'){
    cancelBarrierAutoClose(i);
    motion(i,0,'CLOSING');
   }
   if(key==='stop'){
    cancelBarrierAutoClose(i);
    i.runtime.target=null;
    p.state='STOPPED';
   }
   if(key==='safety'){
    const isClosing=p.state==='CLOSING'||i.runtime.target===0;
    if(isClosing){
     cancelBarrierAutoClose(i);
     motion(i,90,'OPENING');
     const status=$('statusText');
     if(status)status.textContent=`${i.name}：DI4防砸觸發，反向升起`;
    }
   }
   if(key==='reset'&&p.state==='FAULT')p.state=p.angle>45?'OPEN':'CLOSED';
 }else if(i.type==='traffic'){
   if(key==='red')p.mode='red';if(key==='green')p.mode='green';if(key==='off')p.mode='off';rebuild(i);
 }else if(i.type==='timer'){
   controlCountdownTimer(i,key);
 }else if(i.type==='loop'){if(key==='vehicle')p.detected=true;if(key==='clear')p.detected=false;rebuild(i);
 }else if(i.type==='infrared'){if(key==='blocked')p.blocked=true;if(key==='clear')p.blocked=false;rebuild(i);
 }else if(i.type==='uhf'){if(key==='read')p.detected=true;if(key==='clear')p.detected=false;rebuild(i);
 }else if(i.type==='cardreader'){if(key==='valid')p.state='GRANTED';if(key==='invalid')p.state='DENIED';if(key==='clear')p.state='IDLE';rebuild(i);
 }else if(i.type==='ledpanel'){if(key==='red')p.mode='red';if(key==='green')p.mode='green';if(key==='off')p.mode='off';if(key==='start'){
 p.state='RUNNING';
 if(p.remaining<=0||p.remaining>p.seconds)p.remaining=p.seconds;
 i.runtime.lastTick=performance.now();
 i.runtime.lastDisplayedSecond=null;
}
if(key==='reset'){
 p.state='IDLE';
 p.remaining=p.seconds;
 i.runtime.lastTick=0;
 i.runtime.lastDisplayedSecond=null;
}
rebuild(i);
 }else if(i.type==='lpr'){if(key==='valid')p.state='VALID';if(key==='invalid')p.state='INVALID';if(key==='clear')p.state='IDLE';rebuild(i);
 }else{if(key==='on')p.on=true;if(key==='off')p.on=false;rebuild(i);
 }
 renderAll();propagate(i);markDirty();
}
function motion(i,target,s){
 if(graphicsSettings.animations===false){
  cancelBarrierAutoClose(i);
  i.runtime.target=null;
  i.params.angle=target;
  i.params.state=target>=89?'OPEN':'CLOSED';
  rebuild(i);
  renderPlan();
  propagate(i);
  if(i.params.state==='OPEN')scheduleBarrierAutoClose(i);
  return;
 }
 const seconds=target>i.params.angle
   ? Number(i.params.openTime||4)
   : Number(i.params.closeTime||4);
 i.runtime.target=target;
 i.runtime.from=i.params.angle;
 i.runtime.start=performance.now();
 i.runtime.duration=Math.max(.2,seconds)*1000*Math.abs(target-i.params.angle)/90;
 i.params.state=s;
}
function propagate(source){
 const out=outputs(source);
 for(const w of state.wires){
   if(w.sourceId!==source.id||!out[w.sourcePort])continue;
   const target=get(w.targetId);
   if(target){state.activeWires.add(w.id);input(target,w.targetPort);setTimeout(()=>{state.activeWires.delete(w.id);drawWires()},450)}
 }
 drawWires();
}
function markDirty(){ $('saveState').textContent='● 專案未儲存';$('saveState').style.color='#f4c542' }

document.querySelectorAll('[data-add]').forEach(button=>{
 button.onclick=()=>{
   try{
     const type=button.dataset.add;
     const count=state.items.length;
     add(type,{
       x:-2+(count%4)*1.3,
       y:0,
       z:-2+Math.floor(count/4)*1.4
     });
     $('statusText').textContent=`已加入：${defs[type]?.name||type}`;
   }catch(error){
     console.error('[UTOP-3D] 加入場景失敗',error);
     $('statusText').textContent=`加入場景失敗：${error.message}`;
     alert(`加入場景失敗：${error.message}`);
   }
 };
});
$('moduleSearch').oninput=e=>{
 const q=e.target.value.trim().toLowerCase();
 document.querySelectorAll('.module-card').forEach(c=>c.style.display=!q||c.dataset.search.includes(q)?'grid':'none');
};




function svgElement(tag,attributes={}){
 const element=document.createElementNS('http://www.w3.org/2000/svg',tag);
 Object.entries(attributes).forEach(([key,value])=>element.setAttribute(key,String(value)));
 return element;
}

function addPlanLabel(root,text,x,y,anchor='middle'){
 const label=svgElement('text',{x,y,'text-anchor':anchor,class:'plan-scene-label'});
 label.textContent=text;
 root.appendChild(label);
}

function renderPlanSceneBackground(){
 const root=$('planSceneBackground');
 if(!root)return;
 root.innerHTML='';
 if(currentSceneId!=='showcase-hualongchao')return;

 root.appendChild(svgElement('rect',{
  x:60,y:555,width:640,height:65,rx:4,
  fill:'#3d4346',stroke:'#1d272e','stroke-width':2
 }));
 addPlanLabel(root,'社區外道路',380,594);

 root.appendChild(svgElement('rect',{
  x:95,y:35,width:185,height:125,rx:6,
  fill:'#79848a',stroke:'#d7dcde','stroke-width':4
 }));
 root.appendChild(svgElement('rect',{
  x:325,y:28,width:205,height:137,rx:6,
  fill:'#707b81',stroke:'#d7dcde','stroke-width':4
 }));
 addPlanLabel(root,'A棟',187,101);
 addPlanLabel(root,'B棟',428,101);

 root.appendChild(svgElement('rect',{
  x:75,y:165,width:470,height:65,rx:8,
  fill:'#567b47',opacity:.92
 }));
 addPlanLabel(root,'社區植栽／庭園',310,202);

 root.appendChild(svgElement('polygon',{
  points:'305,545 510,545 485,250 330,250',
  fill:'#8a8984',stroke:'#d6d8d5','stroke-width':4
 }));
 addPlanLabel(root,'下坡車道',407,420);

 root.appendChild(svgElement('polyline',{
  points:'298,548 321,245',
  fill:'none',stroke:'#c2c4c2','stroke-width':12
 }));
 root.appendChild(svgElement('polyline',{
  points:'518,548 494,245',
  fill:'none',stroke:'#c2c4c2','stroke-width':12
 }));

 root.appendChild(svgElement('rect',{
  x:325,y:230,width:174,height:24,rx:3,
  fill:'#3f4c53',stroke:'#bec7cb','stroke-width':2
 }));
 addPlanLabel(root,'地下入口',412,247);

 root.appendChild(svgElement('rect',{
  x:128,y:240,width:155,height:35,rx:3,
  fill:'#979b9a',stroke:'#e3e4e2','stroke-width':3
 }));
 addPlanLabel(root,'左轉鐵捲門',205,263);

 root.appendChild(svgElement('rect',{
  x:65,y:285,width:225,height:245,rx:5,
  fill:'#3c8250',stroke:'#c9e3ce','stroke-width':3
 }));
 addPlanLabel(root,'B1停車場',177,315);

 for(let x=82;x<=245;x+=42){
  root.appendChild(svgElement('rect',{
   x,y:345,width:34,height:116,
   fill:'none',stroke:'#f0f1ec','stroke-width':2
  }));
 }

 root.appendChild(svgElement('polyline',{
  points:'410,535 408,310 286,310 256,330',
  fill:'none',stroke:'#ffd544','stroke-width':5,
  'stroke-dasharray':'13 8'
 }));
 addPlanLabel(root,'車輛動線',425,500,'start');
}

function renderPlan(){
 renderPlanSceneBackground();
 const root=$('planItems');
 root.innerHTML='';

 for(const i of state.items){
  const p=i.params;
  const x=380+i.x*50;
  const y=325+i.z*34;

  const outer=document.createElementNS('http://www.w3.org/2000/svg','g');
  outer.dataset.id=i.id;
  outer.setAttribute(
    'class',
    'plan-item'+
    (i.id===state.selectedId?' selected':'')+
    (i.type==='barrier'&&Number(p.angle)>=89?' barrier-plan-open':'')
  );
  outer.setAttribute('transform',`translate(${x} ${y})`);
  outer.classList.toggle('position-locked',isDeviceMovementLocked(i));

  const model=document.createElementNS('http://www.w3.org/2000/svg','g');

  // Three.js and SVG use opposite screen-space rotation directions.
  // Barrier models therefore invert the equipment rotation in the 2D plan,
  // keeping the boom direction consistent with the 3D top view.
  const planRotation=i.type==='barrier'
    ? -(Number(p.rotation)||0)
    : (Number(p.rotation)||0);

  model.setAttribute('transform',`rotate(${planRotation})`);

  if(i.type==='barrier'){
    const sign=p.armSide==='right'?1:-1;
    const body=document.createElementNS('http://www.w3.org/2000/svg','rect');
    body.setAttribute('x','-20');
    body.setAttribute('y','-30');
    body.setAttribute('width','40');
    body.setAttribute('height','60');
    body.setAttribute('rx','6');
    body.setAttribute('fill','#f2a000');
    body.setAttribute('stroke','#222');
    body.setAttribute('class','outline');
    model.appendChild(body);

    /*
     * 2D is a top view:
     * the boom must not sweep sideways while opening.
     * Its visible horizontal projection gets shorter as it rises:
     * projected length = real length × cos(opening angle).
     */
    const angle=Math.max(0,Math.min(90,Number(p.angle)||0));
    const fullLength=Math.max(24,(Number(p.armLength)||4)*50);
    const projectedLength=Math.max(5,fullLength*Math.cos(THREE.MathUtils.degToRad(angle)));
    const raisedRatio=Math.sin(THREE.MathUtils.degToRad(angle));

    const armGroup=document.createElementNS('http://www.w3.org/2000/svg','g');
    armGroup.setAttribute('transform',`translate(${sign*18} 0)`);

    const arm=document.createElementNS('http://www.w3.org/2000/svg','rect');
    arm.setAttribute('x',sign>0?0:-projectedLength);
    arm.setAttribute('y','-6');
    arm.setAttribute('width',projectedLength);
    arm.setAttribute('height','12');
    arm.setAttribute('rx','2');
    arm.setAttribute('fill','#eee');
    arm.setAttribute('stroke','#222');
    armGroup.appendChild(arm);

    for(let distance=24;distance<projectedLength;distance+=38){
      const stripe=document.createElementNS('http://www.w3.org/2000/svg','rect');
      stripe.setAttribute('x',sign>0?distance:-distance-16);
      stripe.setAttribute('y','-6');
      stripe.setAttribute('width',Math.min(16,Math.max(0,projectedLength-distance)));
      stripe.setAttribute('height','12');
      stripe.setAttribute('fill','#d22');
      armGroup.appendChild(stripe);
    }

    /*
     * A raised-position indicator is shown beside the pivot.
     * It represents the boom moving upward out of the plan plane.
     */
    if(angle>4){
      const raised=document.createElementNS('http://www.w3.org/2000/svg','line');
      raised.setAttribute('x1','0');
      raised.setAttribute('y1','-7');
      raised.setAttribute('x2','0');
      raised.setAttribute('y2',String(-7-(raisedRatio*30)));
      raised.setAttribute('stroke','#58c9ff');
      raised.setAttribute('stroke-width','5');
      raised.setAttribute('stroke-linecap','round');
      raised.setAttribute('class','barrier-raised-indicator');
      armGroup.appendChild(raised);

      const pivotMark=document.createElementNS('http://www.w3.org/2000/svg','circle');
      pivotMark.setAttribute('cx','0');
      pivotMark.setAttribute('cy','0');
      pivotMark.setAttribute('r','5');
      pivotMark.setAttribute('fill','#58c9ff');
      pivotMark.setAttribute('stroke','#09202c');
      pivotMark.setAttribute('stroke-width','2');
      armGroup.appendChild(pivotMark);
    }

    model.appendChild(armGroup);
  }else if(i.type==='traffic'){
    const box=document.createElementNS('http://www.w3.org/2000/svg','rect');
    box.setAttribute('x','-18');
    box.setAttribute('y','-35');
    box.setAttribute('width','36');
    box.setAttribute('height','70');
    box.setAttribute('rx','6');
    box.setAttribute('fill','#181818');
    box.setAttribute('stroke','#222');
    box.setAttribute('class','outline');
    model.appendChild(box);

    ['red','green'].forEach((mode,index)=>{
      const lamp=document.createElementNS('http://www.w3.org/2000/svg','circle');
      lamp.setAttribute('cx','0');
      lamp.setAttribute('cy',index?-15:15);
      lamp.setAttribute('r','10');
      lamp.setAttribute('fill',p.mode===mode?(mode==='red'?'#f22':'#2e6'):'#333');
      model.appendChild(lamp);
    });
  }else if(i.type==='timer'){
    const box=document.createElementNS('http://www.w3.org/2000/svg','rect');
    box.setAttribute('x','-36');
    box.setAttribute('y','-24');
    box.setAttribute('width','72');
    box.setAttribute('height','48');
    box.setAttribute('rx','5');
    box.setAttribute('fill','#151515');
    box.setAttribute('stroke','#222');
    box.setAttribute('class','outline');
    model.appendChild(box);

    const timerText=document.createElementNS('http://www.w3.org/2000/svg','text');
    timerText.textContent=String(Math.max(0,Math.ceil(p.remaining))).padStart(2,'0');
    timerText.setAttribute('fill','#ff2525');
    timerText.setAttribute('font-size','25');
    timerText.setAttribute('font-family','monospace');
    timerText.setAttribute('text-anchor','middle');
    timerText.setAttribute('y','9');
    model.appendChild(timerText);
  }else if(i.type==='loop'){
    const width=Math.max(.8,Number(p.width)||1.8);
    const length=Math.max(1,Number(p.length)||3);
    const frame=document.createElementNS('http://www.w3.org/2000/svg','rect');

    // X軸與Z軸採用平面圖各自的公尺比例，與3D真實尺寸一致。
    frame.setAttribute('x',String(-width*PLAN_X_PPM/2));
    frame.setAttribute('y',String(-length*PLAN_Z_PPM/2));
    frame.setAttribute('width',String(width*PLAN_X_PPM));
    frame.setAttribute('height',String(length*PLAN_Z_PPM));
    frame.setAttribute('rx','2');
    frame.setAttribute('fill','rgba(226,181,42,.06)');
    frame.setAttribute('stroke',p.detected?'#42d979':'#e1b52a');
    frame.setAttribute('stroke-width','5');
    model.appendChild(frame);
  }else if(i.type==='infrared'){
    const distance=Math.max(1,Math.min(20,Number(p.distance)||4));
    const pixelsPerMeter=18;
    const half=distance*pixelsPerMeter/2;

    [-half,half].forEach(x=>{
      const post=document.createElementNS('http://www.w3.org/2000/svg','rect');
      post.setAttribute('x',String(x-7));
      post.setAttribute('y','-20');
      post.setAttribute('width','14');
      post.setAttribute('height','40');
      post.setAttribute('fill','#3d474d');
      model.appendChild(post);
    });

    const line=document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1',String(-half));
    line.setAttribute('x2',String(half));
    line.setAttribute('y1','0');
    line.setAttribute('y2','0');
    line.setAttribute('stroke',p.blocked?'#ff3f3f':'#44dfff');
    line.setAttribute('stroke-width','4');
    line.setAttribute('stroke-dasharray','8 5');
    model.appendChild(line);
  }else if(i.type==='uhf'||i.type==='cardreader'||i.type==='lpr'){
    const q=document.createElementNS('http://www.w3.org/2000/svg','rect');q.setAttribute('x','-28');q.setAttribute('y','-30');q.setAttribute('width','56');q.setAttribute('height','60');q.setAttribute('rx','6');q.setAttribute('fill',i.type==='uhf'?(p.detected?'#59bfff':'#dfe3e5'):i.type==='cardreader'?(p.state==='GRANTED'?'#35c66f':p.state==='DENIED'?'#df4c4c':'#737d83'):(p.state==='VALID'?'#40cf77':p.state==='INVALID'?'#df4b4b':'#dce0e2'));q.setAttribute('stroke','#222');model.appendChild(q);
  }else if(i.type==='ledpanel'){
    const q=document.createElementNS('http://www.w3.org/2000/svg','rect');q.setAttribute('x','-48');q.setAttribute('y','-28');q.setAttribute('width','96');q.setAttribute('height','56');q.setAttribute('rx','5');q.setAttribute('fill','#16191b');q.setAttribute('stroke','#222');model.appendChild(q);const tx=document.createElementNS('http://www.w3.org/2000/svg','text');tx.textContent=String(Math.max(0,Math.ceil(p.remaining))).padStart(2,'0');tx.setAttribute('fill','#ff3030');tx.setAttribute('font-size','24');tx.setAttribute('text-anchor','middle');tx.setAttribute('y','8');model.appendChild(tx);
  }else{
    const box=document.createElementNS('http://www.w3.org/2000/svg','rect');
    box.setAttribute('x','-25');
    box.setAttribute('y','-18');
    box.setAttribute('width','50');
    box.setAttribute('height','36');
    box.setAttribute('rx','5');
    box.setAttribute('fill',p.on?'#398f53':'#555');
    box.setAttribute('stroke','#222');
    box.setAttribute('class','outline');
    model.appendChild(box);
  }

  outer.appendChild(model);

  if(state.globalLabelsVisible!==false&&p.showLabel!==false){
  const labelText=String(i.name||defs[i.type]?.name||'設備');
  const shortLabel=labelText.length>14?labelText.slice(0,13)+'…':labelText;
  const labelWidth=Math.max(82,Math.min(180,shortLabel.length*15+24));

  const labelBg=document.createElementNS('http://www.w3.org/2000/svg','rect');
  labelBg.setAttribute('x',String(-labelWidth/2));
  labelBg.setAttribute('y','-67');
  labelBg.setAttribute('width',String(labelWidth));
  labelBg.setAttribute('height','25');
  labelBg.setAttribute('rx','8');
  labelBg.setAttribute('class','plan-name-bg');
  outer.appendChild(labelBg);

  const name=document.createElementNS('http://www.w3.org/2000/svg','text');
  name.textContent=shortLabel;
  name.setAttribute('x','0');
  name.setAttribute('y','-50');
  name.setAttribute('text-anchor','middle');
  name.setAttribute('class','plan-name-text');
  outer.appendChild(name);

  const height=document.createElementNS('http://www.w3.org/2000/svg','text');
  height.textContent=`H ${Number(i.y||0).toFixed(1)}m`;
  height.setAttribute('x','0');
  height.setAttribute('y','-35');
  height.setAttribute('text-anchor','middle');
  height.setAttribute('class','plan-height-text');
  outer.appendChild(height);

  }

  outer.onpointerdown=startPlanDrag;
  outer.onclick=()=>select(i.id);
  root.appendChild(outer);
 }

 $('deviceCount').textContent=`${state.items.length} 個設備｜${state.wires.length} 條接線`;
}

let planDrag=null;
function svgPoint(e){const p=$('planSvg').createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform($('planSvg').getScreenCTM().inverse())}
function startPlanDrag(e){
 planDrag=get(e.currentTarget.dataset.id);
 if(!planDrag)return;
 select(planDrag.id);
 if(isDeviceMovementLocked(planDrag)){
  planDrag=null;
  $('statusText').textContent='設備位置已固定，請先解除固定';
  return;
 }
 safeSetPointerCapture(e.currentTarget,e.pointerId);
}
$('planSvg').onpointermove=e=>{
 if(!planDrag||isDeviceMovementLocked(planDrag))return;
 const point=svgPoint(e);
 clampDevicePosition(
  planDrag,
  (point.x-PLAN_CENTER_X)/PLAN_X_PPM,
  (point.y-PLAN_CENTER_Y)/PLAN_Z_PPM
 );
 renderPlan();
 markDirty();
}
$('planSvg').onpointerup=e=>{
 safeReleasePointerCapture(e.currentTarget,e.pointerId);
 planDrag=null;
};
$('planSvg').onpointercancel=e=>{
 safeReleasePointerCapture(e.currentTarget,e.pointerId);
 planDrag=null;
};

function renderInspector(){
 const i=get(state.selectedId),box=$('inspectorContent');
 $('selectedBadge').textContent=i?`已選擇：${i.name}`:'尚未選取設備';
 if(!i){box.innerHTML='<div class="empty-inspector">從模組庫加入設備，或點選場景中的設備。</div>';$('quickContent').innerHTML='<p>尚未選取設備</p>';return}
 const p=i.params,d=defs[i.type],out=outputs(i);
 if(state.activeTab==='properties'){
   box.innerHTML=`<div class="form-grid">
   <section class="field-group"><h3>基本資訊</h3>
   <label>設備名稱<input id="fName" value="${i.name}"></label>
   <label>設備編號<input value="${d.assetId}" disabled></label>
   <label>設備類型<input value="${d.name}" disabled></label></section>
   <section class="field-group"><h3>位置</h3>
   <label>X 座標<input id="fX" type="number" step=".1" value="${i.x.toFixed(2)}"></label>
   <label>Y 安裝高度
    <div class="height-editor">
      <button id="heightDown" type="button">−</button>
      <input id="fY" type="number" min="0" max="12" step=".1" value="${Number(i.y||0).toFixed(1)}">
      <button id="heightUp" type="button">＋</button>
    </div>
    <input id="heightRange" type="range" min="0" max="12" step=".1" value="${Number(i.y||0)}">
   </label>
   <label>Z 座標<input id="fZ" type="number" step=".1" value="${i.z.toFixed(2)}"></label>
   <label>旋轉角度<input id="fRot" type="number" min="0" max="359" value="${p.rotation||0}"></label>
   <label class="checkbox-field"><input id="showDeviceLabel" type="checkbox" ${p.showLabel!==false?'checked':''}> 顯示2D與3D名稱</label>
   <label class="checkbox-field lock-field"><input id="positionLocked" type="checkbox" ${p.positionLocked?'checked':''}> 固定設備位置，禁止拖移</label></section>
   <section class="field-group"><h3>快速方向</h3><div class="button-row">${[0,90,180,270].map(v=>`<button data-rot="${v}">${v}°</button>`).join('')}</div></section>
   </div>`;
 }else if(state.activeTab==='specs'){
   if(i.type==='barrier'){
    box.innerHTML=`<div class="form-grid">
      <section class="field-group"><h3>柵欄機動作參數</h3>
       <label>桿子長度（m）<input id="armLen" type="number" min="1.5" max="6" step=".1" value="${p.armLength}"></label>
       <label>出桿方向<select id="armSide"><option value="right" ${p.armSide==='right'?'selected':''}>右側出桿</option><option value="left" ${p.armSide==='left'?'selected':''}>左側出桿</option></select></label>
       <label>開啟時間（秒）<input id="openTime" type="number" min=".5" max="30" step=".5" value="${p.openTime}"></label>
       <label>關閉時間（秒）<input id="closeTime" type="number" min=".5" max="30" step=".5" value="${p.closeTime}"></label>
       <label class="checkbox-field"><input id="autoCloseEnabled" type="checkbox" ${p.autoCloseEnabled?'checked':''}> 全開後自動關閉</label>
       <label>自動關閉等待（秒）<input id="autoCloseSeconds" type="number" min="1" max="999" step="1" value="${p.autoCloseSeconds}"></label>
      </section>
      <section class="field-group"><h3>機箱規格</h3>
       <label>機箱寬度<input value="350 mm" disabled></label>
       <label>機箱深度<input value="290 mm" disabled></label>
       <label>機箱高度<input value="1000 mm" disabled></label>
       <label>最大開啟角度<input value="90°" disabled></label>
      </section>
    </div>`;
   }else if(i.type==='traffic'){
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>紅綠燈參數</h3>
     <label>預設燈號<select id="trafficMode"><option value="red" ${p.mode==='red'?'selected':''}>紅燈</option><option value="green" ${p.mode==='green'?'selected':''}>綠燈</option><option value="off" ${p.mode==='off'?'selected':''}>全關</option></select></label>
     <label>安裝高度<input value="${Number(i.y||0).toFixed(1)} m" disabled></label>
    </section></div>`;
   }else if(i.type==='timer'){
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>倒數計時參數</h3>
     <label>設定秒數<input id="timerSeconds" type="number" min="1" max="999" value="${p.seconds}"></label>
     <label>剩餘秒數<input value="${Math.ceil(p.remaining)}" disabled></label>
     <label>安裝高度<input value="${Number(i.y||0).toFixed(1)} m" disabled></label>
    </section></div>`;
   }else if(i.type==='loop'){
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>地感線圈參數</h3><label>寬度（m）<input id="loopWidth" type="number" min=".8" max="4" step=".1" value="${p.width}"></label><label>長度（m）<input id="loopLength" type="number" min="1" max="6" step=".1" value="${p.length}"></label></section></div>`;
   }else if(i.type==='infrared'){
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>紅外線對射參數</h3><label>兩台距離（m）<input id="irDistance" type="number" min="1" max="20" step=".1" value="${p.distance}"></label><label class="checkbox-field"><input id="irShowBeam" type="checkbox" ${p.showBeam!==false?'checked':''}>顯示光束</label></section></div>`;
   }else if(i.type==='uhf'){
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>UHF／eTag參數</h3><label>讀取距離（m）<input id="uhfDistance" type="number" min="1" max="15" step=".5" value="${p.readDistance}"></label><label>模擬標籤<input id="uhfTag" value="${p.lastTag}"></label></section></div>`;
   }else if(i.type==='cardreader'){
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>車道卡機參數</h3><label>狀態<input value="${p.state}" disabled></label></section></div>`;
   }else if(i.type==='ledpanel'){
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>紅綠燈倒數參數</h3><label>設定秒數<input id="ledSeconds" type="number" min="1" max="99" value="${p.seconds}"></label><label>預設燈號<select id="ledMode"><option value="red" ${p.mode==='red'?'selected':''}>紅燈</option><option value="green" ${p.mode==='green'?'selected':''}>綠燈</option><option value="off" ${p.mode==='off'?'selected':''}>全關</option></select></label><label class="checkbox-field"><input id="ledBlink" type="checkbox" ${p.blinkLastFive?'checked':''}>最後五秒閃爍</label><label class="checkbox-field"><input id="ledBuzzer" type="checkbox" ${p.buzzerLastFive?'checked':''}>最後五秒蜂鳴</label></section></div>`;
   }else if(i.type==='lpr'){
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>車牌辨識參數</h3><label>模擬車牌<input id="lprPlate" value="${p.plate}"></label><label>信心值（%）<input id="lprConfidence" type="number" min="0" max="100" value="${p.confidence}"></label></section></div>`;
   }else{
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>繼電器參數</h3>
     <label>預設狀態<select id="relayDefault"><option value="off" ${!p.on?'selected':''}>釋放</option><option value="on" ${p.on?'selected':''}>吸合</option></select></label>
     <label>安裝高度<input value="${Number(i.y||0).toFixed(1)} m" disabled></label>
    </section></div>`;
   }
 }else if(state.activeTab==='controls'){
   const controls=i.type==='barrier'?[['open','開啟'],['stop','停止'],['close','關閉'],['safety','防砸'],['reset','復歸']]:i.type==='traffic'?[['red','紅燈'],['green','綠燈'],['off','全關']]:i.type==='timer'?[['start','開始'],['pause','暫停'],['reset','重設']]:i.type==='loop'?[['vehicle','車輛進入'],['clear','車輛離開']]:i.type==='infrared'?[['blocked','遮斷'],['clear','恢復']]:i.type==='uhf'?[['read','讀取標籤'],['clear','清除']]:i.type==='cardreader'?[['valid','有效卡'],['invalid','無效卡'],['clear','清除']]:i.type==='ledpanel'?[['red','紅燈'],['green','綠燈'],['start','開始倒數'],['reset','重設'],['off','全關']]:i.type==='lpr'?[['valid','有效車牌'],['invalid','無效車牌'],['clear','清除']]:[['on','吸合'],['off','釋放']];
   box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>設備控制</h3><div class="button-row">${controls.map(x=>`<button data-input="${x[0]}">${x[1]}</button>`).join('')}</div></section><section class="field-group"><h3>目前狀態</h3><p>${statusText(i)}</p></section></div>`;
 }else{
   box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>DI 輸入</h3>${d.di.map(x=>`<div class="io-row"><b>${x[0]}</b><span>${x[1]}</span><button data-input="${x[2]}">觸發</button></div>`).join('')}</section>
   <section class="field-group"><h3>DO 輸出</h3>${d.do.map(x=>`<div class="io-row"><b>${x[0]}</b><span>${x[1]}</span><i class="lamp ${out[x[2]]?'on':''}"></i></div>`).join('')}</section></div>`;
 }
 bindInspector(i);
 renderQuick(i);
}
function statusText(i){const p=i.params;if(i.type==='barrier')return`狀態：${p.state}<br>桿子角度：${p.angle.toFixed(1)}°`;if(i.type==='traffic')return`目前燈號：${p.mode}`;if(i.type==='timer')return`剩餘：${Math.ceil(p.remaining)} 秒<br>狀態：${p.state}`;if(i.type==='loop')return`車輛偵測：${p.detected?'有車':'無車'}`;if(i.type==='infrared')return`對射：${p.blocked?'遮斷':'正常'}｜${p.distance}m`;if(i.type==='uhf')return`讀取：${p.detected?'成功':'待機'}<br>${p.lastTag}`;if(i.type==='cardreader')return`卡機：${p.state}`;if(i.type==='ledpanel')return`燈號：${p.mode}<br>剩餘：${Math.ceil(p.remaining)}秒`;if(i.type==='lpr')return`辨識：${p.state}<br>${p.plate}`;return`繼電器：${p.on?'ON':'OFF'}`}
function bindInspector(i){
 const p=i.params;
 document.querySelectorAll('[data-input]').forEach(b=>b.onclick=()=>input(i,b.dataset.input));
 document.querySelectorAll('[data-rot]').forEach(b=>b.onclick=()=>{p.rotation=+b.dataset.rot;rebuild(i);renderAll();markDirty()});
 if($('fName'))$('fName').oninput=e=>{i.name=e.target.value;renderQuick(i);$('selectedBadge').textContent=`已選擇：${i.name}`;markDirty()};
 if($('fX'))$('fX').oninput=e=>{
 clampDevicePosition(i,e.currentTarget.value,i.z);
 e.currentTarget.value=i.x.toFixed(2);
 renderPlan();
 markDirty();
};
 const setHeight=value=>{
  i.y=normalizeHeight(value,0,12);
  i.params.installationHeight=i.y;
  applyHeightToObject(i);
  if($('fY'))$('fY').value=i.y.toFixed(1);
  if($('heightRange'))$('heightRange').value=i.y;
  renderPlan();
  markDirty();
 };
 if($('fY'))$('fY').oninput=e=>setHeight(e.target.value);
 if($('heightRange'))$('heightRange').oninput=e=>setHeight(e.target.value);
 if($('heightDown'))$('heightDown').onclick=()=>setHeight(i.y-.1);
 if($('heightUp'))$('heightUp').onclick=()=>setHeight(i.y+.1);
 if($('fZ'))$('fZ').oninput=e=>{
 clampDevicePosition(i,i.x,e.currentTarget.value);
 e.currentTarget.value=i.z.toFixed(2);
 renderPlan();
 markDirty();
};
 if($('fRot'))$('fRot').onchange=e=>{p.rotation=+e.target.value;rebuild(i);renderAll();markDirty()};
 if($('showDeviceLabel'))$('showDeviceLabel').onchange=e=>{
  p.showLabel=e.target.checked;
  refreshNameLabels();
  renderPlan();
  markDirty();
 };
 if($('positionLocked'))$('positionLocked').onchange=e=>{
  p.positionLocked=e.currentTarget.checked;
  renderPlan();
  markDirty();
 };
 if($('armLen'))$('armLen').onchange=e=>{p.armLength=+e.target.value;rebuild(i);renderAll();markDirty()};
 if($('armSide'))$('armSide').onchange=e=>{p.armSide=e.target.value;rebuild(i);renderAll();markDirty()};
 if($('openTime'))$('openTime').oninput=e=>{p.openTime=Math.max(.5,+e.target.value||4);markDirty()};
 if($('closeTime'))$('closeTime').oninput=e=>{p.closeTime=Math.max(.5,+e.target.value||4);markDirty()};
 if($('autoCloseEnabled'))$('autoCloseEnabled').onchange=e=>{
  p.autoCloseEnabled=e.target.checked;
  if(!p.autoCloseEnabled)cancelBarrierAutoClose(i);
  else if(p.state==='OPEN')scheduleBarrierAutoClose(i);
  markDirty();
 };
 if($('autoCloseSeconds'))$('autoCloseSeconds').onchange=e=>{
  p.autoCloseSeconds=Math.max(1,Math.min(999,Number(e.target.value)||5));
  e.target.value=String(p.autoCloseSeconds);
  if(p.autoCloseEnabled&&p.state==='OPEN')scheduleBarrierAutoClose(i);
  markDirty();
 };
 if($('timerSeconds'))$('timerSeconds').onchange=e=>{
 const input=e.currentTarget;
 const seconds=Math.max(1,Math.min(999,Number(input.value)||1));
 p.seconds=seconds;
 p.remaining=seconds;
 p.state='IDLE';
 i.runtime.lastTick=0;
 i.runtime.lastDisplayedSecond=null;
 input.value=String(seconds);

 rebuild(i);
 renderPlan();
 renderQuick(i);
 refreshTimerInspectorStatus(i);
 markDirty();
};
 if($('trafficMode'))$('trafficMode').onchange=e=>{p.mode=e.target.value;rebuild(i);renderAll();markDirty()};
 if($('relayDefault'))$('relayDefault').onchange=e=>{p.on=e.target.value==='on';rebuild(i);renderAll();markDirty()};
 if($('loopWidth'))$('loopWidth').oninput=e=>{
 p.width=Math.max(.8,Math.min(4,Number(e.currentTarget.value)||1.8));
 rebuild(i);renderPlan();markDirty();
};
 if($('loopLength'))$('loopLength').oninput=e=>{
 p.length=Math.max(1,Math.min(6,Number(e.currentTarget.value)||3));
 rebuild(i);renderPlan();markDirty();
};
 if($('irDistance'))$('irDistance').oninput=e=>{
 p.distance=Math.max(1,Math.min(20,Number(e.currentTarget.value)||4));
 rebuild(i);renderPlan();markDirty();
};
 if($('irShowBeam'))$('irShowBeam').onchange=e=>{
 p.showBeam=e.currentTarget.checked;
 rebuild(i);renderPlan();markDirty();
};
 if($('uhfDistance'))$('uhfDistance').onchange=e=>{p.readDistance=Math.max(1,Math.min(15,Number(e.target.value)||8));markDirty()};
 if($('uhfTag'))$('uhfTag').oninput=e=>{p.lastTag=e.target.value;markDirty()};
 if($('ledSeconds'))$('ledSeconds').onchange=e=>{
 const input=e.currentTarget;
 p.seconds=Math.max(1,Math.min(99,Number(input.value)||10));
 p.remaining=p.seconds;
 input.value=String(p.seconds);
 rebuild(i);renderPlan();markDirty();
 requestAnimationFrame(()=>{
  if(state.selectedId===i.id)renderQuick(i);
 });
};
 if($('ledMode'))$('ledMode').onchange=e=>{
 p.mode=e.currentTarget.value;
 rebuild(i);renderPlan();renderQuick(i);markDirty();
};
 if($('ledBlink'))$('ledBlink').onchange=e=>{p.blinkLastFive=e.target.checked;markDirty()};
 if($('ledBuzzer'))$('ledBuzzer').onchange=e=>{p.buzzerLastFive=e.target.checked;markDirty()};
 if($('lprPlate'))$('lprPlate').oninput=e=>{p.plate=e.target.value;markDirty()};
 if($('lprConfidence'))$('lprConfidence').onchange=e=>{p.confidence=Math.max(0,Math.min(100,Number(e.target.value)||0));markDirty()};
}
function renderQuick(i=get(state.selectedId)){
 const container=$('quickContent');
 if(!container)return;
 if(!i||!state.items.includes(i)){
  container.innerHTML='<div class="status-box">尚未選取設備</div>';
  return;
 }
 const p=i.params;
 if(i.type==='barrier')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="open">開啟</button><button data-q="stop">停止</button><button data-q="close">關閉</button><button data-q="reset">復歸</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='traffic')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="green">綠燈</button><button data-q="off">全關</button><button data-q="red">紅燈</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='timer')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="start">開始</button><button data-q="pause">暫停</button><button data-q="reset">重設</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='loop')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="vehicle">車輛進入</button><button data-q="clear">車輛離開</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='infrared')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="blocked">遮斷</button><button data-q="clear">恢復</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='uhf')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="read">讀取標籤</button><button data-q="clear">清除</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='cardreader')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="valid">有效卡</button><button data-q="invalid">無效卡</button><button data-q="clear">清除</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='ledpanel')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="red">紅燈</button><button data-q="green">綠燈</button><button data-q="start">倒數</button><button data-q="reset">重設</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='lpr')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="valid">有效車牌</button><button data-q="invalid">無效車牌</button><button data-q="clear">清除</button></div><div class="status-box">${statusText(i)}</div>`;
 else $('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="on">吸合</button><button data-q="off">釋放</button></div><div class="status-box">${statusText(i)}</div>`;
 document.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>input(i,b.dataset.q));
}
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.activeTab=b.dataset.tab;renderInspector()});
function updateGlobalLabelButton(){
 const button=$('globalLabelToggle');
 if(!button)return;
 const visible=state.globalLabelsVisible!==false;
 button.classList.toggle('active',visible);
 button.classList.toggle('inactive',!visible);
 button.setAttribute('aria-pressed',visible?'true':'false');
 button.textContent=visible?'🏷 全名稱：開啟':'🏷 全名稱：關閉';
}

function setGlobalLabelsVisible(visible){
 state.globalLabelsVisible=Boolean(visible);
 refreshNameLabels();
 renderPlan();
 updateGlobalLabelButton();
 markDirty();
}

function renderAll(){renderPlan();renderInspector();if($('wiringDialog').open)renderWiring()}

$('deleteBtn').onclick=()=>{const i=get(state.selectedId);if(!i)return;group.remove(i.mesh);state.items=state.items.filter(x=>x.id!==i.id);state.wires=state.wires.filter(w=>w.sourceId!==i.id&&w.targetId!==i.id);state.selectedId=null;renderAll();markDirty()};

const ray=new THREE.Raycaster(),ptr=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3(),off=new THREE.Vector3();let drag3d=null;
function pointer(e){const r=renderer.domElement.getBoundingClientRect();ptr.x=((e.clientX-r.left)/r.width)*2-1;ptr.y=-((e.clientY-r.top)/r.height)*2+1}
renderer.domElement.onpointerdown=e=>{
 pointer(e);
 ray.setFromCamera(ptr,camera);
 const hits=ray.intersectObjects(group.children,true);
 if(!hits.length)return;

 let root=hits[0].object;
 while(root.parent!==group&&root.parent)root=root.parent;

 drag3d=get(root.userData.id);
 if(!drag3d)return;

 select(drag3d.id);

 if(isDeviceMovementLocked(drag3d)){
  drag3d=null;
  $('statusText').textContent='設備位置已固定，請先解除固定';
  return;
 }

 orbit.enabled=false;
 safeSetPointerCapture(renderer.domElement,e.pointerId);
 ray.ray.intersectPlane(plane,hit);
 off.set(drag3d.x,0,drag3d.z).sub(hit);
}
renderer.domElement.onpointermove=e=>{
 if(!drag3d||isDeviceMovementLocked(drag3d))return;
 pointer(e);
 ray.setFromCamera(ptr,camera);

 if(ray.ray.intersectPlane(plane,hit)){
  clampDevicePosition(
   drag3d,
   hit.x+off.x,
   hit.z+off.z
  );
  renderPlan();
  markDirty();
 }
}
renderer.domElement.onpointerup=e=>{
 safeReleasePointerCapture(renderer.domElement,e.pointerId);
 drag3d=null;
 orbit.enabled=true;
};
renderer.domElement.onpointercancel=e=>{
 safeReleasePointerCapture(renderer.domElement,e.pointerId);
 drag3d=null;
 orbit.enabled=true;
};

function setView(x,y,z){camera.position.set(x,y,z);orbit.target.set(0,.7,0);orbit.update()}
$('viewFront').onclick=()=>setView(0,4,11);
$('viewBack').onclick=()=>setView(0,4,-11);
$('viewLeft').onclick=()=>setView(-11,4,0);
$('viewRight').onclick=()=>setView(11,4,0);
$('viewTop').onclick=()=>setView(0,16,.01);
$('viewFrontLeft').onclick=()=>setView(-10,7,12);
$('viewFrontRight').onclick=()=>setView(10,7,12);
$('viewBackLeft').onclick=()=>setView(-10,7,-12);
$('viewBackRight').onclick=()=>setView(10,7,-12);
$('viewDriver').onclick=()=>setView(0,2.15,13.5);
$('topViewBtn').onclick=()=>setView(0,16,.01);
$('resetViewBtn').onclick=()=>setView(10.8,10.2,13.6);

const WIRE_PALETTE=['#E2B62C','#299CE8','#9B72E8','#F28C28','#35B96D','#E05252','#40BFC1','#E67AB0'];
function wireColor(index){return WIRE_PALETTE[index%WIRE_PALETTE.length]}
function normalizeWireColors(){
 state.wires.forEach((wire,index)=>{
  if(!wire.color)wire.color=wireColor(index);
 });
}

function renderWiring(){ensureWireNodePositions();normalizeWireColors();
 const nodes=$('deviceNodes');nodes.innerHTML='';
 for(const i of state.items){const d=defs[i.type],n=document.createElement('div');n.className='device-node';n.dataset.id=i.id;n.innerHTML=`<h3>${i.name}</h3><div class="ports"><div class="port-col"><b>DO輸出</b>${d.do.map(x=>`<button class="port do" data-kind="do" data-device="${i.id}" data-port="${x[2]}">${x[0]} ${x[1]}</button>`).join('')}</div><div class="port-col"><b>DI輸入</b>${d.di.map(x=>`<button class="port di" data-kind="di" data-device="${i.id}" data-port="${x[2]}">${x[0]} ${x[1]}</button>`).join('')}</div></div>`;nodes.appendChild(n)}
 nodes.querySelectorAll('.port').forEach(b=>b.onclick=()=>portClick(b));
 $('wireList').innerHTML=state.wires.map(w=>`
  <div class="wire-item ${sceneSettings.selectedWireId===w.id?'selected':''}" data-wire-row="${w.id}">
    <i class="wire-color-dot" style="background:${w.color}"></i>
    <span title="${get(w.sourceId)?.name}.${w.sourcePort} → ${get(w.targetId)?.name}.${w.targetPort}">
      ${get(w.sourceId)?.name}.${w.sourcePort} → ${get(w.targetId)?.name}.${w.targetPort}
    </span>
    <button data-wire-delete="${w.id}">刪除</button>
  </div>`).join('')||'<div class="wire-empty-message">尚未建立連線</div>';

 if($('wireListCount'))$('wireListCount').textContent=`${state.wires.length} 條`;

 document.querySelectorAll('[data-wire-row]').forEach(row=>{
  row.onclick=e=>{
   if(e.target.closest('[data-wire-delete]'))return;
   selectWireForAnalysis(row.dataset.wireRow);
  };
 });

 document.querySelectorAll('[data-wire-delete]').forEach(button=>{
  button.onclick=e=>{
   e.stopPropagation();
   const id=button.dataset.wireDelete;
   state.wires=state.wires.filter(w=>w.id!==id);
   if(sceneSettings.selectedWireId===id)clearWireAnalysis();
   renderWiring();
   markDirty();
  };
 });
 setTimeout(drawWires,0);
}
function portClick(b){if(b.dataset.kind==='do'){state.pending={deviceId:b.dataset.device,port:b.dataset.port};$('wireHint').textContent=`來源：${get(state.pending.deviceId).name}.${state.pending.port}`;renderWiring();return}if(!state.pending){$('wireHint').textContent='步驟1：請先選擇來源 DO';return}state.wires.push({
 id:'wire_'+Date.now(),
 sourceId:state.pending.deviceId,
 sourcePort:state.pending.port,
 targetId:b.dataset.device,
 targetPort:b.dataset.port,
 color:wireColor(state.wires.length)
});state.pending=null;$('wireHint').textContent='接線完成';renderWiring();renderAll();markDirty()}
function drawWires(){
 const canvas=$('wiringCanvas');
 const box=canvas.getBoundingClientRect();
 const svg=$('wireSvg');
 svg.setAttribute('width',Math.max(900,canvas.scrollWidth));
 svg.setAttribute('height',Math.max(500,canvas.scrollHeight));
 svg.innerHTML='';
 normalizeWireColors();

 for(const w of state.wires){
  const source=document.querySelector(`.port.do[data-device="${w.sourceId}"][data-port="${w.sourcePort}"]`);
  const target=document.querySelector(`.port.di[data-device="${w.targetId}"][data-port="${w.targetPort}"]`);
  if(!source||!target)continue;

  const sourceRect=source.getBoundingClientRect();
  const targetRect=target.getBoundingClientRect();
  const x1=sourceRect.right-box.left+canvas.scrollLeft;
  const y1=sourceRect.top+sourceRect.height/2-box.top+canvas.scrollTop;
  const x2=targetRect.left-box.left+canvas.scrollLeft;
  const y2=targetRect.top+targetRect.height/2-box.top+canvas.scrollTop;
  const curve=Math.max(80,Math.abs(x2-x1)*.35);
  const pathData=`M${x1},${y1} C${x1+curve},${y1} ${x2-curve},${y2} ${x2},${y2}`;

  const path=document.createElementNS('http://www.w3.org/2000/svg','path');
  path.setAttribute('d',pathData);
  path.setAttribute('fill','none');
  path.setAttribute('stroke',w.color);
  path.setAttribute('stroke-width',state.activeWires.has(w.id)?'6':'4');
  path.setAttribute('class',state.activeWires.has(w.id)?'wire-active':'wire-colored');
  svg.appendChild(path);

  const label=document.createElementNS('http://www.w3.org/2000/svg','text');
  label.setAttribute('x',String((x1+x2)/2));
  label.setAttribute('y',String((y1+y2)/2-8));
  label.setAttribute('text-anchor','middle');
  label.setAttribute('class','wire-label-text');
  label.textContent=`${w.sourcePort} → ${w.targetPort}`;
  svg.appendChild(label);
 }
}
$('wiringBtn').onclick=()=>{$('wiringDialog').showModal();renderWiring()};$('closeWiring').onclick=()=>$('wiringDialog').close();$('cancelWire').onclick=()=>{state.pending=null;$('wireHint').textContent='尚未選擇來源';renderWiring()};$('clearWires').onclick=()=>{if(confirm('清除全部接線？')){state.wires=[];renderWiring();renderAll();markDirty()}};




$('sceneLibraryBtn')?.addEventListener('click',()=>{
 if(graphicsSettings.sceneLibrary===false){
  $('statusText').textContent='場景庫目前已在畫質設定中關閉';
  return;
 }
 selectedSceneId=currentSceneId;
 document.querySelectorAll('[data-scene-id]').forEach(card=>{
  card.classList.toggle('selected',card.dataset.sceneId===selectedSceneId);
 });
 $('sceneLibraryDialog')?.showModal();
});

$('closeSceneLibrary')?.addEventListener('click',()=>$('sceneLibraryDialog')?.close());

document.querySelectorAll('[data-scene-id]').forEach(card=>{
 card.addEventListener('click',()=>{
  selectedSceneId=card.dataset.sceneId;
  document.querySelectorAll('[data-scene-id]').forEach(item=>{
   item.classList.toggle('selected',item.dataset.sceneId===selectedSceneId);
  });
 });
});

$('applySelectedScene')?.addEventListener('click',()=>{
 applyScene(selectedSceneId);
 $('sceneLibraryDialog')?.close();
 $('statusText').textContent=`場景已切換：${SCENE_DEFINITIONS[currentSceneId].name}`;
});

$('graphicsSettingsBtn')?.addEventListener('click',()=>{
 graphicsSettingsDraft={...graphicsSettings};
 populateGraphicsSettingsUI(graphicsSettingsDraft);
 $('graphicsSettingsDialog')?.showModal();
});
$('closeGraphicsSettings')?.addEventListener('click',()=>$('graphicsSettingsDialog')?.close());
$('cancelGraphicsSettings')?.addEventListener('click',()=>$('graphicsSettingsDialog')?.close());

document.querySelectorAll('[data-quality-preset]').forEach(button=>{
 button.addEventListener('click',()=>{
  const preset=button.dataset.qualityPreset;
  graphicsSettingsDraft={...GRAPHICS_PRESETS[preset]};
  populateGraphicsSettingsUI(graphicsSettingsDraft);
 });
});

[
 'gfxSceneAssets','gfxLighting','gfxHighQualityModels','gfxSceneLibrary',
 'gfxAnimations','gfxShadowQuality','gfxTextureQuality','gfxAntialias',
 'gfxPixelRatio','gfxVegetation'
].forEach(id=>{
 $(id)?.addEventListener('change',markGraphicsCustom);
});

$('resetGraphicsSettings')?.addEventListener('click',()=>{
 const preset=detectRecommendedGraphicsPreset();
 graphicsSettingsDraft={...GRAPHICS_PRESETS[preset]};
 populateGraphicsSettingsUI(graphicsSettingsDraft);
});

$('applyGraphicsSettings')?.addEventListener('click',()=>{
 graphicsSettingsDraft={...graphicsSettingsDraft,...readGraphicsSettingsFromUI()};
 applyGraphicsSettings(graphicsSettingsDraft);
 $('graphicsSettingsDialog')?.close();
 $('statusText').textContent=`畫質設定已套用：${graphicsSettings.preset==='custom'?'自訂':graphicsSettings.preset}`;
});

$('globalLockToggle')?.addEventListener('click',()=>{
 setGlobalMovementLocked(state.globalMovementLocked!==true);
});
updateGlobalLockButton();

$('globalLabelToggle')?.addEventListener('click',()=>{
 setGlobalLabelsVisible(state.globalLabelsVisible===false);
});
updateGlobalLabelButton();
$('resetBtn').onclick=()=>{if(confirm('確定重設全部設備與接線？')){state.items.forEach(i=>group.remove(i.mesh));state.items=[];state.wires=[];state.selectedId=null;renderAll();markDirty()}};

function resize(){const w=$('sceneWrap');renderer.setSize(Math.max(1,w.clientWidth),Math.max(1,w.clientHeight),false);camera.aspect=Math.max(1,w.clientWidth)/Math.max(1,w.clientHeight);camera.updateProjectionMatrix()}
new ResizeObserver(resize).observe($('sceneWrap'));resize();

let lastTimerRender=0;
function tick(now){
 for(const i of state.items){
  if(i.type==='barrier'&&i.runtime.target!==null){
    const t=Math.min(1,(now-i.runtime.start)/Math.max(1,i.runtime.duration));
    const smooth=t*t*(3-2*t);
    i.params.angle=i.runtime.from+(i.runtime.target-i.runtime.from)*smooth;
    const sign=i.params.armSide==='right'?1:-1;
    i.mesh.userData.pivot.rotation.z=THREE.MathUtils.degToRad(sign*i.params.angle);

    // Only update the 2D model during motion.
    // Rebuilding the inspector every frame made DI4 impossible to click.
    renderPlan();

    if(t>=1){
      i.runtime.target=null;
      i.params.angle=i.params.angle>89?90:0;
      i.params.state=i.params.angle>=90?'OPEN':'CLOSED';
      rebuild(i);
      if(i.params.state==='OPEN')scheduleBarrierAutoClose(i);
      else cancelBarrierAutoClose(i);
      propagate(i);
      if(i.id===state.selectedId)renderInspector();
    }
  }
  if(i&&i.type==='timer'&&i.params&&i.params.state==='RUNNING'){
    const p=i.params;
    if(!i.runtime.lastTick)i.runtime.lastTick=now;

    const elapsed=Math.max(0,(now-i.runtime.lastTick)/1000);
    i.runtime.lastTick=now;
    p.remaining=Math.max(0,p.remaining-elapsed);

    const displayedSecond=Math.max(0,Math.ceil(p.remaining));
    if(i.runtime.lastDisplayedSecond!==displayedSecond){
      i.runtime.lastDisplayedSecond=displayedSecond;
      rebuild(i);
      renderPlan();
      if(i.id===state.selectedId){
        renderQuick(i);
        refreshTimerInspectorStatus(i);
      }
    }

    if(p.remaining<=0){
      p.remaining=0;
      p.state='DONE';
      i.runtime.lastTick=0;
      i.runtime.lastDisplayedSecond=0;

      rebuild(i);
      renderPlan();
      if(i.id===state.selectedId){
        renderQuick(i);
        refreshTimerInspectorStatus(i);
      }

      propagate(i);
      markDirty();
    }
  }
 }
 orbit.update();renderer.render(scene,camera);requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

add('barrier',{name:'柵欄機01（入口）',x:-2,z:1,params:{rotation:90,armSide:'right',armLength:4}});
add('barrier',{name:'柵欄機02（出口）',x:2,z:1,params:{rotation:270,armSide:'left',armLength:4}});
add('timer',{name:'倒數計時器01',x:-2.8,z:-2,params:{seconds:30,remaining:30}});
add('traffic',{name:'紅綠燈01',x:2.8,z:-2});
renderAll();

/* =========================================================
   V1.1.4 Google Save Edition
   僅提供獨立儲存模組需要的資料介面，不介入3D與設備核心。
========================================================= */
window.UTOP_STORAGE_API = {
  getProjectData() {
    return {
      version: '1.1.4',
      savedAt: new Date().toISOString(),
      items: state.items.map(({ mesh, runtime, ...item }) => item),
      wires: state.wires,
      globalLabelsVisible: state.globalLabelsVisible!==false,
      globalMovementLocked: state.globalMovementLocked===true,
      graphicsSettings: graphicsSettings,
      sceneId: currentSceneId
    };
  },

  loadProjectData(data) {
    state.items.forEach(item => group.remove(item.mesh));
    state.items = [];
    state.wires = Array.isArray(data?.wires) ? data.wires : [];
    state.globalLabelsVisible=data?.globalLabelsVisible!==false;
    state.globalMovementLocked=data?.globalMovementLocked===true;
    if(data?.graphicsSettings&&typeof data.graphicsSettings==='object'){
      graphicsSettings={...graphicsSettings,...data.graphicsSettings};
      graphicsSettingsDraft={...graphicsSettings};
      applyGraphicsSettings(graphicsSettings);
    }
    currentSceneId=data?.sceneId&&SCENE_DEFINITIONS[data.sceneId]
      ?data.sceneId
      :'basic-lane';
    selectedSceneId=currentSceneId;
    applyScene(currentSceneId,{save:false});
    state.selectedId = null;

    for (const saved of (data?.items || [])) {
      add(saved.type, saved);
    }

    updateGlobalLabelButton();
    updateGlobalLockButton();
    applyGraphicsSettings(graphicsSettings,{save:false});
applyScene(currentSceneId,{save:false});
renderAll();
    $('statusText').textContent = '雲端專案讀取完成';
    $('saveState').textContent = '● 雲端專案已載入';
    $('saveState').style.color = '#36b86b';
  },

  markCloudSaved(fileName) {
    $('saveState').textContent = '● Google Drive 已儲存';
    $('saveState').style.color = '#36b86b';
    $('statusText').textContent = `已儲存：${fileName}`;
  }
};

$('labelModeBtn')?.addEventListener('click',()=>{
  const modes=[LABEL_MODES.ALL,LABEL_MODES.SELECTED,LABEL_MODES.HOVER,LABEL_MODES.HIDDEN];
  const labels={all:'全部',selected:'只顯示選取',hover:'靠近顯示',hidden:'隱藏'};
  sceneSettings.labelMode=modes[(modes.indexOf(sceneSettings.labelMode)+1)%modes.length];
  localStorage.setItem('utopLabelMode',sceneSettings.labelMode);
  $('labelModeBtn').textContent=`🏷 名稱：${labels[sceneSettings.labelMode]}`;
  refreshNameLabels();
});


const WIRE_COLORS=['#2fa9ff','#f4a329','#44d17b','#d65b5b','#b782e5','#4ac9bd','#ff7ab6'];

function ensureWireNodePositions(){
  state.items.forEach((item,index)=>{
    item.wirePosition=item.wirePosition||{
      x:40+(index%4)*310,
      y:50+Math.floor(index/4)*220
    };
  });
}

function enhanceWiringNodes(){
  ensureWireNodePositions();
  document.querySelectorAll('.device-node').forEach(node=>{
    const item=state.items.find(i=>i.id===node.dataset.id||i.id===node.dataset.device);
    if(!item)return;
    node.style.left=`${item.wirePosition.x}px`;
    node.style.top=`${item.wirePosition.y}px`;
    const title=node.querySelector('h3');
    if(!title||title.dataset.dragReady)return;
    title.dataset.dragReady='1';
    title.addEventListener('pointerdown',event=>{
      event.preventDefault();
      node.classList.add('dragging');
      const start={x:event.clientX,y:event.clientY,left:item.wirePosition.x,top:item.wirePosition.y};
      const move=e=>{
        item.wirePosition.x=Math.max(0,start.left+e.clientX-start.x);
        item.wirePosition.y=Math.max(0,start.top+e.clientY-start.y);
        node.style.left=`${item.wirePosition.x}px`;
        node.style.top=`${item.wirePosition.y}px`;
        drawWires?.();
      };
      const up=()=>{
        node.classList.remove('dragging');
        window.removeEventListener('pointermove',move);
        window.removeEventListener('pointerup',up);
        markDirty?.();
      };
      window.addEventListener('pointermove',move);
      window.addEventListener('pointerup',up);
    });
  });
}

function selectWireForAnalysis(wireId){
  sceneSettings.selectedWireId=wireId;
  const wire=state.wires.find(w=>w.id===wireId);
  document.querySelectorAll('#wireSvg path').forEach(path=>{
    path.classList.toggle('selected',path.dataset.wireId===wireId);
    path.classList.toggle('dimmed',path.dataset.wireId!==wireId);
  });
  const related=new Set([wire?.sourceId,wire?.targetId]);
  document.querySelectorAll('.device-node').forEach(node=>{
    const id=node.dataset.id||node.dataset.device;
    node.classList.toggle('focused',related.has(id));
    node.classList.toggle('dimmed',!related.has(id));
  });
  if(wire){
    const source=getItem?.(wire.sourceId)||get?.(wire.sourceId);
    const target=getItem?.(wire.targetId)||get?.(wire.targetId);
    $('wireInfoStatus').textContent=`${source?.name||''} → ${target?.name||''}`;
    $('wireInfoContent').innerHTML=`<div class="wire-info-card">
      <b>來源</b><span>${source?.name||''}｜${wire.sourcePort}</span>
      <b>目標</b><span>${target?.name||''}｜${wire.targetPort}</span>
      <b>訊號方向</b><span>DO → DI</span>
      <button id="clearWireFocus">結束分析</button>
    </div>`;
    
    document.querySelectorAll('[data-wire-row]').forEach(row=>{
      row.classList.toggle('selected',row.dataset.wireRow===wireId);
    });
    $('clearWireFocus').onclick=clearWireAnalysis;
  }
}
function clearWireAnalysis(){
  sceneSettings.selectedWireId=null;
  document.querySelectorAll('#wireSvg path,.device-node').forEach(el=>el.classList.remove('selected','dimmed','focused'));
  if($('wireInfoStatus'))$('wireInfoStatus').textContent='點選連線可查看詳細資料';
  if($('wireInfoContent'))$('wireInfoContent').innerHTML='<p>點選右側清單中的一筆連線，或直接點選畫面上的線路。</p>';
  document.querySelectorAll('[data-wire-row]').forEach(row=>row.classList.remove('selected'));
}

function setWireDrawerOpen(open){
  $('wireInfoDrawer')?.classList.toggle('open',open);
  $('wiringWorkspace')?.classList.toggle('drawer-collapsed',!open);
  $('toggleWireDrawer')?.classList.toggle('drawer-open',open);
  if($('toggleWireDrawer'))$('toggleWireDrawer').textContent=open?'收起清單':'打開連線清單';
  requestAnimationFrame(drawWires);
}

$('closeWireInfo')?.addEventListener('click',()=>setWireDrawerOpen(false));
$('toggleWireDrawer')?.addEventListener('click',()=>{
  setWireDrawerOpen(!$('wireInfoDrawer')?.classList.contains('open'));
});
$('autoArrangeWires')?.addEventListener('click',()=>{
  state.items.forEach((item,index)=>{
    item.wirePosition={x:40+(index%4)*310,y:50+Math.floor(index/4)*220};
  });
  renderWiring?.();
  setTimeout(enhanceWiringNodes,0);
  markDirty?.();
});

const wiringObserver=new MutationObserver(()=>{
  if($('wiringDialog')?.open)setTimeout(enhanceWiringNodes,0);
});
if($('deviceNodes'))wiringObserver.observe($('deviceNodes'),{childList:true,subtree:true});


/* V2.5.1 compact device inspector */
(function(){
 function selectedDevice(){
  try{
   if(typeof state==='undefined'||!state||!Array.isArray(state.items))return null;
   return state.items.find(item=>item.id===state.selectedId)||null;
  }catch(_error){
   return null;
  }
 }

 function syncCompactInspector(){
  const api=window.UTOP_DEVICE_INSPECTOR;
  if(!api)return;
  const device=selectedDevice();

  if(!device){
   api.setTitle('尚未選取設備','點選設備後，可展開屬性、控制及 DI／DO');
   return;
  }

  const name=device.name||device.label||device.type||'已選設備';
  const code=device.code||device.model||device.id||'';
  api.setTitle(
   name,
   code?`${code}｜點擊「展開設定」進行調整`:'點擊「展開設定」進行調整'
  );
 }

 document.addEventListener('click',()=>{
  requestAnimationFrame(syncCompactInspector);
 },true);

 const statusNode=document.querySelector('.selected-device,#selectedDeviceLabel,[data-selection-status]');
 if(statusNode){
  new MutationObserver(()=>requestAnimationFrame(syncCompactInspector))
    .observe(statusNode,{childList:true,subtree:true,characterData:true});
 }

 setTimeout(syncCompactInspector,0);
})();


/* V2.5.3 Connection Editor bridge */
(function(){
 function getAll(){
  try{
   if(typeof state==='undefined'||!Array.isArray(state.wires))return [];
   return state.wires.map((wire,index)=>({
    ...wire,
    id:wire.id||`wire-${index}`,
    sourceName:wire.sourceName||wire.fromName||wire.sourceDeviceName||wire.fromDeviceName,
    sourcePort:wire.sourcePort||wire.fromPort||wire.fromIo,
    targetName:wire.targetName||wire.toName||wire.targetDeviceName||wire.toDeviceName,
    targetPort:wire.targetPort||wire.toPort||wire.toIo
   }));
  }catch(_error){
   return [];
  }
 }

 function remove(id){
  try{
   const index=state.wires.findIndex((wire,wireIndex)=>(wire.id||`wire-${wireIndex}`)===id);
   if(index<0)return;
   state.wires.splice(index,1);
   if(typeof renderWiring==='function')renderWiring();
   if(typeof markDirty==='function')markDirty();
  }catch(error){
   console.error(error);
  }
 }

 function clearAll(){
  try{
   state.wires.length=0;
   if(typeof renderWiring==='function')renderWiring();
   if(typeof markDirty==='function')markDirty();
  }catch(error){
   console.error(error);
  }
 }

 function autoArrange(){
  try{
   if(typeof autoArrangeWiring==='function')autoArrangeWiring();
   else if(typeof arrangeWiring==='function')arrangeWiring();
   if(typeof renderWiring==='function')renderWiring();
  }catch(error){
   console.error(error);
  }
 }

 window.UTOP_CONNECTIONS=Object.freeze({getAll,remove,clearAll,autoArrange});
})();


/* V2.5.5 Quick Control state bridge */
(function(){
 try{
  if(typeof state!=='undefined'){
   window.__UTOP_STATE__=state;
  }
 }catch(_error){}

 document.addEventListener('click',()=>{
  requestAnimationFrame(()=>window.UTOP_QUICK_CONTROL?.refresh?.());
 },true);
})();
