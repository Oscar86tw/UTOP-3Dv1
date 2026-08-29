
export const LABEL_MODES = Object.freeze({
  ALL: 'all',
  SELECTED: 'selected',
  HOVER: 'hover',
  HIDDEN: 'hidden'
});

export function shouldShowLabel(mode, { selected = false, hovered = false } = {}) {
  if (mode === LABEL_MODES.HIDDEN) return false;
  if (mode === LABEL_MODES.SELECTED) return selected;
  if (mode === LABEL_MODES.HOVER) return selected || hovered;
  return true;
}
