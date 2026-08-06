export interface AxisRange {
  min: number;
  max: number;
}

export function buildAxisRange(min: number, max: number): AxisRange | null {
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

