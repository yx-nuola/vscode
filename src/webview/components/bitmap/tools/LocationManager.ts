/**
 * 定位到格子，确保可见
 */

import type { BitmapGridEngine } from '../core/BitmapGridEngine';

/**
 * 定位管理器类
 */
export class LocationManager {
  private engine: BitmapGridEngine;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
  }

  /**
   * 定位到格子，确保目标格子完整显示在可视区域内
   */
  locateToCell(col: number, row: number): void {
    const virtualScrollSync = this.engine.getVirtualScrollSync();
    const cellSize = virtualScrollSync.currentCellSize;

    const dataManager = this.engine.getDataManager();
    const totalCols = dataManager.cols;
    const totalRows = dataManager.rows;

    // 边界检查
    if (col < 0 || col >= totalCols || row < 0 || row >= totalRows) {
      return;
    }

    const scrollState = this.engine.getScrollState();

    // 计算目标格子的位置
    const targetX = col * cellSize;
    const targetY = row * cellSize;

    // 获取视口尺寸
    const layoutCalculator = this.engine.getLayoutCalculator();
    const config = layoutCalculator.getConfig();
    const viewportWidth = config.axisSize + config.spacing + config.scrollbarSize + config.spacing;
    const viewportHeight = config.toolbarHeight + config.spacing + config.axisSize + config.spacing + config.scrollbarSize + config.spacing;

    // 计算需要的滚动位置，确保目标格子完整显示
    let newScrollX = scrollState.scrollX;
    let newScrollY = scrollState.scrollY;

    // X 轴定位
    if (targetX < scrollState.scrollX) {
      newScrollX = targetX;
    } else if (targetX + cellSize > scrollState.scrollX + viewportWidth) {
      newScrollX = targetX + cellSize - viewportWidth;
    }

    // Y 轴定位
    if (targetY < scrollState.scrollY) {
      newScrollY = targetY;
    } else if (targetY + cellSize > scrollState.scrollY + viewportHeight) {
      newScrollY = targetY + cellSize - viewportHeight;
    }

    // 钳制边界
    const maxScrollX = virtualScrollSync.maxScrollX;
    const maxScrollY = virtualScrollSync.maxScrollY;

    newScrollX = Math.max(0, Math.min(newScrollX, maxScrollX));
    newScrollY = Math.max(0, Math.min(newScrollY, maxScrollY));

    this.engine.scrollTo(newScrollX, newScrollY);
  }
}
