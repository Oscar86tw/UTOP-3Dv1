const SPREADSHEET_ID = '1lmEqbYals_uBIOrQFDupYR2hs0iks5zEJM6FTOuOwP0';
const CONFIG_SHEET_NAME = '工作表1';
const EXEC_CACHE_KEY = 'utop3d_google_exec_url';
const LAST_FILE_NAME_KEY = 'utop3d_last_google_file_name';

const $ = (id) => document.getElementById(id);

function showToast(message, isError = false) {
  const toast = $('googleToast');
  toast.textContent = message;
  toast.hidden = false;
  toast.className = `google-toast ${isError ? 'error' : 'success'}`;

  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.hidden = true;
  }, 3500);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

async function resolveAppsScriptUrl(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = localStorage.getItem(EXEC_CACHE_KEY);
    if (cached) return cached;
  }

  const sheet = encodeURIComponent(CONFIG_SHEET_NAME);
  const csvUrl =
    `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}` +
    `/gviz/tq?tqx=out:csv&sheet=${sheet}&t=${Date.now()}`;

  const response = await fetch(csvUrl, {
    method: 'GET',
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('無法讀取試算表「工作表1」');
  }

  const text = await response.text();
  const match = text.match(
    /https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec/g
  );

  if (!match?.[0]) {
    throw new Error('工作表1內找不到以 /exec 結尾的 Apps Script 網址');
  }

  localStorage.setItem(EXEC_CACHE_KEY, match[0]);
  return match[0];
}

async function parseResponse(response) {
  const text = await response.text();
  let result;

  try {
    result = JSON.parse(text);
  } catch {
    throw new Error('Google橋接程式回傳格式錯誤');
  }

  if (!result.ok) {
    throw new Error(result.error || 'Google雲端操作失敗');
  }

  return result;
}

async function postBridge(action, payload = {}) {
  const apiUrl = await resolveAppsScriptUrl();

  return parseResponse(await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify({
      action,
      ...payload
    })
  }));
}

async function getBridge(action, parameters = {}) {
  const apiUrl = await resolveAppsScriptUrl();
  const url = new URL(apiUrl);

  url.searchParams.set('action', action);
  url.searchParams.set('t', String(Date.now()));

  for (const [key, value] of Object.entries(parameters)) {
    url.searchParams.set(key, value);
  }

  return parseResponse(await fetch(url, {
    method: 'GET',
    cache: 'no-store'
  }));
}

function storageApi() {
  if (!window.UTOP_STORAGE_API) {
    throw new Error('3D系統尚未完成初始化，請稍候再試');
  }
  return window.UTOP_STORAGE_API;
}

async function saveGoogleProject() {
  const fileName = $('googleFileName').value.trim();

  if (!fileName) {
    showToast('請輸入檔案名稱', true);
    $('googleFileName').focus();
    return;
  }

  const button = $('confirmGoogleSave');
  button.disabled = true;
  button.textContent = '儲存中…';

  try {
    const project = storageApi().getProjectData();
    const result = await postBridge('saveProject', {
      fileName,
      project
    });

    localStorage.setItem(LAST_FILE_NAME_KEY, fileName);
    $('googleSaveDialog').close();
    storageApi().markCloudSaved(result.fileName || fileName);
    showToast(`已儲存：${result.fileName || fileName}`);
  } catch (error) {
    showToast(error.message, true);
  } finally {
    button.disabled = false;
    button.textContent = '儲存';
  }
}

let projectCache = [];

function renderProjectList() {
  const keyword = $('googleProjectSearch').value.trim().toLowerCase();

  const projects = projectCache.filter((project) =>
    !keyword || String(project.fileName || '').toLowerCase().includes(keyword)
  );

  $('googleProjectList').innerHTML = projects.map((project) => `
    <article class="cloud-project-card">
      <div>
        <h3>${escapeHtml(String(project.fileName || '').replace(/\.json$/i, ''))}</h3>
        <p>
          設備：${Number(project.deviceCount || 0)}
          · 接線：${Number(project.linkCount || 0)}
          · 版本：${escapeHtml(project.version || 'V1.1.4')}
        </p>
        <small>更新：${escapeHtml(project.updatedAtText || '')}</small>
      </div>
      <button data-google-load="${escapeHtml(project.fileId)}">載入</button>
    </article>
  `).join('') || '<div class="cloud-empty">目前沒有符合的專案。</div>';

  document.querySelectorAll('[data-google-load]').forEach((button) => {
    button.onclick = () => loadGoogleProject(button.dataset.googleLoad);
  });
}

async function refreshGoogleProjects() {
  $('googleProjectList').innerHTML =
    '<div class="cloud-empty">正在讀取雲端專案…</div>';

  try {
    const result = await getBridge('listProjects');
    projectCache = Array.isArray(result.projects) ? result.projects : [];
    renderProjectList();
  } catch (error) {
    $('googleProjectList').innerHTML =
      `<div class="cloud-empty error-text">${escapeHtml(error.message)}</div>`;
  }
}

async function loadGoogleProject(fileId) {
  showToast('正在載入雲端專案…');

  try {
    const result = await getBridge('loadProject', {
      fileId
    });

    storageApi().loadProjectData(result.project);
    $('googleOpenDialog').close();
    showToast(`已載入：${result.fileName || '雲端專案'}`);
  } catch (error) {
    showToast(error.message, true);
  }
}

/*
 * app.js 原本也有本機儲存／開啟處理。
 * 本模組在載入後重新指定 onclick，只替換這兩個按鈕；
 * 3D、2D、控制、接線等原始功能完全不受影響。
 */
function bindGoogleStorageButtons() {
  const saveButton = $('saveBtn');
  const openButton = $('loadBtn');

  if (!saveButton || !openButton) {
    console.error('[UTOP-3D] 找不到雲端儲存／開啟按鈕');
    return;
  }

  // Mark ownership so it can be checked from the browser console.
  saveButton.dataset.storageOwner = 'google-drive';
  openButton.dataset.storageOwner = 'google-drive';

  saveButton.onclick = () => {
    $('googleFileName').value =
      localStorage.getItem(LAST_FILE_NAME_KEY) || '';
    $('googleSaveDialog').showModal();

    window.setTimeout(() => {
      $('googleFileName').focus();
      $('googleFileName').select();
    }, 100);
  };

  openButton.onclick = () => {
    $('googleOpenDialog').showModal();
    refreshGoogleProjects();
  };

  $('confirmGoogleSave').onclick = saveGoogleProject;
  $('closeGoogleOpen').onclick = () => $('googleOpenDialog').close();
  $('refreshGoogleProjects').onclick = refreshGoogleProjects;
  $('googleProjectSearch').oninput = renderProjectList;

  $('googleFileName').onkeydown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveGoogleProject();
    }
  };

  console.info('[UTOP-3D] Google Drive buttons bound');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindGoogleStorageButtons, {
    once: true
  });
} else {
  bindGoogleStorageButtons();
}
