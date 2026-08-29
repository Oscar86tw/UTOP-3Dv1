
export const MATERIAL_LIBRARY_URL=new URL('../../assets/materials/material-library-v3000.json',import.meta.url).href;
let manifestPromise=null;
export async function loadMaterialManifest(){
  if(!manifestPromise){
    manifestPromise=fetch(MATERIAL_LIBRARY_URL,{cache:'no-cache'}).then(response=>{
      if(!response.ok)throw new Error(`Material manifest HTTP ${response.status}`);
      return response.json();
    });
  }
  return manifestPromise;
}
export function createDescriptor(name,material,index=0){
  return {id:`${name}-${index}`,baseColor:material.baseColor,roughness:material.roughness??.5,metalness:material.metalness??0,clearcoat:material.clearcoat??0,clearcoatRoughness:material.clearcoatRoughness??.25,transmission:material.transmission??0,ior:material.ior??1.45,thickness:material.thickness??0,emissive:material.emissive??'#000000',emissiveIntensity:material.emissiveIntensity??0,normalStrength:material.normalStrength??0,microVariation:material.microVariation??0};
}
export async function resolveDeviceMaterials(device){
  const manifest=await loadMaterialManifest();
  const key=String(device?.type||device?.deviceType||device?.model||device?.code||'').toLowerCase();
  let names=null;
  for(const [type,list] of Object.entries(manifest.deviceMaterialMap||{})){
    if(key.includes(type)){names=list;break;}
  }
  names=names||['darkPlastic'];
  return names.map((name,index)=>createDescriptor(name,manifest.materials[name]||{},index));
}
export function applyDescriptor(target,d){
  if(!target||!d)return;
  target.userData=target.userData||{};
  target.userData.pbrMaterial={...d};
  const m=target.material;
  if(!m)return;
  for(const key of ['roughness','metalness','clearcoat','clearcoatRoughness','transmission','ior','thickness','emissiveIntensity']){
    if(key in m&&d[key]!==undefined)m[key]=d[key];
  }
  m.needsUpdate=true;
}
export async function applyDevicePbrMaterials(root,device){
  if(!root)return;
  const descriptors=await resolveDeviceMaterials(device);
  const meshes=[];
  if(typeof root.traverse==='function')root.traverse(node=>{if(node?.isMesh||node?.material)meshes.push(node);});
  else meshes.push(root);
  meshes.forEach((mesh,index)=>applyDescriptor(mesh,descriptors[index%descriptors.length]));
}
