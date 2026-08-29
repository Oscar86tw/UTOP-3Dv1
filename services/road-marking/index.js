export const ROAD_MARKINGS = Object.freeze({
  centerLine: {
    visible: true,
    color: 0xf4d31e,
    width: 0.08,
    dashLength: 0.72,
    dashGap: 0.48,
    roadLength: 16
  }
});

export function normalizedRoadMarkings(value = {}) {
  return {
    centerLine: {
      ...ROAD_MARKINGS.centerLine,
      ...(value.centerLine || {})
    }
  };
}
