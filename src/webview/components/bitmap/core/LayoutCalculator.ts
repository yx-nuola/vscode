/**
 * 统一布局计算
 */

import type { LayoutConfig, LayoutResult, Area } from '../types';

import { BITMAP_WIDTH} from '../constants';

export class LayoutCalculator {
  private config: LayoutConfig;

  constructor(config: LayoutConfig) {
    this.config = config;
  }

  /**
   * 计算各区域位置
   */
  calculate(containerWidth: number, containerHeight: number): LayoutResult {
    const { axisSize, scrollbarSize, spacing } = this.config;

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
      width: BITMAP_WIDTH,
      height: containerHeight - axisSize - spacing - scrollbarSize - spacing,
    };

    // X 轴区域（工具栏下方，Y 轴右侧）
    const xAxis: Area = {
      x: axisSize + spacing,
      y: 0,
      width: BITMAP_WIDTH,
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
      width: BITMAP_WIDTH,
      height: scrollbarSize,
    };

    // 纵向滚动条区域（格子区域右侧）
    const verticalScrollbar: Area = {
      x: axisSize + spacing + BITMAP_WIDTH + spacing,
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

  /**
   * 获取当前布局配置
   */
  getConfig(): LayoutConfig {
    return { ...this.config };
  }
}
