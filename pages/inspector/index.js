export const page = Object.freeze({
  id: 'inspector',
  title: '設備屬性與控制',
  selector: '#inspectorContent',
  init(context) {
    const element = document.querySelector(this.selector);
    context.eventBus.emit('page:ready', {
      id: this.id,
      title: this.title,
      available: Boolean(element)
    });
  }
});
