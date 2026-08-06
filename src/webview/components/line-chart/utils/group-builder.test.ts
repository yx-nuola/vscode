import { describe, expect, test } from 'vitest';
import type { LineChartConfig, ParsedCsvRow } from '../types';
import {
  buildChartGroups,
  shouldStartNewSmallGroup,
} from './group-builder';

const config: LineChartConfig = {
  xColumn: 'VBL',
  yColumn: 'Current',
  deviceColumn: 'device-id',
  groupColumns: ['VWL', 'VBL'],
  drawMode: 'split',
};

describe('shouldStartNewSmallGroup', () => {
  test('continues when values are component-wise non-decreasing', () => {
    expect(shouldStartNewSmallGroup([1.6, 3], [1.6, 3.5])).toBe(false);
    expect(shouldStartNewSmallGroup([1.6, 3], [1.7, 3])).toBe(false);
  });

  test('splits when any value decreases or all values repeat', () => {
    expect(shouldStartNewSmallGroup([1.6, 4], [1.7, 3])).toBe(true);
    expect(shouldStartNewSmallGroup([2.2, 4], [2.2, 4])).toBe(true);
  });
});

describe('buildChartGroups', () => {
  test('builds the four confirmed small groups', () => {
    const pairs = [
      [1.6, 3],
      [1.6, 3.5],
      [1.6, 4],
      [1.6, 2.5],
      [1.6, 3],
      [1.6, 3.5],
      [1.6, 4],
      [1.6, 3],
      [1.6, 3.5],
      [1.6, 4],
      [1.7, 3],
      [1.7, 3.5],
      [1.7, 4],
    ];
    const polylineData = pairs.map(([vwl, vbl]) =>
      createRow('device-1', vwl, vbl),
    );

    const result = buildChartGroups(polylineData, config);

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].series.map((series) => series.points.length)).toEqual([
      3,
      4,
      3,
      3,
    ]);
  });

  test('starts a new big group when device-id changes', () => {
    const polylineData = [
      createRow('device-1', 1.6, 3),
      createRow('device-2', 1.6, 3),
      createRow('device-1', 1.6, 3),
    ];

    const result = buildChartGroups(polylineData, config);

    expect(result.groups).toHaveLength(3);
    expect(result.groups.map((group) => group.deviceValue)).toEqual([
      'device-1',
      'device-2',
      'device-1',
    ]);
  });

  test('keeps a repeated point as the first point in a new group', () => {
    const polylineData = [
      createRow('device-1', 1.6, 3),
      createRow('device-1', 1.6, 3),
    ];

    const result = buildChartGroups(polylineData, config);

    expect(result.groups[0].series).toHaveLength(2);
    expect(result.groups[0].series[1].points[0][2]).toBe(1);
  });
});

function createRow(
  deviceId: string,
  vwl: number,
  vbl: number,
): ParsedCsvRow {
  return {
    'device-id': deviceId,
    VWL: String(vwl),
    VBL: String(vbl),
    Current: String(vwl + vbl),
  };
}
