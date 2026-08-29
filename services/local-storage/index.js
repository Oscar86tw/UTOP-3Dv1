const CACHE_KEY = 'utop3d_v2_local_cache';

export function saveLocalCache(project) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(project));
}

export function loadLocalCache() {
  const raw = localStorage.getItem(CACHE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearLocalCache() {
  localStorage.removeItem(CACHE_KEY);
}
