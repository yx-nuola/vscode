/**
 * 按区域获取数据
 */

import type { CellData, MatrixData } from '../types';

/**
 * 数据管理器类
 */
export class DataManager {
  private cellMap: Map<string, CellData>;
  private totalRows: number;
  private totalCols: number;

  constructor() {
    this.cellMap = new Map();
    this.totalRows = 0;
    this.totalCols = 0;
  }

  /**
   * 设置数据
   */
  setData(data: MatrixData): void {
    this.cellMap.clear();
    this.totalRows = data.rows;
    this.totalCols = data.cols;

    for (const cell of data.cells) {
      const key = `${cell.row},${cell.col}`;
      this.cellMap.set(key, cell);
    }
  }

  /**
   * 获取单个格子数据
   */
  getCell(row: number, col: number): CellData | undefined {
    const key = `${row},${col}`;
    return this.cellMap.get(key);
  }

  /**
   * 按区域获取数据
   */
  getDataByArea(startRow: number, endRow: number, startCol: number, endCol: number): CellData[] {
    const result: CellData[] = [];

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const cell = this.getCell(row, col);
        if (cell) {
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
    this.cellMap.clear();
    this.totalRows = 0;
    this.totalCols = 0;
  }

  /**
   * 获取所有格子数据
   */
  getAllCells(): CellData[] {
    return Array.from(this.cellMap.values());
  }
}
