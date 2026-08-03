export type ColumnType = 'number' | 'string' | 'mixed';

export type DrawMode = 'merge' | 'split';

export interface LineChartFeedback {
  tone: 'success' | 'warning' | 'error';
  message: string;
}

export interface CsvColumn {
  rawName: string;
  displayName: string;
  unit: string | null;
  inferredType: ColumnType;
}

export interface ParsedCsvRow {
  sourceRowIndex: number;
  values: Record<string, string>;
}

export interface CsvParseError {
  sourceRowIndex: number;
  message: string;
}

export interface ParsedCsvData {
  columns: CsvColumn[];
  rows: ParsedCsvRow[];
  errors: CsvParseError[];
}

export interface LineChartConfig {
  xColumn: string | null;
  yColumn: string;
  deviceColumn: string | null;
  groupColumns: string[];
  drawMode: DrawMode;
}

export interface ChartPoint {
  x: number;
  y: number;
  sourceRowIndex: number;
  raw: ParsedCsvRow;
}

export interface ChartSeriesData {
  id: string;
  name: string;
  smallGroupIndex: number;
  points: ChartPoint[];
}

export interface ChartGroupData {
  id: string;
  deviceValue: string;
  bigGroupIndex: number;
  title: string;
  series: ChartSeriesData[];
}

export interface BuildChartResult {
  groups: ChartGroupData[];
  validRows: number;
  skippedRows: number;
  errors: CsvParseError[];
}
