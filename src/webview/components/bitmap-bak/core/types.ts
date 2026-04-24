import type { CSSProperties } from 'react';
import type Konva from 'konva';

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

export interface BitmapEngineRef {
	zoomIn: (step?: number) => void;
	zoomOut: (step?: number) => void;
	setZoom: (zoom: number) => void;
	resetView: () => void;
	fitToScreen: () => void;
	zoomToCell: (row: number, col: number, zoom?: number) => void;
	getViewState: () => ViewState;
	getStage: () => Konva.Stage | null;
}

export interface AxisConfig {
  showX?: boolean; // 是否显示X轴，默认true
  showY?: boolean; // 是否显示Y轴，默认true
  xLabel?: string; // X轴标签（如"WL"）
  yLabel?: string; // Y轴标签（如"BL"）
  formatX?: (col: number) => string; // X轴刻度格式化函数
  formatY?: (row: number) => string; // Y轴刻度格式化函数
  stepX?: number; // X轴刻度步长（固定值，不传则自适应）
  stepY?: number; // Y轴刻度步长（固定值，不传则自适应）
  axisHeight?: number; // X轴高度，默认36（包含工具栏）
  axisWidth?: number; // Y轴宽度，默认40
  tickColor?: string; // 刻度颜色，默认#666666
  labelColor?: string; // 标签颜色，默认#333333
  bgColor?: string; // 背景色，默认#f5f5f5
  fontSize?: number; // 字体大小，默认12
  showToolbar?: boolean; // 是否在X轴显示缩放工具栏，默认true
}

export interface BitmapEngineProps<T> {
  data: MatrixData<T>;
  className?: string;
  style?: CSSProperties;
  /** 格子基础边长下限（世界单位，未乘 zoom），默认 8 */
  minCellSize?: number;
  /** 格子基础边长上限，默认 32 */
  maxCellSize?: number;
  /**
   * 初始基础格子边长，会夹在 [minCellSize, maxCellSize] 内；不传则取 min(max(12, minCellSize), maxCellSize)
   */
  defaultCellSize?: number;
  getCellColor?: (cell: T | null, row: number, col: number) => string;
  onCellClick?: (ctx: CellRenderContext<T>, ev: MouseEvent) => void;
  onCellHover?: (ctx: CellRenderContext<T>, ev: MouseEvent) => void;
  selectedCell?: CellCoord | null;
  defaultSelectedCell?: CellCoord | null;
  onSelectedCellChange?: (cell: CellCoord | null) => void;
  viewState?: ViewState;
  defaultViewState?: ViewState;
  onViewStateChange?: (state: ViewState) => void;
  /** 坐标轴配置 */
  axisConfig?: AxisConfig;
}
