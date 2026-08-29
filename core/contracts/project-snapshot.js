export const PROJECT_SNAPSHOT_SCHEMA = 'utop-project-snapshot-v2';

export function createProjectSnapshot({ version, projectName, devices = [], connections = [], settings = {} }) {
  return {
    schema: PROJECT_SNAPSHOT_SCHEMA,
    version: String(version || ''),
    projectName: String(projectName || 'UTOP Project'),
    savedAt: new Date().toISOString(),
    devices: structuredClone(devices),
    connections: structuredClone(connections),
    settings: structuredClone(settings)
  };
}

export function isProjectSnapshot(value) {
  return Boolean(value && value.schema === PROJECT_SNAPSHOT_SCHEMA && Array.isArray(value.devices) && Array.isArray(value.connections));
}
