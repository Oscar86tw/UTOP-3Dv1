
const SCENE_URL=new URL('./scene.json',import.meta.url);

let host=null;
let data=null;
let root=null;
let roadSamples=[];
let routeGroup=null;
let loaded=false;
let previousBaseVisible=true;

const SAMPLE_STEP=.08;
const SCENE_BOUNDS={
 minX:-5,
 maxX:6,
 minZ:-1.95,
 maxZ:14.95
};

function getHost(){
 host=window.UTOP_SCENE_HOST;
 if(!host)throw new Error('UTOP V5.1 主系統尚未完成載入');
 return host;
}

async function getData(){
 if(data)return data;
 const response=await fetch(SCENE_URL,{cache:'no-store'});
 if(!response.ok)throw new Error(`scene.json ${response.status}`);
 data=await response.json();
 return data;
}

function material(THREE,color,options={}){
 return new THREE.MeshStandardMaterial({
  color,
  roughness:options.roughness??.9,
  metalness:options.metalness??.02,
  side:options.side??THREE.DoubleSide,
  transparent:options.transparent??false,
  opacity:options.opacity??1
 });
}

function sampleExactRoute(THREE){
 const slope=THREE.MathUtils.degToRad(
  data.dimensions.slopeDegrees
 );
 const straightLength=
  data.dimensions.outdoorStraightLength+
  data.dimensions.coveredStraightLength;
 const curveLength=data.dimensions.curvePathLength;
 const turn=THREE.MathUtils.degToRad(
  data.dimensions.rightTurnDegrees
 );
 const radius=curveLength/turn;
 const b1Length=data.dimensions.b1StraightLength;

 const samples=[];
 const startZ=11;
 const dropPerMeter=Math.tan(slope);

 // Segment A+B: exact straight line toward -Z.
 const straightCount=Math.ceil(straightLength/SAMPLE_STEP);
 for(let i=0;i<=straightCount;i++){
  const distance=straightLength*i/straightCount;
  samples.push({
   segment:distance<=data.dimensions.outdoorStraightLength
    ?'OUTDOOR'
    :'COVERED_STRAIGHT',
   distance,
   point:new THREE.Vector3(
    0,
    -dropPerMeter*distance,
    startZ-distance
   ),
   tangent:new THREE.Vector3(0,-dropPerMeter,-1).normalize()
  });
 }

 // Segment C: exact circular arc to driver's right (+X), 45 degrees.
 const curveStart=new THREE.Vector3(
  0,
  -dropPerMeter*straightLength,
  startZ-straightLength
 );
 const centerX=radius;
 const centerZ=curveStart.z;
 const curveCount=Math.ceil(curveLength/SAMPLE_STEP);

 for(let i=1;i<=curveCount;i++){
  const fraction=i/curveCount;
  const angle=Math.PI+turn*fraction;
  const distance=straightLength+curveLength*fraction;
  const point=new THREE.Vector3(
   centerX+Math.cos(angle)*radius,
   -dropPerMeter*distance,
   centerZ+Math.sin(angle)*radius
  );
  const tangent=new THREE.Vector3(
   -Math.sin(angle),
   -dropPerMeter*radius,
   Math.cos(angle)
  ).normalize();

  samples.push({
   segment:'RIGHT_CURVE',
   distance,
   point,
   tangent
  });
 }

 // Segment D: exact 45-degree straight line after curve = B1 junction.
 const curveEnd=samples[samples.length-1].point.clone();
 const heading=new THREE.Vector3(
  Math.sin(turn),
  0,
  -Math.cos(turn)
 ).normalize();
 const b1Count=Math.ceil(b1Length/SAMPLE_STEP);

 for(let i=1;i<=b1Count;i++){
  const fraction=i/b1Count;
  const point=curveEnd.clone().add(
   heading.clone().multiplyScalar(
    b1Length*fraction
   )
  );
  // B1 entrance is flat after curve.
  point.y=curveEnd.y;

  samples.push({
   segment:'B1',
   distance:straightLength+curveLength+b1Length*fraction,
   point,
   tangent:heading.clone()
  });
 }

 // Horizontal right vector for every sample.
 for(const sample of samples){
  sample.side=new THREE.Vector3(
   -sample.tangent.z,
   0,
   sample.tangent.x
  ).normalize();
 }

 return samples;
}

function stripGeometry(THREE,leftOffset,rightOffset,yOffset=0){
 const positions=[];
 const indices=[];

 roadSamples.forEach((sample,index)=>{
  const left=sample.point.clone().add(
   sample.side.clone().multiplyScalar(leftOffset)
  );
  const right=sample.point.clone().add(
   sample.side.clone().multiplyScalar(rightOffset)
  );
  left.y+=yOffset;
  right.y+=yOffset;

  positions.push(
   left.x,left.y,left.z,
   right.x,right.y,right.z
  );

  if(index<roadSamples.length-1){
   const a=index*2;
   indices.push(a,a+2,a+1,a+1,a+2,a+3);
  }
 });

 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute(
  'position',
  new THREE.Float32BufferAttribute(positions,3)
 );
 geometry.setIndex(indices);
 geometry.computeVertexNormals();
 return geometry;
}

function wallGeometry(THREE,sideSign,height){
 const half=data.dimensions.laneWidth/2;
 const positions=[];
 const indices=[];

 roadSamples.forEach((sample,index)=>{
  const base=sample.point.clone().add(
   sample.side.clone().multiplyScalar(
    sideSign*(half+.08)
   )
  );
  const top=base.clone();
  top.y+=height;

  positions.push(
   base.x,base.y,base.z,
   top.x,top.y,top.z
  );

  if(index<roadSamples.length-1){
   const a=index*2;
   if(sideSign<0){
    indices.push(a,a+1,a+2,a+1,a+3,a+2);
   }else{
    indices.push(a,a+2,a+1,a+1,a+2,a+3);
   }
  }
 });

 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute(
  'position',
  new THREE.Float32BufferAttribute(positions,3)
 );
 geometry.setIndex(indices);
 geometry.computeVertexNormals();
 return geometry;
}

function addText(THREE,text,position,color='#6bd8ff',scale=.72){
 const canvas=document.createElement('canvas');
 canvas.width=512;
 canvas.height=128;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle='rgba(5,18,26,.88)';
 ctx.fillRect(0,0,512,128);
 ctx.strokeStyle=color;
 ctx.lineWidth=5;
 ctx.strokeRect(4,4,504,120);
 ctx.fillStyle=color;
 ctx.font='900 48px sans-serif';
 ctx.textAlign='center';
 ctx.textBaseline='middle';
 ctx.fillText(text,256,66);

 const texture=new THREE.CanvasTexture(canvas);
 const sprite=new THREE.Sprite(
  new THREE.SpriteMaterial({map:texture,transparent:true})
 );
 sprite.position.copy(position);
 sprite.scale.set(4.2*scale,1.05*scale,1);
 root.add(sprite);
}

function buildScene(THREE){
 roadSamples=sampleExactRoute(THREE);
 const half=data.dimensions.laneWidth/2;

 // Outside road at 1F.
 const outside=new THREE.Mesh(
  new THREE.BoxGeometry(9,.15,3.2),
  material(THREE,0x565a5c)
 );
 outside.position.set(0,-.08,12.35);
 outside.receiveShadow=true;
 root.add(outside);

 // Continuous exact road.
 const road=new THREE.Mesh(
  stripGeometry(THREE,-half,half,.02),
  material(THREE,0x393d3f,{
   roughness:.98
  })
 );
 road.name='MONTECARLO_EXACT_RIGHT_TURN_LANE';
 road.receiveShadow=true;
 root.add(road);

 // Thin white edge markings.
 for(const sign of [-1,1]){
  const line=new THREE.Mesh(
   stripGeometry(
    THREE,
    sign*(half-.12),
    sign*(half-.04),
    .055
   ),
   material(THREE,0xf2f1eb)
  );
  root.add(line);
 }

 // Simple vertical retaining walls only — no roof/ceiling slab.
 for(const sign of [-1,1]){
  const wall=new THREE.Mesh(
   wallGeometry(
    THREE,
    sign,
    data.dimensions.wallHeight
   ),
   material(THREE,0xb9ad9c,{
    roughness:.94
   })
  );
  wall.castShadow=true;
  wall.receiveShadow=true;
  root.add(wall);
 }

 // Drainage grate at slope start.
 const drain=new THREE.Mesh(
  new THREE.BoxGeometry(
   data.dimensions.laneWidth+.4,
   .045,
   .24
  ),
  material(THREE,0x485055,{
   roughness:.45,
   metalness:.68
  })
 );
 drain.position.set(0,.02,10.86);
 root.add(drain);

 // Route line.
 routeGroup=new THREE.Group();
 root.add(routeGroup);

 const routePoints=roadSamples.map(sample=>{
  const point=sample.point.clone();
  point.y+=.15;
  return point;
 });

 const routeLine=new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(routePoints),
  new THREE.LineBasicMaterial({color:0x20a9ff})
 );
 routeGroup.add(routeLine);

 // Right-turn arrow, clearly pointing to driver's right.
 const curveMiddle=roadSamples.find(sample=>
  sample.segment==='RIGHT_CURVE'
 );
 const arrowOrigin=curveMiddle
  ?curveMiddle.point.clone().add(new THREE.Vector3(0,.28,0))
  :new THREE.Vector3(0,-1.6,7);

 const arrow=new THREE.ArrowHelper(
  new THREE.Vector3(.707,0,-.707).normalize(),
  arrowOrigin,
  1.15,
  0xffb628,
  .32,
  .2
 );
 routeGroup.add(arrow);

 const first=roadSamples[0].point;
 const outdoorEnd=roadSamples.findLast?.(
  sample=>sample.segment==='OUTDOOR'
 )?.point||roadSamples[Math.floor(roadSamples.length*.4)].point;
 const curvePoint=roadSamples.find(
  sample=>sample.segment==='RIGHT_CURVE'
 )?.point;
 const end=roadSamples[roadSamples.length-1].point;

 addText(
  THREE,
  '1F 戶外入口',
  first.clone().add(new THREE.Vector3(0,1.2,1.0)),
  '#69d8ff'
 );
 addText(
  THREE,
  '下坡25°／戶外3m',
  outdoorEnd.clone().add(new THREE.Vector3(-2.8,1.05,0)),
  '#ffe06c',
  .66
 );
 if(curvePoint){
  addText(
   THREE,
   '向右轉45°',
   curvePoint.clone().add(new THREE.Vector3(2.4,1.1,.2)),
   '#ffbd42',
   .7
  );
 }
 addText(
  THREE,
  'B1 路口',
  end.clone().add(new THREE.Vector3(1.5,1.15,-.3)),
  '#72f09c',
  .72
 );
}

function heightAt(x,z){
 let nearest=null;
 let distance=Infinity;

 for(const sample of roadSamples){
  const dx=x-sample.point.x;
  const dz=z-sample.point.z;
  const value=dx*dx+dz*dz;
  if(value<distance){
   distance=value;
   nearest=sample.point;
  }
 }

 const reach=data.dimensions.laneWidth/2+.3;
 return nearest&&distance<=reach*reach
  ?nearest.y
  :null;
}

function renderPlan({root:planRoot,svgElement,addPlanLabel,worldToPlan}){
 const points=roadSamples.map(sample=>
  worldToPlan(sample.point.x,sample.point.z)
 );

 if(points.length<2)return false;

 const path=points.map((point,index)=>
  `${index===0?'M':'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`
 ).join(' ');

 planRoot.appendChild(svgElement('path',{
  d:path,
  fill:'none',
  stroke:'#e6e8e7',
  'stroke-width':'116',
  'stroke-linecap':'round',
  'stroke-linejoin':'round'
 }));

 planRoot.appendChild(svgElement('path',{
  d:path,
  fill:'none',
  stroke:'#3b4144',
  'stroke-width':'106',
  'stroke-linecap':'round',
  'stroke-linejoin':'round'
 }));

 planRoot.appendChild(svgElement('path',{
  d:path,
  fill:'none',
  stroke:'#25aaff',
  'stroke-width':'5',
  'stroke-linecap':'round',
  'stroke-linejoin':'round'
 }));

 const first=points[0];
 const curveIndex=roadSamples.findIndex(
  sample=>sample.segment==='RIGHT_CURVE'
 );
 const curve=points[Math.max(0,curveIndex)];
 const end=points[points.length-1];

 addPlanLabel(planRoot,'1F入口',first.x,first.y-28);
 addPlanLabel(planRoot,'右轉45°',curve.x+48,curve.y-12);
 addPlanLabel(planRoot,'B1路口',end.x+38,end.y+20);

 // Explicit orange right-turn arrow.
 const arrow=svgElement('path',{
  d:`M ${curve.x-30} ${curve.y+25}
     Q ${curve.x+4} ${curve.y-28}
       ${curve.x+52} ${curve.y-15}`,
  fill:'none',
  stroke:'#ffb52c',
  'stroke-width':'8',
  'stroke-linecap':'round'
 });
 planRoot.appendChild(arrow);

 planRoot.appendChild(svgElement('polygon',{
  points:
   `${curve.x+52},${curve.y-15} `+
   `${curve.x+33},${curve.y-28} `+
   `${curve.x+37},${curve.y-6}`,
  fill:'#ffb52c'
 }));

 return true;
}

function camera(name){
 const camera=host.getCamera();
 const controls=host.getControls();
 const presets={
  overview:{
   position:[10,7.5,15],
   target:[.4,-1.4,7.2]
  },
  entrance:{
   position:[0,3.2,15],
   target:[0,-1,8.2]
  },
  turn:{
   position:[7.5,3.0,9.0],
   target:[.8,-2.1,6.8]
  },
  section:{
   position:[12,1.7,10],
   target:[0,-1.5,7.4]
  }
 };
 const preset=presets[name]||presets.overview;
 camera.position.set(...preset.position);
 controls.target.set(...preset.target);
 controls.update();
 host.render();
}

async function activate(){
 if(loaded)return true;

 getHost();
 await getData();
 const THREE=host.getTHREE();

 previousBaseVisible=
  host.getBaseSceneVisible?.()!==false;
 host.setBaseSceneVisible?.(false);

 root=new THREE.Group();
 root.name='SCENE_MONTECARLO_V512_CLEAN_LANE';
 host.getRoot().parent.add(root);

 buildScene(THREE);

 host.setPlanWorldBounds?.(SCENE_BOUNDS);
 host.setPlanRenderer?.(renderPlan);
 host.setSceneHeightRange?.(-3.4,2.2);
 host.setHeightProvider?.(heightAt);

 loaded=true;
 camera('overview');
 host.render();
 host.renderPlan();

 window.dispatchEvent(
  new CustomEvent('utop-montecarlo-loaded')
 );
 return true;
}

function unload(){
 if(!host)return;

 host.removeItems?.(
  item=>item.sceneId==='montecarlo'
 );

 if(root?.parent)root.parent.remove(root);
 root=null;
 roadSamples=[];
 routeGroup=null;
 loaded=false;

 host.clearPlanRenderer?.();
 host.clearHeightProvider?.();
 host.resetSceneHeightRange?.();
 host.setPlanWorldBounds?.({
  minX:-10,
  maxX:10,
  minZ:-10,
  maxZ:10
 });
 host.setBaseSceneVisible?.(previousBaseVisible);
 host.render();
 host.renderPlan();

 window.dispatchEvent(
  new CustomEvent('utop-montecarlo-unloaded')
 );
}

window.UTOP_MONTECARLO_PLUGIN=Object.freeze({
 activate,
 unload,
 setFloor:mode=>{
  if(mode==='1F')camera('entrance');
  else if(mode==='B1')camera('turn');
  else if(mode==='SECTION')camera('section');
  else camera('overview');
 },
 setCamera:camera,
 setRoofVisible:()=>{},
 setRouteVisible:value=>{
  if(routeGroup)routeGroup.visible=Boolean(value);
  host?.render?.();
 },
 isLoaded:()=>loaded,
 getRoute:()=>roadSamples.map(sample=>({
  x:sample.point.x,
  y:sample.point.y,
  z:sample.point.z,
  segment:sample.segment
 }))
});
