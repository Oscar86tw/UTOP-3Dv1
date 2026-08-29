/*******************************************************
 * UTOP-3D Cloud Storage Backend V5.1.3.34
 * Spreadsheet: 1lmEqbYals_uBIOrQFDupYR2hs0iks5zEJM6FTOuOwP0
 * 新增：legacyStatus / importLegacyProjects
 *******************************************************/

const UTOP_SPREADSHEET_ID = '1lmEqbYals_uBIOrQFDupYR2hs0iks5zEJM6FTOuOwP0';
const CONFIG = {
  LEGACY_SHEET: '工作表1',
  PROJECT_SHEET: 'Projects',
  FOLDER_SHEET: 'CloudFolders',
  LOG_SHEET: 'CloudLog',
  PROJECT_HEADERS: ['projectId','projectName','folderId','locked','deleted','version','data','createdAt','updatedAt','legacySourceId'],
  FOLDER_HEADERS: ['folderId','folderName','parentFolderId','locked','deleted','sortOrder','createdAt','updatedAt','note'],
  LOG_HEADERS: ['logId','timestamp','action','targetType','targetId','targetName','result','message']
};

function ss_() { return SpreadsheetApp.openById(UTOP_SPREADSHEET_ID); }

function doGet(e) {
  try {
    setupSheets();
    const p = (e && e.parameter) || {};
    const action = String(p.action || '').trim();
    let result;
    switch (action) {
      case 'ping': result = {success:true, message:'UTOP Cloud API V5.1.3.34 Online', time:new Date().toISOString()}; break;
      case 'listFolders': result = listFolders(p); break;
      case 'listProjects': result = listProjects(p); break;
      case 'loadProject': result = loadProject(p); break;
      case 'legacyStatus': result = legacyStatus(); break;
      default: result = {success:false, message:'未知 GET action：' + action};
    }
    return jsonOutput(result);
  } catch (err) {
    return jsonOutput({success:false, message:err.message, stack:err.stack});
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
      default: result = {success:false, message:'未知 POST action：' + action};
    }
    return jsonOutput(result);
  } catch (err) {
    return jsonOutput({success:false, message:err.message, stack:err.stack});
  }
}

function setupSheets() {
  const ss = ss_();
  ensureSheet(ss, CONFIG.PROJECT_SHEET, CONFIG.PROJECT_HEADERS);
  ensureSheet(ss, CONFIG.FOLDER_SHEET, CONFIG.FOLDER_HEADERS);
  ensureSheet(ss, CONFIG.LOG_SHEET, CONFIG.LOG_HEADERS);
  return {success:true};
}

function ensureSheet(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    sh.setFrozenRows(1);
    return sh;
  }
  const current = sh.getRange(1,1,1,Math.max(1,sh.getLastColumn())).getValues()[0].map(v=>String(v).trim());
  headers.forEach(h => { if (!current.includes(h)) sh.getRange(1,sh.getLastColumn()+1).setValue(h); });
  sh.setFrozenRows(1);
  return sh;
}

/* -------------------- 舊資料偵測/匯入 -------------------- */
function legacyStatus() {
  const ss = ss_();
  const legacy = ss.getSheetByName(CONFIG.LEGACY_SHEET);
  const projects = ss.getSheetByName(CONFIG.PROJECT_SHEET);
  if (!legacy || legacy.getLastRow() < 2) {
    return {success:true, legacyCount:0, importableCount:0, projectCount:Math.max(0,(projects?projects.getLastRow():1)-1)};
  }
  const parsed = parseLegacyRows_(legacy);
  const existing = projects ? sheetToObjects(projects) : [];
  const existingKeys = new Set(existing.map(r=>String(r.legacySourceId || r.projectId || '')).filter(Boolean));
  const importable = parsed.filter(r=>r.data && !existingKeys.has(String(r.legacySourceId || '')));
  return {
    success:true,
    legacyCount: parsed.length,
    importableCount: importable.length,
    projectCount: existing.filter(r=>!toBoolean(r.deleted)).length,
    detectedHeaders: parsed._headers || []
  };
}

function importLegacyProjects(payload) {
  const ss = ss_();
  const legacy = ss.getSheetByName(CONFIG.LEGACY_SHEET);
  if (!legacy || legacy.getLastRow() < 2) return {success:true, imported:0, skipped:0, message:'沒有舊資料'};

  const projectSheet = ss.getSheetByName(CONFIG.PROJECT_SHEET);
  const oldRows = parseLegacyRows_(legacy);
  const existing = sheetToObjects(projectSheet);
  const existingLegacy = new Set(existing.map(r=>String(r.legacySourceId || '')).filter(Boolean));
  const existingNameData = new Set(existing.map(r=>String(r.projectName||'')+'|'+String(r.data||'').slice(0,120)));
  let imported = 0, skipped = 0;

  oldRows.forEach((row, index) => {
    if (!row.data) { skipped++; return; }
    const legacySourceId = String(row.legacySourceId || ('legacy_row_' + (index+2)));
    const duplicateKey = String(row.projectName||'')+'|'+String(row.data||'').slice(0,120);
    if (existingLegacy.has(legacySourceId) || existingNameData.has(duplicateKey)) { skipped++; return; }

    const now = new Date();
    appendObject(projectSheet, {
      projectId: row.projectId || generateId('project'),
      projectName: row.projectName || ('舊版專案_' + (index+1)),
      folderId: '',
      locked: false,
      deleted: false,
      version: row.version || 'legacy',
      data: normalizeProjectData_(row.data),
      createdAt: row.createdAt || now,
      updatedAt: row.updatedAt || now,
      legacySourceId: legacySourceId
    });
    imported++;
    existingLegacy.add(legacySourceId);
    existingNameData.add(duplicateKey);
  });

  addLog('IMPORT_LEGACY','system','工作表1','舊版資料匯入','SUCCESS','匯入 '+imported+' 筆，略過 '+skipped+' 筆；工作表1保留不刪除');
  return {success:true, imported, skipped, preservedLegacy:true};
}

function parseLegacyRows_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (!values.length) return [];
  const headers = values[0].map(v=>String(v).trim());
  const norm = headers.map(h=>normalizeHeader_(h));
  const knownHeader = norm.some(h => ['fileid','projectid','filename','projectname','project','data','json','content'].includes(h));
  const rows = [];

  const candidates = {
    id: ['fileid','projectid','id'],
    name: ['filename','projectname','name','專案名稱','檔案名稱'],
    data: ['project','data','json','content','projectdata','專案資料','資料'],
    version: ['version','版本'],
    created: ['createdat','created','建立時間','建立日期'],
    updated: ['updatedat','updated','修改時間','更新時間','更新日期']
  };
  const idx = key => {
    for (const c of candidates[key]) {
      const i = norm.indexOf(normalizeHeader_(c));
      if (i >= 0) return i;
    }
    return -1;
  };
  const idIdx=idx('id'), nameIdx=idx('name'), dataIdx=idx('data'), versionIdx=idx('version'), createdIdx=idx('created'), updatedIdx=idx('updated');

  for (let r = knownHeader ? 1 : 0; r < values.length; r++) {
    const row = values[r];
    if (row.every(v=>String(v).trim()==='')) continue;

    let data = dataIdx >= 0 ? row[dataIdx] : '';
    let name = nameIdx >= 0 ? row[nameIdx] : '';
    let id = idIdx >= 0 ? row[idIdx] : '';

    // 若舊表不是標準欄位，尋找最像 JSON 的儲存格
    if (!data) {
      for (let c=0;c<row.length;c++) {
        const s=String(row[c]??'').trim();
        if ((s.startsWith('{') || s.startsWith('[')) && s.length > 50) { data=s; break; }
      }
    }
    if (!name) {
      const textCells=row.map(v=>String(v??'').trim()).filter(s=>s && !s.startsWith('http') && !s.startsWith('{') && s.length<120);
      name=textCells[0] || ('舊版專案_'+r);
    }
    if (!id) id='legacy_'+r+'_'+Utilities.base64EncodeWebSafe(String(name)).slice(0,24);
    if (!data) continue;

    rows.push({
      legacySourceId:String(id),
      projectId:'',
      projectName:String(name).replace(/\.json$/i,''),
      data:data,
      version:versionIdx>=0?String(row[versionIdx]||'legacy'):'legacy',
      createdAt:createdIdx>=0?row[createdIdx]:'',
      updatedAt:updatedIdx>=0?row[updatedIdx]:''
    });
  }
  rows._headers = headers;
  return rows;
}

function normalizeHeader_(s) { return String(s||'').trim().toLowerCase().replace(/[\s_\-]/g,''); }
function normalizeProjectData_(value) {
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value || {}); } catch (_) { return String(value || ''); }
}

/* -------------------- 資料夾 -------------------- */
function createFolder(p) {
  const name=String(p.folderName||p.name||'').trim();
  if(!name) return {success:false,message:'資料夾名稱不能空白'};
  const sh=getSheet(CONFIG.FOLDER_SHEET), rows=sheetToObjects(sh), parent=String(p.parentFolderId||'').trim();
  if(rows.some(r=>!toBoolean(r.deleted)&&String(r.folderName).trim()===name&&String(r.parentFolderId||'')===parent)) return {success:false,message:'同一層已存在相同名稱的資料夾'};
  if(parent&&!rows.some(r=>r.folderId===parent&&!toBoolean(r.deleted))) return {success:false,message:'找不到上層資料夾'};
  const id=generateId('folder'), now=new Date();
  appendObject(sh,{folderId:id,folderName:name,parentFolderId:parent,locked:false,deleted:false,sortOrder:getNextFolderSortOrder(rows),createdAt:now,updatedAt:now,note:String(p.note||'')});
  addLog('CREATE_FOLDER','folder',id,name,'SUCCESS','建立資料夾');
  return {success:true,folderId:id,folderName:name,name:name,parentFolderId:parent};
}

function listFolders(p) {
  let rows=sheetToObjects(getSheet(CONFIG.FOLDER_SHEET));
  if(!toBoolean(p.includeDeleted)) rows=rows.filter(r=>!toBoolean(r.deleted));
  rows.sort((a,b)=>Number(a.sortOrder||0)-Number(b.sortOrder||0)||String(a.folderName).localeCompare(String(b.folderName),'zh-Hant'));
  return {success:true,folders:rows.map(r=>({...r,name:r.folderName,id:r.folderId}))};
}

function renameFolder(p){
  const id=String(p.folderId||'').trim(), name=String(p.folderName||p.name||'').trim();
  if(!id||!name)return{success:false,message:'缺少 folderId 或資料夾名稱'};
  const sh=getSheet(CONFIG.FOLDER_SHEET), rec=findRecord(sh,'folderId',id); if(!rec)return{success:false,message:'找不到資料夾'};
  if(toBoolean(rec.data.locked))return{success:false,message:'資料夾已鎖定，請先解除鎖定'};
  updateRecord(sh,rec.rowNumber,{folderName:name,updatedAt:new Date()}); addLog('RENAME_FOLDER','folder',id,name,'SUCCESS','重新命名資料夾');
  return{success:true,folderId:id,folderName:name,name:name};
}

function deleteFolder(p){
  const id=String(p.folderId||'').trim(), sh=getSheet(CONFIG.FOLDER_SHEET), rec=findRecord(sh,'folderId',id);
  if(!rec)return{success:false,message:'找不到資料夾'}; if(toBoolean(rec.data.locked))return{success:false,message:'此資料夾已鎖定，禁止刪除'};
  if(sheetToObjects(sh).some(r=>!toBoolean(r.deleted)&&String(r.parentFolderId||'')===id))return{success:false,message:'資料夾內還有子資料夾'};
  if(sheetToObjects(getSheet(CONFIG.PROJECT_SHEET)).some(r=>!toBoolean(r.deleted)&&String(r.folderId||'')===id))return{success:false,message:'資料夾內還有專案'};
  updateRecord(sh,rec.rowNumber,{deleted:true,updatedAt:new Date()}); addLog('DELETE_FOLDER','folder',id,rec.data.folderName,'SUCCESS','資料夾軟刪除'); return{success:true,folderId:id};
}

function setFolderLock(p,locked){const id=String(p.folderId||'').trim(),sh=getSheet(CONFIG.FOLDER_SHEET),rec=findRecord(sh,'folderId',id);if(!rec)return{success:false,message:'找不到資料夾'};updateRecord(sh,rec.rowNumber,{locked:locked,updatedAt:new Date()});return{success:true,folderId:id,locked:locked};}

/* -------------------- 專案 -------------------- */
function saveProject(p){
  const name=String(p.projectName||p.fileName||'').trim(); if(!name)return{success:false,message:'專案名稱不能空白'};
  let id=String(p.projectId||p.fileId||'').trim(); const folderId=String(p.folderId||'').trim(); const sh=getSheet(CONFIG.PROJECT_SHEET), now=new Date();
  let data = p.data !== undefined ? p.data : p.project; if(typeof data!=='string') data=JSON.stringify(data||{});
  if(id){const rec=findRecord(sh,'projectId',id);if(rec){if(toBoolean(rec.data.locked))return{success:false,message:'此專案已鎖定，禁止覆蓋'};updateRecord(sh,rec.rowNumber,{projectName:name,folderId:folderId,version:String(p.version||''),data:data,deleted:false,updatedAt:now});return{success:true,projectId:id,fileId:id,projectName:name,fileName:name,updated:true};}}
  id=generateId('project'); appendObject(sh,{projectId:id,projectName:name,folderId:folderId,locked:false,deleted:false,version:String(p.version||''),data:data,createdAt:now,updatedAt:now,legacySourceId:''});
  return{success:true,projectId:id,fileId:id,projectName:name,fileName:name,updated:false};
}

function listProjects(p){
  let rows=sheetToObjects(getSheet(CONFIG.PROJECT_SHEET)); if(!toBoolean(p.includeDeleted))rows=rows.filter(r=>!toBoolean(r.deleted)); const folderId=String(p.folderId||'').trim(); if(folderId)rows=rows.filter(r=>String(r.folderId||'')===folderId);
  const folders=new Map(sheetToObjects(getSheet(CONFIG.FOLDER_SHEET)).map(f=>[String(f.folderId),String(f.folderName||'')]));
  const projects=rows.map(r=>({projectId:r.projectId,fileId:r.projectId,projectName:r.projectName,fileName:r.projectName,folderId:r.folderId||'',folderName:folders.get(String(r.folderId||''))||'',locked:toBoolean(r.locked),deleted:toBoolean(r.deleted),version:r.version||'',createdAt:r.createdAt||'',updatedAt:r.updatedAt||'',deviceCount:0,linkCount:0}));
  projects.sort((a,b)=>new Date(b.updatedAt||0)-new Date(a.updatedAt||0)); return{success:true,projects:projects};
}

function loadProject(p){const id=String(p.projectId||p.fileId||'').trim();if(!id)return{success:false,message:'缺少 projectId'};const rec=findRecord(getSheet(CONFIG.PROJECT_SHEET),'projectId',id);if(!rec)return{success:false,message:'找不到專案'};if(toBoolean(rec.data.deleted))return{success:false,message:'此專案已刪除'};let data=rec.data.data;try{data=JSON.parse(data)}catch(_){}return{success:true,fileName:rec.data.projectName,project:{projectId:id,projectName:rec.data.projectName,folderId:rec.data.folderId||'',locked:toBoolean(rec.data.locked),version:rec.data.version||'',data:data,createdAt:rec.data.createdAt,updatedAt:rec.data.updatedAt}};}
function deleteProject(p){const id=String(p.projectId||p.fileId||'').trim(),sh=getSheet(CONFIG.PROJECT_SHEET),rec=findRecord(sh,'projectId',id);if(!rec)return{success:false,message:'找不到專案'};if(toBoolean(rec.data.locked))return{success:false,message:'🔒 此專案已鎖定，禁止刪除'};updateRecord(sh,rec.rowNumber,{deleted:true,updatedAt:new Date()});return{success:true,projectId:id,fileId:id};}
function restoreProject(p){const id=String(p.projectId||p.fileId||'').trim(),sh=getSheet(CONFIG.PROJECT_SHEET),rec=findRecord(sh,'projectId',id);if(!rec)return{success:false,message:'找不到專案'};updateRecord(sh,rec.rowNumber,{deleted:false,updatedAt:new Date()});return{success:true,projectId:id,fileId:id};}
function setProjectLock(p,locked){const id=String(p.projectId||p.fileId||'').trim(),sh=getSheet(CONFIG.PROJECT_SHEET),rec=findRecord(sh,'projectId',id);if(!rec)return{success:false,message:'找不到專案'};updateRecord(sh,rec.rowNumber,{locked:locked,updatedAt:new Date()});return{success:true,projectId:id,fileId:id,locked:locked};}
function moveProject(p){const id=String(p.projectId||p.fileId||'').trim(),folderId=String(p.folderId||'').trim(),sh=getSheet(CONFIG.PROJECT_SHEET),rec=findRecord(sh,'projectId',id);if(!rec)return{success:false,message:'找不到專案'};if(toBoolean(rec.data.locked))return{success:false,message:'專案已鎖定，不能移動'};updateRecord(sh,rec.rowNumber,{folderId:folderId,updatedAt:new Date()});return{success:true,projectId:id,fileId:id,folderId:folderId};}

/* -------------------- 共用 -------------------- */
function getSheet(name){const sh=ss_().getSheetByName(name);if(!sh)throw new Error('找不到工作表：'+name);return sh;}
function sheetToObjects(sh){const v=sh.getDataRange().getValues();if(v.length<=1)return[];const h=v[0].map(x=>String(x).trim());return v.slice(1).map((r,i)=>{const o={_rowNumber:i+2};h.forEach((k,c)=>o[k]=r[c]);return o;});}
function findRecord(sh,key,val){const r=sheetToObjects(sh).find(x=>String(x[key])===String(val));return r?{rowNumber:r._rowNumber,data:r}:null;}
function appendObject(sh,obj){const h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(x=>String(x).trim());sh.appendRow(h.map(k=>Object.prototype.hasOwnProperty.call(obj,k)?obj[k]:''));}
function updateRecord(sh,row,updates){const h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(x=>String(x).trim());Object.keys(updates).forEach(k=>{const i=h.indexOf(k);if(i>=0)sh.getRange(row,i+1).setValue(updates[k]);});}
function generateId(prefix){return prefix+'_'+Utilities.getUuid().replace(/-/g,'').slice(0,16);}
function toBoolean(v){if(v===true)return true;const s=String(v||'').trim().toLowerCase();return s==='true'||s==='1'||s==='yes';}
function getNextFolderSortOrder(rows){return rows.length?Math.max.apply(null,rows.map(r=>Number(r.sortOrder||0)))+1:1;}
function addLog(action,targetType,targetId,targetName,result,message){try{appendObject(getSheet(CONFIG.LOG_SHEET),{logId:generateId('log'),timestamp:new Date(),action,targetType,targetId,targetName,result,message});}catch(e){console.log(e);}}
function parseRequestBody(e){if(!e)return{};try{if(e.postData&&e.postData.contents){const c=e.postData.contents.trim();if(c.startsWith('{')||c.startsWith('['))return JSON.parse(c);}}catch(_){};const o={};if(e.parameter)Object.keys(e.parameter).forEach(k=>o[k]=e.parameter[k]);return o;}
function jsonOutput(data){return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);}

function testSetup(){Logger.log(JSON.stringify(setupSheets()));}
function testLegacyStatus(){Logger.log(JSON.stringify(legacyStatus(),null,2));}
