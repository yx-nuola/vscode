import { describe, expect, test } from 'vitest';
import { buildAxisRange, buildNiceAxisRange } from './axis-range';

describe('buildAxisRange', () => {
  test('uses the real minimum and maximum', () => {
    expect(buildAxisRange(-2, 4)).toEqual({ min: -2, max: 4 });
  });

  test('expands a constant non-zero range', () => {
    expect(buildAxisRange(10, 10)).toEqual({ min: 9.5, max: 10.5 });
  });

  test('expands a constant zero range', () => {
    expect(buildAxisRange(0, 0)).toEqual({ min: -1, max: 1 });
  });

  test('returns null when the values are not finite', () => {
    expect(buildAxisRange(Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY)).toBeNull();
  });
});

describe('buildNiceAxisRange', () => {
  test('expands polyline sample bounds to evenly spaced 0.2 ticks', () => {
    const yMin = 3.775085624450684;
    const yMax = 5.212158378356934;

    expect(buildNiceAxisRange(yMin, yMax, 10)).toEqual({
      min: 3.6,
      max: 5.4,
      interval: 0.2,
    });
  });

  test('falls back to padded range for a constant value', () => {
    expect(buildNiceAxisRange(10, 10, 10)).toEqual({
      min: 9.4,
      max: 10.6,
      interval: 0.2,
    });
  });
});
