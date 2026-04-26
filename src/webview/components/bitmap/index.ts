/**
 * 公共 API 导出
 */

// 引擎
export { BitmapGridEngine } from './core/BitmapGridEngine';

// React 组件
export { BitmapGrid } from './components/BitmapGrid';
export type { BitmapGridProps, BitmapGridRef } from './components/BitmapGrid';

export { BitmapTableLayout } from './components/BitmapTableLayout';
export type { BitmapTableLayoutProps } from './components/BitmapTableLayout';

// Hooks
export { useBitmapGrid } from './hooks/useBitmapGrid';
export type { UseBitmapGridParams, UseBitmapGridReturn } from './hooks/useBitmapGrid';

// 主题
export { LIGHT_THEME, DARK_THEME } from './theme/presets';

// 类型
export type {
  CellData,
  MatrixData,
  LayoutConfig,
  LayoutResult,
  Area,
  ColorRule,
  BitmapTheme,
  BitmapGridCallbacks,
  BitmapGridConfig,
  ScrollState,
  VisibleRange,
  ScrollbarState,
  BitmapEvents,
} from './types';
