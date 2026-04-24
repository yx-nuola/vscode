import type Konva from 'konva';

// ========== 类型定义 ==========

export interface GridConfig {
  minCellSize: number;
  maxCellSize: number;
  defaultCellSize: number;
}

export interface AxisConfig {
  showX: boolean;
  showY: boolean;
  xLabel?: string;
  yLabel?: string;
  formatX?: (col: number) => string;
  formatY?: (row: number) => string;
  stepX?: number;
  stepY?: number;
  axisHeight?: number;
  axisWidth?: number;
  tickColor?: string;
  labelColor?: string;
  bgColor?: string;
  fontSize?: number;
  showToolbar?: boolean;
}

export interface CellCoord {
  row: number;
  col: number;
}

export interface ViewState {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export interface MatrixData<T> {
  rows: number;
  cols: number;
  cells: T[];
  getRowIndex?: (cell: T, index: number) => number;
  getColIndex?: (cell: T, index: number) => number;
}

export interface CellRenderContext<T> {
  cell: T | null;
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isSelected: boolean;
  isHovered: boolean;
}

export interface VisibleRange {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}

// ========== 抽象类 ==========

export abstract class AbstractKonvaGrid<T> {
  // 必须提供的配置
  abstract readonly config: GridConfig;
  abstract readonly axisConfig: AxisConfig;
  
  // 数据
  abstract data: MatrixData<T>;
  
  // ========== 必须实现的抽象方法 ==========
  
  /**
   * 获取格子颜色
   * 每个业务场景的颜色逻辑不同，必须由子类实现
   */
  abstract getCellColor(cell: T | null, row: number, col: number): string;
  
  /**
   * 创建格子 Shape
   * 不同场景可能使用不同的 Shape 类型（Rect/Circle等）
   */
  abstract createCellShape(context: CellRenderContext<T>): Konva.Shape;
  
  /**
   * 获取 X 轴标签文本
   */
  abstract getXAxisLabel(col: number): string;
  
  /**
   * 获取 Y 轴标签文本
   */
  abstract getYAxisLabel(row: number): string;
  
  // ========== 可选的生命周期钩子 ==========
  
  /**
   * 渲染前钩子
   */
  protected onBeforeRender?(): void;
  
  /**
   * 渲染后钩子
   */
  protected onAfterRender?(): void;
  
  /**
   * 点击格子时的回调
   */
  protected onCellClick?(context: CellRenderContext<T>, event: MouseEvent): void;
  
  /**
   * 悬停格子时的回调
   */
  protected onCellHover?(context: CellRenderContext<T>, event: MouseEvent): void;
  
  /**
   * 缩放变化时的回调
   */
  protected onZoomChange?(zoom: number): void;
  
  /**
   * 滚动位置变化时的回调
   */
  protected onScrollChange?(offsetX: number, offsetY: number): void;
}
