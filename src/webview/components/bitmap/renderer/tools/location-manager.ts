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
}
