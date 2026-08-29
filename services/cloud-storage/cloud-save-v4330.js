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


/* =========================================================
   V5.1.3.11 本機／雲端雙儲存中心
========================================================= */
const LOCAL_DB_NAME = 'UTOP3D_LOCAL_PROJECTS';
const LOCAL_DB_VERSION = 1;
const LOCAL_STORE_NAME = 'projects';
const LAST_LOCAL_NAME_KEY = 'utop3d_last_local_project_name';

function openLocalDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LOCAL_DB_NAME, LOCAL_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(LOCAL_STORE_NAME)) {
        const store = db.createObjectStore(LOCAL_STORE_NAME, { keyPath: 'name' });
        store.createIndex('updatedAt', 'updatedAt');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('無法開啟本機資料庫'));
  });
}

async function localDbRequest(mode, operation) {
  const db = await openLocalDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(LOCAL_STORE_NAME, mode);
      const store = tx.objectStore(LOCAL_STORE_NAME);
      const request = operation(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('本機資料庫操作失敗'));
      tx.onabort = () => reject(tx.error || new Error('本機資料庫交易中止'));
    });
  } finally {
    db.close();
  }
}

async function saveLocalProject() {
  const name = $('localFileName').value.trim();
  if (!name) {
    showToast('請輸入專案名稱', true);
    $('localFileName').focus();
    return;
  }
  const button = $('confirmLocalSave');
  button.disabled = true;
  button.textContent = '儲存中…';
  try {
    const project = storageApi().getProjectData();
    const record = {
      name,
      updatedAt: new Date().toISOString(),
      deviceCount: Array.isArray(project.items) ? project.items.length : 0,
      linkCount: Array.isArray(project.wires) ? project.wires.length : 0,
      version: project.version || '1.1.4',
      project
    };
    await localDbRequest('readwrite', store => store.put(record));
    localStorage.setItem(LAST_LOCAL_NAME_KEY, name);
    $('localSaveDialog').close();
    const state = $('saveState');
    if (state) {
      state.textContent = '● 本機已儲存';
      state.style.color = '#36b86b';
    }
    const status = $('statusText');
    if (status) status.textContent = `本機已儲存：${name}`;
    showToast(`本機已儲存：${name}`);
  } catch (error) {
    showToast(error.message || String(error), true);
  } finally {
    button.disabled = false;
    button.textContent = '本機儲存';
  }
}

let localProjectCache = [];
async function refreshLocalProjects() {
  $('localProjectList').innerHTML = '<div class="cloud-empty">正在讀取本機專案…</div>';
  try {
    const records = await localDbRequest('readonly', store => store.getAll());
    localProjectCache = (records || []).sort((a,b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    renderLocalProjectList();
  } catch (error) {
    $('localProjectList').innerHTML = `<div class="cloud-empty error-text">${escapeHtml(error.message)}</div>`;
  }
}

function renderLocalProjectList() {
  const keyword = $('localProjectSearch').value.trim().toLowerCase();
  const projects = localProjectCache.filter(p => !keyword || String(p.name).toLowerCase().includes(keyword));
  $('localProjectList').innerHTML = projects.map(project => `
    <article class="cloud-project-card">
      <div>
        <h3>${escapeHtml(project.name)} <span class="storage-source-badge">本機</span></h3>
        <p>設備：${Number(project.deviceCount||0)} · 接線：${Number(project.linkCount||0)} · 版本：${escapeHtml(project.version||'1.1.4')}</p>
        <small>更新：${escapeHtml(new Date(project.updatedAt).toLocaleString('zh-TW'))}</small>
      </div>
      <div class="cloud-project-card-actions">
        <button data-local-load="${escapeHtml(project.name)}" type="button">載入</button>
        <button class="delete-local-project" data-local-delete="${escapeHtml(project.name)}" type="button">刪除</button>
      </div>
    </article>`).join('') || '<div class="cloud-empty">目前沒有本機專案。</div>';
  document.querySelectorAll('[data-local-load]').forEach(button => {
    button.onclick = () => loadLocalProject(button.dataset.localLoad);
  });
  document.querySelectorAll('[data-local-delete]').forEach(button => {
    button.onclick = () => deleteLocalProject(button.dataset.localDelete);
  });
}

async function loadLocalProject(name) {
  showToast('正在載入本機專案…');
  try {
    const record = await localDbRequest('readonly', store => store.get(name));
    if (!record?.project) throw new Error('找不到本機專案資料');
    storageApi().loadProjectData(record.project);
    $('localOpenDialog').close();
    const state = $('saveState');
    if (state) {
      state.textContent = '● 本機專案已載入';
      state.style.color = '#36b86b';
    }
    const status = $('statusText');
    if (status) status.textContent = `本機已載入：${name}`;
    showToast(`本機已載入：${name}`);
  } catch (error) {
    showToast(error.message || String(error), true);
  }
}

async function deleteLocalProject(name) {
  if (!confirm(`確定刪除本機專案「${name}」？`)) return;
  try {
    await localDbRequest('readwrite', store => store.delete(name));
    showToast(`已刪除：${name}`);
    await refreshLocalProjects();
  } catch (error) {
    showToast(error.message || String(error), true);
  }
}

function openGoogleSaveDialog() {
  $('googleFileName').value = localStorage.getItem(LAST_FILE_NAME_KEY) || '';
  $('googleSaveDialog').showModal();
  setTimeout(() => { $('googleFileName').focus(); $('googleFileName').select(); }, 80);
}
function openGoogleProjectDialog() {
  $('googleOpenDialog').showModal();
  refreshGoogleProjects();
}
function openLocalSaveDialog() {
  $('localFileName').value = localStorage.getItem(LAST_LOCAL_NAME_KEY) || '';
  $('localSaveDialog').showModal();
  setTimeout(() => { $('localFileName').focus(); $('localFileName').select(); }, 80);
}
function openLocalProjectDialog() {
  $('localOpenDialog').showModal();
  refreshLocalProjects();
}
function closeDialog(id) { const dialog = $(id); if (dialog?.open) dialog.close(); }

function bindStorageCenter() {
  const saveButton = $('saveBtn');
  const openButton = $('loadBtn');
  if (!saveButton || !openButton) return;
  saveButton.dataset.storageOwner = 'local-cloud-center';
  openButton.dataset.storageOwner = 'local-cloud-center';
  saveButton.onclick = () => $('storageSaveChoiceDialog').showModal();
  openButton.onclick = () => $('storageOpenChoiceDialog').showModal();

  $('chooseLocalSave').onclick = () => { closeDialog('storageSaveChoiceDialog'); openLocalSaveDialog(); };
  $('chooseCloudSave').onclick = () => { closeDialog('storageSaveChoiceDialog'); openGoogleSaveDialog(); };
  $('chooseLocalOpen').onclick = () => { closeDialog('storageOpenChoiceDialog'); openLocalProjectDialog(); };
  $('chooseCloudOpen').onclick = () => { closeDialog('storageOpenChoiceDialog'); openGoogleProjectDialog(); };
  document.querySelectorAll('[data-close-dialog]').forEach(button => {
    button.onclick = () => closeDialog(button.dataset.closeDialog);
  });

  $('confirmLocalSave').onclick = saveLocalProject;
  $('localFileName').onkeydown = event => { if (event.key === 'Enter') { event.preventDefault(); saveLocalProject(); } };
  $('closeLocalOpen').onclick = () => closeDialog('localOpenDialog');
  $('refreshLocalProjects').onclick = refreshLocalProjects;
  $('localProjectSearch').oninput = renderLocalProjectList;

  $('confirmGoogleSave').onclick = saveGoogleProject;
  $('closeGoogleOpen').onclick = () => closeDialog('googleOpenDialog');
  $('refreshGoogleProjects').onclick = refreshGoogleProjects;
  $('googleProjectSearch').oninput = renderProjectList;
  $('googleFileName').onkeydown = event => { if (event.key === 'Enter') { event.preventDefault(); saveGoogleProject(); } };

  console.info('[UTOP-3D] 本機／雲端雙儲存中心已啟用');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindStorageCenter, { once: true });
} else {
  bindStorageCenter();
}
