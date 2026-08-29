class ModuleRegistry {
  #modules = new Map();

  register(manifest) {
    if (!manifest?.moduleId) throw new Error('設備模組缺少 moduleId');
    this.#modules.set(manifest.moduleId, Object.freeze(manifest));
  }

  get(moduleId) {
    return this.#modules.get(moduleId);
  }

  list(category = '') {
    const modules = [...this.#modules.values()];
    return category ? modules.filter(item => item.category === category) : modules;
  }
}

export const moduleRegistry = new ModuleRegistry();
