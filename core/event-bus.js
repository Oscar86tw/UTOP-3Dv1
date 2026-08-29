export class EventBus {
  #events = new Map();

  on(eventName, handler) {
    if (!this.#events.has(eventName)) this.#events.set(eventName, new Set());
    this.#events.get(eventName).add(handler);
    return () => this.off(eventName, handler);
  }

  off(eventName, handler) {
    this.#events.get(eventName)?.delete(handler);
  }

  emit(eventName, payload) {
    for (const handler of this.#events.get(eventName) || []) {
      try { handler(payload); }
      catch (error) { console.error(`[EventBus] ${eventName}`, error); }
    }
  }
}

export const eventBus = new EventBus();
