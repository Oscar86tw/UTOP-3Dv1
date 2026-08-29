
export function setPartVisibility(root, partName, visible) {
  if (!root) return;
  root.traverse?.(object => {
    if (String(object.name || '').toLowerCase() === String(partName).toLowerCase()) {
      object.visible = Boolean(visible);
    }
  });
}

export function applyPartsVisibility(item) {
  const visibility = item?.params?.partsVisibility || {};
  for (const [partName, visible] of Object.entries(visibility)) {
    setPartVisibility(item.mesh, partName, visible);
  }
}
