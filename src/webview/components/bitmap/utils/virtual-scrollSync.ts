/**
 * 双向滚动条↔虚拟滚动同步
 */

import type { VisibleRange, ScrollbarState, ScrollState } from '../types';
import { BITMAP_WIDTH } from '../constants';

/**
 * 虚拟滚动同步类
 */
export class VirtualScrollSync {
  private viewportWidth: number;
  private viewportHeight: number;
  private cellSize: number;
  private totalRows: number;
  private totalCols: number;

  constructor(totalRows: number, totalCols: number, cellSize: number = 10) {
    this.viewportWidth = BITMAP_WIDTH;
    this.viewportHeight = 0;
    this.cellSize = cellSize;
    this.totalRows = totalRows;
    this.totalCols = totalCols;
  }

  /**
   * 更新视口尺寸
   */
  updateViewport(_width: number, height: number): void {
    this.viewportWidth = BITMAP_WIDTH;
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

    // 如果数据小于视口，滑块占满整个轨道
    const sliderWidth = totalWidth <= this.viewportWidth
      ? trackWidth
      : Math.max((this.viewportWidth / totalWidth) * trackWidth, 20);
    const sliderHeight = totalHeight <= this.viewportHeight
      ? trackHeight
      : Math.max((this.viewportHeight / totalHeight) * trackHeight, 20);

    const maxSliderX = trackWidth - sliderWidth;
    const maxSliderY = trackHeight - sliderHeight;

    // 如果数据小于视口，滑块位置为0
    const sliderX = totalWidth <= this.viewportWidth
      ? 0
      : (scrollX / (totalWidth - this.viewportWidth)) * maxSliderX;
    const sliderY = totalHeight <= this.viewportHeight
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

    // 计算滑块尺寸
    const sliderWidth = Math.max(
      (this.viewportWidth / totalWidth) * trackWidth,
      20
    );
    const sliderHeight = Math.max(
      (this.viewportHeight / totalHeight) * trackHeight,
      20
    );

    // 计算滑块最大可移动范围
    const maxSliderX = trackWidth - sliderWidth;
    const maxSliderY = trackHeight - sliderHeight;

    // 计算滚动偏移
    let scrollX = 0;
    let scrollY = 0;

    // X轴滚动
    if (totalWidth > this.viewportWidth && maxSliderX > 0) {
      scrollX = (sliderX / maxSliderX) * (totalWidth - this.viewportWidth);
    }

    // Y轴滚动
    if (totalHeight > this.viewportHeight && maxSliderY > 0) {
      scrollY = (sliderY / maxSliderY) * (totalHeight - this.viewportHeight);
    }

    return {
      scrollX: Math.max(0, Math.min(scrollX, this.maxScrollX)),
      scrollY: Math.max(0, Math.min(scrollY, this.maxScrollY)),
    };
  }

  /**
   * 获取最大 X 轴滚动偏移
   */
  get maxScrollX(): number {
    const totalWidth = this.totalCols * this.cellSize;
    return Math.max(0, totalWidth - this.viewportWidth);
  }

  /**
   * 获取最大 Y 轴滚动偏移
   */
  get maxScrollY(): number {
    const totalHeight = this.totalRows * this.cellSize;
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
}
