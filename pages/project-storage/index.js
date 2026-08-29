export const page = Object.freeze({
  id: 'project-storage',
  title: 'Google專案儲存',
  selector: '#googleSaveDialog',
  init(context) {
    const element = document.querySelector(this.selector);
    context.eventBus.emit('page:ready', {
      id: this.id,
      title: this.title,
      available: Boolean(element)
    });
  }
});
