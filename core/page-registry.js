class PageRegistry {
  #pages = new Map();

  register(page) {
    if (!page?.id) throw new Error('頁面缺少 id');
    this.#pages.set(page.id, page);
  }

  get(id) {
    return this.#pages.get(id);
  }

  list() {
    return [...this.#pages.values()];
  }

  initAll(context) {
    for (const page of this.#pages.values()) {
      page.init?.(context);
    }
  }
}

export const pageRegistry = new PageRegistry();
