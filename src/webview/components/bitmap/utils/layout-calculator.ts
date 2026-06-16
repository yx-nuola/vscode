/**
 * 统一布局计算
 */

import type { LayoutConfig, LayoutResult, Area } from '../types';

import {
  BITMAP_HEIGHT,
  BITMAP_WIDTH,
  DEFAULT_CELL_SIZE,
  DEFAULT_COLS,
  DEFAULT_ROWS,
} from '../constants';

const LAYOUT_EPSILON = 0.5;

export class LayoutCalculator {
  private config: LayoutConfig;
  private rows: number;
  private cols: number;
  private cellSize: number;

  constructor(config: LayoutConfig) {
    this.config = config;
    this.rows = DEFAULT_ROWS;
    this.cols = DEFAULT_COLS;
    this.cellSize = DEFAULT_CELL_SIZE;
  }

  /**
   * 计算各区域位置
   */
  calculate(containerWidth: number, containerHeight: number): LayoutResult {
    const { axisSize, scrollbarSize, spacing } = this.config;
    const availableCellWidth = Math.max(
      0,
      containerWidth - axisSize - spacing * 2 - scrollbarSize
    );
    const availableCellHeight = Math.max(
      0,
      containerHeight - axisSize - spacing * 2 - scrollbarSize
    );
    const useIdealViewport = this.rows <= DEFAULT_ROWS && this.cols <= DEFAULT_COLS;
    const cellWidth = useIdealViewport
      ? this.getIdealViewportSize(availableCellWidth, BITMAP_WIDTH)
      : availableCellWidth;
    const cellHeight = useIdealViewport
      ? this.getIdealViewportSize(availableCellHeight, BITMAP_HEIGHT)
      : availableCellHeight;


    // 小数据以 896x896 为理想视口，大数据使用容器中的全部可用空间。
    const cellArea: Area = {
      x: axisSize + spacing,
      y: axisSize + spacing,
      width: cellWidth,
      height: cellHeight,
    };

    // X 轴区域（工具栏下方，Y 轴右侧）
    const xAxis: Area = {
      x: axisSize + spacing,
      y: 0,
      width: cellArea.width,
      height: axisSize,
    };

    // Y 轴区域（工具栏下方，左侧）
    const yAxis: Area = {
      x: 0,
      y: axisSize + spacing,
      width: axisSize,
      height: cellArea.height,
    };

    // 横向滚动条区域（格子区域下方）
    const horizontalScrollbar: Area = {
      x: axisSize + spacing,
      y: axisSize + spacing + cellArea.height + spacing,
      width: cellArea.width,
      height: scrollbarSize,
    };

    // 纵向滚动条区域（格子区域右侧）
    const verticalScrollbar: Area = {
      x: axisSize + spacing + cellArea.width + spacing,
      y: axisSize + spacing,
      width: scrollbarSize,
      height: cellArea.height,
    };

    return {
      // toolbar,
      xAxis,
      yAxis,
      cellArea,
      horizontalScrollbar,
      verticalScrollbar,
    };
  }

  /**
   * 更新布局配置
   */
  updateConfig(config: Partial<LayoutConfig>): void {
    this.config = { ...this.config, ...config };
  }

  updateContentSize(rows: number, cols: number, cellSize: number): void {
    this.rows = Math.max(rows, DEFAULT_ROWS);
    this.cols = Math.max(cols, DEFAULT_COLS);
    this.cellSize = cellSize;
  }

  /**
   * 获取当前布局配置
   */
  getConfig(): LayoutConfig {
    return { ...this.config };
  }

  private getIdealViewportSize(
    availableSize: number,
    idealSize: number
  ): number {
    if (availableSize >= idealSize - LAYOUT_EPSILON) {
      return idealSize;
    }

    return availableSize;
  }
}
