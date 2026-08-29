import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { normalizeHeight, applyHeightToObject } from '../../services/scene-height/index.js';
import { LABEL_MODES, shouldShowLabel } from '../../services/label-service/index.js';
import { applyPartsVisibility } from '../../services/parts-visibility/index.js';
import { ROAD_MARKINGS } from '../../services/road-marking/index.js';


const $=id=>document.getElementById(id);
const defs={
 barrier:{name:'柵欄機',assetId:'PARKING-BARRIER-001',defaults:{armLength:4,rotation:0,armSide:'right',openTime:4,closeTime:4,autoCloseEnabled:false,autoCloseSeconds:5,state:'CLOSED',angle:0,showLabel:true},di:[['DI1','開啟','open'],['DI2','關閉','close'],['DI3','停止','stop'],['DI4','防砸','safety'],['DI5','復歸','reset']],do:[['DO1','全開到位','fullyOpen'],['DO2','全關到位','fullyClosed'],['DO3','運轉中','running'],['DO4','故障','fault']]},
 traffic:{name:'車道紅綠燈',assetId:'PARKING-LIGHT-001',defaults:{showStand:true,rotation:0,mode:'red',showLabel:true},di:[['DI1','紅燈','red'],['DI2','綠燈','green'],['DI3','全關','off']],do:[['DO1','紅燈亮','redOn'],['DO2','綠燈亮','greenOn']]},
 timer:{name:'倒數計時器',assetId:'COUNTDOWN-TIMER-001',defaults:{showStand:true,rotation:0,seconds:10,remaining:10,state:'IDLE',showLabel:true},di:[['DI1','開始','start'],['DI2','暫停／繼續','pause'],['DI3','重設','reset']],do:[['DO1','倒數完成','done'],['DO2','倒數中','running'],['DO3','暫停中','paused'],['DO4','待機','idle']]},
 relay:{name:'繼電器',assetId:'CONTROL-RELAY-001',defaults:{rotation:0,on:false,showLabel:true},di:[['DI1','吸合','on'],['DI2','釋放','off']],do:[['DO1','NO輸出','no'],['DO2','NC輸出','nc']]},
 loop:{name:'地感線圈',assetId:'LANE-LOOP-001',defaults:{rotation:0,width:1.8,length:3,detected:false,showLabel:true},di:[['DI1','車輛進入','vehicle'],['DI2','車輛離開','clear']],do:[['DO1','車輛偵測','detected']]},
 infrared:{name:'紅外線對射',assetId:'LANE-INFRARED-001',defaults:{showStand:true,rotation:0,distance:4,blocked:false,showBeam:true,showLabel:true},di:[['DI1','光束遮斷','blocked'],['DI2','光束恢復','clear']],do:[['DO1','遮斷輸出','blocked'],['DO2','正常輸出','normal']]},
 uhf:{name:'UHF／eTag讀頭',assetId:'LANE-UHF-001',defaults:{showStand:true,rotation:0,readDistance:8,detected:false,lastTag:'E-TAG-001',showLabel:true},di:[['DI1','模擬讀取標籤','read'],['DI2','清除讀取','clear']],do:[['DO1','讀取成功','detected'],['DO2','讀取脈衝','pulse']]},
 cardreader:{name:'車道卡機',assetId:'LANE-CARD-001',defaults:{showStand:true,rotation:0,state:'IDLE',showLabel:true},di:[['DI1','有效卡','valid'],['DI2','無效卡','invalid'],['DI3','清除狀態','clear']],do:[['DO1','允許通行','granted'],['DO2','拒絕通行','denied']]},
 ledpanel:{name:'紅綠燈倒數顯示器',assetId:'LANE-LED-001',defaults:{showStand:true,rotation:0,mode:'red',seconds:10,remaining:10,state:'IDLE',blinkLastFive:true,buzzerLastFive:true,showLabel:true},di:[['DI1','紅燈','red'],['DI2','綠燈','green'],['DI3','開始倒數','start'],['DI4','重設倒數','reset'],['DI5','全關','off']],do:[['DO1','紅燈亮','redOn'],['DO2','綠燈亮','greenOn'],['DO3','倒數完成','done'],['DO4','最後五秒','lastFive']]},
 lpr:{name:'車牌辨識攝影機',assetId:'LANE-LPR-001',defaults:{showStand:true,rotation:0,state:'IDLE',plate:'ABC-1234',confidence:98,showLabel:true},di:[['DI1','辨識有效車牌','valid'],['DI2','辨識無效車牌','invalid'],['DI3','清除結果','clear']],do:[['DO1','辨識成功','recognized'],['DO2','辨識失敗','denied']]},
shutter:{name:'鐵捲門',assetId:'ACCESS-SHUTTER-001',
 defaults:{
  rotation:0,state:'CLOSED',showLabel:true,
  openDurationSeconds:12,closeDurationSeconds:12,
  doorProgress:0,motionRemainingSeconds:0,
  autoCloseEnabled:false,closeDelaySeconds:5,
  commandContact:'NO',stopContact:'NC',
  safetyContact:'NC',limitContact:'NC',
  safetyActive:false,fault:false
 },
 di:[
  ['DI1','OPEN_CMD｜開門命令（NO）','open'],
  ['DI2','STOP_CMD｜停止命令（NC）','stop'],
  ['DI3','CLOSE_CMD｜關門命令（NO）','close'],
  ['DI4','SAFETY_EDGE｜防壓安全邊（NC）','safety'],
  ['DI5','PHOTO_BEAM｜紅外線防夾（NC）','photoBeam'],
  ['DI6','AUTO_CLOSE｜自動關門允許','autoClose'],
  ['DI7','RESET｜故障復歸','reset']
 ],
 do:[
  ['DO1','OPEN_LIMIT｜全開到位','openLimit'],
  ['DO2','CLOSE_LIMIT｜全關到位','closeLimit'],
  ['DO3','MOTOR_UP｜開門運轉','motorUp'],
  ['DO4','MOTOR_DOWN｜關門運轉','motorDown'],
  ['DO5','SAFETY_ACTIVE｜防壓觸發','safetyActive'],
  ['DO6','SAFETY_STOP｜防壓停止','safetyStop'],
  ['DO7','SAFETY_REVERSE｜防壓反轉','safetyReversing'],
  ['DO8','FAULT｜故障輸出','fault']
 ]},
 beacon:{name:'警示燈',assetId:'WARNING-BEACON-001',defaults:{rotation:0,on:false,flash:false,showLabel:true},di:[['DI1','LAMP_ON｜啟動','on'],['DI2','LAMP_OFF｜停止','off'],['DI3','FLASH_CMD｜閃爍','flash'],['DI4','RESET｜復歸','reset']],do:[['DO1','LAMP_ACTIVE｜燈號輸出','active'],['DO2','FLASHING｜閃爍中','flashing']]},
 bollard:{name:'防撞柱',assetId:'LANE-BOLLARD-001',defaults:{rotation:0,raised:true,showLabel:true},di:[['DI1','RAISE_CMD｜升起','raise'],['DI2','LOWER_CMD｜下降','lower'],['DI3','STOP_CMD｜停止','stop']],do:[['DO1','UP_LIMIT｜升起到位','up'],['DO2','DOWN_LIMIT｜下降到位','down']]},
 intercom:{name:'車道對講機',assetId:'ACCESS-INTERCOM-001',defaults:{rotation:0,calling:false,online:true,showLabel:true},di:[['DI1','CALL_BUTTON｜呼叫按鈕','call'],['DI2','ANSWER｜接聽','answer'],['DI3','HANGUP｜掛斷','hangup']],do:[['DO1','CALL_ACTIVE｜呼叫中','calling'],['DO2','TALK_ACTIVE｜通話中','talking'],['DO3','ONLINE｜連線','online']]},
 ipcamera:{name:'網路攝影機',assetId:'CCTV-IPCAM-001',defaults:{rotation:0,online:true,motion:false,showLabel:true},di:[['DI1','MOTION_TRIGGER｜移動觸發','motion'],['DI2','ALARM_IN｜警報輸入','alarm'],['DI3','RESET｜清除','reset']],do:[['DO1','ONLINE｜連線狀態','online'],['DO2','RECORDING｜錄影中','recording'],['DO3','ALARM_OUT｜警報輸出','alarmOut']]},
 controller:{name:'門禁控制器',assetId:'ACCESS-CTRL-001',defaults:{rotation:0,online:true,showLabel:true},di:[['DI1','DOOR_SENSOR｜門磁','doorSensor'],['DI2','EXIT_BUTTON｜開門按鈕','exitButton'],['DI3','FIRE_INPUT｜消防輸入','fire'],['DI4','TAMPER｜防拆','tamper']],do:[['DO1','LOCK_RELAY｜門鎖繼電器','lock'],['DO2','ALARM_RELAY｜警報繼電器','alarm'],['DO3','BUZZER｜蜂鳴器','buzzer'],['DO4','ONLINE｜連線狀態','online']]},
 poeswitch:{name:'PoE交換器',assetId:'NETWORK-POE-001',defaults:{rotation:0,online:true,ports:8,showLabel:true},di:[['DI1','POWER_STATUS｜電源狀態','power'],['DI2','UPLINK_STATUS｜上行連線','uplink'],['DI3','RESET｜重啟','reset']],do:[['DO1','ONLINE｜交換器連線','online'],['DO2','POE_FAULT｜PoE故障','poeFault'],['DO3','PORT_ALARM｜埠異常','portAlarm']]},
 powersupply:{name:'電源供應器',assetId:'POWER-SUPPLY-001',defaults:{rotation:0,on:true,fault:false,voltage:24,showLabel:true},di:[['DI1','AC_INPUT｜交流電源','acInput'],['DI2','REMOTE_ON｜遠端啟動','remoteOn'],['DI3','RESET｜復歸','reset']],do:[['DO1','DC_OK｜直流正常','dcOk'],['DO2','FAULT｜故障輸出','fault'],['DO3','LOW_VOLTAGE｜低電壓','lowVoltage']]},
loopdetector:{name:'地感檢知器',assetId:'LANE-LOOP-DETECTOR-001',defaults:{rotation:0,mode:'PRESENCE',vehicle:false,pulse:false,fault:false,ready:true,sensitivity:4,frequency:'MID',contact:'NO',showLabel:true},di:[['DI1','LOOP_INPUT｜線圈偵測','vehicle'],['DI2','CLEAR｜車輛離開','clear'],['DI3','TEST_PULSE｜脈衝測試','pulse'],['DI4','LOOP_FAULT｜線圈故障','fault'],['DI5','RESET｜重新校正','reset']],do:[['DO1','PRESENCE_OUT｜車輛存在','presence'],['DO2','PULSE_OUT｜脈衝輸出','pulseOut'],['DO3','LOOP_FAULT｜線圈故障','faultOut'],['DO4','READY｜設備正常','ready']]},
 radar:{name:'車道雷達感應器',assetId:'LANE-RADAR-001',defaults:{rotation:0,enabled:true,vehicle:false,person:false,direction:'BOTH',distance:6,sensitivity:5,holdSeconds:1,contact:'NO',fault:false,showLabel:true},di:[['DI1','TEST_VEHICLE｜車輛測試','vehicle'],['DI2','TEST_PERSON｜人員測試','person'],['DI3','DEPARTURE｜離開測試','depart'],['DI4','ENABLE｜啟用／停用','disable'],['DI5','RESET｜復歸','reset']],do:[['DO1','VEHICLE_DETECT｜車輛偵測','vehicleOut'],['DO2','PERSON_DETECT｜人員偵測','personOut'],['DO3','APPROACH｜接近','approach'],['DO4','DEPARTURE｜離開','departure'],['DO5','FAULT｜故障','faultOut']]},
 estop:{name:'緊急停止按鈕',assetId:'SAFETY-ESTOP-001',defaults:{rotation:0,pressed:false,released:false,resetRequired:false,wireFault:false,contact:'NC',dualChannel:true,showLabel:true},di:[['DI1','E_STOP_CH1｜急停通道1','press'],['DI2','RELEASE｜旋轉解除','release'],['DI3','RESET｜確認復歸','reset'],['DI4','WIRE_FAULT｜線路斷線','wireFault']],do:[['DO1','STOP_ACTIVE｜急停生效','stopActive'],['DO2','RESET_REQUIRED｜等待復歸','resetRequired'],['DO3','CIRCUIT_FAULT｜迴路故障','circuitFault'],['DO4','READY｜安全迴路正常','ready']]},
 laneindicator:{name:'LED方向箭頭',assetId:'DISPLAY-LANE-ARROW-001',defaults:{rotation:0,mode:'straight',flashing:false,brightness:100,showStand:true,showLabel:true},di:[['DI1','LEFT_CMD｜左轉命令','left'],['DI2','RIGHT_CMD｜右轉命令','right'],['DI3','STRAIGHT_CMD｜直行命令','straight'],['DI4','STOP_CMD｜禁止通行','stop'],['DI5','FLASH_CMD｜閃爍命令','flash'],['DI6','OFF_CMD｜關閉','off']],do:[['DO1','LEFT_ACTIVE｜左箭頭','leftOn'],['DO2','RIGHT_ACTIVE｜右箭頭','rightOn'],['DO3','STRAIGHT_ACTIVE｜直行','straightOn'],['DO4','STOP_ACTIVE｜紅叉','stopOn'],['DO5','FLASHING｜閃爍中','flashing']]},
 parkingdisplay:{name:'滿位／車位顯示器',assetId:'DISPLAY-PARKING-COUNT-001',defaults:{rotation:0,total:100,available:28,mode:'COUNT',fault:false,showStand:true,showLabel:true},di:[['DI1','VEHICLE_IN｜車輛進入','vehicleIn'],['DI2','VEHICLE_OUT｜車輛離開','vehicleOut'],['DI3','FULL_CMD｜滿位命令','full'],['DI4','AVAILABLE_CMD｜尚有車位','available'],['DI5','RESET｜數量復歸','reset']],do:[['DO1','FULL_STATUS｜滿位狀態','fullStatus'],['DO2','AVAILABLE_STATUS｜尚有車位','availableStatus'],['DO3','COUNT_ZERO｜剩餘為零','countZero'],['DO4','DISPLAY_ACTIVE｜顯示運作','displayActive'],['DO5','FAULT｜故障','faultOut']]},
 heightbar:{name:'限高架',assetId:'BUILDING-HEIGHT-BAR-001',defaults:{rotation:0,heightLimit:2.1,width:4,overheight:false,sensorEnabled:true,showLabel:true},di:[['DI1','NORMAL_VEHICLE｜正常車輛','normal'],['DI2','HEIGHT_SENSOR｜超高感應','overheight'],['DI3','CLEAR_ALARM｜清除警報','clear'],['DI4','RESET｜復歸','reset']],do:[['DO1','OVERHEIGHT｜超高警報','overheightOut'],['DO2','WARNING_LIGHT｜警示燈','warningLight'],['DO3','BUZZER｜蜂鳴器','buzzer']]},
 delaytimer:{name:'延遲計時器',assetId:'CONTROL-DELAY-TIMER-001',defaults:{rotation:0,delaySeconds:5,state:'IDLE',output:false,remaining:0,showLabel:true},di:[['DI1','START｜開始計時','start'],['DI2','STOP｜停止','stop'],['DI3','RESET｜復歸','reset']],do:[['DO1','TIMING｜計時中','timing'],['DO2','TIME_UP｜時間到','timeUp'],['DO3','RELAY_OUT｜延遲輸出','relayOut']]},
 poweroffdelay:{name:'斷電延時繼電器',assetId:'CONTROL-OFF-DELAY-001',defaults:{rotation:0,delaySeconds:5,power:true,state:'ENERGIZED',output:true,remaining:0,showLabel:true},di:[['DI1','POWER_ON｜通電','powerOn'],['DI2','POWER_OFF｜斷電','powerOff'],['DI3','RESET｜復歸','reset']],do:[['DO1','RELAY_OUT｜繼電器輸出','relayOut'],['DO2','OFF_DELAY｜斷電延時中','timing'],['DO3','RELEASED｜已釋放','released']]},
 powerondelay:{name:'通電延遲計時器',assetId:'CONTROL-ON-DELAY-001',defaults:{rotation:0,delaySeconds:5,power:false,state:'IDLE',output:false,remaining:0,showLabel:true},di:[['DI1','POWER_ON｜通電開始','powerOn'],['DI2','POWER_OFF｜斷電復歸','powerOff'],['DI3','RESET｜復歸','reset']],do:[['DO1','ON_DELAY｜通電延時中','timing'],['DO2','RELAY_OUT｜延遲輸出','relayOut'],['DO3','POWER_STATUS｜電源狀態','powerStatus']]},
 signal2way:{name:'雙向號誌主機',assetId:'SIGNAL-2WAY-001',defaults:{rotation:0,mode:'ALL_RED',intervalSeconds:10,auto:false,state:'READY',showLabel:true},di:[['DI1','LANE_A_CALL｜A向需求','laneA'],['DI2','LANE_B_CALL｜B向需求','laneB'],['DI3','ALL_RED｜全紅','allRed'],['DI4','AUTO｜自動交換','auto'],['DI5','RESET｜復歸','reset']],do:[['DO1','LANE_A_GREEN｜A向綠燈','laneAGreen'],['DO2','LANE_A_RED｜A向紅燈','laneARed'],['DO3','LANE_B_GREEN｜B向綠燈','laneBGreen'],['DO4','LANE_B_RED｜B向紅燈','laneBRed'],['DO5','AUTO_ACTIVE｜自動模式','autoActive']]},
 signal3way:{name:'三向號誌主機',assetId:'SIGNAL-3WAY-001',defaults:{rotation:0,mode:'ALL_RED',intervalSeconds:10,auto:false,state:'READY',showLabel:true},di:[['DI1','LANE_A_CALL｜A向需求','laneA'],['DI2','LANE_B_CALL｜B向需求','laneB'],['DI3','LANE_C_CALL｜C向需求','laneC'],['DI4','ALL_RED｜全紅','allRed'],['DI5','AUTO｜自動交換','auto'],['DI6','RESET｜復歸','reset']],do:[['DO1','LANE_A_GREEN｜A向綠燈','laneAGreen'],['DO2','LANE_B_GREEN｜B向綠燈','laneBGreen'],['DO3','LANE_C_GREEN｜C向綠燈','laneCGreen'],['DO4','ALL_RED｜全紅狀態','allRedStatus'],['DO5','AUTO_ACTIVE｜自動模式','autoActive']]},
};

const DEFAULT_SCENE_HEIGHT_RANGE=Object.freeze({
 min:-20,
 max:20,
 step:.1,
 source:'default'
});
let currentSceneHeightRange={
 ...(window.UTOP_SCENE_HEIGHT_RANGE||DEFAULT_SCENE_HEIGHT_RANGE)
};

function normalizeSceneHeightRange(range={}){
 let min=Number(range.min);
 let max=Number(range.max);
 let step=Number(range.step);

 if(!Number.isFinite(min))min=DEFAULT_SCENE_HEIGHT_RANGE.min;
 if(!Number.isFinite(max))max=DEFAULT_SCENE_HEIGHT_RANGE.max;
 if(min>max)[min,max]=[max,min];
 if(max-min<1){
  const center=(min+max)/2;
  min=center-.5;
  max=center+.5;
 }
 if(!Number.isFinite(step)||step<=0)step=.1;

 return {
  min:Math.floor(min*10)/10,
  max:Math.ceil(max*10)/10,
  step,
  source:String(range.source||'scene')
 };
}

function getSceneHeightRange(){
 const external=window.UTOP_SCENE_HEIGHT_RANGE;
 if(external){
  currentSceneHeightRange=normalizeSceneHeightRange(external);
 }
 return {...currentSceneHeightRange};
}

function updateHeightControls(){
 const range=getSceneHeightRange();
 const numberInput=$('fY');
 const slider=$('heightRange');

 for(const control of [numberInput,slider]){
  if(!control)continue;
  control.min=String(range.min);
  control.max=String(range.max);
  control.step=String(range.step);
  control.dataset.heightSource=range.source;
 }

 if(numberInput){
  numberInput.title=`可調高度：${range.min}m ～ ${range.max}m`;
 }
 if(slider){
  slider.title=`場景高度範圍：${range.min}m ～ ${range.max}m`;
 }

 const selected=get?.(state?.selected);
 if(selected){
  const next=Math.min(range.max,Math.max(range.min,Number(selected.y)||0));
  if(numberInput)numberInput.value=String(next);
  if(slider)slider.value=String(next);
 }

 const label=$('heightRangeLabel');
 if(label){
  label.textContent=`${range.min}m ～ ${range.max}m`;
 }
}

function setSceneHeightRange(range={}){
 currentSceneHeightRange=normalizeSceneHeightRange(range);
 window.UTOP_SCENE_HEIGHT_RANGE={...currentSceneHeightRange};
 updateHeightControls();

 window.dispatchEvent(new CustomEvent(
  'utop-scene-height-range-change',
  {detail:{...currentSceneHeightRange}}
 ));

 window.UTOP_DEBUG?.record?.(
  'ACTION',
  'Scene',
  '更新場景設備高度範圍',
  currentSceneHeightRange
 );
 return {...currentSceneHeightRange};
}

function resetSceneHeightRange(){
 return setSceneHeightRange(DEFAULT_SCENE_HEIGHT_RANGE);
}

window.addEventListener(
 'utop-scene-height-range-change',
 event=>{
  if(event.detail){
   currentSceneHeightRange=normalizeSceneHeightRange(event.detail);
   window.UTOP_SCENE_HEIGHT_RANGE={...currentSceneHeightRange};
  }
  updateHeightControls();
 }
);

const state={globalMovementLocked:false,globalLabelsVisible:true,items:[],wires:[],selectedId:null,next:1,pending:null,activeWires:new Set(),activeTab:'properties'};

const GRAPHICS_STORAGE_KEY='utop3d.graphics.v2.max-default';
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
   return {...GRAPHICS_PRESETS.ultra,...saved,preset:saved.preset||'ultra'};
  }
 }catch(error){
  console.warn('[UTOP-3D] 畫質設定讀取失敗',error);
 }
 return {...GRAPHICS_PRESETS.ultra};
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
const DEFAULT_SCENE_BOUNDS=Object.freeze({
 minX:-7.4,
 maxX:7.4,
 minZ:-8.2,
 maxZ:8.2
});
window.UTOP_PLAN_WORLD_BOUNDS={
 minX:DEFAULT_SCENE_BOUNDS.minX,
 maxX:DEFAULT_SCENE_BOUNDS.maxX,
 minZ:DEFAULT_SCENE_BOUNDS.minZ,
 maxZ:DEFAULT_SCENE_BOUNDS.maxZ
};
window.UTOP_ACTIVE_PLAN_RENDERER=null;

function activeSceneBounds(){
 const bounds=window.UTOP_PLAN_WORLD_BOUNDS||DEFAULT_SCENE_BOUNDS;
 return {
  minX:Number.isFinite(Number(bounds.minX))?Number(bounds.minX):DEFAULT_SCENE_BOUNDS.minX,
  maxX:Number.isFinite(Number(bounds.maxX))?Number(bounds.maxX):DEFAULT_SCENE_BOUNDS.maxX,
  minZ:Number.isFinite(Number(bounds.minZ))?Number(bounds.minZ):DEFAULT_SCENE_BOUNDS.minZ,
  maxZ:Number.isFinite(Number(bounds.maxZ))?Number(bounds.maxZ):DEFAULT_SCENE_BOUNDS.maxZ
 };
}
function planTransform(){
 const bounds=activeSceneBounds();
 const left=60,right=700,top=42,bottom=610;
 return {
  bounds,left,right,top,bottom,
  scaleX:(right-left)/Math.max(.001,bounds.maxX-bounds.minX),
  scaleZ:(bottom-top)/Math.max(.001,bounds.maxZ-bounds.minZ)
 };
}
function worldToPlan(x,z){
 const t=planTransform();
 return {
  x:t.left+(Number(x)-t.bounds.minX)*t.scaleX,
  y:t.top+(Number(z)-t.bounds.minZ)*t.scaleZ
 };
}
function planToWorld(x,y){
 const t=planTransform();
 return {
  x:t.bounds.minX+(Number(x)-t.left)/t.scaleX,
  z:t.bounds.minZ+(Number(y)-t.top)/t.scaleZ
 };
}

function clampNumber(value,min,max){
 return Math.max(min,Math.min(max,Number(value)||0));
}

function clampDevicePosition(item,x=item.x,z=item.z){
 const bounds=activeSceneBounds();
 const nextX=clampNumber(x,bounds.minX,bounds.maxX);
 const nextZ=clampNumber(z,bounds.minZ,bounds.maxZ);
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
 updateHeightControls();
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

const hemiLight=new THREE.HemisphereLight(0xeaf6ff,0x56634d,1.25);
scene.add(hemiLight);
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

// V4.1.0：記錄基礎場景靜態物件。
// 單車道場景會暫時隱藏原本雙車道底板，避免重疊與白色閃爍。
const baseSceneStaticObjects=[ground,road];

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
 baseSceneStaticObjects.push(sidewalk);

 const curb=new THREE.Mesh(
  new THREE.BoxGeometry(.22,.18,18),
  new THREE.MeshStandardMaterial({color:0xbfc4c6,roughness:.85})
 );
 curb.position.set(x+(x<0?1.46:-1.46),.09,0);
 curb.castShadow=true;
 curb.receiveShadow=true;
 scene.add(curb);
 baseSceneStaticObjects.push(curb);
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
 baseSceneStaticObjects.push(grass);
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
 selectedSceneId=currentManagedSceneId;

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
baseSceneStaticObjects.push(roadCenterLine3D);

function setBaseSceneVisible(visible){
 const next=visible!==false;
 baseSceneStaticObjects.forEach(object=>{
  if(object)object.visible=next;
 });
 sceneEnvironmentRoot.visible=next&&(graphicsSettings.sceneAssets!==false);
 renderer.render(scene,camera);
}
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


function addStandPart(group,mesh){
 mesh.name='utopModuleStand';
 mesh.userData=mesh.userData||{};
 mesh.userData.partRole='stand';
 group.add(mesh);
 return mesh;
}

function shouldShowStand(params){
 return params?.showStand!==false;
}

function makeModel(item){
 const g=new THREE.Group(),p=item.params;
 if(item.type==='barrier'){
   const orange=mat(0xe89200,{roughness:.28,metalness:.56});
   const orangeDark=mat(0xb96500,{roughness:.36,metalness:.48});
   const orangeLight=mat(0xffa814,{roughness:.24,metalness:.5});
   const black=mat(0x111417,{roughness:.38,metalness:.26});
   const rubber=mat(0x181a1c,{roughness:.88,metalness:.02});
   const white=mat(0xf0f1ed,{roughness:.3,metalness:.42});
   const red=mat(0xd71920,{roughness:.24,metalness:.2});
   const silver=mat(0x9ca4a8,{roughness:.25,metalness:.78});

   // Real machine dimensions: H 1.03m × W .34m × D .28m.
   const cabinet=new THREE.Mesh(
     new THREE.BoxGeometry(.34,.72,.28),
     orange
   );
   cabinet.position.y=.38;
   cabinet.castShadow=true;
   cabinet.receiveShadow=true;
   g.add(cabinet);

   // Bottom plinth and front recess.
   const base=new THREE.Mesh(
     new THREE.BoxGeometry(.36,.055,.30),
     rubber
   );
   base.position.y=.0275;
   base.castShadow=true;
   g.add(base);

   const frontDoor=new THREE.Mesh(
     new THREE.BoxGeometry(.286,.57,.012),
     orangeDark
   );
   frontDoor.position.set(0,.40,.146);
   frontDoor.castShadow=true;
   g.add(frontDoor);

   const doorInset=new THREE.Mesh(
     new THREE.BoxGeometry(.254,.535,.009),
     orange
   );
   doorInset.position.set(0,.40,.153);
   g.add(doorInset);

   // Door lock cylinder.
   const lockRing=new THREE.Mesh(
     new THREE.CylinderGeometry(.018,.018,.014,24),
     silver
   );
   lockRing.rotation.x=Math.PI/2;
   lockRing.position.set(.092,.22,.164);
   g.add(lockRing);

   const lockCore=new THREE.Mesh(
     new THREE.CylinderGeometry(.008,.008,.018,20),
     black
   );
   lockCore.rotation.x=Math.PI/2;
   lockCore.position.set(.092,.22,.172);
   g.add(lockCore);

   // Rounded-looking upper motor housing built from layered boxes.
   const headLower=new THREE.Mesh(
     new THREE.BoxGeometry(.37,.19,.31),
     orange
   );
   headLower.position.y=.825;
   headLower.castShadow=true;
   g.add(headLower);

   const headTop=new THREE.Mesh(
     new THREE.BoxGeometry(.34,.135,.29),
     orangeLight
   );
   headTop.position.y=.9825;
   headTop.castShadow=true;
   g.add(headTop);

   const crown=new THREE.Mesh(
     new THREE.BoxGeometry(.29,.035,.255),
     orangeLight
   );
   crown.position.y=1.067;
   crown.castShadow=true;
   g.add(crown);

   // Camera / pivot lens on front face.
   const lensOuter=new THREE.Mesh(
     new THREE.CylinderGeometry(.047,.047,.022,32),
     black
   );
   lensOuter.rotation.x=Math.PI/2;
   lensOuter.position.set(-.075,.948,.169);
   g.add(lensOuter);

   const lensInner=new THREE.Mesh(
     new THREE.SphereGeometry(.022,24,14),
     mat(0x050607,{roughness:.08,metalness:.08})
   );
   lensInner.position.set(-.075,.948,.184);
   g.add(lensInner);

   const lensHighlight=new THREE.Mesh(
     new THREE.SphereGeometry(.006,14,8),
     new THREE.MeshBasicMaterial({color:0x8fdcff})
   );
   lensHighlight.position.set(-.082,.957,.204);
   g.add(lensHighlight);

   // Rear/side ventilation slots.
   for(let slot=0;slot<4;slot++){
     const vent=new THREE.Mesh(
       new THREE.BoxGeometry(.055,.008,.008),
       black
     );
     vent.position.set(-.105,.36+slot*.025,-.146);
     g.add(vent);
   }

   // Small screws on cabinet corners.
   const screwPositions=[
     [-.145,.075,.147],[.145,.075,.147],
     [-.145,.705,.147],[.145,.705,.147]
   ];
   screwPositions.forEach(([x,y,z])=>{
     const screw=new THREE.Mesh(
       new THREE.CylinderGeometry(.005,.005,.006,12),
       silver
     );
     screw.rotation.x=Math.PI/2;
     screw.position.set(x,y,z);
     g.add(screw);
   });

   // Arm pivot and adjustable boom.
   const sign=p.armSide==='right'?1:-1;
   const pivot=new THREE.Group();
   pivot.position.set(sign*.195,.865,0);

   const pivotHub=new THREE.Mesh(
     new THREE.CylinderGeometry(.075,.075,.12,32),
     black
   );
   pivotHub.rotation.x=Math.PI/2;
   pivotHub.position.z=.01;
   pivot.add(pivotHub);

   const armLength=Math.max(.5,Number(p.armLength)||2.5);
   const arm=new THREE.Mesh(
     new THREE.BoxGeometry(armLength,.105,.105),
     white
   );
   arm.position.x=sign*armLength/2;
   arm.castShadow=true;
   pivot.add(arm);

   // Upper and lower aluminum edging.
   const edgeTop=new THREE.Mesh(
     new THREE.BoxGeometry(armLength,.012,.112),
     silver
   );
   edgeTop.position.set(sign*armLength/2,.052,0);
   pivot.add(edgeTop);

   const edgeBottom=edgeTop.clone();
   edgeBottom.position.y=-.052;
   pivot.add(edgeBottom);

   // Reflective red panels, front and rear.
   const panelWidth=.38;
   for(let distance=.55;distance<armLength-.18;distance+=.82){
     const width=Math.min(panelWidth,armLength-distance-.08);
     if(width<=.06)continue;
     [-.056,.056].forEach(z=>{
       const stripe=new THREE.Mesh(
         new THREE.BoxGeometry(width,.064,.008),
         red
       );
       stripe.position.set(sign*(distance+width/2),0,z);
       stripe.castShadow=true;
       pivot.add(stripe);
     });
   }

   // Black rubber end cap.
   const endCap=new THREE.Mesh(
     new THREE.BoxGeometry(.12,.125,.125),
     rubber
   );
   endCap.position.x=sign*(armLength+.055);
   endCap.castShadow=true;
   pivot.add(endCap);

   pivot.rotation.z=THREE.MathUtils.degToRad(sign*p.angle);
   g.add(pivot);
   g.userData.pivot=pivot;
   g.userData.realDimensions={height:1.03,width:.34,depth:.28};
 }else if(item.type==='traffic'){
   const dark=mat(0x111416,{roughness:.38,metalness:.22});
   const metal=mat(0x687278,{roughness:.32,metalness:.72});
   const visor=mat(0x252a2d,{roughness:.45,metalness:.18});
   if(shouldShowStand(p)){
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.055,.065,1.55,20),metal);
    pole.position.y=.775;addStandPart(g,pole);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.19,.23,.08,24),dark);
    base.position.y=.04;addStandPart(g,base);
   }
   const housing=new THREE.Mesh(new THREE.BoxGeometry(.46,1.02,.34),dark);
   housing.position.y=1.85;g.add(housing);
   [2.08,1.65].forEach((y,index)=>{
    // 遮光罩改為燈面上方的短帽沿，不再遮住燈面。
    const hood=new THREE.Mesh(
      new THREE.BoxGeometry(.40,.055,.24),
      visor
    );
    hood.position.set(0,y+.19,.235);
    hood.rotation.x=-.16;
    g.add(hood);

    const active=index===0?p.mode==='red':p.mode==='green';
    const colour=index===0?0xff0000:0x00df55;
    const inactive=index===0?0x350000:0x053518;
    const lensMaterial=new THREE.MeshPhysicalMaterial({
      color:active?colour:inactive,
      roughness:.12,
      metalness:0,
      clearcoat:1,
      clearcoatRoughness:.05,
      emissive:active?colour:inactive,
      emissiveIntensity:active?4.2:.035
    });
    const lens=new THREE.Mesh(
      new THREE.SphereGeometry(.145,32,20),
      lensMaterial
    );
    lens.position.set(0,y,.185);
    g.add(lens);
   });
   const serviceDoor=new THREE.Mesh(new THREE.BoxGeometry(.32,.22,.012),mat(0x242a2d,{roughness:.55,metalness:.35}));
   serviceDoor.position.set(0,1.33,.176);g.add(serviceDoor);
 }else if(item.type==='timer'){
   const cabinet=mat(0x131719,{roughness:.34,metalness:.28});
   const metal=mat(0x656f74,{roughness:.34,metalness:.7});
   if(shouldShowStand(p)){
    const pole=new THREE.Mesh(new THREE.BoxGeometry(.09,1.25,.09),metal);
    pole.position.y=.625;addStandPart(g,pole);
    const foot=new THREE.Mesh(new THREE.BoxGeometry(.34,.07,.3),mat(0x252b2e,{roughness:.55,metalness:.4}));
    foot.position.y=.035;addStandPart(g,foot);
   }
   const box=new THREE.Mesh(new THREE.BoxGeometry(1.18,.72,.25),cabinet);
   box.position.y=1.62;g.add(box);
   const hood=new THREE.Mesh(new THREE.BoxGeometry(1.28,.12,.38),mat(0x30373a,{roughness:.5,metalness:.46}));
   hood.position.set(0,2.04,-.03);hood.rotation.x=-.08;g.add(hood);
   const screenFrame=new THREE.Mesh(new THREE.BoxGeometry(1.01,.53,.035),mat(0x030405,{roughness:.22,metalness:.18}));
   screenFrame.position.set(0,1.63,.143);g.add(screenFrame);
   const displayMat=new THREE.MeshBasicMaterial({map:makeTextTexture(String(Math.max(0,Math.ceil(p.remaining))).padStart(2,'0'))});
   const display=new THREE.Mesh(new THREE.PlaneGeometry(.9,.44),displayMat);
   display.position.set(0,1.63,.163);g.add(display);g.userData.display=display;
 }else if(item.type==='loop'){
   const width=(Number.isFinite(Number(p.width))&&Number(p.width)>0)?Number(p.width):1.8;
   const length=(Number.isFinite(Number(p.length))&&Number(p.length)>0)?Number(p.length):3;
   const shape=new THREE.Shape();
   const radius=Math.min(.18,width*.12,length*.08);
   const left=-width/2,right=width/2,top=-length/2,bottom=length/2;
   shape.moveTo(left+radius,top);shape.lineTo(right-radius,top);shape.quadraticCurveTo(right,top,right,top+radius);
   shape.lineTo(right,bottom-radius);shape.quadraticCurveTo(right,bottom,right-radius,bottom);shape.lineTo(left+radius,bottom);
   shape.quadraticCurveTo(left,bottom,left,bottom-radius);shape.lineTo(left,top+radius);shape.quadraticCurveTo(left,top,left+radius,top);
   const points=shape.getPoints(48).map(pt=>new THREE.Vector3(pt.x,.035,pt.y));
   const curve=new THREE.CatmullRomCurve3(points,true,'centripetal');
   const cable=new THREE.Mesh(new THREE.TubeGeometry(curve,96,.035,10,true),new THREE.MeshStandardMaterial({color:p.detected?0x49e57f:0x5f6263,roughness:.58,metalness:.05,emissive:p.detected?0x0d6c2c:0x000000,emissiveIntensity:p.detected?1.3:0}));
   g.add(cable);
   const groove=new THREE.Mesh(new THREE.BoxGeometry(width+.12,.018,length+.12),new THREE.MeshStandardMaterial({color:0x24292b,roughness:.9,metalness:0,transparent:true,opacity:.32}));
   groove.position.y=.01;g.add(groove);
   const joint=new THREE.Mesh(new THREE.BoxGeometry(.16,.06,.12),mat(0xd0a427,{roughness:.5,metalness:.32}));
   joint.position.set(width/2+.02,.05,length/2-.16);g.add(joint);
 }else if(item.type==='infrared'){
   const distance=Math.max(.1,Number(p.distance)||4),half=distance/2;
   const postMat=mat(0x3d4549,{roughness:.42,metalness:.56}),dark=mat(0x101416,{roughness:.32,metalness:.2});
   [-half,half].forEach((x,index)=>{
    if(shouldShowStand(p)){
     const post=new THREE.Mesh(new THREE.BoxGeometry(.16,1.25,.16),postMat);post.position.set(x,.625,0);addStandPart(g,post);
     const base=new THREE.Mesh(new THREE.BoxGeometry(.29,.07,.27),dark);base.position.set(x,.035,0);addStandPart(g,base);
    }
    const head=new THREE.Mesh(new THREE.BoxGeometry(.26,.38,.23),dark);head.position.set(x,1.34,0);g.add(head);
    const glass=new THREE.Mesh(new THREE.BoxGeometry(.15,.2,.025),new THREE.MeshPhysicalMaterial({color:index?0x5dcfff:0xff5555,roughness:.08,transmission:.18,clearcoat:.65,emissive:index?0x1f7ca0:0x7b1414,emissiveIntensity:p.blocked?.2:1.2}));
    glass.position.set(x,1.35,.128);g.add(glass);
   });
   if(p.showBeam!==false){
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,distance,10),new THREE.MeshBasicMaterial({color:p.blocked?0xff3535:0x43dfff,transparent:true,opacity:p.blocked?.22:.78}));
    beam.rotation.z=Math.PI/2;beam.position.set(0,1.35,0);g.add(beam);
   }
 }else if(item.type==='uhf'){
   if(shouldShowStand(p)){
    const stand=new THREE.Mesh(new THREE.CylinderGeometry(.055,.075,.82,18),mat(0x697378,{roughness:.36,metalness:.68}));
    stand.position.y=.41;addStandPart(g,stand);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.2,.24,.07,24),mat(0x252b2e,{roughness:.58,metalness:.42}));
    base.position.y=.035;addStandPart(g,base);
   }
   const body=new THREE.Mesh(new THREE.BoxGeometry(.78,.92,.18),new THREE.MeshPhysicalMaterial({color:0xe1e4df,roughness:.3,metalness:.12,clearcoat:.52,clearcoatRoughness:.2}));
   body.position.y=1.28;g.add(body);
   const face=new THREE.Mesh(new THREE.BoxGeometry(.59,.7,.035),mat(0x18232a,{roughness:.3,metalness:.22}));
   face.position.set(0,1.28,.108);g.add(face);
   [0.11,.2,.29].forEach((radius,index)=>{
    const arc=new THREE.Mesh(new THREE.TorusGeometry(radius,.012,8,24,Math.PI),new THREE.MeshBasicMaterial({color:p.detected?0x42d7ff:0x45616e}));
    arc.rotation.z=-Math.PI/2;arc.position.set(-.04,1.29,.132+index*.001);g.add(arc);
   });
   const led=new THREE.Mesh(new THREE.SphereGeometry(.025,12,8),new THREE.MeshBasicMaterial({color:p.detected?0x42ff7a:0x284334}));
   led.position.set(.24,1.0,.132);g.add(led);
 }else if(item.type==='cardreader'){
   const bodyMat=new THREE.MeshPhysicalMaterial({color:0x737d82,roughness:.34,metalness:.5,clearcoat:.42,clearcoatRoughness:.25});
   if(shouldShowStand(p)){
    const base=new THREE.Mesh(new THREE.BoxGeometry(.46,.64,.42),bodyMat);base.position.y=.32;addStandPart(g,base);
    const foot=new THREE.Mesh(new THREE.BoxGeometry(.52,.06,.48),mat(0x252b2f,{roughness:.6,metalness:.35}));foot.position.y=.03;addStandPart(g,foot);
   }
   const head=new THREE.Mesh(new THREE.BoxGeometry(.55,.72,.5),bodyMat);head.position.y=.95;head.rotation.x=-.06;g.add(head);
   const face=new THREE.Mesh(new THREE.BoxGeometry(.41,.54,.035),mat(0x11181c,{roughness:.24,metalness:.18}));face.position.set(0,.97,.267);g.add(face);
   const col=p.state==='GRANTED'?0x2ee078:p.state==='DENIED'?0xff3b3b:0x2d7fab;
   const screen=new THREE.Mesh(new THREE.BoxGeometry(.29,.12,.018),new THREE.MeshBasicMaterial({color:col}));screen.position.set(0,1.14,.29);g.add(screen);
   const slot=new THREE.Mesh(new THREE.BoxGeometry(.27,.025,.014),mat(0x030405,{roughness:.2,metalness:.08}));slot.position.set(0,.92,.294);g.add(slot);
   const nfc=new THREE.Mesh(new THREE.TorusGeometry(.065,.01,7,22,Math.PI*1.4),new THREE.MeshBasicMaterial({color:0x4dc9ff}));nfc.rotation.z=.85;nfc.position.set(.1,.78,.294);g.add(nfc);
 }else if(item.type==='ledpanel'){
   if(shouldShowStand(p)){
    const stand=new THREE.Mesh(new THREE.BoxGeometry(.12,1.12,.12),mat(0x697277,{roughness:.34,metalness:.72}));
    stand.position.y=.56;addStandPart(g,stand);
    const base=new THREE.Mesh(new THREE.BoxGeometry(.4,.07,.34),mat(0x252b2e,{roughness:.58,metalness:.42}));
    base.position.y=.035;addStandPart(g,base);
   }
   const box=new THREE.Mesh(new THREE.BoxGeometry(1.65,.86,.2),mat(0x131718,{roughness:.32,metalness:.34}));box.position.y=1.55;g.add(box);
   const hood=new THREE.Mesh(new THREE.BoxGeometry(1.74,.1,.34),mat(0x303638,{roughness:.5,metalness:.45}));hood.position.set(0,2.03,-.03);g.add(hood);
   const red=new THREE.Mesh(new THREE.SphereGeometry(.15,24,14),new THREE.MeshPhysicalMaterial({color:p.mode==='red'?0xff2222:0x451010,emissive:p.mode==='red'?0xff1111:0x1a0505,emissiveIntensity:p.mode==='red'?3:.08,roughness:.16,clearcoat:.7}));
   red.position.set(-.56,1.72,.12);g.add(red);
   const green=new THREE.Mesh(new THREE.SphereGeometry(.15,24,14),new THREE.MeshPhysicalMaterial({color:p.mode==='green'?0x22e56e:0x103d21,emissive:p.mode==='green'?0x18dc63:0x04180b,emissiveIntensity:p.mode==='green'?3:.08,roughness:.16,clearcoat:.7}));
   green.position.set(-.56,1.33,.12);g.add(green);
   const displayFrame=new THREE.Mesh(new THREE.BoxGeometry(.72,.55,.024),mat(0x020303,{roughness:.18,metalness:.1}));displayFrame.position.set(.35,1.52,.113);g.add(displayFrame);
   const dm=new THREE.MeshBasicMaterial({map:makeTextTexture(String(Math.max(0,Math.ceil(p.remaining))).padStart(2,'0'))});
   const display=new THREE.Mesh(new THREE.PlaneGeometry(.64,.47),dm);display.position.set(.35,1.52,.13);g.add(display);
 }else if(item.type==='lpr'){
   const white=new THREE.MeshPhysicalMaterial({color:0xe5e7e3,roughness:.28,metalness:.22,clearcoat:.55,clearcoatRoughness:.18});
   const dark=mat(0x151a1d,{roughness:.28,metalness:.24});
   const metal=mat(0x697378,{roughness:.34,metalness:.72});
   if(shouldShowStand(p)){
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.055,.07,.86,18),metal);pole.position.y=.43;addStandPart(g,pole);
    const bracket=new THREE.Mesh(new THREE.BoxGeometry(.08,.28,.36),metal);bracket.position.set(0,.9,-.14);bracket.rotation.x=-.35;addStandPart(g,bracket);
   }
   const body=new THREE.Mesh(new THREE.CylinderGeometry(.24,.28,.78,30),white);body.rotation.z=Math.PI/2;body.position.y=1.15;g.add(body);
   const frontRing=new THREE.Mesh(new THREE.CylinderGeometry(.215,.215,.07,30),dark);frontRing.rotation.z=Math.PI/2;frontRing.position.set(.42,1.15,0);g.add(frontRing);
   const lens=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,.085,28),new THREE.MeshPhysicalMaterial({color:0x07131a,roughness:.06,transmission:.08,clearcoat:.9,emissive:p.state==='VALID'?0x0e6c35:p.state==='INVALID'?0x6d1111:0x07131a,emissiveIntensity:.6}));
   lens.rotation.z=Math.PI/2;lens.position.set(.465,1.15,0);g.add(lens);
   for(let angle=0;angle<Math.PI*2;angle+=Math.PI/3){
    const ir=new THREE.Mesh(new THREE.SphereGeometry(.022,10,7),new THREE.MeshBasicMaterial({color:0x5a1414}));
    ir.position.set(.512,1.15+Math.sin(angle)*.155,Math.cos(angle)*.155);g.add(ir);
   }
   const hood=new THREE.Mesh(new THREE.BoxGeometry(.84,.07,.64),white);hood.position.set(.03,1.45,0);g.add(hood);


 }else if(item.type==='loopdetector'){
   const box=new THREE.Mesh(new THREE.BoxGeometry(.72,.9,.42),mat(0xbfc5c3,{roughness:.42,metalness:.42}));box.position.y=.46;g.add(box);
   const face=new THREE.Mesh(new THREE.BoxGeometry(.55,.55,.025),mat(0x151b1e));face.position.set(0,.5,.224);g.add(face);
   const led=new THREE.Mesh(new THREE.SphereGeometry(.035,12,8),new THREE.MeshBasicMaterial({color:p.fault?0xff3333:p.vehicle?0x38ef76:0x31503d}));led.position.set(.18,.65,.245);g.add(led);
 }else if(item.type==='radar'){
   const body=new THREE.Mesh(new THREE.BoxGeometry(.62,.72,.22),new THREE.MeshPhysicalMaterial({color:0xdfe3df,roughness:.3,clearcoat:.5}));body.position.y=.75;g.add(body);
   const face=new THREE.Mesh(new THREE.BoxGeometry(.48,.54,.025),mat(0x18242a));face.position.set(0,.75,.123);g.add(face);
   [0.1,.18,.26].forEach(r=>{const a=new THREE.Mesh(new THREE.TorusGeometry(r,.01,7,24,Math.PI),new THREE.MeshBasicMaterial({color:p.vehicle?0x44dcff:0x49616b}));a.rotation.z=-Math.PI/2;a.position.set(-.04,.75,.14);g.add(a)});
 }else if(item.type==='estop'){
   const base=new THREE.Mesh(new THREE.CylinderGeometry(.25,.28,.16,28),mat(0xe0b31c));base.position.y=.08;g.add(base);
   const head=new THREE.Mesh(new THREE.CylinderGeometry(.19,.23,.3,28),mat(p.pressed?0x8c0000:0xdc1111,{roughness:.28}));head.position.y=p.pressed?.22:.32;g.add(head);
 }else if(item.type==='laneindicator'){
   if(p.showStand!==false){const stand=new THREE.Mesh(new THREE.BoxGeometry(.1,1.2,.1),mat(0x687277,{metalness:.7}));stand.position.y=.6;g.add(stand)}
   const box=new THREE.Mesh(new THREE.BoxGeometry(1.3,.72,.18),mat(0x111516));box.position.y=1.55;g.add(box);
   const symbol=p.mode==='left'?'←':p.mode==='right'?'→':p.mode==='stop'?'✕':p.mode==='off'?'':'↑';
   const plane=new THREE.Mesh(new THREE.PlaneGeometry(1.1,.55),new THREE.MeshBasicMaterial({map:makeTextTexture(symbol),transparent:true}));plane.position.set(0,1.55,.1);g.add(plane);
 }else if(item.type==='parkingdisplay'){
   if(p.showStand!==false){const stand=new THREE.Mesh(new THREE.BoxGeometry(.12,1.1,.12),mat(0x687277,{metalness:.7}));stand.position.y=.55;g.add(stand)}
   const box=new THREE.Mesh(new THREE.BoxGeometry(1.55,.7,.18),mat(0x111516));box.position.y=1.5;g.add(box);
   const txt=p.available<=0?'FULL':`P ${p.available}`;
   const plane=new THREE.Mesh(new THREE.PlaneGeometry(1.35,.52),new THREE.MeshBasicMaterial({map:makeTextTexture(txt)}));plane.position.set(0,1.5,.1);g.add(plane);
 }else if(item.type==='heightbar'){
   const h=Math.max(1,Number(p.heightLimit)||2.1),w=Math.max(2,Number(p.width)||4);
   [-w/2,w/2].forEach(x=>{const post=new THREE.Mesh(new THREE.BoxGeometry(.16,h,.16),mat(0xd7a513));post.position.set(x,h/2,0);g.add(post)});
   const beam=new THREE.Mesh(new THREE.BoxGeometry(w+.3,.24,.22),mat(p.overheight?0xe52b22:0xd7a513));beam.position.y=h;g.add(beam);

 }else if(item.type==='shutter'){
   const frame=mat(0x646d71,{roughness:.42,metalness:.68});
   const slat=mat(0x8e9699,{roughness:.4,metalness:.72});
   [-1.45,1.45].forEach(x=>{
    const post=new THREE.Mesh(new THREE.BoxGeometry(.18,2.8,.2),frame);
    post.position.set(x,1.4,0);g.add(post);
   });
   const top=new THREE.Mesh(new THREE.BoxGeometry(3.1,.26,.28),frame);
   top.position.y=2.76;g.add(top);
   const progress=Math.max(0,Math.min(1,Number(p.doorProgress)||0));
   const doorHeight=.25+(1-progress)*2.2;
   for(let y=.18;y<doorHeight;y+=.13){
    const strip=new THREE.Mesh(new THREE.BoxGeometry(2.72,.1,.08),slat);
    strip.position.set(0,2.62-y,0);g.add(strip);
   }
 }else if(item.type==='beacon'){
   const base=new THREE.Mesh(new THREE.CylinderGeometry(.22,.26,.14,24),mat(0x171b1d));
   base.position.y=.07;g.add(base);
   const lens=new THREE.Mesh(new THREE.CylinderGeometry(.18,.2,.42,28),new THREE.MeshPhysicalMaterial({color:p.on?0xff2525:0x671414,transparent:true,opacity:.72,roughness:.18,clearcoat:.8,emissive:p.on?0xff1515:0x190404,emissiveIntensity:p.on?2.5:.08}));
   lens.position.y=.34;g.add(lens);
   const cap=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.05,28),mat(0x33383a));
   cap.position.y=.575;g.add(cap);
 }else if(item.type==='bollard'){
   const body=new THREE.Mesh(new THREE.CylinderGeometry(.16,.19,p.raised?1.05:.22,24),mat(0xe0a312,{roughness:.35,metalness:.5}));
   body.position.y=(p.raised?1.05:.22)/2;g.add(body);
   [0.27,.58,.89].forEach(y=>{
    if(!p.raised&&y>.2)return;
    const stripe=new THREE.Mesh(new THREE.CylinderGeometry(.165,.165,.12,24),mat(0x15191b));
    stripe.position.y=y;g.add(stripe);
   });
 }else if(item.type==='intercom'){
   const body=new THREE.Mesh(new THREE.BoxGeometry(.5,1.05,.23),mat(0xaab1b4,{roughness:.35,metalness:.55}));
   body.position.y=.55;g.add(body);
   const speaker=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.025,24),mat(0x242a2d));
   speaker.rotation.x=Math.PI/2;speaker.position.set(0,.78,.13);g.add(speaker);
   for(let n=0;n<9;n++){
    const hole=new THREE.Mesh(new THREE.SphereGeometry(.012,8,5),mat(0x16191b));
    hole.position.set((n%3-1)*.055,.43+Math.floor(n/3)*.055,.132);g.add(hole);
   }
 }else if(item.type==='ipcamera'){
   const body=new THREE.Mesh(new THREE.CylinderGeometry(.18,.22,.66,28),mat(0xd9ddda,{roughness:.28,metalness:.25}));
   body.rotation.z=Math.PI/2;body.position.y=.8;g.add(body);
   const lens=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,.07,26),mat(0x071117,{roughness:.08,metalness:.1}));
   lens.rotation.z=Math.PI/2;lens.position.set(.36,.8,0);g.add(lens);
   const arm=new THREE.Mesh(new THREE.BoxGeometry(.1,.5,.1),mat(0x737d82,{roughness:.35,metalness:.65}));
   arm.position.set(-.18,.42,0);arm.rotation.z=-.35;g.add(arm);
 }else if(item.type==='controller'){
   const box=new THREE.Mesh(new THREE.BoxGeometry(1.25,.95,.35),mat(0xc2c7c5,{roughness:.38,metalness:.45}));
   box.position.y=.5;g.add(box);
   for(let n=0;n<8;n++){
    const terminal=new THREE.Mesh(new THREE.BoxGeometry(.09,.09,.05),mat(n%2?0x33383b:0x54bd73));
    terminal.position.set(-.48+n*.14,.73,.2);g.add(terminal);
   }
   const rail=new THREE.Mesh(new THREE.BoxGeometry(1.1,.12,.06),mat(0x2c3134));
   rail.position.set(0,.22,.2);g.add(rail);
 }else if(item.type==='poeswitch'){
   const box=new THREE.Mesh(new THREE.BoxGeometry(1.55,.32,.72),mat(0x252c30,{roughness:.38,metalness:.58}));
   box.position.y=.18;g.add(box);
   for(let n=0;n<8;n++){
    const port=new THREE.Mesh(new THREE.BoxGeometry(.13,.11,.04),mat(0x071014));
    port.position.set(-.57+n*.165,.18,.38);g.add(port);
   }
 }else if(DELAY_CONTROL_TYPES.has(item.type)||SIGNAL_HOST_TYPES.has(item.type)){
   const isSignal=SIGNAL_HOST_TYPES.has(item.type);
   const w=isSignal?1.25:.76,h=isSignal?.92:.78,d=isSignal?.34:.42;
   const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(isSignal?0xd7dad7:0xbec5c5,{roughness:.35,metalness:.5}));body.position.y=h/2;g.add(body);
   const face=new THREE.Mesh(new THREE.BoxGeometry(w*.82,h*.72,.025),mat(0x172127));face.position.set(0,h*.52,d/2+.015);g.add(face);
   const label=item.type==='signal2way'?'2 WAY':item.type==='signal3way'?'3 WAY':item.type==='poweroffdelay'?'OFF DELAY':item.type==='powerondelay'?'ON DELAY':'DELAY';
   const screen=new THREE.Mesh(new THREE.PlaneGeometry(w*.68,h*.24),new THREE.MeshBasicMaterial({map:makeTextTexture(label),transparent:true}));screen.position.set(0,h*.65,d/2+.032);g.add(screen);
   const ledColors=isSignal?[p.mode==='LANE_A'?0x31df6c:0x8d2424,p.mode==='LANE_B'?0x31df6c:0x8d2424,item.type==='signal3way'&&p.mode==='LANE_C'?0x31df6c:0x8d2424]:[p.state==='DONE'||p.output?0x31df6c:p.state==='TIMING'?0xf2b12f:0x52636c];
   ledColors.forEach((color,n)=>{const led=new THREE.Mesh(new THREE.SphereGeometry(.045,12,8),new THREE.MeshBasicMaterial({color}));led.position.set((n-(ledColors.length-1)/2)*.22,h*.32,d/2+.04);g.add(led)});
 }else if(item.type==='powersupply'){
   const box=new THREE.Mesh(new THREE.BoxGeometry(1.05,.52,.7),mat(0xbfc4c1,{roughness:.42,metalness:.62}));
   box.position.y=.28;g.add(box);
   for(let n=0;n<12;n++){
    const vent=new THREE.Mesh(new THREE.BoxGeometry(.025,.25,.03),mat(0x555d60));
    vent.position.set(-.42+n*.075,.32,.365);g.add(vent);
   }
   const led=new THREE.Mesh(new THREE.SphereGeometry(.025,10,6),new THREE.MeshBasicMaterial({color:p.fault?0xff3030:0x40ef77}));
   led.position.set(.4,.15,.37);g.add(led);

 }else{
   // Industrial plug-in relay with transparent cover, visible coil/contact
   // structure, socket terminals, status LED and test button.
   const socketMat=mat(0x222b31,{roughness:.58,metalness:.2});
   const terminalMat=mat(0xb9c1c5,{roughness:.25,metalness:.82});
   const copperMat=mat(0xb87333,{roughness:.3,metalness:.78});
   const coilMat=mat(p.on?0xd65a24:0x8a3f20,{roughness:.46,metalness:.34});
   const contactMat=mat(p.on?0x58d67a:0xaeb6ba,{roughness:.28,metalness:.72});
   const coverMat=new THREE.MeshPhysicalMaterial({
     color:p.on?0x79bde0:0x91b8ce,
     roughness:.12,
     metalness:0,
     transparent:true,
     opacity:.38,
     transmission:.4,
     thickness:.04,
     ior:1.47,
     clearcoat:.7,
     clearcoatRoughness:.12
   });

   const socket=new THREE.Mesh(
     new THREE.BoxGeometry(.76,.22,.56),
     socketMat
   );
   socket.position.y=.11;
   g.add(socket);

   // Eight socket terminals.
   [-.27,-.09,.09,.27].forEach(x=>{
     [-.235,.235].forEach(z=>{
       const terminal=new THREE.Mesh(
         new THREE.BoxGeometry(.075,.18,.065),
         terminalMat
       );
       terminal.position.set(x,.06,z);
       g.add(terminal);
     });
   });

   const relayCore=new THREE.Group();
   relayCore.position.y=.24;

   const coil=new THREE.Mesh(
     new THREE.CylinderGeometry(.12,.12,.34,24),
     coilMat
   );
   coil.rotation.z=Math.PI/2;
   coil.position.set(-.12,.23,0);
   relayCore.add(coil);

   const ironCore=new THREE.Mesh(
     new THREE.BoxGeometry(.42,.065,.12),
     contactMat
   );
   ironCore.position.set(.06,.22,0);
   relayCore.add(ironCore);

   const armature=new THREE.Mesh(
     new THREE.BoxGeometry(.30,.04,.11),
     contactMat
   );
   armature.position.set(.12,p.on?.34:.39,0);
   armature.rotation.z=p.on?-.12:.08;
   relayCore.add(armature);

   // Copper contact arms.
   [-.13,.13].forEach(z=>{
     const contact=new THREE.Mesh(
       new THREE.BoxGeometry(.30,.025,.035),
       copperMat
     );
     contact.position.set(.12,.46,z);
     contact.rotation.z=p.on?-.08:.04;
     relayCore.add(contact);
   });

   const cover=new THREE.Mesh(
     new THREE.BoxGeometry(.68,.72,.50),
     coverMat
   );
   cover.position.y=.38;
   g.add(relayCore);
   g.add(cover);

   const indicator=new THREE.Mesh(
     new THREE.SphereGeometry(.042,18,10),
     new THREE.MeshBasicMaterial({
       color:p.on?0x42ff7a:0x183525
     })
   );
   indicator.position.set(-.21,.72,.26);
   g.add(indicator);

   const testButton=new THREE.Mesh(
     new THREE.CylinderGeometry(.052,.052,.035,20),
     mat(0xe89d23,{roughness:.35,metalness:.1})
   );
   testButton.rotation.x=Math.PI/2;
   testButton.position.set(.18,.72,.27);
   g.add(testButton);

   g.userData.relayStyle='industrial-plug-in-transparent';
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
   y:normalizeHeight(savedHeight,getSceneHeightRange().min,getSceneHeightRange().max),
   z:saved.z??0,
   params:{
     ...clone(d.defaults),
     installationHeight:normalizeHeight(savedHeight,getSceneHeightRange().min,getSceneHeightRange().max),
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
 i.y=normalizeHeight(i.y??i.params?.installationHeight??0,getSceneHeightRange().min,getSceneHeightRange().max);
 clampDevicePosition(i,i.x,i.z);
 i.mesh.position.set(i.x,i.y,i.z);
 applyHeightToObject(i);
 applyPartsVisibility(i);
 group.add(i.mesh);
 refreshNameLabels();
}
function select(id){
 state.selectedId=id;
 refreshNameLabels();
 renderAll();
 const item=get(id);
 if(item){
  renderQuick(item);
  window.dispatchEvent(new CustomEvent(
   'utop-primary-selection-changed',
   {detail:{id:item.id,name:item.name,type:item.type}}
  ));
  window.setTimeout(()=>window.UTOP_QUICK_CONTROL?.refresh?.(),0);
 }
}

const DELAY_CONTROL_TYPES=new Set(['delaytimer','poweroffdelay','powerondelay']);
const SIGNAL_HOST_TYPES=new Set(['signal2way','signal3way']);
function cancelControlRuntime(item){
 if(!item?.runtime)return;
 if(item.runtime.controlTimer){clearInterval(item.runtime.controlTimer);item.runtime.controlTimer=null;}
 if(item.runtime.signalTimer){clearInterval(item.runtime.signalTimer);item.runtime.signalTimer=null;}
}
function startDelayRuntime(item,kind){
 cancelControlRuntime(item);
 const p=item.params;
 const seconds=Math.max(1,Math.min(999,Number(p.delaySeconds)||5));
 p.remaining=seconds;p.state='TIMING';
 const finish=()=>{
  cancelControlRuntime(item);p.remaining=0;
  if(kind==='off'){p.output=false;p.state='RELEASED';}
  else{p.output=true;p.state='DONE';}
  rebuild(item);renderAll();propagate(item);
 };
 item.runtime.controlTimer=setInterval(()=>{
  p.remaining=Math.max(0,p.remaining-.1);
  if(p.remaining<=0)finish();
  if(item.id===state.selectedId){renderQuick(item);renderInspector();}
 },100);
}
function startSignalAuto(item){
 cancelControlRuntime(item);const p=item.params;
 p.auto=true;const modes=item.type==='signal3way'?['LANE_A','LANE_B','LANE_C']:['LANE_A','LANE_B'];let idx=0;
 p.mode=modes[idx];
 item.runtime.signalTimer=setInterval(()=>{idx=(idx+1)%modes.length;p.mode=modes[idx];rebuild(item);renderAll();propagate(item);},Math.max(1,Number(p.intervalSeconds)||10)*1000);
}

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
 if(i.type==='loopdetector')return{presence:p.vehicle,pulseOut:p.pulse,faultOut:p.fault,ready:p.ready&&!p.fault};
 if(i.type==='radar')return{vehicleOut:p.vehicle,personOut:p.person,approach:p.vehicle&&p.direction!=='DEPART',departure:p.direction==='DEPART',faultOut:p.fault};
 if(i.type==='estop')return{stopActive:p.pressed||p.wireFault,resetRequired:p.resetRequired,circuitFault:p.wireFault,ready:!p.pressed&&!p.wireFault&&!p.resetRequired};
 if(i.type==='laneindicator')return{leftOn:p.mode==='left',rightOn:p.mode==='right',straightOn:p.mode==='straight',stopOn:p.mode==='stop',flashing:p.flashing};
 if(i.type==='parkingdisplay')return{fullStatus:p.available<=0,availableStatus:p.available>0,countZero:p.available<=0,displayActive:!p.fault,faultOut:p.fault};
 if(i.type==='heightbar')return{overheightOut:p.overheight,warningLight:p.overheight,buzzer:p.overheight};
 if(i.type==='delaytimer')return{timing:p.state==='TIMING',timeUp:p.state==='DONE',relayOut:Boolean(p.output)};
 if(i.type==='poweroffdelay')return{relayOut:Boolean(p.output),timing:p.state==='TIMING',released:p.state==='RELEASED'};
 if(i.type==='powerondelay')return{timing:p.state==='TIMING',relayOut:Boolean(p.output),powerStatus:Boolean(p.power)};
 if(i.type==='signal2way')return{laneAGreen:p.mode==='LANE_A',laneARed:p.mode!=='LANE_A',laneBGreen:p.mode==='LANE_B',laneBRed:p.mode!=='LANE_B',autoActive:Boolean(p.auto)};
 if(i.type==='signal3way')return{laneAGreen:p.mode==='LANE_A',laneBGreen:p.mode==='LANE_B',laneCGreen:p.mode==='LANE_C',allRedStatus:p.mode==='ALL_RED',autoActive:Boolean(p.auto)};
 if(i.type==='shutter')return{
  openLimit:p.state==='OPEN',
  closeLimit:p.state==='CLOSED',
  motorUp:p.state==='OPENING',
  motorDown:p.state==='CLOSING',
  safetyActive:Boolean(p.safetyActive),
  safetyStop:p.state==='SAFETY_STOP',
  safetyReversing:p.state==='SAFETY_REVERSING',
  fault:Boolean(p.fault)
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


function controlLedPanelCountdown(item,action){
 if(!item||item.type!=='ledpanel'||!item.params)return;
 const p=item.params;
 const now=performance.now();

 if(action==='start'){
  if(p.state==='RUNNING')return;
  if(p.remaining<=0||p.state==='DONE'||p.state==='IDLE'){
   p.remaining=Math.max(1,Number(p.seconds)||10);
  }
  p.state='RUNNING';
  item.runtime.lastTick=now;
  item.runtime.lastDisplayedSecond=null;
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
  renderInspector();
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


function cancelShutterAutoClose(item){
 if(!item?.runtime)return;
 if(item.runtime.shutterAutoCloseTimer){
  clearTimeout(item.runtime.shutterAutoCloseTimer);
  item.runtime.shutterAutoCloseTimer=null;
 }
}

function scheduleShutterAutoClose(item){
 cancelShutterAutoClose(item);
 const p=item?.params;
 if(!p?.autoCloseEnabled||p.state!=='OPEN')return;
 const delay=Math.max(0,Number(p.closeDelaySeconds)||0)*1000;
 item.runtime.shutterAutoCloseTimer=setTimeout(()=>{
  if(!state.items.includes(item)||item.params.state!=='OPEN')return;
  input(item,'close');
 },delay);
}

function cancelShutterMotion(item){
 if(!item?.runtime)return;
 if(item.runtime.shutterMotionFrame){
  cancelAnimationFrame(item.runtime.shutterMotionFrame);
  item.runtime.shutterMotionFrame=null;
 }
 item.runtime.shutterMotionStartedAt=0;
}

function startShutterMotion(item,targetProgress,stateName){
 const p=item.params;
 cancelShutterAutoClose(item);
 cancelShutterMotion(item);

 const startProgress=Math.max(0,Math.min(1,Number(p.doorProgress)||0));
 const target=Math.max(0,Math.min(1,targetProgress));
 const fullSeconds=target>startProgress
  ?Math.max(.2,Number(p.openDurationSeconds)||12)
  :Math.max(.2,Number(p.closeDurationSeconds)||12);
 const duration=Math.max(.12,fullSeconds*Math.abs(target-startProgress))*1000;

 p.state=stateName;
 item.runtime.shutterMotionStartedAt=performance.now();

 const tick=now=>{
  if(!state.items.includes(item))return;
  if(!item.runtime.shutterMotionStartedAt)return;

  const elapsed=now-item.runtime.shutterMotionStartedAt;
  const ratio=Math.min(1,elapsed/duration);
  p.doorProgress=startProgress+(target-startProgress)*ratio;
  p.motionRemainingSeconds=Math.max(0,(duration-elapsed)/1000);

  rebuild(item);
  renderPlan();

  if(item.id===state.selectedId){
   renderQuick(item);
   renderInspector();
   window.UTOP_QUICK_CONTROL?.refresh?.();
  }

  if(ratio<1){
   item.runtime.shutterMotionFrame=requestAnimationFrame(tick);
   return;
  }

  cancelShutterMotion(item);
  p.doorProgress=target;
  p.motionRemainingSeconds=0;
  p.state=target>=1?'OPEN':'CLOSED';

  rebuild(item);
  renderAll();
  renderQuick(item);
  renderInspector();
  window.UTOP_QUICK_CONTROL?.refresh?.();

  if(p.state==='OPEN')scheduleShutterAutoClose(item);
 };

 item.runtime.shutterMotionFrame=requestAnimationFrame(tick);
}

function refreshShutterInterface(item,message=''){
 rebuild(item);
 renderPlan();

 if(item.id===state.selectedId){
  renderQuick(item);
  renderInspector();
  window.UTOP_QUICK_CONTROL?.refresh?.();
 }

 if(message){
  const status=$('statusText');
  if(status)status.textContent=`${item.name}：${message}`;
 }
}

function controlRollingShutter(item,key){
 const p=item.params;

 if(key==='open'){
  p.safetyActive=false;
  p.lastCommand='OPEN';
  startShutterMotion(item,1,'OPENING');
  refreshShutterInterface(item,'開始開門');
  return;
 }

 if(key==='stop'){
  const wasMoving=p.state==='OPENING'||p.state==='CLOSING';
  cancelShutterAutoClose(item);
  cancelShutterMotion(item);
  p.motionRemainingSeconds=0;
  p.state='STOPPED';
  p.lastCommand='STOP';
  refreshShutterInterface(
   item,
   wasMoving
    ?`已停止，保留目前開度 ${Math.round((Number(p.doorProgress)||0)*100)}%`
    :'目前已停止'
  );
  return;
 }

 if(key==='close'){
  if(p.safetyActive){
   cancelShutterMotion(item);
   p.state='SAFETY_STOP';
   p.motionRemainingSeconds=0;
   refreshShutterInterface(item,'防壓尚未解除，禁止關門');
   return;
  }

  p.lastCommand='CLOSE';
  startShutterMotion(item,0,'CLOSING');
  refreshShutterInterface(item,'開始關門');
  return;
 }

 if(key==='safety'||key==='photoBeam'){
  const wasClosing=p.state==='CLOSING';
  p.safetyActive=true;
  p.lastCommand='SAFETY';

  cancelShutterAutoClose(item);

  if(wasClosing){
   // Stop at the exact current opening, then reverse immediately.
   cancelShutterMotion(item);
   p.motionRemainingSeconds=0;
   p.state='SAFETY_REVERSING';
   refreshShutterInterface(item,'防壓觸發，關門停止並反向開啟');

   requestAnimationFrame(()=>{
    if(!state.items.includes(item))return;
    startShutterMotion(item,1,'OPENING');
    refreshShutterInterface(item,'防壓反向開門中');
   });
  }else{
   // Even when not closing, the safety input has a visible state.
   cancelShutterMotion(item);
   p.motionRemainingSeconds=0;
   p.state='SAFETY_STOP';
   refreshShutterInterface(item,'防壓訊號已觸發');
  }
  return;
 }

 if(key==='clearSafety'){
  p.safetyActive=false;
  if(p.state==='SAFETY_STOP'){
   p.state='STOPPED';
  }
  refreshShutterInterface(item,'防壓訊號已解除');
  return;
 }

 if(key==='autoClose'){
  p.autoCloseEnabled=!p.autoCloseEnabled;
  if(p.autoCloseEnabled&&p.state==='OPEN'){
   scheduleShutterAutoClose(item);
  }else{
   cancelShutterAutoClose(item);
  }
  refreshShutterInterface(
   item,
   p.autoCloseEnabled?'自動關門已啟用':'自動關門已關閉'
  );
  return;
 }

 if(key==='reset'){
  cancelShutterAutoClose(item);
  cancelShutterMotion(item);
  p.fault=false;
  p.safetyActive=false;
  p.doorProgress=0;
  p.motionRemainingSeconds=0;
  p.lastCommand='RESET';
  p.state='CLOSED';
  refreshShutterInterface(item,'已復歸至全關位置');
 }
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
   if(key==='reset'){
    cancelBarrierAutoClose(i);
    i.runtime.target=null;
    i.runtime.lastTick=0;
    p.angle=0;
    p.state='CLOSED';
    rebuild(i);
    renderPlan();
    if(i.id===state.selectedId){
      renderQuick(i);
      renderInspector();
    }
    const status=$('statusText');
    if(status)status.textContent=`${i.name}：已復歸至關閉初始狀態`;
   }
 }else if(i.type==='loopdetector'){
   if(key==='vehicle'){p.vehicle=true;p.pulse=p.mode==='PULSE';}
   if(key==='clear'){p.vehicle=false;p.pulse=false;}
   if(key==='pulse'){p.pulse=true;setTimeout(()=>{p.pulse=false;rebuild(i);renderAll()},350);}
   if(key==='fault'){p.fault=true;p.ready=false;}
   if(key==='reset'){p.vehicle=false;p.pulse=false;p.fault=false;p.ready=true;}
   rebuild(i);
 }else if(i.type==='radar'){
   if(key==='vehicle'){p.enabled=true;p.vehicle=true;p.person=false;p.direction='APPROACH';}
   if(key==='person'){p.enabled=true;p.person=true;p.vehicle=false;}
   if(key==='depart'){p.vehicle=false;p.person=false;p.direction='DEPART';}
   if(key==='disable'){p.enabled=!p.enabled;p.vehicle=false;p.person=false;}
   if(key==='reset'){p.enabled=true;p.vehicle=false;p.person=false;p.fault=false;p.direction='BOTH';}
   rebuild(i);
 }else if(i.type==='estop'){
   if(key==='press'){p.pressed=true;p.released=false;p.resetRequired=true;}
   if(key==='release'){p.pressed=false;p.released=true;p.resetRequired=true;}
   if(key==='reset'&&!p.pressed&&!p.wireFault){p.resetRequired=false;p.released=false;}
   if(key==='wireFault'){p.wireFault=!p.wireFault;p.resetRequired=true;}
   rebuild(i);
 }else if(i.type==='laneindicator'){
   if(['left','right','straight','stop'].includes(key)){p.mode=key;p.flashing=false;}
   if(key==='flash')p.flashing=!p.flashing;
   if(key==='off'){p.mode='off';p.flashing=false;}
   rebuild(i);
 }else if(i.type==='parkingdisplay'){
   if(key==='vehicleIn')p.available=Math.max(0,p.available-1);
   if(key==='vehicleOut')p.available=Math.min(p.total,p.available+1);
   if(key==='full')p.available=0;
   if(key==='available'&&p.available<=0)p.available=Math.max(1,Math.round(p.total*.2));
   if(key==='reset'){p.available=p.total;p.fault=false;}
   rebuild(i);
 }else if(i.type==='heightbar'){
   if(key==='normal')p.overheight=false;
   if(key==='overheight')p.overheight=true;
   if(key==='clear'||key==='reset')p.overheight=false;
   rebuild(i);
 }else if(i.type==='shutter'){
   controlRollingShutter(i,key);
 }else if(i.type==='traffic'){
   if(key==='red')p.mode='red';if(key==='green')p.mode='green';if(key==='off')p.mode='off';rebuild(i);
 }else if(i.type==='timer'){
   controlCountdownTimer(i,key);
 }else if(i.type==='loop'){if(key==='vehicle')p.detected=true;if(key==='clear')p.detected=false;rebuild(i);
 }else if(i.type==='infrared'){if(key==='blocked')p.blocked=true;if(key==='clear')p.blocked=false;rebuild(i);
 }else if(i.type==='uhf'){if(key==='read')p.detected=true;if(key==='clear')p.detected=false;rebuild(i);
 }else if(i.type==='cardreader'){if(key==='valid')p.state='GRANTED';if(key==='invalid')p.state='DENIED';if(key==='clear')p.state='IDLE';rebuild(i);
 }else if(i.type==='ledpanel'){
   if(key==='red'){p.mode='red';rebuild(i);}
   if(key==='green'){p.mode='green';rebuild(i);}
   if(key==='off'){p.mode='off';p.state='IDLE';i.runtime.lastTick=0;rebuild(i);}
   if(key==='start'||key==='reset'){
    controlLedPanelCountdown(i,key);
   }
 }else if(i.type==='lpr'){
   if(key==='valid')p.state='VALID';
   if(key==='invalid')p.state='INVALID';
   if(key==='clear')p.state='IDLE';
   rebuild(i);
 }else if(i.type==='beacon'){
   if(key==='on'){p.on=true;p.flash=false;}
   if(key==='flash'){p.on=true;p.flash=true;}
   if(key==='off'){p.on=false;p.flash=false;}
   if(key==='reset'){p.on=false;p.flash=false;}
   rebuild(i);
 }else if(i.type==='bollard'){
   if(key==='raise')p.raised=true;
   if(key==='lower')p.raised=false;
   if(key==='stop')p.stopped=true;
   rebuild(i);
 }else if(i.type==='intercom'){
   if(key==='call'){p.calling=true;p.talking=false;}
   if(key==='answer'){p.calling=false;p.talking=true;}
   if(key==='hangup'){p.calling=false;p.talking=false;}
   rebuild(i);
 }else if(i.type==='ipcamera'){
   if(key==='motion')p.motion=true;
   if(key==='alarm')p.alarm=true;
   if(key==='reset'){p.motion=false;p.alarm=false;}
   rebuild(i);
 }else if(i.type==='controller'){
   if(key==='lock')p.lock=!p.lock;
   if(key==='alarm')p.alarm=!p.alarm;
   if(key==='buzzer')p.buzzer=!p.buzzer;
   if(key==='reset'){p.lock=false;p.alarm=false;p.buzzer=false;}
   rebuild(i);
 }else if(i.type==='poeswitch'){
   if(key==='power')p.online=!p.online;
   if(key==='uplink')p.uplink=!p.uplink;
   if(key==='portAlarm')p.portAlarm=!p.portAlarm;
   if(key==='reset'){p.online=true;p.uplink=true;p.portAlarm=false;}
   rebuild(i);
 }else if(i.type==='delaytimer'){
   if(key==='start')startDelayRuntime(i,'on');
   if(key==='stop'){cancelControlRuntime(i);p.state='STOPPED';}
   if(key==='reset'){cancelControlRuntime(i);p.state='IDLE';p.output=false;p.remaining=0;}
   rebuild(i);
 }else if(i.type==='poweroffdelay'){
   if(key==='powerOn'){cancelControlRuntime(i);p.power=true;p.output=true;p.state='ENERGIZED';p.remaining=0;}
   if(key==='powerOff'){p.power=false;startDelayRuntime(i,'off');}
   if(key==='reset'){cancelControlRuntime(i);p.power=true;p.output=true;p.state='ENERGIZED';p.remaining=0;}
   rebuild(i);
 }else if(i.type==='powerondelay'){
   if(key==='powerOn'){p.power=true;startDelayRuntime(i,'on');}
   if(key==='powerOff'){cancelControlRuntime(i);p.power=false;p.output=false;p.state='IDLE';p.remaining=0;}
   if(key==='reset'){cancelControlRuntime(i);p.power=false;p.output=false;p.state='IDLE';p.remaining=0;}
   rebuild(i);
 }else if(SIGNAL_HOST_TYPES.has(i.type)){
   if(key==='laneA'){cancelControlRuntime(i);p.auto=false;p.mode='LANE_A';}
   if(key==='laneB'){cancelControlRuntime(i);p.auto=false;p.mode='LANE_B';}
   if(key==='laneC'&&i.type==='signal3way'){cancelControlRuntime(i);p.auto=false;p.mode='LANE_C';}
   if(key==='allRed'){cancelControlRuntime(i);p.auto=false;p.mode='ALL_RED';}
   if(key==='auto'){startSignalAuto(i);}
   if(key==='reset'){cancelControlRuntime(i);p.auto=false;p.mode='ALL_RED';p.state='READY';}
   rebuild(i);
 }else if(i.type==='powersupply'){
   if(key==='remoteOn')p.on=true;
   if(key==='fault')p.fault=true;
   if(key==='reset'){p.on=true;p.fault=false;}
   rebuild(i);
 }else{
   if(key==='on')p.on=true;
   if(key==='off')p.on=false;
   rebuild(i);
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

 if(typeof window.UTOP_ACTIVE_PLAN_RENDERER==='function'){
  try{
   const handled=window.UTOP_ACTIVE_PLAN_RENDERER({
    root,
    svgElement,
    addPlanLabel,
    worldToPlan,
    planToWorld,
    bounds:activeSceneBounds()
   });
   if(handled!==false)return;
  }catch(error){
   console.warn('Custom plan renderer:',error);
  }
 }
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
  const planPoint=worldToPlan(i.x,i.z);
  const x=planPoint.x;
  const y=planPoint.y;

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
  const normalizedRotation=(
    (Number(p.rotation)||0)%360+360
  )%360;
  const planRotation=i.type==='barrier'
    ? -normalizedRotation
    : normalizedRotation;

  model.setAttribute('transform',`rotate(${planRotation})`);

  if(i.type==='barrier'){
    const sign=p.armSide==='right'?1:-1;
    const body=document.createElementNS('http://www.w3.org/2000/svg','rect');
    body.setAttribute('x','-17');
    body.setAttribute('y','-14');
    body.setAttribute('width','34');
    body.setAttribute('height','28');
    body.setAttribute('rx','4');
    body.setAttribute('fill','#e89200');
    body.setAttribute('stroke','#222');
    body.setAttribute('class','outline');
    model.appendChild(body);

    const planPivot=document.createElementNS(
      'http://www.w3.org/2000/svg',
      'circle'
    );
    planPivot.setAttribute('cx',String(sign*12));
    planPivot.setAttribute('cy','0');
    planPivot.setAttribute('r','5');
    planPivot.setAttribute('fill','#15191c');
    planPivot.setAttribute('stroke','#7f8a90');
    planPivot.setAttribute('stroke-width','1.5');
    planPivot.setAttribute('class','plan-barrier-pivot');
    model.appendChild(planPivot);

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

    // Main white boom, matching the 3D model.
    const arm=document.createElementNS('http://www.w3.org/2000/svg','rect');
    arm.setAttribute('x',sign>0?0:-projectedLength);
    arm.setAttribute('y','-6');
    arm.setAttribute('width',String(projectedLength));
    arm.setAttribute('height','12');
    arm.setAttribute('rx','2');
    arm.setAttribute('class','plan-barrier-boom');
    armGroup.appendChild(arm);

    // Metallic upper/lower edges.
    ['-6','4.5'].forEach(y=>{
      const edge=document.createElementNS('http://www.w3.org/2000/svg','rect');
      edge.setAttribute('x',sign>0?0:-projectedLength);
      edge.setAttribute('y',y);
      edge.setAttribute('width',String(projectedLength));
      edge.setAttribute('height','1.5');
      edge.setAttribute('class','plan-barrier-edge');
      armGroup.appendChild(edge);
    });

    // Fixed-size red reflective panels. Do not stretch the red panel
    // across the remaining length, which previously made the boom red.
    const reflectorWidth=16;
    const reflectorGap=42;
    for(let distance=24;distance+4<projectedLength;distance+=reflectorGap){
      const visibleWidth=Math.min(
        reflectorWidth,
        Math.max(0,projectedLength-distance-5)
      );
      if(visibleWidth<4)continue;

      const stripe=document.createElementNS(
        'http://www.w3.org/2000/svg',
        'rect'
      );
      stripe.setAttribute(
        'x',
        String(sign>0?distance:-distance-visibleWidth)
      );
      stripe.setAttribute('y','-4');
      stripe.setAttribute('width',String(visibleWidth));
      stripe.setAttribute('height','8');
      stripe.setAttribute('rx','1');
      stripe.setAttribute('class','plan-barrier-reflector');
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

    const cap=document.createElementNS('http://www.w3.org/2000/svg','rect');
    cap.setAttribute(
      'x',
      String(sign>0?Math.max(0,projectedLength-8):-projectedLength)
    );
    cap.setAttribute('y','-7');
    cap.setAttribute('width','8');
    cap.setAttribute('height','14');
    cap.setAttribute('rx','2');
    cap.setAttribute('class','plan-barrier-cap');
    armGroup.appendChild(cap);
    model.appendChild(armGroup);
  }else if(i.type==='traffic'){
    const housing=svgElement('rect',{x:-20,y:-38,width:40,height:76,rx:7,class:'plan-device-dark plan-device-body'});
    model.appendChild(housing);
    const hoodTop=svgElement('path',{d:'M -17 -17 Q 0 -29 17 -17 L 15 -11 L -15 -11 Z',fill:'#30373a'});
    const hoodBottom=svgElement('path',{d:'M -17 20 Q 0 8 17 20 L 15 26 L -15 26 Z',fill:'#30373a'});
    model.appendChild(hoodTop);model.appendChild(hoodBottom);
    [['red',-2,'#ff0000'],['green',22,'#20e56c']].forEach(([mode,cy,col])=>{
      const lamp=svgElement('circle',{cx:0,cy,r:11,fill:p.mode===mode?col:'#303436',stroke:'#080a0b','stroke-width':3});
      if(p.mode===mode)lamp.setAttribute('class','plan-device-led-on');
      model.appendChild(lamp);
    });
  }else if(i.type==='timer'){
    model.appendChild(svgElement('path',{d:'M -42 -30 L -34 -39 L 34 -39 L 42 -30 Z',fill:'#3f484c',stroke:'#14191c','stroke-width':2}));
    model.appendChild(svgElement('rect',{x:-39,y:-30,width:78,height:56,rx:5,class:'plan-device-dark plan-device-body'}));
    const screen=svgElement('rect',{x:-32,y:-23,width:64,height:42,rx:3,fill:'#030405',stroke:'#424b4f','stroke-width':2});
    model.appendChild(screen);
    const timerText=svgElement('text',{x:0,y:9,fill:'#ff2b2b','font-size':25,'font-family':'monospace','font-weight':900,'text-anchor':'middle'});
    timerText.textContent=String(Math.max(0,Math.ceil(p.remaining))).padStart(2,'0');
    model.appendChild(timerText);
  }else if(i.type==='loop'){
    const width=(Number.isFinite(Number(p.width))&&Number(p.width)>0)?Number(p.width):1.8;
    const length=(Number.isFinite(Number(p.length))&&Number(p.length)>0)?Number(p.length):3;
    model.appendChild(svgElement('rect',{x:-width*PLAN_X_PPM/2,y:-length*PLAN_Z_PPM/2,width:width*PLAN_X_PPM,height:length*PLAN_Z_PPM,rx:10,fill:'rgba(70,80,84,.12)',stroke:p.detected?'#42e081':'#737b7e','stroke-width':6,class:'plan-device-body'}));
    model.appendChild(svgElement('rect',{x:-width*PLAN_X_PPM/2+8,y:-length*PLAN_Z_PPM/2+8,width:Math.max(1,width*PLAN_X_PPM-16),height:Math.max(1,length*PLAN_Z_PPM-16),rx:7,fill:'none',stroke:'#1d2428','stroke-width':2}));
    model.appendChild(svgElement('rect',{x:width*PLAN_X_PPM/2-9,y:length*PLAN_Z_PPM/2-12,width:15,height:9,rx:2,fill:'#d6aa27',stroke:'#735b12'}));
  }else if(i.type==='infrared'){
    const distance=Math.max(.1,Number(p.distance)||4),half=distance*PLAN_X_PPM/2;
    [-half,half].forEach((x,index)=>{
      model.appendChild(svgElement('rect',{x:x-11,y:-18,width:22,height:36,rx:5,class:'plan-device-dark plan-device-body'}));
      model.appendChild(svgElement('circle',{cx:x,cy:-5,r:5,fill:index?'#44dfff':'#ff4b4b'}));
      model.appendChild(svgElement('rect',{x:x-15,y:17,width:30,height:7,rx:3,fill:'#242b2f'}));
    });
    if(p.showBeam!==false)model.appendChild(svgElement('line',{x1:-half+12,x2:half-12,y1:0,y2:0,stroke:p.blocked?'#ff4242':'#45ddff','stroke-width':4,'stroke-dasharray':'8 5'}));
  }else if(i.type==='uhf'){
    model.appendChild(svgElement('rect',{x:-32,y:-38,width:64,height:76,rx:9,fill:'#dce1df',stroke:'#58656b','stroke-width':3,class:'plan-device-body'}));
    model.appendChild(svgElement('rect',{x:-23,y:-29,width:46,height:56,rx:6,class:'plan-device-dark'}));
    [9,16,23].forEach(r=>model.appendChild(svgElement('path',{d:`M ${-8-r/2} 0 A ${r} ${r} 0 0 1 ${-8+r/2} 0`,fill:'none',stroke:p.detected?'#48dfff':'#58727e','stroke-width':2})));
    model.appendChild(svgElement('circle',{cx:20,cy:25,r:4,fill:p.detected?'#42ef78':'#294236'}));
  }else if(i.type==='cardreader'){
    model.appendChild(svgElement('rect',{x:-29,y:-38,width:58,height:76,rx:8,fill:'#747e83',stroke:'#343c40','stroke-width':3,class:'plan-device-body'}));
    model.appendChild(svgElement('rect',{x:-20,y:-28,width:40,height:18,rx:3,fill:p.state==='GRANTED'?'#2bdc76':p.state==='DENIED'?'#f04444':'#143442'}));
    model.appendChild(svgElement('rect',{x:-15,y:2,width:30,height:4,rx:2,fill:'#050708'}));
    model.appendChild(svgElement('path',{d:'M 4 15 Q 16 23 4 31 M 9 17 Q 17 23 9 29',fill:'none',stroke:'#55d4ff','stroke-width':2}));
  }else if(i.type==='ledpanel'){
    model.appendChild(svgElement('rect',{x:-54,y:-34,width:108,height:68,rx:6,class:'plan-device-dark plan-device-body'}));
    const red=svgElement('circle',{cx:-35,cy:-14,r:10,fill:p.mode==='red'?'#ff2727':'#3b1717',stroke:'#080909','stroke-width':2});
    const green=svgElement('circle',{cx:-35,cy:15,r:10,fill:p.mode==='green'?'#21e76d':'#163923',stroke:'#080909','stroke-width':2});
    model.appendChild(red);model.appendChild(green);
    model.appendChild(svgElement('rect',{x:-12,y:-23,width:57,height:46,rx:3,fill:'#020303',stroke:'#454e52','stroke-width':2}));
    const tx=svgElement('text',{x:16,y:9,fill:'#ff3030','font-size':24,'font-family':'monospace','font-weight':900,'text-anchor':'middle'});
    tx.textContent=String(Math.max(0,Math.ceil(p.remaining))).padStart(2,'0');model.appendChild(tx);
  }else if(i.type==='lpr'){
    model.appendChild(svgElement('rect',{x:-42,y:-17,width:67,height:34,rx:15,fill:'#dfe3e0',stroke:'#59666d','stroke-width':3,class:'plan-device-body'}));
    model.appendChild(svgElement('circle',{cx:18,cy:0,r:11,fill:'#08151c',stroke:'#3e4a50','stroke-width':3}));
    model.appendChild(svgElement('circle',{cx:18,cy:0,r:4,fill:p.state==='VALID'?'#35db73':p.state==='INVALID'?'#ef3e3e':'#4e87a2'}));
    model.appendChild(svgElement('path',{d:'M -28 16 L -15 31 L -6 28 L -18 13 Z',fill:'#737d82'}));
  }else if(i.type==='loopdetector'){
    model.appendChild(svgElement('rect',{x:-30,y:-38,width:60,height:76,rx:5,fill:'#bfc6c4',stroke:'#384349','stroke-width':3,class:'plan-device-body'}));
    model.appendChild(svgElement('rect',{x:-21,y:-27,width:42,height:40,rx:3,fill:'#11181c'}));
    model.appendChild(svgElement('circle',{cx:15,cy:-18,r:4,fill:p.fault?'#ff3636':p.vehicle?'#3def78':'#294335'}));
  }else if(i.type==='radar'){
    model.appendChild(svgElement('rect',{x:-31,y:-38,width:62,height:76,rx:8,fill:'#dde2df',stroke:'#59666c','stroke-width':3,class:'plan-device-body'}));
    model.appendChild(svgElement('rect',{x:-23,y:-28,width:46,height:56,rx:5,fill:'#17242a'}));
    [9,16,23].forEach(r=>model.appendChild(svgElement('path',{d:`M ${-r/2} 0 A ${r} ${r} 0 0 1 ${r/2} 0`,fill:'none',stroke:p.vehicle?'#42dcff':'#526b76','stroke-width':2})));
  }else if(i.type==='estop'){
    model.appendChild(svgElement('circle',{cx:0,cy:0,r:28,fill:'#e8bc1f',stroke:'#3b3212','stroke-width':3,class:'plan-device-body'}));
    model.appendChild(svgElement('circle',{cx:0,cy:0,r:p.pressed?15:20,fill:p.pressed?'#850000':'#d91616',stroke:'#5c0000','stroke-width':3}));
  }else if(i.type==='laneindicator'){
    model.appendChild(svgElement('rect',{x:-48,y:-31,width:96,height:62,rx:5,fill:'#080b0c',stroke:'#4c565a','stroke-width':3,class:'plan-device-body'}));
    const tx=svgElement('text',{x:0,y:14,fill:p.mode==='stop'?'#ff2929':'#24ed72','font-size':42,'font-weight':900,'text-anchor':'middle'});
    tx.textContent=p.mode==='left'?'←':p.mode==='right'?'→':p.mode==='stop'?'✕':p.mode==='off'?'':'↑';model.appendChild(tx);
  }else if(i.type==='parkingdisplay'){
    model.appendChild(svgElement('rect',{x:-55,y:-30,width:110,height:60,rx:5,fill:'#050707',stroke:'#4b5559','stroke-width':3,class:'plan-device-body'}));
    const tx=svgElement('text',{x:0,y:10,fill:p.available<=0?'#ff3030':'#30eb72','font-size':25,'font-family':'monospace','font-weight':900,'text-anchor':'middle'});
    tx.textContent=p.available<=0?'FULL':`P ${p.available}`;model.appendChild(tx);
  }else if(i.type==='heightbar'){
    const w=90;
    model.appendChild(svgElement('line',{x1:-w/2,x2:w/2,y1:-22,y2:-22,stroke:p.overheight?'#f13a2f':'#e1ad17','stroke-width':12}));
    model.appendChild(svgElement('line',{x1:-w/2,x2:-w/2,y1:-22,y2:30,stroke:'#d6a313','stroke-width':7}));
    model.appendChild(svgElement('line',{x1:w/2,x2:w/2,y1:-22,y2:30,stroke:'#d6a313','stroke-width':7}));
    const tx=svgElement('text',{x:0,y:-28,fill:'#fff','font-size':13,'font-weight':900,'text-anchor':'middle'});tx.textContent=`${p.heightLimit}m`;model.appendChild(tx);

  }else if(i.type==='shutter'){
    model.appendChild(svgElement('rect',{x:-55,y:-38,width:110,height:76,rx:3,fill:'#5f676b',stroke:'#303639','stroke-width':5,class:'plan-device-body'}));
    for(let y=-28;y<=28;y+=9)model.appendChild(svgElement('line',{x1:-46,x2:46,y1:y,y2:y,stroke:'#a0a7aa','stroke-width':5}));
  }else if(i.type==='beacon'){
    model.appendChild(svgElement('circle',{cx:0,cy:0,r:25,fill:p.on?'#ff2929':'#6b1717',stroke:'#241011','stroke-width':5,class:p.on?'plan-device-led-on':''}));
    model.appendChild(svgElement('circle',{cx:0,cy:0,r:9,fill:'#ffaaaa',opacity:.55}));
  }else if(i.type==='bollard'){
    model.appendChild(svgElement('circle',{cx:0,cy:0,r:p.raised?18:11,fill:'#e4a817',stroke:'#191c1e','stroke-width':4}));
    model.appendChild(svgElement('path',{d:'M -15 -5 L 15 -5 L 15 5 L -15 5 Z',fill:'#16191b'}));
  }else if(i.type==='intercom'){
    model.appendChild(svgElement('rect',{x:-25,y:-39,width:50,height:78,rx:7,class:'plan-device-metal plan-device-body'}));
    model.appendChild(svgElement('circle',{cx:0,cy:-18,r:9,fill:'#171b1d'}));
    for(let x=-9;x<=9;x+=9)for(let y=4;y<=22;y+=9)model.appendChild(svgElement('circle',{cx:x,cy:y,r:2,fill:'#252a2d'}));
  }else if(i.type==='ipcamera'){
    model.appendChild(svgElement('rect',{x:-40,y:-16,width:65,height:32,rx:14,fill:'#dce0dd',stroke:'#58656b','stroke-width':3,class:'plan-device-body'}));
    model.appendChild(svgElement('circle',{cx:18,cy:0,r:11,fill:'#07131a',stroke:'#444f54','stroke-width':3}));
    model.appendChild(svgElement('path',{d:'M -24 15 L -12 31 L -3 27 L -16 12 Z',fill:'#737d82'}));
  }else if(i.type==='controller'){
    model.appendChild(svgElement('rect',{x:-48,y:-34,width:96,height:68,rx:5,class:'plan-device-metal plan-device-body'}));
    for(let n=0;n<8;n++)model.appendChild(svgElement('rect',{x:-38+n*10,y:-25,width:7,height:8,rx:1,fill:n%2?'#202629':'#45ce73'}));
    model.appendChild(svgElement('rect',{x:-38,y:8,width:76,height:12,rx:2,fill:'#31383c'}));
  }else if(i.type==='poeswitch'){
    model.appendChild(svgElement('rect',{x:-53,y:-23,width:106,height:46,rx:4,class:'plan-device-dark plan-device-body'}));
    for(let n=0;n<8;n++)model.appendChild(svgElement('rect',{x:-43+n*11,y:-7,width:8,height:12,rx:1,class:'plan-device-port'}));
    model.appendChild(svgElement('circle',{cx:43,cy:13,r:3,fill:p.online?'#43ed77':'#4b5357'}));
  }else if(i.type==='powersupply'){
    model.appendChild(svgElement('rect',{x:-42,y:-30,width:84,height:60,rx:4,class:'plan-device-metal plan-device-body'}));
    for(let n=0;n<12;n++)model.appendChild(svgElement('line',{x1:-32+n*6,x2:-32+n*6,y1:-20,y2:6,stroke:'#596265','stroke-width':2}));
    model.appendChild(svgElement('circle',{cx:31,cy:20,r:4,fill:p.fault?'#ff3838':'#3de878'}));
  }else{
    const socket=document.createElementNS('http://www.w3.org/2000/svg','rect');
    socket.setAttribute('x','-30');
    socket.setAttribute('y','-22');
    socket.setAttribute('width','60');
    socket.setAttribute('height','44');
    socket.setAttribute('rx','5');
    socket.setAttribute('fill','#222b31');
    socket.setAttribute('stroke','#9db0ba');
    socket.setAttribute('stroke-width','2');
    model.appendChild(socket);

    const cover=document.createElementNS('http://www.w3.org/2000/svg','rect');
    cover.setAttribute('x','-22');
    cover.setAttribute('y','-17');
    cover.setAttribute('width','44');
    cover.setAttribute('height','30');
    cover.setAttribute('rx','4');
    cover.setAttribute('fill',p.on?'rgba(83,184,222,.72)':'rgba(126,177,204,.58)');
    cover.setAttribute('stroke','#bdeaff');
    cover.setAttribute('stroke-width','1.5');
    model.appendChild(cover);

    const coil=document.createElementNS('http://www.w3.org/2000/svg','rect');
    coil.setAttribute('x','-15');
    coil.setAttribute('y','-8');
    coil.setAttribute('width','16');
    coil.setAttribute('height','12');
    coil.setAttribute('rx','5');
    coil.setAttribute('fill',p.on?'#d55b29':'#8a4022');
    model.appendChild(coil);

    const contact=document.createElementNS('http://www.w3.org/2000/svg','line');
    contact.setAttribute('x1','4');
    contact.setAttribute('y1','-7');
    contact.setAttribute('x2','16');
    contact.setAttribute('y2',p.on?'4':'-1');
    contact.setAttribute('stroke',p.on?'#55e083':'#d3d8da');
    contact.setAttribute('stroke-width','3');
    contact.setAttribute('stroke-linecap','round');
    model.appendChild(contact);

    const led=document.createElementNS('http://www.w3.org/2000/svg','circle');
    led.setAttribute('cx','15');
    led.setAttribute('cy','-11');
    led.setAttribute('r','3.5');
    led.setAttribute('fill',p.on?'#45ff79':'#244031');
    model.appendChild(led);

    [-25,-9,9,25].forEach(x=>{
      const terminal=document.createElementNS('http://www.w3.org/2000/svg','rect');
      terminal.setAttribute('x',String(x-2.5));
      terminal.setAttribute('y','17');
      terminal.setAttribute('width','5');
      terminal.setAttribute('height','8');
      terminal.setAttribute('fill','#c1c8cb');
      model.appendChild(terminal);
    });
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
 const world=planToWorld(point.x,point.y);
 clampDevicePosition(
  planDrag,
  world.x,
  world.z
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
      <input id="fY" type="number" min="-20" max="20" step=".1" title="依場景高度範圍自動調整" value="${Number(i.y||0).toFixed(1)}">
      <button id="heightUp" type="button">＋</button>
    </div>
    <input id="heightRange" type="range" min="-20" max="20" step=".1" title="依場景高度範圍自動調整" value="${Number(i.y||0)}">
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
   }else if(i.type==='shutter'){
    box.innerHTML=`<div class="form-grid">
      <section class="field-group"><h3>鐵捲門控制參數</h3>
       <label>開門運轉秒數<input id="shutterOpenDuration" type="number" min="0.2" max="999" step="0.1" value="${p.openDurationSeconds}"></label>
       <label>關門運轉秒數<input id="shutterCloseDuration" type="number" min="0.2" max="999" step="0.1" value="${p.closeDurationSeconds}"></label>
       <label class="checkbox-field"><input id="shutterAutoClose" type="checkbox" ${p.autoCloseEnabled?'checked':''}> 開門後自動關閉</label>
       <label>全開等待秒數<input id="shutterCloseDelay" type="number" min="0" max="999" step="1" value="${p.closeDelaySeconds}"></label>
       <label>開／關命令接點<select id="shutterCommandContact"><option value="NO" ${p.commandContact==='NO'?'selected':''}>NO 常開</option><option value="NC" ${p.commandContact==='NC'?'selected':''}>NC 常閉</option></select></label>
       <label>停止接點<select id="shutterStopContact"><option value="NC" ${p.stopContact==='NC'?'selected':''}>NC 常閉（建議）</option><option value="NO" ${p.stopContact==='NO'?'selected':''}>NO 常開</option></select></label>
       <label>防壓／安全邊接點<select id="shutterSafetyContact"><option value="NC" ${p.safetyContact==='NC'?'selected':''}>NC 常閉（建議）</option><option value="NO" ${p.safetyContact==='NO'?'selected':''}>NO 常開</option></select></label>
       <label>限位接點<select id="shutterLimitContact"><option value="NC" ${p.limitContact==='NC'?'selected':''}>NC 常閉</option><option value="NO" ${p.limitContact==='NO'?'selected':''}>NO 常開</option></select></label>
      </section>
      <section class="field-group"><h3>端子標籤建議</h3>
       <label>開門<input value="OPEN / UP" disabled></label>
       <label>停止<input value="STOP" disabled></label>
       <label>關門<input value="CLOSE / DOWN" disabled></label>
       <label>共用端<input value="COM" disabled></label>
       <label>防壓<input value="SAFETY EDGE / PHOTO" disabled></label>
      </section>
    </div>`;
   }else if(i.type==='traffic'){
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>紅綠燈參數</h3>
     <label>預設燈號<select id="trafficMode"><option value="red" ${p.mode==='red'?'selected':''}>紅燈</option><option value="green" ${p.mode==='green'?'selected':''}>綠燈</option><option value="off" ${p.mode==='off'?'selected':''}>全關</option></select></label>
     <label>安裝高度<input value="${Number(i.y||0).toFixed(1)} m" disabled></label>
     <label class="checkbox-field"><input id="showModuleStand" type="checkbox" ${p.showStand!==false?'checked':''}> 顯示支架</label>
    </section></div>`;
   }else if(i.type==='timer'){
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>倒數計時參數</h3>
     <label>設定秒數<input id="timerSeconds" type="number" min="1" max="999" value="${p.seconds}"></label>
     <label>剩餘秒數<input value="${Math.ceil(p.remaining)}" disabled></label>
     <label>安裝高度<input value="${Number(i.y||0).toFixed(1)} m" disabled></label>
     <label class="checkbox-field"><input id="showModuleStand" type="checkbox" ${p.showStand!==false?'checked':''}> 顯示支架</label>
    </section></div>`;
   }else if(i.type==='loop'){
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>地感線圈參數</h3><label>寬度（m）<input id="loopWidth" type="number" step="any" inputmode="decimal" value="${p.width}"></label><label>長度（m）<input id="loopLength" type="number" step="any" inputmode="decimal" value="${p.length}"></label><small class="dimension-help">可輸入任意大於 0 的尺寸</small></section></div>`;
   }else if(i.type==='infrared'){
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>紅外線對射參數</h3><label>兩台距離（m）<input id="irDistance" type="number" min="1" max="20" step=".1" value="${p.distance}"></label><label class="checkbox-field"><input id="irShowBeam" type="checkbox" ${p.showBeam!==false?'checked':''}>顯示光束</label><label class="checkbox-field"><input id="showModuleStand" type="checkbox" ${p.showStand!==false?'checked':''}> 顯示支架</label></section></div>`;
   }else if(i.type==='uhf'){
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>UHF／eTag參數</h3><label>讀取距離（m）<input id="uhfDistance" type="number" min="1" max="15" step=".5" value="${p.readDistance}"></label><label>模擬標籤<input id="uhfTag" value="${p.lastTag}"></label><label class="checkbox-field"><input id="showModuleStand" type="checkbox" ${p.showStand!==false?'checked':''}> 顯示支架</label></section></div>`;
   }else if(i.type==='cardreader'){
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>車道卡機參數</h3><label>狀態<input value="${p.state}" disabled></label><label class="checkbox-field"><input id="showModuleStand" type="checkbox" ${p.showStand!==false?'checked':''}> 顯示支架</label></section></div>`;
   }else if(i.type==='ledpanel'){
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>紅綠燈倒數參數</h3><label>設定秒數<input id="ledSeconds" type="number" min="1" max="999" value="${p.seconds}"></label><label>預設燈號<select id="ledMode"><option value="red" ${p.mode==='red'?'selected':''}>紅燈</option><option value="green" ${p.mode==='green'?'selected':''}>綠燈</option><option value="off" ${p.mode==='off'?'selected':''}>全關</option></select></label><label class="checkbox-field"><input id="ledBlink" type="checkbox" ${p.blinkLastFive?'checked':''}>最後五秒閃爍</label><label class="checkbox-field"><input id="ledBuzzer" type="checkbox" ${p.buzzerLastFive?'checked':''}>最後五秒蜂鳴</label><label class="checkbox-field"><input id="showModuleStand" type="checkbox" ${p.showStand!==false?'checked':''}> 顯示支架</label></section></div>`;
   }else if(i.type==='lpr'){
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>車牌辨識參數</h3><label>模擬車牌<input id="lprPlate" value="${p.plate}"></label><label>信心值（%）<input id="lprConfidence" type="number" min="0" max="100" value="${p.confidence}"></label><label class="checkbox-field"><input id="showModuleStand" type="checkbox" ${p.showStand!==false?'checked':''}> 顯示支架</label></section></div>`;
   }else if(DELAY_CONTROL_TYPES.has(i.type)){
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>延遲控制參數</h3><label>延遲秒數<input id="controlDelaySeconds" type="number" min="1" max="999" step="1" value="${p.delaySeconds}"></label><label>目前狀態<input value="${p.state}" disabled></label><label>剩餘秒數<input value="${Number(p.remaining||0).toFixed(1)}" disabled></label></section></div>`;
   }else if(SIGNAL_HOST_TYPES.has(i.type)){
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>號誌主機參數</h3><label>交換秒數<input id="signalIntervalSeconds" type="number" min="1" max="999" step="1" value="${p.intervalSeconds}"></label><label>目前模式<input value="${p.mode}" disabled></label><label>控制方向<input value="${i.type==='signal3way'?'三向':'雙向'}" disabled></label></section></div>`;
   }else{
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>繼電器參數</h3>
     <label>預設狀態<select id="relayDefault"><option value="off" ${!p.on?'selected':''}>釋放</option><option value="on" ${p.on?'selected':''}>吸合</option></select></label>
     <label>安裝高度<input value="${Number(i.y||0).toFixed(1)} m" disabled></label>
    </section></div>`;
   }
 }else if(state.activeTab==='controls'){
   const controls=i.type==='barrier'?[['open','開啟'],['stop','停止'],['close','關閉'],['safety','防砸'],['reset','復歸']]:i.type==='shutter'?[['open','開門'],['stop','停止'],['close','關門'],['safety','防壓觸發'],['clearSafety','解除防壓'],['autoClose','自動關門'],['reset','復歸']]:i.type==='traffic'?[['red','紅燈'],['green','綠燈'],['off','全關']]:i.type==='timer'?[['start','開始'],['pause','暫停'],['reset','重設']]:i.type==='loop'?[['vehicle','車輛進入'],['clear','車輛離開']]:i.type==='infrared'?[['blocked','遮斷'],['clear','恢復']]:i.type==='uhf'?[['read','讀取標籤'],['clear','清除']]:i.type==='cardreader'?[['valid','有效卡'],['invalid','無效卡'],['clear','清除']]:i.type==='ledpanel'?[['red','紅燈'],['green','綠燈'],['start','開始倒數'],['reset','重設'],['off','全關']]:i.type==='lpr'?[['valid','有效車牌'],['invalid','無效車牌'],['clear','清除']]
   :i.type==='beacon'?[['on','開啟'],['flash','閃爍'],['off','關閉'],['reset','復歸']]
   :i.type==='bollard'?[['raise','升起'],['stop','停止'],['lower','下降']]
   :i.type==='intercom'?[['call','呼叫'],['answer','接聽'],['hangup','掛斷']]
   :i.type==='ipcamera'?[['motion','移動觸發'],['alarm','警報輸入'],['reset','清除']]
   :i.type==='controller'?[['lock','門鎖輸出'],['alarm','警報輸出'],['buzzer','蜂鳴器'],['reset','復歸']]
   :i.type==='poeswitch'?[['power','電源測試'],['uplink','上行連線'],['portAlarm','埠異常'],['reset','重啟']]
   :i.type==='powersupply'?[['remoteOn','啟動'],['fault','故障測試'],['reset','復歸']]
   :i.type==='delaytimer'?[['start','開始計時'],['stop','停止'],['reset','復歸']]
   :i.type==='poweroffdelay'?[['powerOn','通電'],['powerOff','斷電測試'],['reset','復歸']]
   :i.type==='powerondelay'?[['powerOn','通電開始'],['powerOff','斷電'],['reset','復歸']]
   :i.type==='signal2way'?[['laneA','A向綠燈'],['laneB','B向綠燈'],['allRed','全紅'],['auto','自動交換'],['reset','復歸']]
   :i.type==='signal3way'?[['laneA','A向綠燈'],['laneB','B向綠燈'],['laneC','C向綠燈'],['allRed','全紅'],['auto','自動交換'],['reset','復歸']]
   :i.type==='loopdetector'?[['vehicle','車輛進入'],['clear','車輛離開'],['pulse','脈衝測試'],['fault','線圈故障'],['reset','重新校正']]
   :i.type==='radar'?[['vehicle','車輛接近'],['person','人員進入'],['depart','車輛離開'],['disable','啟用／停用'],['reset','復歸']]
   :i.type==='estop'?[['press','按下急停'],['release','旋轉解除'],['reset','確認復歸'],['wireFault','模擬斷線']]
   :i.type==='laneindicator'?[['left','左轉'],['right','右轉'],['straight','直行'],['stop','紅叉禁止'],['flash','閃爍'],['off','關閉']]
   :i.type==='parkingdisplay'?[['vehicleIn','車輛進入'],['vehicleOut','車輛離開'],['full','滿位'],['available','尚有車位'],['reset','復歸']]
   :i.type==='heightbar'?[['normal','正常車輛'],['overheight','超高車輛'],['clear','清除警報'],['reset','復歸']]
   :[['on','吸合'],['off','釋放']];
   box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>設備控制</h3><div class="button-row">${controls.map(x=>`<button data-input="${x[0]}">${x[1]}</button>`).join('')}</div></section><section class="field-group"><h3>目前狀態</h3><p>${statusText(i)}</p></section></div>`;
 }else{
   box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>DI 輸入</h3>${d.di.map(x=>`<div class="io-row"><b>${x[0]}</b><span>${x[1]}</span><button data-input="${x[2]}">觸發</button></div>`).join('')}</section>
   <section class="field-group"><h3>DO 輸出</h3>${d.do.map(x=>`<div class="io-row"><b>${x[0]}</b><span>${x[1]}</span><i class="lamp ${out[x[2]]?'on':''}"></i></div>`).join('')}</section></div>`;
 }
 bindInspector(i);
 renderQuick(i);
}
function statusText(i){const p=i.params;if(i.type==='barrier')return`狀態：${p.state}<br>桿子角度：${p.angle.toFixed(1)}°`;if(i.type==='shutter')return`狀態：${p.state}<br>開度：${Math.round((Number(p.doorProgress)||0)*100)}%<br>剩餘：${Number(p.motionRemainingSeconds||0).toFixed(1)}秒<br>開門／關門：${p.openDurationSeconds}秒／${p.closeDurationSeconds}秒<br>自動關門：${p.autoCloseEnabled?'啟用':'關閉'}（等待${p.closeDelaySeconds}秒）<br>防壓：${p.safetyActive?'觸發':'正常'}`;if(i.type==='traffic')return`目前燈號：${p.mode}`;if(i.type==='timer')return`剩餘：${Math.ceil(p.remaining)} 秒<br>狀態：${p.state}`;if(i.type==='loop')return`車輛偵測：${p.detected?'有車':'無車'}`;if(i.type==='infrared')return`對射：${p.blocked?'遮斷':'正常'}｜${p.distance}m`;if(i.type==='uhf')return`讀取：${p.detected?'成功':'待機'}<br>${p.lastTag}`;if(i.type==='cardreader')return`卡機：${p.state}`;if(i.type==='ledpanel')return`燈號：${p.mode}<br>剩餘：${Math.ceil(p.remaining)}秒`;if(i.type==='lpr')return`辨識：${p.state}<br>${p.plate}`;
if(i.type==='beacon')return`警示燈：${p.on?(p.flash?'閃爍':'開啟'):'關閉'}`;
if(i.type==='bollard')return`防撞柱：${p.raised?'升起':'下降'}`;
if(i.type==='intercom')return`對講機：${p.talking?'通話中':p.calling?'呼叫中':'待機'}`;
if(i.type==='ipcamera')return`攝影機：${p.online?'Online':'Offline'}<br>移動：${p.motion?'觸發':'正常'}`;
if(i.type==='controller')return`控制器：${p.online?'Online':'Offline'}<br>門鎖：${p.lock?'ON':'OFF'}`;
if(i.type==='poeswitch')return`PoE：${p.online?'Online':'Offline'}<br>上行：${p.uplink?'連線':'未連線'}`;
if(i.type==='delaytimer')return`延遲計時：${p.state}<br>剩餘：${Number(p.remaining||0).toFixed(1)}秒<br>輸出：${p.output?'ON':'OFF'}`;
if(i.type==='poweroffdelay')return`斷電延時：${p.state}<br>電源：${p.power?'ON':'OFF'}｜輸出：${p.output?'ON':'OFF'}<br>剩餘：${Number(p.remaining||0).toFixed(1)}秒`;
if(i.type==='powerondelay')return`通電延時：${p.state}<br>電源：${p.power?'ON':'OFF'}｜輸出：${p.output?'ON':'OFF'}<br>剩餘：${Number(p.remaining||0).toFixed(1)}秒`;
if(i.type==='signal2way')return`雙向號誌：${p.mode}<br>自動交換：${p.auto?'啟用':'關閉'}｜${p.intervalSeconds}秒`;
if(i.type==='signal3way')return`三向號誌：${p.mode}<br>自動交換：${p.auto?'啟用':'關閉'}｜${p.intervalSeconds}秒`;
if(i.type==='powersupply')return`電源：${p.on?'ON':'OFF'}<br>故障：${p.fault?'YES':'NO'}`;
if(i.type==='loopdetector')return`地感檢知器：${p.fault?'故障':p.vehicle?'有車':'待機'}<br>模式：${p.mode}`;
if(i.type==='radar')return`雷達：${p.enabled?'啟用':'停用'}<br>${p.vehicle?'車輛':p.person?'人員':'無目標'}｜${p.direction}`;
if(i.type==='estop')return`急停：${p.pressed||p.wireFault?'STOP':'READY'}<br>等待復歸：${p.resetRequired?'是':'否'}`;
if(i.type==='laneindicator')return`方向顯示：${p.mode}<br>閃爍：${p.flashing?'開':'關'}`;
if(i.type==='parkingdisplay')return`剩餘車位：${p.available}／${p.total}<br>${p.available<=0?'滿位':'尚有車位'}`;
if(i.type==='heightbar')return`限高：${p.heightLimit}m<br>${p.overheight?'超高警報':'正常'}`;
return`繼電器：${p.on?'ON':'OFF'}`}
function bindInspector(i){
 const p=i.params;
 document.querySelectorAll('[data-input]').forEach(b=>b.onclick=()=>input(i,b.dataset.input));
 if($('controlDelaySeconds'))$('controlDelaySeconds').oninput=e=>{p.delaySeconds=Math.max(1,Number(e.target.value)||1);markDirty()};
 if($('signalIntervalSeconds'))$('signalIntervalSeconds').oninput=e=>{p.intervalSeconds=Math.max(1,Number(e.target.value)||1);if(p.auto)startSignalAuto(i);markDirty()};
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
 if($('showModuleStand'))$('showModuleStand').onchange=e=>{
  p.showStand=e.currentTarget.checked;
  rebuild(i);
  renderAll();
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
 if($('shutterOpenDuration'))$('shutterOpenDuration').onchange=e=>{
  p.openDurationSeconds=Math.max(.2,Math.min(999,Number(e.currentTarget.value)||12));
  e.currentTarget.value=String(p.openDurationSeconds);
  markDirty();
 };
 if($('shutterCloseDuration'))$('shutterCloseDuration').onchange=e=>{
  p.closeDurationSeconds=Math.max(.2,Math.min(999,Number(e.currentTarget.value)||12));
  e.currentTarget.value=String(p.closeDurationSeconds);
  markDirty();
 };
 if($('shutterAutoClose'))$('shutterAutoClose').onchange=e=>{
  p.autoCloseEnabled=e.currentTarget.checked;
  if(p.autoCloseEnabled&&p.state==='OPEN')scheduleShutterAutoClose(i);
  else cancelShutterAutoClose(i);
  renderQuick(i);markDirty();
 };
 if($('shutterCloseDelay'))$('shutterCloseDelay').onchange=e=>{
  p.closeDelaySeconds=Math.max(0,Math.min(999,Number(e.currentTarget.value)||0));
  e.currentTarget.value=String(p.closeDelaySeconds);
  if(p.autoCloseEnabled&&p.state==='OPEN')scheduleShutterAutoClose(i);
  markDirty();
 };
 if($('shutterCommandContact'))$('shutterCommandContact').onchange=e=>{p.commandContact=e.currentTarget.value;markDirty()};
 if($('shutterStopContact'))$('shutterStopContact').onchange=e=>{p.stopContact=e.currentTarget.value;markDirty()};
 if($('shutterSafetyContact'))$('shutterSafetyContact').onchange=e=>{p.safetyContact=e.currentTarget.value;markDirty()};
 if($('shutterLimitContact'))$('shutterLimitContact').onchange=e=>{p.limitContact=e.currentTarget.value;markDirty()};
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
 const updateLoopDimension=(field,input)=>{
  const value=Number(input.value);
  if(!Number.isFinite(value)||value<=0){
   input.setCustomValidity('請輸入大於 0 的數字');
   return;
  }
  input.setCustomValidity('');
  p[field]=value;
  rebuild(i);
  renderPlan();
  renderQuick(i);
  markDirty();
 };
 if($('loopWidth')){
  $('loopWidth').oninput=e=>updateLoopDimension('width',e.currentTarget);
  $('loopWidth').onchange=e=>updateLoopDimension('width',e.currentTarget);
 }
 if($('loopLength')){
  $('loopLength').oninput=e=>updateLoopDimension('length',e.currentTarget);
  $('loopLength').onchange=e=>updateLoopDimension('length',e.currentTarget);
 }
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
 else if(i.type==='shutter')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="open">開門</button><button data-q="stop">停止</button><button data-q="close">關門</button><button data-q="safety">防壓測試</button><button data-q="clearSafety">解除防壓</button><button data-q="reset">復歸</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='traffic')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="green">綠燈</button><button data-q="off">全關</button><button data-q="red">紅燈</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='timer')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="start">開始</button><button data-q="pause">暫停</button><button data-q="reset">重設</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='loop')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="vehicle">車輛進入</button><button data-q="clear">車輛離開</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='infrared')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="blocked">遮斷</button><button data-q="clear">恢復</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='uhf')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="read">讀取標籤</button><button data-q="clear">清除</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='cardreader')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="valid">有效卡</button><button data-q="invalid">無效卡</button><button data-q="clear">清除</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='ledpanel')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="red">紅燈</button><button data-q="green">綠燈</button><button data-q="start">倒數</button><button data-q="reset">重設</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='lpr')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="valid">有效車牌</button><button data-q="invalid">無效車牌</button><button data-q="clear">清除</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='beacon')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="on">開啟</button><button data-q="flash">閃爍</button><button data-q="off">關閉</button><button data-q="reset">復歸</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='bollard')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="raise">升起</button><button data-q="stop">停止</button><button data-q="lower">下降</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='intercom')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="call">呼叫</button><button data-q="answer">接聽</button><button data-q="hangup">掛斷</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='ipcamera')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="motion">移動觸發</button><button data-q="alarm">警報輸入</button><button data-q="reset">清除</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='controller')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="lock">門鎖輸出</button><button data-q="alarm">警報輸出</button><button data-q="buzzer">蜂鳴器</button><button data-q="reset">復歸</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='poeswitch')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="power">電源測試</button><button data-q="uplink">上行連線</button><button data-q="portAlarm">埠異常</button><button data-q="reset">重啟</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='powersupply')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="remoteOn">啟動</button><button data-q="fault">故障測試</button><button data-q="reset">復歸</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='loopdetector')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="vehicle">車輛進入</button><button data-q="clear">車輛離開</button><button data-q="pulse">脈衝</button><button data-q="fault">故障</button><button data-q="reset">校正</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='radar')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="vehicle">車輛接近</button><button data-q="person">人員</button><button data-q="depart">離開</button><button data-q="disable">啟停</button><button data-q="reset">復歸</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='estop')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="press">按下急停</button><button data-q="release">旋轉解除</button><button data-q="reset">確認復歸</button><button data-q="wireFault">斷線測試</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='laneindicator')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="left">左轉</button><button data-q="right">右轉</button><button data-q="straight">直行</button><button data-q="stop">紅叉</button><button data-q="flash">閃爍</button><button data-q="off">關閉</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='parkingdisplay')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="vehicleIn">進車</button><button data-q="vehicleOut">出車</button><button data-q="full">滿位</button><button data-q="available">尚有車位</button><button data-q="reset">復歸</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='heightbar')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="normal">正常車輛</button><button data-q="overheight">超高車輛</button><button data-q="clear">清除警報</button><button data-q="reset">復歸</button></div><div class="status-box">${statusText(i)}</div>`;
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

const deleteButton=$('deleteBtn');if(deleteButton)deleteButton.onclick=()=>{const i=get(state.selectedId);if(!i)return;group.remove(i.mesh);state.items=state.items.filter(x=>x.id!==i.id);state.wires=state.wires.filter(w=>w.sourceId!==i.id&&w.targetId!==i.id);state.selectedId=null;renderAll();markDirty()};

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
 if(wiring3DState?.mode==='3d')renderSceneWiring3D();
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
 if(wiring3DState?.mode==='3d')setTimeout(renderSceneWiring3D,0);
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


/* =========================================================
   V4.1.0 3D Wiring View
   ========================================================= */
const wiring3DState={
 mode:'2d',
 canvasHome:null,
 canvasNextSibling:null,
 wireRoot:null,
 wireObjects:new Map(),
 wireCurves:new Map(),
 sourceMarkers:[],
 targetMarkers:[],
 hideIdleWires:true,
 activeWireId:null,
 signalBall:null,
 animationFrame:null,
 sequenceIndex:0,
 running:false,
 autoSequence:false
};

function disposeSceneWireObject(object){
 object.traverse(child=>{
  child.geometry?.dispose?.();
  if(Array.isArray(child.material)){
   child.material.forEach(material=>material?.dispose?.());
  }else{
   child.material?.dispose?.();
  }
 });
}

function clearSceneWiring3D(){
 if(!wiring3DState.wireRoot)return;
 disposeSceneWireObject(wiring3DState.wireRoot);
 wiring3DState.wireRoot.parent?.remove(wiring3DState.wireRoot);
 wiring3DState.wireRoot=null;
 wiring3DState.wireObjects.clear();
 wiring3DState.wireCurves.clear();
 wiring3DState.sourceMarkers.length=0;
 wiring3DState.targetMarkers.length=0;
 wiring3DState.signalBall=null;
 wiring3DState.activeWireId=null;
}

function getDeviceWorldPosition(item){
 const position=new THREE.Vector3(
  Number(item?.x)||0,
  Number(item?.y)||0,
  Number(item?.z)||0
 );
 if(item?.mesh){
  item.mesh.updateWorldMatrix?.(true,false);
  item.mesh.getWorldPosition(position);
 }
 return position;
}

function getDeviceWireHeight(item){
 const box=new THREE.Box3();
 if(item?.mesh){
  try{
   box.setFromObject(item.mesh);
   if(!box.isEmpty())return Math.max(.35,box.max.y-box.min.y);
  }catch(_){}
 }
 return 1.2;
}

function addSceneWireMarker(root,position,color,label){
 const groupMarker=new THREE.Group();
 groupMarker.position.copy(position);

 const sphere=new THREE.Mesh(
  new THREE.SphereGeometry(.12,18,12),
  new THREE.MeshStandardMaterial({
   color,
   emissive:color,
   emissiveIntensity:1.15,
   roughness:.25,
   metalness:.05
  })
 );
 groupMarker.add(sphere);

 const ring=new THREE.Mesh(
  new THREE.TorusGeometry(.20,.025,10,24),
  new THREE.MeshBasicMaterial({
   color,
   transparent:true,
   opacity:.9,
   depthTest:false
  })
 );
 ring.rotation.x=Math.PI/2;
 groupMarker.add(ring);

 groupMarker.userData.label=label;
 root.add(groupMarker);
 return groupMarker;
}

function renderSceneWiring3D(){
 if(wiring3DState.mode!=='3d')return;
 clearSceneWiring3D();
 normalizeWireColors();

 const wireRoot=new THREE.Group();
 wireRoot.name='REAL_SCENE_WIRING_3D';
 scene.add(wireRoot);
 wiring3DState.wireRoot=wireRoot;

 state.wires.forEach((wire,index)=>{
  const sourceItem=get(wire.sourceId);
  const targetItem=get(wire.targetId);
  if(!sourceItem||!targetItem)return;

  const sourcePosition=getDeviceWorldPosition(sourceItem);
  const targetPosition=getDeviceWorldPosition(targetItem);
  const sourceHeight=getDeviceWireHeight(sourceItem);
  const targetHeight=getDeviceWireHeight(targetItem);

  // 起終點落在真實設備上方，避免線穿過道路或模型。
  sourcePosition.y+=Math.max(.28,sourceHeight*.68);
  targetPosition.y+=Math.max(.28,targetHeight*.68);

  const distance=sourcePosition.distanceTo(targetPosition);
  const selected=sceneSettings.selectedWireId===wire.id;
  const lift=Math.max(
   sourcePosition.y,
   targetPosition.y
  )+Math.max(.55,Math.min(2.6,distance*.16))+(index%4)*.16;

  const direction=targetPosition.clone().sub(sourcePosition);
  const horizontal=new THREE.Vector3(direction.x,0,direction.z);
  const side=new THREE.Vector3(-horizontal.z,0,horizontal.x);
  if(side.lengthSq()>0.0001)side.normalize();
  side.multiplyScalar((index%3-1)*.12);

  const p1=sourcePosition.clone();
  const p2=sourcePosition.clone().lerp(targetPosition,.24);
  p2.y=lift;
  p2.add(side);
  const p3=sourcePosition.clone().lerp(targetPosition,.76);
  p3.y=lift;
  p3.add(side);
  const p4=targetPosition.clone();

  const curve=new THREE.CatmullRomCurve3(
   [p1,p2,p3,p4],
   false,
   'catmullrom',
   .25
  );

  const color=new THREE.Color(wire.color||wireColor(index));
  const geometry=new THREE.TubeGeometry(
   curve,
   56,
   selected?.065:.038,
   8,
   false
  );
  const isActive=wiring3DState.activeWireId===wire.id;
  const material=new THREE.MeshStandardMaterial({
   color,
   emissive:color,
   emissiveIntensity:isActive?1.8:.45,
   roughness:.28,
   metalness:.04,
   transparent:true,
   opacity:isActive?.30:(wiring3DState.hideIdleWires?0:.30),
   depthTest:true
  });

  const tube=new THREE.Mesh(geometry,material);
  tube.userData.wireId=wire.id;
  tube.userData.sourceId=wire.sourceId;
  tube.userData.targetId=wire.targetId;
  wireRoot.add(tube);
  wiring3DState.wireObjects.set(wire.id,tube);
  wiring3DState.wireCurves.set(wire.id,curve);

  const sourceMarker=addSceneWireMarker(
   wireRoot,
   p1,
   0xf4a62a,
   `${sourceItem.name}.${wire.sourcePort}`
  );
  const targetMarker=addSceneWireMarker(
   wireRoot,
   p4,
   0x4eb5ef,
   `${targetItem.name}.${wire.targetPort}`
  );
  sourceMarker.visible=!wiring3DState.hideIdleWires||isActive;
  targetMarker.visible=!wiring3DState.hideIdleWires||isActive;
  wiring3DState.sourceMarkers.push(sourceMarker);
  wiring3DState.targetMarkers.push(targetMarker);
 });

 renderer.render(scene,camera);
}


function setSignalFlowStatus(title,detail,running=false){
 const el=$('signalFlowStatus');
 if(!el)return;
 el.querySelector('strong').textContent=title;
 el.querySelector('span').textContent=detail;
 el.classList.toggle('running',running);
}
function defaultTransmissionSeconds(){
 const value=Math.max(.1,Math.min(30,Number($('signalDurationInput')?.value)||.5));
 if($('signalDurationInput'))$('signalDurationInput').value=String(value);
 return value;
}
function firstFinite(...values){
 for(const value of values){
  const number=Number(value);
  if(Number.isFinite(number)&&number>=0)return number;
 }
 return null;
}
function getTimerDelaySeconds(item,phase='on'){
 const p=item?.params||{};
 const type=String(item?.type||'').toLowerCase();
 const name=String(item?.name||'');
 const isTimer=/timer|delay|延遲|計時|斷電延時|通電延遲/.test(`${type} ${name}`);
 if(!isTimer)return 0;

 if(/斷電延時|offdelay|off-delay/.test(`${type} ${name}`)||phase==='off'){
  return firstFinite(
   p.offDelaySeconds,p.powerOffDelaySeconds,p.delayOffSeconds,
   p.releaseDelaySeconds,p.delaySeconds,p.seconds,p.duration
  )??0;
 }
 if(/通電延遲|ondelay|on-delay/.test(`${type} ${name}`)){
  return firstFinite(
   p.onDelaySeconds,p.powerOnDelaySeconds,p.delayOnSeconds,
   p.pickupDelaySeconds,p.delaySeconds,p.seconds,p.duration
  )??0;
 }
 return firstFinite(
  p.delaySeconds,p.timerSeconds,p.seconds,p.duration,
  p.intervalSeconds,p.autoSeconds
 )??0;
}
function getActionSeconds(item){
 const p=item?.params||{};
 const type=String(item?.type||'').toLowerCase();
 if(/barrier/.test(type)){
  return firstFinite(p.openSeconds,p.raiseSeconds,p.travelSeconds,p.speedSeconds)??0;
 }
 if(/shutter/.test(type)){
  return firstFinite(p.openSeconds,p.closeSeconds,p.travelSeconds)??0;
 }
 if(/traffic|signal/.test(type)){
  return firstFinite(p.switchSeconds,p.intervalSeconds,p.greenSeconds,p.redSeconds)??0;
 }
 return firstFinite(p.actionSeconds,p.responseSeconds)??0;
}
function removeSignalBall(){
 if(wiring3DState.animationFrame){
  cancelAnimationFrame(wiring3DState.animationFrame);
  wiring3DState.animationFrame=null;
 }
 if(wiring3DState.signalBall?.parent){
  wiring3DState.signalBall.parent.remove(wiring3DState.signalBall);
 }
 wiring3DState.signalBall=null;
}
function createSignalBall(color){
 const group=new THREE.Group();
 group.add(new THREE.Mesh(
  new THREE.SphereGeometry(.18,28,20),
  new THREE.MeshPhysicalMaterial({
   color,emissive:color,emissiveIntensity:4.2,
   roughness:.08,clearcoat:1,clearcoatRoughness:.02
  })
 ));
 group.add(new THREE.Mesh(
  new THREE.SphereGeometry(.31,20,14),
  new THREE.MeshBasicMaterial({
   color,transparent:true,opacity:.24,depthWrite:false
  })
 ));
 group.add(new THREE.PointLight(color,2.6,4.2,2));
 return group;
}
function updateSignalLineVisibility(activeWireId){
 wiring3DState.wireObjects.forEach((tube,id)=>{
  const active=id===activeWireId;
  tube.visible=active||!wiring3DState.hideIdleWires;
  tube.material.opacity=active?.30:(wiring3DState.hideIdleWires?0:.30);
  tube.material.emissiveIntensity=active?1.8:.45;
 });
 wiring3DState.sourceMarkers.forEach(marker=>{
  marker.visible=!wiring3DState.hideIdleWires;
 });
 wiring3DState.targetMarkers.forEach(marker=>{
  marker.visible=!wiring3DState.hideIdleWires;
 });
}
function sleepSeconds(seconds,onTick){
 return new Promise(resolve=>{
  if(seconds<=0){resolve();return}
  const start=performance.now();
  const total=seconds*1000;
  const tick=now=>{
   const remaining=Math.max(0,(total-(now-start))/1000);
   onTick?.(remaining);
   renderer.render(scene,camera);
   if(remaining>0){
    requestAnimationFrame(tick);
   }else{
    resolve();
   }
  };
  requestAnimationFrame(tick);
 });
}
function animateSignalTravel(wire,durationSeconds){
 return new Promise(resolve=>{
  const curve=wiring3DState.wireCurves.get(wire.id);
  if(!curve){resolve(false);return}

  removeSignalBall();
  wiring3DState.running=true;
  wiring3DState.activeWireId=wire.id;
  updateSignalLineVisibility(wire.id);

  const source=get(wire.sourceId);
  const target=get(wire.targetId);
  const color=new THREE.Color(wire.color||'#35ddff');
  const ball=createSignalBall(color);
  wiring3DState.wireRoot.add(ball);
  wiring3DState.signalBall=ball;

  const sourceName=source?.name||wire.sourceId;
  const targetName=target?.name||wire.targetId;
  setSignalFlowStatus(
   `訊號飛行：${sourceName} → ${targetName}`,
   `${wire.sourcePort} → ${wire.targetPort}｜${durationSeconds.toFixed(1)}秒抵達`,
   true
  );

  const start=performance.now();
  const total=Math.max(.1,durationSeconds)*1000;
  const frame=now=>{
   const raw=Math.min(1,(now-start)/total);
   const eased=raw<.5?2*raw*raw:1-Math.pow(-2*raw+2,2)/2;
   ball.position.copy(curve.getPointAt(eased));
   renderer.render(scene,camera);
   if(raw<1){
    wiring3DState.animationFrame=requestAnimationFrame(frame);
   }else{
    wiring3DState.animationFrame=null;
    resolve(true);
   }
  };
  wiring3DState.animationFrame=requestAnimationFrame(frame);
 });
}
async function runWireStep(wire){
 const target=get(wire.targetId);
 const source=get(wire.sourceId);
 const travelSeconds=firstFinite(wire.travelSeconds,wire.transmissionSeconds)??defaultTransmissionSeconds();

 await animateSignalTravel(wire,travelSeconds);

 const timerDelay=getTimerDelaySeconds(target,'on');
 if(timerDelay>0){
  const targetName=target?.name||wire.targetId;
  await sleepSeconds(timerDelay,remaining=>{
   setSignalFlowStatus(
    `定時器等待：${targetName}`,
    `模組設定 ${timerDelay.toFixed(1)} 秒｜剩餘 ${remaining.toFixed(1)} 秒`,
    true
   );
   if(wiring3DState.signalBall){
    const pulse=1+Math.sin(performance.now()/130)*.13;
    wiring3DState.signalBall.scale.setScalar(pulse);
   }
  });
 }

 const actionSeconds=getActionSeconds(target);
 if(actionSeconds>0){
  const targetName=target?.name||wire.targetId;
  await sleepSeconds(actionSeconds,remaining=>{
   setSignalFlowStatus(
    `設備動作：${targetName}`,
    `設備動作時間 ${actionSeconds.toFixed(1)} 秒｜剩餘 ${remaining.toFixed(1)} 秒`,
    true
   );
  });
 }

 removeSignalBall();
 wiring3DState.running=false;
 setSignalFlowStatus(
  `完成：${source?.name||wire.sourceId} → ${target?.name||wire.targetId}`,
  timerDelay>0
   ?`已包含定時器等待 ${timerDelay.toFixed(1)} 秒。`
   :`訊號已抵達，等待下一個觸發。`
 );
 await sleepSeconds(.45);
 wiring3DState.activeWireId=null;
 renderSceneWiring3D();
}
async function triggerNextSignal(){
 if(wiring3DState.running)return;
 if(wiring3DState.mode!=='3d'){
  setWiringView('3d');
  await sleepSeconds(.12);
 }
 if(!state.wires?.length){
  setSignalFlowStatus('沒有接線','請先在2D模式建立DO到DI的接線。');
  return;
 }
 if(wiring3DState.sequenceIndex>=state.wires.length)wiring3DState.sequenceIndex=0;
 const wire=state.wires[wiring3DState.sequenceIndex++];
 await runWireStep(wire);
}
async function triggerSignalSequence(){
 if(wiring3DState.running)return;
 if(!state.wires?.length){
  setSignalFlowStatus('沒有接線','請先建立接線後再執行。');
  return;
 }
 wiring3DState.autoSequence=true;
 wiring3DState.sequenceIndex=0;
 while(wiring3DState.autoSequence&&wiring3DState.sequenceIndex<state.wires.length){
  const wire=state.wires[wiring3DState.sequenceIndex++];
  await runWireStep(wire);
 }
 wiring3DState.autoSequence=false;
 wiring3DState.sequenceIndex=0;
 setSignalFlowStatus('流程完成','所有已建立接線均已依模組時間播放完成。');
}
function toggleIdleWires(){
 wiring3DState.hideIdleWires=!wiring3DState.hideIdleWires;
 const button=$('toggleIdleWiresBtn');
 if(button){
  button.textContent=wiring3DState.hideIdleWires
   ?'🙈 待機隱藏線：開啟'
   :'👁 待機隱藏線：關閉';
 }
 if(!wiring3DState.running){
  renderSceneWiring3D();
  setSignalFlowStatus(
   '訊號待機',
   wiring3DState.hideIdleWires
    ?'沒有觸發時，線路與球體隱藏。'
    :'待機顯示全部接線，透明度30%。'
  );
 }
}
function resizeSceneRenderer(){
 const activeContainer=(
  wiring3DState.mode==='3d' &&
  $('wiringDialog')?.open
 )
  ?$('wiring3DMount')
  :$('sceneWrap');

 if(!activeContainer)return;
 const width=Math.max(1,activeContainer.clientWidth);
 const height=Math.max(1,activeContainer.clientHeight);
 renderer.setSize(width,height,false);
 camera.aspect=width/height;
 camera.updateProjectionMatrix();
}

function dockMainSceneIntoWiring(){
 const mount=$('wiring3DMount');
 const canvas=renderer.domElement;
 if(!mount||!canvas)return;

 if(!wiring3DState.canvasHome){
  wiring3DState.canvasHome=canvas.parentNode;
  wiring3DState.canvasNextSibling=canvas.nextSibling;
 }

 if(canvas.parentNode!==mount){
  mount.appendChild(canvas);
 }

 $('sceneCanvasDockPlaceholder')?.removeAttribute('hidden');
 requestAnimationFrame(()=>{
  resizeSceneRenderer();
  renderSceneWiring3D();
 });
}

function restoreMainSceneCanvas(){
 const canvas=renderer.domElement;
 const home=wiring3DState.canvasHome||$('sceneWrap');
 if(!canvas||!home)return;

 if(canvas.parentNode!==home){
  if(
   wiring3DState.canvasNextSibling &&
   wiring3DState.canvasNextSibling.parentNode===home
  ){
   home.insertBefore(canvas,wiring3DState.canvasNextSibling);
  }else{
   home.insertBefore(canvas,home.firstChild);
  }
 }

 $('sceneCanvasDockPlaceholder')?.setAttribute('hidden','');
 requestAnimationFrame(resizeSceneRenderer);
}

function resetWiring3DView(){
 setView(10.8,10.2,13.6);
 renderSceneWiring3D();
}

function setWiringView(mode){
 wiring3DState.mode=mode==='3d'?'3d':'2d';
 const is3D=wiring3DState.mode==='3d';

 $('wiringWorkspace')?.classList.toggle('wire-view-3d',is3D);
 $('wireView2D')?.classList.toggle('active',!is3D);
 $('wireView3D')?.classList.toggle('active',is3D);
 $('wiring3DCanvas')?.toggleAttribute('hidden',!is3D);

 if(is3D){
  dockMainSceneIntoWiring();
 }else{
  wiring3DState.autoSequence=false;
  removeSignalBall();
  clearSceneWiring3D();
  restoreMainSceneCanvas();
  requestAnimationFrame(drawWires);
 }

 window.UTOP_DEBUG?.record?.(
  'ACTION',
  'Wiring',
  `切換為${is3D?'真實場景3D':'平面2D'}接線視圖`
 );
}

function closeWiringDialogSafely(){
 wiring3DState.autoSequence=false;
 removeSignalBall();
 clearSceneWiring3D();
 restoreMainSceneCanvas();
 $('wiringDialog').close();
}

$('wireView2D')?.addEventListener('click',()=>setWiringView('2d'));
$('wireView3D')?.addEventListener('click',()=>setWiringView('3d'));
$('resetWiring3DView')?.addEventListener('click',resetWiring3DView);
$('toggleIdleWiresBtn')?.addEventListener('click',toggleIdleWires);
$('triggerNextSignalBtn')?.addEventListener('click',triggerNextSignal);
$('triggerSequenceBtn')?.addEventListener('click',triggerSignalSequence);

window.UTOP_WIRING_VIEW=Object.freeze({
 setMode:setWiringView,
 refresh3D:renderSceneWiring3D,
 reset3D:resetWiring3DView,
 restoreScene:restoreMainSceneCanvas
});

$('wiringBtn').onclick=()=>{
 $('wiringDialog').showModal();
 renderWiring();
 setTimeout(()=>{
  if(wiring3DState.mode==='3d')dockMainSceneIntoWiring();
  else resizeSceneRenderer();
 },0);
};
$('closeWiring').onclick=closeWiringDialogSafely;
$('wiringDialog').addEventListener('cancel',event=>{
 event.preventDefault();
 closeWiringDialogSafely();
});
$('cancelWire').onclick=()=>{
 state.pending=null;
 $('wireHint').textContent='尚未選擇來源';
 renderWiring();
};
$('clearWires').onclick=()=>{
 if(confirm('清除全部接線？')){
  state.wires=[];
  clearSceneWiring3D();
  renderWiring();
  renderAll();
  markDirty();
 }
};




let currentManagedSceneId='basic-lane';

function clearManagedSceneContent(){
 try{window.UTOP_MONTECARLO_PLUGIN?.unload?.({silent:true})}catch(error){console.warn('Monte Carlo clear:',error)}
 try{window.UTOP_SINGLE_LANE_PLUGIN?.unload?.({silent:true})}catch(error){console.warn('Single lane clear:',error)}
 try{window.UTOP_SNOW_ROAD_PLUGIN?.unload?.({silent:true})}catch(error){console.warn('Snow road clear:',error)}
 resetSceneHeightRange();
 window.UTOP_SCENE_HEIGHT_PROVIDER=null;
 state.items.forEach(item=>{try{if(item.mesh)group.remove(item.mesh)}catch(error){console.warn('Scene clear:',error)}});
 state.items=[];state.wires=[];state.selectedId=null;state.pending=null;state.activeWires.clear();
 try{renderAll();renderInspector()}catch(error){console.warn('Scene refresh:',error)}
 window.dispatchEvent(new CustomEvent('utop-managed-scene-cleared'));
}

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

$('applySelectedScene')?.addEventListener('click',async()=>{
 const chosen=selectedSceneId||'basic-lane';
 const card=document.querySelector(`[data-scene-id="${chosen}"]`);
 const sceneName=card?.querySelector('strong')?.textContent?.trim()||chosen;
 if(!confirm(`切換到「${sceneName}」？目前尚未儲存的設備與接線會先清空。`))return;
 clearManagedSceneContent();
 if(chosen==='montecarlo'){
  applyScene('basic-lane');
  try{
   await window.UTOP_MONTECARLO_PLUGIN?.activate?.();
   currentManagedSceneId='montecarlo';
  }catch(error){
   console.error(error);
   currentManagedSceneId='basic-lane';
   $('statusText').textContent=`蒙地卡羅載入失敗：${error.message}`;
   return;
  }
 }else if(chosen==='single-lane'){
  applyScene('basic-lane');
  try{
   await window.UTOP_SINGLE_LANE_PLUGIN?.activate?.();
   currentManagedSceneId='single-lane';
  }catch(error){
   console.error(error);
   currentManagedSceneId='basic-lane';
   $('statusText').textContent=`單車道載入失敗：${error.message}`;
   return;
  }
 }else if(chosen==='snow-road'){
  applyScene('basic-lane');
  try{
   await window.UTOP_SNOW_ROAD_PLUGIN?.activate?.();
   currentManagedSceneId='snow-road';
  }catch(error){
   console.error(error);
   currentManagedSceneId='basic-lane';
   $('statusText').textContent=`雪地道路載入失敗：${error.message}`;
   return;
  }
 }else{
  applyScene(chosen);
  currentManagedSceneId=chosen;
 }
 $('sceneLibraryDialog')?.close();
 if($('currentSceneLabel'))$('currentSceneLabel').textContent=`目前場景：${sceneName}`;
 $('statusText').textContent=`場景已切換：${sceneName}`;
 markDirty();
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
 graphicsSettingsDraft={...GRAPHICS_PRESETS.ultra};
 populateGraphicsSettingsUI(graphicsSettingsDraft);
 window.UTOP_ADVANCED_QUALITY?.apply?.('global-illumination');
 window.UTOP_REALISTIC_QUALITY?.apply?.('global-illumination');
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

function resize(){
 resizeSceneRenderer();
}
const mainSceneResizeObserver=new ResizeObserver(resize);
mainSceneResizeObserver.observe($('sceneWrap'));
if($('wiring3DMount'))mainSceneResizeObserver.observe($('wiring3DMount'));
resize();
setTimeout(updateHeightControls,0);

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

  if(i&&i.type==='ledpanel'&&i.params&&i.params.state==='RUNNING'){
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
        renderInspector();
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
        renderInspector();
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
 if(wiring3DState?.mode==='3d')setTimeout(renderSceneWiring3D,0);
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
  if(wiring3DState.mode==='3d')renderSceneWiring3D();
}
function clearWireAnalysis(){
  sceneSettings.selectedWireId=null;
  document.querySelectorAll('#wireSvg path,.device-node').forEach(el=>el.classList.remove('selected','dimmed','focused'));
  if($('wireInfoStatus'))$('wireInfoStatus').textContent='點選連線可查看詳細資料';
  if($('wireInfoContent'))$('wireInfoContent').innerHTML='<p>點選右側清單中的一筆連線，或直接點選畫面上的線路。</p>';
  document.querySelectorAll('[data-wire-row]').forEach(row=>row.classList.remove('selected'));
  if(wiring3DState.mode==='3d')renderSceneWiring3D();
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
   return state.wires.map((wire,index)=>{
    const source=typeof get==='function'?get(wire.sourceId):null;
    const target=typeof get==='function'?get(wire.targetId):null;
    return {
     ...wire,
     id:wire.id||`wire-${index}`,
     sourceName:source?.name||wire.sourceName||wire.fromName||'來源設備',
     sourcePort:wire.sourcePort||wire.fromPort||wire.fromIo||'DO',
     targetName:target?.name||wire.targetName||wire.toName||'目標設備',
     targetPort:wire.targetPort||wire.toPort||wire.toIo||'DI'
    };
   });
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


/* V2.5.6 direct device control bridge */
(function(){
 function selected(){
  try{
   return typeof get==='function' ? get(state.selectedId) : null;
  }catch(_error){
   return null;
  }
 }

 function getSelected(){
  const item=selected();
  if(!item)return null;
  return {
   id:item.id,
   name:item.name,
   type:item.type,
   status:typeof statusText==='function'?statusText(item):''
  };
 }

 function execute(action){
  const item=selected();
  if(!item)return false;

  try{
   input(item,action);
   renderInspector();
   renderQuick(item);
   renderPlan();
   if(typeof renderAll==='function')renderAll();
   if(typeof markDirty==='function')markDirty();

   window.dispatchEvent(new CustomEvent('utop-device-control-updated',{
    detail:{id:item.id,action}
   }));
   return true;
  }catch(error){
   console.error('[UTOP-3D] 快速控制失敗',error);
   return false;
  }
 }

 window.UTOP_DEVICE_CONTROL=Object.freeze({getSelected,execute});
 window.__UTOP_STATE__=state;
})();


/* V2.5.7 module library default collapsed */
(function(){
 function collapseAllModuleGroups(){
  document.querySelectorAll(
   '.module-category,.module-group,.library-category,[data-module-category]'
  ).forEach(group=>{
   group.classList.remove('expanded','open','active');
   group.setAttribute('aria-expanded','false');
  });

  document.querySelectorAll('#moduleList > details').forEach(details=>{
   details.open=false;
   details.hidden=false;
  });
 }

 setTimeout(collapseAllModuleGroups,0);
 window.addEventListener('utop:runtime-ready',collapseAllModuleGroups);
})();


/* V2.6.0 Professional UI */
(function(){
 function initializeProfessionalUi(){
  document.querySelectorAll('#moduleList details').forEach(details=>{
   details.open=false;
  });

  const sidebar=document.querySelector('.professional-sidebar');
  const collapseButton=document.getElementById('collapseSidebar');
  collapseButton?.addEventListener('click',()=>{
   const collapsed=sidebar?.classList.toggle('is-collapsed');
   document.body.classList.toggle('sidebar-collapsed',Boolean(collapsed));
   collapseButton.textContent=collapsed?'›':'‹';
   requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
  });
 }

 setTimeout(initializeProfessionalUi,0);
})();


/* V2.7.0 Professional Inspector UI */
(function(){
 function initializeInspectorUi(){
  document.querySelectorAll('#moduleList details').forEach(details=>{
   details.open=false;
  });

  const shell=document.getElementById('deviceInspectorShell');
  const toggle=document.getElementById('deviceInspectorToggle');

  shell?.classList.add('is-open');
  shell?.classList.remove('is-collapsed');
  toggle?.setAttribute('aria-expanded','true');

  requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
 }

 setTimeout(initializeInspectorUi,0);
 window.addEventListener('utop:runtime-ready',initializeInspectorUi);
})();





/* V4.1.0 Collapsible Sidebar Inspector */
(function(){
 function stabilizeSidebar(){
  const list=document.getElementById('moduleList');
  if(list){
   list.hidden=false;
   list.style.display='block';
   list.querySelectorAll(':scope > details').forEach(details=>{
    details.hidden=false;
   });
  }

  const shell=document.getElementById('deviceInspectorShell');
  const panel=document.getElementById('deviceInspectorPanel');
  if(shell&&panel){
   shell.style.position='static';
   panel.style.position='static';
   panel.style.width='100%';
   panel.style.maxWidth='100%';
  }
 }

 setTimeout(stabilizeSidebar,0);
 window.addEventListener('utop:runtime-ready',stabilizeSidebar);
})();


/* V4.1.0 Unlimited Loop Dimensions */
(function(){
 function normalizeLoopDimensions(){
  const devices=window.state?.devices || window.UTOP_STATE?.devices || [];
  if(!Array.isArray(devices))return;

  devices.forEach(device=>{
   const type=String(
    device?.type ||
    device?.deviceType ||
    device?.kind ||
    device?.model ||
    device?.code ||
    ''
   ).toLowerCase();

   const isLoop=
    type.includes('地感線圈') ||
    type.includes('lane-loop') ||
    type.includes('ground-loop') ||
    type==='loop';

   if(!isLoop)return;

   for(const key of ['width','length','loopWidth','loopLength']){
    if(device[key]===undefined)continue;
    const value=Number(device[key]);
    if(Number.isFinite(value) && value>0){
     device[key]=value;
    }
   }
  });
 }

 window.addEventListener('utop-loop-dimension-change',event=>{
  const detail=event.detail||{};
  const selected=
   window.state?.selectedDevice ||
   window.UTOP_STATE?.selectedDevice ||
   null;

  if(!selected)return;

  const field=String(detail.field||'').toLowerCase();
  if(field.includes('width') || field.includes('寬')){
   selected.width=detail.value;
   selected.loopWidth=detail.value;
  }
  if(field.includes('length') || field.includes('長')){
   selected.length=detail.value;
   selected.loopLength=detail.value;
  }

  normalizeLoopDimensions();

  window.dispatchEvent(new CustomEvent('utop-device-dimensions-updated',{
   detail:{device:selected}
  }));

  window.dispatchEvent(new Event('resize'));
 });

 setTimeout(normalizeLoopDimensions,0);
 window.addEventListener('utop:runtime-ready',normalizeLoopDimensions);
})();


/* V4.1.0 Realistic Rendering Foundation */
(async function(){
 let pbr=null,environment=null;
 try{
  pbr=await import('../rendering/pbr-material-engine-v3000.js');
  environment=await import('../rendering/environment-engine-v3000.js');
 }catch(error){
  console.warn('V3 realistic rendering modules unavailable:',error);
 }

 async function upgrade(){
  if(!pbr)return;
  const devices=window.state?.devices||window.UTOP_STATE?.devices||window.devices||[];
  if(!Array.isArray(devices))return;
  for(const device of devices){
   const root=device?.object3D||device?.mesh||device?.group||device?.model3D;
   if(root)await pbr.applyDevicePbrMaterials(root,device);
  }
 }

 async function environmentDefault(){
  if(!environment)return;
  const scene=window.state?.scene||window.UTOP_STATE?.scene||window.scene||null;
  await environment.applyEnvironmentProfile(scene,'day-clear');
 }

 window.addEventListener('utop-realistic-quality-change',upgrade);
 window.addEventListener('utop-device-added',upgrade);
 window.addEventListener('utop-scene-loaded',()=>{upgrade();environmentDefault();});
 setTimeout(()=>{upgrade();environmentDefault();},0);
 window.UTOP_V3_RENDERING=Object.freeze({upgrade,environmentDefault});
})();


/* =========================================================
   V4.1.0 Reliable Scene Brightness
   ========================================================= */
(function(){
 const BASE_EXPOSURE=1.08;
 const BASE_HEMI_INTENSITY=1.25;
 const BASE_SUN_INTENSITY=2.15;
 const BASE_FILL_INTENSITY=.55;
 let brightnessMultiplier=Number(window.UTOP_SCENE_BRIGHTNESS)||1.2;
 let qualityExposure=1;

 function applySceneBrightness(nextValue){
  if(Number.isFinite(Number(nextValue))){
   brightnessMultiplier=Math.max(.6,Math.min(1.8,Number(nextValue)));
  }

  const multiplier=brightnessMultiplier;

  // Make the visual change unambiguous.
  renderer.toneMappingExposure=
   BASE_EXPOSURE *
   qualityExposure *
   multiplier;

  hemiLight.intensity=
   BASE_HEMI_INTENSITY *
   (.55+multiplier*.55);

  sun.intensity=
   BASE_SUN_INTENSITY *
   (.5+multiplier*.6);

  fillLight.intensity=
   BASE_FILL_INTENSITY *
   (.35+multiplier*.9);

  document.documentElement.style.setProperty(
   '--utop-scene-brightness',
   String(multiplier)
  );

  renderer.render(scene,camera);
  return multiplier;
 }

 window.UTOP_SET_SCENE_BRIGHTNESS=value=>{
  window.UTOP_SCENE_BRIGHTNESS=value;
  return applySceneBrightness(value);
 };

 window.addEventListener('utop-scene-brightness-change',event=>{
  applySceneBrightness(Number(event.detail?.multiplier));
 });

 window.addEventListener('utop-realistic-quality-change',event=>{
  const exposure=Number(event.detail?.exposure);
  qualityExposure=Number.isFinite(exposure)&&exposure>0
   ? exposure
   : 1;
  applySceneBrightness();
 });

 applySceneBrightness(brightnessMultiplier);

 window.UTOP_APPLY_SCENE_BRIGHTNESS=applySceneBrightness;
})();


/* =========================================================
   V4.1.0 Mobile Workspace Helpers
   ========================================================= */
window.UTOP_SET_MOBILE_VIEW=function(mode){
 document.documentElement.classList.remove(
  'mobile-focus-3d',
  'mobile-focus-2d'
 );

 if(mode==='3d'){
  document.documentElement.classList.add('mobile-focus-3d');
 }else if(mode==='2d'){
  document.documentElement.classList.add('mobile-focus-2d');
 }

 window.setTimeout(()=>{
  window.dispatchEvent(new Event('resize'));
 },80);
};


/* =========================================================
   V4.1.0 Professional 2D Selection Engine
   ========================================================= */
(function(){
 let multiSelectMode=false;
 let snapGridEnabled=false;
 let selectedIds=new Set();
 let hoveredId=null;
 const SNAP_STEP=.25;

 function getItemById(id){
  return state?.items?.find(item=>String(item.id)===String(id))||null;
 }

 function getDeviceId(group){
  if(!group)return null;
  return (
   group.dataset?.deviceId ||
   group.getAttribute?.('data-device-id') ||
   group.dataset?.id ||
   group.getAttribute?.('data-id') ||
   group.__dataId ||
   null
  );
 }

 function getPlanSvg(){
  return (
   document.querySelector('#planSvg') ||
   document.querySelector('#viewer2d svg') ||
   document.querySelector('.panel-2d svg') ||
   document.querySelector('.plan-panel svg') ||
   document.querySelector('svg')
  );
 }

 function getPlanGroups(){
  const svg=getPlanSvg();
  if(!svg)return [];

  return [...svg.querySelectorAll(
   'g[data-device-id],g[data-id],g.plan-device,g.utop-plan-device'
  )].filter(group=>getDeviceId(group));
 }

 function findVisualBounds(group){
  const nodes=[...group.children].filter(node=>{
   const tag=node.tagName?.toLowerCase();
   return tag&&tag!=='text'&&!node.classList?.contains('utop-device-hitbox');
  });

  let bounds=null;

  for(const node of nodes){
   try{
    const box=node.getBBox();
    if(!Number.isFinite(box.x)||box.width<=0||box.height<=0)continue;

    if(!bounds){
     bounds={x:box.x,y:box.y,width:box.width,height:box.height};
    }else{
     const x1=Math.min(bounds.x,box.x);
     const y1=Math.min(bounds.y,box.y);
     const x2=Math.max(bounds.x+bounds.width,box.x+box.width);
     const y2=Math.max(bounds.y+bounds.height,box.y+box.height);
     bounds={x:x1,y:y1,width:x2-x1,height:y2-y1};
    }
   }catch(_){}
  }

  if(!bounds){
   try{
    bounds=group.getBBox();
   }catch(_){
    bounds={x:-24,y:-24,width:48,height:48};
   }
  }

  return bounds;
 }

 function ensureHitbox(group){
  let hitbox=group.querySelector(':scope > .utop-device-hitbox');
  if(hitbox){
   const x=Number(hitbox.getAttribute('x'))||-30;
   const y=Number(hitbox.getAttribute('y'))||-30;
   const width=Number(hitbox.getAttribute('width'))||60;
   const height=Number(hitbox.getAttribute('height'))||60;

   const ensureOutline=(className,padding)=>{
    let outline=group.querySelector(`:scope > .${className}`);
    if(!outline){
     outline=document.createElementNS('http://www.w3.org/2000/svg','rect');
     outline.setAttribute('class',className);
     outline.setAttribute('pointer-events','none');
     group.insertBefore(outline,hitbox.nextSibling);
    }
    outline.setAttribute('x',String(x-padding));
    outline.setAttribute('y',String(y-padding));
    outline.setAttribute('width',String(width+padding*2));
    outline.setAttribute('height',String(height+padding*2));
    outline.setAttribute('rx','12');
   };

   ensureOutline('utop-selection-outline',2);
   ensureOutline('utop-hover-outline',0);
   return hitbox;
  }

  const box=findVisualBounds(group);
  const pad=Math.max(12,Math.min(34,Math.max(box.width,box.height)*.25));

  hitbox=document.createElementNS(
   'http://www.w3.org/2000/svg',
   'rect'
  );

  hitbox.setAttribute('x',String(box.x-pad));
  hitbox.setAttribute('y',String(box.y-pad));
  hitbox.setAttribute('width',String(box.width+pad*2));
  hitbox.setAttribute('height',String(box.height+pad*2));
  hitbox.setAttribute('rx','10');
  hitbox.setAttribute('class','utop-device-hitbox');
  hitbox.setAttribute('fill','#ffffff');
  hitbox.setAttribute('fill-opacity','0');
  hitbox.setAttribute('stroke','none');
  hitbox.setAttribute('stroke-opacity','0');
  hitbox.setAttribute('opacity','0');
  hitbox.setAttribute('pointer-events','all');
  hitbox.setAttribute('aria-label','點選設備');

  group.insertBefore(hitbox,group.firstChild);

  const makeOutline=(className,extraPadding)=>{
   const outline=document.createElementNS(
    'http://www.w3.org/2000/svg',
    'rect'
   );
   outline.setAttribute('x',String(box.x-pad-extraPadding));
   outline.setAttribute('y',String(box.y-pad-extraPadding));
   outline.setAttribute('width',String(box.width+(pad+extraPadding)*2));
   outline.setAttribute('height',String(box.height+(pad+extraPadding)*2));
   outline.setAttribute('rx','12');
   outline.setAttribute('class',className);
   outline.setAttribute('pointer-events','none');
   group.insertBefore(outline,hitbox.nextSibling);
   return outline;
  };

  if(!group.querySelector(':scope > .utop-selection-outline')){
   makeOutline('utop-selection-outline',2);
  }
  if(!group.querySelector(':scope > .utop-hover-outline')){
   makeOutline('utop-hover-outline',0);
  }

  [...group.children].forEach(child=>{
   if(
    child!==hitbox &&
    !child.classList.contains('utop-selection-outline') &&
    !child.classList.contains('utop-hover-outline')
   ){
    child.setAttribute('data-visual-part','true');
   }
  });

  return hitbox;
 }

 function dispatchSelectionChanged(){
  const items=[...selectedIds]
   .map(getItemById)
   .filter(Boolean);

  window.dispatchEvent(new CustomEvent(
   'utop-selection-changed',
   {
    detail:{
     ids:[...selectedIds],
     count:items.length,
     names:items.map(item=>item.name||item.id)
    }
   }
  ));
 }

 function syncSelectedClasses(){
  for(const group of getPlanGroups()){
   const id=String(getDeviceId(group));
   group.classList.add('plan-device','utop-plan-device');
   group.classList.toggle('is-selected',selectedIds.has(id));
   group.classList.toggle('is-hovered',hoveredId===id);
   group.setAttribute(
    'aria-selected',
    selectedIds.has(id)?'true':'false'
   );
  }

  const canvas=document.querySelector(
   '#viewer3d canvas,.panel-3d canvas,.three-panel canvas,canvas'
  );

  canvas?.classList.toggle(
   'utop-selection-active',
   selectedIds.size>0
  );
 }

 function selectItem(id,{additive=false,toggle=false}={}){
  id=String(id);
  const item=getItemById(id);
  if(!item)return;

  if(!additive&&!multiSelectMode){
   selectedIds.clear();
  }

  if(toggle&&selectedIds.has(id)){
   selectedIds.delete(id);
  }else{
   selectedIds.add(id);
  }

  // Existing application selection remains the primary item.
  if(selectedIds.has(id)){
   state.selectedId=id;

   try{
    if(typeof renderAll==='function')renderAll();
    else{
     if(typeof renderPlan==='function')renderPlan();
     if(typeof renderInspector==='function')renderInspector();
    }

    if(typeof renderQuick==='function')renderQuick(item);

    window.dispatchEvent(new CustomEvent(
     'utop-primary-selection-changed',
     {detail:{id:item.id,name:item.name,type:item.type}}
    ));

    window.setTimeout(()=>{
     if(state.selectedId===item.id){
      if(typeof renderInspector==='function')renderInspector();
      if(typeof renderQuick==='function')renderQuick(item);
      window.UTOP_QUICK_CONTROL?.refresh?.();
     }
    },0);
   }catch(error){
    console.warn('UTOP selection sync:',error);
   }
  }else if(state.selectedId===id){
   const next=[...selectedIds].at(-1)||null;
   state.selectedId=next;

   try{
    if(typeof renderInspector==='function')renderInspector();
    if(next&&typeof renderQuick==='function'){
     const nextItem=getItemById(next);
     if(nextItem)renderQuick(nextItem);
    }
    if(typeof renderPlan==='function')renderPlan();
   }catch(error){
    console.warn('UTOP selection clear sync:',error);
   }
  }

  queueMicrotask(()=>{
   bindPlanSelection();
   syncSelectedClasses();
   dispatchSelectionChanged();
  });
 }

 function clearSelection(){
  selectedIds.clear();
  state.selectedId=null;

  try{
   if(typeof renderInspector==='function')renderInspector();
   if(typeof renderPlan==='function')renderPlan();
  }catch(error){
   console.warn('UTOP clear selection:',error);
  }

  queueMicrotask(()=>{
   bindPlanSelection();
   syncSelectedClasses();
   dispatchSelectionChanged();
  });
 }

 function onGroupPointerDown(event){
  const group=event.currentTarget;
  const id=getDeviceId(group);
  if(!id)return;

  event.preventDefault();
  event.stopPropagation();

  const additive=(
   multiSelectMode ||
   event.shiftKey ||
   event.ctrlKey ||
   event.metaKey
  );

  selectItem(id,{
   additive,
   toggle:additive
  });
 }


 function repairExistingHitboxes(){
  const svg=getPlanSvg();
  if(!svg)return;

  svg.querySelectorAll('.utop-device-hitbox').forEach(hitbox=>{
   hitbox.setAttribute('fill','#ffffff');
   hitbox.setAttribute('fill-opacity','0');
   hitbox.setAttribute('stroke','none');
   hitbox.setAttribute('stroke-opacity','0');
   hitbox.setAttribute('opacity','0');
   hitbox.setAttribute('pointer-events','all');

   hitbox.style.setProperty('fill','#ffffff','important');
   hitbox.style.setProperty('fill-opacity','0','important');
   hitbox.style.setProperty('stroke','none','important');
   hitbox.style.setProperty('stroke-opacity','0','important');
   hitbox.style.setProperty('opacity','0','important');
   hitbox.style.setProperty('filter','none','important');
  });
 }

 function bindPlanSelection(){
  for(const group of getPlanGroups()){
   const id=getDeviceId(group);
   if(!id)continue;

   group.dataset.deviceId=String(id);
   group.classList.add('plan-device','utop-plan-device');
   group.setAttribute('role','button');
   group.setAttribute('tabindex','0');
   ensureHitbox(group);

   if(group.dataset.selectionBound==='1')continue;
   group.dataset.selectionBound='1';

   group.addEventListener('pointerdown',onGroupPointerDown);

   group.addEventListener('pointerenter',()=>{
    hoveredId=String(id);
    syncSelectedClasses();
   });

   group.addEventListener('pointerleave',()=>{
    if(hoveredId===String(id))hoveredId=null;
    syncSelectedClasses();
   });

   group.addEventListener('keydown',event=>{
    if(event.key==='Enter'||event.key===' '){
     event.preventDefault();
     selectItem(id,{
      additive:multiSelectMode||event.shiftKey,
      toggle:multiSelectMode||event.shiftKey
     });
    }
   });
  }

  syncSelectedClasses();
 }

 function bindPlanBackground(){
  const svg=getPlanSvg();
  if(!svg||svg.dataset.selectionBackgroundBound==='1')return;

  svg.dataset.selectionBackgroundBound='1';

  svg.addEventListener('pointerdown',event=>{
   if(event.target===svg&&!event.shiftKey&&!event.ctrlKey&&!event.metaKey){
    clearSelection();
   }
  });
 }

 function applySnapToItem(item){
  if(!snapGridEnabled||!item)return;

  item.x=Math.round((Number(item.x)||0)/SNAP_STEP)*SNAP_STEP;
  item.z=Math.round((Number(item.z)||0)/SNAP_STEP)*SNAP_STEP;
 }

 function refreshBindings(){
  bindPlanBackground();
  repairExistingHitboxes();
  bindPlanSelection();
  repairExistingHitboxes();
 }

 window.addEventListener('utop-selection-mode-change',event=>{
  multiSelectMode=Boolean(event.detail?.multi);
 });

 window.addEventListener('utop-snap-grid-change',event=>{
  snapGridEnabled=Boolean(event.detail?.enabled);
 });

 window.addEventListener('utop-clear-selection',clearSelection);

 window.addEventListener('utop-device-move-end',event=>{
  const item=getItemById(event.detail?.id);
  applySnapToItem(item);

  try{
   if(item&&typeof rebuild==='function')rebuild(item);
   if(typeof renderAll==='function')renderAll();
  }catch(error){
   console.warn('UTOP snap:',error);
  }
 });

 // Preserve current primary selection after any existing renderPlan rebuild.
 const observer=new MutationObserver(()=>{
  window.requestAnimationFrame(refreshBindings);
 });

 function start(){
  const svg=getPlanSvg();
  if(svg){
   observer.observe(svg,{childList:true,subtree:true});
  }

  refreshBindings();

  if(state?.selectedId){
   selectedIds.add(String(state.selectedId));
   syncSelectedClasses();
   dispatchSelectionChanged();
  }

  window.UTOP_SELECTION_ENGINE=Object.freeze({
   select:id=>selectItem(id),
   add:id=>selectItem(id,{additive:true}),
   toggle:id=>selectItem(id,{additive:true,toggle:true}),
   clear:clearSelection,
   getSelectedIds:()=>[...selectedIds],
   snapItem:applySnapToItem,
   refresh:refreshBindings
  });
 }

 if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',start,{once:true});
 }else{
  start();
 }
})();


/* V4.1.0: map unlabeled SVG groups to the nearest device label/item. */
(function(){
 function normalizePlanDeviceGroups(){
  const svg=(
   document.querySelector('#planSvg') ||
   document.querySelector('#viewer2d svg') ||
   document.querySelector('.panel-2d svg') ||
   document.querySelector('.plan-panel svg')
  );

  if(!svg||!state?.items)return;

  const groups=[...svg.querySelectorAll('g')].filter(group=>{
   if(group.closest('defs'))return false;
   const hasGraphic=group.querySelector('rect,circle,path,line,polygon,ellipse');
   return Boolean(hasGraphic);
  });

  for(const item of state.items){
   if(svg.querySelector(
    `g[data-device-id="${CSS.escape(String(item.id))}"],`+
    `g[data-id="${CSS.escape(String(item.id))}"]`
   ))continue;

   const labelTexts=[...svg.querySelectorAll('text')]
    .filter(text=>(text.textContent||'').trim()===String(item.name||'').trim());

   for(const text of labelTexts){
    let group=text.closest('g');
    if(group){
     group.dataset.deviceId=String(item.id);
     group.classList.add('plan-device','utop-plan-device');

     const labelShape=group.querySelector('rect');
     if(labelShape)labelShape.setAttribute('data-device-label','true');
     break;
    }
   }
  }

  window.UTOP_SELECTION_ENGINE?.refresh();
 }

 const observer=new MutationObserver(()=>{
  requestAnimationFrame(normalizePlanDeviceGroups);
 });

 function init(){
  const svg=(
   document.querySelector('#planSvg') ||
   document.querySelector('#viewer2d svg') ||
   document.querySelector('.panel-2d svg') ||
   document.querySelector('.plan-panel svg')
  );

  if(svg){
   observer.observe(svg,{childList:true,subtree:true});
   normalizePlanDeviceGroups();
  }
 }

 if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init,{once:true});
 }else{
  init();
 }
})();


/* =========================================================
   V4.1.0 Stable Scene Plugin Host API
   ========================================================= */
window.UTOP_SCENE_HOST=Object.freeze({
 getTHREE:()=>THREE,
 getRoot:()=>group,
 getCamera:()=>camera,
 getControls:()=>controls,
 getState:()=>state,
 addDevice:type=>add(type),
 getDefinition:type=>defs?.[type]||null,
 render:()=>{
  try{renderAll()}catch(error){console.warn('Scene host render:',error)}
 },
 renderPlan:()=>{
  try{renderPlan()}catch(error){console.warn('Scene host plan:',error)}
 },
 markDirty:()=>{
  try{markDirty()}catch(error){console.warn('Scene host dirty:',error)}
 },
 select:id=>{
  try{select(id)}catch(error){console.warn('Scene host select:',error)}
 },
 clearManagedScene:clearManagedSceneContent,
 setBaseSceneVisible,
 getBaseSceneVisible:()=>baseSceneStaticObjects.every(object=>object?.visible!==false),
 setPlanWorldBounds:(bounds)=>{
  window.UTOP_PLAN_WORLD_BOUNDS={...window.UTOP_PLAN_WORLD_BOUNDS,...bounds};
  try{renderPlan()}catch(_){}
 },
 setPlanRenderer:rendererFn=>{
  window.UTOP_ACTIVE_PLAN_RENDERER=typeof rendererFn==='function'?rendererFn:null;
  try{renderPlan()}catch(_){}
 },
 clearPlanRenderer:()=>{
  window.UTOP_ACTIVE_PLAN_RENDERER=null;
  try{renderPlan()}catch(_){}
 },
 setSceneHeightRange,
 getSceneHeightRange,
 resetSceneHeightRange,
 getHeightAtPosition:(x,z)=>{
  const provider=window.UTOP_SCENE_HEIGHT_PROVIDER;
  if(typeof provider==='function'){
   const value=Number(provider(Number(x)||0,Number(z)||0));
   if(Number.isFinite(value))return value;
  }
  return 0;
 },
 setHeightProvider:provider=>{
  window.UTOP_SCENE_HEIGHT_PROVIDER=
   typeof provider==='function'?provider:null;
 },
 clearHeightProvider:()=>{
  window.UTOP_SCENE_HEIGHT_PROVIDER=null;
 },
 worldToPlan,
 planToWorld,
 removeItems:predicate=>{
  const removed=state.items.filter(predicate);
  removed.forEach(item=>{
   try{
    if(item.mesh)group.remove(item.mesh);
   }catch(error){
    console.warn('Scene host remove mesh:',error);
   }
  });
  state.items=state.items.filter(item=>!predicate(item));
  state.wires=state.wires.filter(
   wire=>!removed.some(
    item=>wire.sourceId===item.id||wire.targetId===item.id
   )
  );
  try{renderAll()}catch(error){console.warn('Scene host refresh:',error)}
  return removed.length;
 }
});


/* =========================================================
   V4.1.0 Monte Carlo Scene UI Bridge
   ========================================================= */
(function(){
 const controls=document.getElementById('monteCarloMiniControls');

 function refresh(){
  if(!controls)return;
  const active=window.UTOP_MONTECARLO_PLUGIN?.isLoaded?.()===true;
  controls.hidden=!active;
 }

 window.addEventListener('utop-managed-scene-cleared',refresh);
 window.addEventListener('utop-montecarlo-loaded',refresh);
 window.addEventListener('utop-montecarlo-unloaded',refresh);

 document.querySelectorAll('[data-monte-mini]').forEach(button=>{
  button.addEventListener('click',()=>{
   const mode=button.dataset.monteMini;
   try{
    if(mode==='SECTION'){
     window.UTOP_MONTECARLO_PLUGIN?.setFloor?.('ALL');
     window.UTOP_MONTECARLO_PLUGIN?.setCamera?.('section');
    }else{
     window.UTOP_MONTECARLO_PLUGIN?.setFloor?.(mode);
    }
   }catch(error){
    console.warn('Monte Carlo mini control:',error);
   }
  });
 });

 refresh();
})();
