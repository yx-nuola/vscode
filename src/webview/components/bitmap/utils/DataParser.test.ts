import { describe, expect, test } from 'vitest';
import { DataParser } from './data-parser';
import type { DataType, MatrixData } from '../types';

describe('DataParser.parseRRAMData', () => {
  test('infers dimensions and normalizes numeric measurements', () => {
    const data: DataType = {
      cells: [{ bl: 4, wl: 4, vset: '1.2', vreset: '0.5', imeas: '8.5', status: 'pass' }],
    };

    expect(DataParser.validateData(data)).toBe(true);
    expect(DataParser.parseRRAMData(data)).toEqual({
      rows: 5,
      cols: 5,
      cells: [
        {
          row: 4,
          col: 4,
          value: 8.5,
          wl: 4,
          bl: 4,
          vset: 1.2,
          vreset: 0.5,
          imeas: 8.5,
          status: 'pass',
        },
      ],
    });
  });

  test('expands declared dimensions to include sparse cells', () => {
    const data: DataType = {
      rows: 64,
      cols: 64,
      cells: [{ bl: 100, wl: 128, vset: 1, vreset: 0, imeas: 12, status: 'pass' }],
    };

    const matrixData = DataParser.parseRRAMData(data);

    expect(matrixData.rows).toBe(101);
    expect(matrixData.cols).toBe(129);
  });
});

describe('DataParser.mergeData', () => {
  test('preserves declared dimensions from both matrices even without boundary cells', () => {
    const existingData: MatrixData = {
      rows: 64,
      cols: 64,
      cells: [{ row: 0, col: 0, value: 1 }],
    };
    const newData: MatrixData = {
      rows: 100,
      cols: 127,
      cells: [],
    };

    const mergedData = DataParser.mergeData(existingData, newData);

    expect(mergedData.rows).toBe(100);
    expect(mergedData.cols).toBe(127);
  });
});

describe('DataParser validation', () => {
  test('rejects fractional or negative coordinates and non-numeric measurements', () => {
    const baseCell = { bl: 0, wl: 0, vset: 1, vreset: 0, imeas: 1, status: 'pass' };

    expect(DataParser.validateData({ cells: [{ ...baseCell, bl: -1 }] })).toBe(false);
    expect(DataParser.validateData({ cells: [{ ...baseCell, wl: 1.5 }] })).toBe(false);
    expect(DataParser.validateData({ cells: [{ ...baseCell, imeas: 'not-a-number' }] })).toBe(
      false
    );
  });

  test('parseJSON validates the parsed payload', () => {
    expect(() => DataParser.parseJSON('{"cells":[]}')).not.toThrow();
    expect(() => DataParser.parseJSON('{"cells":[{"bl":-1}]}')).toThrow('Invalid data format');
  });
});
