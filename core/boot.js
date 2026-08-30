import { APP_CONFIG } from '../config/app-config.js?v=5.1.3.58-auto-control-direction-recognizer-20260830';

const STAGES = Object.freeze([
  {
    name: '背景工程診斷中心',
    url: '../services/debug-center/debug-center-v4010.js?v=5.1.3.30-timers-cloud-performance-20260829'
  },
  {
    name: '3D與設備核心',
    url: '../runtime/showcase/runtime-v51358-auto-control-direction-recognizer.js?v=5.1.3.58-auto-control-direction-recognizer-20260830'
  },
  {
    name: 'Foundation健康檢查',
    url: '../runtime/foundation/foundation-health-v2400.js?v=5.1.3.30-timers-cloud-performance-20260829'
  },
  {
    name: 'Google雲端橋接',
    url: '../services/cloud-storage/cloud-save-v51340.js?v=5.1.3.40-fast-cloud-index-20260830'
  }
]);

function updateStatus(text) {
  const status = document.getElementById('statusText');
  if (status) status.textContent = text;
}

async function importStage(stage) {
  updateStatus(`載入中：${stage.name}`);
  try {
    await import(stage.url);
  } catch (error) {
    const detail = error?.stack || error?.message || String(error);
    throw new Error(`${stage.name}載入失敗\n檔案：${stage.url}\n${detail}`);
  }
}

async function startShowcase() {
  document.documentElement.dataset.utopBoot = 'loading';
  updateStatus('V5.1.3.58 自動控制方向辨識器 啟動中…');

  for (const stage of STAGES) {
    await importStage(stage);
  }

  const health = window.UTOP_FOUNDATION?.verify?.();
  if (!health) throw new Error('Foundation健康檢查沒有回傳結果');

  const label = document.querySelector('.brand b');
  if (label) {
    label.textContent =
      `V${APP_CONFIG.version} Collapsible Sidebar Inspector｜Base UI ${APP_CONFIG.baseUiVersion}`;
  }

  document.title = `${APP_CONFIG.appName} V${APP_CONFIG.version}`;
  document.documentElement.dataset.utopBoot = 'ready';
  updateStatus('V5.1.3.58 自動控制方向辨識器 系統準備就緒');

  window.UTOP_APP = Object.freeze({
    config: APP_CONFIG,
    bootRevision: 'V51358_AUTO_CONTROL_DIRECTION_RECOGNIZER',
    health
  });
}

startShowcase().catch((error) => {
  if (window.__UTOP_IS_IGNORABLE_ERROR__?.(error)) {
    window.__UTOP_HIDE_BOOT_ERROR__?.();
    document.documentElement.dataset.utopBoot = 'ready';
    updateStatus('V5.1.3.58 自動控制方向辨識器 系統準備就緒');
    return;
  }

  window.UTOP_DEBUG?.record?.('ERROR','Boot','UTOP啟動失敗',error?.stack||error?.message||String(error));
  console.error('[UTOP-V4] boot failed', error);
  document.documentElement.dataset.utopBoot = 'failed';
  updateStatus(`系統啟動失敗：${error?.message || String(error)}`);

  if (typeof window.__UTOP_SHOW_BOOT_ERROR__ === 'function') {
    window.__UTOP_SHOW_BOOT_ERROR__(
      error?.stack || error?.message || String(error)
    );
  }
});
