import * as Papa from 'papaparse';
import type {
  ColumnType,
  CsvColumn,
  CsvParseError,
  ParsedCsvData,
  ParsedCsvRow,
} from '../types';

export function parseCsv(text: string): ParsedCsvData {
  const normalizedText = text.replace(/^\uFEFF/, '');
  if (normalizedText === '') {
    throw new Error('CSV 文件为空');
  }

  const parsed = Papa.parse<string[]>(normalizedText, {
    delimiter: ',',
    dynamicTyping: false,
    skipEmptyLines: false,
  });
  const records = parsed.data;

  if (records.length === 0) {
    throw new Error('CSV 文件为空');
  }

  const headers = records[0].map((header) => header.trim());
  validateHeaders(headers);

  const rows: ParsedCsvRow[] = [];
  const rowErrors: CsvParseError[] = parsed.errors.map((error) => ({
    sourceRowIndex: (error.row ?? 0) + 1,
    message: error.message,
  }));

  for (let index = 1; index < records.length; index += 1) {
    const record = records[index];

    if (record.every((value) => value.trim() === '')) {
      continue;
    }

    if (record.length !== headers.length) {
      rowErrors.push({
        sourceRowIndex: index + 1,
        message: `列数不匹配：期望 ${headers.length} 列，实际 ${record.length} 列`,
      });
    }

    const values: Record<string, string> = {};
    headers.forEach((header, columnIndex) => {
      values[header] = record[columnIndex]?.trim() ?? '';
    });

    //  为什么拼接成这种数据结构呢？？？为了后续方便处理还是？
    rows.push({
      sourceRowIndex: index + 1,
      values,
    });
  }

  // 这都是为什么这么拼接？？？
  const columns = inferColumns(headers, rows);

  return {
    columns,
    rows,
    errors: rowErrors,
  };
}

export function parseFiniteNumber(value: string): number | null {
  if (value.trim() === '') {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function validateHeaders(headers: string[]): void {
  if (headers.length === 0 || headers.every((header) => header === '')) {
    throw new Error('CSV 缺少表头');
  }

  const seen = new Set<string>();

  for (const header of headers) {
    if (header === '') {
      throw new Error('CSV 存在空表头');
    }

    if (seen.has(header)) {
      throw new Error(`CSV 存在重复表头：${header}`);
    }

    seen.add(header);
  }
}

function inferColumns(headers: string[], rows: ParsedCsvRow[]): CsvColumn[] {
  return headers.map((rawName) => {
    const values = rows
      .map((row) => row.values[rawName])
      .filter((value) => value !== '');
    const inferredType = inferColumnType(values);
    const { displayName, unit } = parseHeaderLabel(rawName);

    return {
      rawName,
      displayName,
      unit,
      inferredType,
    };
  });
}

function inferColumnType(values: string[]): ColumnType {
  if (values.length === 0) {
    return 'mixed';
  }

  const numericCount = values.filter(
    (value) => parseFiniteNumber(value) !== null,
  ).length;

  if (numericCount === values.length) {
    return 'number';
  }

  if (numericCount === 0) {
    return 'string';
  }

  return 'mixed';
}

function parseHeaderLabel(rawName: string): {
  displayName: string;
  unit: string | null;
} {
  const match = rawName.match(/^(.+?)\s*\(([^()]*)\)\s*$/);

  if (!match) {
    return {
      displayName: rawName,
      unit: null,
    };
  }

  return {
    displayName: match[1].trim(),
    unit: match[2].trim() || null,
  };
}
