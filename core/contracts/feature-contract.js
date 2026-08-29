export function assertFeatureManifest(feature) {
  if (!feature?.id) throw new Error('Feature 缺少 id');
  if (typeof feature.init !== 'function') throw new Error(`Feature ${feature.id} 缺少 init(context)`);
  return feature;
}
