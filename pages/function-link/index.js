export const page = Object.freeze({
  id: 'function-link',
  title: '接線與連動',
  selector: '#wiringDialog',
  init(context) {
    const element = document.querySelector(this.selector);
    context.eventBus.emit('page:ready', {
      id: this.id,
      title: this.title,
      available: Boolean(element)
    });
  }
});
