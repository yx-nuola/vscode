// ========== 核心渲染接口 ==========
export * from './IGridRenderer';
export * from './IAxisRenderer';
export * from './IZoomable';
export * from './IColorConfigurable';
export * from './IScrollable';
export * from './ISelectable';

// ========== 类型重新导出 ==========
export type {
  GridConfig,
  MatrixData,
  CellCoord,
  CellRenderContext,
  VisibleRange,
} from './IGridRenderer';

export type {
  AxisConfig,
  AxisTick,
  VisibleTicks,
} from './IAxisRenderer';

export type {
  ViewState,
  ZoomConfig,
} from './IZoomable';

export type {
  ColorRange,
  ColorConfig,
} from './IColorConfigurable';

export type {
  ScrollConfig,
  ScrollPosition,
} from './IScrollable';

export type {
  SelectionConfig,
  SelectionEvent,
} from './ISelectable';
