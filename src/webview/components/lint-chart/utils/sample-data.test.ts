import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, test } from 'vitest';
import type { LineChartConfig } from '../types';
import { parseCsv } from './csv-parser';
import { addVirtualDeviceId } from './data-adapter';
import { buildChartGroups } from './group-builder';

describe('polyline sample data', () => {
  test('draws 2.csv with a local Index X axis', () => {
    const result = buildSample('2.csv', {
      xColumn: null,
      yColumn: 'Current(uA)',
      deviceColumn: 'device-id',
      groupColumns: [],
      drawMode: 'split',
    });

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].series).toHaveLength(1);
    expect(result.validRows).toBe(9);
  });

  test('splits 3.csv into four VBL groups', () => {
    const result = buildSample('3.csv', {
      xColumn: 'VBL(V)',
      yColumn: 'Current(uA)',
      deviceColumn: 'device-id',
      groupColumns: ['VBL(V)'],
      drawMode: 'split',
    });

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].series).toHaveLength(4);
    expect(result.validRows).toBe(49);
  });

  test('splits RESET.csv by device and component-wise Group order', () => {
    const result = buildSample('RESET.csv', createSweepConfig());

    expect(result.groups).toHaveLength(15);
    expect(countSeries(result.groups)).toBe(75);
    expect(result.validRows).toBe(633);
  });

  test('splits SET.csv by device and component-wise Group order', () => {
    const result = buildSample('SET.csv', createSweepConfig());

    expect(result.groups).toHaveLength(15);
    expect(countSeries(result.groups)).toBe(193);
    expect(result.validRows).toBe(657);
  });
});

function buildSample(fileName: string, config: LineChartConfig) {
  const filePath = resolve('demoData', 'polyline', fileName);
  const csv = readFileSync(filePath, 'utf-8');
  const data = addVirtualDeviceId(parseCsv(csv));
  return buildChartGroups(data.rows, config);
}

function createSweepConfig(): LineChartConfig {
  return {
    xColumn: 'VBL(V)',
    yColumn: 'Current(uA)',
    deviceColumn: 'device-id',
    groupColumns: ['VWL(V)', 'VBL(V)'],
    drawMode: 'split',
  };
}

function countSeries(groups: ReturnType<typeof buildSample>['groups']): number {
  return groups.reduce((total, group) => total + group.series.length, 0);
}
