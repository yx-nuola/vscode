// ========== 旧架构导出（保持兼容）==========
export { BitmapEngine } from './BitmapEngine';
export type { BitmapEngineRef } from './types';

// ========== 新架构导出（推荐使用）==========
export * from './interfaces';
export { KonvaGridBase } from './KonvaGridBase';

// ========== 类型导出 ==========
export type {
  GridConfig,
  MatrixData,
  CellCoord,
  CellRenderContext,
  VisibleRange,
} from './interfaces/IGridRenderer';

export type {
  AxisConfig,
  AxisTick,
  VisibleTicks,
} from './interfaces/IAxisRenderer';

export type {
  ViewState,
  ZoomConfig,
} from './interfaces/IZoomable';

export type {
  ColorRange,
  ColorConfig,
} from './interfaces/IColorConfigurable';

export type {
  ScrollConfig,
  ScrollPosition,
} from './interfaces/IScrollable';

export type {
  SelectionConfig,
  SelectionEvent,
} from './interfaces/ISelectable';
