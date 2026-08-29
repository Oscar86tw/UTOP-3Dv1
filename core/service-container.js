export class ServiceContainer {
  #services = new Map();

  register(token, service) {
    if (!token) throw new Error('Service token 不可為空');
    if (this.#services.has(token)) throw new Error(`Service 已註冊：${token}`);
    this.#services.set(token, service);
    return service;
  }

  replace(token, service) {
    if (!token) throw new Error('Service token 不可為空');
    this.#services.set(token, service);
    return service;
  }

  get(token) {
    if (!this.#services.has(token)) throw new Error(`找不到 Service：${token}`);
    return this.#services.get(token);
  }

  has(token) {
    return this.#services.has(token);
  }

  list() {
    return [...this.#services.keys()];
  }
}

export const serviceContainer = new ServiceContainer();
