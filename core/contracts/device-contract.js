const REQUIRED = ['moduleId', 'type', 'name', 'ports'];

export function assertDeviceManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') throw new TypeError('設備 manifest 必須是物件');
  for (const key of REQUIRED) {
    if (manifest[key] == null) throw new Error(`設備 manifest 缺少 ${key}`);
  }
  if (!Array.isArray(manifest.ports)) throw new TypeError('設備 ports 必須是陣列');
  return manifest;
}

export function createDeviceSnapshot(device) {
  return Object.freeze({
    id: String(device.id ?? ''),
    moduleId: String(device.moduleId ?? device.type ?? ''),
    type: String(device.type ?? ''),
    name: String(device.name ?? ''),
    position: Object.freeze({
      x: Number(device.position?.x ?? 0),
      y: Number(device.position?.y ?? 0),
      z: Number(device.position?.z ?? 0)
    }),
    rotation: Object.freeze({
      x: Number(device.rotation?.x ?? 0),
      y: Number(device.rotation?.y ?? 0),
      z: Number(device.rotation?.z ?? 0)
    }),
    state: Object.freeze({ ...(device.state || {}) })
  });
}
