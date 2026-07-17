/**
 * RRAM 测试数据解析器
 * 将 JSON 格式的测试数据转换为 MatrixData 格式
 */

import type { MatrixData, CellData, DataType } from '../types';

/**
 * 数据解析器类
 */
export class DataParser {
  /**
   * 解析 RRAM 测试数据
   */
  static parseRRAMData(data: DataType): MatrixData {
    const cellsData: CellData[] = [];
    let rows = typeof data.rows === 'number' ? Math.max(0, data.rows) : 0;
    let cols = typeof data.cols === 'number' ? Math.max(0, data.cols) : 0;

    for (const cell of data.cells) {
      rows = Math.max(cell.bl + 1, rows);
      cols = Math.max(cell.wl + 1, cols);
      cellsData.push({
        row: cell.bl,
        col: cell.wl,
        value: parseFloat(String(cell.imeas)),
        wl: cell.wl,
        bl: cell.bl,
        vset: String(cell.vset),
        vreset: String(cell.vreset),
        imeas: String(cell.imeas),
        status: cell.status,
      });
    }

    return {
      rows,
      cols,
      cells: cellsData,
    };
  }

  /**
   * 合并数据（追加模式）
   */
  static mergeData(existingData: MatrixData, newData: MatrixData): MatrixData {
    const cellMap = new Map<string, CellData>();

    for (const cell of existingData.cells) {
      const key = `${cell.row},${cell.col}`;
      cellMap.set(key, cell);
    }

    for (const cell of newData.cells) {
      const key = `${cell.row},${cell.col}`;
      cellMap.set(key, cell);
    }

    const mergedCells = Array.from(cellMap.values());
    const maxRow = mergedCells.reduce(
      (max, cell) => Math.max(max, cell.row + 1),
      existingData.rows
    );
    const maxCol = mergedCells.reduce(
      (max, cell) => Math.max(max, cell.col + 1),
      existingData.cols
    );

    return {
      rows: maxRow,
      cols: maxCol,
      cells: mergedCells,
    };
  }

  /**
   * 解析 JSON 字符串
   */
  static parseJSON(jsonString: string): MatrixData {
    try {
      const data = JSON.parse(jsonString) as DataType;
      return this.parseRRAMData(data);
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 验证数据格式
   */
  static validateData(data: unknown): data is DataType {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const rramData = data as DataType;

    return (
      Array.isArray(rramData.cells) &&
      rramData.cells.every(
        (cell) =>
          typeof cell.wl === 'number' &&
          typeof cell.bl === 'number' &&
          (typeof cell.vset === 'string' || typeof cell.vset === 'number') &&
          (typeof cell.vreset === 'string' || typeof cell.vreset === 'number') &&
          (typeof cell.imeas === 'string' || typeof cell.imeas === 'number') &&
          typeof cell.status === 'string'
      )
    );
  }
}
