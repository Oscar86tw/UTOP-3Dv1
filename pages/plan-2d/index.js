export const page = Object.freeze({
  id: 'plan-2d',
  title: '2D平面',
  selector: '#planSvg',
  init(context) {
    const element = document.querySelector(this.selector);
    context.eventBus.emit('page:ready', {
      id: this.id,
      title: this.title,
      available: Boolean(element)
    });
  }
});
