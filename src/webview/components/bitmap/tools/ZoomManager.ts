/**
 * 缩放管理，边界 2-50px
 */

import type { BitmapGridEngine } from '../core/BitmapGridEngine';

/**
 * 缩放管理器类
 */
export class ZoomManager {
  private engine: BitmapGridEngine;
  private minCellSize: number;
  private maxCellSize: number;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    const config = engine.getConfig();
    this.minCellSize = config.minCellSize || 2;
    this.maxCellSize = config.maxCellSize || 50;
  }

  /**
   * 以锚点为中心缩放
   */
  zoomAt(delta: number, anchorX: number, anchorY: number): void {
    const currentSize = this.engine.getZoomLevel();
    const newSize = Math.max(this.minCellSize, Math.min(currentSize + delta, this.maxCellSize));

    if (newSize === currentSize) return;

    // 计算缩放后的滚动位置，保持锚点位置不变
    const scrollState = this.engine.getScrollState();
    const ratio = newSize / currentSize;

    const newScrollX = anchorX + (scrollState.scrollX - anchorX) * ratio;
    const newScrollY = anchorY + (scrollState.scrollY - anchorY) * ratio;

    this.engine.setCellSize(newSize);
    this.engine.scrollTo(newScrollX, newScrollY);
  }

  /**
   * 设置格子尺寸
   */
  setCellSize(size: number): void {
    const clampedSize = Math.max(this.minCellSize, Math.min(size, this.maxCellSize));
    this.engine.setCellSize(clampedSize);
  }

  /**
   * 重置缩放
   */
  resetZoom(): void {
    const config = this.engine.getConfig();
    this.engine.setCellSize(config.initialCellSize || 10);
  }

  /**
   * 获取最小格子尺寸
   */
  get minSize(): number {
    return this.minCellSize;
  }

  /**
   * 获取最大格子尺寸
   */
  get maxSize(): number {
    return this.maxCellSize;
  }
}
