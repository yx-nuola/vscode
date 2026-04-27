/**
 * 统一布局计算
 */

import type { LayoutConfig, LayoutResult, Area } from '../types';

/**
 * 布局计算器类
 */
export class LayoutCalculator {
  private config: LayoutConfig;

  constructor(config: LayoutConfig) {
    this.config = config;
  }

  /**
   * 计算各区域位置
   */
  calculate(containerWidth: number, containerHeight: number): LayoutResult {
    const { toolbarHeight, axisSize, scrollbarSize, spacing } = this.config;

    // 工具栏区域（顶部，全宽）
    const toolbar: Area = {
      x: 0,
      y: 0,
      width: containerWidth,
      height: toolbarHeight,
    };

    // X 轴区域（工具栏下方，Y 轴右侧）
    const xAxis: Area = {
      x: axisSize + spacing,
      y: toolbarHeight + spacing,
      width: containerWidth - axisSize - spacing - scrollbarSize - spacing,
      height: axisSize,
    };

    // Y 轴区域（工具栏下方，左侧）
    const yAxis: Area = {
      x: 0,
      y: toolbarHeight + spacing + axisSize + spacing,
      width: axisSize,
      height: containerHeight - toolbarHeight - spacing - axisSize - spacing - scrollbarSize - spacing,
    };

    // 格子区域（X 轴下方，Y 轴右侧）
    const cellArea: Area = {
      x: axisSize + spacing,
      y: toolbarHeight + spacing + axisSize + spacing,
      width: containerWidth - axisSize - spacing - scrollbarSize - spacing,
      height: containerHeight - toolbarHeight - spacing - axisSize - spacing - scrollbarSize - spacing,
    };

    // 横向滚动条区域（格子区域下方）
    const horizontalScrollbar: Area = {
      x: axisSize + spacing,
      y: toolbarHeight + spacing + axisSize + spacing + cellArea.height + spacing,
      width: containerWidth - axisSize - spacing - scrollbarSize - spacing,
      height: scrollbarSize,
    };

    // 纵向滚动条区域（格子区域右侧）
    const verticalScrollbar: Area = {
      x: axisSize + spacing + cellArea.width + spacing,
      y: toolbarHeight + spacing + axisSize + spacing,
      width: scrollbarSize,
      height: containerHeight - toolbarHeight - spacing - axisSize - spacing - scrollbarSize - spacing,
    };

    return {
      toolbar,
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

  /**
   * 获取当前布局配置
   */
  getConfig(): LayoutConfig {
    return { ...this.config };
  }
}
