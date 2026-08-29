
const SCENE_URL=new URL('./scene.json',import.meta.url);

let host=null;
let data=null;
let root=null;
let loaded=false;
let previousBaseVisible=true;
let snowPoints=null;
let snowAnimation=null;
let roadCurve=null;
let roadSamples=[];
let THREERef=null;
const createdIds=[];

const ROAD_WIDTH=6;
const ROAD_HALF=ROAD_WIDTH/2;
const SHOULDER_WIDTH=1.35;
const TERRAIN_HALF=13;
const ROAD_SEGMENTS=180;
const SCENE_MIN_HEIGHT=-10;
const SCENE_MAX_HEIGHT=4;


function getHost(){
 host=window.UTOP_SCENE_HOST;
 if(!host)throw new Error('UTOP主系統尚未載入');
 return host;
}
async function getData(){
 if(data)return data;
 const response=await fetch(SCENE_URL,{cache:'no-store'});
 if(!response.ok)throw new Error(`雪地道路scene.json讀取失敗：${response.status}`);
 data=await response.json();
 return data;
}
function material(THREE,color,options={}){
 return new THREE.MeshStandardMaterial({
  color,
  roughness:options.roughness??.9,
  metalness:options.metalness??.02,
  side:options.side??THREE.FrontSide,
  transparent:options.transparent??false,
  opacity:options.opacity??1
 });
}
function addMesh(THREE,parent,geometry,mat,position={}){
 const mesh=new THREE.Mesh(geometry,mat);
 mesh.position.set(position.x||0,position.y||0,position.z||0);
 mesh.castShadow=true;
 mesh.receiveShadow=true;
 parent.add(mesh);
 return mesh;
}
function roadControlPoints(THREE){
 /*
  * 上層直路 → 第一彎 → 約30°下降 → 第二彎 → 下層直路。
  * 高度差8m；下坡中心線有效水平距離約14m，
  * atan(8/14)約29.7°。
  */
 return [
  new THREE.Vector3(0,0,30),
  new THREE.Vector3(0,0,24),
  new THREE.Vector3(-1,0,17),
  new THREE.Vector3(-7,-1.3,11),
  new THREE.Vector3(-10,-4.0,5),
  new THREE.Vector3(-7,-6.7,-1),
  new THREE.Vector3(0,-8,-8),
  new THREE.Vector3(6,-8,-14),
  new THREE.Vector3(5,-8,-21),
  new THREE.Vector3(5,-8,-30)
 ];
}
function createRoadCurve(THREE){
 roadCurve=new THREE.CatmullRomCurve3(
  roadControlPoints(THREE),
  false,
  'centripetal',
  .45
 );
 roadSamples=[];
 for(let i=0;i<=ROAD_SEGMENTS;i++){
  const t=i/ROAD_SEGMENTS;
  const point=roadCurve.getPointAt(t);
  const tangent=roadCurve.getTangentAt(t).normalize();
  const side=new THREE.Vector3(-tangent.z,0,tangent.x).normalize();
  roadSamples.push({t,point,tangent,side});
 }
}
function buildStripGeometry(THREE,leftOffset,rightOffset,heightOffset=0){
 const positions=[];
 const uvs=[];
 const indices=[];
 for(let i=0;i<roadSamples.length;i++){
  const sample=roadSamples[i];
  const left=sample.point.clone().add(sample.side.clone().multiplyScalar(leftOffset));
  const right=sample.point.clone().add(sample.side.clone().multiplyScalar(rightOffset));
  left.y+=heightOffset;
  right.y+=heightOffset;
  positions.push(left.x,left.y,left.z,right.x,right.y,right.z);
  uvs.push(0,sample.t*18,1,sample.t*18);
  if(i<roadSamples.length-1){
   const a=i*2,b=a+1,c=a+2,d=a+3;
   indices.push(a,c,b,b,c,d);
  }
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 geometry.setIndex(indices);
 geometry.computeVertexNormals();
 return geometry;
}
function buildTerrainCorridor(THREE){
 const offsets=[
  -TERRAIN_HALF,
  -(ROAD_HALF+SHOULDER_WIDTH),
  -ROAD_HALF,
  ROAD_HALF,
  ROAD_HALF+SHOULDER_WIDTH,
  TERRAIN_HALF
 ];
 const positions=[];
 const indices=[];
 const colors=[];
 const white=new THREE.Color(0xe2ebf0);
 const blueWhite=new THREE.Color(0xcbdbe4);

 for(let i=0;i<roadSamples.length;i++){
  const sample=roadSamples[i];
  offsets.forEach(offset=>{
   const p=sample.point.clone().add(sample.side.clone().multiplyScalar(offset));
   const abs=Math.abs(offset);
   if(abs<=ROAD_HALF){
    p.y-=.11;
   }else if(abs<=ROAD_HALF+SHOULDER_WIDTH){
    p.y-=.18+(abs-ROAD_HALF)*.11;
   }else{
    const ratio=(abs-(ROAD_HALF+SHOULDER_WIDTH))/
     (TERRAIN_HALF-(ROAD_HALF+SHOULDER_WIDTH));
    p.y-=.34+ratio*1.65;
   }
   positions.push(p.x,p.y,p.z);
   const c=white.clone().lerp(blueWhite,Math.min(1,abs/TERRAIN_HALF));
   colors.push(c.r,c.g,c.b);
  });
 }
 const cols=offsets.length;
 for(let row=0;row<roadSamples.length-1;row++){
  for(let col=0;col<cols-1;col++){
   const a=row*cols+col;
   const b=a+1;
   const c=a+cols;
   const d=c+1;
   indices.push(a,c,b,b,c,d);
  }
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geometry.setIndex(indices);
 geometry.computeVertexNormals();

 const terrain=new THREE.Mesh(
  geometry,
  new THREE.MeshStandardMaterial({
   vertexColors:true,
   roughness:.98,
   metalness:0,
   side:THREE.DoubleSide
  })
 );
 terrain.receiveShadow=true;
 root.add(terrain);
}
function buildRoadSurface(THREE){
 const road=addMesh(
  THREE,
  root,
  buildStripGeometry(THREE,-ROAD_HALF,ROAD_HALF,.02),
  material(THREE,0x4a535a,{roughness:.97,side:THREE.DoubleSide})
 );
 road.name='SNOW_ROAD_CONTINUOUS_SURFACE';

 // 積雪路肩
 for(const sideSign of [-1,1]){
  addMesh(
   THREE,
   root,
   buildStripGeometry(
    THREE,
    sideSign*(ROAD_HALF+SHOULDER_WIDTH),
    sideSign*ROAD_HALF,
    .035
   ),
   material(THREE,0xe7eff3,{roughness:.98,side:THREE.DoubleSide})
  );

  // 白色邊線，與路面保留高度差，避免閃爍。
  const inner=sideSign*(ROAD_HALF-.18);
  const outer=sideSign*(ROAD_HALF-.10);
  addMesh(
   THREE,
   root,
   buildStripGeometry(THREE,inner,outer,.055),
   material(THREE,0xf4f5f2,{roughness:.82,side:THREE.DoubleSide})
  );
 }
}
function buildGuardRail(THREE,sideSign){
 const points=roadSamples.map(sample=>{
  const point=sample.point.clone().add(
   sample.side.clone().multiplyScalar(sideSign*(ROAD_HALF+.58))
  );
  point.y+=.52;
  return point;
 });
 const curve=new THREE.CatmullRomCurve3(points,false,'centripetal',.45);
 const rail=new THREE.Mesh(
  new THREE.TubeGeometry(curve,ROAD_SEGMENTS,.055,8,false),
  material(THREE,0xaeb9bf,{roughness:.45,metalness:.7})
 );
 rail.castShadow=true;
 root.add(rail);

 for(let i=0;i<roadSamples.length;i+=8){
  const sample=roadSamples[i];
  const pos=sample.point.clone().add(
   sample.side.clone().multiplyScalar(sideSign*(ROAD_HALF+.58))
  );
  const post=addMesh(
   THREE,
   root,
   new THREE.CylinderGeometry(.045,.055,.72,8),
   material(THREE,0x89969d,{roughness:.5,metalness:.55}),
   {x:pos.x,y:pos.y+.18,z:pos.z}
  );
 }
}
function addPine(THREE,x,y,z,scale=1){
 addMesh(
  THREE,root,
  new THREE.CylinderGeometry(.09*scale,.13*scale,1.35*scale,9),
  material(THREE,0x6b503a,{roughness:1}),
  {x,y:y+.67*scale,z}
 );
 for(let layer=0;layer<3;layer++){
  addMesh(
   THREE,root,
   new THREE.ConeGeometry((.56-layer*.11)*scale,(1.0-layer*.08)*scale,12),
   material(THREE,0x315b45,{roughness:.98}),
   {x,y:y+1.1*scale+layer*.34*scale,z}
  );
 }
 addMesh(
  THREE,root,
  new THREE.ConeGeometry(.56*scale,.15*scale,12),
  material(THREE,0xf4f8fa,{roughness:.98}),
  {x,y:y+1.62*scale,z}
 );
}
function nearestRoadSample(x,z){
 let best=roadSamples[0];
 let bestDistance=Infinity;
 for(const sample of roadSamples){
  const dx=sample.point.x-x;
  const dz=sample.point.z-z;
  const d=dx*dx+dz*dz;
  if(d<bestDistance){
   bestDistance=d;
   best=sample;
  }
 }
 return best;
}

function roadHeightAtPosition(x,z){
 const THREE=THREERef||host?.getTHREE?.();
 const sample=nearestRoadSample(Number(x)||0,Number(z)||0);
 if(!sample)return 0;

 const point=new THREE.Vector3(Number(x)||0,0,Number(z)||0);
 const delta=point.clone().sub(
  new THREE.Vector3(sample.point.x,0,sample.point.z)
 );
 const lateral=delta.dot(sample.side);

 // 道路、路肩與鄰近雪坡都使用同一條中心線高度。
 // 遠離道路時，雪地向外稍微下降，讓設備仍貼著可見地形。
 const outside=Math.max(
  0,
  Math.abs(lateral)-(ROAD_HALF+SHOULDER_WIDTH)
 );
 return sample.point.y-Math.min(1.65,outside*.18);
}
function populateTrees(THREE){
 for(let i=8;i<roadSamples.length-8;i+=9){
  const sample=roadSamples[i];
  for(const sideSign of [-1,1]){
   const distance=8.4+(i%3)*1.5;
   const p=sample.point.clone().add(
    sample.side.clone().multiplyScalar(sideSign*distance)
   );
   p.y-=.9;
   addPine(THREE,p.x,p.y,p.z,.85+(i%4)*.1);
  }
 }
}
function addSnow(THREE){
 const count=1800;
 const positions=new Float32Array(count*3);
 for(let i=0;i<count;i++){
  positions[i*3]=(Math.random()-.5)*48;
  positions[i*3+1]=Math.random()*28-10;
  positions[i*3+2]=(Math.random()-.5)*70;
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
 const snowMaterial=new THREE.PointsMaterial({
  color:0xffffff,
  size:.12,
  transparent:true,
  opacity:.82,
  depthWrite:false,
  sizeAttenuation:true
 });
 snowPoints=new THREE.Points(geometry,snowMaterial);
 root.add(snowPoints);

 const animate=()=>{
  if(!loaded||!snowPoints)return;
  const attr=snowPoints.geometry.attributes.position;
  for(let i=0;i<count;i++){
   let y=attr.getY(i)-.028-Math.random()*.012;
   let x=attr.getX(i)+.004;
   if(y<-11)y=18+Math.random()*7;
   attr.setY(i,y);
   attr.setX(i,x);
  }
  attr.needsUpdate=true;
  snowAnimation=requestAnimationFrame(animate);
 };
 animate();
}
function buildScene(){
 const THREE=host.getTHREE();
 THREERef=THREE;
 previousBaseVisible=host.getBaseSceneVisible?.()!==false;
 host.setBaseSceneVisible?.(false);

 root=new THREE.Group();
 root.name='SCENE_PLUGIN_SNOW_ROAD_RACING_TERRAIN';
 host.getRoot().parent.add(root);

 createRoadCurve(THREE);
 buildTerrainCorridor(THREE);
 buildRoadSurface(THREE);
 buildGuardRail(THREE,-1);
 buildGuardRail(THREE,1);
 populateTrees(THREE);
 addSnow(THREE);

 const hemisphere=new THREE.HemisphereLight(0xe7f3ff,0x70808a,.88);
 root.add(hemisphere);
 const directional=new THREE.DirectionalLight(0xffffff,.72);
 directional.position.set(-14,24,18);
 directional.castShadow=true;
 root.add(directional);

 root.userData.slopeDegrees=30;
 root.userData.roadCurve=roadCurve;

 host.setSceneHeightRange?.({
  min:SCENE_MIN_HEIGHT,
  max:SCENE_MAX_HEIGHT,
  step:.1,
  source:'snow-road'
 });
 host.setHeightProvider?.(roadHeightAtPosition);
}
function svgPathFromSamples(worldToPlan,offset=0){
 return roadSamples.map((sample,index)=>{
  const p=sample.point.clone().add(
   sample.side.clone().multiplyScalar(offset)
  );
  const plan=worldToPlan(p.x,p.z);
  return `${index===0?'M':'L'}${plan.x.toFixed(1)},${plan.y.toFixed(1)}`;
 }).join(' ');
}
function installPlanRenderer(){
 host.setPlanWorldBounds(data.planBounds);
 host.setPlanRenderer(({root,svgElement,addPlanLabel,worldToPlan})=>{
  const snowField=svgElement('rect',{
   x:35,y:22,width:690,height:606,rx:12,
   fill:'#e8f1f5',stroke:'#b7c9d2','stroke-width':2
  });
  root.appendChild(snowField);

  const shoulderWidth=48;
  const roadWidth=34;

  const shoulder=svgElement('path',{
   d:svgPathFromSamples(worldToPlan,0),
   fill:'none',
   stroke:'#dce8ee',
   'stroke-width':shoulderWidth,
   'stroke-linecap':'round',
   'stroke-linejoin':'round'
  });
  root.appendChild(shoulder);

  const road=svgElement('path',{
   d:svgPathFromSamples(worldToPlan,0),
   fill:'none',
   stroke:'#545e65',
   'stroke-width':roadWidth,
   'stroke-linecap':'round',
   'stroke-linejoin':'round'
  });
  root.appendChild(road);

  for(const offset of [-ROAD_HALF+.18,ROAD_HALF-.18]){
   root.appendChild(svgElement('path',{
    d:svgPathFromSamples(worldToPlan,offset),
    fill:'none',
    stroke:'#f4f6f4',
    'stroke-width':2.4,
    'stroke-linecap':'round',
    'stroke-linejoin':'round'
   }));
  }

  const start=worldToPlan(0,26);
  addPlanLabel(root,'上層平面',start.x+35,start.y,'start');

  const slope=worldToPlan(-8,4);
  addPlanLabel(root,'S彎／30°下坡',slope.x+34,slope.y,'start');

  const end=worldToPlan(5,-25);
  addPlanLabel(root,'下層平面',end.x+30,end.y,'start');

  // 坡度方向箭頭
  const arrowStart=worldToPlan(-6,9);
  const arrowEnd=worldToPlan(-5,-2);
  root.appendChild(svgElement('line',{
   x1:arrowStart.x,y1:arrowStart.y,
   x2:arrowEnd.x,y2:arrowEnd.y,
   stroke:'#38a0d2','stroke-width':4,
   'marker-end':'url(#planArrowHead)'
  }));
  return true;
 });
}
async function addDevices(){
 const THREE=host.getTHREE();
 for(const spec of data.devices){
  if(!host.getDefinition(spec.type))continue;
  const item=host.addDevice(spec.type);
  item.name=spec.name;
  item.x=spec.x;
  item.z=spec.z;
  const roadY=roadHeightAtPosition(item.x,item.z);
  item.y=roadY+(Number(spec.groundOffset)||0);
  item.sceneId='snow-road';
  item.params={
   ...item.params,
   ...(spec.params||{}),
   rotation:spec.rotation||0,
   installationHeight:item.y,
   followGround:true,
   groundHeight:roadY,
   groundOffset:Number(spec.groundOffset)||0
  };
  if(item.mesh){
   item.mesh.position.set(item.x,item.y,item.z);
   item.mesh.rotation.y=THREE.MathUtils.degToRad(spec.rotation||0);
  }
  createdIds.push(item.id);
 }
 host.render();
 host.renderPlan();
 host.markDirty();
}
async function activate(){
 if(loaded)return true;
 getHost();
 await getData();
 buildScene();
 installPlanRenderer();
  // V4.1.3：場景只載入環境，設備由使用者自行加入。

 const camera=host.getCamera();
 const controls=host.getControls();
 camera.position.set(28,20,38);
 controls.target.set(-1,-3,0);
 controls.update();

 loaded=true;
 window.dispatchEvent(new CustomEvent('utop-snow-road-loaded'));
 window.UTOP_DEBUG?.record?.(
  'SUCCESS',
  'Scene',
  '雪地道路賽車地形版載入完成',
  {continuousRoad:true,slope:30,planSynced:true}
 );
 return true;
}
function unload(){
 if(!host)host=window.UTOP_SCENE_HOST;
 if(!host)return;

 if(snowAnimation)cancelAnimationFrame(snowAnimation);
 snowAnimation=null;

 host.removeItems(item=>item.sceneId==='snow-road');
 createdIds.length=0;

 if(root?.parent)root.parent.remove(root);
 root=null;
 snowPoints=null;
 roadCurve=null;
 roadSamples=[];
 THREERef=null;
 loaded=false;

 host.clearPlanRenderer?.();
 host.clearHeightProvider?.();
 host.resetSceneHeightRange?.();
 host.setPlanWorldBounds({
  minX:-7.4,maxX:7.4,minZ:-8.2,maxZ:8.2
 });
 host.setBaseSceneVisible?.(previousBaseVisible);
 host.render();

 window.dispatchEvent(new CustomEvent('utop-snow-road-unloaded'));
}
window.UTOP_SNOW_ROAD_PLUGIN=Object.freeze({
 activate,
 unload,
 isLoaded:()=>loaded,
 getRoadCurve:()=>roadCurve,
 getRoadSamples:()=>roadSamples
});
