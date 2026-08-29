
import {loadMaterialManifest} from './pbr-material-engine-v3000.js';
export async function applyEnvironmentProfile(scene,name='day-clear'){
  const manifest=await loadMaterialManifest();
  const profile=manifest.environmentProfiles?.[name]||manifest.environmentProfiles?.['day-clear'];
  if(scene){
    scene.userData=scene.userData||{};
    scene.userData.environmentProfile={name,...profile};
  }
  window.dispatchEvent(new CustomEvent('utop-environment-profile-change',{detail:{name,...profile}}));
  return profile;
}
