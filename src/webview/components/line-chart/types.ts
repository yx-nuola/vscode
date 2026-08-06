export type DrawMode = 'merge' | 'split';

export interface LineChartFeedback {
  tone: 'success' | 'warning' | 'error';
  message: string;
}

export interface CsvColumn {
  rawName: string;
  displayName: string;
}

export type ParsedCsvRow = Record<string, string>;

export interface CsvParseError {
  message: string;
}

export interface ParsedCsvData {
  tableHeader: CsvColumn[];
  polylineData: ParsedCsvRow[];
}

export interface LineChartConfig {
  xColumn: string | null;
  yColumn: string;
  deviceColumn: string | null;
  groupColumns: string[];
  drawMode: DrawMode;
}

export interface ChartSeriesData {
  id: string;
  name: string;
  smallGroupIndex: number;
  points: [number, number, number][];
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
