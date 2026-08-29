export const page = Object.freeze({
  id: 'scene-3d',
  title: '3D模擬',
  selector: '#sceneWrap',
  init(context) {
    const element = document.querySelector(this.selector);
    context.eventBus.emit('page:ready', {
      id: this.id,
      title: this.title,
      available: Boolean(element)
    });
  }
});
