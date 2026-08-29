/*******************************************************
 * UTOP-3D Cloud Storage Backend V5.1.3.35
 * Spreadsheet: 1lmEqbYals_uBIOrQFDupYR2hs0iks5zEJM6FTOuOwP0
 * Drive Root:  1tk-xe-G7_25yioCY1cTfrq_GuR7ajOmJ
 *
 * 架構：
 * - Google Drive：實際保存 .json 專案檔
 * - Projects：只保存索引、File ID、URL、鎖定與時間
 * - CloudFolders：保存 UTOP 資料夾與 Drive Folder ID 對應
 * - CloudLog：保存雲端操作紀錄
 * - 工作表1：保留 A2 Apps Script /exec 授權連結，不改寫 A2
 *******************************************************/

const UTOP_SPREADSHEET_ID = '1lmEqbYals_uBIOrQFDupYR2hs0iks5zEJM6FTOuOwP0';
const UTOP_DRIVE_ROOT_FOLDER_ID = '1tk-xe-G7_25yioCY1cTfrq_GuR7ajOmJ';
const UTOP_VERSION = '5.1.3.35';

const CONFIG = {
  SYSTEM_SHEET: '工作表1',
  PROJECT_SHEET: 'Projects',
  FOLDER_SHEET: 'CloudFolders',
  LOG_SHEET: 'CloudLog',

  PROJECT_HEADERS: [
    'projectId', 'projectName', 'folderId',
    'driveFileId', 'fileUrl',
    'locked', 'deleted', 'version',
    'deviceCount', 'linkCount', 'fileSize',
    'createdAt', 'updatedAt', 'note', 'legacySourceId'
  ],

  FOLDER_HEADERS: [
    'folderId', 'folderName', 'parentFolderId',
    'driveFolderId',
    'locked', 'deleted', 'sortOrder',
    'createdAt', 'updatedAt', 'note'
  ],

  LOG_HEADERS: [
    'logId', 'timestamp', 'action', 'targetType',
    'targetId', 'targetName', 'result', 'message'
  ]
};

function ss_() {
  return SpreadsheetApp.openById(UTOP_SPREADSHEET_ID);
}

function rootFolder_() {
  return DriveApp.getFolderById(UTOP_DRIVE_ROOT_FOLDER_ID);
}

function doGet(e) {
  try {
    setupSheets();
    const p = (e && e.parameter) || {};
    const action = String(p.action || '').trim();
    let result;

    switch (action) {
      case 'ping':
        result = ping_();
        break;
      case 'listFolders':
        result = listFolders(p);
        break;
      case 'listProjects':
        result = listProjects(p);
        break;
      case 'loadProject':
        result = loadProject(p);
        break;
      case 'legacyStatus':
        result = legacyStatus();
        break;
      default:
        result = { success: false, message: '未知 GET action：' + action };
    }

    return jsonOutput(result);
  } catch (err) {
    return jsonOutput(errorResult_(err));
  }
}

function doPost(e) {
  try {
    setupSheets();
    const p = parseRequestBody(e);
    const action = String(p.action || '').trim();
    let result;

    switch (action) {
      case 'createFolder': result = createFolder(p); break;
      case 'renameFolder': result = renameFolder(p); break;
      case 'deleteFolder': result = deleteFolder(p); break;
      case 'lockFolder': result = setFolderLock(p, true); break;
      case 'unlockFolder': result = setFolderLock(p, false); break;

      case 'saveProject': result = saveProject(p); break;
      case 'deleteProject': result = deleteProject(p); break;
      case 'restoreProject': result = restoreProject(p); break;
      case 'lockProject': result = setProjectLock(p, true); break;
      case 'unlockProject': result = setProjectLock(p, false); break;
      case 'moveProject': result = moveProject(p); break;

      case 'importLegacyProjects': result = importLegacyProjects(p); break;
      case 'migrateProjectsToDrive': result = migrateProjectsToDrive(p); break;
      default:
        result = { success: false, message: '未知 POST action：' + action };
    }

    return jsonOutput(result);
  } catch (err) {
    return jsonOutput(errorResult_(err));
  }
}

/* =====================================================
   初始化 / 系統設定
===================================================== */

function setupSheets() {
  const ss = ss_();

  ensureSystemSheet_(ss);
  ensureSheet(ss, CONFIG.PROJECT_SHEET, CONFIG.PROJECT_HEADERS);
  ensureSheet(ss, CONFIG.FOLDER_SHEET, CONFIG.FOLDER_HEADERS);
  ensureSheet(ss, CONFIG.LOG_SHEET, CONFIG.LOG_HEADERS);

  // 驗證 Drive 根目錄權限；沒有權限時會直接丟出錯誤。
  const root = rootFolder_();

  return {
    success: true,
    spreadsheetId: UTOP_SPREADSHEET_ID,
    rootDriveFolderId: UTOP_DRIVE_ROOT_FOLDER_ID,
    rootDriveFolderName: root.getName(),
    version: UTOP_VERSION
  };
}

function ensureSystemSheet_(ss) {
  let sh = ss.getSheetByName(CONFIG.SYSTEM_SHEET);
  if (!sh) sh = ss.insertSheet(CONFIG.SYSTEM_SHEET, 0);

  // A2 是使用者既有的 Apps Script /exec 授權連結，絕不覆寫。
  if (!String(sh.getRange('A1').getValue() || '').trim()) {
    sh.getRange('A1').setValue('Apps Script Web App /exec');
  }

  if (!String(sh.getRange('B1').getValue() || '').trim()) {
    sh.getRange('B1').setValue('3D專案根資料夾ID');
  }
  sh.getRange('B2').setValue(UTOP_DRIVE_ROOT_FOLDER_ID);

  if (!String(sh.getRange('C1').getValue() || '').trim()) {
    sh.getRange('C1').setValue('UTOP版本');
  }
  sh.getRange('C2').setValue('V' + UTOP_VERSION);
}

function ensureSheet(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);

  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
    return sh;
  }

  const lastColumn = Math.max(1, sh.getLastColumn());
  const current = sh.getRange(1, 1, 1, lastColumn)
    .getValues()[0]
    .map(v => String(v).trim());

  headers.forEach(header => {
    if (!current.includes(header)) {
      sh.getRange(1, sh.getLastColumn() + 1).setValue(header);
      current.push(header);
    }
  });

  sh.setFrozenRows(1);
  return sh;
}

function ping_() {
  const root = rootFolder_();
  return {
    success: true,
    message: 'UTOP Cloud API V' + UTOP_VERSION + ' Online',
    spreadsheetId: UTOP_SPREADSHEET_ID,
    rootDriveFolderId: UTOP_DRIVE_ROOT_FOLDER_ID,
    rootDriveFolderName: root.getName(),
    time: new Date().toISOString()
  };
}

/* =====================================================
   Drive / Folder 工具
===================================================== */

function getDriveFolderForLogicalFolder_(folderId) {
  if (!folderId) return rootFolder_();

  const rec = findRecord(getSheet(CONFIG.FOLDER_SHEET), 'folderId', folderId);
  if (!rec || toBoolean(rec.data.deleted)) {
    throw new Error('指定的雲端資料夾不存在：' + folderId);
  }

  const driveFolderId = String(rec.data.driveFolderId || '').trim();
  if (!driveFolderId) {
    throw new Error('資料夾缺少 Drive Folder ID：' + rec.data.folderName);
  }

  return DriveApp.getFolderById(driveFolderId);
}

function getDriveFileSafe_(fileId) {
  if (!fileId) return null;
  try {
    return DriveApp.getFileById(fileId);
  } catch (err) {
    return null;
  }
}

function sanitizeFileName_(name) {
  let safe = String(name || 'UTOP專案')
    .trim()
    .replace(/[\\/:*?"<>|\r\n]+/g, '_');

  if (!safe) safe = 'UTOP專案';
  if (!/\.json$/i.test(safe)) safe += '.json';
  return safe;
}

function projectMetrics_(rawData) {
  let obj = rawData;
  if (typeof obj === 'string') {
    try { obj = JSON.parse(obj); } catch (_) { obj = null; }
  }

  return {
    deviceCount: Array.isArray(obj && obj.items) ? obj.items.length : 0,
    linkCount: Array.isArray(obj && obj.wires) ? obj.wires.length : 0
  };
}

function normalizeProjectJson_(value) {
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return '{}';
    try {
      return JSON.stringify(JSON.parse(text));
    } catch (_) {
      return text;
    }
  }

  try {
    return JSON.stringify(value || {});
  } catch (_) {
    return '{}';
  }
}

/* =====================================================
   雲端資料夾：UTOP分類 = Drive真實資料夾
===================================================== */

function createFolder(p) {
  const name = String(p.folderName || p.name || '').trim();
  const parentFolderId = String(p.parentFolderId || '').trim();

  if (!name) return { success: false, message: '資料夾名稱不能空白' };

  const sh = getSheet(CONFIG.FOLDER_SHEET);
  const rows = sheetToObjects(sh);

  const duplicate = rows.find(row =>
    !toBoolean(row.deleted) &&
    String(row.folderName || '').trim() === name &&
    String(row.parentFolderId || '').trim() === parentFolderId
  );

  if (duplicate) {
    return { success: false, message: '同一層已存在相同名稱的資料夾' };
  }

  const parentDriveFolder = getDriveFolderForLogicalFolder_(parentFolderId);
  const driveFolder = parentDriveFolder.createFolder(name);
  const folderId = generateId('folder');
  const now = new Date();

  appendObject(sh, {
    folderId,
    folderName: name,
    parentFolderId,
    driveFolderId: driveFolder.getId(),
    locked: false,
    deleted: false,
    sortOrder: getNextFolderSortOrder(rows),
    createdAt: now,
    updatedAt: now,
    note: String(p.note || '')
  });

  addLog('CREATE_FOLDER', 'folder', folderId, name, 'SUCCESS',
    '已建立 Drive 資料夾：' + driveFolder.getId());

  return {
    success: true,
    folderId,
    id: folderId,
    folderName: name,
    name,
    parentFolderId,
    driveFolderId: driveFolder.getId(),
    driveUrl: driveFolder.getUrl()
  };
}

function listFolders(p) {
  let rows = sheetToObjects(getSheet(CONFIG.FOLDER_SHEET));
  if (!toBoolean(p.includeDeleted)) rows = rows.filter(r => !toBoolean(r.deleted));

  rows.sort((a, b) =>
    Number(a.sortOrder || 0) - Number(b.sortOrder || 0) ||
    String(a.folderName || '').localeCompare(String(b.folderName || ''), 'zh-Hant')
  );

  return {
    success: true,
    folders: rows.map(r => ({
      ...r,
      id: r.folderId,
      name: r.folderName,
      driveUrl: r.driveFolderId
        ? 'https://drive.google.com/drive/folders/' + r.driveFolderId
        : ''
    }))
  };
}

function renameFolder(p) {
  const folderId = String(p.folderId || '').trim();
  const name = String(p.folderName || p.name || '').trim();

  if (!folderId || !name) {
    return { success: false, message: '缺少 folderId 或資料夾名稱' };
  }

  const sh = getSheet(CONFIG.FOLDER_SHEET);
  const rec = findRecord(sh, 'folderId', folderId);
  if (!rec) return { success: false, message: '找不到資料夾' };
  if (toBoolean(rec.data.locked)) {
    return { success: false, message: '資料夾已鎖定，請先解除鎖定' };
  }

  const driveFolderId = String(rec.data.driveFolderId || '').trim();
  if (driveFolderId) DriveApp.getFolderById(driveFolderId).setName(name);

  updateRecord(sh, rec.rowNumber, {
    folderName: name,
    updatedAt: new Date()
  });

  addLog('RENAME_FOLDER', 'folder', folderId, name, 'SUCCESS', '同步更名 Drive 資料夾');

  return { success: true, folderId, folderName: name, name };
}

function deleteFolder(p) {
  const folderId = String(p.folderId || '').trim();
  const sh = getSheet(CONFIG.FOLDER_SHEET);
  const rec = findRecord(sh, 'folderId', folderId);

  if (!rec) return { success: false, message: '找不到資料夾' };
  if (toBoolean(rec.data.locked)) {
    return { success: false, message: '🔒 此資料夾已鎖定，禁止刪除' };
  }

  const folders = sheetToObjects(sh);
  if (folders.some(r => !toBoolean(r.deleted) && String(r.parentFolderId || '') === folderId)) {
    return { success: false, message: '資料夾內還有子資料夾，不能刪除' };
  }

  const projects = sheetToObjects(getSheet(CONFIG.PROJECT_SHEET));
  if (projects.some(r => !toBoolean(r.deleted) && String(r.folderId || '') === folderId)) {
    return { success: false, message: '資料夾內還有專案，請先移動或刪除專案' };
  }

  const driveFolderId = String(rec.data.driveFolderId || '').trim();
  if (driveFolderId) {
    try { DriveApp.getFolderById(driveFolderId).setTrashed(true); } catch (_) {}
  }

  updateRecord(sh, rec.rowNumber, {
    deleted: true,
    updatedAt: new Date()
  });

  addLog('DELETE_FOLDER', 'folder', folderId, rec.data.folderName, 'SUCCESS', 'Drive 資料夾已移至垃圾桶');
  return { success: true, folderId };
}

function setFolderLock(p, locked) {
  const folderId = String(p.folderId || '').trim();
  const sh = getSheet(CONFIG.FOLDER_SHEET);
  const rec = findRecord(sh, 'folderId', folderId);

  if (!rec) return { success: false, message: '找不到資料夾' };

  updateRecord(sh, rec.rowNumber, {
    locked,
    updatedAt: new Date()
  });

  addLog(locked ? 'LOCK_FOLDER' : 'UNLOCK_FOLDER', 'folder', folderId,
    rec.data.folderName, 'SUCCESS', locked ? '資料夾已鎖定' : '資料夾已解除鎖定');

  return { success: true, folderId, locked };
}

/* =====================================================
   專案：Drive實體JSON + Projects索引
===================================================== */

function saveProject(p) {
  const projectName = String(p.projectName || p.fileName || '').trim();
  if (!projectName) return { success: false, message: '專案名稱不能空白' };

  const folderId = String(p.folderId || '').trim();
  const targetFolder = getDriveFolderForLogicalFolder_(folderId);

  let rawData = p.data !== undefined ? p.data : p.project;
  const jsonText = normalizeProjectJson_(rawData);
  const metrics = projectMetrics_(rawData);
  const fileName = sanitizeFileName_(projectName);

  const sh = getSheet(CONFIG.PROJECT_SHEET);
  const rows = sheetToObjects(sh);
  let projectId = String(p.projectId || p.fileId || '').trim();
  let rec = projectId ? findRecord(sh, 'projectId', projectId) : null;

  // 前端一般只傳檔名，不會帶 projectId；同資料夾同名視為更新。
  if (!rec && !projectId) {
    const sameName = rows.find(r =>
      !toBoolean(r.deleted) &&
      String(r.projectName || '').trim() === projectName &&
      String(r.folderId || '').trim() === folderId
    );
    if (sameName) {
      rec = { rowNumber: sameName._rowNumber, data: sameName };
      projectId = String(sameName.projectId || '');
    }
  }

  const now = new Date();

  if (rec) {
    if (toBoolean(rec.data.locked)) {
      return { success: false, message: '🔒 此專案已鎖定，禁止覆蓋' };
    }

    let file = getDriveFileSafe_(String(rec.data.driveFileId || '').trim());
    if (!file) {
      file = targetFolder.createFile(fileName, jsonText, MimeType.PLAIN_TEXT);
    } else {
      file.setName(fileName);
      file.setContent(jsonText);
      try { file.moveTo(targetFolder); } catch (_) {}
      try { if (file.isTrashed()) file.setTrashed(false); } catch (_) {}
    }

    updateRecord(sh, rec.rowNumber, {
      projectName,
      folderId,
      driveFileId: file.getId(),
      fileUrl: file.getUrl(),
      deleted: false,
      version: String(p.version || UTOP_VERSION),
      deviceCount: metrics.deviceCount,
      linkCount: metrics.linkCount,
      fileSize: file.getSize(),
      updatedAt: now
    });

    // 若舊 Projects 還留有 data 欄，更新成功後清空，避免 Sheet 再存整包 JSON。
    clearCellIfHeaderExists_(sh, rec.rowNumber, 'data');

    addLog('UPDATE_PROJECT', 'project', projectId, projectName, 'SUCCESS',
      'Drive JSON 已更新：' + file.getId());

    return projectResponse_(projectId, projectName, folderId, file, true);
  }

  projectId = generateId('project');
  const file = targetFolder.createFile(fileName, jsonText, MimeType.PLAIN_TEXT);

  appendObject(sh, {
    projectId,
    projectName,
    folderId,
    driveFileId: file.getId(),
    fileUrl: file.getUrl(),
    locked: false,
    deleted: false,
    version: String(p.version || UTOP_VERSION),
    deviceCount: metrics.deviceCount,
    linkCount: metrics.linkCount,
    fileSize: file.getSize(),
    createdAt: now,
    updatedAt: now,
    note: String(p.note || ''),
    legacySourceId: ''
  });

  addLog('CREATE_PROJECT', 'project', projectId, projectName, 'SUCCESS',
    'Drive JSON 已建立：' + file.getId());

  return projectResponse_(projectId, projectName, folderId, file, false);
}

function projectResponse_(projectId, projectName, folderId, file, updated) {
  return {
    success: true,
    projectId,
    fileId: projectId, // 前端相容：這個是 UTOP projectId，不是 Drive fileId
    projectName,
    fileName: projectName,
    folderId,
    driveFileId: file.getId(),
    fileUrl: file.getUrl(),
    updated
  };
}

function listProjects(p) {
  let rows = sheetToObjects(getSheet(CONFIG.PROJECT_SHEET));

  if (!toBoolean(p.includeDeleted)) {
    rows = rows.filter(r => !toBoolean(r.deleted));
  }

  const folderId = String(p.folderId || '').trim();
  if (folderId) rows = rows.filter(r => String(r.folderId || '') === folderId);

  const folders = new Map(
    sheetToObjects(getSheet(CONFIG.FOLDER_SHEET))
      .map(f => [String(f.folderId || ''), String(f.folderName || '')])
  );

  const projects = rows.map(r => ({
    projectId: r.projectId,
    fileId: r.projectId,
    projectName: r.projectName,
    fileName: r.projectName,
    folderId: r.folderId || '',
    folderName: folders.get(String(r.folderId || '')) || '',
    driveFileId: r.driveFileId || '',
    fileUrl: r.fileUrl || '',
    locked: toBoolean(r.locked),
    deleted: toBoolean(r.deleted),
    version: r.version || '',
    deviceCount: Number(r.deviceCount || 0),
    linkCount: Number(r.linkCount || 0),
    fileSize: Number(r.fileSize || 0),
    createdAt: r.createdAt || '',
    updatedAt: r.updatedAt || ''
  }));

  projects.sort((a, b) =>
    new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
  );

  return { success: true, projects };
}

function loadProject(p) {
  const projectId = String(p.projectId || p.fileId || '').trim();
  if (!projectId) return { success: false, message: '缺少 projectId' };

  const sh = getSheet(CONFIG.PROJECT_SHEET);
  const rec = findRecord(sh, 'projectId', projectId);
  if (!rec) return { success: false, message: '找不到專案索引' };
  if (toBoolean(rec.data.deleted)) return { success: false, message: '此專案已刪除' };

  const driveFileId = String(rec.data.driveFileId || '').trim();
  let jsonText = '';

  if (driveFileId) {
    const file = getDriveFileSafe_(driveFileId);
    if (!file) {
      return { success: false, message: 'Projects 有索引，但 Google Drive 找不到實體檔案' };
    }
    jsonText = file.getBlob().getDataAsString('UTF-8');
  } else {
    // 相容過渡期舊資料：若 Projects 還有 data 欄，仍可先讀取。
    jsonText = String(rec.data.data || '').trim();
    if (!jsonText) {
      return { success: false, message: '此專案尚未轉成 Drive 實體 JSON，請先執行舊資料匯入/轉換' };
    }
  }

  let data;
  try {
    data = JSON.parse(jsonText);
  } catch (_) {
    return { success: false, message: 'Drive 專案檔不是有效 JSON，請檢查檔案內容' };
  }

  return {
    success: true,
    fileName: rec.data.projectName,
    project: {
      projectId,
      projectName: rec.data.projectName,
      folderId: rec.data.folderId || '',
      driveFileId: rec.data.driveFileId || '',
      fileUrl: rec.data.fileUrl || '',
      locked: toBoolean(rec.data.locked),
      version: rec.data.version || '',
      data,
      createdAt: rec.data.createdAt,
      updatedAt: rec.data.updatedAt
    }
  };
}

function deleteProject(p) {
  const projectId = String(p.projectId || p.fileId || '').trim();
  const sh = getSheet(CONFIG.PROJECT_SHEET);
  const rec = findRecord(sh, 'projectId', projectId);

  if (!rec) return { success: false, message: '找不到專案' };
  if (toBoolean(rec.data.locked)) {
    addLog('DELETE_PROJECT', 'project', projectId, rec.data.projectName, 'BLOCKED', '專案已鎖定');
    return { success: false, message: '🔒 此專案已鎖定，禁止刪除' };
  }

  const file = getDriveFileSafe_(String(rec.data.driveFileId || '').trim());
  if (file) file.setTrashed(true);

  updateRecord(sh, rec.rowNumber, {
    deleted: true,
    updatedAt: new Date()
  });

  addLog('DELETE_PROJECT', 'project', projectId, rec.data.projectName, 'SUCCESS', 'Drive 檔案已移入垃圾桶');
  return { success: true, projectId, fileId: projectId };
}

function restoreProject(p) {
  const projectId = String(p.projectId || p.fileId || '').trim();
  const sh = getSheet(CONFIG.PROJECT_SHEET);
  const rec = findRecord(sh, 'projectId', projectId);

  if (!rec) return { success: false, message: '找不到專案' };

  const file = getDriveFileSafe_(String(rec.data.driveFileId || '').trim());
  if (file) {
    try { file.setTrashed(false); } catch (_) {}
    try { file.moveTo(getDriveFolderForLogicalFolder_(String(rec.data.folderId || ''))); } catch (_) {}
  }

  updateRecord(sh, rec.rowNumber, {
    deleted: false,
    updatedAt: new Date()
  });

  addLog('RESTORE_PROJECT', 'project', projectId, rec.data.projectName, 'SUCCESS', '專案已還原');
  return { success: true, projectId, fileId: projectId };
}

function setProjectLock(p, locked) {
  const projectId = String(p.projectId || p.fileId || '').trim();
  const sh = getSheet(CONFIG.PROJECT_SHEET);
  const rec = findRecord(sh, 'projectId', projectId);

  if (!rec) return { success: false, message: '找不到專案' };

  updateRecord(sh, rec.rowNumber, {
    locked,
    updatedAt: new Date()
  });

  addLog(locked ? 'LOCK_PROJECT' : 'UNLOCK_PROJECT', 'project', projectId,
    rec.data.projectName, 'SUCCESS', locked ? '專案已鎖定' : '專案已解除鎖定');

  return { success: true, projectId, fileId: projectId, locked };
}

function moveProject(p) {
  const projectId = String(p.projectId || p.fileId || '').trim();
  const folderId = String(p.folderId || '').trim();
  const sh = getSheet(CONFIG.PROJECT_SHEET);
  const rec = findRecord(sh, 'projectId', projectId);

  if (!rec) return { success: false, message: '找不到專案' };
  if (toBoolean(rec.data.locked)) {
    return { success: false, message: '🔒 專案已鎖定，不能移動' };
  }

  const targetFolder = getDriveFolderForLogicalFolder_(folderId);
  const file = getDriveFileSafe_(String(rec.data.driveFileId || '').trim());
  if (!file) return { success: false, message: '找不到 Drive 實體專案檔' };

  file.moveTo(targetFolder);

  updateRecord(sh, rec.rowNumber, {
    folderId,
    fileUrl: file.getUrl(),
    updatedAt: new Date()
  });

  addLog('MOVE_PROJECT', 'project', projectId, rec.data.projectName, 'SUCCESS',
    '已移至資料夾：' + (folderId || '根目錄'));

  return { success: true, projectId, fileId: projectId, folderId, fileUrl: file.getUrl() };
}

/* =====================================================
   舊資料安全轉換
   1) 工作表1 若有 JSON 舊資料，可複製到 Drive
   2) 舊 Projects.data 若有 JSON，可轉成 Drive JSON 後清空 data
===================================================== */

function legacyStatus() {
  const ss = ss_();
  const projectSheet = ss.getSheetByName(CONFIG.PROJECT_SHEET);
  const projectRows = projectSheet ? sheetToObjects(projectSheet) : [];

  const sheetDataImportable = projectRows.filter(row =>
    !toBoolean(row.deleted) &&
    !String(row.driveFileId || '').trim() &&
    String(row.data || '').trim()
  ).length;

  const legacySheet = ss.getSheetByName(CONFIG.SYSTEM_SHEET);
  const legacyRows = legacySheet ? parseLegacyRows_(legacySheet) : [];

  return {
    success: true,
    legacyCount: legacyRows.length + sheetDataImportable,
    importableCount: legacyRows.length + sheetDataImportable,
    projectCount: projectRows.filter(r => !toBoolean(r.deleted)).length,
    projectsWaitingDriveMigration: sheetDataImportable,
    workSheet1JsonRows: legacyRows.length,
    note: '工作表1 A2 的 /exec 連結不會被當成專案資料'
  };
}

function importLegacyProjects(p) {
  const migrated = migrateProjectsToDrive(p);
  const legacy = importLegacyRowsFromSystemSheet_();

  return {
    success: true,
    imported: Number(migrated.migrated || 0) + Number(legacy.imported || 0),
    skipped: Number(migrated.skipped || 0) + Number(legacy.skipped || 0),
    migratedProjectsData: Number(migrated.migrated || 0),
    importedWorkSheet1: Number(legacy.imported || 0),
    preservedLegacy: true
  };
}

function migrateProjectsToDrive(p) {
  const sh = getSheet(CONFIG.PROJECT_SHEET);
  const rows = sheetToObjects(sh);
  let migrated = 0;
  let skipped = 0;

  rows.forEach(row => {
    if (toBoolean(row.deleted)) { skipped++; return; }
    if (String(row.driveFileId || '').trim()) { skipped++; return; }

    const oldData = String(row.data || '').trim();
    if (!oldData) { skipped++; return; }

    let parsed;
    try { parsed = JSON.parse(oldData); } catch (_) { skipped++; return; }

    const folderId = String(row.folderId || '').trim();
    const targetFolder = getDriveFolderForLogicalFolder_(folderId);
    const file = targetFolder.createFile(
      sanitizeFileName_(row.projectName || '舊版專案'),
      JSON.stringify(parsed),
      MimeType.PLAIN_TEXT
    );

    const metrics = projectMetrics_(parsed);
    updateRecord(sh, row._rowNumber, {
      driveFileId: file.getId(),
      fileUrl: file.getUrl(),
      deviceCount: metrics.deviceCount,
      linkCount: metrics.linkCount,
      fileSize: file.getSize(),
      updatedAt: new Date()
    });

    clearCellIfHeaderExists_(sh, row._rowNumber, 'data');
    migrated++;
  });

  if (migrated) {
    addLog('MIGRATE_PROJECTS_TO_DRIVE', 'system', 'Projects', 'Projects.data', 'SUCCESS',
      '已將 ' + migrated + ' 筆舊 JSON 移至 Drive；Sheet data 已清空');
  }

  return { success: true, migrated, skipped };
}

function importLegacyRowsFromSystemSheet_() {
  const ss = ss_();
  const legacySheet = ss.getSheetByName(CONFIG.SYSTEM_SHEET);
  if (!legacySheet) return { imported: 0, skipped: 0 };

  const rows = parseLegacyRows_(legacySheet);
  if (!rows.length) return { imported: 0, skipped: 0 };

  const projectSheet = getSheet(CONFIG.PROJECT_SHEET);
  const existing = sheetToObjects(projectSheet);
  const existingLegacyIds = new Set(existing.map(r => String(r.legacySourceId || '')).filter(Boolean));
  let imported = 0;
  let skipped = 0;

  rows.forEach((row, index) => {
    if (!row.data) { skipped++; return; }
    const legacySourceId = String(row.legacySourceId || ('legacy_row_' + (index + 2)));
    if (existingLegacyIds.has(legacySourceId)) { skipped++; return; }

    let parsed;
    try { parsed = JSON.parse(String(row.data)); } catch (_) { skipped++; return; }

    const projectName = row.projectName || ('舊版專案_' + (index + 1));
    const file = rootFolder_().createFile(
      sanitizeFileName_(projectName),
      JSON.stringify(parsed),
      MimeType.PLAIN_TEXT
    );

    const metrics = projectMetrics_(parsed);
    const now = new Date();
    const projectId = generateId('project');

    appendObject(projectSheet, {
      projectId,
      projectName,
      folderId: '',
      driveFileId: file.getId(),
      fileUrl: file.getUrl(),
      locked: false,
      deleted: false,
      version: row.version || 'legacy',
      deviceCount: metrics.deviceCount,
      linkCount: metrics.linkCount,
      fileSize: file.getSize(),
      createdAt: row.createdAt || now,
      updatedAt: row.updatedAt || now,
      note: '由工作表1舊資料安全匯入',
      legacySourceId
    });

    existingLegacyIds.add(legacySourceId);
    imported++;
  });

  if (imported) {
    addLog('IMPORT_LEGACY_WORKSHEET1', 'system', CONFIG.SYSTEM_SHEET, '工作表1', 'SUCCESS',
      '已複製 ' + imported + ' 筆到 Drive；工作表1原資料保留');
  }

  return { imported, skipped };
}

function parseLegacyRows_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (!values.length) return [];

  const headers = values[0].map(v => String(v).trim());
  const norm = headers.map(normalizeHeader_);
  const candidates = {
    id: ['fileid', 'projectid', 'id'],
    name: ['filename', 'projectname', 'name', '專案名稱', '檔案名稱'],
    data: ['project', 'data', 'json', 'content', 'projectdata', '專案資料', '資料'],
    version: ['version', '版本'],
    created: ['createdat', 'created', '建立時間', '建立日期'],
    updated: ['updatedat', 'updated', '修改時間', '更新時間', '更新日期']
  };

  const idx = key => {
    for (const candidate of candidates[key]) {
      const i = norm.indexOf(normalizeHeader_(candidate));
      if (i >= 0) return i;
    }
    return -1;
  };

  const knownHeader = norm.some(h =>
    ['fileid', 'projectid', 'filename', 'projectname', 'project', 'data', 'json', 'content']
      .includes(h)
  );

  const idIdx = idx('id');
  const nameIdx = idx('name');
  const dataIdx = idx('data');
  const versionIdx = idx('version');
  const createdIdx = idx('created');
  const updatedIdx = idx('updated');
  const rows = [];

  for (let r = knownHeader ? 1 : 0; r < values.length; r++) {
    const row = values[r];
    if (row.every(v => String(v || '').trim() === '')) continue;

    // 特別排除工作表1 A2 的 Apps Script /exec URL 與 Drive 設定列。
    const joined = row.map(v => String(v || '').trim()).join(' ');
    if (/script\.google\.com\/macros\/s\/.+\/exec/i.test(joined)) continue;
    if (joined.includes(UTOP_DRIVE_ROOT_FOLDER_ID)) continue;

    let data = dataIdx >= 0 ? row[dataIdx] : '';
    let name = nameIdx >= 0 ? row[nameIdx] : '';
    let id = idIdx >= 0 ? row[idIdx] : '';

    if (!data) {
      for (let c = 0; c < row.length; c++) {
        const s = String(row[c] || '').trim();
        if ((s.startsWith('{') || s.startsWith('[')) && s.length > 50) {
          data = s;
          break;
        }
      }
    }

    if (!data) continue;

    if (!name) {
      const textCells = row
        .map(v => String(v || '').trim())
        .filter(s => s && !s.startsWith('http') && !s.startsWith('{') && s.length < 120);
      name = textCells[0] || ('舊版專案_' + r);
    }

    if (!id) id = 'legacy_' + r + '_' + Utilities.base64EncodeWebSafe(String(name)).slice(0, 24);

    rows.push({
      legacySourceId: String(id),
      projectName: String(name).replace(/\.json$/i, ''),
      data,
      version: versionIdx >= 0 ? String(row[versionIdx] || 'legacy') : 'legacy',
      createdAt: createdIdx >= 0 ? row[createdIdx] : '',
      updatedAt: updatedIdx >= 0 ? row[updatedIdx] : ''
    });
  }

  return rows;
}

/* =====================================================
   Log / 共用
===================================================== */

function addLog(action, targetType, targetId, targetName, result, message) {
  try {
    appendObject(getSheet(CONFIG.LOG_SHEET), {
      logId: generateId('log'),
      timestamp: new Date(),
      action,
      targetType,
      targetId,
      targetName,
      result,
      message
    });
  } catch (err) {
    console.log('CloudLog 寫入失敗', err);
  }
}

function getSheet(name) {
  const sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('找不到工作表：' + name);
  return sh;
}

function sheetToObjects(sh) {
  const values = sh.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0].map(v => String(v).trim());
  return values.slice(1).map((row, index) => {
    const obj = { _rowNumber: index + 2 };
    headers.forEach((header, col) => obj[header] = row[col]);
    return obj;
  });
}

function findRecord(sh, key, value) {
  const row = sheetToObjects(sh).find(r => String(r[key]) === String(value));
  return row ? { rowNumber: row._rowNumber, data: row } : null;
}

function appendObject(sh, obj) {
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn())
    .getValues()[0]
    .map(v => String(v).trim());

  sh.appendRow(headers.map(header =>
    Object.prototype.hasOwnProperty.call(obj, header) ? obj[header] : ''
  ));
}

function updateRecord(sh, rowNumber, updates) {
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn())
    .getValues()[0]
    .map(v => String(v).trim());

  Object.keys(updates).forEach(key => {
    const index = headers.indexOf(key);
    if (index >= 0) sh.getRange(rowNumber, index + 1).setValue(updates[key]);
  });
}

function clearCellIfHeaderExists_(sh, rowNumber, header) {
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn())
    .getValues()[0]
    .map(v => String(v).trim());

  const index = headers.indexOf(header);
  if (index >= 0) sh.getRange(rowNumber, index + 1).clearContent();
}

function generateId(prefix) {
  return prefix + '_' + Utilities.getUuid().replace(/-/g, '').slice(0, 16);
}

function toBoolean(value) {
  if (value === true) return true;
  const text = String(value || '').trim().toLowerCase();
  return text === 'true' || text === '1' || text === 'yes';
}

function getNextFolderSortOrder(rows) {
  return rows.length
    ? Math.max.apply(null, rows.map(r => Number(r.sortOrder || 0))) + 1
    : 1;
}

function normalizeHeader_(value) {
  return String(value || '').trim().toLowerCase().replace(/[\s_\-]/g, '');
}

function parseRequestBody(e) {
  if (!e) return {};

  try {
    if (e.postData && e.postData.contents) {
      const content = e.postData.contents.trim();
      if (content.startsWith('{') || content.startsWith('[')) {
        return JSON.parse(content);
      }
    }
  } catch (_) {}

  const output = {};
  if (e.parameter) {
    Object.keys(e.parameter).forEach(key => output[key] = e.parameter[key]);
  }
  return output;
}

function errorResult_(err) {
  return {
    success: false,
    message: err && err.message ? err.message : String(err),
    stack: err && err.stack ? err.stack : ''
  };
}

function jsonOutput(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/* =====================================================
   Apps Script 編輯器手動測試
===================================================== */

function testSetup() {
  Logger.log(JSON.stringify(setupSheets(), null, 2));
}

function testPing() {
  Logger.log(JSON.stringify(ping_(), null, 2));
}

function testLegacyStatus() {
  Logger.log(JSON.stringify(legacyStatus(), null, 2));
}

function testCreateFolder() {
  Logger.log(JSON.stringify(createFolder({ folderName: 'UTOP測試資料夾_' + Date.now() }), null, 2));
}
