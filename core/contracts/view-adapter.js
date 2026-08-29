export function assertViewAdapter(adapter) {
  const required = ['mount', 'unmount', 'resize', 'render'];
  for (const method of required) {
    if (typeof adapter?.[method] !== 'function') throw new Error(`ViewAdapter 缺少 ${method}()`);
  }
  return adapter;
}
