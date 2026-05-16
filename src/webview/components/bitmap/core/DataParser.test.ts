import { describe, expect, test } from 'vitest';
import { DataParser } from './DataParser';
import type { MatrixData } from '../types';

describe('DataParser.mergeData', () => {
  test('uses the maximum merged cell coordinates when appended sparse cells are not sorted', () => {
    const existingData: MatrixData = {
      rows: 64,
      cols: 64,
      cells: [
        { row: 0, col: 0, value: 1 },
      ],
    };
    const newData: MatrixData = {
      rows: 5,
      cols: 127,
      cells: [
        { row: 2, col: 126, value: 3 },
        { row: 4, col: 9, value: 4 },
      ],
    };

    const mergedData = DataParser.mergeData(existingData, newData);

    expect(mergedData.rows).toBe(64);
    expect(mergedData.cols).toBe(127);
  });
});
