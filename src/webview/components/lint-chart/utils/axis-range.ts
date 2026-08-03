export interface AxisRange {
  min: number;
  max: number;
}

export function calculateAxisRange(values: number[]): AxisRange | null {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const value of values) {
    if (!Number.isFinite(value)) {
      continue;
    }

    min = Math.min(min, value);
    max = Math.max(max, value);
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return null;
  }

  if (min !== max) {
    return { min, max };
  }

  const padding = Math.abs(min) > 0 ? Math.abs(min) * 0.05 : 1;
  return {
    min: min - padding,
    max: max + padding,
  };
}
