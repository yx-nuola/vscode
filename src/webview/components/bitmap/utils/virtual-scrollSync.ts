/**
 * 双向滚动条↔虚拟滚动同步
 */

import type { VisibleRange, ScrollbarState, ScrollState } from '../types';

/**
 * 虚拟滚动同步类
 */
export class VirtualScrollSync {
  private static readonly MIN_SLIDER_SIZE = 20;
  private static readonly SIZE_EPSILON = 0.5;

  private viewportWidth: number;
  private viewportHeight: number;
  private cellSize: number;
  private totalRows: number;
  private totalCols: number;

  constructor(totalRows: number, totalCols: number, cellSize: number = 10) {
    this.viewportWidth = totalCols * cellSize;
    this.viewportHeight = 0;
    this.cellSize = cellSize;
    this.totalRows = totalRows;
    this.totalCols = totalCols;
  }

  /**
   * 更新视口尺寸
   */
  updateViewport(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  /**
   * 更新格子尺寸
   */
  updateCellSize(cellSize: number): void {
    this.cellSize = cellSize;
  }

  /**
   * 更新数据尺寸
   */
  updateDataSize(rows: number, cols: number): void {
    this.totalRows = rows;
    this.totalCols = cols;
  }

  /**
   * 计算当前可视格子范围
   */
  getVisibleRange(scrollX: number, scrollY: number): VisibleRange {
    const startCol = Math.floor(scrollX / this.cellSize);
    const endCol = Math.min(
      Math.ceil((scrollX + this.viewportWidth) / this.cellSize),
      this.totalCols - 1
    );
    const startRow = Math.floor(scrollY / this.cellSize);
    const endRow = Math.min(
      Math.ceil((scrollY + this.viewportHeight) / this.cellSize),
      this.totalRows - 1
    );

    return {
      startCol: Math.max(0, startCol),
      endCol: Math.max(startCol, Math.min(endCol, this.totalCols - 1)),
      startRow: Math.max(0, startRow),
      endRow: Math.max(startRow, Math.min(endRow, this.totalRows - 1)),
    };
  }

  /**
   * 计算滚动条滑块位置和尺寸
   */
  getScrollbarState(scrollX: number, scrollY: number, trackWidth: number, trackHeight: number): ScrollbarState {
    const totalWidth = this.totalCols * this.cellSize;
    const totalHeight = this.totalRows * this.cellSize;

    const sliderWidth = this.getSliderSize(
      this.viewportWidth,
      totalWidth,
      trackWidth
    );
    const sliderHeight = this.getSliderSize(
      this.viewportHeight,
      totalHeight,
      trackHeight
    );

    const maxSliderX = trackWidth - sliderWidth;
    const maxSliderY = trackHeight - sliderHeight;

    // 如果数据小于视口，滑块位置为0
    const sliderX = this.fitsViewport(totalWidth, this.viewportWidth)
      ? 0
      : (scrollX / (totalWidth - this.viewportWidth)) * maxSliderX;
    const sliderY = this.fitsViewport(totalHeight, this.viewportHeight)
      ? 0
      : (scrollY / (totalHeight - this.viewportHeight)) * maxSliderY;

    return {
      sliderX: Math.max(0, Math.min(sliderX, maxSliderX)),
      sliderY: Math.max(0, Math.min(sliderY, maxSliderY)),
      sliderWidth,
      sliderHeight,
    };
  }

  /**
   * 从滑块位置反算滚动偏移
   */
  getScrollFromSlider(sliderX: number, sliderY: number, trackWidth: number, trackHeight: number): ScrollState {
    const totalWidth = this.totalCols * this.cellSize;
    const totalHeight = this.totalRows * this.cellSize;

    const sliderWidth = this.getSliderSize(
      this.viewportWidth,
      totalWidth,
      trackWidth
    );
    const sliderHeight = this.getSliderSize(
      this.viewportHeight,
      totalHeight,
      trackHeight
    );

    // 计算滑块最大可移动范围
    const maxSliderX = trackWidth - sliderWidth;
    const maxSliderY = trackHeight - sliderHeight;

    // 计算滚动偏移
    let scrollX = 0;
    let scrollY = 0;

    // X轴滚动
    if (!this.fitsViewport(totalWidth, this.viewportWidth) && maxSliderX > 0) {
      scrollX = (sliderX / maxSliderX) * (totalWidth - this.viewportWidth);
    }

    // Y轴滚动
    if (!this.fitsViewport(totalHeight, this.viewportHeight) && maxSliderY > 0) {
      scrollY = (sliderY / maxSliderY) * (totalHeight - this.viewportHeight);
    }

    return this.clampScrollState({ scrollX, scrollY });
  }

  getScrollXFromSlider(sliderX: number, trackWidth: number): number {
    const totalWidth = this.totalCols * this.cellSize;
    const sliderWidth = this.getSliderSize(
      this.viewportWidth,
      totalWidth,
      trackWidth
    );
    const maxSliderX = trackWidth - sliderWidth;

    if (this.fitsViewport(totalWidth, this.viewportWidth) || maxSliderX <= 0) {
      return 0;
    }

    return this.clampScrollState({
      scrollX: (sliderX / maxSliderX) * (totalWidth - this.viewportWidth),
      scrollY: 0,
    }).scrollX;
  }

  getScrollYFromSlider(sliderY: number, trackHeight: number): number {
    const totalHeight = this.totalRows * this.cellSize;
    const sliderHeight = this.getSliderSize(
      this.viewportHeight,
      totalHeight,
      trackHeight
    );
    const maxSliderY = trackHeight - sliderHeight;

    if (this.fitsViewport(totalHeight, this.viewportHeight) || maxSliderY <= 0) {
      return 0;
    }

    return this.clampScrollState({
      scrollX: 0,
      scrollY: (sliderY / maxSliderY) * (totalHeight - this.viewportHeight),
    }).scrollY;
  }

  clampScrollState(state: ScrollState): ScrollState {
    return {
      scrollX: Math.max(0, Math.min(state.scrollX, this.maxScrollX)),
      scrollY: Math.max(0, Math.min(state.scrollY, this.maxScrollY)),
    };
  }

  /**
   * 获取最大 X 轴滚动偏移
   */
  get maxScrollX(): number {
    const totalWidth = this.totalCols * this.cellSize;
    if (this.fitsViewport(totalWidth, this.viewportWidth)) {
      return 0;
    }
    return Math.max(0, totalWidth - this.viewportWidth);
  }

  /**
   * 获取最大 Y 轴滚动偏移
   */
  get maxScrollY(): number {
    const totalHeight = this.totalRows * this.cellSize;
    if (this.fitsViewport(totalHeight, this.viewportHeight)) {
      return 0;
    }
    return Math.max(0, totalHeight - this.viewportHeight);
  }

  /**
   * 获取当前格子尺寸
   */
  get currentCellSize(): number {
    return this.cellSize;
  }

  /**
   * 获取总列数
   */
  getTotalCols(): number {
    return this.totalCols;
  }

  /**
   * 获取总行数
   */
  getTotalRows(): number {
    return this.totalRows;
  }

  private getSliderSize(
    viewportSize: number,
    contentSize: number,
    trackSize: number
  ): number {
    if (trackSize <= 0) {
      return 0;
    }
    if (this.fitsViewport(contentSize, viewportSize) || contentSize <= 0) {
      return trackSize;
    }

    return Math.min(
      trackSize,
      Math.max(
        (viewportSize / contentSize) * trackSize,
        Math.min(VirtualScrollSync.MIN_SLIDER_SIZE, trackSize)
      )
    );
  }

  private fitsViewport(contentSize: number, viewportSize: number): boolean {
    return contentSize <= viewportSize + VirtualScrollSync.SIZE_EPSILON;
  }
}
