import type Konva from 'konva';

/**
 * 基础网格渲染接口
 * 定义二维矩阵图的核心渲染契约
 */

// ========== 基础类型 ==========

export interface GridConfig {
  /** 格子最小尺寸（像素） */
  minCellSize: number;
  /** 格子最大尺寸（像素） */
  maxCellSize: number;
  /** 默认格子尺寸（像素） */
  defaultCellSize: number;
}

export interface MatrixData<T> {
  /** 总行数 */
  rows: number;
  /** 总列数 */
  cols: number;
  /** 单元格数据数组 */
  cells: T[];
  /** 从数组索引计算行号（可选，默认按顺序排列） */
  getRowIndex?: (cell: T, index: number) => number;
  /** 从数组索引计算列号（可选，默认按顺序排列） */
  getColIndex?: (cell: T, index: number) => number;
}

export interface CellCoord {
  /** 行号（0-based） */
  row: number;
  /** 列号（0-based） */
  col: number;
}

export interface CellRenderContext<T> {
  /** 单元格数据 */
  cell: T | null;
  /** 行号 */
  row: number;
  /** 列号 */
  col: number;
  /** X坐标（像素） */
  x: number;
  /** Y坐标（像素） */
  y: number;
  /** 宽度（像素） */
  width: number;
  /** 高度（像素） */
  height: number;
  /** 是否被选中 */
  isSelected: boolean;
  /** 是否被悬停 */
  isHovered: boolean;
}

export interface VisibleRange {
  /** 起始行 */
  startRow: number;
  /** 结束行（不包含） */
  endRow: number;
  /** 起始列 */
  startCol: number;
  /** 结束列（不包含） */
  endCol: number;
}

// ========== 渲染接口 ==========

export interface IGridRenderer<T> {
  /** 网格配置 */
  readonly config: GridConfig;
  
  /** 数据源 */
  data: MatrixData<T>;
  
  /**
   * 初始化渲染器
   * @param container HTML容器元素
   */
  initialize(container: HTMLDivElement): void;
  
  /**
   * 销毁渲染器，清理资源
   */
  destroy(): void;
  
  /**
   * 重新渲染整个网格
   */
  render(): void;
  
  /**
   * 获取单元格颜色
   * @param cell 单元格数据
   * @param row 行号
   * @param col 列号
   * @returns CSS颜色值
   */
  getCellColor(cell: T | null, row: number, col: number): string;
  
  /**
   * 创建单元格形状
   * @param context 渲染上下文
   * @returns Konva.Shape实例
   */
  createCellShape(context: CellRenderContext<T>): Konva.Shape;
  
  /**
   * 获取单元格上下文信息
   * @param row 行号
   * @param col 列号
   * @param hovered 是否悬停
   * @returns 渲染上下文
   */
  getCellContext(row: number, col: number, hovered: boolean): CellRenderContext<T>;
  
  /**
   * 计算可见区域范围
   * @returns 可见的行列范围
   */
  calculateVisibleRange(): VisibleRange;
  
  /**
   * 更新数据源并重新渲染
   * @param data 新的数据源
   */
  setData(data: MatrixData<T>): void;
  
  /**
   * 生命周期钩子：渲染前
   */
  onBeforeRender?(): void;
  
  /**
   * 生命周期钩子：渲染后
   */
  onAfterRender?(): void;
}
