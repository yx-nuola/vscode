import { describe, expect, test } from 'vitest';
import { parseCsv } from './csv-parser';

describe('parseCsv', () => {
  test('parses BOM, quoted fields, units and numeric columns', () => {
    const result = parseCsv(
      '\uFEFFdevice-id,VBL(V),Current(uA),Note\n' +
        '1,3.00,4.2,"hello, csv"\n',
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].values.Note).toBe('hello, csv');
    expect(result.columns[1]).toMatchObject({
      rawName: 'VBL(V)',
      displayName: 'VBL',
      unit: 'V',
      inferredType: 'number',
    });
  });

  test('rejects duplicate headers', () => {
    expect(() => parseCsv('VBL,VBL\n1,2')).toThrow('CSV 存在重复表头');
  });

  test('reports rows with a mismatched column count', () => {
    const result = parseCsv('A,B\n1\n2,3');

    expect(result.errors).toEqual([
      {
        sourceRowIndex: 2,
        message: '列数不匹配：期望 2 列，实际 1 列',
      },
    ]);
  });
});

