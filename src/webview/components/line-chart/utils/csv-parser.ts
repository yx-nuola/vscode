import * as Papa from 'papaparse';
import type {
  CsvColumn,
  ParsedCsvData,
  ParsedCsvRow,
} from '../types';

export function parseCsv(text: string): ParsedCsvData {

  debugger
  const normalizedText = text.replace(/^\uFEFF/, '');
  if (normalizedText === '') {
    throw new Error('CSV 文件为空');
  }

  const parsed = Papa.parse<ParsedCsvRow>(normalizedText, {
    delimiter: ',',
    header: true,
    dynamicTyping: false,
    skipEmptyLines: 'greedy',
    transformHeader: (header: string): string => header.trim(),
    transform: (value: string): string => value.trim(),
  });

  const headers = parsed.meta.fields ?? [];
  if (headers.length === 0) {
    throw new Error('CSV 缺少表头');
  }

  if (parsed.meta.renamedHeaders) {
    throw new Error('CSV 存在重复表头');
  }

  if (!headers.some((header) => normalizeName(header) === 'deviceid')) {
    throw new Error('CSV 缺少大组字段 DeviceID');
  }

  if (parsed.errors.length > 0) {
    throw new Error(`CSV 解析出错：${parsed.errors[0].message}`);
  }

  const polylineData = parsed.data;
  const tableHeader = inferColumns(headers);

  return {
    tableHeader,
    polylineData,
  };
}

export function parseFiniteNumber(value: string | undefined): number | null {
  if (value === undefined || value === null || value.trim() === '') {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}


function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[\s_-]/g, '');
}

function inferColumns(headers: string[]): CsvColumn[] {
  return headers.map((rawName) => ({
    rawName,
    displayName: parseDisplayName(rawName),
  }));
}

function parseDisplayName(rawName: string): string {
  const match = rawName.match(/^(.+?)\s*\(([^()]*)\)\s*$/);
  return match ? match[1].trim() : rawName;
}
