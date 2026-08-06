import type { CsvColumn } from '../types';

export function findDeviceColumn(tableHeader: CsvColumn[]): CsvColumn | null {
  return tableHeader.find((column) => normalizeName(column.displayName) === 'deviceid') ?? null;
}

export function findCurrentColumn(tableHeader: CsvColumn[]): CsvColumn | null {
  return tableHeader.find((column) => normalizeName(column.displayName) === 'current') ?? null;
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[\s_-]/g, '');
}
