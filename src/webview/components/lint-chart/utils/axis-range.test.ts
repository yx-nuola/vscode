import { describe, expect, test } from 'vitest';
import { calculateAxisRange } from './axis-range';

describe('calculateAxisRange', () => {
  test('uses the real minimum and maximum', () => {
    expect(calculateAxisRange([-2, 4, 1])).toEqual({ min: -2, max: 4 });
  });

  test('expands a constant non-zero range', () => {
    expect(calculateAxisRange([10, 10])).toEqual({ min: 9.5, max: 10.5 });
  });

  test('expands a constant zero range', () => {
    expect(calculateAxisRange([0])).toEqual({ min: -1, max: 1 });
  });

  test('handles large datasets without spreading function arguments', () => {
    const values = Array.from({ length: 200_000 }, (_, index) => index - 100_000);

    expect(calculateAxisRange(values)).toEqual({
      min: -100_000,
      max: 99_999,
    });
  });
});
