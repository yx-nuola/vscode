/**
 * 按区域获取数据
 */

import type { CellData, MatrixData } from '../types';

/**
 * 数据管理器类
 */
export class DataManager {
  private cellsByRow: Map<number, Map<number, CellData>>;
  private totalRows: number;
  private totalCols: number;

  constructor() {
    this.cellsByRow = new Map();
    this.totalRows = 0;
    this.totalCols = 0;
  }

  /**
   * 设置数据
   */
  setData(data: MatrixData): void {
    this.cellsByRow.clear();
    this.totalRows = data.rows;
    this.totalCols = data.cols;

    for (const cell of data.cells) {
      let rowCells = this.cellsByRow.get(cell.row);
      if (!rowCells) {
        rowCells = new Map();
        this.cellsByRow.set(cell.row, rowCells);
      }
      rowCells.set(cell.col, cell);
    }
  }

  /**
   * 获取单个格子数据
   */
  getCell(row: number, col: number): CellData | undefined {
    return this.cellsByRow.get(row)?.get(col);
  }

  /**
   * 按区域获取数据
   */
  getDataByArea(startRow: number, endRow: number, startCol: number, endCol: number): CellData[] {
    const result: CellData[] = [];

    for (const [row, rowCells] of this.cellsByRow) {
      if (row < startRow || row > endRow) {
        continue;
      }
      for (const [col, cell] of rowCells) {
        if (col >= startCol && col <= endCol) {
          result.push(cell);
        }
      }
    }

    return result;
  }

  /**
   * 获取总行数
   */
  get rows(): number {
    return this.totalRows;
  }

  /**
   * 获取总列数
   */
  get cols(): number {
    return this.totalCols;
  }

  /**
   * 清除数据
   */
  clear(): void {
    this.cellsByRow.clear();
    this.totalRows = 0;
    this.totalCols = 0;
  }

  /**
   * 获取所有格子数据
   */
  getAllCells(): CellData[] {
    const cells: CellData[] = [];
    for (const rowCells of this.cellsByRow.values()) {
      cells.push(...rowCells.values());
    }
    return cells;
  }
}
