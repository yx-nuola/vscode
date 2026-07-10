import type { BitmapGridEngine } from '../../utils/bitmap-gridEngine';

export class LocationManager {
  private engine: BitmapGridEngine;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
  }

  locateToCell(col: number, row: number): void {
    const virtualScrollSync = this.engine.getVirtualScrollSync();
    const cellSize = virtualScrollSync.currentCellSize;

    const dataManager = this.engine.getDataManager();
    const totalCols = dataManager.cols;
    const totalRows = dataManager.rows;

    if (col < 0 || col >= totalCols || row < 0 || row >= totalRows) {
      return;
    }

    const targetX = col * cellSize;
    const targetY = row * cellSize;

    const layout = this.engine.getLayout();
    const viewportWidth = layout.cellArea.width;
    const viewportHeight = layout.cellArea.height;

    const maxScrollX = virtualScrollSync.maxScrollX;
    const maxScrollY = virtualScrollSync.maxScrollY;
    const centeredScrollX = targetX + cellSize / 2 - viewportWidth / 2;
    const centeredScrollY = targetY + cellSize / 2 - viewportHeight / 2;
    const newScrollX = Math.max(0, Math.min(centeredScrollX, maxScrollX));
    const newScrollY = Math.max(0, Math.min(centeredScrollY, maxScrollY));

    this.engine.scrollTo(newScrollX, newScrollY);
  }

  /**
   * 仅在格子超出视口时滚动最小距离，使其完整可见。
   */
  ensureCellVisible(col: number, row: number): void {
    const virtualScrollSync = this.engine.getVirtualScrollSync();
    const totalCols = virtualScrollSync.getTotalCols();
    const totalRows = virtualScrollSync.getTotalRows();

    if (col < 0 || col >= totalCols || row < 0 || row >= totalRows) {
      return;
    }

    const cellSize = virtualScrollSync.currentCellSize;
    const cellLeft = col * cellSize;
    const cellRight = cellLeft + cellSize;
    const cellTop = row * cellSize;
    const cellBottom = cellTop + cellSize;
    const { scrollX, scrollY } = this.engine.getScrollState();
    const { cellArea } = this.engine.getLayout();

    let nextScrollX = scrollX;
    let nextScrollY = scrollY;

    if (cellLeft < scrollX) {
      nextScrollX = cellLeft;
    } else if (cellRight > scrollX + cellArea.width) {
      nextScrollX = cellRight - cellArea.width;
    }

    if (cellTop < scrollY) {
      nextScrollY = cellTop;
    } else if (cellBottom > scrollY + cellArea.height) {
      nextScrollY = cellBottom - cellArea.height;
    }

    if (nextScrollX !== scrollX || nextScrollY !== scrollY) {
      this.engine.scrollTo(nextScrollX, nextScrollY);
    }
  }
}
