/**
 * 坐标定位选择
 */

import type { BitmapGridEngine } from '../core/BitmapGridEngine';
import type { CellData } from '../types';

/**
 * 选择管理器类
 */
export class SelectionManager {
  private engine: BitmapGridEngine;
  private selectedCell: CellData | null;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.selectedCell = null;
  }

  /**
   * 选择格子
   */
  selectCell(col: number, row: number): void {
    const dataManager = this.engine.getDataManager();
    const cell = dataManager.getCell(row, col);

    if (cell) {
      this.selectedCell = cell;
      const eventBus = this.engine.getEventBus();
      eventBus.emit('selection:change', cell);
    }
  }

  /**
   * 清除选择
   */
  clearSelection(): void {
    this.selectedCell = null;
    const eventBus = this.engine.getEventBus();
    eventBus.emit('selection:change', null);
  }

  /**
   * 检查格子是否被选中
   */
  isSelected(col: number, row: number): boolean {
    if (!this.selectedCell) return false;
    return this.selectedCell.col === col && this.selectedCell.row === row;
  }

  /**
   * 获取选中的格子
   */
  getSelectedCell(): CellData | null {
    return this.selectedCell;
  }
}
