const BASE_COLORS = [
  '#165dff',
  '#00b42a',
  '#ff7d00',
  '#722ed1',
  '#f53f3f',
  '#14c9c9',
  '#f7ba1e',
  '#3491fa',
];

export const SERIES_SYMBOLS = ['circle', 'rect', 'triangle', 'diamond', 'roundRect'] as const;

export const SERIES_LINE_TYPES = ['solid', 'dashed', 'dotted'] as const;

export function createSeriesColors(count: number): string[] {
  if (count <= BASE_COLORS.length) {
    return BASE_COLORS.slice(0, Math.max(0, count));
  }

  const colors = [...BASE_COLORS];

  for (let index = BASE_COLORS.length; index < count; index += 1) {
    const hue = Math.round((index * 137.508) % 360);
    const lightness = index % 2 === 0 ? 44 : 56;
    colors.push(`hsl(${hue}, 68%, ${lightness}%)`);
  }

  return colors;
}

export function formatAxisValue(value: number): string {
  if (!Number.isFinite(value)) {
    return '';
  }

  if (value === 0) {
    return '0';
  }

  const absoluteValue = Math.abs(value);

  if (absoluteValue >= 1_000_000 || absoluteValue < 0.001) {
    return value.toExponential(2);
  }

  if (absoluteValue >= 1_000) {
    return Number(value.toFixed(0)).toString();
  }

  return Number(value.toPrecision(5)).toString();
}
