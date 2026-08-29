
const SCENE_URL=new URL('./scene.json',import.meta.url);

let host=null;
let data=null;
let root=null;
let loaded=false;
let previousBaseSceneVisible=true;
const createdItemIds=[];

// V5.1.3.31：在既有23.4m長車道基礎上再增加50%，改為35.1m。
// 3D道路、2D可操作深度與設備配置範圍同步拉長，維持長型進出模擬。
const ROAD_LENGTH=35.1;
const ROAD_HALF=ROAD_LENGTH/2;
const TEST_AREA_WIDTH=13;
const TEST_AREA_DEPTH=23.4;

function getHost(){
  host=window.UTOP_SCENE_HOST;
  if(!host)throw new Error('UTOP主系統尚未完成載入');
  return host;
}

async function getData(){
  if(data)return data;
  const response=await fetch(SCENE_URL,{cache:'no-store'});
  if(!response.ok)throw new Error(`單車道scene.json讀取失敗：${response.status}`);
  data=await response.json();
  return data;
}

function material(THREE,color,options={}){
  return new THREE.MeshStandardMaterial({
    color,
    roughness:options.roughness??.86,
    metalness:options.metalness??.02,
    transparent:options.transparent??false,
    opacity:options.opacity??1
  });
}

function addMesh(THREE,parent,geometry,mat,position,rotation={}){
  const mesh=new THREE.Mesh(geometry,mat);
  mesh.position.set(position.x||0,position.y||0,position.z||0);
  mesh.rotation.set(rotation.x||0,rotation.y||0,rotation.z||0);
  mesh.castShadow=true;
  mesh.receiveShadow=true;
  parent.add(mesh);
  return mesh;
}

function addShrub(THREE,parent,x,z,scale=1){
  const shrub=addMesh(
    THREE,
    parent,
    new THREE.SphereGeometry(.34*scale,12,9),
    material(THREE,0x4f7d3f,{roughness:1}),
    {x,y:.32*scale,z}
  );
  shrub.scale.set(1.15,.72,.9);
  return shrub;
}

function addTree(THREE,parent,x,z,scale=1){
  const trunk=addMesh(
    THREE,parent,
    new THREE.CylinderGeometry(.08*scale,.11*scale,1.25*scale,10),
    material(THREE,0x6b4a2c,{roughness:1}),
    {x,y:.62*scale,z}
  );
  const crown=addMesh(
    THREE,parent,
    new THREE.SphereGeometry(.52*scale,14,10),
    material(THREE,0x3f7738,{roughness:1}),
    {x,y:1.48*scale,z}
  );
  crown.scale.set(1,.9,1);
  return {trunk,crown};
}

function addRoadArrow(THREE,parent,z){
  const group=new THREE.Group();
  const white=material(THREE,0xf4f4ef,{roughness:.8});

  // 標線與道路頂面保留高度差，避免Z-fighting白色閃爍。
  addMesh(
    THREE,group,
    new THREE.BoxGeometry(.22,.025,1.15),
    white,
    {x:0,y:.045,z:.15}
  );
  addMesh(
    THREE,group,
    new THREE.ConeGeometry(.45,.85,3),
    white,
    {x:0,y:.05,z:-.72},
    {x:Math.PI/2,y:0,z:0}
  );
  group.position.z=z;
  parent.add(group);
}

function addOneWaySign(THREE,parent,x,z){
  const pole=addMesh(
    THREE,parent,
    new THREE.CylinderGeometry(.045,.055,1.9,14),
    material(THREE,0x6a7478,{roughness:.45,metalness:.55}),
    {x,y:.95,z}
  );
  const board=addMesh(
    THREE,parent,
    new THREE.BoxGeometry(.62,.82,.07),
    material(THREE,0xf2f2ec,{roughness:.72}),
    {x,y:1.82,z}
  );
  const blue=addMesh(
    THREE,parent,
    new THREE.BoxGeometry(.49,.49,.075),
    material(THREE,0x1555a8,{roughness:.65}),
    {x,y:1.93,z:.006}
  );
  const arrow=addMesh(
    THREE,parent,
    new THREE.BoxGeometry(.10,.018,.30),
    material(THREE,0xffffff,{roughness:.8}),
    {x,y:1.93,z:.048},
    {x:Math.PI/2}
  );
  return {pole,board,blue,arrow};
}

function buildEnvironment(){
  const THREE=host.getTHREE();

  // 隱藏原本基礎雙車道路面，避免看起來像兩條車道，
  // 並消除兩個平面重疊造成的白色閃爍。
  previousBaseSceneVisible=host.getBaseSceneVisible?.()!==false;
  host.setBaseSceneVisible?.(false);

  root=new THREE.Group();
  root.name='SCENE_PLUGIN_SINGLE_LANE';
  host.getRoot().parent.add(root);

  // 單一長車道：只有左右邊線，沒有中央分隔線。
  addMesh(
    THREE,root,
    new THREE.BoxGeometry(5.6,.12,ROAD_LENGTH),
    material(THREE,0x4b5154,{roughness:.98}),
    {x:0,y:-.06,z:0}
  );

  for(const side of [-1,1]){
    addMesh(
      THREE,root,
      new THREE.BoxGeometry(1.45,.13,ROAD_LENGTH),
      material(THREE,0xbeb9ae,{roughness:.94}),
      {x:side*3.53,y:.065,z:0}
    );
    addMesh(
      THREE,root,
      new THREE.BoxGeometry(.18,.22,ROAD_LENGTH),
      material(THREE,0xd4d6d3,{roughness:.9}),
      {x:side*2.89,y:.11,z:0}
    );
    addMesh(
      THREE,root,
      new THREE.BoxGeometry(1.35,.08,ROAD_LENGTH),
      material(THREE,0x557d43,{roughness:1}),
      {x:side*4.95,y:-.04,z:0}
    );

    for(let z=-ROAD_HALF+.8;z<=ROAD_HALF-.8;z+=1.45){
      addShrub(THREE,root,side*4.65,z,.75);
    }
    for(let z=-ROAD_HALF+1.2;z<=ROAD_HALF-1.2;z+=3.8){
      addTree(THREE,root,side*5.15,z,1);
    }
  }

  // 左右邊線提高到道路頂面以上，避免閃爍。
  for(const x of [-2.45,2.45]){
    addMesh(
      THREE,root,
      new THREE.BoxGeometry(.075,.025,ROAD_LENGTH-1),
      material(THREE,0xf4f3ed,{roughness:.8}),
      {x,y:.032,z:0}
    );
  }

  addRoadArrow(THREE,root,7.4);
  addRoadArrow(THREE,root,0);
  addRoadArrow(THREE,root,-7.4);
  addOneWaySign(THREE,root,4.05,-1.2);

  const fill=new THREE.HemisphereLight(0xeef8ff,0x5d6f4f,.58);
  root.add(fill);

  // 2D世界範圍同步放大30%。
  host.setPlanWorldBounds?.({
    minX:-TEST_AREA_WIDTH,
    maxX:TEST_AREA_WIDTH,
    minZ:-TEST_AREA_DEPTH,
    maxZ:TEST_AREA_DEPTH
  });
}
async function addDevices(){
  const state=host.getState();
  const items=[];

  for(const spec of data.devices){
    if(!host.getDefinition(spec.type)){
      console.warn('單車道缺少設備定義：',spec.type);
      continue;
    }
    const item=host.addDevice(spec.type);
    item.name=spec.name;
    item.x=spec.x;
    item.y=spec.y;
    item.z=spec.z;
    item.sceneId='single-lane';
    item.params={
      ...item.params,
      ...(spec.params||{}),
      rotation:spec.rotation||0,
      installationHeight:spec.y
    };
    if(item.mesh){
      item.mesh.position.set(item.x,item.y,item.z);
      item.mesh.rotation.y=host.getTHREE().MathUtils.degToRad(spec.rotation||0);
    }
    createdItemIds.push(item.id);
    items.push(item);
  }

  // 使用既有接線資料格式建立三條示範連動線。
  data.wires.forEach((wire,index)=>{
    const source=items[wire.sourceIndex];
    const target=items[wire.targetIndex];
    if(!source||!target)return;
    state.wires.push({
      id:`single_lane_wire_${Date.now()}_${index}`,
      sourceId:source.id,
      sourcePort:wire.sourcePort,
      targetId:target.id,
      targetPort:wire.targetPort
    });
  });

  host.render();
  host.renderPlan();
  host.markDirty();
}

function setCamera(){
  const camera=host.getCamera();
  const controls=host.getControls();
  camera.position.set(10.2,8.8,15.0);
  controls.target.set(0,0.2,-1.2);
  controls.update();
}

async function activate(){
  if(loaded)return true;
  getHost();
  await getData();
  buildEnvironment();
  // V4.1.3：場景只載入環境，設備由使用者自行加入。
  setCamera();
  loaded=true;
  window.dispatchEvent(new CustomEvent('utop-single-lane-loaded'));
  window.UTOP_DEBUG?.record?.(
    'SUCCESS',
    'Scene',
    '單車道場景載入完成',
    {devices:0,defaultModules:false}
  );
  return true;
}

function unload(){
  if(!host)host=window.UTOP_SCENE_HOST;
  if(!host)return;

  host.removeItems(item=>item.sceneId==='single-lane');
  createdItemIds.length=0;

  if(root?.parent)root.parent.remove(root);
  root=null;
  loaded=false;

  host.setBaseSceneVisible?.(previousBaseSceneVisible);
  host.setPlanWorldBounds?.({
    minX:-10,
    maxX:10,
    minZ:-10,
    maxZ:10
  });
  host.render();
  window.dispatchEvent(new CustomEvent('utop-single-lane-unloaded'));
}

window.UTOP_SINGLE_LANE_PLUGIN=Object.freeze({
  activate,
  unload,
  isLoaded:()=>loaded
});
