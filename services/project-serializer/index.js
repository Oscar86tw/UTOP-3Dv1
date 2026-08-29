export function validateProject(project) {
  if (!project || typeof project !== 'object') throw new Error('專案資料格式錯誤');
  if (!Array.isArray(project.items)) throw new Error('專案缺少設備資料');
  if (!Array.isArray(project.wires)) throw new Error('專案缺少接線資料');
  return project;
}

export function cloneProject(project) {
  return structuredClone
    ? structuredClone(project)
    : JSON.parse(JSON.stringify(project));
}
