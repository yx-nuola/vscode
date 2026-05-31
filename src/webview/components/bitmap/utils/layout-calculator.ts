/**
 * 统一布局计算
 */

import type { LayoutConfig, LayoutResult, Area } from '../types';

import { BITMAP_WIDTH, DEFAULT_CELL_SIZE, DEFAULT_COLS, DEFAULT_ROWS } from '../constants';

const AXIS_LABEL_OVERFLOW = 16;

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
    const baseMaxCellWidth = Math.max(
      0,
      Math.min(BITMAP_WIDTH, containerWidth - axisSize - spacing)
    );
    const baseMaxCellHeight = Math.max(
      0,
      containerHeight - axisSize - spacing
    );
    const contentWidth = this.cols * this.cellSize;
    const contentHeight = this.rows * this.cellSize;
    const hasHorizontalScrollbar = contentWidth > baseMaxCellWidth;
    const hasVerticalScrollbar = contentHeight > baseMaxCellHeight;
    const reserveHorizontalScrollbar = !hasVerticalScrollbar || hasHorizontalScrollbar;
    const maxCellWidth = Math.max(
      0,
      Math.min(
        BITMAP_WIDTH,
        containerWidth - axisSize - spacing - (hasVerticalScrollbar ? scrollbarSize + spacing : 0)
      )
    );
    const maxCellHeight = Math.max(
      0,
      containerHeight - axisSize - spacing - (reserveHorizontalScrollbar ? scrollbarSize + spacing : 0)
    );

    // 工具栏区域（顶部，全宽）- 现在外层处理，这里保留占位
    // const toolbar: Area = {
    //   x: 0,
    //   y: 0,
    //   width: containerWidth,
    //   height: 0,
    // };

    // 格子区域（固定宽度 896px，高度根据容器计算）
    const cellArea: Area = {
      x: axisSize + spacing,
      y: axisSize + spacing,
      width: Math.min(contentWidth, maxCellWidth),
      height: Math.min(contentHeight, maxCellHeight),
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
      y: axisSize + spacing + cellArea.height + (reserveHorizontalScrollbar ? spacing : 0),
      width: cellArea.width,
      height: reserveHorizontalScrollbar ? scrollbarSize : 0,
    };

    // 纵向滚动条区域（格子区域右侧）
    const verticalScrollbar: Area = {
      x: axisSize + spacing + cellArea.width + (hasVerticalScrollbar ? spacing : AXIS_LABEL_OVERFLOW),
      y: axisSize + spacing,
      width: hasVerticalScrollbar ? scrollbarSize : 0,
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
}
