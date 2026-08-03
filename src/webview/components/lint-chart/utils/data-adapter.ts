import type { CsvColumn, ParsedCsvData } from '../types';

const VIRTUAL_DEVICE_COLUMN = 'device-id';

export function addVirtualDeviceId(data: ParsedCsvData): ParsedCsvData {
  if (findDeviceColumn(data.columns)) {
    return data;
  }

  const wlColumn = findColumnByDisplayName(data.columns, 'wl');
  const blColumn = findColumnByDisplayName(data.columns, 'bl');

  if (!wlColumn || !blColumn) {
    return data;
  }

  const virtualColumn: CsvColumn = {
    rawName: VIRTUAL_DEVICE_COLUMN,
    displayName: 'device-id',
    unit: null,
    inferredType: 'string',
  };

  return {
    ...data,
    columns: [virtualColumn, ...data.columns],
    rows: data.rows.map((row) => ({
      ...row,
      values: {
        ...row.values,
        [VIRTUAL_DEVICE_COLUMN]: `${row.values[wlColumn.rawName]}-${row.values[blColumn.rawName]}`,
      },
    })),
  };
}

export function findDeviceColumn(columns: CsvColumn[]): CsvColumn | null {
  return columns.find((column) => normalizeName(column.displayName) === 'deviceid') ?? null;
}

export function findCurrentColumn(columns: CsvColumn[]): CsvColumn | null {
  return columns.find((column) => normalizeName(column.displayName) === 'current') ?? null;
}

function findColumnByDisplayName(
  columns: CsvColumn[],
  displayName: string,
): CsvColumn | null {
  return columns.find(
    (column) => normalizeName(column.displayName) === normalizeName(displayName),
  ) ?? null;
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[\s_-]/g, '');
}

