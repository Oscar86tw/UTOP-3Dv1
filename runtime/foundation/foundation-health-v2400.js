const VERSION = '2.4.0';

function inspectFoundation() {
  return {
    version: VERSION,
    runtimeLoaded: Boolean(document.getElementById('sceneCanvas')),
    canvasReady: Boolean(document.getElementById('sceneCanvas')),
    planReady: Boolean(document.getElementById('planSvg')),
    moduleLibraryReady: Boolean(document.querySelector('[data-add]')),
    statusReady: Boolean(document.getElementById('statusText'))
  };
}

function verifyFoundation() {
  const health = inspectFoundation();
  if (!health.canvasReady) throw new Error('找不到3D畫布 sceneCanvas');
  if (!health.planReady) throw new Error('找不到2D平面 planSvg');
  if (!health.moduleLibraryReady) throw new Error('找不到模組庫按鈕');
  return health;
}

window.UTOP_FOUNDATION = Object.freeze({
  version: VERSION,
  inspect: inspectFoundation,
  verify: verifyFoundation
});

document.documentElement.dataset.utopFoundation = 'ready';
window.dispatchEvent(new CustomEvent('utop:foundation-ready', {
  detail: { version: VERSION }
}));
