export interface AxisRange {
  min: number;
  max: number;
}

export interface NiceAxisRange extends AxisRange {
  interval: number;
}

const NICE_FRACTIONS = [1, 2, 2.5, 5, 10];

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

function niceStep(roughStep: number): number {
  if (!Number.isFinite(roughStep) || roughStep <= 0) {
    return 1;
  }

  const exponent = Math.floor(Math.log10(roughStep));
  const fraction = roughStep / 10 ** exponent;

  for (const niceFraction of NICE_FRACTIONS) {
    if (fraction <= niceFraction) {
      return niceFraction * 10 ** exponent;
    }
  }

  return 10 * 10 ** exponent;
}

function snapAxisBound(value: number, step: number, direction: 'down' | 'up'): number {
  const ratio = value / step;
  const snapped = direction === 'down' ? Math.floor(ratio) : Math.ceil(ratio);
  return Number((snapped * step).toPrecision(12));
}

function countTicks(min: number, max: number, interval: number): number {
  if (interval <= 0) {
    return 0;
  }

  return Math.round((max - min) / interval) + 1;
}

/**
 * Expands data bounds to evenly spaced "nice" tick boundaries and returns
 * a fixed interval so ECharts draws uniform grid lines.
 */
export function buildNiceAxisRange(
  min: number,
  max: number,
  targetTickCount = 10,
  paddingRatio = 0.05
): NiceAxisRange | null {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return null;
  }

  if (min === max) {
    const range = buildAxisRange(min, max);
    if (!range) {
      return null;
    }

    const interval = niceStep((range.max - range.min) / Math.max(targetTickCount - 1, 1));
    return {
      min: snapAxisBound(range.min, interval, 'down'),
      max: snapAxisBound(range.max, interval, 'up'),
      interval,
    };
  }

  const dataMin = Math.min(min, max);
  const dataMax = Math.max(min, max);
  const rawSpan = dataMax - dataMin;
  const padding = rawSpan * paddingRatio;
  const paddedMin = dataMin - padding;
  const paddedMax = dataMax + padding;
  const paddedSpan = paddedMax - paddedMin;
  const baseRoughStep = paddedSpan / Math.max(targetTickCount - 1, 1);
  const exponent = Math.floor(Math.log10(baseRoughStep));
  const candidates = new Set<number>();

  for (const offset of [-1, 0, 1]) {
    const scale = 10 ** (exponent + offset);
    for (const fraction of NICE_FRACTIONS) {
      candidates.add(fraction * scale);
    }
  }

  let bestRange: NiceAxisRange | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const interval of candidates) {
    const axisMin = snapAxisBound(paddedMin, interval, 'down');
    const axisMax = snapAxisBound(paddedMax, interval, 'up');
    const tickCount = countTicks(axisMin, axisMax, interval);

    if (tickCount < 4 || tickCount > 14) {
      continue;
    }

    const score =
      Math.abs(tickCount - targetTickCount) * 10 +
      (axisMax - axisMin - paddedSpan) / Math.max(paddedSpan, Number.EPSILON);

    if (score < bestScore) {
      bestScore = score;
      bestRange = { min: axisMin, max: axisMax, interval };
    }
  }

  if (bestRange) {
    return bestRange;
  }

  const interval = niceStep(baseRoughStep);
  return {
    min: snapAxisBound(paddedMin, interval, 'down'),
    max: snapAxisBound(paddedMax, interval, 'up'),
    interval,
  };
}
