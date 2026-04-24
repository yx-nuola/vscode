// ========== 旧架构导出（保持兼容）==========
export { default as BitmapVisualization } from './index';
export { BitmapCanvas } from './components/BitmapCanvas';
export { BitmapDataTable } from './components/BitmapDataTable';
export { CellInfoPopup } from './components/CellInfoPopup';
export { ColorConfigPanel } from './components/ColorConfigPanel';
export { BitmapProvider, useBitmap, useBitmapData, useColorConfig, useViewState, useSelectedCell } from './context';
export type { 
  CellData, 
  BitmapData, 
  ColorRange as LegacyColorRange, 
  ColorConfig as LegacyColorConfig,
  ViewState as LegacyViewState 
} from './types';
export { parseFile, validateFile, getSupportedExtensions, isSupportedFile } from './parsers';

// ========== 新架构导出（推荐使用）==========
export * from './core';
export * from './renderers';
export { BitmapGrid } from './components/BitmapGrid';
export { BitmapGridDemo } from './components/BitmapGridDemo';

// ========== 新架构类型导出 ==========
export type { BitmapGridProps, BitmapGridRef } from './components/BitmapGrid';
export type { CellData as BitmapGridCellData } from './renderers/SimpleBitmapGrid';
