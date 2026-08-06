import { describe, expect, test } from 'vitest';
import { buildAxisRange } from './axis-range';

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
    expect(
      buildAxisRange(Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY),
    ).toBeNull();
  });
});
