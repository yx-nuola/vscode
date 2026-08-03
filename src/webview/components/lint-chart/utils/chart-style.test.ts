import { describe, expect, test } from 'vitest';
import { createSeriesColors, formatAxisValue } from './chart-style';

describe('formatAxisValue', () => {
  test('shortens long decimal labels', () => {
    expect(formatAxisValue(-0.2385138363)).toBe('-0.23851');
    expect(formatAxisValue(3.5000000001)).toBe('3.5');
  });

  test('uses scientific notation for very small and large values', () => {
    expect(formatAxisValue(0.000012345)).toBe('1.23e-5');
    expect(formatAxisValue(1_234_567)).toBe('1.23e+6');
  });
});

describe('createSeriesColors', () => {
  test('creates a color for every series without cycling the base palette', () => {
    const colors = createSeriesColors(15);

    expect(colors).toHaveLength(15);
    expect(new Set(colors).size).toBe(15);
  });
});

