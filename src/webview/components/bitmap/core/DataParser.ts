/**
 * RRAM 测试数据解析器
 * 将 JSON 格式的测试数据转换为 MatrixData 格式
 */

import type { MatrixData, CellData } from '../types';

/**
 * RRAM 测试数据原始格式
 */
export interface RRAMTestData {
  rows: number;
  cols: number;
  metadata: {
    total: number;
    date: string;
    mode: string;
  };
  cells: Array<{
    bl: number;      // 位线（行）
    wl: number;      // 字线（列）
    vset: string;    // 设置电压
    vreset: string;  // 复位电压
    imeas: string;   // 测量电流
    status: string;  // 状态（pass/fail）
  }>;
}

/**
 * 数据导入模式
 */
export type ImportMode = 'overwrite' | 'append';

/**
 * 数据解析器类
 */
export class DataParser {
  /**
   * 解析 RRAM 测试数据
   */
  static parseRRAMData(data: RRAMTestData): MatrixData {
    const cells: CellData[] = data.cells.map((cell) => ({
      row: cell.bl,      // bl → row
      col: cell.wl,      // wl → col
      value: parseFloat(cell.imeas),  // 使用 imeas 作为颜色映射值
      metadata: {
        vset: cell.vset,
        vreset: cell.vreset,
        imeas: cell.imeas,
        status: cell.status,
      },
    }));

    return {
      rows: data.rows,
      cols: data.cols,
      cells,
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

    // 添加新数据（覆盖重复的）
    for (const cell of newData.cells) {
      const key = `${cell.row},${cell.col}`;
      cellMap.set(key, cell);
    }

    // 计算新的行列数
    const maxRow = Math.max(
      existingData.rows,
      ...newData.cells.map((c) => c.row)
    );
    const maxCol = Math.max(
      existingData.cols,
      ...newData.cells.map((c) => c.col)
    );

    return {
      rows: maxRow + 1,
      cols: maxCol + 1,
      cells: Array.from(cellMap.values()),
    };
  }

  /**
   * 解析 JSON 字符串
   */
  static parseJSON(jsonString: string): MatrixData {
    try {
      const data = JSON.parse(jsonString) as RRAMTestData;
      return this.parseRRAMData(data);
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 验证数据格式
   */
  static validateData(data: unknown): data is RRAMTestData {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const rramData = data as RRAMTestData;

    return (
      typeof rramData.rows === 'number' &&
      typeof rramData.cols === 'number' &&
      typeof rramData.metadata === 'object' &&
      Array.isArray(rramData.cells) &&
      rramData.cells.every(
        (cell) =>
          typeof cell.bl === 'number' &&
          typeof cell.wl === 'number' &&
          typeof cell.vset === 'string' &&
          typeof cell.vreset === 'string' &&
          typeof cell.imeas === 'string' &&
          typeof cell.status === 'string'
      )
    );
  }
}
