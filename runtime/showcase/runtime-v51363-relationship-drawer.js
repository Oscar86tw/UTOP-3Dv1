import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { normalizeHeight, applyHeightToObject } from '../../services/scene-height/index.js';
import { LABEL_MODES, shouldShowLabel } from '../../services/label-service/index.js';
import { applyPartsVisibility } from '../../services/parts-visibility/index.js';
import { ROAD_MARKINGS } from '../../services/road-marking/index.js';


const $=id=>document.getElementById(id);
const defs={
 barrier:{name:'柵欄機',assetId:'PARKING-BARRIER-001',defaults:{armLength:4,rotation:0,armSide:'right',openTime:4,closeTime:4,autoCloseEnabled:false,autoCloseSeconds:5,
    safetyActive:false,safetyClosePending:false,safetyAutoCloseEnabled:true,safetyAutoCloseSeconds:5,
    cabinetHeightScale:1.30,state:'CLOSED',angle:0,showLabel:true},di:[['DI1','開啟','open'],['DI2','關閉','close'],['DI3','停止','stop'],['DI4','防砸','safety'],['DI5','復歸','reset']],do:[['DO1','全開到位','fullyOpen'],['DO2','全關到位','fullyClosed'],['DO3','運轉中','running'],['DO4','故障','fault']]},
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
  safetyActive:false,safetyClosePending:false,safetyAutoCloseEnabled:true,safetyCloseDelaySeconds:5,fault:false,
  realDimensions:{width:3.2,height:2.6,depth:.18}
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
 delaytimer:{name:'延遲計時器',assetId:'CONTROL-DELAY-TIMER-001',defaults:{rotation:0,delaySeconds:5,state:'IDLE',output:false,remaining:5,showLabel:true},di:[['DI1','START｜開始計時','start'],['DI2','STOP｜停止','stop'],['DI3','RESET｜復歸','reset']],do:[['DO1','TIMING｜計時中','timing'],['DO2','TIME_UP｜時間到','timeUp'],['DO3','RELAY_OUT｜延遲輸出','relayOut']]},
 poweroffdelay:{name:'斷電延時繼電器',assetId:'CONTROL-OFF-DELAY-001',defaults:{rotation:0,delaySeconds:5,power:true,state:'ENERGIZED',output:true,remaining:5,showLabel:true},di:[['DI1','START｜開始計時','start'],['DI2','STOP｜停止','stop'],['DI3','RESET｜復歸','reset']],do:[['DO1','RELAY_OUT｜繼電器輸出','relayOut'],['DO2','OFF_DELAY｜斷電延時中','timing'],['DO3','RELEASED｜已釋放','released']]},
 powerondelay:{name:'通電延遲計時器',assetId:'CONTROL-ON-DELAY-001',defaults:{rotation:0,delaySeconds:5,power:false,state:'IDLE',output:false,remaining:5,showLabel:true},di:[['DI1','START｜開始計時','start'],['DI2','STOP｜停止','stop'],['DI3','RESET｜復歸','reset']],do:[['DO1','ON_DELAY｜通電延時中','timing'],['DO2','RELAY_OUT｜延遲輸出','relayOut'],['DO3','POWER_STATUS｜電源狀態','powerStatus']]},
 signal2way:{name:'雙向號誌主機',assetId:'SIGNAL-2WAY-001',defaults:{rotation:0,mode:'ALL_GREEN',intervalSeconds:10,remaining:10,auto:true,state:'READY',showLabel:true},di:[['DI1','LANE_A_CALL｜A向需求','laneA'],['DI2','LANE_B_CALL｜B向需求','laneB'],['DI3','ALL_GREEN｜全綠','allGreen'],['DI4','AUTO｜自動待命','auto'],['DI5','RESET｜復歸','reset']],do:[['DO1','LANE_A_GREEN｜A向綠燈','laneAGreen'],['DO2','LANE_A_RED｜A向紅燈','laneARed'],['DO3','LANE_B_GREEN｜B向綠燈','laneBGreen'],['DO4','LANE_B_RED｜B向紅燈','laneBRed'],['DO5','AUTO_ACTIVE｜自動模式','autoActive']]},
 signal3way:{name:'三向號誌主機',assetId:'SIGNAL-3WAY-001',defaults:{rotation:0,mode:'ALL_GREEN',intervalSeconds:10,remaining:10,auto:true,state:'READY',showLabel:true},di:[['DI1','LANE_A_CALL｜A向需求','laneA'],['DI2','LANE_B_CALL｜B向需求','laneB'],['DI3','LANE_C_CALL｜C向需求','laneC'],['DI4','ALL_GREEN｜全綠','allGreen'],['DI5','AUTO｜自動待命','auto'],['DI6','RESET｜復歸','reset']],do:[['DO1','LANE_A_GREEN｜A向綠燈','laneAGreen'],['DO2','LANE_B_GREEN｜B向綠燈','laneBGreen'],['DO3','LANE_C_GREEN｜C向綠燈','laneCGreen'],['DO4','ALL_RED｜全紅狀態','allRedStatus'],['DO5','AUTO_ACTIVE｜自動模式','autoActive']]},
 directionrecognizer:{name:'方向辨識器',assetId:'LK-121',defaults:{rotation:0,contact:'NO',triggerEdge:'FRONT',detectSeconds:2,state:'READY',firstSensor:'',pendingDirection:'',lastDirection:'NONE',forwardPulse:false,reversePulse:false,relayActive:false,ready:true,showLabel:true,realDimensions:{width:.183,height:.108,depth:.038}},di:[['DI1','SENSOR_A｜A感應','sensorA'],['DI2','SENSOR_B｜B感應','sensorB'],['DI3','CLEAR｜清除／後緣','clear'],['DI4','RESET｜復歸','reset']],do:[['DO1','FORWARD｜A→B方向','forwardOut'],['DO2','REVERSE｜B→A方向','reverseOut'],['DO3','RELAY_OUT｜Relay乾接點','relayOut'],['DO4','READY｜待機','ready']]},
 object_wall:{name:'建築物外牆',assetId:'OBJECT-WALL-001',defaults:{rotation:0,showLabel:true,objectKind:'wall',realDimensions:{width:4,height:3,depth:.2}},di:[],do:[]},
 object_door:{name:'門',assetId:'OBJECT-DOOR-001',defaults:{rotation:0,showLabel:true,objectKind:'door',realDimensions:{width:1,height:2.1,depth:.12}},di:[],do:[]},
 object_column:{name:'柱子',assetId:'OBJECT-COLUMN-001',defaults:{rotation:0,showLabel:true,objectKind:'column',realDimensions:{width:.45,height:3,depth:.45}},di:[],do:[]},
 object_eave:{name:'屋簷',assetId:'OBJECT-EAVE-001',defaults:{rotation:0,showLabel:true,objectKind:'eave',realDimensions:{width:3,height:.22,depth:1.2}},di:[],do:[]},
 object_asphalt:{name:'柏油路',assetId:'OBJECT-ASPHALT-001',defaults:{rotation:0,showLabel:true,objectKind:'asphalt',realDimensions:{width:4,height:.06,depth:8}},di:[],do:[]},
 object_road:{name:'馬路',assetId:'OBJECT-ROAD-001',defaults:{rotation:0,showLabel:true,objectKind:'road',realDimensions:{width:6,height:.08,depth:10}},di:[],do:[]},
 object_car:{name:'汽車',assetId:'OBJECT-CAR-001',defaults:{rotation:0,showLabel:true,objectKind:'car',driveEnabled:true,driveSpeed:3,steerRate:55,moving:false,driveDirection:1,steerInput:0,realDimensions:{width:1.8,height:1.45,depth:4.4}},di:[],do:[]},
 object_motorcycle:{name:'摩托車',assetId:'OBJECT-MOTORCYCLE-001',defaults:{rotation:0,showLabel:true,objectKind:'motorcycle',driveEnabled:true,driveSpeed:2.5,steerRate:70,moving:false,driveDirection:1,steerInput:0,realDimensions:{width:.8,height:1.25,depth:2.1}},di:[],do:[]},
 object_person:{name:'人',assetId:'OBJECT-PERSON-001',defaults:{rotation:0,showLabel:true,objectKind:'person',realDimensions:{width:.55,height:1.72,depth:.4}},di:[],do:[]},
 object_custom:{name:'自訂物件',assetId:'OBJECT-CUSTOM-001',defaults:{rotation:0,showLabel:true,objectKind:'custom',realDimensions:{width:1,height:1,depth:1}},di:[],do:[]}
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


const ENVIRONMENT_FX_DEFINITIONS=Object.freeze({
 clear:{label:'晴天／關閉',description:'恢復正常場景，不顯示環境動畫。'},
 rain:{label:'下雨',description:'雨滴持續下降並受風向影響。'},
 snow:{label:'下雪',description:'雪花緩慢飄落，受風向及速度影響。'},
 hail:{label:'冰雹',description:'冰球高速落下，在地面附近產生彈跳感。'},
 meteor:{label:'流星雨',description:'夜空出現高速流星及發光尾跡。'},
 sandstorm:{label:'風沙',description:'沙塵橫向移動並降低遠方能見度。'},
 typhoon:{label:'颱風',description:'強風、斜向暴雨、霧效及可選攝影機晃動。'},
 tornado:{label:'龍捲風',description:'旋轉漏斗粒子在場景中緩慢移動。'},
 storm:{label:'暴雨',description:'高密度雨滴、閃電與低能見度。'},
 flood:{label:'淹水',description:'水面逐步升高並持續產生波動。'},
 tsunami:{label:'海嘯',description:'大型水牆由遠方推進並循環。'},
 space:{label:'宇宙星空',description:'動態星空、星雲感與緩慢流星。'},
 spaceTour:{label:'太空漫遊',description:'依序靠近15顆行星，短暫環繞後離開前往下一顆。'},
 blackHole:{label:'黑洞邊緣',description:'在黑洞吸積盤與事件視界邊緣徘徊，不穿越黑洞。'},
 lavaMountains:{label:'岩漿山脈',description:'火山山脈、熔岩河、火星與熱氣持續流動。'},
 crystalCave:{label:'水晶礦洞',description:'大型水晶柱、礦洞光芒與漂浮晶塵。'},
 deepCrust:{label:'地殼深處',description:'多層岩盤、熔融裂縫與地底熱流。'},
 cellar:{label:'地窖',description:'石牆地窖、木桶、吊燈與低亮度霧氣。'},
 retroPlatform:{label:'復古平台遊戲世界',description:'遊戲機風格的磚塊、問號方塊、水管、金幣與移動平台。'},
 waterfall:{label:'瀑布',description:'瀑布水幕、落水粒子、水霧與水潭波動。'},
 apocalypse:{label:'世界末日',description:'暗紅天空、隕石、火焰、碎片與地面震動。'},
 underwater:{label:'海底世界',description:'魚群、珊瑚、氣泡、海草與水下光柱。'},
 iceWorld:{label:'冰雪世界',description:'冰柱、冰洞、暴風雪與極光。'},
 desertWorld:{label:'沙漠世界',description:'沙丘、仙人掌、熱浪與海市蜃樓。'},
 forestWorld:{label:'森林世界',description:'大樹、霧、蝴蝶與穿透林間的陽光。'},
 futureCity:{label:'未來都市',description:'霓虹建築、飛行車、全息光板與玻璃城市。'},
 industrialFactory:{label:'工業工廠',description:'輸送帶、機械手臂、煙囪、吊車與警示燈。'}
});

const environmentFxState={
 type:'clear',
 intensity:.65,
 speed:1,
 wind:.15,
 water:.35,
 cameraShake:false,
 lighting:true,
 fog:true,
 deviceImpact:false,
 status:'stopped',
 root:null,
 frame:null,
 clock:null,
 objects:[],
 originalBackground:null,
 originalFog:null,
 baseCameraPosition:null,
 baseOrbitTarget:null,
 flashTimer:null,
 sequenceIndex:0,
 sequenceTime:0,
 specialData:null
};

function environmentFxBounds(){
 const bounds=activeSceneBounds?.()||{minX:-15,maxX:15,minZ:-15,maxZ:15};
 const width=Math.max(30,bounds.maxX-bounds.minX);
 const depth=Math.max(30,bounds.maxZ-bounds.minZ);
 const range=getSceneHeightRange?.()||{min:-10,max:20};
 return {
  minX:bounds.minX-width*.35,
  maxX:bounds.maxX+width*.35,
  minZ:bounds.minZ-depth*.35,
  maxZ:bounds.maxZ+depth*.35,
  minY:range.min-4,
  maxY:range.max+22,
  width:width*1.7,
  depth:depth*1.7
 };
}

function environmentFxDispose(object){
 object?.traverse?.(child=>{
  child.geometry?.dispose?.();
  if(Array.isArray(child.material)){
   child.material.forEach(material=>material?.dispose?.());
  }else{
   child.material?.dispose?.();
  }
 });
}

function environmentFxClearDeviceWarnings(){
 state.items.forEach(item=>{
  item.mesh?.traverse?.(node=>{
   if(!node.material)return;
   if(node.userData.environmentOriginalEmissive!==undefined){
    node.material.emissive?.setHex?.(node.userData.environmentOriginalEmissive);
    node.material.emissiveIntensity=node.userData.environmentOriginalIntensity||0;
    delete node.userData.environmentOriginalEmissive;
    delete node.userData.environmentOriginalIntensity;
   }
  });
 });
}

function environmentFxApplyDeviceWarnings(){
 environmentFxClearDeviceWarnings();
 if(!environmentFxState.deviceImpact)return;

 const type=environmentFxState.type;
 if(!['flood','tsunami','hail','storm','typhoon'].includes(type))return;

 const waterLevel=environmentFxGetWaterLevel();
 state.items.forEach(item=>{
  let warning=false;
  if(type==='flood'||type==='tsunami'){
   warning=(Number(item.y)||0)<=waterLevel;
  }else if(type==='hail'||type==='storm'||type==='typhoon'){
   warning=environmentFxState.intensity>.72;
  }
  if(!warning)return;

  item.mesh?.traverse?.(node=>{
   if(!node.material?.emissive)return;
   node.userData.environmentOriginalEmissive=node.material.emissive.getHex();
   node.userData.environmentOriginalIntensity=node.material.emissiveIntensity||0;
   node.material.emissive.setHex(0xff2020);
   node.material.emissiveIntensity=1.15;
  });
 });
}

function environmentFxRestoreScene(){
 if(environmentFxState.originalBackground!==null){
  scene.background=environmentFxState.originalBackground;
 }
 scene.fog=environmentFxState.originalFog;
 if(environmentFxState.baseCameraPosition){
  camera.position.copy(environmentFxState.baseCameraPosition);
 }
 if(environmentFxState.baseOrbitTarget&&orbit?.target){
  orbit.target.copy(environmentFxState.baseOrbitTarget);
  orbit.update?.();
 }
 environmentFxState.specialData=null;
 renderer.toneMappingExposure=1;
 environmentFxClearDeviceWarnings();
}

function environmentFxClear(){
 if(environmentFxState.frame){
  cancelAnimationFrame(environmentFxState.frame);
  environmentFxState.frame=null;
 }
 if(environmentFxState.flashTimer){
  clearTimeout(environmentFxState.flashTimer);
  environmentFxState.flashTimer=null;
 }
 environmentFxState.objects.length=0;
 if(environmentFxState.root){
  environmentFxDispose(environmentFxState.root);
  environmentFxState.root.parent?.remove(environmentFxState.root);
  environmentFxState.root=null;
 }
 environmentFxRestoreScene();
 renderer.render(scene,camera);
}

function environmentFxPointCloud(count,color,size,opacity=.9){
 const bounds=environmentFxBounds();
 const positions=new Float32Array(count*3);
 for(let i=0;i<count;i++){
  positions[i*3]=bounds.minX+Math.random()*(bounds.maxX-bounds.minX);
  positions[i*3+1]=bounds.minY+Math.random()*(bounds.maxY-bounds.minY);
  positions[i*3+2]=bounds.minZ+Math.random()*(bounds.maxZ-bounds.minZ);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
 const material=new THREE.PointsMaterial({
  color,size,transparent:true,opacity,
  depthWrite:false,sizeAttenuation:true
 });
 return new THREE.Points(geometry,material);
}

function environmentFxLineParticles(count,color,length=1,opacity=.78){
 const bounds=environmentFxBounds();
 const positions=new Float32Array(count*6);
 for(let i=0;i<count;i++){
  const x=bounds.minX+Math.random()*(bounds.maxX-bounds.minX);
  const y=bounds.minY+Math.random()*(bounds.maxY-bounds.minY);
  const z=bounds.minZ+Math.random()*(bounds.maxZ-bounds.minZ);
  const idx=i*6;
  positions[idx]=x;
  positions[idx+1]=y;
  positions[idx+2]=z;
  positions[idx+3]=x;
  positions[idx+4]=y-length;
  positions[idx+5]=z;
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
 const material=new THREE.LineBasicMaterial({
  color,transparent:true,opacity,depthWrite:false
 });
 return new THREE.LineSegments(geometry,material);
}

function environmentFxWaterPlane(){
 const bounds=environmentFxBounds();
 const geometry=new THREE.PlaneGeometry(
  bounds.width*1.3,
  bounds.depth*1.3,
  72,
  72
 );
 geometry.rotateX(-Math.PI/2);
 const material=new THREE.MeshPhysicalMaterial({
  color:0x367f9f,
  transparent:true,
  opacity:.47,
  roughness:.16,
  metalness:.02,
  clearcoat:1,
  clearcoatRoughness:.07,
  side:THREE.DoubleSide
 });
 const water=new THREE.Mesh(geometry,material);
 water.userData.fx='flood';
 water.userData.basePositions=geometry.attributes.position.array.slice();
 return water;
}

function environmentFxGetWaterLevel(){
 const range=getSceneHeightRange?.()||{min:-10,max:20};
 return range.min+(range.max-range.min)*environmentFxState.water;
}

function environmentFxResetPoint(points,index){
 const bounds=environmentFxBounds();
 const attr=points.geometry.attributes.position;
 attr.setXYZ(
  index,
  bounds.minX+Math.random()*(bounds.maxX-bounds.minX),
  bounds.maxY-Math.random()*3,
  bounds.minZ+Math.random()*(bounds.maxZ-bounds.minZ)
 );
}

function environmentFxResetLine(lines,index,kind){
 const bounds=environmentFxBounds();
 const attr=lines.geometry.attributes.position;
 const base=index*2;
 const x=bounds.minX+Math.random()*(bounds.maxX-bounds.minX);
 const y=bounds.maxY-Math.random()*3;
 const z=bounds.minZ+Math.random()*(bounds.maxZ-bounds.minZ);
 const length=kind==='meteor'?3.4:1.25;
 attr.setXYZ(base,x,y,z);
 attr.setXYZ(base+1,x-environmentFxState.wind*.7,y-length,z-(kind==='meteor'?2.8:0));
}


function environmentFxAddObject(object,fx){
 object.userData.fx=fx;
 environmentFxState.root.add(object);
 environmentFxState.objects.push(object);
 return object;
}

function environmentFxMaterial(color,options={}){
 return new THREE.MeshStandardMaterial({
  color,
  roughness:options.roughness??.65,
  metalness:options.metalness??.08,
  emissive:options.emissive??0x000000,
  emissiveIntensity:options.emissiveIntensity??0,
  transparent:options.transparent??false,
  opacity:options.opacity??1,
  side:options.side??THREE.FrontSide
 });
}

function environmentFxPlanet(radius,color,position,options={}){
 const group=new THREE.Group();
 const sphere=new THREE.Mesh(
  new THREE.SphereGeometry(radius,32,24),
  environmentFxMaterial(color,{
   roughness:.72,
   metalness:.02,
   emissive:options.emissive??0x000000,
   emissiveIntensity:options.emissiveIntensity??0
  })
 );
 sphere.castShadow=false;
 group.add(sphere);

 if(options.ring){
  const ring=new THREE.Mesh(
   new THREE.RingGeometry(radius*1.25,radius*1.9,64),
   new THREE.MeshBasicMaterial({
    color:options.ringColor??0xd9c28a,
    transparent:true,
    opacity:.72,
    side:THREE.DoubleSide,
    depthWrite:false
   })
  );
  ring.rotation.x=Math.PI/2.7;
  group.add(ring);
 }

 group.position.copy(position);
 group.userData.radius=radius;
 group.userData.name=options.name||'行星';
 return group;
}

function environmentFxCreateSpaceTour(root){
 scene.background=new THREE.Color(0x01030b);
 scene.fog=null;

 const stars=environmentFxPointCloud(3200,0xffffff,.075,.95);
 environmentFxAddObject(stars,'stars');

 const planetSpecs=[
  ['水星',1.1,0x8f8a80],
  ['金星',1.8,0xc99043],
  ['地球',1.9,0x2f72c8],
  ['火星',1.35,0xa84a2f],
  ['木星',4.5,0xc59668],
  ['土星',4.0,0xd9bf79,true],
  ['天王星',2.8,0x7ecbd6,true],
  ['海王星',2.7,0x365fc5],
  ['冥王星',.85,0xa99b8b],
  ['開普勒452b',2.05,0x4f9f77],
  ['熔岩星',1.75,0x8c1e0f],
  ['冰晶星',1.65,0x8ed9ff],
  ['紫霧星',2.25,0x7550a8],
  ['沙漠星',2.1,0xc9a25b],
  ['海洋星',2.35,0x1b839d]
 ];

 const planets=[];
 planetSpecs.forEach((spec,index)=>{
  const angle=index*.74;
  const distance=34+index*13;
  const position=new THREE.Vector3(
   Math.cos(angle)*distance,
   Math.sin(index*.63)*12,
   -22-index*18
  );
  const planet=environmentFxPlanet(
   spec[1],
   spec[2],
   position,
   {
    name:spec[0],
    ring:!!spec[3],
    ringColor:index===5?0xd9bd77:0xbfd7dc
   }
  );
  environmentFxAddObject(planet,'tourPlanet');
  planets.push(planet);
 });

 environmentFxState.specialData={
  kind:'spaceTour',
  planets,
  index:0,
  phase:0,
  phaseTime:0,
  cameraStart:camera.position.clone(),
  targetStart:orbit?.target?.clone?.()||new THREE.Vector3()
 };
}

function environmentFxCreateBlackHole(root){
 scene.background=new THREE.Color(0x000006);
 scene.fog=null;

 const stars=environmentFxPointCloud(2400,0xffffff,.065,.88);
 environmentFxAddObject(stars,'stars');

 const black=new THREE.Mesh(
  new THREE.SphereGeometry(4.5,48,32),
  new THREE.MeshBasicMaterial({color:0x000000})
 );
 environmentFxAddObject(black,'blackHoleCore');

 for(let i=0;i<4;i++){
  const disk=new THREE.Mesh(
   new THREE.RingGeometry(5.2+i*1.1,6.1+i*1.25,96),
   new THREE.MeshBasicMaterial({
    color:[0xff6b1a,0xffb02e,0xffe2a8,0xa85cff][i],
    transparent:true,
    opacity:.72-i*.1,
    side:THREE.DoubleSide,
    depthWrite:false,
    blending:THREE.AdditiveBlending
   })
  );
  disk.rotation.x=Math.PI/2.45+i*.06;
  disk.userData.spin=(i%2?-.32:.42)*(1+i*.15);
  environmentFxAddObject(disk,'blackHoleDisk');
 }

 const lens=new THREE.Mesh(
  new THREE.TorusGeometry(5.05,.24,16,96),
  new THREE.MeshBasicMaterial({
   color:0xffffff,
   transparent:true,
   opacity:.8,
   blending:THREE.AdditiveBlending
  })
 );
 lens.rotation.x=Math.PI/2.45;
 environmentFxAddObject(lens,'blackHoleLens');

 environmentFxState.specialData={
  kind:'blackHole',
  center:new THREE.Vector3(0,8,-12),
  radius:17,
  cameraStart:camera.position.clone(),
  targetStart:orbit?.target?.clone?.()||new THREE.Vector3()
 };
 environmentFxState.root.position.set(0,8,-12);
}

function environmentFxCreateLavaMountains(root){
 scene.background=new THREE.Color(0x180502);
 scene.fog=new THREE.FogExp2(0x4b1307,.025);

 for(let i=0;i<16;i++){
  const radius=3+Math.random()*5;
  const height=8+Math.random()*15;
  const mountain=new THREE.Mesh(
   new THREE.ConeGeometry(radius,height,10,2),
   environmentFxMaterial(0x2a1713,{roughness:1})
  );
  mountain.position.set(
   -32+Math.random()*64,
   height/2-2,
   -35+Math.random()*48
  );
  mountain.rotation.y=Math.random()*Math.PI;
  environmentFxAddObject(mountain,'lavaMountain');
 }

 for(let i=0;i<7;i++){
  const river=new THREE.Mesh(
   new THREE.PlaneGeometry(5+Math.random()*5,34+Math.random()*25,12,24),
   new THREE.MeshStandardMaterial({
    color:0xff3c00,
    emissive:0xff1900,
    emissiveIntensity:1.7,
    roughness:.35,
    side:THREE.DoubleSide
   })
  );
  river.rotation.x=-Math.PI/2;
  river.rotation.z=(Math.random()-.5)*.55;
  river.position.set(-24+i*8,-.4,-5+Math.random()*10);
  environmentFxAddObject(river,'lavaRiver');
 }

 const sparks=environmentFxPointCloud(950,0xff8a22,.12,.9);
 environmentFxAddObject(sparks,'lavaSparks');
}

function environmentFxCreateCrystalCave(root){
 scene.background=new THREE.Color(0x06131f);
 scene.fog=new THREE.FogExp2(0x10243a,.035);

 const floor=new THREE.Mesh(
  new THREE.PlaneGeometry(90,90),
  environmentFxMaterial(0x14212d,{roughness:.95})
 );
 floor.rotation.x=-Math.PI/2;
 floor.position.y=-2;
 environmentFxAddObject(floor,'caveFloor');

 const colors=[0x6ee7ff,0xa989ff,0x62ffbd,0xff8eea,0xd6f6ff];
 for(let i=0;i<46;i++){
  const height=2+Math.random()*12;
  const radius=.35+Math.random()*1.2;
  const crystal=new THREE.Mesh(
   new THREE.ConeGeometry(radius,height,6),
   environmentFxMaterial(colors[i%colors.length],{
    roughness:.18,
    metalness:.35,
    emissive:colors[i%colors.length],
    emissiveIntensity:.48,
    transparent:true,
    opacity:.88
   })
  );
  crystal.position.set(
   -34+Math.random()*68,
   -2+height/2,
   -35+Math.random()*60
  );
  crystal.rotation.z=(Math.random()-.5)*.35;
  environmentFxAddObject(crystal,'crystal');
 }

 const dust=environmentFxPointCloud(850,0xcaf4ff,.075,.65);
 environmentFxAddObject(dust,'crystalDust');
}

function environmentFxCreateDeepCrust(root){
 scene.background=new THREE.Color(0x150d09);
 scene.fog=new THREE.FogExp2(0x291610,.04);

 const layerColors=[0x3a2a22,0x4c3324,0x30211c,0x5a3b26,0x241713];
 for(let i=0;i<10;i++){
  const layer=new THREE.Mesh(
   new THREE.BoxGeometry(85,2.4,70),
   environmentFxMaterial(layerColors[i%layerColors.length],{roughness:1})
  );
  layer.position.y=-3-i*3.1;
  layer.position.z=-8;
  layer.rotation.z=(Math.random()-.5)*.025;
  environmentFxAddObject(layer,'crustLayer');
 }

 for(let i=0;i<13;i++){
  const fissure=new THREE.Mesh(
   new THREE.BoxGeometry(.25+Math.random()*.5,20+Math.random()*14,1),
   new THREE.MeshBasicMaterial({
    color:0xff4b0b,
    transparent:true,
    opacity:.9
   })
  );
  fissure.position.set(-30+Math.random()*60,-12,-8+Math.random()*25);
  fissure.rotation.z=(Math.random()-.5)*.9;
  environmentFxAddObject(fissure,'crustFissure');
 }
}

function environmentFxCreateCellar(root){
 scene.background=new THREE.Color(0x100e0b);
 scene.fog=new THREE.FogExp2(0x2a251f,.055);

 const stone=environmentFxMaterial(0x4b4943,{roughness:1});
 const wood=environmentFxMaterial(0x6b3e1f,{roughness:.88});

 const floor=new THREE.Mesh(new THREE.BoxGeometry(52,1,42),stone);
 floor.position.set(0,-1,-8);
 environmentFxAddObject(floor,'cellar');

 const back=new THREE.Mesh(new THREE.BoxGeometry(52,18,1),stone);
 back.position.set(0,8,-29);
 environmentFxAddObject(back,'cellar');

 for(const x of [-25,25]){
  const wall=new THREE.Mesh(new THREE.BoxGeometry(1,18,42),stone);
  wall.position.set(x,8,-8);
  environmentFxAddObject(wall,'cellar');
 }

 for(let i=0;i<14;i++){
  const barrel=new THREE.Mesh(
   new THREE.CylinderGeometry(1.3,1.45,2.8,18),
   wood
  );
  barrel.rotation.z=Math.PI/2;
  barrel.position.set(-20+(i%7)*6,1, -20+Math.floor(i/7)*8);
  environmentFxAddObject(barrel,'barrel');
 }

 const lamp=new THREE.PointLight(0xffb45f,2.2,48,2);
 lamp.position.set(0,10,-9);
 environmentFxAddObject(lamp,'cellarLamp');
}

function environmentFxCreateRetroPlatform(root){
 scene.background=new THREE.Color(0x63b5e5);
 scene.fog=null;

 const ground=new THREE.Mesh(
  new THREE.BoxGeometry(90,3,26),
  environmentFxMaterial(0x8c4a22,{roughness:.9})
 );
 ground.position.set(0,-2,-8);
 environmentFxAddObject(ground,'retroGround');

 for(let i=0;i<20;i++){
  const block=new THREE.Mesh(
   new THREE.BoxGeometry(2.6,2.6,2.6),
   environmentFxMaterial(
    i%5===0?0xf3b128:0xb85b28,
    {
     roughness:.65,
     emissive:i%5===0?0x4a2500:0x000000,
     emissiveIntensity:i%5===0?.3:0
    }
   )
  );
  block.position.set(-34+i*3.6,3+(i%3===0?3:0),-12);
  block.userData.baseY=block.position.y;
  environmentFxAddObject(block,i%5===0?'questionBlock':'retroBlock');
 }

 for(const x of [-25,8,30]){
  const pipe=new THREE.Group();
  const body=new THREE.Mesh(
   new THREE.CylinderGeometry(2.1,2.1,5,24),
   environmentFxMaterial(0x1e9a3b,{roughness:.55})
  );
  body.position.y=1.5;
  pipe.add(body);
  const top=new THREE.Mesh(
   new THREE.CylinderGeometry(2.55,2.55,1.4,24),
   environmentFxMaterial(0x28b64a,{roughness:.5})
  );
  top.position.y=4;
  pipe.add(top);
  pipe.position.set(x,0,-8);
  environmentFxAddObject(pipe,'retroPipe');
 }

 for(let i=0;i<18;i++){
  const coin=new THREE.Mesh(
   new THREE.CylinderGeometry(.55,.55,.16,24),
   environmentFxMaterial(0xffd22e,{
    metalness:.55,
    roughness:.28,
    emissive:0x5a3500,
    emissiveIntensity:.28
   })
  );
  coin.rotation.x=Math.PI/2;
  coin.position.set(-32+i*3.7,6+Math.sin(i*.8)*2,-8);
  coin.userData.baseY=coin.position.y;
  coin.userData.phase=i*.45;
  environmentFxAddObject(coin,'retroCoin');
 }
}

function environmentFxCreateWaterfall(root){
 scene.background=new THREE.Color(0x6ea8c5);
 scene.fog=new THREE.FogExp2(0x9cc7d7,.018);

 const cliff=new THREE.Mesh(
  new THREE.BoxGeometry(46,26,8),
  environmentFxMaterial(0x4d5552,{roughness:1})
 );
 cliff.position.set(0,10,-24);
 environmentFxAddObject(cliff,'waterfallCliff');

 const water=new THREE.Mesh(
  new THREE.PlaneGeometry(15,28,24,40),
  new THREE.MeshStandardMaterial({
   color:0x5cc8ff,
   emissive:0x0e5f83,
   emissiveIntensity:.35,
   transparent:true,
   opacity:.78,
   side:THREE.DoubleSide,
   roughness:.25
  })
 );
 water.position.set(0,9,-19.8);
 water.userData.basePositions=water.geometry.attributes.position.array.slice();
 environmentFxAddObject(water,'waterfallSheet');

 const pool=environmentFxWaterPlane();
 pool.scale.set(.55,.55,.55);
 pool.position.y=-1.4;
 environmentFxAddObject(pool,'waterfallPool');

 const mist=environmentFxPointCloud(1100,0xdff7ff,.11,.48);
 environmentFxAddObject(mist,'waterfallMist');
}

function environmentFxCreateApocalypse(root){
 scene.background=new THREE.Color(0x240303);
 scene.fog=new THREE.FogExp2(0x4b0d08,.04);

 const meteors=environmentFxLineParticles(96,0xffa33a,5.2,.96);
 environmentFxAddObject(meteors,'apocalypseMeteor');

 const embers=environmentFxPointCloud(1450,0xff4a13,.1,.82);
 environmentFxAddObject(embers,'apocalypseEmber');

 for(let i=0;i<28;i++){
  const debris=new THREE.Mesh(
   new THREE.BoxGeometry(
    .4+Math.random()*1.8,
    .4+Math.random()*1.8,
    .4+Math.random()*1.8
   ),
   environmentFxMaterial(0x2a211d,{roughness:1})
  );
  debris.position.set(
   -35+Math.random()*70,
   2+Math.random()*24,
   -30+Math.random()*55
  );
  debris.userData.spin=new THREE.Vector3(
   Math.random(),Math.random(),Math.random()
  );
  environmentFxAddObject(debris,'apocalypseDebris');
 }
}


function environmentFxCreateUnderwater(root){
 scene.background=new THREE.Color(0x043a52);
 scene.fog=new THREE.FogExp2(0x0b4d63,.045);

 const floor=new THREE.Mesh(
  new THREE.PlaneGeometry(100,100,20,20),
  environmentFxMaterial(0x6c826f,{roughness:1})
 );
 floor.rotation.x=-Math.PI/2;
 floor.position.y=-3;
 environmentFxAddObject(floor,'underwaterFloor');

 const coralColors=[0xff6b86,0xffa948,0x8b5cf6,0x25c7b7,0xffd85a];
 for(let i=0;i<58;i++){
  const coral=new THREE.Mesh(
   new THREE.CylinderGeometry(.18+Math.random()*.25,.45+Math.random()*.5,1+Math.random()*4,8),
   environmentFxMaterial(coralColors[i%coralColors.length],{
    roughness:.72,
    emissive:coralColors[i%coralColors.length],
    emissiveIntensity:.12
   })
  );
  coral.position.set(-42+Math.random()*84,-2.3,-40+Math.random()*70);
  coral.rotation.z=(Math.random()-.5)*.55;
  environmentFxAddObject(coral,'coral');
 }

 for(let i=0;i<34;i++){
  const fish=new THREE.Group();
  const body=new THREE.Mesh(
   new THREE.SphereGeometry(.45+Math.random()*.5,14,10),
   environmentFxMaterial([0x43d9ff,0xffc43b,0xff7a62,0x89ff9a][i%4],{roughness:.5})
  );
  body.scale.x=1.8;
  fish.add(body);
  const tail=new THREE.Mesh(
   new THREE.ConeGeometry(.35,.8,3),
   body.material
  );
  tail.rotation.z=-Math.PI/2;
  tail.position.x=-1;
  fish.add(tail);
  fish.position.set(-28+Math.random()*56,1+Math.random()*16,-32+Math.random()*50);
  fish.userData.speed=.8+Math.random()*1.7;
  fish.userData.phase=Math.random()*Math.PI*2;
  environmentFxAddObject(fish,'fish');
 }

 const bubbles=environmentFxPointCloud(900,0xc8f4ff,.075,.65);
 environmentFxAddObject(bubbles,'bubbles');

 for(let i=0;i<5;i++){
  const beam=new THREE.Mesh(
   new THREE.ConeGeometry(6,30,24,1,true),
   new THREE.MeshBasicMaterial({
    color:0x8fe9ff,
    transparent:true,
    opacity:.08,
    side:THREE.DoubleSide,
    depthWrite:false,
    blending:THREE.AdditiveBlending
   })
  );
  beam.position.set(-24+i*12,15,-15);
  beam.rotation.x=Math.PI;
  environmentFxAddObject(beam,'underwaterBeam');
 }
}

function environmentFxCreateIceWorld(root){
 scene.background=new THREE.Color(0x8fd5ef);
 scene.fog=new THREE.FogExp2(0xc5ecf8,.022);

 const floor=new THREE.Mesh(
  new THREE.PlaneGeometry(100,100),
  environmentFxMaterial(0xd7f5ff,{roughness:.58,metalness:.08})
 );
 floor.rotation.x=-Math.PI/2;
 floor.position.y=-2;
 environmentFxAddObject(floor,'iceFloor');

 for(let i=0;i<42;i++){
  const height=2+Math.random()*14;
  const ice=new THREE.Mesh(
   new THREE.ConeGeometry(.5+Math.random()*1.8,height,6),
   environmentFxMaterial(0xb8ecff,{
    roughness:.18,
    metalness:.2,
    emissive:0x1d6b8d,
    emissiveIntensity:.14,
    transparent:true,
    opacity:.84
   })
  );
  ice.position.set(-42+Math.random()*84,-2+height/2,-42+Math.random()*72);
  environmentFxAddObject(ice,'iceSpire');
 }

 const snow=environmentFxPointCloud(1300,0xffffff,.1,.85);
 environmentFxAddObject(snow,'snow');

 for(let i=0;i<3;i++){
  const aurora=new THREE.Mesh(
   new THREE.PlaneGeometry(60,18,30,6),
   new THREE.MeshBasicMaterial({
    color:[0x53ffb2,0x5b8cff,0xb45cff][i],
    transparent:true,
    opacity:.12,
    side:THREE.DoubleSide,
    blending:THREE.AdditiveBlending,
    depthWrite:false
   })
  );
  aurora.position.set(0,18+i*4,-34-i*3);
  aurora.userData.phase=i*.7;
  environmentFxAddObject(aurora,'aurora');
 }
}

function environmentFxCreateDesertWorld(root){
 scene.background=new THREE.Color(0xd7ad6b);
 scene.fog=new THREE.FogExp2(0xd6b178,.018);

 const floor=new THREE.Mesh(
  new THREE.PlaneGeometry(120,120,42,42),
  environmentFxMaterial(0xc99852,{roughness:1})
 );
 floor.rotation.x=-Math.PI/2;
 floor.position.y=-2;
 floor.userData.basePositions=floor.geometry.attributes.position.array.slice();
 environmentFxAddObject(floor,'sandDunes');

 for(let i=0;i<22;i++){
  const cactus=new THREE.Group();
  const material=environmentFxMaterial(0x387646,{roughness:.9});
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.4,.55,4+Math.random()*4,10),material);
  trunk.position.y=2;
  cactus.add(trunk);
  if(i%2===0){
   const arm=new THREE.Mesh(new THREE.CylinderGeometry(.22,.3,2.2,10),material);
   arm.rotation.z=Math.PI/2;
   arm.position.set(.8,2.2,0);
   cactus.add(arm);
  }
  cactus.position.set(-40+Math.random()*80,-2,-35+Math.random()*65);
  environmentFxAddObject(cactus,'cactus');
 }

 const sand=environmentFxPointCloud(1000,0xe2bb79,.07,.42);
 environmentFxAddObject(sand,'sandstorm');

 const mirage=new THREE.Mesh(
  new THREE.PlaneGeometry(30,8),
  new THREE.MeshBasicMaterial({
   color:0xbfe8ff,
   transparent:true,
   opacity:.08,
   side:THREE.DoubleSide,
   depthWrite:false
  })
 );
 mirage.position.set(0,2,-35);
 environmentFxAddObject(mirage,'mirage');
}

function environmentFxCreateForestWorld(root){
 scene.background=new THREE.Color(0x6fa17b);
 scene.fog=new THREE.FogExp2(0x6f8c72,.028);

 const floor=new THREE.Mesh(
  new THREE.PlaneGeometry(110,110),
  environmentFxMaterial(0x3f5f34,{roughness:1})
 );
 floor.rotation.x=-Math.PI/2;
 floor.position.y=-2;
 environmentFxAddObject(floor,'forestFloor');

 for(let i=0;i<56;i++){
  const tree=new THREE.Group();
  const trunk=new THREE.Mesh(
   new THREE.CylinderGeometry(.35,.55,4+Math.random()*5,9),
   environmentFxMaterial(0x6b4427,{roughness:1})
  );
  trunk.position.y=1;
  tree.add(trunk);
  const crown=new THREE.Mesh(
   new THREE.SphereGeometry(1.5+Math.random()*1.7,12,9),
   environmentFxMaterial([0x2f6f3a,0x397f44,0x4d8c50][i%3],{roughness:.95})
  );
  crown.position.y=4.2+Math.random()*2;
  tree.add(crown);
  tree.position.set(-45+Math.random()*90,-2,-45+Math.random()*75);
  environmentFxAddObject(tree,'tree');
 }

 const butterflies=environmentFxPointCloud(460,0xffe68a,.095,.8);
 environmentFxAddObject(butterflies,'butterfly');

 for(let i=0;i<4;i++){
  const beam=new THREE.Mesh(
   new THREE.ConeGeometry(5,26,20,1,true),
   new THREE.MeshBasicMaterial({
    color:0xfff3b0,
    transparent:true,
    opacity:.08,
    side:THREE.DoubleSide,
    blending:THREE.AdditiveBlending,
    depthWrite:false
   })
  );
  beam.position.set(-24+i*16,12,-22);
  beam.rotation.x=Math.PI;
  environmentFxAddObject(beam,'forestBeam');
 }
}

function environmentFxCreateFutureCity(root){
 scene.background=new THREE.Color(0x030714);
 scene.fog=new THREE.FogExp2(0x061024,.018);

 const ground=new THREE.Mesh(
  new THREE.PlaneGeometry(120,120),
  environmentFxMaterial(0x111827,{roughness:.35,metalness:.55})
 );
 ground.rotation.x=-Math.PI/2;
 ground.position.y=-2;
 environmentFxAddObject(ground,'futureGround');

 const neon=[0x00e5ff,0xff3df2,0x7cff4f,0xffb21f];
 for(let i=0;i<42;i++){
  const h=8+Math.random()*28;
  const building=new THREE.Mesh(
   new THREE.BoxGeometry(3+Math.random()*6,h,3+Math.random()*6),
   environmentFxMaterial(0x182138,{
    roughness:.22,
    metalness:.65,
    emissive:neon[i%neon.length],
    emissiveIntensity:.06
   })
  );
  building.position.set(-45+Math.random()*90,-2+h/2,-45+Math.random()*75);
  building.userData.neon=neon[i%neon.length];
  environmentFxAddObject(building,'futureBuilding');
 }

 for(let i=0;i<16;i++){
  const car=new THREE.Mesh(
   new THREE.BoxGeometry(1.8,.5,.8),
   environmentFxMaterial(neon[i%neon.length],{
    metalness:.7,
    roughness:.15,
    emissive:neon[i%neon.length],
    emissiveIntensity:.65
   })
  );
  car.position.set(-30+Math.random()*60,5+Math.random()*14,-30+Math.random()*50);
  car.userData.speed=2+Math.random()*3;
  environmentFxAddObject(car,'flyingCar');
 }

 for(let i=0;i<10;i++){
  const holo=new THREE.Mesh(
   new THREE.PlaneGeometry(4,2.4),
   new THREE.MeshBasicMaterial({
    color:neon[i%neon.length],
    transparent:true,
    opacity:.35,
    side:THREE.DoubleSide,
    blending:THREE.AdditiveBlending
   })
  );
  holo.position.set(-30+Math.random()*60,4+Math.random()*12,-24+Math.random()*35);
  holo.rotation.y=Math.random()*Math.PI;
  environmentFxAddObject(holo,'hologram');
 }
}

function environmentFxCreateIndustrialFactory(root){
 scene.background=new THREE.Color(0x58636b);
 scene.fog=new THREE.FogExp2(0x6a747a,.026);

 const floor=new THREE.Mesh(
  new THREE.PlaneGeometry(110,110),
  environmentFxMaterial(0x363b3e,{roughness:.95,metalness:.12})
 );
 floor.rotation.x=-Math.PI/2;
 floor.position.y=-2;
 environmentFxAddObject(floor,'factoryFloor');

 for(let i=0;i<8;i++){
  const chimney=new THREE.Mesh(
   new THREE.CylinderGeometry(1.2,1.8,16+Math.random()*10,18),
   environmentFxMaterial(0x64676a,{roughness:.78,metalness:.35})
  );
  chimney.position.set(-34+i*10,7,-32+Math.random()*10);
  environmentFxAddObject(chimney,'chimney');
 }

 for(let i=0;i<5;i++){
  const belt=new THREE.Mesh(
   new THREE.BoxGeometry(18,1,3.2),
   environmentFxMaterial(0x25292d,{roughness:.6,metalness:.45})
  );
  belt.position.set(-28+i*14,0,-8+i%2*9);
  environmentFxAddObject(belt,'conveyor');
 }

 for(let i=0;i<9;i++){
  const arm=new THREE.Group();
  const base=new THREE.Mesh(
   new THREE.CylinderGeometry(1.1,1.3,1.3,16),
   environmentFxMaterial(0xf1a51b,{metalness:.28,roughness:.45})
  );
  arm.add(base);
  const segment=new THREE.Mesh(
   new THREE.BoxGeometry(.8,5,.8),
   base.material
  );
  segment.position.y=2.8;
  segment.rotation.z=.35;
  arm.add(segment);
  arm.position.set(-36+Math.random()*72,-1,-18+Math.random()*38);
  arm.userData.phase=i*.6;
  environmentFxAddObject(arm,'robotArm');
 }

 const smoke=environmentFxPointCloud(900,0xaab0b4,.12,.35);
 environmentFxAddObject(smoke,'factorySmoke');

 for(let i=0;i<10;i++){
  const beacon=new THREE.PointLight(0xff2400,1.4,12,2);
  beacon.position.set(-34+i*7,3,-5+(i%2)*16);
  beacon.userData.phase=i*.4;
  environmentFxAddObject(beacon,'factoryBeacon');
 }
}

function environmentFxCreate(type){
 environmentFxClear();

 environmentFxState.type=type;
 environmentFxState.status=type==='clear'?'stopped':'running';
 environmentFxState.root=new THREE.Group();
 environmentFxState.root.name='ENVIRONMENT_EFFECTS_ROOT';
 scene.add(environmentFxState.root);
 environmentFxState.clock=new THREE.Clock();

 environmentFxState.originalBackground=scene.background;
 environmentFxState.originalFog=scene.fog;
 environmentFxState.baseCameraPosition=camera.position.clone();
 environmentFxState.baseOrbitTarget=
  orbit?.target?.clone?.()||new THREE.Vector3();
 environmentFxState.sequenceIndex=0;
 environmentFxState.sequenceTime=0;
 environmentFxState.specialData=null;

 const root=environmentFxState.root;
 const intensity=environmentFxState.intensity;
 const baseCount=Math.max(180,Math.round(950*intensity));

 if(type==='clear'){
  environmentFxClear();
  return;
 }

 if(type==='rain'){
  const rain=environmentFxLineParticles(baseCount,0xb8def0,1.15,.78);
  rain.userData.fx='rain';
  root.add(rain);environmentFxState.objects.push(rain);
 }
 if(type==='snow'){
  const snow=environmentFxPointCloud(Math.round(baseCount*.95),0xffffff,.14,.9);
  snow.userData.fx='snow';
  root.add(snow);environmentFxState.objects.push(snow);
 }
 if(type==='hail'){
  const hail=environmentFxPointCloud(Math.round(baseCount*.48),0xeafaff,.19,.96);
  hail.userData.fx='hail';
  root.add(hail);environmentFxState.objects.push(hail);
 }
 if(type==='meteor'||type==='space'){
  scene.background=new THREE.Color(0x020611);
  const stars=environmentFxPointCloud(type==='space'?2200:1150,0xffffff,.075,.96);
  stars.userData.fx='stars';
  root.add(stars);environmentFxState.objects.push(stars);

  const meteors=environmentFxLineParticles(type==='space'?18:54,0xbce3ff,type==='space'?1.8:3.4,.92);
  meteors.userData.fx='meteor';
  root.add(meteors);environmentFxState.objects.push(meteors);
 }
 if(type==='sandstorm'){
  const sand=environmentFxPointCloud(Math.round(baseCount*1.75),0xd7b17c,.09,.56);
  sand.userData.fx='sandstorm';
  root.add(sand);environmentFxState.objects.push(sand);
 }
 if(type==='typhoon'||type==='storm'){
  const count=Math.round(baseCount*(type==='storm'?2.15:1.75));
  const rain=environmentFxLineParticles(count,0xc0e3f1,type==='storm'?1.75:1.45,.8);
  rain.userData.fx=type;
  root.add(rain);environmentFxState.objects.push(rain);
 }
 if(type==='tornado'){
  const tornado=environmentFxPointCloud(Math.round(baseCount*1.65),0xbdb2a2,.11,.62);
  tornado.userData.fx='tornado';
  root.add(tornado);environmentFxState.objects.push(tornado);
 }
 if(type==='flood'){
  const water=environmentFxWaterPlane();
  water.position.y=environmentFxGetWaterLevel();
  root.add(water);environmentFxState.objects.push(water);
 }
 if(type==='tsunami'){
  const water=environmentFxWaterPlane();
  water.userData.fx='tsunami';
  water.rotation.z=Math.PI/2;
  water.scale.set(.22,1,1);
  const bounds=environmentFxBounds();
  water.position.set(0,environmentFxGetWaterLevel()+2,bounds.minZ-12);
  root.add(water);environmentFxState.objects.push(water);
 }


 if(type==='spaceTour'){
  environmentFxCreateSpaceTour(root);
 }
 if(type==='blackHole'){
  environmentFxCreateBlackHole(root);
 }
 if(type==='lavaMountains'){
  environmentFxCreateLavaMountains(root);
 }
 if(type==='crystalCave'){
  environmentFxCreateCrystalCave(root);
 }
 if(type==='deepCrust'){
  environmentFxCreateDeepCrust(root);
 }
 if(type==='cellar'){
  environmentFxCreateCellar(root);
 }
 if(type==='retroPlatform'){
  environmentFxCreateRetroPlatform(root);
 }
 if(type==='waterfall'){
  environmentFxCreateWaterfall(root);
 }
 if(type==='apocalypse'){
  environmentFxCreateApocalypse(root);
 }


 if(type==='underwater'){
  environmentFxCreateUnderwater(root);
 }
 if(type==='iceWorld'){
  environmentFxCreateIceWorld(root);
 }
 if(type==='desertWorld'){
  environmentFxCreateDesertWorld(root);
 }
 if(type==='forestWorld'){
  environmentFxCreateForestWorld(root);
 }
 if(type==='futureCity'){
  environmentFxCreateFutureCity(root);
 }
 if(type==='industrialFactory'){
  environmentFxCreateIndustrialFactory(root);
 }

 if(environmentFxState.lighting){
  if(type==='snow'){
   scene.background=new THREE.Color(0xb8c8d2);
  }else if(['rain','typhoon','storm','tornado'].includes(type)){
   scene.background=new THREE.Color(0x536a7a);
  }else if(type==='sandstorm'){
   scene.background=new THREE.Color(0xa98b68);
  }else if(type==='lavaMountains'){
   scene.background=new THREE.Color(0x180502);
  }else if(type==='crystalCave'){
   scene.background=new THREE.Color(0x06131f);
  }else if(type==='deepCrust'){
   scene.background=new THREE.Color(0x150d09);
  }else if(type==='cellar'){
   scene.background=new THREE.Color(0x100e0b);
  }else if(type==='apocalypse'){
   scene.background=new THREE.Color(0x240303);
  }
 }

 if(environmentFxState.fog){
  if(type==='sandstorm'){
   scene.fog=new THREE.FogExp2(0xc4a477,.045*intensity);
  }else if(type==='storm'){
   scene.fog=new THREE.FogExp2(0x617581,.042*intensity);
  }else if(type==='typhoon'||type==='rain'||type==='tornado'){
   scene.fog=new THREE.FogExp2(0x6b7e89,.026*intensity);
  }else if(type==='snow'){
   scene.fog=new THREE.FogExp2(0xc4d2da,.018*intensity);
  }
 }

 environmentFxApplyDeviceWarnings();
 environmentFxAnimate();
}

function environmentFxUpdateLines(object,delta,time,kind){
 const attr=object.geometry.attributes.position;
 const count=attr.count/2;
 const fall=kind==='meteor'?18:(kind==='storm'?22:(kind==='typhoon'?18:15));
 const drift=environmentFxState.wind*(kind==='typhoon'?9:3.5);

 for(let i=0;i<count;i++){
  const a=i*2,b=a+1;
  let x=attr.getX(a)+drift*delta*environmentFxState.speed;
  let y=attr.getY(a)-fall*delta*environmentFxState.speed;
  let z=attr.getZ(a)+(kind==='meteor'?8*delta*environmentFxState.speed:0);

  const length=kind==='meteor'?3.4:(kind==='storm'?1.75:1.25);
  attr.setXYZ(a,x,y,z);
  attr.setXYZ(
   b,
   x-environmentFxState.wind*.45,
   y-length,
   z-(kind==='meteor'?2.8:0)
  );

  const bounds=environmentFxBounds();
  if(y<bounds.minY||x<bounds.minX-15||x>bounds.maxX+15||z>bounds.maxZ+20){
   environmentFxResetLine(object,i,kind);
  }
 }
 attr.needsUpdate=true;
}

function environmentFxUpdatePoints(object,delta,time,kind){
 const attr=object.geometry.attributes.position;
 const bounds=environmentFxBounds();

 for(let i=0;i<attr.count;i++){
  let x=attr.getX(i);
  let y=attr.getY(i);
  let z=attr.getZ(i);

  if(kind==='snow'){
   x+=environmentFxState.wind*1.8*delta*environmentFxState.speed;
   y-=(.65+(i%7)*.045)*delta*environmentFxState.speed;
   z+=Math.sin(time*1.5+i)*.0025;
  }else if(kind==='hail'){
   x+=environmentFxState.wind*1.3*delta*environmentFxState.speed;
   y-=11*delta*environmentFxState.speed;
   if(y<bounds.minY+1.2){
    y=bounds.minY+1.2+Math.abs(Math.sin(time*8+i))*1.25;
   }
  }else if(kind==='sandstorm'){
   x+=(7+environmentFxState.wind*8)*delta*environmentFxState.speed;
   y+=Math.sin(time*2+i)*.005;
   z+=Math.cos(time+i)*.009;
  }else if(kind==='tornado'){
   const ratio=(i%130)/130;
   const radius=.7+ratio*7;
   const angle=time*(2.5+environmentFxState.speed)+i*.37;
   const centerX=Math.sin(time*.18)*10;
   const centerZ=Math.cos(time*.14)*7;
   x=centerX+Math.cos(angle)*radius;
   y=bounds.minY+ratio*(bounds.maxY-bounds.minY)*.78;
   z=centerZ+Math.sin(angle)*radius;
  }

  attr.setXYZ(i,x,y,z);

  if(kind==='snow'&&y<bounds.minY)environmentFxResetPoint(object,i);
  if(kind==='sandstorm'&&x>bounds.maxX)attr.setX(i,bounds.minX);
  if(kind==='hail'&&(x<bounds.minX||x>bounds.maxX))environmentFxResetPoint(object,i);
 }
 attr.needsUpdate=true;
}

function environmentFxUpdateWater(object,time){
 const attr=object.geometry.attributes.position;
 const base=object.userData.basePositions;
 if(base){
  for(let i=0;i<attr.count;i++){
   const idx=i*3;
   const x=base[idx];
   const z=base[idx+2];
   attr.setY(i,Math.sin(time*1.35+x*.18+z*.16)*.13);
  }
  attr.needsUpdate=true;
  object.geometry.computeVertexNormals();
 }
 object.position.y=environmentFxGetWaterLevel();
}


function environmentFxUpdateSpecial(delta,time){
 const data=environmentFxState.specialData;

 if(data?.kind==='spaceTour'&&data.planets.length){
  data.phaseTime+=delta*environmentFxState.speed;

  const planet=data.planets[data.index];
  const radius=planet.userData.radius||2;
  const approachDuration=4.5;
  const orbitDuration=5.5;
  const leaveDuration=3.2;
  const total=approachDuration+orbitDuration+leaveDuration;
  const t=data.phaseTime;

  const direction=new THREE.Vector3(
   Math.sin(data.index*1.7),
   .25+Math.sin(data.index)*.18,
   Math.cos(data.index*1.3)
  ).normalize();

  const nearPosition=planet.position.clone().add(
   direction.multiplyScalar(radius*4.5+5)
  );

  if(t<approachDuration){
   const q=t/approachDuration;
   camera.position.lerp(nearPosition,.025+.06*q);
  }else if(t<approachDuration+orbitDuration){
   const q=(t-approachDuration)/orbitDuration;
   const angle=q*Math.PI*2;
   camera.position.set(
    planet.position.x+Math.cos(angle)*(radius*4.5+5),
    planet.position.y+Math.sin(angle*.7)*(radius*1.4+2),
    planet.position.z+Math.sin(angle)*(radius*4.5+5)
   );
  }else{
   const q=(t-approachDuration-orbitDuration)/leaveDuration;
   camera.position.lerp(
    planet.position.clone().add(
     new THREE.Vector3(0,6,18+q*26)
    ),
    .055
   );
  }

  orbit?.target?.lerp?.(planet.position,.1);
  orbit?.update?.();

  if(t>=total){
   data.phaseTime=0;
   data.index=(data.index+1)%data.planets.length;
   environmentFxSetStatus(
    `太空漫遊：前往第 ${data.index+1}/15 顆｜${data.planets[data.index].userData.name}`
   );
  }
 }

 if(data?.kind==='blackHole'){
  const center=data.center;
  const angle=time*.16*environmentFxState.speed;
  const radius=data.radius+Math.sin(time*.23)*2.5;
  camera.position.set(
   center.x+Math.cos(angle)*radius,
   center.y+4+Math.sin(angle*.7)*5,
   center.z+Math.sin(angle)*radius
  );
  orbit?.target?.lerp?.(center,.08);
  orbit?.update?.();
 }

 for(const object of environmentFxState.objects){
  const fx=object.userData.fx;

  if(fx==='blackHoleDisk'){
   object.rotation.z+=delta*object.userData.spin*environmentFxState.speed;
  }else if(fx==='blackHoleLens'){
   object.rotation.z-=delta*.18*environmentFxState.speed;
  }else if(fx==='tourPlanet'){
   object.rotation.y+=delta*.13*environmentFxState.speed;
  }else if(fx==='lavaRiver'){
   object.material.emissiveIntensity=
    1.25+Math.sin(time*3+object.position.x)*.45;
  }else if(fx==='lavaSparks'){
   environmentFxUpdatePoints(object,delta,time,'sandstorm');
  }else if(fx==='crystal'){
   object.material.emissiveIntensity=
    .35+Math.sin(time*2+object.position.x)*.25;
  }else if(fx==='crystalDust'){
   object.rotation.y+=delta*.12;
   object.position.y=Math.sin(time*.4)*.35;
  }else if(fx==='crustFissure'){
   object.material.opacity=.6+Math.sin(time*3+object.position.x)*.3;
  }else if(fx==='cellarLamp'){
   object.intensity=1.8+Math.sin(time*7)*.25+Math.sin(time*13)*.12;
  }else if(fx==='questionBlock'){
   object.position.y=object.userData.baseY+Math.sin(time*2.4+object.position.x)*.16;
  }else if(fx==='retroCoin'){
   object.rotation.z+=delta*2.2*environmentFxState.speed;
   object.position.y=
    object.userData.baseY+Math.sin(time*2+object.userData.phase)*.35;
  }else if(fx==='waterfallSheet'){
   const attr=object.geometry.attributes.position;
   const base=object.userData.basePositions;
   for(let i=0;i<attr.count;i++){
    const idx=i*3;
    attr.setZ(
     i,
     base[idx+2]+Math.sin(time*5+base[idx]*.7+base[idx+1]*.4)*.18
    );
   }
   attr.needsUpdate=true;
  }else if(fx==='waterfallPool'){
   environmentFxUpdateWater(object,time);
  }else if(fx==='waterfallMist'){
   object.position.y=.5+Math.sin(time*.8)*.3;
   object.rotation.y+=delta*.08;
  }else if(fx==='apocalypseMeteor'){
   environmentFxUpdateLines(object,delta,time,'meteor');
  }else if(fx==='apocalypseEmber'){
   environmentFxUpdatePoints(object,delta,time,'sandstorm');
  }else if(fx==='fish'){
   object.position.x+=delta*object.userData.speed*environmentFxState.speed;
   object.position.y+=Math.sin(time*2+object.userData.phase)*.008;
   if(object.position.x>35)object.position.x=-35;
  }else if(fx==='bubbles'){
   const attr=object.geometry.attributes.position;
   for(let i=0;i<attr.count;i++){
    let y=attr.getY(i)+delta*(.5+(i%7)*.12);
    if(y>22)y=-3;
    attr.setY(i,y);
   }
   attr.needsUpdate=true;
  }else if(fx==='aurora'){
   object.material.opacity=.09+Math.sin(time*.8+object.userData.phase)*.045;
   object.rotation.z=Math.sin(time*.3+object.userData.phase)*.05;
  }else if(fx==='sandDunes'){
   const attr=object.geometry.attributes.position;
   const base=object.userData.basePositions;
   for(let i=0;i<attr.count;i++){
    const idx=i*3;
    attr.setZ(i,base[idx+2]+Math.sin(base[idx]*.1+time*.3)*.18);
   }
   attr.needsUpdate=true;
  }else if(fx==='mirage'){
   object.material.opacity=.04+Math.sin(time*2)*.035;
   object.scale.x=1+Math.sin(time*.7)*.08;
  }else if(fx==='butterfly'){
   object.rotation.y+=delta*.22;
   object.position.y=1.5+Math.sin(time*.8)*.8;
  }else if(fx==='futureBuilding'){
   object.material.emissiveIntensity=.04+Math.sin(time*2+object.position.x)*.04;
  }else if(fx==='flyingCar'){
   object.position.x+=delta*object.userData.speed*environmentFxState.speed;
   object.position.y+=Math.sin(time*1.8+object.position.z)*.01;
   if(object.position.x>42)object.position.x=-42;
  }else if(fx==='hologram'){
   object.material.opacity=.22+Math.sin(time*3+object.position.x)*.12;
   object.rotation.y+=delta*.18;
  }else if(fx==='robotArm'){
   object.rotation.y=Math.sin(time*1.2+object.userData.phase)*.8;
  }else if(fx==='factorySmoke'){
   object.position.y+=delta*.12;
   object.rotation.y+=delta*.03;
   if(object.position.y>8)object.position.y=0;
  }else if(fx==='factoryBeacon'){
   object.intensity=Math.sin(time*5+object.userData.phase)>0?1.8:.15;
  }else if(fx==='apocalypseDebris'){
   object.rotation.x+=delta*object.userData.spin.x;
   object.rotation.y+=delta*object.userData.spin.y;
   object.rotation.z+=delta*object.userData.spin.z;
   object.position.y+=Math.sin(time*1.8+object.position.x)*.008;
  }
 }
}

function environmentFxAnimate(){
 if(environmentFxState.status!=='running')return;

 const delta=Math.min(.05,environmentFxState.clock?.getDelta?.()||.016);
 const time=performance.now()/1000;

 environmentFxUpdateSpecial(delta,time);

 for(const object of environmentFxState.objects){
  const fx=object.userData.fx;
  if(['rain','typhoon','storm','meteor'].includes(fx)){
   environmentFxUpdateLines(object,delta,time,fx);
  }else if(['snow','hail','sandstorm','tornado'].includes(fx)){
   environmentFxUpdatePoints(object,delta,time,fx);
  }else if(fx==='stars'){
   object.rotation.y+=delta*.026*environmentFxState.speed;
   object.rotation.x+=delta*.004;
  }else if(fx==='flood'){
   environmentFxUpdateWater(object,time);
  }else if(fx==='tsunami'){
   const bounds=environmentFxBounds();
   object.position.z+=delta*9*environmentFxState.speed;
   object.scale.x=.22+Math.sin(time*1.2)*.035;
   if(object.position.z>bounds.maxZ+16)object.position.z=bounds.minZ-16;
  }
 }

 if(
  environmentFxState.cameraShake &&
  ['typhoon','storm','tornado','tsunami','apocalypse'].includes(environmentFxState.type)
 ){
  if(!environmentFxState.baseCameraPosition){
   environmentFxState.baseCameraPosition=camera.position.clone();
  }
  const strength=.035*environmentFxState.intensity;
  camera.position.x=
   environmentFxState.baseCameraPosition.x+Math.sin(time*19)*strength;
  camera.position.y=
   environmentFxState.baseCameraPosition.y+Math.sin(time*23)*strength*.55;
 }else if(environmentFxState.baseCameraPosition){
  environmentFxState.baseCameraPosition.copy(camera.position);
 }

 if(environmentFxState.type==='storm'&&Math.random()<.006*environmentFxState.intensity){
  renderer.toneMappingExposure=2.3;
  clearTimeout(environmentFxState.flashTimer);
  environmentFxState.flashTimer=setTimeout(()=>{
   renderer.toneMappingExposure=1;
  },75);
 }

 if(environmentFxState.deviceImpact){
  environmentFxApplyDeviceWarnings();
 }

 renderer.render(scene,camera);
 environmentFxState.frame=requestAnimationFrame(environmentFxAnimate);
}

function environmentFxSetStatus(text){
 const element=$('environmentFxStatus');
 if(element)element.textContent=text;
}

function environmentFxSelect(type){
 const definition=ENVIRONMENT_FX_DEFINITIONS[type]||ENVIRONMENT_FX_DEFINITIONS.clear;
 environmentFxState.type=type;
 $('environmentFxTitle').textContent=definition.label;
 $('environmentFxDescription').textContent=definition.description;
 document.querySelectorAll('[data-fx]').forEach(button=>{
  button.classList.toggle('active',button.dataset.fx===type);
 });
 environmentFxSetStatus(`已選擇：${definition.label}｜按「播放」開始`);
}

function environmentFxPlay(){
 environmentFxCreate(environmentFxState.type);
 const definition=ENVIRONMENT_FX_DEFINITIONS[environmentFxState.type];
 environmentFxSetStatus(`播放中：${definition.label}`);
 window.UTOP_DEBUG?.record?.(
  'ACTION',
  'Environment',
  `播放環境特效：${definition.label}`,
  {
   type:environmentFxState.type,
   intensity:environmentFxState.intensity,
   speed:environmentFxState.speed,
   wind:environmentFxState.wind,
   water:environmentFxState.water
  }
 );
}

function environmentFxPause(){
 if(environmentFxState.status==='running'){
  environmentFxState.status='paused';
  if(environmentFxState.frame)cancelAnimationFrame(environmentFxState.frame);
  environmentFxState.frame=null;
  environmentFxSetStatus('已暫停：保留目前畫面');
 }else if(environmentFxState.status==='paused'){
  environmentFxState.status='running';
  environmentFxState.clock?.start?.();
  environmentFxAnimate();
  environmentFxSetStatus('繼續播放');
 }
}

function environmentFxStop(){
 environmentFxState.status='stopped';
 environmentFxClear();
 environmentFxSetStatus('已停止：場景恢復一般環境');
}

function environmentFxReset(){
 environmentFxState.intensity=.65;
 environmentFxState.speed=1;
 environmentFxState.wind=.15;
 environmentFxState.water=.35;
 environmentFxState.cameraShake=false;
 environmentFxState.lighting=true;
 environmentFxState.fog=true;
 environmentFxState.deviceImpact=false;

 $('environmentFxIntensity').value='65';
 $('environmentFxSpeed').value='100';
 $('environmentFxWind').value='15';
 $('environmentFxWater').value='35';
 $('environmentFxIntensityValue').value='65%';
 $('environmentFxSpeedValue').value='1.00×';
 $('environmentFxWindValue').value='15';
 $('environmentFxWaterValue').value='35%';
 $('environmentFxCameraShake').checked=false;
 $('environmentFxLighting').checked=true;
 $('environmentFxFog').checked=true;
 $('environmentFxDeviceImpact').checked=false;

 environmentFxSelect('clear');
 environmentFxStop();
}


function environmentFxSerialize(){
 return {
  type:environmentFxState.type,
  intensity:environmentFxState.intensity,
  speed:environmentFxState.speed,
  wind:environmentFxState.wind,
  water:environmentFxState.water,
  cameraShake:environmentFxState.cameraShake,
  lighting:environmentFxState.lighting,
  fog:environmentFxState.fog,
  deviceImpact:environmentFxState.deviceImpact,
  status:environmentFxState.status,
  camera:{
   position:camera.position.toArray(),
   target:orbit?.target?.toArray?.()||[0,0,0]
  }
 };
}

function environmentFxRestoreFromProject(data){
 if(!data||typeof data!=='object')return false;

 environmentFxState.intensity=Number(data.intensity??.65);
 environmentFxState.speed=Number(data.speed??1);
 environmentFxState.wind=Number(data.wind??.15);
 environmentFxState.water=Number(data.water??.35);
 environmentFxState.cameraShake=!!data.cameraShake;
 environmentFxState.lighting=data.lighting!==false;
 environmentFxState.fog=data.fog!==false;
 environmentFxState.deviceImpact=!!data.deviceImpact;

 const type=ENVIRONMENT_FX_DEFINITIONS[data.type]
  ?data.type
  :'clear';

 environmentFxSelect(type);

 if(data.status==='running'&&type!=='clear'){
  environmentFxCreate(type);
 }else{
  environmentFxState.type=type;
 }

 if(Array.isArray(data.camera?.position)&&data.camera.position.length>=3){
  camera.position.fromArray(data.camera.position);
 }
 if(Array.isArray(data.camera?.target)&&data.camera.target.length>=3&&orbit?.target){
  orbit.target.fromArray(data.camera.target);
  orbit.update?.();
 }

 return true;
}

window.UTOP_ENVIRONMENT_FX=Object.freeze({
 serialize:environmentFxSerialize,
 restore:environmentFxRestoreFromProject,

 select:environmentFxSelect,
 play:environmentFxPlay,
 pause:environmentFxPause,
 stop:environmentFxStop,
 reset:environmentFxReset,
 getState:()=>({
  type:environmentFxState.type,
  intensity:environmentFxState.intensity,
  speed:environmentFxState.speed,
  wind:environmentFxState.wind,
  water:environmentFxState.water,
  status:environmentFxState.status
 })
});


const state={globalMovementLocked:false,globalLabelsVisible:true,items:[],wires:[],shortcuts:[],selectedId:null,next:1,pending:null,activeWires:new Set(),wireLevels:new Map(),activeTab:'properties'};

/* V5.1.3.60 四種模組關聯視圖：提供目前專案的唯讀快照 */
function buildRelationshipSnapshot(){
 const normalizePorts=(ports=[])=>ports.map(p=>Array.isArray(p)?[p[0],p[1],p[2]]:p);
 const items=state.items.map(item=>{
  const def=defs[item.type]||{};
  return {id:item.id,name:item.name||def.name||item.type,type:item.type,assetId:def.assetId||'',di:normalizePorts(def.di||[]),do:normalizePorts(def.do||[]),params:item.params?structuredClone(item.params):{},x:Number(item.x??item.worldTransform?.x??0),y:Number(item.y??item.worldTransform?.y??0),z:Number(item.z??item.worldTransform?.z??0)};
 });
 return {version:'5.1.3.63',generatedAt:new Date().toISOString(),projectName:document.title||'UTOP-3D',items,wires:state.wires.map(w=>({...w})),shortcuts:(state.shortcuts||[]).map(x=>({...x}))};
}
let relationshipSnapshotRevision=0;
function relationshipSnapshotHasData(snapshot){
 return !!(snapshot&&Array.isArray(snapshot.items)&&snapshot.items.length>0);
}
function persistRelationshipSnapshot(options={}){
 const snapshot=buildRelationshipSnapshot();
 relationshipSnapshotRevision+=1;
 snapshot.revision=relationshipSnapshotRevision;
 snapshot.version='5.1.3.63';
 const allowEmpty=options.allowEmpty===true;
 try{
  const previous=JSON.parse(localStorage.getItem('utop3d.relationship.snapshot')||'null');
  if(relationshipSnapshotHasData(snapshot)||allowEmpty||!relationshipSnapshotHasData(previous)){
   localStorage.setItem('utop3d.relationship.snapshot',JSON.stringify(snapshot));
  }
 }catch(error){console.warn('[UTOP] 關聯視圖快照無法寫入 localStorage',error);}
 return snapshot;
}
function relationshipLiveSnapshot(){
 const current=buildRelationshipSnapshot();
 current.revision=relationshipSnapshotRevision;
 current.version='5.1.3.63';
 if(relationshipSnapshotHasData(current))return current;
 try{
  const cached=JSON.parse(localStorage.getItem('utop3d.relationship.snapshot')||'null');
  if(relationshipSnapshotHasData(cached))return cached;
 }catch{}
 return current;
}
window.UTOP_RELATIONSHIP_API=Object.freeze({
 getSnapshot:()=>relationshipLiveSnapshot(),
 refreshSnapshot:()=>persistRelationshipSnapshot(),
 hasData:()=>relationshipSnapshotHasData(relationshipLiveSnapshot())
});
window.addEventListener('message',event=>{
 if(event.origin!==location.origin)return;
 if(event.data?.type!=='UTOP_RELATIONSHIP_REQUEST_SNAPSHOT')return;
 const snapshot=persistRelationshipSnapshot();
 try{event.source?.postMessage({type:'UTOP_RELATIONSHIP_SNAPSHOT',snapshot},event.origin);}catch(error){console.warn('[UTOP] 無法回傳關聯快照',error);}
});
let relationshipSnapshotTimer=0;
function scheduleRelationshipSnapshot(){
 clearTimeout(relationshipSnapshotTimer);
 relationshipSnapshotTimer=setTimeout(()=>{
  if(state.items.length)persistRelationshipSnapshot();
 },180);
}
setInterval(()=>{
 if(state.items.length)persistRelationshipSnapshot();
},1500);

function ensureRelationshipDrawer(){
 let shell=document.getElementById('relationshipDrawerShell');
 if(shell)return shell;
 const style=document.createElement('style');
 style.id='relationshipDrawerStyle';
 style.textContent=`
 #relationshipDrawerBackdrop{position:fixed;inset:0;background:rgba(2,10,18,.42);z-index:2147481200;opacity:0;pointer-events:none;transition:opacity .22s ease;}
 #relationshipDrawerBackdrop.is-open{opacity:1;pointer-events:auto;}
 #relationshipDrawerShell{position:fixed;top:0;right:0;width:min(90vw,1900px);height:100vh;background:#081421;z-index:2147481201;transform:translateX(102%);transition:transform .28s cubic-bezier(.22,.8,.28,1);box-shadow:-18px 0 48px rgba(0,0,0,.34);display:flex;flex-direction:column;border-left:1px solid rgba(84,153,210,.36);}
 #relationshipDrawerShell.is-open{transform:translateX(0);}
 #relationshipDrawerBar{height:44px;min-height:44px;display:flex;align-items:center;gap:8px;padding:0 10px;background:#06111c;border-bottom:1px solid rgba(84,153,210,.28);color:#eaf5ff;font-family:'Microsoft JhengHei',sans-serif;}
 #relationshipDrawerTitle{font-weight:700;white-space:nowrap;margin-right:auto;}
 .relationship-drawer-tab{border:1px solid #29445e;background:#102235;color:#d9eaff;border-radius:8px;padding:6px 10px;cursor:pointer;}
 .relationship-drawer-tab.is-active{background:#52337d;border-color:#9159da;color:#fff;}
 #relationshipDrawerClose{border:1px solid #6b3340;background:#351822;color:#fff;border-radius:8px;padding:6px 11px;cursor:pointer;}
 #relationshipDrawerFrame{width:100%;height:calc(100vh - 44px);border:0;background:#071019;flex:1;}
 @media(max-width:800px){#relationshipDrawerShell{width:96vw}.relationship-drawer-tab{padding:5px 7px;font-size:12px}#relationshipDrawerTitle{display:none}}
 `;
 document.head.appendChild(style);
 const backdrop=document.createElement('div');backdrop.id='relationshipDrawerBackdrop';
 shell=document.createElement('section');shell.id='relationshipDrawerShell';shell.setAttribute('aria-hidden','true');
 shell.innerHTML=`<div id="relationshipDrawerBar"><span id="relationshipDrawerTitle">模組關聯視圖</span><button class="relationship-drawer-tab" data-rel-path="pages/relationships/network-graph.html">網絡圖</button><button class="relationship-drawer-tab" data-rel-path="pages/relationships/relation-tree.html">關聯樹</button><button class="relationship-drawer-tab" data-rel-path="pages/relationships/knowledge-tree.html">知識樹</button><button class="relationship-drawer-tab" data-rel-path="pages/relationships/ai-mindmap.html">AI心智圖</button><button id="relationshipDrawerClose" type="button">✕ 關閉</button></div><iframe id="relationshipDrawerFrame" title="UTOP-3D 模組關聯視圖"></iframe>`;
 document.body.append(backdrop,shell);
 const close=()=>{shell.classList.remove('is-open');backdrop.classList.remove('is-open');shell.setAttribute('aria-hidden','true');};
 const openPath=(path)=>{const frame=shell.querySelector('#relationshipDrawerFrame');persistRelationshipSnapshot();frame.src=path;for(const b of shell.querySelectorAll('[data-rel-path]'))b.classList.toggle('is-active',b.dataset.relPath===path);shell.classList.add('is-open');backdrop.classList.add('is-open');shell.setAttribute('aria-hidden','false');};
 shell.querySelector('#relationshipDrawerClose').onclick=close;backdrop.onclick=close;
 shell.querySelectorAll('[data-rel-path]').forEach(b=>b.onclick=()=>openPath(b.dataset.relPath));
 window.addEventListener('keydown',e=>{if(e.key==='Escape'&&shell.classList.contains('is-open'))close();});
 window.UTOP_RELATIONSHIP_DRAWER=Object.freeze({open:openPath,close,isOpen:()=>shell.classList.contains('is-open')});
 return shell;
}
function openRelationshipPage(path){
 ensureRelationshipDrawer();
 window.UTOP_RELATIONSHIP_DRAWER.open(path);
}


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

/* V5.1.3.42 場景物理：地板接觸＋實體防重疊 */
const SCENE_PHYSICS_STORAGE_KEY='utop-scene-physics-v51342';
let scenePhysicsSettings=(()=>{
 try{return {...{floorEnabled:true,collisionEnabled:true},...JSON.parse(localStorage.getItem(SCENE_PHYSICS_STORAGE_KEY)||'{}')}}catch(_){return {floorEnabled:true,collisionEnabled:true}}
})();
function saveScenePhysicsSettings(){
 try{localStorage.setItem(SCENE_PHYSICS_STORAGE_KEY,JSON.stringify(scenePhysicsSettings))}catch(_){}
 window.UTOP_SCENE_PHYSICS={...scenePhysicsSettings};
}
function setScenePhysicsSettings(patch={}){
 scenePhysicsSettings={...scenePhysicsSettings,...patch};
 saveScenePhysicsSettings();
 const floor=document.getElementById('sceneFloorEnabled');if(floor)floor.checked=scenePhysicsSettings.floorEnabled!==false;
 const collision=document.getElementById('sceneCollisionEnabled');if(collision)collision.checked=scenePhysicsSettings.collisionEnabled!==false;
 window.dispatchEvent(new CustomEvent('utop-scene-physics-change',{detail:{...scenePhysicsSettings}}));
 return {...scenePhysicsSettings};
}
saveScenePhysicsSettings();
window.UTOP_SCENE_PHYSICS_API=Object.freeze({get:()=>({...scenePhysicsSettings}),set:setScenePhysicsSettings});

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

// V5.1.3.55：場景長度常數必須在任何 sceneSettings / roadMarkings 初始化前建立，避免 TDZ 啟動錯誤。
const BASE_SCENE_LENGTH=77.22;
const BASE_SCENE_HALF=BASE_SCENE_LENGTH/2;

const sceneSettings={
  labelMode:localStorage.getItem('utopLabelMode')||LABEL_MODES.ALL,
  roadMarkings:{centerLine:{...ROAD_MARKINGS.centerLine,roadLength:BASE_SCENE_LENGTH}},
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
 // V5.1.3.54：場景已延長至 77.22m，車輛邊界同步使用道路半長 38.61m。
 minZ:-38.61,
 maxZ:38.61
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

function hasSceneHeightProvider(){
 return typeof window.UTOP_SCENE_HEIGHT_PROVIDER==='function';
}

function getGroundHeightAt(x,z){
 const provider=window.UTOP_SCENE_HEIGHT_PROVIDER;
 if(typeof provider!=='function')return 0;
 try{
  const value=Number(provider(Number(x)||0,Number(z)||0));
  return Number.isFinite(value)?value:0;
 }catch(error){
  console.warn('[UTOP-3D] 地面高度讀取失敗',error);
  return 0;
 }
}

function getGroundOffset(item){
 const value=Number(item?.params?.groundOffset);
 if(Number.isFinite(value))return value;

 const ground=getGroundHeightAt(item?.x,item?.z);
 const offset=(Number(item?.y)||0)-ground;
 if(item?.params)item.params.groundOffset=offset;
 return offset;
}

function syncItemToGround(item,options={}){
 if(!item)return item;

 const followGround=
  options.force===true ||
  (
   hasSceneHeightProvider() &&
   item?.params?.followGround!==false
  );

 if(!followGround){
  if(item.mesh)item.mesh.position.set(item.x,item.y||0,item.z);
  return item;
 }

 const ground=getGroundHeightAt(item.x,item.z);
 const offset=options.resetOffset===true
  ?0
  :getGroundOffset(item);

 const range=getSceneHeightRange();
 const nextY=normalizeHeight(
  ground+offset,
  range.min,
  range.max
 );

 item.y=nextY;
 if(item.params){
  item.params.installationHeight=nextY;
  item.params.groundHeight=ground;
  item.params.groundOffset=nextY-ground;
  item.params.followGround=true;
 }
 if(item.mesh)item.mesh.position.set(item.x,nextY,item.z);
 return item;
}

function clampDevicePosition(item,x=item.x,z=item.z,options={}){
 const bounds=activeSceneBounds();
 const nextX=clampNumber(x,bounds.minX,bounds.maxX);
 const nextZ=clampNumber(z,bounds.minZ,bounds.maxZ);
 item.x=nextX;
 item.z=nextZ;

 if(options.snapToGround!==false){
  syncItemToGround(item,options);
 }else if(item.mesh){
  item.mesh.position.set(nextX,item.y||0,nextZ);
 }
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

function setPresentationCameraFov(value){
 const next=Math.max(28,Math.min(80,Number(value)||46));
 camera.fov=next;
 camera.updateProjectionMatrix();
 window.dispatchEvent(new CustomEvent('utop-camera-fov-changed',{detail:{fov:next}}));
 return next;
}
window.UTOP_CAMERA_VIEW=Object.freeze({
 getFov:()=>Number(camera.fov||46),
 setFov:setPresentationCameraFov
});

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

// V5.1.3.54：基礎場景所有長型地面素材統一使用目前長型場景長度。
// 馬路、人行道、路緣、草地與道路標線使用同一個 77.22m 基準，避免場景已加長但內部素材仍停在舊長度。

const groundTexture=makeNoiseTexture('#626c72',24,256);
groundTexture.repeat.set(6,Math.max(9,BASE_SCENE_LENGTH/3));
const ground=new THREE.Mesh(
 new THREE.PlaneGeometry(20,BASE_SCENE_LENGTH),
 new THREE.MeshStandardMaterial({map:groundTexture,color:0x7a858a,roughness:1})
);
ground.rotation.x=-Math.PI/2;
ground.receiveShadow=true;
scene.add(ground);

const asphaltTexture=makeNoiseTexture('#454a4d',34,256);
asphaltTexture.repeat.set(5,Math.max(27,BASE_SCENE_LENGTH));
const road=new THREE.Mesh(
 new THREE.PlaneGeometry(8,BASE_SCENE_LENGTH),
 new THREE.MeshStandardMaterial({map:asphaltTexture,color:0x585d60,roughness:.96})
);
road.rotation.x=-Math.PI/2;
road.position.y=.01;
road.receiveShadow=true;
scene.add(road);

// V5.1.0.1.1.1：記錄基礎場景靜態物件。
// 單車道場景會暫時隱藏原本雙車道底板，避免重疊與白色閃爍。
const baseSceneStaticObjects=[ground,road];

const paverTexture=makePaverTexture();
[-5.55,5.55].forEach(x=>{
 const sidewalk=new THREE.Mesh(
  new THREE.PlaneGeometry(2.7,BASE_SCENE_LENGTH),
  new THREE.MeshStandardMaterial({map:paverTexture,color:0xc2beb5,roughness:.92})
 );
 sidewalk.rotation.x=-Math.PI/2;
 sidewalk.position.set(x,.018,0);
 sidewalk.receiveShadow=true;
 scene.add(sidewalk);
 baseSceneStaticObjects.push(sidewalk);

 const curb=new THREE.Mesh(
  new THREE.BoxGeometry(.22,.18,BASE_SCENE_LENGTH),
  new THREE.MeshStandardMaterial({color:0xbfc4c6,roughness:.85})
 );
 curb.position.set(x+(x<0?1.46:-1.46),.09,0);
 curb.castShadow=true;
 curb.receiveShadow=true;
 scene.add(curb);
 baseSceneStaticObjects.push(curb);
});

const grassTexture=makeNoiseTexture('#52713e',38,256);
grassTexture.repeat.set(2,Math.max(27,BASE_SCENE_LENGTH));
[-7.45,7.45].forEach(x=>{
 const grass=new THREE.Mesh(
  new THREE.PlaneGeometry(1.05,BASE_SCENE_LENGTH),
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

const OBJECT_TYPES=new Set(['object_wall','object_door','object_column','object_eave','object_asphalt','object_road','object_car','object_motorcycle','object_person','object_custom']);
function isSceneObject(itemOrType){return OBJECT_TYPES.has(typeof itemOrType==='string'?itemOrType:itemOrType?.type)}

const DRIVABLE_VEHICLE_TYPES=new Set(['object_car','object_motorcycle']);
const DRIVE_SENSOR_TYPES=new Set(['loop','infrared']);
function isDrivableVehicle(itemOrType){return DRIVABLE_VEHICLE_TYPES.has(typeof itemOrType==='string'?itemOrType:itemOrType?.type)}
function ensureVehicleDriveParams(item){
 const p=item?.params||{};
 if(p.driveEnabled==null)p.driveEnabled=true;
 if(!Number.isFinite(Number(p.driveSpeed)))p.driveSpeed=item?.type==='object_motorcycle'?2.5:3;
 if(!Number.isFinite(Number(p.steerRate)))p.steerRate=item?.type==='object_motorcycle'?70:55;
 if(p.moving==null)p.moving=false;
 if(![1,-1].includes(Number(p.driveDirection)))p.driveDirection=1;
 if(![-1,0,1].includes(Number(p.steerInput)))p.steerInput=0;
 return p;
}
function vehicleControl(item,command){
 if(!isDrivableVehicle(item))return false;
 const p=ensureVehicleDriveParams(item);
 if(command==='forward'){p.moving=true;p.driveDirection=1;}
 if(command==='reverse'){p.moving=true;p.driveDirection=-1;}
 if(command==='stop'){p.moving=false;p.steerInput=0;}
 if(command==='left')p.steerInput=1;
 if(command==='right')p.steerInput=-1;
 if(command==='straight')p.steerInput=0;
 markDirty();
 if(item.id===state.selectedId){renderQuick(item);renderInspector();}
 return true;
}
function localXZ(target,x,z){
 const rot=THREE.MathUtils.degToRad(Number(target?.params?.rotation??target?.rotationY??0)||0);
 const dx=x-Number(target?.x||0),dz=z-Number(target?.z||0);
 const c=Math.cos(-rot),s=Math.sin(-rot);
 return {x:dx*c-dz*s,z:dx*s+dz*c};
}
function vehicleIntersectsLoop(vehicle,loop){
 const lp=localXZ(loop,vehicle.x,vehicle.z);
 const vd=itemPhysicsDimensions(vehicle),p=loop.params||{};
 const w=Math.max(.1,Number(p.width)||1.8),l=Math.max(.1,Number(p.length)||3);
 return Math.abs(lp.x)<=w/2+vd.width*.35 && Math.abs(lp.z)<=l/2+vd.depth*.35;
}
function vehicleBlocksInfrared(vehicle,ir){
 const lp=localXZ(ir,vehicle.x,vehicle.z);
 const vd=itemPhysicsDimensions(vehicle),distance=Math.max(.1,Number(ir.params?.distance)||4);
 return Math.abs(lp.x)<=distance/2+vd.width*.35 && Math.abs(lp.z)<=Math.max(.18,vd.depth*.28);
}
let __vehicleSensorLastAt=0;
function updateVehicleSensors(now){
 if(now-__vehicleSensorLastAt<70)return;
 __vehicleSensorLastAt=now;
 const vehicles=state.items.filter(isDrivableVehicle);
 if(!vehicles.length)return;
 for(const sensor of state.items){
  if(sensor.type==='loop'){
   const active=vehicles.some(v=>vehicleIntersectsLoop(v,sensor));
   if(active!==Boolean(sensor.params.detected))input(sensor,active?'vehicle':'clear');
  }else if(sensor.type==='infrared'){
   const active=vehicles.some(v=>vehicleBlocksInfrared(v,sensor));
   if(active!==Boolean(sensor.params.blocked))input(sensor,active?'blocked':'clear');
  }
 }
}
let __driveLastTick=0;
function updateDrivableVehicles(now){
 const dt=Math.min(.08,Math.max(0,(now-(__driveLastTick||now))/1000));
 __driveLastTick=now;
 if(dt<=0)return;
 let moved=false;
 for(const item of state.items){
  if(!isDrivableVehicle(item))continue;
  const p=ensureVehicleDriveParams(item);
  if(p.driveEnabled===false||!p.moving)continue;
  const speed=Math.max(.1,Math.min(30,Number(p.driveSpeed)||3));
  const direction=Number(p.driveDirection)===-1?-1:1;
  const steer=Number(p.steerInput)||0;
  let heading=((Number(p.rotation)||0)%360+360)%360;
  if(steer)heading=((heading+steer*Math.max(5,Math.min(180,Number(p.steerRate)||55))*dt*direction)%360+360)%360;
  const rad=THREE.MathUtils.degToRad(heading);
  // Vehicle visual front points toward local -Z.  Keep driving math aligned
  // with the visible nose so 前進/後退 are not reversed.
  const nx=Number(item.x||0)-Math.sin(rad)*speed*dt*direction;
  const nz=Number(item.z||0)-Math.cos(rad)*speed*dt*direction;
  const before=readWorldTransform(item);
  const next=normalizeWorldTransform({...before,x:nx,z:nz,rotationY:heading});
  const physics=constrainWorldTransform(item,before,next,{source:'vehicle-drive'});
  if(!physics.ok){p.moving=false;p.steerInput=0;continue;}
  const t=physics.transform;
  item.x=t.x;item.y=t.y;item.z=t.z;item.rotationY=t.rotationY;item.worldTransform={...t};p.rotation=t.rotationY;
  if(item.mesh){item.mesh.position.set(t.x,t.y,t.z);item.mesh.rotation.y=THREE.MathUtils.degToRad(t.rotationY);item.mesh.updateMatrixWorld?.(true);}
  if(p.__vehicleBoundaryHit){
   p.moving=false;
   p.__vehicleBoundaryHit=false;
   const status=$('statusText');if(status)status.textContent=`${item.name||defs[item.type]?.name||'車輛'}：已到場景邊界`;
  }
  moved=true;
 }
 if(moved){renderPlan();markDirty();}
 updateVehicleSensors(now);
}
function isDriveKeyTarget(target){
 const tag=String(target?.tagName||'').toLowerCase();
 return tag==='input'||tag==='textarea'||tag==='select'||target?.isContentEditable;
}
const __vehicleDriveKeys=new Set();
let __activeDriveVehicleId='';
function drivableVehicles(){
 return state.items.filter(item=>isDrivableVehicle(item)&&ensureVehicleDriveParams(item).driveEnabled!==false);
}
function activeDriveVehicle(){
 const vehicles=drivableVehicles();
 if(!vehicles.length){__activeDriveVehicleId='';return null;}
 // 點選車輛時可順便改成目前駕駛目標，但平常不需要先點選。
 const selected=vehicles.find(item=>item.id===state.selectedId);
 if(selected)__activeDriveVehicleId=selected.id;
 let active=vehicles.find(item=>item.id===__activeDriveVehicleId);
 if(!active){active=vehicles[0];__activeDriveVehicleId=active.id;}
 return active;
}
function announceDriveVehicle(item,prefix='目前駕駛'){
 if(!item)return;
 const status=$('statusText');
 if(status)status.textContent=`${prefix}：${item.name||defs[item.type]?.name||'車輛'}｜方向鍵直接操控`;
}
function cycleDriveVehicle(){
 const vehicles=drivableVehicles();
 if(!vehicles.length)return null;
 const currentIndex=Math.max(-1,vehicles.findIndex(item=>item.id===__activeDriveVehicleId));
 const next=vehicles[(currentIndex+1)%vehicles.length];
 // 切車前先停止前一台，避免上一台仍保持行駛狀態。
 for(const item of vehicles){if(item.id!==next.id){const p=ensureVehicleDriveParams(item);p.moving=false;p.steerInput=0;}}
 __activeDriveVehicleId=next.id;
 announceDriveVehicle(next,'已切換駕駛');
 return next;
}
window.UTOP_VEHICLE_DRIVE=Object.assign(window.UTOP_VEHICLE_DRIVE||{}, {
 getActive:()=>activeDriveVehicle(),
 setActive:id=>{if(drivableVehicles().some(item=>item.id===id)){__activeDriveVehicleId=id;announceDriveVehicle(activeDriveVehicle());return true;}return false;},
 next:()=>cycleDriveVehicle()
});
window.addEventListener('keydown',e=>{
 if(isDriveKeyTarget(e.target))return;
 const key=String(e.key||'').toLowerCase();
 // V：場景有多台汽車／機車時快速切換駕駛目標；不需要用滑鼠點車。
 if(key==='v'&&!e.ctrlKey&&!e.altKey&&!e.metaKey){if(drivableVehicles().length){cycleDriveVehicle();e.preventDefault();}return;}
 const item=activeDriveVehicle();
 if(!item)return;
 if(['w','arrowup'].includes(key)){vehicleControl(item,'forward');__vehicleDriveKeys.add('forward');e.preventDefault();}
 if(['s','arrowdown'].includes(key)){vehicleControl(item,'reverse');__vehicleDriveKeys.add('reverse');e.preventDefault();}
 if(['a','arrowleft'].includes(key)){vehicleControl(item,'left');__vehicleDriveKeys.add('left');e.preventDefault();}
 if(['d','arrowright'].includes(key)){vehicleControl(item,'right');__vehicleDriveKeys.add('right');e.preventDefault();}
 if(key===' '){vehicleControl(item,'stop');e.preventDefault();}
});
window.addEventListener('keyup',e=>{
 const item=activeDriveVehicle();
 if(!item)return;
 const key=String(e.key||'').toLowerCase();
 // 前進／後退按住才行駛；不論是否選取車輛，放開方向鍵立即停車。
 if(['w','arrowup','s','arrowdown'].includes(key)){
  __vehicleDriveKeys.delete('forward');
  __vehicleDriveKeys.delete('reverse');
  vehicleControl(item,'stop');
  e.preventDefault();
  return;
 }
 if(['a','arrowleft','d','arrowright'].includes(key)){
  __vehicleDriveKeys.delete('left');
  __vehicleDriveKeys.delete('right');
  vehicleControl(item,'straight');
 }
});

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

   // V5.1.0.1.1.1：柵欄機只增加垂直高度30%。
   g.scale.y=1.30;
   g.userData.realDimensions={height:1.339,width:.34,depth:.28};
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
   g.userData.realDimensions={height:2.35,width:.38,depth:.32};
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
   g.userData.realDimensions={height:.42,width:.32,depth:.16};
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
   g.userData.realDimensions={height:.06,width:2.5,depth:1.5};
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
   g.userData.realDimensions={height:1.05,width:.16,depth:.16};
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
   g.userData.realDimensions={height:.48,width:.32,depth:.16};
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
   g.userData.realDimensions={height:.32,width:.16,depth:.11};
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
   g.userData.realDimensions={height:.38,width:.42,depth:.28};


 }else if(item.type==='directionrecognizer'){
   // LK-121 direction recognizer: compact industrial controller enclosure.
   const bodyMat=new THREE.MeshPhysicalMaterial({color:0xd9ddda,roughness:.32,metalness:.18,clearcoat:.45,clearcoatRoughness:.22});
   const dark=mat(0x20282c,{roughness:.35,metalness:.25});
   const body=new THREE.Mesh(new THREE.BoxGeometry(.183,.108,.038),bodyMat);
   body.position.y=.054;g.add(body);
   const face=new THREE.Mesh(new THREE.BoxGeometry(.15,.078,.006),dark);
   face.position.set(0,.057,.022);g.add(face);
   const labelMat=new THREE.MeshBasicMaterial({map:makeTextTexture('LK-121')});
   const label=new THREE.Mesh(new THREE.PlaneGeometry(.09,.026),labelMat);
   label.position.set(0,.066,.026);g.add(label);
   const dirColor=p.lastDirection==='FORWARD'?0x35e87a:p.lastDirection==='REVERSE'?0x45b9ff:0x47555b;
   const led1=new THREE.Mesh(new THREE.SphereGeometry(.007,12,8),new THREE.MeshBasicMaterial({color:dirColor}));
   led1.position.set(-.048,.035,.026);g.add(led1);
   const led2=new THREE.Mesh(new THREE.SphereGeometry(.007,12,8),new THREE.MeshBasicMaterial({color:p.relayActive?0xffb72b:0x4b3a1c}));
   led2.position.set(.048,.035,.026);g.add(led2);
   g.userData.realDimensions={height:.108,width:.183,depth:.038};
 }else if(item.type==='loopdetector'){
   const box=new THREE.Mesh(new THREE.BoxGeometry(.72,.9,.42),mat(0xbfc5c3,{roughness:.42,metalness:.42}));box.position.y=.46;g.add(box);
   const face=new THREE.Mesh(new THREE.BoxGeometry(.55,.55,.025),mat(0x151b1e));face.position.set(0,.5,.224);g.add(face);
   const led=new THREE.Mesh(new THREE.SphereGeometry(.035,12,8),new THREE.MeshBasicMaterial({color:p.fault?0xff3333:p.vehicle?0x38ef76:0x31503d}));led.position.set(.18,.65,.245);g.add(led);
   g.userData.realDimensions={height:.42,width:.32,depth:.22};
 }else if(item.type==='radar'){
   const body=new THREE.Mesh(new THREE.BoxGeometry(.62,.72,.22),new THREE.MeshPhysicalMaterial({color:0xdfe3df,roughness:.3,clearcoat:.5}));body.position.y=.75;g.add(body);
   const face=new THREE.Mesh(new THREE.BoxGeometry(.48,.54,.025),mat(0x18242a));face.position.set(0,.75,.123);g.add(face);
   [0.1,.18,.26].forEach(r=>{const a=new THREE.Mesh(new THREE.TorusGeometry(r,.01,7,24,Math.PI),new THREE.MeshBasicMaterial({color:p.vehicle?0x44dcff:0x49616b}));a.rotation.z=-Math.PI/2;a.position.set(-.04,.75,.14);g.add(a)});
   g.userData.realDimensions={height:.55,width:.28,depth:.22};
 }else if(item.type==='estop'){
   const base=new THREE.Mesh(new THREE.CylinderGeometry(.25,.28,.16,28),mat(0xe0b31c));base.position.y=.08;g.add(base);
   const head=new THREE.Mesh(new THREE.CylinderGeometry(.19,.23,.3,28),mat(p.pressed?0x8c0000:0xdc1111,{roughness:.28}));head.position.y=p.pressed?.22:.32;g.add(head);
 }else if(item.type==='laneindicator'){
   if(p.showStand!==false){const stand=new THREE.Mesh(new THREE.BoxGeometry(.1,1.2,.1),mat(0x687277,{metalness:.7}));stand.position.y=.6;g.add(stand)}
   const box=new THREE.Mesh(new THREE.BoxGeometry(1.3,.72,.18),mat(0x111516));box.position.y=1.55;g.add(box);
   const symbol=p.mode==='left'?'←':p.mode==='right'?'→':p.mode==='stop'?'✕':p.mode==='off'?'':'↑';
   const plane=new THREE.Mesh(new THREE.PlaneGeometry(1.1,.55),new THREE.MeshBasicMaterial({map:makeTextTexture(symbol),transparent:true}));plane.position.set(0,1.55,.1);g.add(plane);
   g.userData.realDimensions={height:.62,width:.52,depth:.14};
 }else if(item.type==='parkingdisplay'){
   if(p.showStand!==false){const stand=new THREE.Mesh(new THREE.BoxGeometry(.12,1.1,.12),mat(0x687277,{metalness:.7}));stand.position.y=.55;g.add(stand)}
   const box=new THREE.Mesh(new THREE.BoxGeometry(1.55,.7,.18),mat(0x111516));box.position.y=1.5;g.add(box);
   const txt=p.available<=0?'FULL':`P ${p.available}`;
   const plane=new THREE.Mesh(new THREE.PlaneGeometry(1.35,.52),new THREE.MeshBasicMaterial({map:makeTextTexture(txt)}));plane.position.set(0,1.5,.1);g.add(plane);
   g.userData.realDimensions={height:.85,width:.95,depth:.16};
 }else if(item.type==='heightbar'){
   const h=Math.max(1,Number(p.heightLimit)||2.1),w=Math.max(2,Number(p.width)||4);
   [-w/2,w/2].forEach(x=>{const post=new THREE.Mesh(new THREE.BoxGeometry(.16,h,.16),mat(0xd7a513));post.position.set(x,h/2,0);g.add(post)});
   const beam=new THREE.Mesh(new THREE.BoxGeometry(w+.3,.24,.22),mat(p.overheight?0xe52b22:0xd7a513));beam.position.y=h;g.add(beam);

 }else if(item.type==='shutter'){
   // 鐵捲門依使用者設定的實體尺寸重新建模，確保2D／3D／存檔一致。
   const requested=normalizeRealDimensions(p.realDimensions||{})||{width:3.2,height:2.6,depth:.18};
   const totalWidth=Math.max(1.2,requested.width);
   const totalHeight=Math.max(1.2,requested.height);
   const totalDepth=Math.max(.08,requested.depth);
   const postWidth=Math.min(.28,Math.max(.10,totalWidth*.055));
   const topHeight=Math.min(.38,Math.max(.18,totalHeight*.10));
   const frameDepth=Math.max(.10,totalDepth);
   const openingWidth=Math.max(.65,totalWidth-postWidth*2);
   const openingHeight=Math.max(.65,totalHeight-topHeight);
   const slatHeight=Math.min(.16,Math.max(.065,openingHeight/22));
   const slatDepth=Math.max(.035,totalDepth*.46);
   const frame=mat(0x646d71,{roughness:.42,metalness:.68});
   const slat=mat(0x8e9699,{roughness:.4,metalness:.72});
   [-(totalWidth-postWidth)/2,(totalWidth-postWidth)/2].forEach(x=>{
    const post=new THREE.Mesh(new THREE.BoxGeometry(postWidth,totalHeight,frameDepth),frame);
    post.position.set(x,totalHeight/2,0);g.add(post);
   });
   const top=new THREE.Mesh(new THREE.BoxGeometry(totalWidth,topHeight,Math.max(frameDepth,totalDepth*1.25)),frame);
   top.position.y=totalHeight-topHeight/2;g.add(top);
   const progress=Math.max(0,Math.min(1,Number(p.doorProgress)||0));
   const visibleDoorHeight=Math.max(slatHeight,(1-progress)*openingHeight);
   const topInsideY=totalHeight-topHeight;
   for(let offset=slatHeight/2;offset<=visibleDoorHeight;offset+=slatHeight){
    const strip=new THREE.Mesh(
     new THREE.BoxGeometry(openingWidth,Math.max(.035,slatHeight*.78),slatDepth),
     slat
    );
    strip.position.set(0,topInsideY-offset,0);g.add(strip);
   }
   g.userData.realDimensions={height:totalHeight,width:totalWidth,depth:totalDepth};
 }else if(item.type==='beacon'){
   const base=new THREE.Mesh(new THREE.CylinderGeometry(.22,.26,.14,24),mat(0x171b1d));
   base.position.y=.07;g.add(base);
   const lens=new THREE.Mesh(new THREE.CylinderGeometry(.18,.2,.42,28),new THREE.MeshPhysicalMaterial({color:p.on?0xff2525:0x671414,transparent:true,opacity:.72,roughness:.18,clearcoat:.8,emissive:p.on?0xff1515:0x190404,emissiveIntensity:p.on?2.5:.08}));
   lens.position.y=.34;g.add(lens);
   const cap=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.05,28),mat(0x33383a));
   cap.position.y=.575;g.add(cap);
   g.userData.realDimensions={height:.34,width:.18,depth:.18};
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
   g.userData.realDimensions={height:.38,width:.42,depth:.26};
 }else if(item.type==='controller'){
   const box=new THREE.Mesh(new THREE.BoxGeometry(1.25,.95,.35),mat(0xc2c7c5,{roughness:.38,metalness:.45}));
   box.position.y=.5;g.add(box);
   for(let n=0;n<8;n++){
    const terminal=new THREE.Mesh(new THREE.BoxGeometry(.09,.09,.05),mat(n%2?0x33383b:0x54bd73));
    terminal.position.set(-.48+n*.14,.73,.2);g.add(terminal);
   }
   const rail=new THREE.Mesh(new THREE.BoxGeometry(1.1,.12,.06),mat(0x2c3134));
   rail.position.set(0,.22,.2);g.add(rail);
   g.userData.realDimensions={height:.42,width:.34,depth:.18};
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
   const label=isSignal
    ?String(Math.max(0,Math.ceil(Number(p.remaining ?? p.intervalSeconds ?? 0)))).padStart(2,'0')
    :String(Math.max(0,Math.ceil(Number(p.remaining ?? p.delaySeconds ?? 0)))).padStart(2,'0');
   const screen=new THREE.Mesh(new THREE.PlaneGeometry(w*.68,h*.24),new THREE.MeshBasicMaterial({map:makeTextTexture(label),transparent:true}));screen.position.set(0,h*.65,d/2+.032);g.add(screen);
   const ledColors=isSignal?[(p.mode==='LANE_A'||p.mode==='ALL_GREEN')?0x31df6c:0x8d2424,(p.mode==='LANE_B'||p.mode==='ALL_GREEN')?0x31df6c:0x8d2424,(item.type==='signal3way'&&(p.mode==='LANE_C'||p.mode==='ALL_GREEN'))?0x31df6c:0x8d2424]:[p.state==='DONE'||p.output?0x31df6c:p.state==='TIMING'?0xf2b12f:0x52636c];
   ledColors.forEach((color,n)=>{const led=new THREE.Mesh(new THREE.SphereGeometry(.045,12,8),new THREE.MeshBasicMaterial({color}));led.position.set((n-(ledColors.length-1)/2)*.22,h*.32,d/2+.04);g.add(led)});
 }else if(OBJECT_TYPES.has(item.type)){
   const dim=p.realDimensions||{};
   const w=Math.max(.05,Number(dim.width)||1),h=Math.max(.03,Number(dim.height)||1),d=Math.max(.05,Number(dim.depth)||1);
   const kind=p.objectKind||'custom';
   if(kind==='column'){
     const column=new THREE.Mesh(new THREE.CylinderGeometry(w/2,w/2,h,24),mat(0x9d9d98,{roughness:.72,metalness:.03}));
     column.position.y=h/2;g.add(column);
   }else if(kind==='car'){
     // More realistic compact sedan.  The vehicle nose is local -Z.
     const paint=mat(0x2f62a8,{roughness:.24,metalness:.62});
     const paintDark=mat(0x23476f,{roughness:.30,metalness:.58});
     const trim=mat(0x121518,{roughness:.55,metalness:.42});
     const tire=mat(0x101214,{roughness:.92,metalness:.02});
     const rim=mat(0xb9c1c7,{roughness:.24,metalness:.86});
     const glass=new THREE.MeshPhysicalMaterial({color:0x567f99,roughness:.08,metalness:.05,transparent:true,opacity:.62,transmission:.18,clearcoat:.65,clearcoatRoughness:.08});
     const lampWhite=new THREE.MeshBasicMaterial({color:0xf7f4cf});
     const lampRed=new THREE.MeshBasicMaterial({color:0xe52c2c});

     const lower=new THREE.Mesh(new THREE.BoxGeometry(w*.96,h*.32,d*.88),paint);
     lower.position.y=h*.29; lower.castShadow=true; g.add(lower);
     const hood=new THREE.Mesh(new THREE.BoxGeometry(w*.86,h*.13,d*.23),paint);
     hood.position.set(0,h*.48,-d*.335); hood.castShadow=true; g.add(hood);
     const trunk=new THREE.Mesh(new THREE.BoxGeometry(w*.84,h*.14,d*.20),paintDark);
     trunk.position.set(0,h*.48,d*.35); trunk.castShadow=true; g.add(trunk);
     const cabinBase=new THREE.Mesh(new THREE.BoxGeometry(w*.76,h*.36,d*.43),paintDark);
     cabinBase.position.set(0,h*.66,d*.015); cabinBase.castShadow=true; g.add(cabinBase);
     const roof=new THREE.Mesh(new THREE.BoxGeometry(w*.66,h*.09,d*.31),paint);
     roof.position.set(0,h*.88,d*.015); g.add(roof);

     // Windshields and side glass make front/rear orientation obvious.
     const windshield=new THREE.Mesh(new THREE.BoxGeometry(w*.62,h*.25,.025),glass);
     windshield.rotation.x=-0.18; windshield.position.set(0,h*.72,-d*.205); g.add(windshield);
     const rearGlass=new THREE.Mesh(new THREE.BoxGeometry(w*.60,h*.23,.025),glass);
     rearGlass.rotation.x=0.16; rearGlass.position.set(0,h*.71,d*.225); g.add(rearGlass);
     for(const sx of [-1,1]){
       const sideGlass=new THREE.Mesh(new THREE.BoxGeometry(.022,h*.23,d*.31),glass);
       sideGlass.position.set(sx*w*.385,h*.72,d*.01); g.add(sideGlass);
       const mirror=new THREE.Mesh(new THREE.BoxGeometry(w*.08,h*.06,d*.07),trim);
       mirror.position.set(sx*w*.51,h*.66,-d*.12); g.add(mirror);
     }

     // Wheels with visible rims.
     for(const sx of [-.49,.49]) for(const sz of [-.29,.29]){
       const wheel=new THREE.Mesh(new THREE.CylinderGeometry(h*.145,h*.145,w*.11,28),tire);
       wheel.rotation.z=Math.PI/2; wheel.position.set(sx*w,h*.19,sz*d); wheel.castShadow=true; g.add(wheel);
       const hub=new THREE.Mesh(new THREE.CylinderGeometry(h*.075,h*.075,w*.115,20),rim);
       hub.rotation.z=Math.PI/2; hub.position.copy(wheel.position); g.add(hub);
     }

     // FRONT (-Z): bumper, grille, headlights and plate.
     const frontBumper=new THREE.Mesh(new THREE.BoxGeometry(w*.90,h*.09,d*.045),trim);
     frontBumper.position.set(0,h*.25,-d*.465); g.add(frontBumper);
     const grille=new THREE.Mesh(new THREE.BoxGeometry(w*.38,h*.105,.025),trim);
     grille.position.set(0,h*.34,-d*.468); g.add(grille);
     for(const sx of [-.31,.31]){
       const headlight=new THREE.Mesh(new THREE.BoxGeometry(w*.20,h*.105,.028),lampWhite);
       headlight.position.set(sx*w,h*.39,-d*.47); g.add(headlight);
     }
     const frontPlate=new THREE.Mesh(new THREE.BoxGeometry(w*.28,h*.075,.02),mat(0xe8e8e3,{roughness:.48,metalness:.05}));
     frontPlate.position.set(0,h*.23,-d*.49); g.add(frontPlate);

     // REAR (+Z): red lamps and rear bumper.
     const rearBumper=new THREE.Mesh(new THREE.BoxGeometry(w*.90,h*.09,d*.045),trim);
     rearBumper.position.set(0,h*.25,d*.465); g.add(rearBumper);
     for(const sx of [-.32,.32]){
       const tail=new THREE.Mesh(new THREE.BoxGeometry(w*.18,h*.10,.028),lampRed);
       tail.position.set(sx*w,h*.39,d*.47); g.add(tail);
     }
   }else if(kind==='motorcycle'){
     // Street motorcycle, front = local -Z.
     const tire=mat(0x111315,{roughness:.94,metalness:.01});
     const metal=mat(0x9ca7ae,{roughness:.22,metalness:.86});
     const frameMat=mat(0xb51f2c,{roughness:.28,metalness:.58});
     const dark=mat(0x171a1d,{roughness:.72,metalness:.18});
     const seatMat=mat(0x222326,{roughness:.88,metalness:.02});
     const frontZ=-d*.35,rearZ=d*.34,wheelR=h*.235;

     for(const z of [frontZ,rearZ]){
       const wheel=new THREE.Mesh(new THREE.TorusGeometry(wheelR,.055,12,30),tire);
       wheel.rotation.y=Math.PI/2; wheel.position.set(0,wheelR,z); wheel.castShadow=true; g.add(wheel);
       const hub=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,w*.18,18),metal);
       hub.rotation.z=Math.PI/2; hub.position.set(0,wheelR,z); g.add(hub);
     }

     const engine=new THREE.Mesh(new THREE.BoxGeometry(w*.34,h*.30,d*.20),metal);
     engine.position.set(0,h*.39,d*.04); g.add(engine);
     const tank=new THREE.Mesh(new THREE.SphereGeometry(w*.25,22,14),frameMat);
     tank.scale.set(1,.70,1.35); tank.position.set(0,h*.66,-d*.06); g.add(tank);
     const seat=new THREE.Mesh(new THREE.BoxGeometry(w*.36,h*.11,d*.34),seatMat);
     seat.position.set(0,h*.70,d*.20); seat.rotation.x=-.04; g.add(seat);

     // Rear swing arm and front fork.
     const swing=new THREE.Mesh(new THREE.BoxGeometry(w*.10,h*.08,d*.37),metal);
     swing.position.set(0,h*.30,d*.19); swing.rotation.x=-.08; g.add(swing);
     for(const sx of [-.11,.11]){
       const fork=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,h*.46,14),metal);
       fork.position.set(sx*w,h*.48,frontZ+d*.03); fork.rotation.x=-.20; g.add(fork);
     }

     const handlebar=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,w*.68,14),metal);
     handlebar.rotation.z=Math.PI/2; handlebar.position.set(0,h*.82,frontZ+d*.015); g.add(handlebar);
     const headlamp=new THREE.Mesh(new THREE.SphereGeometry(w*.12,18,12),new THREE.MeshBasicMaterial({color:0xfff3c4}));
     headlamp.scale.z=.58; headlamp.position.set(0,h*.70,frontZ-d*.055); g.add(headlamp);
     const tailLamp=new THREE.Mesh(new THREE.BoxGeometry(w*.20,h*.07,.035),new THREE.MeshBasicMaterial({color:0xe02727}));
     tailLamp.position.set(0,h*.62,rearZ+d*.07); g.add(tailLamp);
     const exhaust=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,d*.31,16),dark);
     exhaust.rotation.x=Math.PI/2; exhaust.position.set(w*.22,h*.36,d*.18); g.add(exhaust);
   }else if(kind==='person'){
     const body=new THREE.Mesh(new THREE.CylinderGeometry(w*.22,w*.28,h*.62,18),mat(0x4e77b8,{roughness:.7}));body.position.y=h*.43;g.add(body);
     const head=new THREE.Mesh(new THREE.SphereGeometry(w*.25,18,12),mat(0xe0b590,{roughness:.8}));head.position.y=h*.82;g.add(head);
   }else{
     const colors={wall:0xb7b1a8,door:0x76513a,eave:0x888b90,asphalt:0x303236,road:0x45474b,custom:0x8fa3b8};
     const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(colors[kind]||colors.custom,{roughness:(kind==='asphalt'||kind==='road')?0.95:0.68,metalness:.02}));
     body.position.y=h/2;g.add(body);
     if(kind==='road'){
       const stripe=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.06,w*.025),.012,d*.82),new THREE.MeshBasicMaterial({color:0xf0d64c}));stripe.position.set(0,h+.008,0);g.add(stripe);
     }
   }
   g.userData.realDimensions={width:w,height:h,depth:d};
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
   g.userData.realDimensions={height:.18,width:.22,depth:.10};
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
 const initialX=Number(saved.x??0);
 const initialZ=Number(saved.z??0);
 const hasSavedHeight=
  saved.y!==undefined ||
  saved.params?.installationHeight!==undefined;
 const initialGround=getGroundHeightAt(initialX,initialZ);
 const initialOffset=Number.isFinite(Number(saved.params?.groundOffset))
  ?Number(saved.params.groundOffset)
  :(hasSavedHeight?Number(savedHeight)-initialGround:0);
 const initialHeight=hasSceneHeightProvider()
  ?initialGround+initialOffset
  :savedHeight;

 const item={
   id:saved.id||`${type}_${state.next++}`,
   type,
   name:normalizeLegacyDeviceName(type,saved.name||d.name),
   x:initialX,
   y:normalizeHeight(initialHeight,getSceneHeightRange().min,getSceneHeightRange().max),
   z:initialZ,
   params:{
     ...clone(d.defaults),
     installationHeight:normalizeHeight(initialHeight,getSceneHeightRange().min,getSceneHeightRange().max),
     followGround:migratedParams.followGround??hasSceneHeightProvider(),
     groundHeight:initialGround,
     groundOffset:initialOffset,
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

 try{
  item.mesh=makeModel(item);
 }catch(modelError){
  console.error('[UTOP-3D] 設備模型建立失敗',item?.type,modelError);
  window.UTOP_DEBUG?.record?.(
    'ERROR',
    'Device',
    `設備模型建立失敗：${item?.type||'unknown'}`,
    {message:modelError?.message,stack:modelError?.stack}
  );
  const fallback=new THREE.Group();
  fallback.name='UTOP_MODEL_FALLBACK';
  const fallbackBody=new THREE.Mesh(
    new THREE.BoxGeometry(.6,.6,.6),
    new THREE.MeshStandardMaterial({color:0xcc3333,roughness:.7})
  );
  fallbackBody.position.y=.3;
  fallback.add(fallbackBody);
  item.mesh=fallback;
 }
 item.mesh.position.set(item.x,item.y,item.z);
 if(hasSceneHeightProvider()&&item.params.followGround!==false){
  syncItemToGround(item);
 }else{
  applyHeightToObject(item);
 }
 applyPartsVisibility(item);
 group.add(item.mesh);
 state.items.push(item);
 select(item.id);
 refreshNameLabels();
 ensureItemWorldTransform(item);
 markDirty();
 return item;
}

function captureStableTransform(item){
 if(!item)return null;

 if(item.mesh){
  try{
   commitItemMeshTransform(
    item,
    {
     source:'capture-before-rebuild',
     render:false
    }
   );
  }catch(_){}
 }

 const transform=ensureItemWorldTransform(item);

 return {
  x:Number(transform.x)||0,
  y:Number(transform.y)||0,
  z:Number(transform.z)||0,
  rotationY:Number(transform.rotationY)||0,
  scale:Number(transform.scale)||1
 };
}

function applyStableTransform(item,transform){
 if(!item||!transform)return false;

 item.worldTransform={
  x:Number(transform.x)||0,
  y:Number(transform.y)||0,
  z:Number(transform.z)||0,
  rotationY:Number(transform.rotationY)||0,
  scale:Number(transform.scale)||1
 };

 item.x=item.worldTransform.x;
 item.y=item.worldTransform.y;
 item.z=item.worldTransform.z;
 item.rotationY=item.worldTransform.rotationY;
 item.scale=item.worldTransform.scale;

 item.params=item.params||{};
 item.params.rotation=item.worldTransform.rotationY;

 if(item.mesh){
  item.mesh.position.set(
   item.worldTransform.x,
   item.worldTransform.y,
   item.worldTransform.z
  );
  item.mesh.rotation.y=THREE.MathUtils.degToRad(
   item.worldTransform.rotationY
  );
  item.mesh.scale.setScalar(item.worldTransform.scale);
  item.mesh.updateMatrixWorld?.(true);
 }

 return true;
}

function rebuild(i){
 if(!i)return;

 const stableTransform=captureStableTransform(i);

 if(i.mesh){
  group.remove(i.mesh);
 }

 i.mesh=makeModel(i);

 applyStableTransform(i,stableTransform);

 i.y=normalizeHeight(
  i.y??i.params?.installationHeight??0,
  getSceneHeightRange().min,
  getSceneHeightRange().max
 );

 i.worldTransform.y=i.y;
 clampDevicePosition(i,i.x,i.z);

 i.worldTransform.x=i.x;
 i.worldTransform.y=i.y;
 i.worldTransform.z=i.z;

 applyStableTransform(i,i.worldTransform);
 applyHeightToObject(i);
 applyPartsVisibility(i);
 group.add(i.mesh);
 refreshNameLabels();

 window.UTOP_DEBUG?.record?.(
  'ACTION',
  'Device',
  `模型重建完成且位置已保留：${i.name||i.type||i.id}`,
  {
   id:i.id,
   type:i.type,
   transform:{...i.worldTransform}
  }
 );
}
function select(id){
 try{
  commitSelectedMeshTransform({
   source:'before-select-change',
   render:false
  });
 }catch(_){}

 const previousId=state.selectedId;
 state.selectedId=id;

 updateSelectedPlanClass(previousId,id);
 refreshNameLabels();

 const item=get(id);

 if(item){
  renderInspector();
  renderQuick(item);

  window.dispatchEvent(
   new CustomEvent(
    'utop-primary-selection-changed',
    {
     detail:{
      id:item.id,
      name:item.name,
      type:item.type
     }
    }
   )
  );

  window.setTimeout(
   ()=>window.UTOP_QUICK_CONTROL?.refresh?.(),
   0
  );
 }else{
  renderInspector();
  renderQuick(null);
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
 let lastShown=Math.ceil(seconds);
 rebuildItemGeometryOnly(item,{reason:'timer-start'});
 const started=performance.now();
 const finish=()=>{
  cancelControlRuntime(item);p.remaining=0;
  if(kind==='off'){p.output=false;p.state='RELEASED';}
  else{p.output=true;p.state='DONE';}
  rebuildItemGeometryOnly(item,{reason:'timer-finish'});propagate(item);
  if(item.id===state.selectedId){renderQuick(item);renderInspector();}
 };
 item.runtime.controlTimer=setInterval(()=>{
  const elapsed=(performance.now()-started)/1000;
  p.remaining=Math.max(0,seconds-elapsed);
  const shown=Math.ceil(p.remaining);
  if(shown!==lastShown){lastShown=shown;rebuildItemGeometryOnly(item,{reason:'timer-tick'});}
  if(p.remaining<=0)return finish();
  if(item.id===state.selectedId){renderQuick(item);renderInspector();}
 },100);
}
function setSignalReady(item,{keepAuto=true}={}){
 cancelControlRuntime(item);
 const p=item.params;
 const seconds=Math.max(1,Math.min(999,Number(p.intervalSeconds)||10));
 if(keepAuto)p.auto=true;
 p.mode='ALL_GREEN';
 p.remaining=seconds;
 p.state='READY';
 rebuildItemGeometryOnly(item,{reason:'signal-ready'});
}
function startSignalCall(item,mode){
 cancelControlRuntime(item);
 const p=item.params;
 const seconds=Math.max(1,Math.min(999,Number(p.intervalSeconds)||10));
 p.auto=true;
 p.mode=mode;
 p.remaining=seconds;
 p.state='TIMING';
 let lastShown=Math.ceil(seconds);
 const started=performance.now();
 rebuildItemGeometryOnly(item,{reason:'signal-call-start'});
 item.runtime.signalTimer=setInterval(()=>{
  const elapsed=(performance.now()-started)/1000;
  p.remaining=Math.max(0,seconds-elapsed);
  const shown=Math.ceil(p.remaining);
  if(shown!==lastShown){
   lastShown=shown;
   rebuildItemGeometryOnly(item,{reason:'signal-call-tick'});
  }
  if(p.remaining<=0){
   cancelControlRuntime(item);
   p.mode='ALL_GREEN';
   p.remaining=seconds;
   p.state='READY';
   rebuildItemGeometryOnly(item,{reason:'signal-call-complete'});
   propagate(item);
   if(item.id===state.selectedId){renderQuick(item);renderInspector();}
   return;
  }
  if(item.id===state.selectedId){renderQuick(item);}
 },100);
}
function startSignalAuto(item){
 // V5.1.3.31：自動功能代表「自動待命」，不是無限循環切換。
 // DI1/DI2/DI3 到來時只執行該方向一次；時間結束即回全綠等待下一次觸發。
 setSignalReady(item,{keepAuto:true});
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
 if(i.type==='directionrecognizer')return{forwardOut:Boolean(p.forwardPulse),reverseOut:Boolean(p.reversePulse),relayOut:p.contact==='NC'?!Boolean(p.relayActive):Boolean(p.relayActive),ready:Boolean(p.ready)};
 if(i.type==='radar')return{vehicleOut:p.vehicle,personOut:p.person,approach:p.vehicle&&p.direction!=='DEPART',departure:p.direction==='DEPART',faultOut:p.fault};
 if(i.type==='estop')return{stopActive:p.pressed||p.wireFault,resetRequired:p.resetRequired,circuitFault:p.wireFault,ready:!p.pressed&&!p.wireFault&&!p.resetRequired};
 if(i.type==='laneindicator')return{leftOn:p.mode==='left',rightOn:p.mode==='right',straightOn:p.mode==='straight',stopOn:p.mode==='stop',flashing:p.flashing};
 if(i.type==='parkingdisplay')return{fullStatus:p.available<=0,availableStatus:p.available>0,countZero:p.available<=0,displayActive:!p.fault,faultOut:p.fault};
 if(i.type==='heightbar')return{overheightOut:p.overheight,warningLight:p.overheight,buzzer:p.overheight};
 if(i.type==='delaytimer')return{timing:p.state==='TIMING',timeUp:p.state==='DONE',relayOut:Boolean(p.output)};
 if(i.type==='poweroffdelay')return{relayOut:Boolean(p.output),timing:p.state==='TIMING',released:p.state==='RELEASED'};
 if(i.type==='powerondelay')return{timing:p.state==='TIMING',relayOut:Boolean(p.output),powerStatus:Boolean(p.power)};
 if(i.type==='signal2way')return{laneAGreen:p.mode==='LANE_A'||p.mode==='ALL_GREEN',laneARed:p.mode!=='LANE_A'&&p.mode!=='ALL_GREEN',laneBGreen:p.mode==='LANE_B'||p.mode==='ALL_GREEN',laneBRed:p.mode!=='LANE_B'&&p.mode!=='ALL_GREEN',autoActive:Boolean(p.auto)};
 if(i.type==='signal3way')return{laneAGreen:p.mode==='LANE_A'||p.mode==='ALL_GREEN',laneBGreen:p.mode==='LANE_B'||p.mode==='ALL_GREEN',laneCGreen:p.mode==='LANE_C'||p.mode==='ALL_GREEN',allRedStatus:p.mode==='ALL_RED',autoActive:Boolean(p.auto)};
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
 if(!i?.params?.autoCloseEnabled||i.params.state!=='OPEN'||i.params.safetyActive)return;

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


function scheduleBarrierSafetyClose(item){
 cancelBarrierAutoClose(item);
 const p=item?.params;
 if(!p?.safetyAutoCloseEnabled||p.safetyActive||p.state!=='OPEN')return;
 const seconds=Math.max(0,Math.min(999,Number(p.safetyAutoCloseSeconds)||0));
 item.runtime.autoCloseDueAt=Date.now()+seconds*1000;
 const status=$('statusText');
 if(status)status.textContent=`${item.name}：防砸解除，${seconds}秒後自動關閉`;
 item.runtime.autoCloseTimer=setTimeout(()=>{
  item.runtime.autoCloseTimer=null;
  item.runtime.autoCloseDueAt=0;
  if(state.items.includes(item)&&!p.safetyActive&&p.state==='OPEN'){
   motion(item,0,'CLOSING');
  }
 },seconds*1000);
}

function releaseBarrierSafety(item){
 if(!item?.params)return;
 const p=item.params;
 if(!p.safetyActive)return;
 p.safetyActive=false;
 if(p.state==='OPEN'){
  p.safetyClosePending=false;
  scheduleBarrierSafetyClose(item);
 }
 rebuild(item);renderPlan();
 if(item.id===state.selectedId){renderQuick(item);renderInspector();}
 propagate(item);markDirty();
 const status=$('statusText');
 if(status)status.textContent=`${item.name}：防砸輸入已解除`;
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
 if(!p?.autoCloseEnabled||p.state!=='OPEN'||p.safetyActive)return;
 const delay=Math.max(0,Number(p.closeDelaySeconds)||0)*1000;
 item.runtime.shutterAutoCloseTimer=setTimeout(()=>{
  if(!state.items.includes(item)||item.params.state!=='OPEN')return;
  input(item,'close');
 },delay);
}

function scheduleShutterSafetyClose(item){
 cancelShutterAutoClose(item);
 const p=item?.params;
 if(!p?.safetyAutoCloseEnabled||p.safetyActive||p.state!=='OPEN')return;
 const delay=Math.max(0,Math.min(999,Number(p.safetyCloseDelaySeconds)||0))*1000;
 item.runtime.shutterAutoCloseTimer=setTimeout(()=>{
  item.runtime.shutterAutoCloseTimer=null;
  if(state.items.includes(item)&&!p.safetyActive&&p.state==='OPEN')input(item,'close');
 },delay);
 const status=$('statusText');
 if(status)status.textContent=`${item.name}：防壓解除，${Math.round(delay/1000)}秒後自動關門`;
}

function releaseShutterSafety(item){
 if(!item?.params)return;
 const p=item.params;
 if(!p.safetyActive)return;
 p.safetyActive=false;
 if(p.state==='OPEN'){
  p.safetyClosePending=false;
  scheduleShutterSafetyClose(item);
 }
 refreshShutterInterface(item,'防壓／紅外線安全輸入已解除');
 propagate(item);markDirty();
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

  /*
   * 動畫中不重建控制面板。
   * 原本每一幀都執行renderQuick/renderInspector，
   * 會替換按鈕DOM，造成使用者下一次點擊失效。
   */
  if(item.id===state.selectedId){
   const status=$('statusText');
   if(status){
    status.textContent=
     `${item.name}：${stateName==='OPENING'?'開門':'關門'}中 `+
     `${Math.round(p.doorProgress*100)}%`;
   }
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

  if(p.state==='OPEN'&&!p.safetyActive){
   if(p.safetyClosePending){
    p.safetyClosePending=false;
    scheduleShutterSafetyClose(item);
   }else{
    scheduleShutterAutoClose(item);
   }
  }
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
 window.UTOP_DEBUG?.record?.(
  'ACTION',
  'Shutter',
  `鐵捲門控制：${item?.name||item?.type} → ${key}`,
  {
   id:item?.id,
   state:item?.params?.state,
   progress:item?.params?.doorProgress
  }
 );

 const p=item.params;

 if(
  ['open','close','stop','reset','safety','photoBeam'].includes(key)
 ){
  cancelShutterMotion(item);
 }

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
   cancelShutterAutoClose(item);
   refreshShutterInterface(item,'防壓／紅外線仍在觸發，禁止關門');
   return;
  }
  p.lastCommand='CLOSE';
  startShutterMotion(item,0,'CLOSING');
  refreshShutterInterface(item,'開始關門');
  return;
 }

 if(key==='safety'||key==='photoBeam'){
  if(p.safetyActive){
   releaseShutterSafety(item);
   return;
  }
  const wasClosing=p.state==='CLOSING';
  p.safetyActive=true;
  p.safetyClosePending=true;
  p.lastCommand='SAFETY';
  cancelShutterAutoClose(item);

  if(wasClosing){
   p.motionRemainingSeconds=0;
   p.state='SAFETY_REVERSING';
   refreshShutterInterface(item,'防壓觸發，立即停止關門並反向開啟');

   requestAnimationFrame(()=>{
    if(!state.items.includes(item))return;
    startShutterMotion(item,1,'OPENING');
    refreshShutterInterface(item,'防壓反向開門中；安全輸入解除後才會開始自動關門倒數');
   });
  }else{
   // 非關門途中觸發時，維持目前位置，不建立鎖定狀態。
   p.motionRemainingSeconds=0;
   p.state=p.doorProgress>=1?'OPEN':'STOPPED';
   refreshShutterInterface(item,'防壓測試已觸發；維持安全狀態直到輸入解除');
  }
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
  p.safetyClosePending=false;
  p.doorProgress=0;
  p.motionRemainingSeconds=0;
  p.lastCommand='RESET';
  p.state='CLOSED';
  refreshShutterInterface(item,'已復歸至全關位置');
 }
}

function resetDirectionRecognizerRuntime(item,{keepLast=true}={}){
 if(!item)return;
 item.runtime=item.runtime||{};
 if(item.runtime.directionWindowTimer){clearTimeout(item.runtime.directionWindowTimer);item.runtime.directionWindowTimer=null;}
 if(item.runtime.directionPulseTimer){clearTimeout(item.runtime.directionPulseTimer);item.runtime.directionPulseTimer=null;}
 const p=item.params;
 p.firstSensor='';p.pendingDirection='';p.forwardPulse=false;p.reversePulse=false;p.relayActive=false;p.state='READY';p.ready=true;
 if(!keepLast)p.lastDirection='NONE';
}
function emitDirectionRecognizer(item,direction){
 const p=item.params;
 const dir=direction==='FORWARD'?'FORWARD':'REVERSE';
 p.lastDirection=dir;p.state='DETECTED';p.ready=false;p.relayActive=true;
 p.forwardPulse=dir==='FORWARD';p.reversePulse=dir==='REVERSE';
 rebuildItemGeometryOnly(item,{reason:'direction-recognized'});propagate(item);
 if(item.runtime.directionPulseTimer)clearTimeout(item.runtime.directionPulseTimer);
 item.runtime.directionPulseTimer=setTimeout(()=>{
  if(!state.items.includes(item))return;
  p.forwardPulse=false;p.reversePulse=false;p.relayActive=false;p.state='READY';p.ready=true;
  rebuildItemGeometryOnly(item,{reason:'direction-pulse-complete'});propagate(item);
  if(item.id===state.selectedId){renderQuick(item);renderInspector();}
 },450);
}
function directionRecognizerSensor(item,sensor){
 const p=item.params;
 const now=performance.now();
 const windowSeconds=Math.max(1,Math.min(4,Number(p.detectSeconds)||2));
 if(!p.firstSensor){
  p.firstSensor=sensor;p.state='WAIT_SECOND';p.ready=false;p.firstSensorAt=now;
  if(item.runtime.directionWindowTimer)clearTimeout(item.runtime.directionWindowTimer);
  item.runtime.directionWindowTimer=setTimeout(()=>{
   if(!state.items.includes(item))return;
   p.firstSensor='';p.pendingDirection='';p.state='READY';p.ready=true;
   rebuildItemGeometryOnly(item,{reason:'direction-window-timeout'});
   if(item.id===state.selectedId){renderQuick(item);renderInspector();}
  },windowSeconds*1000);
  return;
 }
 if(p.firstSensor===sensor)return;
 const direction=(p.firstSensor==='A'&&sensor==='B')?'FORWARD':'REVERSE';
 p.firstSensor='';
 if(item.runtime.directionWindowTimer){clearTimeout(item.runtime.directionWindowTimer);item.runtime.directionWindowTimer=null;}
 if(String(p.triggerEdge||'FRONT').toUpperCase()==='REAR'){
  p.pendingDirection=direction;p.state='WAIT_REAR';p.ready=false;
 }else emitDirectionRecognizer(item,direction);
}
function input(i,key){
 if(!i||!state.items.includes(i)){
  console.warn('[UTOP-3D] 忽略失效的設備控制事件',key);
  return;
 }
 const p=i.params;
 // 狀態型輸入已經在目標狀態時直接忽略，避免相同 DO/DI 回授造成重建與再次傳播。
 if(i.type==='relay'&&((key==='on'&&p.on===true)||(key==='off'&&p.on===false)))return;
 if(i.type==='loop'&&((key==='vehicle'&&p.detected===true)||(key==='clear'&&p.detected===false)))return;
 if(i.type==='infrared'&&((key==='blocked'&&p.blocked===true)||(key==='clear'&&p.blocked===false)))return;
 if(i.type==='loopdetector'&&((key==='vehicle'&&p.vehicle===true)||(key==='clear'&&p.vehicle===false)))return;
 if(isDrivableVehicle(i)&&String(key||'').startsWith('drive')){
  const map={driveForward:'forward',driveReverse:'reverse',driveLeft:'left',driveRight:'right',driveStraight:'straight',driveStop:'stop'};
  vehicleControl(i,map[key]||'stop');renderAll();return;
 }
 const beforeOutputState=JSON.stringify(outputs(i));
 if(i.type==='barrier'){
    const barrierWorld=getBarrierWorldGeometry(i);
   if(key==='open'){
    cancelBarrierAutoClose(i);
    motion(i,90,'OPENING');
   }
   if(key==='close'){
    cancelBarrierAutoClose(i);
    if(p.safetyActive){
     const status=$('statusText');
     if(status)status.textContent=`${i.name}：防砸仍在觸發，禁止關閉`;
    }else{
     motion(i,0,'CLOSING');
    }
   }
   if(key==='stop'){
    cancelBarrierAutoClose(i);
    i.runtime.target=null;
    p.state='STOPPED';
   }
   if(key==='safety'){
    if(p.safetyActive){
     releaseBarrierSafety(i);
     return;
    }
    p.safetyActive=true;
    p.safetyClosePending=true;
    const isClosing=p.state==='CLOSING'||i.runtime.target===0;
    cancelBarrierAutoClose(i);
    if(isClosing){
     motion(i,90,'OPENING');
    }else if(p.state!=='OPEN'){
     motion(i,90,'OPENING');
    }
    const status=$('statusText');
    if(status)status.textContent=`${i.name}：DI4防砸保持觸發，開啟後等待安全輸入解除`;
   }
   if(key==='reset'){
    cancelBarrierAutoClose(i);
    i.runtime.target=null;
    i.runtime.lastTick=0;
    p.angle=0;
    p.safetyActive=false;
    p.safetyClosePending=false;
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
 }else if(i.type==='directionrecognizer'){
   if(key==='sensorA')directionRecognizerSensor(i,'A');
   if(key==='sensorB')directionRecognizerSensor(i,'B');
   if(key==='forwardTest'){p.firstSensor='A';directionRecognizerSensor(i,'B');}
   if(key==='reverseTest'){p.firstSensor='B';directionRecognizerSensor(i,'A');}
   if(key==='clear'){
    if(p.pendingDirection){const direction=p.pendingDirection;p.pendingDirection='';emitDirectionRecognizer(i,direction);}
    else resetDirectionRecognizerRuntime(i,{keepLast:true});
   }
   if(key==='reset')resetDirectionRecognizerRuntime(i,{keepLast:false});
   rebuildItemGeometryOnly(i,{reason:'direction-input'});
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
   if(key==='reset'){cancelControlRuntime(i);p.state='IDLE';p.output=false;p.remaining=Math.max(1,Number(p.delaySeconds)||5);}
   rebuild(i);
 }else if(i.type==='poweroffdelay'){
   if(key==='start'){p.power=false;startDelayRuntime(i,'off');}
   if(key==='stop'){cancelControlRuntime(i);p.state='STOPPED';}
   if(key==='reset'){cancelControlRuntime(i);p.power=true;p.output=true;p.state='ENERGIZED';p.remaining=Math.max(1,Number(p.delaySeconds)||5);}
   rebuild(i);
 }else if(i.type==='powerondelay'){
   if(key==='start'){p.power=true;p.output=false;startDelayRuntime(i,'on');}
   if(key==='stop'){cancelControlRuntime(i);p.state='STOPPED';}
   if(key==='reset'){cancelControlRuntime(i);p.power=false;p.output=false;p.state='IDLE';p.remaining=Math.max(1,Number(p.delaySeconds)||5);}
   rebuild(i);
 }else if(SIGNAL_HOST_TYPES.has(i.type)){
   if(key==='laneA'){
    if(p.auto!==false)startSignalCall(i,'LANE_A');
    else{cancelControlRuntime(i);p.mode='LANE_A';p.state='MANUAL';}
   }
   if(key==='laneB'){
    if(p.auto!==false)startSignalCall(i,'LANE_B');
    else{cancelControlRuntime(i);p.mode='LANE_B';p.state='MANUAL';}
   }
   if(key==='laneC'&&i.type==='signal3way'){
    if(p.auto!==false)startSignalCall(i,'LANE_C');
    else{cancelControlRuntime(i);p.mode='LANE_C';p.state='MANUAL';}
   }
   if(key==='allGreen')setSignalReady(i,{keepAuto:p.auto!==false});
   if(key==='auto')startSignalAuto(i);
   if(key==='reset')setSignalReady(i,{keepAuto:true});
   rebuildItemGeometryOnly(i,{reason:'signal-control'});
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
 renderAll();
 const afterOutputState=JSON.stringify(outputs(i));
 if(beforeOutputState!==afterOutputState)propagate(i);
 markDirty();
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
  if(i.params.state==='OPEN'&&!i.params.safetyActive){
   if(i.params.safetyClosePending){
    i.params.safetyClosePending=false;
    scheduleBarrierSafetyClose(i);
   }else scheduleBarrierAutoClose(i);
  }
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
const LEVEL_SOURCE_TYPES=new Set(['relay','loop','infrared']);

function releaseLevelInput(target,action){
 if(!target)return;
 if(target.type==='relay'&&action==='on')return input(target,'off');
 if(target.type==='loop'&&action==='vehicle')return input(target,'clear');
 if(target.type==='infrared'&&action==='blocked')return input(target,'clear');
 if(target.type==='loopdetector'&&action==='vehicle')return input(target,'clear');
 if(target.type==='barrier'&&action==='safety')return releaseBarrierSafety(target);
 if(target.type==='shutter'&&(action==='safety'||action==='photoBeam'))return releaseShutterSafety(target);
}

const PROPAGATION_MAX_OPS=2500;
const PROPAGATION_REPEAT_LIMIT=64;
const propagationQueue=[];
let propagationScheduled=false;

function reportPropagationError(message,details={}){
 const text=`連動保護：${message}`;
 console.error('[UTOP-3D]',text,details);
 window.UTOP_DEBUG?.record?.('ERROR','FunctionLink',text,details);
 const status=$('statusText');if(status)status.textContent=text;
 const toast=$('googleToast');if(toast){toast.textContent=text;toast.hidden=false;toast.className='google-toast error';clearTimeout(reportPropagationError.timer);reportPropagationError.timer=setTimeout(()=>toast.hidden=true,6500);}
 window.dispatchEvent(new CustomEvent('utop-link-error',{detail:{message,details}}));
}

function propagate(source){
 if(!source)return;
 propagationQueue.push(source);
 if(propagationScheduled)return;
 propagationScheduled=true;
 queueMicrotask(drainPropagationQueue);
}

function drainPropagationQueue(){
 propagationScheduled=false;
 let operations=0;
 const repeats=new Map();
 try{
  while(propagationQueue.length){
   const source=propagationQueue.shift();
   const out=outputs(source);
   const levelSource=LEVEL_SOURCE_TYPES.has(source?.type);
   for(const w of state.wires){
    if(w.sourceId!==source.id)continue;
    if(++operations>PROPAGATION_MAX_OPS){
     propagationQueue.length=0;
     reportPropagationError(`單次連動超過 ${PROPAGATION_MAX_OPS} 次，已停止，請檢查是否有迴圈接線。`,{sourceId:source.id,wireId:w.id});
     drawWires();return;
    }
    const signature=`${w.sourceId}:${w.sourcePort}>${w.targetId}:${w.targetPort}`;
    const repeated=(repeats.get(signature)||0)+1;repeats.set(signature,repeated);
    if(repeated>PROPAGATION_REPEAT_LIMIT){
     propagationQueue.length=0;
     reportPropagationError('偵測到重複回授連動，已中止以避免瀏覽器當機。',{signature,repeated});
     drawWires();return;
    }
    const active=Boolean(out[w.sourcePort]);
    const target=get(w.targetId);
    if(levelSource){
     const previous=state.wireLevels.get(w.id);
     state.wireLevels.set(w.id,active);
     if(active)state.activeWires.add(w.id);else state.activeWires.delete(w.id);
     if(target&&previous!==active){
      if(active)input(target,w.targetPort);else releaseLevelInput(target,w.targetPort);
     }
     continue;
    }
    if(!active||!target)continue;
    state.activeWires.add(w.id);
    input(target,w.targetPort);
    setTimeout(()=>{state.activeWires.delete(w.id);drawWires()},450);
   }
  }
 }catch(error){
  propagationQueue.length=0;
  reportPropagationError(error?.message||String(error),{stack:error?.stack||''});
 }
 drawWires();
}

window.addEventListener('error',event=>{
 if(event?.error)window.UTOP_DEBUG?.record?.('ERROR','Runtime','未捕捉程式錯誤',event.error.stack||event.error.message||String(event.error));
});
window.addEventListener('unhandledrejection',event=>{
 const reason=event?.reason;window.UTOP_DEBUG?.record?.('ERROR','Runtime','未處理非同步錯誤',reason?.stack||reason?.message||String(reason));
 const status=$('statusText');if(status)status.textContent=`程式錯誤：${reason?.message||String(reason)}`;
});

function markDirty(){ $('saveState').textContent='● 專案未儲存';$('saveState').style.color='#f4c542' }

document.querySelectorAll('[data-add]').forEach(button=>{
 button.onclick=()=>{
   try{
     const type=button.dataset.add;
     const count=state.items.length;
     add(type,{
       x:-2+(count%4)*1.3,
       z:-2+Math.floor(count/4)*1.4,
       params:{
        followGround:hasSceneHeightProvider(),
        groundOffset:0
       }
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


function clearPlanSceneGeometry(){
 const layer=$('planSceneGeometry');
 if(layer)layer.innerHTML='';
}

function ensurePlanSceneGeometryLayer(){
 const svg=$('planSvg');
 if(!svg)return null;

 let layer=$('planSceneGeometry');
 if(!layer){
  layer=document.createElementNS(
   'http://www.w3.org/2000/svg',
   'g'
  );
  layer.id='planSceneGeometry';

  const items=$('planItems');
  const parent=items?.parentNode||svg;
  if(items&&items.parentNode===parent){
   parent.insertBefore(layer,items);
  }else{
   parent.appendChild(layer);
  }
 }
 return layer;
}

function appendPlanSceneRect(layer,{
 x,z,width,depth,fill,stroke='none',rx=0,opacity=1
}){
 const center=worldToPlan(x,z);
 const ppm=getPlanPixelsPerMeter();

 const rect=document.createElementNS(
  'http://www.w3.org/2000/svg',
  'rect'
 );
 rect.setAttribute('x',String(center.x-width*ppm.x/2));
 rect.setAttribute('y',String(center.y-depth*ppm.z/2));
 rect.setAttribute('width',String(width*ppm.x));
 rect.setAttribute('height',String(depth*ppm.z));
 rect.setAttribute('fill',fill);
 rect.setAttribute('stroke',stroke);
 rect.setAttribute('rx',String(rx));
 rect.setAttribute('opacity',String(opacity));
 rect.setAttribute('pointer-events','none');
 layer.appendChild(rect);
 return rect;
}


function getSafeSceneWorldBounds(){
 try{
  if(typeof getSceneWorldBounds==='function'){
   const resolved=getSceneWorldBounds();
   if(
    resolved&&
    Number.isFinite(Number(resolved.minX))&&
    Number.isFinite(Number(resolved.maxX))&&
    Number.isFinite(Number(resolved.minZ))&&
    Number.isFinite(Number(resolved.maxZ))
   ){
    return {
     minX:Number(resolved.minX),
     maxX:Number(resolved.maxX),
     minZ:Number(resolved.minZ),
     maxZ:Number(resolved.maxZ),
     source:'getSceneWorldBounds'
    };
   }
  }

  const sceneHostBounds=
   window.UTOP_SCENE_HOST?.getSceneWorldBounds?.()||
   window.UTOP_SCENE_HOST?.getCurrentSceneBounds?.();

  if(
   sceneHostBounds&&
   Number.isFinite(Number(sceneHostBounds.minX))&&
   Number.isFinite(Number(sceneHostBounds.maxX))&&
   Number.isFinite(Number(sceneHostBounds.minZ))&&
   Number.isFinite(Number(sceneHostBounds.maxZ))
  ){
   return {
    minX:Number(sceneHostBounds.minX),
    maxX:Number(sceneHostBounds.maxX),
    minZ:Number(sceneHostBounds.minZ),
    maxZ:Number(sceneHostBounds.maxZ),
    source:'sceneHost'
   };
  }

  const sizeMode=
   window.UTOP_SCENE_HOST?.getSceneSizeMode?.()||
   state?.sceneSizeMode||
   'large';

  const isLarge=sizeMode!=='small';

  return {
   minX:isLarge?-18:-10,
   maxX:isLarge?18:10,
   minZ:isLarge?-30:-18,
   maxZ:isLarge?30:18,
   source:'safeFallback'
  };
 }catch(error){
  console.warn('[UTOP-3D] 取得場景邊界失敗，使用安全預設值',error);
  window.UTOP_DEBUG?.record?.(
   'WARNING',
   'Plan2D',
   '取得場景邊界失敗，已使用安全預設值',
   {
    message:error?.message,
    stack:error?.stack
   }
  );

  return {
   minX:-18,
   maxX:18,
   minZ:-30,
   maxZ:30,
   source:'errorFallback'
  };
 }
}


function renderPlanSceneGeometry(){
 const layer=ensurePlanSceneGeometryLayer();
 if(!layer)return;
 layer.innerHTML='';

 const scene=getWorldSceneModel();

 appendPlanSceneRect(layer,{
  x:scene.center.x,
  z:scene.center.z,
  width:scene.width,
  depth:scene.depth,
  fill:scene.isSnow?'#edf5f8':'#3f4c54',
  rx:3
 });

 appendPlanSceneRect(layer,{
  ...scene.road,
  fill:'#535a60',
  stroke:'#2f373c',
  rx:4
 });

 scene.sidewalks.forEach(sidewalk=>{
  appendPlanSceneRect(layer,{
   ...sidewalk,
   fill:'#d8d6cc',
   stroke:'#b9b7ad'
  });
 });

 scene.grass.forEach(grass=>{
  appendPlanSceneRect(layer,{
   ...grass,
   fill:scene.isSnow?'#e7f0f2':'#3c7f39'
  });
 });

 const ppm=getPlanPixelsPerMeter();
 const center=worldToPlanShared(
  scene.center.x,
  scene.center.z
 );

 const line=document.createElementNS(
  'http://www.w3.org/2000/svg',
  'line'
 );
 line.setAttribute('x1',String(center.x));
 line.setAttribute(
  'y1',
  String(center.y-scene.road.depth*.45*ppm.z)
 );
 line.setAttribute('x2',String(center.x));
 line.setAttribute(
  'y2',
  String(center.y+scene.road.depth*.45*ppm.z)
 );
 line.setAttribute('stroke','#f3d82a');
 line.setAttribute('stroke-width','2.2');
 line.setAttribute('stroke-dasharray','12 12');
 line.setAttribute('pointer-events','none');
 layer.appendChild(line);
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



const dimensionAuditState={
 warnedTypes:new Set(),
 fallbackItems:new Set()
};

function reportMissingRealDimensions(item,footprint){
 const type=String(item?.type||'unknown');
 const itemId=String(item?.id||type);

 dimensionAuditState.fallbackItems.add(itemId);

 if(dimensionAuditState.warnedTypes.has(type))return;
 dimensionAuditState.warnedTypes.add(type);

 const detail={
  type,
  name:item?.name||type,
  source:footprint?.source||'fallback',
  width:footprint?.width,
  depth:footprint?.depth
 };

 console.warn('[UTOP-3D] 模組缺少真實尺寸資料',detail);
 window.UTOP_DEBUG?.record?.(
  'WARNING',
  'Plan2D',
  `模組缺少真實尺寸：${type}`,
  detail
 );
}



function normalizeRealDimensions(input={}){
 const normalize=value=>{
  const number=Number(value);
  if(!Number.isFinite(number)||number<=0)return null;
  return Math.min(100,Math.max(.01,number));
 };
 const width=normalize(input.width);
 const depth=normalize(input.depth);
 const height=normalize(input.height);
 if(width===null||depth===null||height===null)return null;
 return {width,depth,height};
}

function getItemRealDimensions(item){
 if(!item)return null;

 const projectDimensions=normalizeRealDimensions(
  item.params?.realDimensions||{}
 );
 if(projectDimensions){
  return {
   ...projectDimensions,
   source:item.params?.dimensionSource||'project'
  };
 }

 const modelDimensions=normalizeRealDimensions(
  item.mesh?.userData?.realDimensions||{}
 );
 if(modelDimensions){
  return {
   ...modelDimensions,
   source:'model'
  };
 }

 const guessed=guessSafeDimensions(item);
 return {
  width:guessed.width,
  depth:guessed.depth,
  height:guessed.height,
  source:'guessed'
 };
}

function readPhysicalModelDimensions(item){
 if(!item?.mesh)return null;
 try{
  const box=new THREE.Box3();
  let hasPhysicalMesh=false;

  item.mesh.traverse?.(node=>{
   if(!node?.isMesh)return;
   const name=String(node.name||'').toLowerCase();
   const role=String(node.userData?.role||'').toLowerCase();
   if(
    name.includes('label')||
    name.includes('sprite')||
    name.includes('helper')||
    name.includes('outline')||
    role.includes('label')||
    role.includes('helper')||
    node.userData?.excludeFromPlanBounds===true
   )return;

   node.updateWorldMatrix?.(true,false);
   const nodeBox=new THREE.Box3().setFromObject(node);
   if(nodeBox.isEmpty())return;

   if(!hasPhysicalMesh){
    box.copy(nodeBox);
    hasPhysicalMesh=true;
   }else{
    box.union(nodeBox);
   }
  });

  if(!hasPhysicalMesh||box.isEmpty())return null;

  const size=new THREE.Vector3();
  box.getSize(size);
  return normalizeRealDimensions({
   width:size.x,
   depth:size.z,
   height:size.y
  });
 }catch(error){
  console.warn('[UTOP-3D] 讀取3D實體尺寸失敗',error);
  return null;
 }
}

function applyRealDimensionsToItem(item,dimensions,source='manual'){
 const normalized=normalizeRealDimensions(dimensions);
 if(!item||!normalized)return null;

 const before=getItemRealDimensions(item);

 item.params=item.params||{};
 item.params.realDimensions={...normalized};
 item.params.dimensionSource=source;

 if(item.type==='shutter'){
  // 鐵捲門必須重新建立幾何模型；只修改 realDimensions 不會改變既有 BoxGeometry。
  const rebuildResult=rebuildItemGeometryOnly(item,{
   reason:'shutter-real-dimensions-update',
   quick:false
  });

  // 將最後套用值寫回新模型，避免後續尺寸讀取又取得舊值。
  if(item.mesh){
   item.mesh.userData.realDimensions={...normalized};
   item.mesh.updateMatrixWorld?.(true);
  }

  if(!rebuildResult?.ok){
   console.warn('[UTOP-3D] 鐵捲門3D尺寸重建失敗',{
    id:item.id,
    dimensions:normalized,
    rebuildResult
   });
  }
 }else if(item.mesh){
  item.mesh.userData.realDimensions={...normalized};
 }

 renderPlan();
 if(item.id===state.selectedId){
  renderQuick(item);
 }

 // 通知其他視圖與診斷工具尺寸已更新，並在下一幀強制刷新矩陣。
 window.dispatchEvent(new CustomEvent('utop-device-dimensions-updated',{
  detail:{
   id:item.id,
   type:item.type,
   dimensions:{...normalized},
   source
  }
 }));
 requestAnimationFrame(()=>{
  item.mesh?.updateMatrixWorld?.(true);
 });
 markDirty();

 const result={
  id:item.id,
  type:item.type,
  name:item.name,
  before,
  after:{...normalized,source}
 };

 window.UTOP_DEBUG?.record?.(
  'ACTION',
  'Plan2D',
  `更新設備實體尺寸：${item.name||item.type}`,
  result
 );

 return result;
}

function restoreDefaultRealDimensions(item){
 if(!item)return null;

 delete item.params?.realDimensions;
 if(item.params)delete item.params.dimensionSource;

 const measured=readPhysicalModelDimensions(item);
 if(measured){
  return applyRealDimensionsToItem(item,measured,'model');
 }

 const safe=guessSafeDimensions(item);
 return applyRealDimensionsToItem(
  item,
  {
   width:safe.width,
   depth:safe.depth,
   height:safe.height
  },
  'autoSafePreset'
 );
}

function dimensionSourceText(source){
 const map={
  model:'3D模型',
  project:'專案資料',
  manual:'手動設定',
  autoSafePreset:'安全預設',
  guessed:'推測尺寸',
  realDimensions:'3D模型'
 };
 return map[source]||source||'未知';
}


const SAFE_DIMENSION_PRESETS=Object.freeze({
 default:{height:.4,width:.4,depth:.4},
 vehicle:{height:1.6,width:1.8,depth:4.2},
 road:{height:.08,width:2.5,depth:1.5},
 cabinet:{height:.6,width:.4,depth:.25},
 display:{height:.7,width:1.0,depth:.15},
 camera:{height:.3,width:.4,depth:.25},
 network:{height:.1,width:.44,depth:.3},
 building:{height:2.5,width:1.0,depth:.2}
});

function guessSafeDimensions(item){
 const type=String(item?.type||'').toLowerCase();
 const name=String(item?.name||'').toLowerCase();

 let preset=SAFE_DIMENSION_PRESETS.default;
 if(/camera|lpr|攝影/.test(`${type} ${name}`)){
  preset=SAFE_DIMENSION_PRESETS.camera;
 }else if(/display|led|screen|顯示|字幕/.test(`${type} ${name}`)){
  preset=SAFE_DIMENSION_PRESETS.display;
 }else if(/switch|router|fiber|server|nvr|network|網路|光纖/.test(`${type} ${name}`)){
  preset=SAFE_DIMENSION_PRESETS.network;
 }else if(/wall|door|gate|pillar|building|牆|門|柱/.test(`${type} ${name}`)){
  preset=SAFE_DIMENSION_PRESETS.building;
 }else if(/loop|road|lane|地感|車道/.test(`${type} ${name}`)){
  preset=SAFE_DIMENSION_PRESETS.road;
 }else if(/controller|relay|timer|cabinet|控制|繼電|計時/.test(`${type} ${name}`)){
  preset=SAFE_DIMENSION_PRESETS.cabinet;
 }

 const params=item?.params||{};
 const width=Number(params.width);
 const depth=Number(params.depth??params.length);
 const height=Number(params.height??params.installationHeight);

 return {
  height:Number.isFinite(height)&&height>0?height:preset.height,
  width:Number.isFinite(width)&&width>0?width:preset.width,
  depth:Number.isFinite(depth)&&depth>0?depth:preset.depth,
  source:'autoSafePreset'
 };
}

function applySafeDimensionsToItem(item){
 if(item?.mesh&&item?.type){
  const oldIconTypes=new Set(["barrier", "beacon", "bollard", "cardreader", "controller", "estop", "heightbar", "infrared", "intercom", "ipcamera", "laneindicator", "ledpanel", "loop", "loopdetector", "lpr", "parkingdisplay", "poeswitch", "powersupply", "radar", "shutter", "timer", "traffic", "uhf"]);
  if(oldIconTypes.has(item.type)){
   return {
    id:item.id,
    type:item.type,
    changed:false,
    reason:'V4.0.2專屬2D圖案保留'
   };
  }
 }

 if(!item?.mesh)return null;
 if(item.mesh.userData.realDimensions){
  return {
   id:item.id,
   type:item.type,
   changed:false,
   dimensions:item.mesh.userData.realDimensions
  };
 }

 const before=getModelTopFootprint(item);
 const dimensions=guessSafeDimensions(item);

 item.mesh.userData.realDimensions={
  height:dimensions.height,
  width:dimensions.width,
  depth:dimensions.depth
 };
 item.params=item.params||{};
 item.params.realDimensions={
  height:dimensions.height,
  width:dimensions.width,
  depth:dimensions.depth
 };
 item.params.dimensionSource=dimensions.source;

 dimensionAuditState.fallbackItems.delete(String(item.id));

 const result={
  id:item.id,
  type:item.type,
  name:item.name,
  changed:true,
  before,
  after:dimensions
 };

 window.UTOP_DEBUG?.record?.(
  'ACTION',
  'Plan2D',
  `自動補上模組尺寸：${item.name||item.type}`,
  result
 );

 return result;
}

function applySafeDimensionsToAll(){
 const results=state.items.map(applySafeDimensionsToItem).filter(Boolean);
 const changed=results.filter(result=>result.changed);

 if(changed.length){
  renderPlan();
  markDirty();
 }

 const report={
  changedCount:changed.length,
  totalItems:state.items.length,
  changed,
  after:getDimensionAuditReport()
 };

 window.UTOP_DEBUG?.record?.(
  changed.length?'SUCCESS':'INFO',
  'Plan2D',
  changed.length
   ?`已自動修正 ${changed.length} 個模組尺寸`
   :'沒有需要自動修正的模組',
  report
 );

 return report;
}

function renderDimensionReport(report=getDimensionAuditReport()){
 const panel=$('planDimensionReport');
 const body=$('planDimensionReportBody');
 if(!panel||!body)return report;

 panel.hidden=false;

 if(!report.missingCount){
  body.innerHTML=`
   <div class="dimension-report-ok">
    ✅ 目前所有已加入設備都有真實尺寸資料
   </div>
  `;
  return report;
 }

 const items=report.missing.map(item=>`
  <div class="dimension-report-item">
   <div>
    <strong>${item.name||item.type}</strong>
    <small>${item.id}</small>
   </div>
   <code>${item.type}</code>
  </div>
 `).join('');

 body.innerHTML=`
  <div class="dimension-report-summary">
   發現 <strong>${report.missingCount}</strong> 個設備缺少真實尺寸。
   可按「套用安全尺寸」先修正比例，再逐一調整精確規格。
  </div>
  ${items}
 `;

 return report;
}


function getDimensionAuditReport(){
 const allTypes=[...new Set(state.items.map(item=>item.type))];
 const missing=state.items
  .filter(item=>{
   if(item?.mesh?.userData?.realDimensions)return false;
   const measured=readPhysicalModelDimensions?.(item);
   return !measured;
  })
  .map(item=>({
   id:item.id,
   type:item.type,
   name:item.name,
   suggested:guessSafeDimensions(item)
  }));

 return {
  totalItems:state.items.length,
  activeTypes:allTypes,
  missingCount:missing.length,
  missing,
  warnedTypes:[...dimensionAuditState.warnedTypes]
 };
}

function getModelTopFootprint(item){
 const params=item?.params||{};
 const declared=item?.mesh?.userData?.realDimensions;

 // 優先使用模型建構時記錄的真實尺寸。
 // 這可排除3D名稱標籤、Sprite、選取框及輔助線。
 if(declared){
  const width=Number(declared.width);
  const depth=Number(declared.depth);
  if(Number.isFinite(width)&&Number.isFinite(depth)){
   return {
    width:Math.max(.05,width),
    depth:Math.max(.05,depth),
    source:'realDimensions'
   };
  }
 }

 const fallback={
  width:Math.max(.2,Number(params.width)||.8),
  depth:Math.max(.2,Number(params.length)||Number(params.depth)||.8),
  source:'fallback'
 };
 if(!item?.mesh){reportMissingRealDimensions(item,fallback);return fallback;}

 const physicalObjects=[];
 item.mesh.traverse?.(node=>{
  if(!node?.isMesh)return;

  const name=String(node.name||'').toLowerCase();
  const role=String(node.userData?.role||'').toLowerCase();

  // 名稱、文字、輔助框、連線提示不得算入設備實體尺寸。
  if(
   name.includes('label')||
   name.includes('sprite')||
   name.includes('helper')||
   name.includes('outline')||
   role.includes('label')||
   role.includes('helper')||
   node.userData?.excludeFromPlanBounds===true
  )return;

  physicalObjects.push(node);
 });

 if(!physicalObjects.length){reportMissingRealDimensions(item,fallback);return fallback;}

 try{
  const combined=new THREE.Box3();
  let hasBox=false;

  for(const node of physicalObjects){
   node.updateWorldMatrix?.(true,false);
   const box=new THREE.Box3().setFromObject(node);
   if(box.isEmpty())continue;
   if(!hasBox){
    combined.copy(box);
    hasBox=true;
   }else{
    combined.union(box);
   }
  }

  if(!hasBox||combined.isEmpty())return fallback;

  const size=new THREE.Vector3();
  combined.getSize(size);

  return {
   width:Math.max(.05,size.x),
   depth:Math.max(.05,size.z),
   source:'physicalMeshes'
  };
 }catch(error){
  console.warn('[UTOP-3D] 取得設備實體尺寸失敗',error);
  reportMissingRealDimensions(item,fallback);
  return fallback;
 }
}

function getBarrierPlanMetrics(item){
 const ppm=getPlanPixelsPerMeter();
 const params=item?.params||{};
 const bodyWidthM=.34;
 const bodyDepthM=.28;
 const armLengthM=Math.max(1.5,Number(params.armLength)||4);
 const angle=Math.max(0,Math.min(90,Number(params.angle)||0));
 const projectedArmM=armLengthM*Math.cos(
  THREE.MathUtils.degToRad(angle)
 );

 return {
  bodyWidthPx:Math.max(5,bodyWidthM*ppm.x),
  bodyDepthPx:Math.max(5,bodyDepthM*ppm.z),
  armLengthPx:Math.max(3,projectedArmM*ppm.average),
  fullArmLengthPx:armLengthM*ppm.average,
  angle,
  ppm
 };
}


function getPlanPixelsPerMeter(){
 const transform=planTransform();
 return {
  x:Math.abs(transform.scaleX),
  z:Math.abs(transform.scaleZ),
  average:(Math.abs(transform.scaleX)+Math.abs(transform.scaleZ))/2
 };
}


const PLAN_TOP_VIEW_CIRCULAR_TYPES=new Set([
 'ipcamera','domecamera','ptzcamera','panoramiccamera',
 'beacon','bollard'
]);

const PLAN_TOP_VIEW_ELLIPSE_TYPES=new Set([
 'radar','infrared'
]);

const PLAN_TOP_VIEW_DARK_TYPES=new Set([
 'controller','poeswitch','timer','delaytimer',
 'poweroffdelay','powerondelay','powersupply',
 'signal2way','signal3way','loopdetector'
]);

function getPlanTypeSymbol(item){
 const symbols={
  traffic:'●',
  timer:'⏱',
  delaytimer:'⏱',
  poweroffdelay:'OFF',
  powerondelay:'ON',
  loopdetector:'L',
  radar:'R',
  infrared:'IR',
  uhf:'UHF',
  cardreader:'CARD',
  ledpanel:'LED',
  lpr:'LPR',
  beacon:'!',
  bollard:'B',
  intercom:'TEL',
  ipcamera:'CAM',
  controller:'CTRL',
  poeswitch:'POE',
  powersupply:'DC',
  signal2way:'2W',
  signal3way:'3W',
  parkingdisplay:'P',
  laneindicator:'↔',
  heightbar:'H'
 };
 return symbols[item?.type]||String(item?.type||'?').slice(0,4).toUpperCase();
}

function rebuildPlanModelAsTrueTopView(model,item,planRotation){
 // V5.1.0.1.1.1：停用通用矩形／橢圓重畫，恢復V4.0.2原圖。
 return null;
 /*

 if(!model||!item||item.type==='barrier'||item.type==='loop')return null;

 const footprint=getModelTopFootprint(item);
 const ppm=getPlanPixelsPerMeter();
 const widthPx=Math.max(2,footprint.width*ppm.x);
 const depthPx=Math.max(2,footprint.depth*ppm.z);

 while(model.firstChild)model.removeChild(model.firstChild);

 const type=String(item.type||'');
 const isCircular=PLAN_TOP_VIEW_CIRCULAR_TYPES.has(type);
 const isEllipse=PLAN_TOP_VIEW_ELLIPSE_TYPES.has(type);
 const isDark=PLAN_TOP_VIEW_DARK_TYPES.has(type);

 let shape;
 if(isCircular||isEllipse){
  shape=document.createElementNS('http://www.w3.org/2000/svg','ellipse');
  shape.setAttribute('cx','0');
  shape.setAttribute('cy','0');
  shape.setAttribute('rx',String(widthPx/2));
  shape.setAttribute('ry',String(depthPx/2));
 }else{
  shape=document.createElementNS('http://www.w3.org/2000/svg','rect');
  shape.setAttribute('x',String(-widthPx/2));
  shape.setAttribute('y',String(-depthPx/2));
  shape.setAttribute('width',String(widthPx));
  shape.setAttribute('height',String(depthPx));
  shape.setAttribute(
   'rx',
   String(Math.max(1,Math.min(widthPx,depthPx)*.12))
  );
 }

 const activeColor=
  item.type==='traffic'&&item.params?.mode==='green'
   ?'#20d86e'
   :item.type==='traffic'&&item.params?.mode==='red'
    ?'#f04444'
    :isDark?'#26343d':'#417f9e';

 shape.setAttribute('fill',activeColor);
 shape.setAttribute('stroke','#172229');
 shape.setAttribute('stroke-width','1.2');
 shape.setAttribute('class','plan-true-top-view-shape');
 model.appendChild(shape);

 // 方向提示，表示3D設備的朝向。
 const arrowLength=Math.max(3,Math.min(widthPx,depthPx)*.36);
 const direction=document.createElementNS(
  'http://www.w3.org/2000/svg',
  'path'
 );
 direction.setAttribute(
  'd',
  `M 0 ${-arrowLength} L ${arrowLength*.45} ${-arrowLength*.15} L ${-arrowLength*.45} ${-arrowLength*.15} Z`
 );
 direction.setAttribute('fill','#f4f8fa');
 direction.setAttribute('opacity','.88');
 direction.setAttribute('class','plan-top-view-direction');
 model.appendChild(direction);

 // 中央符號只做辨識，不控制設備外觀尺寸。
 const minSide=Math.min(widthPx,depthPx);
 if(minSide>=9){
  const symbol=document.createElementNS(
   'http://www.w3.org/2000/svg',
   'text'
  );
  symbol.textContent=getPlanTypeSymbol(item);
  symbol.setAttribute('x','0');
  symbol.setAttribute('y',String(Math.max(2,minSide*.14)));
  symbol.setAttribute('text-anchor','middle');
  symbol.setAttribute(
   'font-size',
   String(Math.max(4,Math.min(11,minSide*.38)))
  );
  symbol.setAttribute('font-weight','900');
  symbol.setAttribute('fill','#ffffff');
  symbol.setAttribute('pointer-events','none');
  symbol.setAttribute('class','plan-top-view-symbol');
  model.appendChild(symbol);
 }

 model.setAttribute('transform',`rotate(${planRotation})`);
 model.dataset.worldScaled='true';
 model.dataset.trueTopView='true';
 model.dataset.planWidth=String(widthPx);
 model.dataset.planHeight=String(depthPx);
 model.dataset.worldWidth=String(footprint.width);
 model.dataset.worldDepth=String(footprint.depth);

 return {
  renderedWidth:widthPx,
  renderedHeight:depthPx,
  desiredWidth:widthPx,
  desiredHeight:depthPx,
  uniformScale:1,
  footprint
 };
}


 */
}

const planDisplayMode={
 mode:'minimap',
 iconSize:18,
 minIconSize:14,
 maxIconSize:26
};

function isPlanMinimapMode(){
 return planDisplayMode.mode==='minimap';
}

function getMinimapIconTargetSize(item){
 const type=String(item?.type||'');
 const largeTypes=new Set(['barrier','traffic','parkingdisplay','laneindicator']);
 const compactTypes=new Set(['relay','timer','controller','cardreader','loopdetector']);
 if(largeTypes.has(type))return 22;
 if(compactTypes.has(type))return 16;
 return 18;
}

function scalePlanModelForMinimap(model,item,planRotation){
 if(!model)return null;

 let box;
 try{box=model.getBBox()}catch(_){box=null}

 const intrinsicWidth=Math.max(1,Number(box?.width)||20);
 const intrinsicHeight=Math.max(1,Number(box?.height)||20);
 const target=getMinimapIconTargetSize(item);

 const scale=Math.max(
  .05,
  Math.min(
   target/intrinsicWidth,
   target/intrinsicHeight
  )
 );

 const centerX=-(Number(box?.x)||0)-intrinsicWidth/2;
 const centerY=-(Number(box?.y)||0)-intrinsicHeight/2;

 model.setAttribute(
  'transform',
  `rotate(${planRotation}) scale(${scale}) translate(${centerX} ${centerY})`
 );
 model.classList.add('plan-minimap-marker');

 return {
  renderedWidth:intrinsicWidth*scale,
  renderedHeight:intrinsicHeight*scale,
  desiredWidth:target,
  desiredHeight:target,
  uniformScale:scale,
  mode:'minimap'
 };
}

function updatePlanMapModeButton(){
 const button=$('planMapModeToggle');
 if(!button)return;
 const minimap=isPlanMinimapMode();
 button.textContent=minimap?'GTA小地圖':'工程比例';
 button.classList.toggle('is-active',minimap);
 button.title=minimap
  ?'目前：GTA小地圖，點擊切換工程比例'
  :'目前：工程比例，點擊切換GTA小地圖';
}


function syncPlanModelScale(model,item,planRotation){
 if(!model||!item)return null;

 const footprint=getModelTopFootprint(item);
 const ppm=getPlanPixelsPerMeter();

 const desiredWidth=Math.max(1,footprint.width*ppm.x);
 const desiredHeight=Math.max(1,footprint.depth*ppm.z);

 // SVG設備先用既有向量圖完成，再量測其原始尺寸。
 // 這可讓全部模組共用同一套同步方式，不必逐一重畫。
 let box;
 try{
  box=model.getBBox();
 }catch(_){
  box=null;
 }

 const intrinsicWidth=Math.max(1,Number(box?.width)||40);
 const intrinsicHeight=Math.max(1,Number(box?.height)||40);

 const fitScaleX=desiredWidth/intrinsicWidth;
 const fitScaleY=desiredHeight/intrinsicHeight;

 // V5.1.0.1.1.1：2D圖形禁止X、Y分別拉伸。
 // 使用單一等比例縮放值，避免圓形變橢圓、設備被壓扁或拉長。
 // 取較小值，確保完整模型落在3D投影尺寸範圍內。
 const uniformScale=Math.max(.05,Math.min(fitScaleX,fitScaleY));

 const centerX=-(Number(box?.x)||0)-intrinsicWidth/2;
 const centerY=-(Number(box?.y)||0)-intrinsicHeight/2;

 model.setAttribute(
  'transform',
  `rotate(${planRotation}) scale(${uniformScale}) translate(${centerX} ${centerY})`
 );

 const renderedWidth=intrinsicWidth*uniformScale;
 const renderedHeight=intrinsicHeight*uniformScale;

 model.dataset.worldWidth=footprint.width.toFixed(3);
 model.dataset.worldDepth=footprint.depth.toFixed(3);
 model.dataset.planWidth=renderedWidth.toFixed(2);
 model.dataset.planHeight=renderedHeight.toFixed(2);
 model.dataset.planScale=uniformScale.toFixed(4);
 model.dataset.planFitWidth=desiredWidth.toFixed(2);
 model.dataset.planFitHeight=desiredHeight.toFixed(2);

 return {
  footprint,
  desiredWidth,
  desiredHeight,
  renderedWidth,
  renderedHeight,
  scaleX:uniformScale,
  scaleY:uniformScale,
  uniformScale
 };
}


const planViewState={
 scale:1,minScale:.25,maxScale:8,panX:0,panY:0,
 pointers:new Map(),lastPinchDistance:0,
 isPanning:false,panPointerId:null,
 panStartX:0,panStartY:0,startPanX:0,startPanY:0
};

function clampPlanZoom(value){
 return Math.max(planViewState.minScale,Math.min(planViewState.maxScale,Number(value)||1));
}

function getPlanViewportGroup(){
 return $('planViewport')||
  $('planSceneGeometry')?.parentNode||
  $('planItems')?.parentNode;
}

function applyPlanViewTransform(){
 const target=getPlanViewportGroup();
 if(!target)return;
 target.setAttribute(
  'transform',
  `translate(${planViewState.panX} ${planViewState.panY}) scale(${planViewState.scale})`
 );
 if($('planZoomReset'))$('planZoomReset').textContent=`${Math.round(planViewState.scale*100)}%`;
}

function planClientToSvg(clientX,clientY){
 const svg=$('planSvg');
 const point=svg.createSVGPoint();
 point.x=clientX;point.y=clientY;
 return point.matrixTransform(svg.getScreenCTM().inverse());
}

function setPlanZoom(nextScale,center=null){
 const oldScale=planViewState.scale;
 const scale=clampPlanZoom(nextScale);
 if(center){
  const worldX=(center.x-planViewState.panX)/oldScale;
  const worldY=(center.y-planViewState.panY)/oldScale;
  planViewState.panX=center.x-worldX*scale;
  planViewState.panY=center.y-worldY*scale;
 }
 planViewState.scale=scale;
 applyPlanViewTransform();
 schedulePlanReconcile();
}

function resetPlanView(){
 planViewState.scale=1;
 planViewState.panX=0;
 planViewState.panY=0;
 applyPlanViewTransform();
}

function fitPlanView(){
 const svg=$('planSvg');
 const content=getPlanViewportGroup();
 if(!svg||!content)return resetPlanView();
 let box;
 try{box=content.getBBox()}catch(_){return resetPlanView()}
 const vb=svg.viewBox.baseVal;
 if(!box.width||!box.height)return resetPlanView();
 const margin=24;
 const scale=clampPlanZoom(Math.min((vb.width-margin*2)/box.width,(vb.height-margin*2)/box.height));
 planViewState.scale=scale;
 planViewState.panX=vb.x+(vb.width-box.width*scale)/2-box.x*scale;
 planViewState.panY=vb.y+(vb.height-box.height*scale)/2-box.y*scale;
 applyPlanViewTransform();
}

function installPlanZoomControls(){
 $('planZoomIn')?.addEventListener('click',()=>setPlanZoom(planViewState.scale*1.25));
 $('planZoomOut')?.addEventListener('click',()=>setPlanZoom(planViewState.scale/1.25));
 $('planZoomReset')?.addEventListener('click',resetPlanView);
 $('planZoomFit')?.addEventListener('click',fitPlanView);
 $('planDimensionAudit')?.addEventListener('click',()=>{
  const report=getDimensionAuditReport();
  renderDimensionReport(report);
  const message=report.missingCount
   ?`發現 ${report.missingCount} 個設備缺少真實尺寸，已寫入 Debug Center。`
   :'目前設備的2D／3D尺寸資料完整。';
  $('statusText').textContent=message;
  window.UTOP_DEBUG?.record?.(
   report.missingCount?'WARNING':'SUCCESS',
   'Plan2D',
   message,
   report
  );
 });

 $('planDimensionAutoFix')?.addEventListener('click',()=>{
  const report=applySafeDimensionsToAll();
  renderDimensionReport(report.after);
  $('statusText').textContent=report.changedCount
   ?`已自動修正 ${report.changedCount} 個模組尺寸`
   :'目前沒有需要修正的模組';
 });

 $('closePlanDimensionReport')?.addEventListener('click',()=>{
  $('planDimensionReport').hidden=true;
 });

 $('applyPlanDimensionFixes')?.addEventListener('click',()=>{
  const report=applySafeDimensionsToAll();
  renderDimensionReport(report.after);
 });

 $('recheckPlanDimensions')?.addEventListener('click',()=>{
  renderDimensionReport(getDimensionAuditReport());
 });


 const svg=$('planSvg');
 if(!svg)return;

 svg.addEventListener('wheel',event=>{
  event.preventDefault();
  const center=planClientToSvg(event.clientX,event.clientY);
  setPlanZoom(planViewState.scale*(event.deltaY<0?1.12:1/1.12),center);
 },{passive:false});

 svg.addEventListener('pointerdown',event=>{
  planViewState.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
  const background=event.target===svg||event.target?.id==='planGrid'||event.target?.id==='planScene';
  if(
   !planDrag&&
   (event.button===1||event.button===2||background)&&
   !event.target?.closest?.('.plan-item')
  ){
   event.preventDefault();
   planViewState.isPanning=true;
   planViewState.panPointerId=event.pointerId;
   planViewState.panStartX=event.clientX;
   planViewState.panStartY=event.clientY;
   planViewState.startPanX=planViewState.panX;
   planViewState.startPanY=planViewState.panY;
   safeSetPointerCapture(svg,event.pointerId);
  }
  if(planViewState.pointers.size===2){
   const pts=[...planViewState.pointers.values()];
   planViewState.lastPinchDistance=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
  }
 });

 svg.addEventListener('pointermove',event=>{
  if(planViewState.pointers.has(event.pointerId)){
   planViewState.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
  }
  if(planViewState.pointers.size===2){
   if(planDrag){
    endPlanDrag(event,true);
   }
   event.preventDefault();
   const pts=[...planViewState.pointers.values()];
   const distance=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
   const center=planClientToSvg((pts[0].x+pts[1].x)/2,(pts[0].y+pts[1].y)/2);
   if(planViewState.lastPinchDistance>0){
    setPlanZoom(planViewState.scale*(distance/planViewState.lastPinchDistance),center);
   }
   planViewState.lastPinchDistance=distance;
   return;
  }
  if(planViewState.isPanning&&event.pointerId===planViewState.panPointerId){
   const rect=svg.getBoundingClientRect();
   const vb=svg.viewBox.baseVal;
   planViewState.panX=planViewState.startPanX+(event.clientX-planViewState.panStartX)*(vb.width/Math.max(1,rect.width));
   planViewState.panY=planViewState.startPanY+(event.clientY-planViewState.panStartY)*(vb.height/Math.max(1,rect.height));
   applyPlanViewTransform();
  }
 });

 const endPointer=event=>{
  planViewState.pointers.delete(event.pointerId);
  if(planViewState.pointers.size<2)planViewState.lastPinchDistance=0;
  if(event.pointerId===planViewState.panPointerId){
   planViewState.isPanning=false;
   planViewState.panPointerId=null;
   safeReleasePointerCapture(svg,event.pointerId);
  }
 };
 svg.addEventListener('pointerup',endPointer);
 svg.addEventListener('pointercancel',endPointer);
 svg.addEventListener('contextmenu',event=>event.preventDefault());
}



function safeInsertBefore(parent,node,reference=null){
 if(!parent||!node)return false;

 try{
  if(node.parentNode&&node.parentNode!==parent){
   node.parentNode.removeChild(node);
  }

  if(reference&&reference.parentNode===parent){
   parent.insertBefore(node,reference);
  }else{
   parent.appendChild(node);
  }
  return true;
 }catch(error){
  console.warn('[UTOP-3D] 2D節點插入失敗，改用appendChild',error);
  try{
   parent.appendChild(node);
   return true;
  }catch(appendError){
   console.error('[UTOP-3D] 2D節點加入失敗',appendError);
   window.UTOP_DEBUG?.record?.(
    'ERROR',
    'Plan2D',
    '2D節點插入失敗',
    {
     message:appendError?.message,
     stack:appendError?.stack
    }
   );
   return false;
  }
 }
}


function getPlanRoot(){
 return $('planItems')||$('planViewport')||$('planSvg');
}

function markPlanOuterIdentity(outer,item){
 if(!outer||!item)return;
 outer.dataset.planItemId=String(item.id);
 outer.dataset.planItemType=String(item.type||'unknown');
 outer.classList.add('plan-item');
}

function deduplicatePlanItems(){
 const root=getPlanRoot();
 if(!root)return {removed:0};

 const seen=new Set();
 let removed=0;
 root.querySelectorAll('[data-plan-item-id]').forEach(node=>{
  const id=node.dataset.planItemId;
  if(!id)return;
  if(seen.has(id)){
   node.remove();
   removed++;
  }else{
   seen.add(id);
  }
 });

 if(removed){
  window.UTOP_DEBUG?.record?.(
   'WARNING','Plan2D',
   `已移除 ${removed} 個重複2D模組`,
   {removed}
  );
 }
 return {removed};
}

function reconcilePlanItems(){
 const root=getPlanRoot();
 if(!root){
  return {ok:false,reason:'missing-plan-root',expected:state.items.length,actual:0,missing:[]};
 }

 deduplicatePlanItems();

 const missing=[];
 for(const item of state.items){
  const selector=`[data-plan-item-id="${CSS.escape(String(item.id))}"]`;
  if(!root.querySelector(selector)){
   missing.push({id:item.id,type:item.type,name:item.name});
  }
 }

 const actual=root.querySelectorAll('[data-plan-item-id]').length;
 const report={
  ok:missing.length===0&&actual===state.items.length,
  expected:state.items.length,
  actual,
  missing
 };

 if(missing.length){
  window.UTOP_DEBUG?.record?.(
   'ERROR','Plan2D',
   `發現 ${missing.length} 個3D設備未掛入2D`,
   report
  );
 }
 return report;
}

function schedulePlanReconcile(){
 cancelAnimationFrame(schedulePlanReconcile.frame);
 schedulePlanReconcile.frame=requestAnimationFrame(()=>{
  const report=reconcilePlanItems();
  if(!report.ok&&report.missing.length&&!schedulePlanReconcile.retrying){
   schedulePlanReconcile.retrying=true;
   renderPlan();
   requestAnimationFrame(()=>{
    const after=reconcilePlanItems();
    window.UTOP_DEBUG?.record?.(
     after.ok?'SUCCESS':'ERROR',
     'Plan2D',
     after.ok?'2D模組自我修復完成':'2D模組自我修復後仍有缺漏',
     after
    );
    schedulePlanReconcile.retrying=false;
   });
  }
 });
}
schedulePlanReconcile.frame=0;
schedulePlanReconcile.retrying=false;



function getBarrierSharedGeometry(item){
 const p=item?.params||{};
 const armLength=Math.max(
  1.5,
  Math.min(12,Number(p.armLength)||4)
 );
 const angle=Math.max(
  0,
  Math.min(90,Number(p.angle)||0)
 );
 const sign=p.armSide==='right'?1:-1;
 const radians=THREE.MathUtils.degToRad(angle);

 return {
  armLength,
  angle,
  sign,
  projectedLength:armLength*Math.cos(radians),
  raisedHeight:armLength*Math.sin(radians)
 };
}


function auditPlanWorldPositions(){
 const issues=[];

 for(const item of state.items){
  const transform=ensureItemWorldTransform(item);
  const node=document.querySelector(
   `[data-plan-item-id="${CSS.escape(String(item.id))}"]`
  );
  if(!node)continue;

  const expected=worldToPlan(transform.x,transform.z);
  const parsed=(node.getAttribute('transform')||'')
   .match(/translate\(([-\d.]+)[ ,]+([-\d.]+)\)/);

  if(!parsed)continue;

  const actual={
   x:Number(parsed[1]),
   y:Number(parsed[2])
  };

  if(
   Math.abs(actual.x-expected.x)>.5||
   Math.abs(actual.y-expected.y)>.5
  ){
   issues.push({
    id:item.id,
    name:item.name,
    type:item.type,
    world:{x:transform.x,z:transform.z},
    expected,
    actual
   });
  }
 }

 const report={
  ok:issues.length===0,
  issueCount:issues.length,
  issues
 };

 window.UTOP_DEBUG?.record?.(
  report.ok?'SUCCESS':'WARNING',
  'Plan2D',
  report.ok
   ?'2D設備位置與世界座標一致'
   :`發現 ${issues.length} 台設備的2D位置不同步`,
  report
 );

 return report;
}


let scheduledPlanFrame=0;
let scheduledPlanReason='';

function schedulePlanRender(reason='partial-update'){
 scheduledPlanReason=reason;

 if(scheduledPlanFrame){
  return scheduledPlanFrame;
 }

 scheduledPlanFrame=requestAnimationFrame(()=>{
  scheduledPlanFrame=0;

  try{
   renderPlan();
  }catch(error){
   console.error('[UTOP-3D] 2D排程更新失敗',error);
   window.UTOP_DEBUG?.record?.(
    'ERROR',
    'PartialUpdate',
    '2D排程更新失敗',
    {
     reason:scheduledPlanReason,
     message:error?.message,
     stack:error?.stack
    }
   );
  }
 });

 return scheduledPlanFrame;
}

function updateItemTransformOnly(item,options={}){
 if(!item)return {
  ok:false,
  reason:'missing-item'
 };

 const transform=ensureItemWorldTransform(item);

 item.x=transform.x;
 item.y=transform.y;
 item.z=transform.z;
 item.rotationY=transform.rotationY;
 item.scale=transform.scale;

 item.params=item.params||{};
 item.params.rotation=transform.rotationY;

 if(item.mesh){
  item.mesh.position.set(
   transform.x,
   transform.y,
   transform.z
  );
  item.mesh.rotation.y=THREE.MathUtils.degToRad(
   transform.rotationY
  );
  item.mesh.scale.setScalar(transform.scale);
  item.mesh.updateMatrixWorld?.(true);
 }

 applyHeightToObject(item);
 refreshNameLabels();

 if(options.plan!==false){
  schedulePlanRender(options.reason||'transform-only');
 }

 if(options.quick===true&&item.id===state.selectedId){
  renderQuick(item);
 }

 markDirty();

 return {
  ok:true,
  id:item.id,
  transform:{...transform}
 };
}

function updateItemLabelOnly(item){
 if(!item)return;

 refreshNameLabels();

 const planNode=document.querySelector(
  `[data-plan-item-id="${CSS.escape(String(item.id))}"]`
 );
 const label=planNode?.querySelector('.plan-item-name');

 if(label){
  label.textContent=item.name||item.type||'未命名設備';
 }else{
  schedulePlanRender('label-node-missing');
 }

 if(item.id===state.selectedId){
  const badge=$('selectedBadge');
  if(badge){
   badge.textContent=`已選擇：${item.name}`;
  }
  renderQuick(item);
 }

 markDirty();
}

function rebuildItemGeometryOnly(item,options={}){
 if(!item)return {
  ok:false,
  reason:'missing-item'
 };

 const stableTransform=captureStableTransform(item);

 if(item.mesh){
  group.remove(item.mesh);
 }

 item.mesh=makeModel(item);
 applyStableTransform(item,stableTransform);
 applyHeightToObject(item);
 applyPartsVisibility(item);
 group.add(item.mesh);
 refreshNameLabels();

 schedulePlanRender(options.reason||'geometry-update');

 if(options.quick!==false&&item.id===state.selectedId){
  renderQuick(item);
 }

 markDirty();

 return {
  ok:true,
  id:item.id,
  transform:{...ensureItemWorldTransform(item)}
 };
}

function updateSelectedPlanClass(previousId,nextId){
 const root=$('planItems');
 if(!root)return;

 if(previousId){
  const previous=root.querySelector(
   `[data-plan-item-id="${CSS.escape(String(previousId))}"]`
  );
  previous?.classList.remove('selected');
 }

 if(nextId){
  const next=root.querySelector(
   `[data-plan-item-id="${CSS.escape(String(nextId))}"]`
  );
  next?.classList.add('selected');
 }
}

function renderPlan(){
 renderPlanSceneBackground();
 try{
  renderPlanSceneGeometry();
 }catch(sceneGeometryError){
  console.error(
   '[UTOP-3D] 2D場景背景繪製失敗，已略過',
   sceneGeometryError
  );
  window.UTOP_DEBUG?.record?.(
   'ERROR',
   'Plan2D',
   '2D場景背景繪製失敗，核心繼續運作',
   {
    message:sceneGeometryError?.message,
    stack:sceneGeometryError?.stack
   }
  );
 }
 const root=$('planItems');
 root.innerHTML='';

 for(const i of state.items){
  const p=i.params;
  const worldTransform=ensureItemWorldTransform(i);
  const planPoint=worldToPlan(
   worldTransform.x,
   worldTransform.z
  );
  const x=planPoint.x;
  const y=planPoint.y;
  const outer=document.createElementNS('http://www.w3.org/2000/svg','g');
  markPlanOuterIdentity(outer,i);
  outer.dataset.id=i.id;
  outer.dataset.planItemId=i.id;
  outer.style.pointerEvents='all';
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
    (
     Number(
      worldTransform.rotationY??
      p.rotation??
      0
     )
    )%360+360
  )%360;
  const planRotation=i.type==='barrier'
    ? -normalizedRotation
    : normalizedRotation;

  model.setAttribute('transform',`rotate(${planRotation})`);
  outer.dataset.planRotation=String(planRotation);

  // V5.1.0.1.1.1：恢復 V4.0.2 原始專屬2D模組圖案。
  // 圖案外觀不再由通用矩形／圓形覆蓋。
if(i.type==='barrier'){
    const barrierGeometry=getBarrierSharedGeometry(i);
    const sign=barrierGeometry.sign;
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
    const angle=barrierGeometry.angle;
    const pixelsPerMeter=getPlanPixelsPerMeter().average;
    const fullLength=Math.max(
      5,
      barrierGeometry.armLength*pixelsPerMeter
    );
    const projectedLength=Math.max(
      3,
      barrierGeometry.projectedLength*pixelsPerMeter
    );
    const raisedRatio=
      barrierGeometry.raisedHeight/
      Math.max(.001,barrierGeometry.armLength);

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
    [['red',-2,'#ff2929'],['green',22,'#20e56c']].forEach(([mode,cy,col])=>{
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
    model.appendChild(svgElement('rect',{x:-width*getPlanPixelsPerMeter().x/2,y:-length*getPlanPixelsPerMeter().z/2,width:width*getPlanPixelsPerMeter().x,height:length*getPlanPixelsPerMeter().z,rx:10,fill:'rgba(70,80,84,.12)',stroke:p.detected?'#42e081':'#737b7e','stroke-width':6,class:'plan-device-body'}));
    model.appendChild(svgElement('rect',{x:-width*getPlanPixelsPerMeter().x/2+8,y:-length*getPlanPixelsPerMeter().z/2+8,width:Math.max(1,width*getPlanPixelsPerMeter().x-16),height:Math.max(1,length*getPlanPixelsPerMeter().z-16),rx:7,fill:'none',stroke:'#1d2428','stroke-width':2}));
    model.appendChild(svgElement('rect',{x:width*getPlanPixelsPerMeter().x/2-9,y:length*getPlanPixelsPerMeter().z/2-12,width:15,height:9,rx:2,fill:'#d6aa27',stroke:'#735b12'}));
  }else if(i.type==='infrared'){
    const distance=Math.max(.1,Number(p.distance)||4),half=distance*getPlanPixelsPerMeter().x/2;
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
  }else if(i.type==='directionrecognizer'){
    model.appendChild(svgElement('rect',{x:-38,y:-27,width:76,height:54,rx:6,fill:'#d9ddda',stroke:'#4f5b60','stroke-width':3,class:'plan-device-body'}));
    model.appendChild(svgElement('rect',{x:-31,y:-20,width:62,height:36,rx:4,fill:'#1f282c'}));
    const tx=svgElement('text',{x:0,y:-2,fill:'#f4f6f5','font-size':12,'font-weight':700,'text-anchor':'middle'});tx.textContent='LK-121';model.appendChild(tx);
    model.appendChild(svgElement('circle',{cx:-18,cy:13,r:5,fill:p.lastDirection==='FORWARD'?'#37e87b':p.lastDirection==='REVERSE'?'#45b9ff':'#405056'}));
    model.appendChild(svgElement('circle',{cx:18,cy:13,r:5,fill:p.relayActive?'#ffb72b':'#47391d'}));
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

  // V5.1.0.1.1.1：保留 V4.0.2 各設備原始圖案。
  // 只做等比例 contain 縮放，不重畫、不拉寬、不壓扁。
  model.dataset.trueTopView='false';
  // V5.1.0.1.1：先把設備圖案正式加入outer。
  // 後續點選區與選取框只能當輔助節點，不能取代或搬走model。
  if(!model.childNodes.length){
   const fallback=document.createElementNS(
    'http://www.w3.org/2000/svg',
    'rect'
   );
   fallback.setAttribute('x','-10');
   fallback.setAttribute('y','-7');
   fallback.setAttribute('width','20');
   fallback.setAttribute('height','14');
   fallback.setAttribute('rx','3');
   fallback.setAttribute('fill','#d96b2b');
   fallback.setAttribute('stroke','#ffffff');
   fallback.setAttribute('stroke-width','1');
   fallback.setAttribute('class','plan-module-fallback');
   model.appendChild(fallback);

   const fallbackText=document.createElementNS(
    'http://www.w3.org/2000/svg',
    'text'
   );
   fallbackText.textContent=String(i.type||'?').slice(0,4);
   fallbackText.setAttribute('x','0');
   fallbackText.setAttribute('y','3');
   fallbackText.setAttribute('text-anchor','middle');
   fallbackText.setAttribute('font-size','5');
   fallbackText.setAttribute('fill','#ffffff');
   fallbackText.setAttribute('pointer-events','none');
   model.appendChild(fallbackText);

   window.UTOP_DEBUG?.record?.(
    'WARNING',
    'Plan2D',
    `2D模組圖案為空：${i.type||'unknown'}`,
    {id:i.id,name:i.name,type:i.type}
   );
  }

  if(model.parentNode!==outer){
   if(model.parentNode)model.parentNode.removeChild(model);
   outer.appendChild(model);
  }

  const syncedPlanModel=isPlanMinimapMode()
   ?scalePlanModelForMinimap(model,i,planRotation)
   :(
    model.dataset.worldScaled==='true'
     ?{
        renderedWidth:Number(model.dataset.planWidth)||8,
        renderedHeight:Number(model.dataset.planHeight)||8,
        desiredWidth:Number(model.dataset.planWidth)||8,
        desiredHeight:Number(model.dataset.planHeight)||8,
        uniformScale:1
      }
     :syncPlanModelScale(model,i,planRotation)
   );

  // 透明點選區維持容易操作，但不參與設備真實比例。
  if(syncedPlanModel){
   const hitbox=document.createElementNS('http://www.w3.org/2000/svg','rect');
   hitbox.setAttribute('x',String(-Math.max(18,syncedPlanModel.renderedWidth/2+5)));
   hitbox.setAttribute('y',String(-Math.max(18,syncedPlanModel.renderedHeight/2+5)));
   hitbox.setAttribute('width',String(Math.max(36,syncedPlanModel.renderedWidth+10)));
   hitbox.setAttribute('height',String(Math.max(36,syncedPlanModel.renderedHeight+10)));
   hitbox.setAttribute('fill','transparent');
   hitbox.setAttribute('pointer-events','all');
   hitbox.setAttribute('class','plan-device-hitbox');
   hitbox.dataset.id=i.id;
   hitbox.dataset.planItemId=i.id;
   if(model.parentNode===outer){
    outer.insertBefore(hitbox,model);
   }else{
    outer.appendChild(hitbox);
   }

   if(i.id===state.selectedId){
    const selection=document.createElementNS(
      'http://www.w3.org/2000/svg',
      'rect'
    );
    const selectionWidth=isPlanMinimapMode()
     ?Math.max(30,syncedPlanModel.renderedWidth+12)
     :Math.max(12,syncedPlanModel.renderedWidth+8);
    const selectionHeight=isPlanMinimapMode()
     ?Math.max(30,syncedPlanModel.renderedHeight+12)
     :Math.max(12,syncedPlanModel.renderedHeight+8);
    selection.setAttribute('x',String(-selectionWidth/2));
    selection.setAttribute('y',String(-selectionHeight/2));
    selection.setAttribute('width',String(selectionWidth));
    selection.setAttribute('height',String(selectionHeight));
    selection.setAttribute('rx','4');
    selection.setAttribute('fill','none');
    selection.setAttribute('stroke','#2db8ff');
    selection.setAttribute('stroke-width','1.5');
    selection.setAttribute('pointer-events','none');
    selection.setAttribute(
     'class',
     isPlanMinimapMode()
      ?'plan-physical-selection plan-minimap-selection'
      :'plan-physical-selection'
    );
    outer.appendChild(selection);
   }
  }

  // V5.1.0：2D設備名稱與3D共用名稱資料。
  const existingLabel=outer.querySelector('.plan-item-name');
  if(!existingLabel){
   const label=document.createElementNS(
    'http://www.w3.org/2000/svg',
    'text'
   );
   label.setAttribute('class','plan-item-name');
   label.setAttribute('x','0');
   label.setAttribute('y','22');
   label.setAttribute('text-anchor','middle');
   label.setAttribute('dominant-baseline','hanging');
   label.setAttribute('pointer-events','none');
   label.textContent=i.name||i.type||'未命名設備';
   outer.appendChild(label);
  }

  // 完成每個2D設備後，固定掛入plan root。
  if(outer.parentNode!==root){
   root.appendChild(outer);
  }
 }



  const visiblePlanItems=root.querySelectorAll('.plan-item').length;
 const mountedChildren=root.children.length;
 if(state.items.length&&visiblePlanItems===0){
  window.UTOP_DEBUG?.record?.(
   'ERROR',
   'Plan2D',
   '3D有設備，但2D沒有任何模組節點',
   {
    deviceCount:state.items.length,
    planItemCount:visiblePlanItems,
    mountedChildren
   }
  );
 }
$('deviceCount').textContent=`${state.items.length} 個設備｜${state.wires.length} 條接線`;
 applyPlanViewTransform();
}


let planDrag=null;
let planDragPointerId=null;
let planDragMoved=false;
let planDragStart=null;
let planDragLastRender=0;

function svgPoint(e){
 const svg=$('planSvg');
 const p=svg.createSVGPoint();
 p.x=e.clientX;
 p.y=e.clientY;
 return p.matrixTransform(svg.getScreenCTM().inverse());
}

function findPlanItemElement(target){
 if(!target)return null;
 return target.closest?.('.plan-item,[data-plan-item-id],[data-id]')||null;
}

function resolvePlanDragItem(target){
 const element=findPlanItemElement(target);
 if(!element)return null;

 const id=
  element.dataset.planItemId||
  element.dataset.id;

 if(!id)return null;
 return get(id);
}

function beginPlanDrag(e){
 if(e.button!==undefined&&e.button!==0)return;

 const item=resolvePlanDragItem(e.target);
 if(!item)return;

 // 雙指操作優先交給縮放，單指才拖設備。
 if(planViewState?.pointers?.size>=1&&
    !planViewState.pointers.has(e.pointerId)){
  return;
 }

 e.preventDefault();
 e.stopPropagation();

 select(item.id);

 if(isDeviceMovementLocked(item)){
  $('statusText').textContent='設備位置已固定，請先解除固定';
  return;
 }

 planDrag=item;
 planDragPointerId=e.pointerId;
 planDragMoved=false;
 planDragStart={
  x:item.x,
  z:item.z,
  clientX:e.clientX,
  clientY:e.clientY
 };

 planViewState.isPanning=false;
 planViewState.panPointerId=null;

 safeSetPointerCapture($('planSvg'),e.pointerId);
 $('planSvg').classList.add('is-dragging-device');
}

function updatePlanDrag(e){
 if(!planDrag||e.pointerId!==planDragPointerId)return;
 if(isDeviceMovementLocked(planDrag))return;

 e.preventDefault();
 e.stopPropagation();

 const point=svgPoint(e);

 // 先把畫面縮放／平移反算回未縮放的plan座標。
 const unscaledX=
  (point.x-planViewState.panX)/
  Math.max(.0001,planViewState.scale);
 const unscaledY=
  (point.y-planViewState.panY)/
  Math.max(.0001,planViewState.scale);

 const world=planToWorld(unscaledX,unscaledY);

 clampDevicePosition(planDrag,world.x,world.z);
 syncPlanDragToWorld(
  planDrag,
  planDrag.x,
  planDrag.z
 );

 const movedDistance=Math.hypot(
  e.clientX-planDragStart.clientX,
  e.clientY-planDragStart.clientY
 );
 if(movedDistance>3)planDragMoved=true;

 // 限制約60fps，不在每個pointer事件重建過多DOM。
 const now=performance.now();
 if(now-planDragLastRender>16){
  renderPlan();
  planDragLastRender=now;
 }
}

function endPlanDrag(e,cancelled=false){
 if(!planDrag||e.pointerId!==planDragPointerId)return;

 e.preventDefault();
 e.stopPropagation();

 safeReleasePointerCapture($('planSvg'),e.pointerId);
 $('planSvg').classList.remove('is-dragging-device');

 const item=planDrag;
 const before=planDragStart;

 if(planDrag){
  writeWorldTransform(
   planDrag,
   {
    x:planDrag.x,
    y:planDrag.y,
    z:planDrag.z,
    rotationY:planDrag.rotationY??planDrag.params?.rotation??0,
    scale:planDrag.scale??1
   },
   {
    refresh:false,
    source:'2d-drag-complete'
   }
  );
}
 planDrag=null;
 planDragPointerId=null;
 planDragStart=null;

 if(cancelled&&before){
  item.x=before.x;
  item.z=before.z;
  safeRefreshItemVisual(item);
 }

 renderPlan();

 if(planDragMoved&&!cancelled){
  markDirty();
  window.UTOP_DEBUG?.record?.(
   'ACTION',
   'Plan2D',
   `2D拖移設備：${item.name||item.type}`,
   {
    id:item.id,
    type:item.type,
    x:item.x,
    z:item.z
   }
  );
  $('statusText').textContent=
   `已移動 ${item.name||item.type}`;
 }

 planDragMoved=false;
}

function installPlanDeviceDrag(){
 const svg=$('planSvg');
 if(!svg||svg.dataset.deviceDragInstalled==='true')return;
 svg.dataset.deviceDragInstalled='true';

 // Capture階段先判斷設備，避免平移與縮放搶走事件。
 svg.addEventListener('pointerdown',event=>{
  const element=findPlanItemElement(event.target);
  if(!element)return;
  beginPlanDrag(event);
 },true);

 svg.addEventListener('pointermove',event=>{
  if(planDrag)updatePlanDrag(event);
 },true);

 svg.addEventListener('pointerup',event=>{
  if(planDrag)endPlanDrag(event,false);
 },true);

 svg.addEventListener('pointercancel',event=>{
  if(planDrag)endPlanDrag(event,true);
 },true);
}


function renderInspector(){
 try{commitSelectedMeshTransform({source:'before-inspector-render',render:false});}catch(_){}
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
   <label class="checkbox-field"><input id="showModuleStand" type="checkbox" ${p.showStand!==false?'checked':''}> 保留設備支架（關閉＝刪除支架）</label>
   <label class="checkbox-field"><input id="itemCollisionEnabled" type="checkbox" ${p.collisionEnabled!==false?'checked':''}> 物體碰撞</label>
   <label class="checkbox-field lock-field"><input id="positionLocked" type="checkbox" ${p.positionLocked?'checked':''}> 固定設備位置，禁止拖移</label></section>
   <section class="field-group"><h3>快速方向</h3><div class="button-row">${[0,90,180,270].map(v=>`<button data-rot="${v}">${v}°</button>`).join('')}</div></section>
   </div>`;
 }else if(state.activeTab==='dimensions'){
   const dimensions=getItemRealDimensions(i);
   box.innerHTML=`<div class="form-grid">
    <section class="field-group">
     <h3>設備實體尺寸</h3>
     <div class="precise-dimension-grid">
      <label>寬度 X（m）
       <input id="dimensionWidth" type="number" min=".01" max="100" step=".01" value="${dimensions.width.toFixed(2)}">
      </label>
      <label>深度 Z（m）
       <input id="dimensionDepth" type="number" min=".01" max="100" step=".01" value="${dimensions.depth.toFixed(2)}">
      </label>
      <label>高度 Y（m）
       <input id="dimensionHeight" type="number" min=".01" max="100" step=".01" value="${dimensions.height.toFixed(2)}">
      </label>
     </div>
     <div class="precise-dimension-actions">
      <button id="applyPreciseDimensions" type="button">套用尺寸</button>
      <button id="readModelDimensions" type="button">讀取目前3D模型</button>
      <button id="restoreDefaultDimensions" type="button">恢復預設尺寸</button>
     </div>
     <small class="dimension-source-note" id="dimensionSourceLabel">
      尺寸來源：${dimensionSourceText(dimensions.source)}
     </small>
    </section>
    <section class="field-group">
     <h3>同步說明</h3>
     <p>修改後會立即更新2D圖形、選取框與專案資料。</p>
     <p>${i.type==='shutter'?'鐵捲門會依寬度、高度與深度同步重建3D外觀。':'一般設備只更新真實尺寸資料，不任意拉伸3D外觀。'}</p>
    </section>
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
       <label class="checkbox-field"><input id="barrierSafetyAutoClose" type="checkbox" ${p.safetyAutoCloseEnabled!==false?'checked':''}> 防砸解除後自動關閉</label>
       <label>防砸解除後等待（秒）<input id="barrierSafetyCloseSeconds" type="number" min="0" max="999" step="1" value="${Number(p.safetyAutoCloseSeconds??5)}"></label>
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
       <label class="checkbox-field"><input id="shutterSafetyAutoClose" type="checkbox" ${p.safetyAutoCloseEnabled!==false?'checked':''}> 防壓解除後自動關門</label>
       <label>防壓解除後等待（秒）<input id="shutterSafetyCloseDelay" type="number" min="0" max="999" step="1" value="${Number(p.safetyCloseDelaySeconds??5)}"></label>
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
     <label class="checkbox-field"><input id="showModuleStand" type="checkbox" ${p.showStand!==false?'checked':''}> 保留支架（關閉＝刪除）</label>
    </section></div>`;
   }else if(i.type==='timer'){
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>倒數計時參數</h3>
     <label>設定秒數<input id="timerSeconds" type="number" min="1" max="999" value="${p.seconds}"></label>
     <label>剩餘秒數<input value="${Math.ceil(p.remaining)}" disabled></label>
     <label>安裝高度<input value="${Number(i.y||0).toFixed(1)} m" disabled></label>
     <label class="checkbox-field"><input id="showModuleStand" type="checkbox" ${p.showStand!==false?'checked':''}> 保留支架（關閉＝刪除）</label>
    </section></div>`;
   }else if(i.type==='loop'){
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>地感線圈參數</h3><label>寬度（m）<input id="loopWidth" type="number" step="any" inputmode="decimal" value="${p.width}"></label><label>長度（m）<input id="loopLength" type="number" step="any" inputmode="decimal" value="${p.length}"></label><small class="dimension-help">可輸入任意大於 0 的尺寸</small></section></div>`;
   }else if(i.type==='infrared'){
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>紅外線對射參數</h3><label>兩台距離（m）<input id="irDistance" type="number" min="1" max="20" step=".1" value="${p.distance}"></label><label class="checkbox-field"><input id="irShowBeam" type="checkbox" ${p.showBeam!==false?'checked':''}>顯示光束</label><label class="checkbox-field"><input id="showModuleStand" type="checkbox" ${p.showStand!==false?'checked':''}> 保留支架（關閉＝刪除）</label></section></div>`;
   }else if(i.type==='uhf'){
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>UHF／eTag參數</h3><label>讀取距離（m）<input id="uhfDistance" type="number" min="1" max="15" step=".5" value="${p.readDistance}"></label><label>模擬標籤<input id="uhfTag" value="${p.lastTag}"></label><label class="checkbox-field"><input id="showModuleStand" type="checkbox" ${p.showStand!==false?'checked':''}> 保留支架（關閉＝刪除）</label></section></div>`;
   }else if(i.type==='cardreader'){
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>車道卡機參數</h3><label>狀態<input value="${p.state}" disabled></label><label class="checkbox-field"><input id="showModuleStand" type="checkbox" ${p.showStand!==false?'checked':''}> 保留支架（關閉＝刪除）</label></section></div>`;
   }else if(i.type==='ledpanel'){
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>紅綠燈倒數參數</h3><label>設定秒數<input id="ledSeconds" type="number" min="1" max="999" value="${p.seconds}"></label><label>預設燈號<select id="ledMode"><option value="red" ${p.mode==='red'?'selected':''}>紅燈</option><option value="green" ${p.mode==='green'?'selected':''}>綠燈</option><option value="off" ${p.mode==='off'?'selected':''}>全關</option></select></label><label class="checkbox-field"><input id="ledBlink" type="checkbox" ${p.blinkLastFive?'checked':''}>最後五秒閃爍</label><label class="checkbox-field"><input id="ledBuzzer" type="checkbox" ${p.buzzerLastFive?'checked':''}>最後五秒蜂鳴</label><label class="checkbox-field"><input id="showModuleStand" type="checkbox" ${p.showStand!==false?'checked':''}> 保留支架（關閉＝刪除）</label></section></div>`;
   }else if(i.type==='lpr'){
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>車牌辨識參數</h3><label>模擬車牌<input id="lprPlate" value="${p.plate}"></label><label>信心值（%）<input id="lprConfidence" type="number" min="0" max="100" value="${p.confidence}"></label><label class="checkbox-field"><input id="showModuleStand" type="checkbox" ${p.showStand!==false?'checked':''}> 保留支架（關閉＝刪除）</label></section></div>`;
   }else if(i.type==='directionrecognizer'){
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>LK-121 方向辨識器</h3>
     <label>觸發接點<select id="dirContact"><option value="NO" ${p.contact==='NO'?'selected':''}>NO 常開</option><option value="NC" ${p.contact==='NC'?'selected':''}>NC 常閉</option></select></label>
     <label>觸發邊緣<select id="dirTriggerEdge"><option value="FRONT" ${p.triggerEdge==='FRONT'?'selected':''}>方向前緣觸發</option><option value="REAR" ${p.triggerEdge==='REAR'?'selected':''}>方向後緣觸發</option></select></label>
     <label>偵測時間<select id="dirDetectSeconds">${[1,2,3,4].map(v=>`<option value="${v}" ${Number(p.detectSeconds)===v?'selected':''}>${v} 秒</option>`).join('')}</select></label>
     <label>使用電源<input value="DC12V" disabled></label><label>消耗電流<input value="40mA" disabled></label><label>輸出<input value="Relay 乾接點" disabled></label>
     <small>模擬設計：DI1=A感應、DI2=B感應；A→B 判定正向，B→A 判定反向。前緣模式辨識完成即輸出；後緣模式等待 CLEAR 後輸出。</small>
    </section><section class="field-group"><h3>目前狀態</h3><label>狀態<input value="${p.state}" disabled></label><label>最近方向<input value="${p.lastDirection==='FORWARD'?'A→B':p.lastDirection==='REVERSE'?'B→A':'尚未辨識'}" disabled></label><label>外型尺寸<input value="183W × 108L × 38D mm" disabled></label></section></div>`;
   }else if(DELAY_CONTROL_TYPES.has(i.type)){
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>延遲控制參數</h3><label>延遲秒數<input id="controlDelaySeconds" type="number" min="1" max="999" step="1" value="${p.delaySeconds}"></label><label>目前狀態<input value="${p.state}" disabled></label><label>剩餘秒數<input value="${Number(p.remaining||0).toFixed(1)}" disabled></label></section></div>`;
   }else if(SIGNAL_HOST_TYPES.has(i.type)){
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>號誌主機參數</h3><label>動作秒數<input id="signalIntervalSeconds" type="number" min="1" max="999" step="1" value="${p.intervalSeconds}"></label><label>目前模式<input value="${p.mode}" disabled></label><label>控制方向<input value="${i.type==='signal3way'?'三向':'雙向'}" disabled></label></section></div>`;
     }else if(OBJECT_TYPES.has(i.type)){
    const rd=p.realDimensions||{};
    if(isDrivableVehicle(i)){
     ensureVehicleDriveParams(i);
     box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>車輛行駛參數</h3><label>車輛種類<input value="${d.name}" disabled></label><label class="checkbox-field"><input id="vehicleDriveEnabled" type="checkbox" ${p.driveEnabled!==false?'checked':''}> 開啟行駛控制</label><label>速度（m/s）<input id="vehicleDriveSpeed" type="number" min="0.1" max="30" step="0.1" value="${Number(p.driveSpeed||3)}"></label><label>轉向速度（°/s）<input id="vehicleSteerRate" type="number" min="5" max="180" step="1" value="${Number(p.steerRate||55)}"></label><small>方向鍵／WASD：場景只要有汽車或摩托車即可直接操控，不必先選取；按住前進／後退與轉向，放開前進／後退即停止；Space：停止；V：多台車時切換駕駛目標。車輛進入地感線圈或遮斷紅外線時會自動觸發感應模組。</small></section><section class="field-group"><h3>駕駛控制</h3><div class="button-row"><button data-input="driveForward">前進</button><button data-input="driveReverse">後退</button><button data-input="driveLeft">左轉</button><button data-input="driveStraight">回正</button><button data-input="driveRight">右轉</button><button data-input="driveStop">停止</button></div><small>目前：${p.moving?(p.driveDirection===-1?'倒車':'前進'):'停止'}｜轉向：${p.steerInput<0?'左':p.steerInput>0?'右':'直行'}</small></section></div>`;
    }else box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>場景物件</h3><label>物件種類<input value="${d.name}" disabled></label><label>用途<input value="非弱電設備／場景建模" disabled></label><small>尺寸請至「尺寸」頁籤調整；位置、角度與高度在「屬性」調整。</small></section></div>`;
   }else{
    box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>繼電器參數</h3>
     <label>預設狀態<select id="relayDefault"><option value="off" ${!p.on?'selected':''}>釋放</option><option value="on" ${p.on?'selected':''}>吸合</option></select></label>
     <label>安裝高度<input value="${Number(i.y||0).toFixed(1)} m" disabled></label>
    </section></div>`;
   }
 }else if(state.activeTab==='controls'){
   const controls=i.type==='barrier'?[['open','開啟'],['stop','停止'],['close','關閉'],['safety','防砸'],['reset','復歸']]:i.type==='shutter'?[['open','開門'],['stop','停止'],['close','關門'],['safety','防壓觸發'],['autoClose','自動關門'],['reset','復歸']]:i.type==='traffic'?[['red','紅燈'],['green','綠燈'],['off','全關']]:i.type==='timer'?[['start','開始'],['pause','暫停'],['reset','重設']]:i.type==='loop'?[['vehicle','車輛進入'],['clear','車輛離開']]:i.type==='infrared'?[['blocked','遮斷'],['clear','恢復']]:i.type==='uhf'?[['read','讀取標籤'],['clear','清除']]:i.type==='cardreader'?[['valid','有效卡'],['invalid','無效卡'],['clear','清除']]:i.type==='ledpanel'?[['red','紅燈'],['green','綠燈'],['start','開始倒數'],['reset','重設'],['off','全關']]:i.type==='lpr'?[['valid','有效車牌'],['invalid','無效車牌'],['clear','清除']]
   :i.type==='beacon'?[['on','開啟'],['flash','閃爍'],['off','關閉'],['reset','復歸']]
   :i.type==='bollard'?[['raise','升起'],['stop','停止'],['lower','下降']]
   :i.type==='intercom'?[['call','呼叫'],['answer','接聽'],['hangup','掛斷']]
   :i.type==='ipcamera'?[['motion','移動觸發'],['alarm','警報輸入'],['reset','清除']]
   :i.type==='controller'?[['lock','門鎖輸出'],['alarm','警報輸出'],['buzzer','蜂鳴器'],['reset','復歸']]
   :i.type==='poeswitch'?[['power','電源測試'],['uplink','上行連線'],['portAlarm','埠異常'],['reset','重啟']]
   :i.type==='powersupply'?[['remoteOn','啟動'],['fault','故障測試'],['reset','復歸']]
   :i.type==='delaytimer'?[['start','開始計時'],['stop','停止'],['reset','復歸']]
   :i.type==='poweroffdelay'?[['start','開始計時'],['stop','停止'],['reset','復歸']]
   :i.type==='powerondelay'?[['start','開始計時'],['stop','停止'],['reset','復歸']]
   :i.type==='signal2way'?[['laneA','A向動作'],['laneB','B向動作'],['allGreen','全綠待命'],['auto','自動待命'],['reset','復歸']]
   :i.type==='signal3way'?[['laneA','A向動作'],['laneB','B向動作'],['laneC','C向動作'],['allGreen','全綠待命'],['auto','自動待命'],['reset','復歸']]
   :i.type==='directionrecognizer'?[['sensorA','A感應'],['sensorB','B感應'],['forwardTest','模擬 A→B'],['reverseTest','模擬 B→A'],['clear','清除／後緣'],['reset','復歸']]
   :i.type==='loopdetector'?[['vehicle','車輛進入'],['clear','車輛離開'],['pulse','脈衝測試'],['fault','線圈故障'],['reset','重新校正']]
   :i.type==='radar'?[['vehicle','車輛接近'],['person','人員進入'],['depart','車輛離開'],['disable','啟用／停用'],['reset','復歸']]
   :i.type==='estop'?[['press','按下急停'],['release','旋轉解除'],['reset','確認復歸'],['wireFault','模擬斷線']]
   :i.type==='laneindicator'?[['left','左轉'],['right','右轉'],['straight','直行'],['stop','紅叉禁止'],['flash','閃爍'],['off','關閉']]
   :i.type==='parkingdisplay'?[['vehicleIn','車輛進入'],['vehicleOut','車輛離開'],['full','滿位'],['available','尚有車位'],['reset','復歸']]
   :i.type==='heightbar'?[['normal','正常車輛'],['overheight','超高車輛'],['clear','清除警報'],['reset','復歸']]
   :isDrivableVehicle(i)?[['driveForward','前進'],['driveReverse','後退'],['driveLeft','左轉'],['driveStraight','回正'],['driveRight','右轉'],['driveStop','停止']]
   :OBJECT_TYPES.has(i.type)?[]
   :[['on','吸合'],['off','釋放']];
   box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>設備控制</h3><div class="button-row">${controls.map(x=>`<button data-input="${x[0]}">${x[1]}</button>`).join('')}</div></section><section class="field-group"><h3>目前狀態</h3><p>${statusText(i)}</p></section></div>`;
 }else{
   box.innerHTML=`<div class="form-grid"><section class="field-group"><h3>DI 輸入</h3>${d.di.map(x=>`<div class="io-row"><b>${x[0]}</b><span>${x[1]}</span><button data-input="${x[2]}">觸發</button></div>`).join('')}</section>
   <section class="field-group"><h3>DO 輸出</h3>${d.do.map(x=>`<div class="io-row"><b>${x[0]}</b><span>${x[1]}</span><i class="lamp ${out[x[2]]?'on':''}"></i></div>`).join('')}</section></div>`;
 }
 bindInspector(i);
 renderQuick(i);
}
function statusText(i){const p=i.params;if(i.type==='barrier')return`狀態：${p.state}<br>桿子角度：${p.angle.toFixed(1)}°<br>防砸：${p.safetyActive?'觸發保持':'正常'}`;if(i.type==='shutter')return`狀態：${p.state}<br>開度：${Math.round((Number(p.doorProgress)||0)*100)}%<br>剩餘：${Number(p.motionRemainingSeconds||0).toFixed(1)}秒<br>開門／關門：${p.openDurationSeconds}秒／${p.closeDurationSeconds}秒<br>自動關門：${p.autoCloseEnabled?'啟用':'關閉'}（等待${p.closeDelaySeconds}秒）<br>防壓：${p.safetyActive?'觸發':'正常'}`;if(i.type==='traffic')return`目前燈號：${p.mode}`;if(i.type==='timer')return`剩餘：${Math.ceil(p.remaining)} 秒<br>狀態：${p.state}`;if(i.type==='loop')return`車輛偵測：${p.detected?'有車':'無車'}`;if(i.type==='infrared')return`對射：${p.blocked?'遮斷':'正常'}｜${p.distance}m`;if(i.type==='uhf')return`讀取：${p.detected?'成功':'待機'}<br>${p.lastTag}`;if(i.type==='cardreader')return`卡機：${p.state}`;if(i.type==='ledpanel')return`燈號：${p.mode}<br>剩餘：${Math.ceil(p.remaining)}秒`;if(i.type==='lpr')return`辨識：${p.state}<br>${p.plate}`;
if(isDrivableVehicle(i)){ensureVehicleDriveParams(i);return`行駛：${p.moving?(p.driveDirection===-1?'倒車':'前進'):'停止'}<br>速度：${Number(p.driveSpeed||0).toFixed(1)} m/s<br>轉向：${p.steerInput<0?'左':p.steerInput>0?'右':'直行'}`;}
if(i.type==='beacon')return`警示燈：${p.on?(p.flash?'閃爍':'開啟'):'關閉'}`;
if(i.type==='bollard')return`防撞柱：${p.raised?'升起':'下降'}`;
if(i.type==='intercom')return`對講機：${p.talking?'通話中':p.calling?'呼叫中':'待機'}`;
if(i.type==='ipcamera')return`攝影機：${p.online?'Online':'Offline'}<br>移動：${p.motion?'觸發':'正常'}`;
if(i.type==='controller')return`控制器：${p.online?'Online':'Offline'}<br>門鎖：${p.lock?'ON':'OFF'}`;
if(i.type==='poeswitch')return`PoE：${p.online?'Online':'Offline'}<br>上行：${p.uplink?'連線':'未連線'}`;
if(i.type==='delaytimer')return`延遲計時：${p.state}<br>剩餘：${Number(p.remaining||0).toFixed(1)}秒<br>輸出：${p.output?'ON':'OFF'}`;
if(i.type==='poweroffdelay')return`斷電延時：${p.state}<br>電源：${p.power?'ON':'OFF'}｜輸出：${p.output?'ON':'OFF'}<br>剩餘：${Number(p.remaining||0).toFixed(1)}秒`;
if(i.type==='powerondelay')return`通電延時：${p.state}<br>電源：${p.power?'ON':'OFF'}｜輸出：${p.output?'ON':'OFF'}<br>剩餘：${Number(p.remaining||0).toFixed(1)}秒`;
if(i.type==='signal2way')return`雙向號誌：${p.mode}<br>自動待命：${p.auto?'啟用':'關閉'}｜${p.intervalSeconds}秒`;
if(i.type==='signal3way')return`三向號誌：${p.mode}<br>自動待命：${p.auto?'啟用':'關閉'}｜${p.intervalSeconds}秒`;
if(i.type==='powersupply')return`電源：${p.on?'ON':'OFF'}<br>故障：${p.fault?'YES':'NO'}`;
if(i.type==='loopdetector')return`地感檢知器：${p.fault?'故障':p.vehicle?'有車':'待機'}<br>模式：${p.mode}`;
if(i.type==='directionrecognizer')return`方向辨識器：${p.state}<br>最近方向：${p.lastDirection==='FORWARD'?'A→B':p.lastDirection==='REVERSE'?'B→A':'尚未辨識'}｜接點：${p.contact}`;
if(i.type==='radar')return`雷達：${p.enabled?'啟用':'停用'}<br>${p.vehicle?'車輛':p.person?'人員':'無目標'}｜${p.direction}`;
if(i.type==='estop')return`急停：${p.pressed||p.wireFault?'STOP':'READY'}<br>等待復歸：${p.resetRequired?'是':'否'}`;
if(i.type==='laneindicator')return`方向顯示：${p.mode}<br>閃爍：${p.flashing?'開':'關'}`;
if(i.type==='parkingdisplay')return`剩餘車位：${p.available}／${p.total}<br>${p.available<=0?'滿位':'尚有車位'}`;
if(i.type==='heightbar')return`限高：${p.heightLimit}m<br>${p.overheight?'超高警報':'正常'}`;
if(OBJECT_TYPES.has(i.type))return`場景物件：${defs[i.type]?.name||i.type}<br>物體碰撞：${scenePhysicsSettings.collisionEnabled!==false&&i.params?.collisionEnabled!==false?'開啟':'關閉'}`;
return`繼電器：${p.on?'ON':'OFF'}`}
function applyInspectorTransformPatch(item,patch,reason){
 if(!item)return;
 const current=readWorldTransform(item)||normalizeWorldTransform({});
 const next=normalizeWorldTransform({...current,...patch});
 const writeResult=writeWorldTransform(item,next,{refresh:false,record:false,source:reason});
 if(!writeResult?.ok)return false;
 item.params=item.params||{};
 item.params.rotation=next.rotationY;
 updateItemTransformOnly(item,{reason,plan:true,quick:false});
}
function bindInspector(i){
 const p=i.params;
 document.querySelectorAll('[data-input]').forEach(b=>b.onclick=()=>input(i,b.dataset.input));
 if($('controlDelaySeconds'))$('controlDelaySeconds').oninput=e=>{p.delaySeconds=Math.max(1,Number(e.target.value)||1);markDirty()};
 if($('signalIntervalSeconds'))$('signalIntervalSeconds').oninput=e=>{p.intervalSeconds=Math.max(1,Number(e.target.value)||1);if(p.state!=='TIMING')p.remaining=p.intervalSeconds;markDirty()};
 document.querySelectorAll('[data-rot]').forEach(b=>b.onclick=()=>{
 const rotation=Number(b.dataset.rot)||0;
 p.rotation=rotation;
 applyInspectorTransformPatch(i,{rotationY:rotation},'quick-rotation');
 if($('fRot'))$('fRot').value=String(rotation);
});
 if($('fName'))$('fName').oninput=e=>{
 i.name=e.target.value;
 updateItemLabelOnly(i);
};
 if($('fX'))$('fX').oninput=e=>{
 const bounds=activeSceneBounds();
 const x=clampNumber(e.currentTarget.value,bounds.minX,bounds.maxX);
 applyInspectorTransformPatch(i,{x},'property-x');
 e.currentTarget.value=x.toFixed(2);
};
 const setHeight=value=>{
  const range=getSceneHeightRange();
  const y=normalizeHeight(value,range.min,range.max);
  i.params.installationHeight=y;

  if(hasSceneHeightProvider()){
   const ground=getGroundHeightAt(i.x,i.z);
   i.params.groundHeight=ground;
   i.params.groundOffset=y-ground;
  }
  // 使用者手動設定 Y 後改為固定安裝高度，避免場景貼地同步把高度拉回地面。
  i.params.followGround=false;
  i.params.manualHeight=true;

  applyInspectorTransformPatch(i,{y},'property-height');

  if($('fY'))$('fY').value=y.toFixed(1);
  if($('heightRange'))$('heightRange').value=y;
 };
 if($('fY'))$('fY').oninput=e=>setHeight(e.target.value);
 if($('heightRange'))$('heightRange').oninput=e=>setHeight(e.target.value);
 if($('heightDown'))$('heightDown').onclick=()=>setHeight(i.y-.1);
 if($('heightUp'))$('heightUp').onclick=()=>setHeight(i.y+.1);
 if($('fZ'))$('fZ').oninput=e=>{
 const bounds=activeSceneBounds();
 const z=clampNumber(e.currentTarget.value,bounds.minZ,bounds.maxZ);
 applyInspectorTransformPatch(i,{z},'property-z');
 e.currentTarget.value=z.toFixed(2);
};
 if($('fRot'))$('fRot').oninput=e=>{
 const rotation=((Number(e.target.value)||0)%360+360)%360;
 p.rotation=rotation;
 applyInspectorTransformPatch(i,{rotationY:rotation},'property-rotation');
};
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
  rebuildItemGeometryOnly(i,{reason:'stand-keep-remove'});
  applyPartsVisibility(i);
  schedulePlanRender('stand-keep-remove');
  const status=$('statusText');if(status)status.textContent=`設備支架：${p.showStand!==false?'保留':'已刪除'}`;
  markDirty();
 };
 if($('itemCollisionEnabled'))$('itemCollisionEnabled').onchange=e=>{
  p.collisionEnabled=e.currentTarget.checked;
  const status=$('statusText');if(status)status.textContent=`${i.name||defs[i.type]?.name||'模組'} 物體碰撞：${p.collisionEnabled!==false?'開啟':'關閉'}`;
  markDirty();
 };
 if($('armLen'))$('armLen').onchange=e=>{
 p.armLength=Number(e.target.value)||4;
 rebuildItemGeometryOnly(i,{reason:'barrier-arm-length'});
};
 if($('armSide'))$('armSide').onchange=e=>{
 p.armSide=e.target.value;
 rebuildItemGeometryOnly(i,{reason:'barrier-arm-side'});
};
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
 if($('barrierSafetyAutoClose'))$('barrierSafetyAutoClose').onchange=e=>{
  p.safetyAutoCloseEnabled=e.currentTarget.checked;
  if(!p.safetyAutoCloseEnabled)cancelBarrierAutoClose(i);
  else if(!p.safetyActive&&p.state==='OPEN')scheduleBarrierSafetyClose(i);
  markDirty();
 };
 if($('barrierSafetyCloseSeconds'))$('barrierSafetyCloseSeconds').onchange=e=>{
  p.safetyAutoCloseSeconds=Math.max(0,Math.min(999,Number(e.currentTarget.value)||0));
  e.currentTarget.value=String(p.safetyAutoCloseSeconds);
  if(p.safetyAutoCloseEnabled&&!p.safetyActive&&p.state==='OPEN')scheduleBarrierSafetyClose(i);
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
 if($('shutterSafetyAutoClose'))$('shutterSafetyAutoClose').onchange=e=>{
  p.safetyAutoCloseEnabled=e.currentTarget.checked;
  if(!p.safetyAutoCloseEnabled)cancelShutterAutoClose(i);
  else if(!p.safetyActive&&p.state==='OPEN')scheduleShutterSafetyClose(i);
  markDirty();
 };
 if($('shutterSafetyCloseDelay'))$('shutterSafetyCloseDelay').onchange=e=>{
  p.safetyCloseDelaySeconds=Math.max(0,Math.min(999,Number(e.currentTarget.value)||0));
  e.currentTarget.value=String(p.safetyCloseDelaySeconds);
  if(p.safetyAutoCloseEnabled&&!p.safetyActive&&p.state==='OPEN')scheduleShutterSafetyClose(i);
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

 rebuildItemGeometryOnly(i,{
  reason:'timer-seconds',
  quick:false
 });
 renderQuick(i);
 refreshTimerInspectorStatus(i);
};
 if($('trafficMode'))$('trafficMode').onchange=e=>{
 p.mode=e.target.value;
 rebuildItemGeometryOnly(i,{reason:'traffic-mode'});
};
 if($('relayDefault'))$('relayDefault').onchange=e=>{
 p.on=e.target.value==='on';
 rebuildItemGeometryOnly(i,{reason:'relay-default'});
};
 const updateLoopDimension=(field,input)=>{
  const value=Number(input.value);
  if(!Number.isFinite(value)||value<=0){
   input.setCustomValidity('請輸入大於 0 的數字');
   return;
  }
  input.setCustomValidity('');
  p[field]=value;
  rebuildItemGeometryOnly(i,{
   reason:`loop-${field}`,
   quick:true
  });
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
 if($('dirContact'))$('dirContact').onchange=e=>{p.contact=e.currentTarget.value;markDirty();};
 if($('dirTriggerEdge'))$('dirTriggerEdge').onchange=e=>{p.triggerEdge=e.currentTarget.value;resetDirectionRecognizerRuntime(i,{keepLast:true});rebuildItemGeometryOnly(i,{reason:'direction-edge'});markDirty();};
 if($('dirDetectSeconds'))$('dirDetectSeconds').onchange=e=>{p.detectSeconds=Math.max(1,Math.min(4,Number(e.currentTarget.value)||2));markDirty();};
 if($('vehicleDriveEnabled'))$('vehicleDriveEnabled').onchange=e=>{p.driveEnabled=e.currentTarget.checked;if(!p.driveEnabled){p.moving=false;p.steerInput=0;}markDirty();};
 if($('vehicleDriveSpeed'))$('vehicleDriveSpeed').onchange=e=>{p.driveSpeed=Math.max(.1,Math.min(30,Number(e.currentTarget.value)||3));e.currentTarget.value=String(p.driveSpeed);markDirty();};
 if($('vehicleSteerRate'))$('vehicleSteerRate').onchange=e=>{p.steerRate=Math.max(5,Math.min(180,Number(e.currentTarget.value)||55));e.currentTarget.value=String(p.steerRate);markDirty();};
 if($('applyPreciseDimensions'))$('applyPreciseDimensions').onclick=()=>{
  const dimensions=normalizeRealDimensions({
   width:$('dimensionWidth').value,
   depth:$('dimensionDepth').value,
   height:$('dimensionHeight').value
  });
  if(!dimensions){
   $('statusText').textContent='尺寸必須大於0，三個欄位都要填寫';
   return;
  }
  const result=applyRealDimensionsToItem(i,dimensions,'manual');
  $('dimensionSourceLabel').textContent='尺寸來源：手動設定';
  $('statusText').textContent=result
   ?`已更新 ${i.name||i.type}：寬 ${dimensions.width.toFixed(2)}m／高 ${dimensions.height.toFixed(2)}m／深 ${dimensions.depth.toFixed(2)}m`
   :'尺寸更新失敗，請重新選取設備後再試';
 };
 if($('readModelDimensions'))$('readModelDimensions').onclick=()=>{
  const dimensions=readPhysicalModelDimensions(i);
  if(!dimensions){
   $('statusText').textContent='無法讀取此設備的3D實體尺寸';
   return;
  }
  $('dimensionWidth').value=dimensions.width.toFixed(2);
  $('dimensionDepth').value=dimensions.depth.toFixed(2);
  $('dimensionHeight').value=dimensions.height.toFixed(2);
  $('dimensionSourceLabel').textContent='尺寸來源：剛讀取的3D模型，尚未套用';
 };
 if($('restoreDefaultDimensions'))$('restoreDefaultDimensions').onclick=()=>{
  const result=restoreDefaultRealDimensions(i);
  if(result){
   const dimensions=getItemRealDimensions(i);
   $('dimensionWidth').value=dimensions.width.toFixed(2);
   $('dimensionDepth').value=dimensions.depth.toFixed(2);
   $('dimensionHeight').value=dimensions.height.toFixed(2);
   $('dimensionSourceLabel').textContent=`尺寸來源：${dimensionSourceText(dimensions.source)}`;
   $('statusText').textContent=`已恢復 ${i.name||i.type} 的預設尺寸`;
  }
 };
 ['dimensionWidth','dimensionDepth','dimensionHeight'].forEach(id=>{
  if($(id))$(id).onkeydown=event=>{
   if(event.key==='Enter'){
    event.preventDefault();
    $('applyPreciseDimensions')?.click();
   }
  };
 });
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
 else if(i.type==='shutter')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="open">開門</button><button data-q="stop">停止</button><button data-q="close">關門</button><button data-q="safety">防壓測試</button><button data-q="reset">復歸</button></div><div class="status-box">${statusText(i)}</div>`;
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
 else if(i.type==='directionrecognizer')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="sensorA">A感應</button><button data-q="sensorB">B感應</button><button data-q="forwardTest">A→B</button><button data-q="reverseTest">B→A</button><button data-q="clear">清除／後緣</button><button data-q="reset">復歸</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='loopdetector')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="vehicle">車輛進入</button><button data-q="clear">車輛離開</button><button data-q="pulse">脈衝</button><button data-q="fault">故障</button><button data-q="reset">校正</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='radar')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="vehicle">車輛接近</button><button data-q="person">人員</button><button data-q="depart">離開</button><button data-q="disable">啟停</button><button data-q="reset">復歸</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='estop')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="press">按下急停</button><button data-q="release">旋轉解除</button><button data-q="reset">確認復歸</button><button data-q="wireFault">斷線測試</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='laneindicator')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="left">左轉</button><button data-q="right">右轉</button><button data-q="straight">直行</button><button data-q="stop">紅叉</button><button data-q="flash">閃爍</button><button data-q="off">關閉</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='parkingdisplay')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="vehicleIn">進車</button><button data-q="vehicleOut">出車</button><button data-q="full">滿位</button><button data-q="available">尚有車位</button><button data-q="reset">復歸</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='heightbar')$('quickContent').innerHTML=`<div class="quick-buttons"><button data-q="normal">正常車輛</button><button data-q="overheight">超高車輛</button><button data-q="clear">清除警報</button><button data-q="reset">復歸</button></div><div class="status-box">${statusText(i)}</div>`;
 else if(i.type==='signal2way'||i.type==='signal3way'){
   const c=i.type==='signal3way'?'<button data-q="laneC">C向動作</button>':'';
   $('quickContent').innerHTML=`<div class="signal-quick-seconds"><label>動作秒數 <input id="quickSignalSeconds" type="number" min="1" max="999" step="1" value="${Math.max(1,Number(i.params.intervalSeconds)||10)}"> 秒</label></div><div class="quick-buttons signal-controller-actions"><button data-q="laneA">A向動作</button><button data-q="laneB">B向動作</button>${c}<button data-q="allGreen">全綠待命</button><button data-q="auto">自動待命</button><button data-q="reset">復歸</button></div><div class="status-box">${statusText(i)}</div>`;
   const sec=$('quickSignalSeconds');if(sec)sec.onchange=e=>{i.params.intervalSeconds=Math.max(1,Math.min(999,Number(e.target.value)||10));if(i.params.state!=='TIMING')i.params.remaining=i.params.intervalSeconds;renderInspector();rebuildItemGeometryOnly(i,{reason:'signal-seconds'});markDirty();};
 }
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




const WORLD_ENGINE_VERSION='5.1.0';

const worldState={
 units:'meter',
 scale:1,
 revision:0,
 lastSyncAt:0,
 bounds:{
  minX:-18,
  maxX:18,
  minY:-10,
  maxY:20,
  minZ:-45,
  maxZ:45
 }
};

function finiteNumber(value,fallback=0){
 const number=Number(value);
 return Number.isFinite(number)?number:fallback;
}

function normalizeWorldTransform(input={}){
 return {
  x:finiteNumber(input.x,0),
  y:finiteNumber(input.y,0),
  z:finiteNumber(input.z,0),
  rotationY:finiteNumber(
   input.rotationY??input.rotation??input.ry,
   0
  ),
  scale:Math.max(
   .01,
   finiteNumber(input.scale,1)
  )
 };
}

function ensureItemWorldTransform(item){
 if(!item)return null;

 const current=item.worldTransform||
  item.transform||
  {
   x:item.x,
   y:item.y,
   z:item.z,
   rotationY:item.rotationY??item.rotation??item.ry,
   scale:item.scale
  };

 const transform=normalizeWorldTransform(current);
 item.worldTransform=transform;

 item.x=transform.x;
 item.y=transform.y;
 item.z=transform.z;
 item.rotationY=transform.rotationY;
 item.scale=transform.scale;

 return transform;
}

function readWorldTransform(item){
 const transform=ensureItemWorldTransform(item);
 return transform?{...transform}:null;
}

function itemPhysicsDimensions(item){
 try{
  const d=getItemRealDimensions(item)||{};
  return {width:Math.max(.05,Number(d.width)||.5),height:Math.max(.03,Number(d.height)||.5),depth:Math.max(.05,Number(d.depth)||.5)};
 }catch(_){
  const d=item?.params?.realDimensions||{};
  return {width:Math.max(.05,Number(d.width)||.5),height:Math.max(.03,Number(d.height)||.5),depth:Math.max(.05,Number(d.depth)||.5)};
 }
}
function itemCollisionEnabled(item){
 return item?.params?.collisionEnabled!==false;
}
function transformsOverlap(a,at,b,bt){
 const ad=itemPhysicsDimensions(a),bd=itemPhysicsDimensions(b),gap=.015;
 const ax=at.x,az=at.z,ay=at.y, bx=bt.x,bz=bt.z,by=bt.y;
 return Math.abs(ax-bx)<(ad.width+bd.width)/2-gap && Math.abs(az-bz)<(ad.depth+bd.depth)/2-gap && ay < by+bd.height-gap && ay+ad.height-gap > by;
}
function vehicleWorldHalfExtents(item,transform){
 const d=itemPhysicsDimensions(item);
 const r=THREE.MathUtils.degToRad(Number(transform?.rotationY??item?.params?.rotation??0)||0);
 const c=Math.abs(Math.cos(r)),s=Math.abs(Math.sin(r));
 return {
  x:c*d.width/2+s*d.depth/2,
  z:s*d.width/2+c*d.depth/2,
  height:d.height
 };
}
function shutterHasPhysicalCollision(shutter){
 if(!shutter||shutter.type!=='shutter')return true;
 const stateName=String(shutter.params?.state||'').toUpperCase();
 // V5.1.3.50：鐵捲門全開後整個模組取消實體碰撞；
 // OPENING / CLOSING / CLOSED / STOPPED 等狀態仍視為實體。
 return stateName!=='OPEN';
}

function vehicleCanPassOpenShutter(vehicle,vt,shutter,st){
 if(!isDrivableVehicle(vehicle)||shutter?.type!=='shutter')return false;
 const p=shutter.params||{};
 const dims=itemPhysicsDimensions(shutter);
 const postWidth=Math.min(.28,Math.max(.10,dims.width*.055));
 const topHeight=Math.min(.38,Math.max(.18,dims.height*.10));
 const openingWidth=Math.max(.65,dims.width-postWidth*2);
 const openingHeight=Math.max(.65,dims.height-topHeight);

 // 舊專案或外部連動有時只更新 state=OPEN，doorProgress 仍殘留舊值。
 // 碰撞層必須與畫面看到的門狀態一致：OPEN 一律視為 100% 開啟。
 const stateName=String(p.state||'').toUpperCase();
 let progress=Math.max(0,Math.min(1,Number(p.doorProgress)||0));
 if(stateName==='OPEN')progress=1;
 else if(stateName==='CLOSED')progress=0;

 const slatHeight=Math.min(.16,Math.max(.065,openingHeight/22));
 const visibleDoorHeight=progress>=.999?0:Math.max(slatHeight,(1-progress)*openingHeight);
 const clearHeight=Math.max(0,openingHeight-visibleDoorHeight);
 const vd=itemPhysicsDimensions(vehicle);
 const lp=localXZ(shutter,vt.x,vt.z);

 // 車體寬度要換算到鐵捲門自己的局部 X 軸，不能直接拿世界座標 AABB。
 // 否則鐵捲門或車輛旋轉 90° 時，即使門全開仍可能誤判撞到門柱。
 const vehicleRot=THREE.MathUtils.degToRad(Number(vt?.rotationY??vehicle?.params?.rotation??0)||0);
 const shutterRot=THREE.MathUtils.degToRad(Number(st?.rotationY??shutter?.params?.rotation??0)||0);
 const rel=vehicleRot-shutterRot;
 const vehicleHalfLocalX=Math.abs(Math.cos(rel))*vd.width/2+Math.abs(Math.sin(rel))*vd.depth/2;

 // 車體必須位於左右門柱之間；OPEN 時直接採完整門洞淨高。
 const sideMargin=.015;
 const insideOpening=Math.abs(lp.x)+vehicleHalfLocalX <= openingWidth/2-sideMargin;
 const vehicleTop=(Number(vt.y)||0)+vd.height;
 const shutterBase=Number(st.y)||0;
 const requiredClearance=Math.max(.02,vehicleTop-shutterBase);
 const enoughHeight=stateName==='OPEN' || requiredClearance <= clearHeight-.015;
 return insideOpening&&enoughHeight;
}
function constrainWorldTransform(item,before,next,options={}){
 let adjusted={...next};
 // 駕駛中的汽車／機車整台車身都必須留在場景範圍內。
 if(isDrivableVehicle(item)&&options.source==='vehicle-drive'){
  const bounds=activeSceneBounds();
  const half=vehicleWorldHalfExtents(item,adjusted);
  const minX=bounds.minX+half.x,maxX=bounds.maxX-half.x;
  const minZ=bounds.minZ+half.z,maxZ=bounds.maxZ-half.z;
  const clampedX=Math.max(minX,Math.min(maxX,adjusted.x));
  const clampedZ=Math.max(minZ,Math.min(maxZ,adjusted.z));
  if(clampedX!==adjusted.x||clampedZ!==adjusted.z){
   adjusted.x=clampedX;adjusted.z=clampedZ;
   item.params.__vehicleBoundaryHit=true;
  }else item.params.__vehicleBoundaryHit=false;
 }
 if(scenePhysicsSettings.floorEnabled!==false && options.ignoreFloor!==true){
  const ground=typeof getGroundHeightAt==='function'?Number(getGroundHeightAt(adjusted.x,adjusted.z))||0:0;
  if(adjusted.y<ground)adjusted.y=ground;
 }
 if(scenePhysicsSettings.collisionEnabled!==false && options.ignoreCollision!==true && itemCollisionEnabled(item)){
  for(const other of state.items){
   if(!other||other.id===item.id)continue;
   if(!itemCollisionEnabled(other))continue;
   // 鐵捲門全開後取消整個模組的實體接觸；關閉／關門時自動恢復。
   if(other.type==='shutter'&&!shutterHasPhysicalCollision(other))continue;
   if(item.type==='shutter'&&!shutterHasPhysicalCollision(item))continue;
   if(isDrivableVehicle(item)&&(DRIVE_SENSOR_TYPES.has(other.type)||['object_road','object_asphalt'].includes(other.type)))continue;
   if(isDrivableVehicle(other)&&(DRIVE_SENSOR_TYPES.has(item.type)||['object_road','object_asphalt'].includes(item.type)))continue;
   const ot=readWorldTransform(other)||{x:other.x||0,y:other.y||0,z:other.z||0,rotationY:0,scale:1};
   if(transformsOverlap(item,adjusted,other,ot)){
    // 鐵捲門已打開且淨空足夠時，車輛可由門洞穿過；門柱區域仍保持碰撞。
    if(isDrivableVehicle(item)&&other.type==='shutter'&&vehicleCanPassOpenShutter(item,adjusted,other,ot))continue;
    if(isDrivableVehicle(other)&&item.type==='shutter'&&vehicleCanPassOpenShutter(other,ot,item,adjusted))continue;
    return {ok:false,reason:'collision',other,transform:{...before}};
   }
  }
 }
 return {ok:true,transform:adjusted};
}

function writeWorldTransform(item,patch={},options={}){
 if(!item)return {
  ok:false,
  reason:'missing-item'
 };

 const before=readWorldTransform(item);
 let next=normalizeWorldTransform({
  ...before,
  ...patch
 });
 const physics=constrainWorldTransform(item,before,next,options);
 if(!physics.ok){
  if(item.mesh){item.mesh.position.set(before.x,before.y,before.z);item.mesh.rotation.y=THREE.MathUtils.degToRad(before.rotationY);item.mesh.updateMatrixWorld?.(true)}
  const message=`實體防重疊：${item.name||item.type} 無法與 ${physics.other?.name||physics.other?.type||'其他物件'} 重疊`;
  const status=$('statusText');if(status)status.textContent=message;
  window.UTOP_DEBUG?.record?.('WARN','ScenePhysics',message,{itemId:item.id,otherId:physics.other?.id});
  return {ok:false,reason:'collision',before,after:{...before},otherId:physics.other?.id,source:options.source||'unknown'};
 }
 next=physics.transform;

 item.worldTransform=next;
 item.x=next.x;
 item.y=next.y;
 item.z=next.z;
 item.rotationY=next.rotationY;
 item.scale=next.scale;

 const refresh=
  options.refresh===false
   ?{ok:true,method:'skipped'}
   :safeRefreshWorldItem(item);

 worldState.revision++;
 worldState.lastSyncAt=Date.now();

 const result={
  ok:true,
  id:item.id,
  type:item.type,
  before,
  after:{...next},
  refresh,
  source:options.source||'unknown'
 };

 if(options.record!==false){
  window.UTOP_DEBUG?.record?.(
   'ACTION',
   'WorldEngine',
   `世界座標更新：${item.name||item.type||item.id}`,
   result
  );
 }

 return result;
}

function safeRefreshWorldItem(item){
 if(
  item?.mesh&&
  item.worldTransform&&
  item.userData?.worldTransformDirty===true
 ){
  commitItemMeshTransform(
   item,
   {
    source:'pre-refresh-dirty-commit',
    render:false
   }
  );
  item.userData.worldTransformDirty=false;
 }

 try{
  const transform=ensureItemWorldTransform(item);

  if(item?.mesh){
   item.mesh.position.set(
    transform.x,
    transform.y,
    transform.z
   );

   item.mesh.rotation.y=
    THREE.MathUtils.degToRad(transform.rotationY);

   item.mesh.scale.setScalar(transform.scale);
   item.mesh.updateMatrixWorld?.(true);
  }

  if(typeof renderPlan==='function'){
   renderPlan();
  }

  if(typeof renderInspector==='function'){
   renderInspector();
  }

  return {
   ok:true,
   method:'worldTransform'
  };
 }catch(error){
  const result={
   ok:false,
   id:item?.id,
   type:item?.type,
   message:error?.message,
   stack:error?.stack
  };

  window.UTOP_DEBUG?.record?.(
   'ERROR',
   'WorldEngine',
   `世界座標同步失敗：${item?.name||item?.type||'unknown'}`,
   result
  );

  return result;
 }
}

function syncItemFromMesh(item,options={}){
 if(!item?.mesh)return {
  ok:false,
  reason:'missing-mesh'
 };

 const mesh=item.mesh;

 return writeWorldTransform(
  item,
  {
   x:mesh.position.x,
   y:mesh.position.y,
   z:mesh.position.z,
   rotationY:THREE.MathUtils.radToDeg(mesh.rotation.y),
   scale:mesh.scale.x
  },
  {
   ...options,
   refresh:false,
   source:options.source||'3d-mesh'
  }
 );
}


function commitItemMeshTransform(item,options={}){
 if(!item?.mesh){
  return {
   ok:false,
   reason:'missing-mesh',
   id:item?.id
  };
 }

 const mesh=item.mesh;
 const patch={
  x:mesh.position.x,
  y:mesh.position.y,
  z:mesh.position.z,
  rotationY:THREE.MathUtils.radToDeg(mesh.rotation.y),
  scale:mesh.scale.x
 };

 const result=writeWorldTransform(
  item,
  patch,
  {
   refresh:false,
   source:options.source||'3d-transform-commit',
   record:false
  }
 );

 if(result.ok){
  item.x=patch.x;
  item.y=patch.y;
  item.z=patch.z;
  item.rotationY=patch.rotationY;
  item.scale=patch.scale;

  if(typeof markDirty==='function'){
   markDirty();
  }

  if(options.render!==false){
   if(typeof renderPlan==='function')renderPlan();
   if(typeof renderInspector==='function')renderInspector();
  }

  window.UTOP_DEBUG?.record?.(
   'ACTION',
   'WorldEngine',
   `3D位置已回寫：${item.name||item.type||item.id}`,
   {
    id:item.id,
    type:item.type,
    transform:{...item.worldTransform},
    source:options.source||'3d-transform-commit'
   }
  );
 }

 return result;
}

function commitSelectedMeshTransform(options={}){
 const item=
  state.items.find(candidate=>candidate.id===state.selectedId)||
  state.items.find(candidate=>candidate.id===selectedId)||
  null;

 if(!item){
  return {
   ok:false,
   reason:'missing-selected-item'
  };
 }

 return commitItemMeshTransform(item,options);
}


function syncAllWorldItems(options={}){
 const results=[];

 for(const item of state.items){
  ensureItemWorldTransform(item);
  results.push(
   safeRefreshWorldItem(item)
  );
 }

 worldState.revision++;
 worldState.lastSyncAt=Date.now();

 if(options.record!==false){
  window.UTOP_DEBUG?.record?.(
   results.some(result=>result.ok===false)
    ?'WARNING'
    :'SUCCESS',
   'WorldEngine',
   '全部設備世界座標同步完成',
   {
    deviceCount:state.items.length,
    revision:worldState.revision,
    results
   }
  );
 }

 return results;
}

function setWorldBounds(bounds={}){
 const next={
  minX:finiteNumber(bounds.minX,worldState.bounds.minX),
  maxX:finiteNumber(bounds.maxX,worldState.bounds.maxX),
  minY:finiteNumber(bounds.minY,worldState.bounds.minY),
  maxY:finiteNumber(bounds.maxY,worldState.bounds.maxY),
  minZ:finiteNumber(bounds.minZ,worldState.bounds.minZ),
  maxZ:finiteNumber(bounds.maxZ,worldState.bounds.maxZ)
 };

 if(next.minX>=next.maxX){
  [next.minX,next.maxX]=[next.maxX,next.minX];
 }
 if(next.minY>=next.maxY){
  [next.minY,next.maxY]=[next.maxY,next.minY];
 }
 if(next.minZ>=next.maxZ){
  [next.minZ,next.maxZ]=[next.maxZ,next.minZ];
 }

 worldState.bounds=next;
 worldState.revision++;

 window.UTOP_DEBUG?.record?.(
  'ACTION',
  'WorldEngine',
  '世界範圍已更新',
  {
   bounds:{...worldState.bounds},
   revision:worldState.revision
  }
 );

 return {...worldState.bounds};
}

function getWorldBounds(){
 return {...worldState.bounds};
}

function worldToPlanShared(x,z){
 if(typeof worldToPlan==='function'){
  return worldToPlan(x,z);
 }

 const svg=$('planSvg');
 const width=
  svg?.viewBox?.baseVal?.width||
  svg?.clientWidth||
  1000;
 const height=
  svg?.viewBox?.baseVal?.height||
  svg?.clientHeight||
  600;

 const bounds=worldState.bounds;

 return {
  x:
   ((x-bounds.minX)/
    Math.max(.001,bounds.maxX-bounds.minX))*width,
  y:
   ((z-bounds.minZ)/
    Math.max(.001,bounds.maxZ-bounds.minZ))*height
 };
}

function planToWorldShared(x,y){
 if(typeof planToWorld==='function'){
  return planToWorld(x,y);
 }

 const svg=$('planSvg');
 const width=
  svg?.viewBox?.baseVal?.width||
  svg?.clientWidth||
  1000;
 const height=
  svg?.viewBox?.baseVal?.height||
  svg?.clientHeight||
  600;

 const bounds=worldState.bounds;

 return {
  x:
   bounds.minX+
   (x/Math.max(1,width))*
   (bounds.maxX-bounds.minX),
  z:
   bounds.minZ+
   (y/Math.max(1,height))*
   (bounds.maxZ-bounds.minZ)
 };
}

function syncPlanDragToWorld(item,x,z){
 return writeWorldTransform(
  item,
  {x,z},
  {
   source:'2d-drag',
   record:false
  }
 );
}


function getWorldSceneModel(){
 const bounds=getWorldBounds();
 const sceneId=
  window.UTOP_SCENE_HOST?.getCurrentSceneId?.()||
  state?.sceneId||
  'default';

 const width=Math.max(.1,bounds.maxX-bounds.minX);
 const depth=Math.max(.1,bounds.maxZ-bounds.minZ);
 const centerX=(bounds.minX+bounds.maxX)/2;
 const centerZ=(bounds.minZ+bounds.maxZ)/2;

 const roadWidth=Math.max(5,width*.46);
 const sidewalkWidth=Math.max(1.2,width*.13);
 const grassWidth=Math.max(.8,width*.08);

 return {
  id:sceneId,
  bounds,
  center:{x:centerX,z:centerZ},
  width,
  depth,
  road:{
   x:centerX,
   z:centerZ,
   width:roadWidth,
   depth:depth*.88,
   rotationY:0
  },
  sidewalks:[
   {
    x:centerX-(roadWidth+sidewalkWidth)/2,
    z:centerZ,
    width:sidewalkWidth,
    depth:depth*.88
   },
   {
    x:centerX+(roadWidth+sidewalkWidth)/2,
    z:centerZ,
    width:sidewalkWidth,
    depth:depth*.88
   }
  ],
  grass:[
   {
    x:centerX-(roadWidth/2+sidewalkWidth+grassWidth/2),
    z:centerZ,
    width:grassWidth,
    depth:depth*.88
   },
   {
    x:centerX+(roadWidth/2+sidewalkWidth+grassWidth/2),
    z:centerZ,
    width:grassWidth,
    depth:depth*.88
   }
  ],
  isSnow:/snow/i.test(sceneId)||/雪/.test(sceneId),
  source:'WorldEngine'
 };
}

function getBarrierWorldGeometry(item){
 if(!item)return null;

 const transform=ensureItemWorldTransform(item);
 const params=item.params||{};
 const armLength=Math.max(1.5,Math.min(12,finiteNumber(params.armLength,4)));
 const armAngle=Math.max(0,Math.min(90,finiteNumber(params.angle,0)));
 const radians=THREE.MathUtils.degToRad(armAngle);
 const side=params.armSide==='right'?1:-1;

 return {
  itemId:item.id,
  transform,
  armLength,
  armAngle,
  side,
  projectedLength:armLength*Math.cos(radians),
  raisedHeight:armLength*Math.sin(radians),
  bodyWidth:.34,
  bodyDepth:.28
 };
}

function auditWorldSceneSync(){
 const issues=[];

 for(const item of state.items){
  const transform=ensureItemWorldTransform(item);

  if(item.mesh){
   const positionMismatch=
    Math.abs(item.mesh.position.x-transform.x)>.001||
    Math.abs(item.mesh.position.y-transform.y)>.001||
    Math.abs(item.mesh.position.z-transform.z)>.001;

   const rotationMismatch=
    Math.abs(
     THREE.MathUtils.radToDeg(item.mesh.rotation.y)-
     transform.rotationY
    )>.1;

   const scaleMismatch=
    Math.abs(item.mesh.scale.x-transform.scale)>.001;

   if(positionMismatch||rotationMismatch||scaleMismatch){
    issues.push({
     id:item.id,
     type:item.type,
     name:item.name,
     layer:'3D',
     positionMismatch,
     rotationMismatch,
     scaleMismatch,
     transform:{...transform},
     mesh:{
      x:item.mesh.position.x,
      y:item.mesh.position.y,
      z:item.mesh.position.z,
      rotationY:THREE.MathUtils.radToDeg(item.mesh.rotation.y),
      scale:item.mesh.scale.x
     }
    });
   }
  }

  if(item.type==='barrier'){
   const geometry=getBarrierWorldGeometry(item);
   const planNode=document.querySelector(
    `[data-plan-item-id="${CSS.escape(String(item.id))}"]`
   );

   if(planNode){
    const planArmLength=finiteNumber(
     planNode.querySelector('[data-barrier-arm]')?.dataset?.worldLength,
     geometry.projectedLength
    );

    if(Math.abs(planArmLength-geometry.projectedLength)>.01){
     issues.push({
      id:item.id,
      type:item.type,
      name:item.name,
      layer:'2D',
      reason:'barrier-arm-length',
      expected:geometry.projectedLength,
      actual:planArmLength
     });
    }
   }
  }
 }

 const report={
  ok:issues.length===0,
  issueCount:issues.length,
  issues,
  worldRevision:worldState.revision,
  scene:getWorldSceneModel()
 };

 window.UTOP_DEBUG?.record?.(
  report.ok?'SUCCESS':'WARNING',
  'WorldEngine',
  report.ok
   ?'2D／3D世界同步檢查通過'
   :`發現 ${issues.length} 個同步差異`,
  report
 );

 return report;
}

function repairWorldSceneSync(){
 const before=auditWorldSceneSync();
 install3DTransformCommitFallback();
 const results=syncAllWorldItems({record:false});

$('worldSyncAudit')?.addEventListener('click',()=>{
 const report=auditWorldSceneSync();
 if($('statusText')){
  $('statusText').textContent=report.ok
   ?'2D／3D同步檢查通過'
   :`發現 ${report.issueCount} 個同步差異`;
 }
});

$('worldSyncRepair')?.addEventListener('click',()=>{
 const result=repairWorldSceneSync();
 if($('statusText')){
  $('statusText').textContent=result.after.ok
   ?'2D／3D已重新同步'
   :`重新同步後仍有 ${result.after.issueCount} 個差異`;
 }
});



 if(typeof renderPlanSceneGeometry==='function'){
  renderPlanSceneGeometry();
 }
 if(typeof renderPlan==='function'){
  renderPlan();
 }

 const after=auditWorldSceneSync();
 const result={
  before,
  after,
  results
 };

 window.UTOP_DEBUG?.record?.(
  after.ok?'SUCCESS':'ERROR',
  'WorldEngine',
  after.ok
   ?'世界場景重新同步完成'
   :'世界場景重新同步後仍有差異',
  result
 );

 return result;
}


function getWorldEngineStatus(){
 return {
  version:WORLD_ENGINE_VERSION,
  units:worldState.units,
  scale:worldState.scale,
  revision:worldState.revision,
  lastSyncAt:worldState.lastSyncAt,
  bounds:{...worldState.bounds},
  devices:state.items.map(item=>({
   id:item.id,
   type:item.type,
   name:item.name,
   transform:readWorldTransform(item)
  }))
 };
}


const DEVICE_TYPE_ALIASES=Object.freeze({
 uhf:['uhf','etag','e-tag','reader','ar611','611ug','etag讀頭','讀頭'],
 radar:['radar','雷達','雷達感應器'],
 controller:['controller','control','控制器','門禁控制器','雙向控制器','三向控制器'],
 relay:['relay','繼電器'],
 barrier:['barrier','boomgate','柵欄機','柵欄'],
 loop:['loop','loopcoil','地感','地感線圈'],
 loopdetector:['loopdetector','detector','地感檢知器'],
 directionrecognizer:['directionrecognizer','direction','lk121','方向辨識器','方向辨識'],
 timer:['timer','delaytimer','powerondelay','poweroffdelay','計時器','延遲計時器','倒數計時器'],
 traffic:['traffic','trafficlight','signal','紅綠燈','號誌燈']
});

function normalizeDeviceSearchText(value){
 return String(value??'').toLowerCase().replace(/\s+/g,'').replace(/[_\-\/\\]/g,'');
}

function buildSceneDeviceIndex(){
 const result={byType:new Map(),all:[]};
 for(const item of state.items){
  const type=normalizeDeviceSearchText(item.type);
  const name=normalizeDeviceSearchText(item.name);
  const keys=new Set([type,name]);

  for(const [canonical,aliases] of Object.entries(DEVICE_TYPE_ALIASES)){
   const normalized=aliases.map(normalizeDeviceSearchText);
   if(
    canonical===type||
    normalized.some(alias=>type.includes(alias)||name.includes(alias))
   )keys.add(canonical);
  }

  result.all.push(item);
  for(const key of keys){
   if(!key)continue;
   if(!result.byType.has(key))result.byType.set(key,[]);
   result.byType.get(key).push(item);
  }
 }
 return result;
}

function resolveSceneItemsByTypes(types=[]){
 const index=buildSceneDeviceIndex();
 const output=[];
 const seen=new Set();

 for(const requested of types){
  const key=normalizeDeviceSearchText(requested);
  const candidates=new Set([key]);

  for(const [canonical,aliases] of Object.entries(DEVICE_TYPE_ALIASES)){
   const normalized=aliases.map(normalizeDeviceSearchText);
   if(canonical===key||normalized.includes(key)){
    candidates.add(canonical);
    normalized.forEach(alias=>candidates.add(alias));
   }
  }

  for(const candidate of candidates){
   for(const item of index.byType.get(candidate)||[]){
    if(seen.has(item.id))continue;
    seen.add(item.id);
    output.push(item);
   }
  }
 }
 return output;
}

function safeRefreshItemVisual(item){
 return safeRefreshWorldItem(item);
}
function executeDeviceAction(item,action,payload={}){
 if(!item){
  return {
   ok:false,
   reason:'missing-item'
  };
 }

 try{
  commitItemMeshTransform(
   item,
   {
    source:'before-device-action',
    render:false
   }
  );
 }catch(_){}

 /*
  * 優先走既有 input() 控制入口，
  * 讓所有設備使用同一套控制與動畫邏輯。
  */
 const inputSupportedActions=new Set([
  'open','close','stop','reset','safety','photoBeam',
  'autoClose','red','green','off','start','pause','vehicle','clear',
  'pulse','fault','valid','invalid','on','no','nc','powerOn','powerOff',
  'raise','lower','flash','answer','hangup','alarm','motion'
 ]);

 if(
  typeof input==='function'&&
  inputSupportedActions.has(action)
 ){
  try{
   input(item,action);

   return {
    ok:true,
    delegated:true,
    id:item.id,
    type:item.type,
    action
   };
  }catch(error){
   window.UTOP_DEBUG?.record?.(
    'ERROR',
    'ActionEngine',
    `設備動作執行失敗：${item.name||item.type}`,
    {
     id:item.id,
     type:item.type,
     action,
     message:error?.message,
     stack:error?.stack
    }
   );

   return {
    ok:false,
    id:item.id,
    type:item.type,
    action,
    message:error?.message
   };
  }
 }

 item.params=item.params||{};
 const type=normalizeDeviceSearchText(item.type);
 let changed=false;

 if(type==='barrier'){
  if(action==='open'){
   item.params.angle=90;
   item.params.state='OPEN';
   changed=true;
  }else if(action==='close'){
   item.params.angle=0;
   item.params.state='CLOSED';
   changed=true;
  }else if(action==='stop'){
   item.params.state='STOPPED';
   changed=true;
  }
 }else if(type==='traffic'){
  if(['red','green','off'].includes(action)){
   item.params.mode=action;
   changed=true;
  }
 }else if(type==='relay'){
  if(action==='on'||action==='no'){
   item.params.state='NO';
   item.params.active=true;
   changed=true;
  }else if(action==='off'||action==='nc'){
   item.params.state='NC';
   item.params.active=false;
   changed=true;
  }
 }else if(
  ['timer','delaytimer','powerondelay','poweroffdelay'].includes(type)
 ){
  if(action==='start'){
   item.params.state='RUNNING';
   item.params.running=true;
   item.params.remaining=Number(
    payload.seconds??
    item.params.delay??
    item.params.seconds??
    0
   );
   changed=true;
  }else if(action==='stop'||action==='reset'){
   item.params.running=false;
   item.params.remaining=0;
   item.params.state=action==='reset'?'IDLE':'STOPPED';
   changed=true;
  }
 }

 if(!changed){
  const result={
   ok:false,
   id:item.id,
   type:item.type,
   action,
   reason:'unsupported-action'
  };

  window.UTOP_DEBUG?.record?.(
   'WARNING',
   'ActionEngine',
   '設備不支援指定動作',
   result
  );

  return result;
 }

 /*
  * 參數改變後必須 rebuild，
  * 不能只更新位置，否則模型外觀不會改變。
  */
 rebuild(item);
 renderPlan();

 if(item.id===state.selectedId){
  renderQuick(item);
  renderInspector();
 }

 propagate(item);
 markDirty();

 const result={
  ok:true,
  id:item.id,
  type:item.type,
  action,
  transform:{...ensureItemWorldTransform(item)}
 };

 window.UTOP_DEBUG?.record?.(
  'ACTION',
  'ActionEngine',
  `設備動作完成：${item.name||item.type} → ${action}`,
  result
 );

 return result;
}
function executeDeviceActionForItems(items,action,payload={}){
 return items.map(item=>executeDeviceAction(item,action,payload));
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

 // 開始拖曳時記住目前離地偏移量。
 if(hasSceneHeightProvider()&&!drag3d.params?.manualHeight){
  drag3d.params.groundOffset=getGroundOffset(drag3d);
  drag3d.params.followGround=true;
 }

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
   hit.z+off.z,
   {snapToGround:true}
  );
  renderPlan();
  markDirty();
 }
}
renderer.domElement.onpointerup=e=>{
 safeReleasePointerCapture(renderer.domElement,e.pointerId);

 const completedDragItem=drag3d;

 if(drag3d&&hasSceneHeightProvider()&&drag3d.params?.followGround!==false){
  syncItemToGround(drag3d);
  updateHeightControls();
  window.UTOP_DEBUG?.record?.(
   'ACTION',
   'Scene',
   '設備沿地形完成拖移',
   {
    id:drag3d.id,
    x:drag3d.x,
    y:drag3d.y,
    z:drag3d.z,
    groundHeight:drag3d.params?.groundHeight,
    groundOffset:drag3d.params?.groundOffset
   }
  );
 }
 if(completedDragItem){
  try{
   commitItemMeshTransform(
    completedDragItem,
    {
     source:'3d-drag-complete',
     render:false
    }
   );
  }catch(_){}
 }

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
   V5.1.0.1.1.1 3D Wiring View
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


/* =========================================================
   V5.1.3.43 展示快捷鍵管理：立即觸發／訊息顯示秒數／3D發光
========================================================= */
const SHORTCUT_RESERVED_KEYS=new Set(['Escape','F5','F11','Tab','CapsLock']);
const SHORTCUT_MODIFIER_KEYS=new Set(['Shift','Control','Alt','Meta']);
let shortcutEditingIndex=-1;
let shortcutGlowSession=null;
function shortcutEscape(value){return String(value??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function shortcutKeyLabel(key){
 if(key===' ')return 'Space';
 if(key==='ArrowUp')return '↑';if(key==='ArrowDown')return '↓';if(key==='ArrowLeft')return '←';if(key==='ArrowRight')return '→';
 return String(key||'');
}
function normalizeShortcutKey(key){return key==='Spacebar'?' ':String(key||'');}
function shortcutSignatureFromEvent(event){
 const base=normalizeShortcutKey(event.key);
 if(!base||SHORTCUT_RESERVED_KEYS.has(base)||SHORTCUT_MODIFIER_KEYS.has(base))return '';
 const parts=[];
 if(event.ctrlKey)parts.push('Ctrl');
 if(event.altKey)parts.push('Alt');
 if(event.shiftKey)parts.push('Shift');
 if(event.metaKey)parts.push('Meta');
 parts.push(base.length===1?base.toUpperCase():base);
 return parts.join('+');
}
function shortcutComboLabel(combo){return String(combo||'').split('+').map(part=>shortcutKeyLabel(part)).join(' + ');}
function getShortcutDefinition(item,ioType){
 const d=defs[item?.type];return ioType==='do'?(d?.do||[]):(d?.di||[]);
}
function renderShortcutPortOptions(){
 const device=$('shortcutDevice');const io=$('shortcutIoType');const port=$('shortcutPort');if(!device||!io||!port)return;
 const item=get(device.value);const entries=getShortcutDefinition(item,io.value);
 port.innerHTML=entries.map(x=>`<option value="${shortcutEscape(x[2])}">${shortcutEscape(x[0])}｜${shortcutEscape(x[1])}</option>`).join('');
}
function renderShortcutDeviceOptions(){
 const device=$('shortcutDevice');if(!device)return;
 const current=device.value;
 device.innerHTML=state.items.map(i=>`<option value="${shortcutEscape(i.id)}">${shortcutEscape(i.name||defs[i.type]?.name||i.type)}</option>`).join('');
 if(state.items.some(i=>i.id===current))device.value=current;
 renderShortcutPortOptions();
}
function shortcutDescription(entry){
 const item=get(entry.deviceId);const def=getShortcutDefinition(item,entry.ioType).find(x=>x[2]===entry.port);
 return `${item?.name||'設備已刪除'}｜${String(entry.ioType||'di').toUpperCase()} ${def?.[1]||entry.port}`;
}
function shortcutDisplayInfo(entry){
 const item=get(entry.deviceId);const ioType=String(entry.ioType||'di').toLowerCase();
 const def=getShortcutDefinition(item,ioType).find(x=>x[2]===entry.port);
 return {item,title:String(entry.title||entry.itemName||'快捷觸發').trim()||'快捷觸發',io:ioType.toUpperCase(),functionName:def?.[1]||entry.port,key:shortcutComboLabel(entry.combo||entry.key)};
}
function makeShortcutFeedbackSprite(info){
 const canvas=document.createElement('canvas');canvas.width=760;canvas.height=190;
 const ctx=canvas.getContext('2d');
 ctx.clearRect(0,0,canvas.width,canvas.height);
 const x=10,y=10,w=740,h=170,r=24;
 ctx.shadowColor='rgba(0,0,0,.18)';ctx.shadowBlur=10;ctx.shadowOffsetY=4;
 ctx.fillStyle='#ffffff';ctx.strokeStyle='rgba(0,0,0,.22)';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#111111';
 ctx.font='48px DFKai-SB, BiauKai, KaiTi, serif';ctx.fillText(info.title,380,67);
 ctx.font='30px DFKai-SB, BiauKai, KaiTi, serif';ctx.fillText(`${info.io}｜${info.functionName}`,380,126);
 const texture=new THREE.CanvasTexture(canvas);texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
 const material=new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false});
 const sprite=new THREE.Sprite(material);sprite.scale.set(4.35,1.09,1);sprite.renderOrder=9999;
 sprite.userData.disposeShortcutFeedback=()=>{texture.dispose();material.dispose();};return sprite;
}
let activeShortcutFeedback=null;let activeShortcutFeedbackTimer=0;
function stopShortcutGlow(){
 const session=shortcutGlowSession;if(!session)return;shortcutGlowSession=null;
 cancelAnimationFrame(session.raf||0);
 for(const rec of session.materials){rec.mesh.material=rec.original;for(const m of rec.clones)m?.dispose?.();}
}
function startShortcutGlow(item){
 stopShortcutGlow();if(!item?.mesh)return;
 const materials=[];
 item.mesh.traverse(obj=>{
  if(!obj.isMesh||!obj.material)return;
  const original=obj.material;const originals=Array.isArray(original)?original:[original];
  const clones=originals.map(mat=>{const m=mat.clone();if('emissive' in m){m.emissive=new THREE.Color(0xffd84d);m.emissiveIntensity=.2;}return m;});
  obj.material=Array.isArray(original)?clones:clones[0];materials.push({mesh:obj,original,clones});
 });
 const session={materials,raf:0,start:performance.now(),duration:2600};shortcutGlowSession=session;
 const animate=(now)=>{
  if(shortcutGlowSession!==session)return;
  const t=(now-session.start)/1000;const elapsed=now-session.start;
  const pulse=.5+.5*Math.sin(t*15);const color=new THREE.Color().setHSL((t*.42)%1,.92,.55+.1*pulse);
  for(const rec of materials)for(const mat of rec.clones){if('emissive' in mat){mat.emissive.copy(color);mat.emissiveIntensity=.75+1.65*pulse;}}
  if(elapsed>=session.duration){stopShortcutGlow();return;}session.raf=requestAnimationFrame(animate);
 };session.raf=requestAnimationFrame(animate);
}
function showShortcutFeedback(entry){
 const info=shortcutDisplayInfo(entry);if(!info.item?.mesh)return;
 const displaySeconds=Math.max(0,Math.min(60,Number(entry.delaySeconds??5)||0));
 if(activeShortcutFeedback){scene.remove(activeShortcutFeedback);activeShortcutFeedback.userData.disposeShortcutFeedback?.();activeShortcutFeedback=null;}clearTimeout(activeShortcutFeedbackTimer);
 startShortcutGlow(info.item);
 const status=$('statusText');if(status)status.textContent=`${info.title}｜${info.io} ${info.functionName}`;
 if(displaySeconds<=0)return;
 const sprite=makeShortcutFeedbackSprite(info);const box=new THREE.Box3().setFromObject(info.item.mesh);const center=new THREE.Vector3();box.getCenter(center);center.y=(Number.isFinite(box.max.y)?box.max.y:center.y)+.95;sprite.position.copy(center);scene.add(sprite);activeShortcutFeedback=sprite;
 activeShortcutFeedbackTimer=setTimeout(()=>{if(activeShortcutFeedback===sprite){scene.remove(sprite);sprite.userData.disposeShortcutFeedback?.();activeShortcutFeedback=null;}},displaySeconds*1000);
}
function resetShortcutEditor(){
 shortcutEditingIndex=-1;if($('shortcutKey')){$('shortcutKey').value='';$('shortcutKey').dataset.key='';}if($('shortcutTitle'))$('shortcutTitle').value='';if($('shortcutDelaySeconds'))$('shortcutDelaySeconds').value='5';
 if($('shortcutAdd'))$('shortcutAdd').textContent='＋ 加入快捷鍵';if($('shortcutCancelEdit'))$('shortcutCancelEdit').hidden=true;
}
function editShortcut(index){
 const entry=state.shortcuts[index];if(!entry||entry.locked)return;
 shortcutEditingIndex=index;renderShortcutDeviceOptions();
 $('shortcutKey').dataset.key=entry.combo||entry.key||'';$('shortcutKey').value=shortcutComboLabel(entry.combo||entry.key||'');$('shortcutTitle').value=entry.title||entry.itemName||'';if($('shortcutDelaySeconds'))$('shortcutDelaySeconds').value=String(Number.isFinite(Number(entry.delaySeconds))?Math.max(0,Number(entry.delaySeconds)):5);
 $('shortcutDevice').value=entry.deviceId;$('shortcutIoType').value=entry.ioType||'di';renderShortcutPortOptions();$('shortcutPort').value=entry.port||'';
 $('shortcutAdd').textContent='✓ 儲存修改';$('shortcutCancelEdit').hidden=false;$('shortcutTitle')?.focus();
}
function toggleShortcutLock(index){const e=state.shortcuts[index];if(!e)return;e.locked=!e.locked;if(shortcutEditingIndex===index&&e.locked)resetShortcutEditor();renderShortcutList();markDirty();}
function removeShortcut(index){const e=state.shortcuts[index];if(!e||e.locked)return;if(shortcutEditingIndex===index)resetShortcutEditor();state.shortcuts.splice(index,1);renderShortcutList();markDirty();}
function showShortcutHover(entry,event){
 const card=$('shortcutHoverCard');if(!card)return;const info=shortcutDisplayInfo(entry);
 card.innerHTML=`<strong>${shortcutEscape(info.title)}</strong><span>⌨ ${shortcutEscape(info.key)}</span><span>${shortcutEscape(info.item?.name||'設備已刪除')}</span><span class="io ${String(entry.ioType).toLowerCase()}">${shortcutEscape(info.io)}｜${shortcutEscape(info.functionName)}</span><span>⏱ 訊息顯示 ${Math.max(0,Number(entry.delaySeconds??5)||0)} 秒</span><small>${entry.locked?'🔒 已鎖定：避免誤改':'🔓 可修改'}</small>`;
 card.hidden=false;moveShortcutHover(event);
}
function moveShortcutHover(event){const card=$('shortcutHoverCard');if(!card||card.hidden)return;const pad=14;let x=event.clientX+18,y=event.clientY+18;const r=card.getBoundingClientRect();if(x+r.width>innerWidth-pad)x=event.clientX-r.width-18;if(y+r.height>innerHeight-pad)y=event.clientY-r.height-18;card.style.left=`${Math.max(pad,x)}px`;card.style.top=`${Math.max(pad,y)}px`;}
function hideShortcutHover(){const card=$('shortcutHoverCard');if(card)card.hidden=true;}
function renderShortcutList(){
 const box=$('shortcutList');if(!box)return;
 box.innerHTML=state.shortcuts.length?state.shortcuts.map((entry,index)=>{const locked=!!entry.locked;return `<article class="shortcut-row ${locked?'is-locked':''}" data-shortcut-row="${index}"><kbd>${shortcutEscape(shortcutComboLabel(entry.combo||entry.key))}</kbd><div class="shortcut-row-main"><strong class="shortcut-title">${shortcutEscape(entry.title||entry.itemName||'未命名項目')}</strong><span class="shortcut-detail">${shortcutEscape(shortcutDescription(entry))}｜訊息顯示 ${Math.max(0,Number(entry.delaySeconds??5)||0)} 秒</span><small>${locked?'🔒 已鎖定':'滑鼠移入可看完整綁定資訊'}</small></div><div class="shortcut-row-actions"><button data-shortcut-edit="${index}" ${locked?'disabled':''} type="button" title="修改這個快捷鍵">修改</button><button data-shortcut-lock="${index}" class="${locked?'is-locked':''}" type="button" title="${locked?'解除鎖定':'鎖定避免誤改'}">${locked?'🔒 解鎖':'🔓 鎖定'}</button><button data-shortcut-remove="${index}" ${locked?'disabled':''} type="button" title="刪除這個快捷鍵">刪除</button></div></article>`;}).join(''):'<div class="cloud-empty">尚未設定快捷鍵。</div>';
 box.querySelectorAll('[data-shortcut-edit]').forEach(btn=>btn.onclick=()=>editShortcut(Number(btn.dataset.shortcutEdit)));
 box.querySelectorAll('[data-shortcut-lock]').forEach(btn=>btn.onclick=()=>toggleShortcutLock(Number(btn.dataset.shortcutLock)));
 box.querySelectorAll('[data-shortcut-remove]').forEach(btn=>btn.onclick=()=>removeShortcut(Number(btn.dataset.shortcutRemove)));
 box.querySelectorAll('[data-shortcut-row]').forEach(row=>{const i=Number(row.dataset.shortcutRow);row.addEventListener('mouseenter',e=>showShortcutHover(state.shortcuts[i],e));row.addEventListener('mousemove',moveShortcutHover);row.addEventListener('mouseleave',hideShortcutHover);});
}
function openShortcutDialog(){resetShortcutEditor();renderShortcutDeviceOptions();renderShortcutList();$('shortcutDialog')?.showModal();}
function pulseShortcutDo(item,port){
 let count=0;for(const w of state.wires){if(w.sourceId!==item.id||w.sourcePort!==port)continue;const target=get(w.targetId);if(!target)continue;count++;state.activeWires.add(w.id);input(target,w.targetPort);setTimeout(()=>{state.activeWires.delete(w.id);drawWires();},450);}drawWires();
 const status=$('statusText');if(status)status.textContent=count?`快捷鍵 DO：${item.name} ${port} → ${count} 條連動`:`快捷鍵 DO：${item.name} ${port}（目前未接線）`;
}
function executeShortcut(entry){
 const item=get(entry.deviceId);if(!item)return;
 const displaySeconds=Math.max(0,Math.min(60,Number(entry.delaySeconds??5)||0));
 if(entry.ioType==='do')pulseShortcutDo(item,entry.port);else input(item,entry.port);
 showShortcutFeedback(entry);
 window.UTOP_DEBUG?.record?.('ACTION','Shortcut',`${entry.title||'快捷觸發'}｜${String(entry.ioType).toUpperCase()} ${entry.port}｜訊息顯示 ${displaySeconds} 秒｜立即執行`);
}
$('shortcutBtn')?.addEventListener('click',openShortcutDialog);
$('closeShortcutDialog')?.addEventListener('click',()=>{hideShortcutHover();$('shortcutDialog')?.close();});
$('shortcutCancelEdit')?.addEventListener('click',resetShortcutEditor);
$('shortcutDevice')?.addEventListener('change',renderShortcutPortOptions);$('shortcutIoType')?.addEventListener('change',renderShortcutPortOptions);
$('shortcutKey')?.addEventListener('keydown',event=>{event.preventDefault();event.stopPropagation();const combo=shortcutSignatureFromEvent(event);if(!combo)return;event.currentTarget.value=shortcutComboLabel(combo);event.currentTarget.dataset.key=combo;});
$('shortcutKey')?.addEventListener('click',event=>{event.currentTarget.value='請按鍵…';event.currentTarget.dataset.key='';event.currentTarget.focus();});
$('shortcutAdd')?.addEventListener('click',()=>{
 const key=$('shortcutKey')?.dataset.key||'';const title=String($('shortcutTitle')?.value||'').trim();const delaySeconds=Math.max(0,Math.min(60,Number($('shortcutDelaySeconds')?.value??5)||0));const deviceId=$('shortcutDevice')?.value||'';const ioType=$('shortcutIoType')?.value||'di';const port=$('shortcutPort')?.value||'';
 if(!key){alert('請先點「鍵盤按鍵」欄位，再按下要指定的鍵或組合鍵。');return;}if(!title){alert('請輸入「項目名稱」，例如：入口車輛進入。');return;}if(!deviceId||!port){alert('請選擇設備與 DI／DO 功能。');return;}
 const duplicate=state.shortcuts.findIndex((x,i)=>(x.combo||x.key)===key&&i!==shortcutEditingIndex);if(duplicate>=0){if(state.shortcuts[duplicate].locked){alert('這個按鍵已被「鎖定項目」使用，請先解除鎖定或改用其他按鍵。');return;}alert('這個按鍵已被其他項目使用，請先修改或刪除原項目。');return;}
 const next={combo:key,key,title,delaySeconds,deviceId,ioType,port,locked:false};
 if(shortcutEditingIndex>=0){const old=state.shortcuts[shortcutEditingIndex];if(old?.locked){alert('此項目已鎖定，無法修改。');return;}next.locked=!!old?.locked;state.shortcuts[shortcutEditingIndex]=next;}else state.shortcuts.push(next);
 renderShortcutList();markDirty();resetShortcutEditor();
});
document.addEventListener('keydown',event=>{if(event.defaultPrevented||event.repeat)return;const tag=event.target?.tagName;if(['INPUT','TEXTAREA','SELECT'].includes(tag)||event.target?.isContentEditable)return;if($('shortcutDialog')?.open)return;const combo=shortcutSignatureFromEvent(event);if(!combo)return;const entry=state.shortcuts.find(x=>(x.combo||x.key)===combo);if(!entry)return;event.preventDefault();event.stopPropagation();executeShortcut(entry);});
window.UTOP_SHORTCUTS=Object.freeze({open:openShortcutDialog,execute:executeShortcut,list:()=>state.shortcuts.map(x=>({...x}))});

$('wiringBtn').onclick=()=>{
 $('wiringDialog').showModal();
 renderWiring();
 setTimeout(()=>{
  if(wiring3DState.mode==='3d')dockMainSceneIntoWiring();
  else resizeSceneRenderer();
 },0);
};
[['openNetworkGraph','pages/relationships/network-graph.html'],['openRelationTree','pages/relationships/relation-tree.html'],['openKnowledgeTree','pages/relationships/knowledge-tree.html'],['openAiMindmap','pages/relationships/ai-mindmap.html']].forEach(([id,path])=>{const b=$(id);if(b)b.onclick=()=>openRelationshipPage(path);});
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
 try{environmentFxStop()}catch(_environmentError){}

 try{window.UTOP_MONTECARLO_PLUGIN?.unload?.({silent:true})}catch(error){console.warn('Monte Carlo clear:',error)}
 try{window.UTOP_SINGLE_LANE_PLUGIN?.unload?.({silent:true})}catch(error){console.warn('Single lane clear:',error)}
 try{window.UTOP_SNOW_ROAD_PLUGIN?.unload?.({silent:true})}catch(error){console.warn('Snow road clear:',error)}
 resetSceneHeightRange();
 window.UTOP_SCENE_HEIGHT_PROVIDER=null;
 state.items.forEach(item=>{try{if(item.mesh)group.remove(item.mesh)}catch(error){console.warn('Scene clear:',error)}});
 state.items=[];state.wires=[];state.selectedId=null;state.pending=null;state.activeWires.clear();state.wireLevels.clear();
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
   $('statusText').textContent='蒙地卡羅場景已載入，請從模組庫自行加入設備';
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
   $('statusText').textContent='單車道場景已載入，請從模組庫自行加入設備';
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
   $('statusText').textContent='雪地道路場景已載入，請從模組庫自行加入設備';
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

function syncScenePhysicsUi(){
 const floor=$('sceneFloorEnabled'),collision=$('sceneCollisionEnabled');
 if(floor)floor.checked=scenePhysicsSettings.floorEnabled!==false;
 if(collision)collision.checked=scenePhysicsSettings.collisionEnabled!==false;
}
$('sceneFloorEnabled')?.addEventListener('change',e=>{setScenePhysicsSettings({floorEnabled:e.currentTarget.checked});$('statusText').textContent=`地板接觸：${e.currentTarget.checked?'開啟':'關閉'}`;markDirty()});
$('sceneCollisionEnabled')?.addEventListener('change',e=>{setScenePhysicsSettings({collisionEnabled:e.currentTarget.checked});$('statusText').textContent=`模組實體防重疊：${e.currentTarget.checked?'開啟':'關閉'}`;markDirty()});
syncScenePhysicsUi();

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

$('environmentFxBtn')?.addEventListener('click',()=>{
 $('environmentFxDialog').showModal();
});
$('closeEnvironmentFxDialog')?.addEventListener('click',()=>{
 $('environmentFxDialog').close();
});
$('environmentFxDialog')?.addEventListener('cancel',event=>{
 event.preventDefault();
 $('environmentFxDialog').close();
});
document.querySelectorAll('[data-fx]').forEach(button=>{
 button.addEventListener('click',()=>{
  environmentFxSelect(button.dataset.fx);
 });
});
$('environmentFxIntensity')?.addEventListener('input',event=>{
 environmentFxState.intensity=Number(event.currentTarget.value)/100;
 $('environmentFxIntensityValue').value=`${event.currentTarget.value}%`;
});
$('environmentFxSpeed')?.addEventListener('input',event=>{
 environmentFxState.speed=Number(event.currentTarget.value)/100;
 $('environmentFxSpeedValue').value=`${environmentFxState.speed.toFixed(2)}×`;
});
$('environmentFxWind')?.addEventListener('input',event=>{
 environmentFxState.wind=Number(event.currentTarget.value)/100;
 $('environmentFxWindValue').value=event.currentTarget.value;
});
$('environmentFxWater')?.addEventListener('input',event=>{
 environmentFxState.water=Number(event.currentTarget.value)/100;
 $('environmentFxWaterValue').value=`${event.currentTarget.value}%`;
});
$('environmentFxCameraShake')?.addEventListener('change',event=>{
 environmentFxState.cameraShake=event.currentTarget.checked;
 environmentFxState.baseCameraPosition=camera.position.clone();
});
$('environmentFxLighting')?.addEventListener('change',event=>{
 environmentFxState.lighting=event.currentTarget.checked;
});
$('environmentFxFog')?.addEventListener('change',event=>{
 environmentFxState.fog=event.currentTarget.checked;
});
$('environmentFxDeviceImpact')?.addEventListener('change',event=>{
 environmentFxState.deviceImpact=event.currentTarget.checked;
 environmentFxApplyDeviceWarnings();
});
$('environmentFxPlay')?.addEventListener('click',environmentFxPlay);
$('environmentFxPause')?.addEventListener('click',environmentFxPause);
$('environmentFxStop')?.addEventListener('click',environmentFxStop);
$('environmentFxReset')?.addEventListener('click',environmentFxReset);
environmentFxSelect('clear');


$('planRepairDisplay')?.addEventListener('click',()=>{
 const before=reconcilePlanItems();
 renderPlan();
 requestAnimationFrame(()=>{
  const after=reconcilePlanItems();
  $('statusText').textContent=after.ok
   ?'2D模組顯示已重新掛載'
   :`2D仍缺少 ${after.missing.length} 個模組`;
  window.UTOP_DEBUG?.record?.(
   after.ok?'SUCCESS':'ERROR',
   'Plan2D',
   after.ok?'手動修復2D顯示完成':'手動修復2D顯示未完成',
   {before,after}
  );
 });
});


$('planMapModeToggle')?.addEventListener('click',()=>{
 planDisplayMode.mode=isPlanMinimapMode()?'engineering':'minimap';
 updatePlanMapModeButton();
 renderPlan();
 $('statusText').textContent=isPlanMinimapMode()
  ?'2D已切換為GTA小地圖模式'
  :'2D已切換為工程比例模式';
 window.UTOP_DEBUG?.record?.(
  'ACTION',
  'Plan2D',
  `切換2D顯示模式：${planDisplayMode.mode}`,
  {...planDisplayMode}
 );
});
updatePlanMapModeButton();

syncAllWorldItems({record:false});
installPlanZoomControls();
installPlanDeviceDrag();
setTimeout(updateHeightControls,0);

let lastTimerRender=0;
function tick(now){
 updateDrivableVehicles(now);
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
      if(i.params.state==='OPEN'&&!i.params.safetyActive){
       if(i.params.safetyClosePending){
        i.params.safetyClosePending=false;
        scheduleBarrierSafetyClose(i);
       }else scheduleBarrierAutoClose(i);
      }else cancelBarrierAutoClose(i);
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
      shortcuts: state.shortcuts.map(entry=>({...entry})),
      globalLabelsVisible: state.globalLabelsVisible!==false,
      globalMovementLocked: state.globalMovementLocked===true,
      graphicsSettings: graphicsSettings,
      scenePhysicsSettings: {...scenePhysicsSettings},
      sceneId: currentSceneId
    };
  },

  loadProjectData(data) {
    state.items.forEach(item => group.remove(item.mesh));
    state.items = [];
    state.wires = Array.isArray(data?.wires) ? data.wires : [];
    state.shortcuts = Array.isArray(data?.shortcuts) ? data.shortcuts.filter(entry=>entry&&entry.key&&entry.deviceId&&entry.port) : [];
    state.globalLabelsVisible=data?.globalLabelsVisible!==false;
    state.globalMovementLocked=data?.globalMovementLocked===true;
    if(data?.scenePhysicsSettings&&typeof data.scenePhysicsSettings==='object'){setScenePhysicsSettings(data.scenePhysicsSettings)}
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
    persistRelationshipSnapshot();
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





/* V5.1.0.1.1.1 Collapsible Sidebar Inspector */
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


/* V5.1.0.1.1.1 Unlimited Loop Dimensions */
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


/* V5.1.0.1.1.1 Realistic Rendering Foundation */
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
   V5.1.0.1.1.1 Reliable Scene Brightness
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
   V5.1.0.1.1.1 Mobile Workspace Helpers
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
   V5.1.0.1.1.1 Professional 2D Selection Engine
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


/* V5.1.0.1.1.1: map unlabeled SVG groups to the nearest device label/item. */
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
   V5.1.1 Stable Scene Plugin Host API
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
 getHeightAtPosition:(x,z)=>getGroundHeightAt(x,z),
 snapItemToGround:(item,options={})=>syncItemToGround(item,{
  force:true,
  ...options
 }),
 getGroundOffset,
 setItemGroundOffset:(item,offset=0)=>{
  if(!item)return null;
  item.params=item.params||{};
  item.params.groundOffset=Number(offset)||0;
  item.params.followGround=true;
  return syncItemToGround(item,{force:true});
 },
 getModelTopFootprint,
 syncPlanModelScale,
 syncPlanWith3D:()=>{
  renderPlan();
  return true;
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
   V5.1.1 Monte Carlo Lane Scene UI Bridge
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
    window.UTOP_MONTECARLO_PLUGIN?.setFloor?.(mode);
   }catch(error){
    console.warn('Monte Carlo mini control:',error);
   }
  });
 });

 refresh();
})();




window.UTOP_ACTION_ENGINE={
 buildSceneDeviceIndex,
 resolveSceneItemsByTypes,
 executeDeviceAction,
 executeDeviceActionForItems,
 safeRefreshItemVisual,
 getAliases:()=>structuredClone(DEVICE_TYPE_ALIASES)
};



function install3DTransformCommitFallback(){
 const canvas=
  renderer?.domElement||
  document.querySelector('canvas');

 if(!canvas||canvas.dataset.worldCommitInstalled==='true'){
  return;
 }

 canvas.dataset.worldCommitInstalled='true';

 canvas.addEventListener('pointerup',()=>{
  try{
   commitSelectedMeshTransform({
    source:'3d-canvas-pointerup'
   });
  }catch(_){}
 },true);

 canvas.addEventListener('pointercancel',()=>{
  try{
   commitSelectedMeshTransform({
    source:'3d-canvas-pointercancel'
   });
  }catch(_){}
 },true);
}


function auditCompleteDeviceState(){
 const issues=[];

 for(const item of state.items){
  const world=ensureItemWorldTransform(item);

  if(item.mesh){
   const meshState={
    x:item.mesh.position.x,
    y:item.mesh.position.y,
    z:item.mesh.position.z,
    rotationY:THREE.MathUtils.radToDeg(item.mesh.rotation.y),
    scale:item.mesh.scale.x
   };

   if(
    Math.abs(meshState.x-world.x)>.001||
    Math.abs(meshState.y-world.y)>.001||
    Math.abs(meshState.z-world.z)>.001||
    Math.abs(meshState.rotationY-world.rotationY)>.1||
    Math.abs(meshState.scale-world.scale)>.001
   ){
    issues.push({
     id:item.id,
     name:item.name,
     type:item.type,
     category:'3D_TRANSFORM',
     world:{...world},
     mesh:meshState
    });
   }
  }

  const planNode=document.querySelector(
   `[data-plan-item-id="${CSS.escape(String(item.id))}"]`
  );

  if(!planNode){
   issues.push({
    id:item.id,
    name:item.name,
    type:item.type,
    category:'2D_MISSING'
   });
   continue;
  }

  const expected=worldToPlan(world.x,world.z);
  const match=(planNode.getAttribute('transform')||'')
   .match(/translate\(([-\d.]+)[ ,]+([-\d.]+)\)/);

  if(match){
   const actual={
    x:Number(match[1]),
    y:Number(match[2])
   };

   if(
    Math.abs(actual.x-expected.x)>.5||
    Math.abs(actual.y-expected.y)>.5
   ){
    issues.push({
     id:item.id,
     name:item.name,
     type:item.type,
     category:'2D_POSITION',
     world:{...world},
     expected,
     actual
    });
   }
  }

  if(!planNode.querySelector('.plan-item-name')){
   issues.push({
    id:item.id,
    name:item.name,
    type:item.type,
    category:'2D_NAME_MISSING'
   });
  }
 }

 const report={
  ok:issues.length===0,
  issueCount:issues.length,
  totalItems:state.items.length,
  issues
 };

 window.UTOP_DEBUG?.record?.(
  report.ok?'SUCCESS':'WARNING',
  'FullAudit',
  report.ok
   ?'3D、2D、名稱與世界座標檢查通過'
   :`發現 ${issues.length} 個同步問題`,
  report
 );

 return report;
}

window.UTOP_WORLD_ENGINE={
 schedulePlanRender,
 updateItemTransformOnly,
 updateItemLabelOnly,
 rebuildItemGeometryOnly,

 captureStableTransform,
 applyStableTransform,
 auditCompleteDeviceState,

 auditPlanWorldPositions,

 commitItemMeshTransform,
 commitSelectedMeshTransform,
 install3DTransformCommitFallback,

 getSceneModel:getWorldSceneModel,
 getBarrierGeometry:getBarrierWorldGeometry,
 audit:auditWorldSceneSync,
 repair:repairWorldSceneSync,

 version:WORLD_ENGINE_VERSION,
 getState:getWorldEngineStatus,
 getBounds:getWorldBounds,
 setBounds:setWorldBounds,
 readTransform:readWorldTransform,
 writeTransform:writeWorldTransform,
 syncItem:safeRefreshWorldItem,
 syncItemFromMesh,
 syncAll:syncAllWorldItems,
 worldToPlan:worldToPlanShared,
 planToWorld:planToWorldShared
};

window.__UTOP_RUNTIME_V4525_PARSED__=true;

window.__UTOP_RUNTIME_V4526_COMPLETE_FIX__=true;

window.__UTOP_RUNTIME_V4600_PARTIAL_UPDATE__=true;

window.__UTOP_V5_ALPHA_WORKSPACE__=true;

window.__UTOP_V5_ALPHA1_WORKSPACE_HOTFIX__=true;

window.__UTOP_V5_ALPHA2_ENVIRONMENT_WORLDS__=true;

window.__UTOP_V5_ALPHA3_WORKSPACE_CONTROL_FIX__=true;


window.addEventListener('utop-project-before-save',event=>{
 if(event.detail&&typeof event.detail==='object'){
  event.detail.environment=environmentFxSerialize();
 }
});

window.addEventListener('utop-project-after-load',event=>{
 const environment=event.detail?.environment;
 if(environment){
  environmentFxRestoreFromProject(environment);
 }
});

window.UTOP_ENVIRONMENT_PROJECT=Object.freeze({
 serialize:environmentFxSerialize,
 restore:environmentFxRestoreFromProject
});


window.__UTOP_V5_ALPHA4_ENVIRONMENT_ENGINE__=true;

window.__UTOP_V51_WORKSPACE_FINAL__=true;
window.__UTOP_V512_MONTECARLO_LANE_REBUILD__=true;

/* V5.1.3.45：修正汽車／摩托車前後方向，並升級為具前後辨識與車輛細節的 3D 外觀。 */
