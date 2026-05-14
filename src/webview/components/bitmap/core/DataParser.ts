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
    console.log( '原始数据', data);
    const { cells } = data || [];
    const cellsData: CellData[] = [];
    let rows = 0;
    let cols = 0;
    for(let i = 0; i <= data.cells.length; i++){
      const cell: any = cells[i];
      if(!cell) continue;
      rows = Math.max(cell.bl, rows);
      cols = Math.max(cell.wl , cols);
      cellsData.push({
        row: cell.bl,      // bl → row（Y 轴）
        col: cell.wl,      // wl → col（X 轴）
        value: parseFloat(String(cell.imeas)),  // 使用 imeas 作为颜色映射值
        metadata: {
          wl: cell.wl,
          bl: cell.bl,
          vset: String(cell.vset),
          vreset: String(cell.vreset),
          imeas: String(cell.imeas),
          status: cell.status,
        },
      });
    };

    return  {
      rows: rows + 1,
      cols: cols + 1,
      cells:cellsData,
    };
  }

  /**
   * 合并数据（追加模式）
   */
  static mergeData(existingData: MatrixData, newData: MatrixData): MatrixData {
    const cellMap = new Map<string, CellData>();

    // 添加现有数据
    for (const cell of existingData.cells) {
      const key = `${cell.row},${cell.col}`;
      cellMap.set(key, cell);
    }

    let maxRow = existingData.rows;
    let maxCol = existingData.cols;

    // 添加新数据（覆盖重复的）
    for (const cell of newData.cells) {
      const key = `${cell.row},${cell.col}`;
      console.log('新追加的-----', cell);
      cellMap.set(key, cell);
      maxRow = Math.max(
        existingData.rows,
        cell.row + 1
      );
      maxCol = Math.max(
        existingData.cols,
        cell.col + 1
      );
    }

    return {
      rows: maxRow,
      cols: maxCol,
      cells: Array.from(cellMap.values()),
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
      typeof rramData.metadata === 'object' &&
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
