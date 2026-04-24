/**
 * 坐标轴渲染接口
 * 定义X轴/Y轴的渲染契约
 */

// ========== 坐标轴配置 ==========

export interface AxisConfig {
  /** 是否显示X轴 */
  showX: boolean;
  /** 是否显示Y轴 */
  showY: boolean;
  /** X轴标签（如"WL"） */
  xLabel?: string;
  /** Y轴标签（如"BL"） */
  yLabel?: string;
  /** X轴刻度格式化函数 */
  formatX?: (col: number) => string;
  /** Y轴刻度格式化函数 */
  formatY?: (row: number) => string;
  /** X轴刻度步长（固定值，不传则自适应） */
  stepX?: number;
  /** Y轴刻度步长（固定值，不传则自适应） */
  stepY?: number;
  /** X轴高度（像素） */
  axisHeight?: number;
  /** Y轴宽度（像素） */
  axisWidth?: number;
  /** 刻度颜色 */
  tickColor?: string;
  /** 标签颜色 */
  labelColor?: string;
  /** 背景色 */
  bgColor?: string;
  /** 字体大小 */
  fontSize?: number;
  /** 是否显示工具栏 */
  showToolbar?: boolean;
}

export interface AxisTick {
  /** 索引 */
  index: number;
  /** 显示文本 */
  label: string;
  /** 显示位置（像素） */
  position: number;
}

export interface VisibleTicks {
  /** X轴刻度 */
  xTicks: AxisTick[];
  /** Y轴刻度 */
  yTicks: AxisTick[];
  /** X轴步长 */
  xStep: number;
  /** Y轴步长 */
  yStep: number;
}

// ========== 坐标轴接口 ==========

export interface IAxisRenderer {
  /** 坐标轴配置 */
  readonly axisConfig: AxisConfig;
  
  /**
   * 渲染坐标轴
   * 包括X轴和Y轴的刻度线、标签
   */
  renderAxis(): void;
  
  /**
   * 计算可见区域的刻度
   * @returns 可见的刻度信息
   */
  calculateVisibleTicks(): VisibleTicks;
  
  /**
   * 获取X轴标签
   * @param col 列号
   * @returns 标签文本
   */
  getXAxisLabel(col: number): string;
  
  /**
   * 获取Y轴标签
   * @param row 行号
   * @returns 标签文本
   */
  getYAxisLabel(row: number): string;
  
  /**
   * 获取自适应刻度步长
   * @param pixelSize 当前格子像素大小
   * @param customStep 自定义步长
   * @returns 计算后的步长
   */
  getStepByZoom(pixelSize: number, customStep?: number): number;
  
  /**
   * 清除坐标轴渲染
   */
  clearAxis(): void;
}
