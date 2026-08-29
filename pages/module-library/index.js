export const page = Object.freeze({
  id: 'module-library',
  title: '模組庫',
  selector: '#moduleList',
  init(context) {
    const element = document.querySelector(this.selector);
    context.eventBus.emit('page:ready', {
      id: this.id,
      title: this.title,
      available: Boolean(element)
    });
  }
});
