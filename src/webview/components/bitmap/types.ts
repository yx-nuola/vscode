/**
 * Bitmap Grid 组件类型定义
 */

// ==================== 数据类型 ====================

/**
 * 单个格子数据
 */
export interface CellData {
  /** 行索引 */
  row: number;
  /** 列索引 */
  col: number;
  /** 值（用于颜色映射） */
  value: number;
  /** 额外数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 矩阵数据
 */
export interface MatrixData {
  /** 总行数 */
  rows: number;
  /** 总列数 */
  cols: number;
  /** 格子数据数组 */
  cells: CellData[];
}

// ==================== 布局类型 ====================

/**
 * 布局配置
 */
export interface LayoutConfig {
  /** 工具栏高度 */
  toolbarHeight: number;
  /** 坐标轴宽度/高度 */
  axisSize: number;
  /** 滚动条宽度/高度 */
  scrollbarSize: number;
  /** 区域间距 */
  spacing: number;
}

/**
 * 区域定义
 */
export interface Area {
  /** X 坐标 */
  x: number;
  /** Y 坐标 */
  y: number;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
}

/**
 * 布局计算结果
 */
export interface LayoutResult {
  /** 工具栏区域 */
  toolbar: Area;
  /** X 轴区域 */
  xAxis: Area;
  /** Y 轴区域 */
  yAxis: Area;
  /** 格子区域 */
  cellArea: Area;
  /** 横向滚动条区域 */
  horizontalScrollbar: Area;
  /** 纵向滚动条区域 */
  verticalScrollbar: Area;
}

// ==================== 主题类型 ====================

/**
 * 颜色映射规则
 */
export interface ColorRule {
  /** 最小值 */
  min: number;
  /** 最大值 */
  max: number;
  /** 颜色值 */
  color: string;
}

/**
 * 主题配置
 */
export interface BitmapTheme {
  /** 背景色 */
  backgroundColor: string;
  /** 坐标轴颜色 */
  axisColor: string;
  /** 坐标轴文字颜色 */
  axisTextColor: string;
  /** 滚动条轨道颜色 */
  scrollbarTrackColor: string;
  /** 滚动条滑块颜色 */
  scrollbarThumbColor: string;
  /** 高亮颜色 */
  highlightColor: string;
  /** 边框颜色 */
  borderColor: string;
  /** 默认格子颜色 */
  defaultCellColor: string;
}

// ==================== 配置类型 ====================

/**
 * 回调函数
 */
export interface BitmapGridCallbacks {
  /** 格子点击回调 */
  onCellClick?: (cell: CellData) => void;
  /** 格子悬停回调 */
  onCellHover?: (cell: CellData | null) => void;
  /** 选择变化回调 */
  onSelectionChange?: (cell: CellData | null) => void;
  /** 滚动变化回调 */
  onScrollChange?: (state: ScrollState) => void;
  /** 缩放变化回调 */
  onZoomChange?: (cellSize: number) => void;
}

/**
 * 组件配置
 */
export interface BitmapGridConfig {
  /** 布局配置 */
  layout: LayoutConfig;
  /** 主题 */
  theme: BitmapTheme;
  /** 颜色映射规则 */
  colorRules: ColorRule[];
  /** 回调函数 */
  callbacks?: BitmapGridCallbacks;
  /** 初始格子尺寸 */
  initialCellSize?: number;
  /** 最小格子尺寸 */
  minCellSize?: number;
  /** 最大格子尺寸 */
  maxCellSize?: number;
}

// ==================== 滚动类型 ====================

/**
 * 滚动状态
 */
export interface ScrollState {
  /** X 轴滚动偏移 */
  scrollX: number;
  /** Y 轴滚动偏移 */
  scrollY: number;
}

/**
 * 可见范围
 */
export interface VisibleRange {
  /** 起始行 */
  startRow: number;
  /** 结束行 */
  endRow: number;
  /** 起始列 */
  startCol: number;
  /** 结束列 */
  endCol: number;
}

/**
 * 滚动条状态
 */
export interface ScrollbarState {
  /** 滑块 X 坐标 */
  thumbX: number;
  /** 滑块 Y 坐标 */
  thumbY: number;
  /** 滑块宽度 */
  thumbWidth: number;
  /** 滑块高度 */
  thumbHeight: number;
}

// ==================== 事件类型 ====================

/**
 * 事件类型
 */
export interface BitmapEvents {
  /** 滚动变化事件 */
  'scroll:change': ScrollState;
  /** 横向滚动事件 */
  'scroll:horizontal': number;
  /** 纵向滚动事件 */
  'scroll:vertical': number;
  /** 缩放变化事件 */
  'zoom:change': number;
  /** 选择变化事件 */
  'selection:change': CellData | null;
  /** 格子点击事件 */
  'cell:click': CellData;
  /** 格子悬停事件 */
  'cell:hover': CellData | null;
  /** 定位事件 */
  'locate': { col: number; row: number };
  /** 高亮事件 */
  'highlight': { col: number; row: number } | null;
  /** 清除高亮事件 */
  'clear-highlight': void;
  /** 重置事件 */
  'reset': void;
  /** 数据变化事件 */
  'data:change': MatrixData;
}
