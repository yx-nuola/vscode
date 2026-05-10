import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import type {
  BitmapCell,
  BitmapDatasetMeta,
  BitmapImportMode,
  BitmapTableResponse,
  BitmapUploadedFile,
  BitmapViewportRequest,
  BitmapViewportResponse,
} from '../../shared/bitmapProtocol';

interface RRAMRawData {
  rows?: number;
  cols?: number;
  cells?: RRAMRawCell[];
}

interface RRAMRawCell {
  bl: number;
  wl: number;
  vset: string | number;
  vreset: string | number;
  imeas: string | number;
  status: string;
}

interface ParsedFile {
  rows: number;
  cols: number;
  cells: BitmapCell[];
}

export class BitmapDataService {
  private uploadedFiles: BitmapUploadedFile[] = [];
  private cellMap = new Map<string, BitmapCell>();
  private tableCells: BitmapCell[] = [];
  private meta: BitmapDatasetMeta | null = null;

  async uploadFiles(): Promise<BitmapUploadedFile[]> {
    const uris = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: true,
      filters: {
        JSON: ['json'],
      },
      title: '选择 Bitmap JSON 数据文件',
    });

    if (!uris || uris.length === 0) {
      return this.listFiles();
    }

    const existing = new Set(this.uploadedFiles.map((file) => file.path));

    for (const uri of uris) {
      if (existing.has(uri.fsPath)) {
        continue;
      }

      const stat = await fs.stat(uri.fsPath);
      this.uploadedFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: path.basename(uri.fsPath),
        path: uri.fsPath,
        size: stat.size,
        uploadedAt: Date.now(),
      });
      existing.add(uri.fsPath);
    }

    return this.listFiles();
  }

  listFiles(): BitmapUploadedFile[] {
    return [...this.uploadedFiles];
  }

  getMeta(): BitmapDatasetMeta | null {
    return this.meta;
  }

  async parse(mode: BitmapImportMode, fileIds?: string[]): Promise<BitmapDatasetMeta> {
    const selectedFiles = this.resolveFiles(fileIds);
    if (selectedFiles.length === 0) {
      throw new Error('请先上传至少一个 JSON 数据文件');
    }

    const filesToParse = mode === 'overwrite' ? [selectedFiles[selectedFiles.length - 1]] : selectedFiles;

    if (mode === 'overwrite') {
      this.cellMap.clear();
    }

    let maxRow = -1;
    let maxCol = -1;

    if (mode === 'append' && this.meta) {
      maxRow = this.meta.rows - 1;
      maxCol = this.meta.cols - 1;
    }

    for (const file of filesToParse) {
      const parsed = await this.parseFile(file.path);
      maxRow = Math.max(maxRow, parsed.rows - 1);
      maxCol = Math.max(maxCol, parsed.cols - 1);

      for (const cell of parsed.cells) {
        maxRow = Math.max(maxRow, cell.row);
        maxCol = Math.max(maxCol, cell.col);
        this.cellMap.set(this.getCellKey(cell.row, cell.col), cell);
      }
    }

    this.tableCells = Array.from(this.cellMap.values()).sort((a, b) => {
      if (a.row !== b.row) {
        return a.row - b.row;
      }
      return a.col - b.col;
    });

    this.meta = {
      datasetId: `${Date.now()}`,
      rows: Math.max(0, maxRow + 1),
      cols: Math.max(0, maxCol + 1),
      cellCount: this.cellMap.size,
      mode,
      parsedAt: Date.now(),
      sourceFiles: filesToParse,
    };

    return this.meta;
  }

  getViewport(request: BitmapViewportRequest): BitmapViewportResponse {
    const meta = this.requireMeta();
    const startRow = Math.max(0, Math.min(request.startRow, meta.rows - 1));
    const endRow = Math.max(startRow, Math.min(request.endRow, meta.rows - 1));
    const startCol = Math.max(0, Math.min(request.startCol, meta.cols - 1));
    const endCol = Math.max(startCol, Math.min(request.endCol, meta.cols - 1));
    const cells: BitmapCell[] = [];

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const cell = this.cellMap.get(this.getCellKey(row, col));
        if (cell) {
          cells.push(cell);
        }
      }
    }

    return {
      meta,
      rows: this.createRange(startRow, endRow),
      cols: this.createRange(startCol, endCol),
      cells,
    };
  }

  getTable(start: number, count: number): BitmapTableResponse {
    const meta = this.requireMeta();
    const safeStart = Math.max(0, Math.min(start, this.tableCells.length));
    const safeCount = Math.max(0, count);

    return {
      meta,
      start: safeStart,
      total: this.tableCells.length,
      cells: this.tableCells.slice(safeStart, safeStart + safeCount),
    };
  }

  private resolveFiles(fileIds?: string[]): BitmapUploadedFile[] {
    if (!fileIds || fileIds.length === 0) {
      return this.uploadedFiles;
    }

    const idSet = new Set(fileIds);
    return this.uploadedFiles.filter((file) => idSet.has(file.id));
  }

  private async parseFile(filePath: string): Promise<ParsedFile> {
    const text = await fs.readFile(filePath, 'utf-8');
    const raw = JSON.parse(text) as RRAMRawData;

    if (!Array.isArray(raw.cells)) {
      throw new Error(`文件格式不正确: ${path.basename(filePath)}`);
    }

    let maxRow = typeof raw.rows === 'number' ? raw.rows - 1 : -1;
    let maxCol = typeof raw.cols === 'number' ? raw.cols - 1 : -1;
    const cells: BitmapCell[] = [];

    for (const rawCell of raw.cells) {
      if (typeof rawCell.bl !== 'number' || typeof rawCell.wl !== 'number') {
        continue;
      }

      const row = rawCell.wl;
      const col = rawCell.bl;
      maxRow = Math.max(maxRow, row);
      maxCol = Math.max(maxCol, col);
      cells.push({
        row,
        col,
        value: Number.parseFloat(String(rawCell.imeas)),
        metadata: {
          bl: rawCell.bl,
          wl: rawCell.wl,
          vset: String(rawCell.vset),
          vreset: String(rawCell.vreset),
          imeas: String(rawCell.imeas),
          status: rawCell.status,
        },
      });
    }

    return {
      rows: Math.max(0, maxRow + 1),
      cols: Math.max(0, maxCol + 1),
      cells,
    };
  }

  private requireMeta(): BitmapDatasetMeta {
    if (!this.meta) {
      throw new Error('还没有解析 Bitmap 数据');
    }
    return this.meta;
  }

  private getCellKey(row: number, col: number): string {
    return `${row}:${col}`;
  }

  private createRange(start: number, end: number): number[] {
    const result: number[] = [];
    for (let value = start; value <= end; value++) {
      result.push(value);
    }
    return result;
  }
}
