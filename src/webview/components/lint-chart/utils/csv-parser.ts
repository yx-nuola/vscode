import type {
  ColumnType,
  CsvColumn,
  CsvParseError,
  ParsedCsvData,
  ParsedCsvRow,
} from '../types';

interface RawCsvParseResult {
  records: string[][];
  errors: CsvParseError[];
}


// 为什么不用papaparse解析csv？
export function parseCsv(text: string): ParsedCsvData {
  const normalizedText = text.replace(/^\uFEFF/, '');
  const { records, errors } = parseCsvRecords(normalizedText);

  if (records.length === 0) {
    throw new Error('CSV 文件为空');
  }

  const headers = records[0].map((header) => header.trim());
  validateHeaders(headers);

  const rows: ParsedCsvRow[] = [];
  const rowErrors = [...errors];

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

function parseCsvRecords(text: string): RawCsvParseResult {
  const records: string[][] = [];
  const errors: CsvParseError[] = [];
  let record: string[] = [];
  let field = '';
  let inQuotes = false;
  let sourceRowIndex = 1;

  const pushField = (): void => {
    record.push(field);
    field = '';
  };

  const pushRecord = (): void => {
    pushField();
    records.push(record);
    record = [];
  };

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (character === '"') {
      if (inQuotes && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && character === ',') {
      pushField();
      continue;
    }

    if (!inQuotes && (character === '\n' || character === '\r')) {
      pushRecord();
      sourceRowIndex += 1;

      if (character === '\r' && text[index + 1] === '\n') {
        index += 1;
      }
      continue;
    }

    field += character;
  }

  if (inQuotes) {
    errors.push({
      sourceRowIndex,
      message: '存在未闭合的引号字段',
    });
  }

  if (field !== '' || record.length > 0) {
    pushRecord();
  }

  return { records, errors };
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

