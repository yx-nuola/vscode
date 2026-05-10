export type BitmapImportMode = 'overwrite' | 'append';

export const BitmapCommands = {
  UPLOAD_BITMAP_FILES: 'bitmap.uploadFiles',
  LIST_BITMAP_FILES: 'bitmap.listFiles',
  PARSE_BITMAP_DATA: 'bitmap.parseData',
  OPEN_BITMAP_EDITOR: 'bitmap.openEditor',
  REQUEST_BITMAP_VIEWPORT: 'bitmap.requestViewport',
  REQUEST_BITMAP_TABLE: 'bitmap.requestTable',
} as const;

export interface BitmapUploadedFile {
  id: string;
  name: string;
  path: string;
  size: number;
  uploadedAt: number;
}

export interface BitmapCell {
  row: number;
  col: number;
  value: number;
  metadata?: Record<string, unknown>;
}

export interface BitmapDatasetMeta {
  datasetId: string;
  rows: number;
  cols: number;
  cellCount: number;
  mode: BitmapImportMode;
  parsedAt: number;
  sourceFiles: BitmapUploadedFile[];
}

export interface BitmapViewportRequest {
  datasetId?: string;
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}

export interface BitmapViewportResponse {
  meta: BitmapDatasetMeta;
  rows: number[];
  cols: number[];
  cells: BitmapCell[];
}

export interface BitmapTableRequest {
  datasetId?: string;
  start: number;
  count: number;
}

export interface BitmapTableResponse {
  meta: BitmapDatasetMeta;
  start: number;
  total: number;
  cells: BitmapCell[];
}

export interface BitmapParseRequest {
  mode: BitmapImportMode;
  fileIds?: string[];
}

export interface BitmapParseResponse {
  meta: BitmapDatasetMeta;
}

export interface VSCodeMessage<T = unknown> {
  command: string;
  requestId?: string;
  payload?: T;
  error?: string;
}
