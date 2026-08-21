import { describe, expect, test } from 'vitest';
import { parseCsv } from './csv-parser';

describe('parseCsv', () => {
  test('parses BOM, quoted fields and units in headers', () => {
    const result = parseCsv(
      '\uFEFFdevice-id,VBL(V),Current(uA),Note\n' + '1,3.00,4.2,"hello, csv"\n'
    );

    expect(result.polylineData).toHaveLength(1);
    expect(result.polylineData[0].Note).toBe('hello, csv');
    expect(result.tableHeader[1]).toMatchObject({
      rawName: 'VBL(V)',
      displayName: 'VBL',
    });
  });

  test('rejects an empty file', () => {
    expect(() => parseCsv('')).toThrow('CSV 文件为空');
  });

  test('rejects a file without a header row', () => {
    expect(() => parseCsv('\n\n')).toThrow('CSV 缺少表头');
  });

  test('rejects an empty header', () => {
    expect(() => parseCsv('device-id,,VBL\n1,2,3')).toThrow('CSV 存在空表头');
  });

  test('rejects duplicate headers', () => {
    expect(() => parseCsv('device-id,VBL,VBL\n1,2,3')).toThrow('CSV 存在重复表头');
  });

  test('rejects a file without a DeviceID column', () => {
    expect(() => parseCsv('VBL,Current\n1,2')).toThrow('CSV 缺少大组字段 DeviceID');
  });

  test('skips empty lines while keeping the rest', () => {
    const result = parseCsv('DeviceID,VBL\n121,1\n\n,,\n121,2\n');

    expect(result.polylineData).toHaveLength(2);
    expect(result.polylineData.map((row) => row.VBL)).toEqual(['1', '2']);
  });

  test('throws a generic parse error on a mismatched column count', () => {
    expect(() => parseCsv('DeviceID,VBL\n121\n121,2')).toThrow('CSV 解析出错');
  });

  test('throws a generic parse error on malformed quoted fields', () => {
    expect(() => parseCsv('DeviceID,VBL\n121,"unterminated')).toThrow('CSV 解析出错');
  });
});
