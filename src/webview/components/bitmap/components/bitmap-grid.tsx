
import { useRef, forwardRef, useImperativeHandle } from 'react';
import { useBitmapGrid, UseBitmapGridParams } from '../renderer/hooks/use-bitmap-grid';
import type { CellData, ScrollState } from '../types';

export interface BitmapGridProps extends Omit<UseBitmapGridParams, 'containerId'> {
  className?: string;
  style?: React.CSSProperties;
}

export interface BitmapGridRef {
  /** 放大 */
  zoomIn: () => void;
  /** 缩小 */
  zoomOut: () => void;
  /** 重置缩放 */
  resetZoom: () => void;
  /** 滚动到指定位置 */
  scrollTo: (scrollX: number, scrollY: number) => void;
  /** 选择格子 */
  selectCell: (col: number, row: number) => void;
  /** 清除选择 */
  clearSelection: () => void;
  /** 定位并高亮格子 */
  locateAndHighlight: (col: number, row: number) => void;
  /** 获取缩放级别 */
  getZoomLevel: () => number;
  /** 获取滚动状态 */
  getScrollState: () => ScrollState;
  /** 获取选中的格子 */
  getSelectedCell: () => CellData | null;
}

/**
 * BitmapGrid 组件
 */
export const BitmapGrid = forwardRef<BitmapGridRef, BitmapGridProps>((props, ref) => {
  const { className, style, ...hookParams } = props;

  const containerIdRef = useRef(`bitmap-grid-${Math.random().toString(36).substr(2, 9)}`);
  const containerId = containerIdRef.current;

  const {
    containerRef,
    zoomIn,
    zoomOut,
    resetZoom,
    scrollTo,
    selectCell,
    clearSelection,
    locateAndHighlight,
    getZoomLevel,
    getScrollState,
    getSelectedCell,
  } = useBitmapGrid({ ...hookParams, containerId });

  // 暴露 ref API
  useImperativeHandle(
    ref,
    () => ({
      zoomIn,
      zoomOut,
      resetZoom,
      scrollTo,
      selectCell,
      clearSelection,
      locateAndHighlight,
      getZoomLevel,
      getScrollState,
      getSelectedCell,
    }),
    [
      zoomIn,
      zoomOut,
      resetZoom,
      scrollTo,
      selectCell,
      clearSelection,
      locateAndHighlight,
      getZoomLevel,
      getScrollState,
      getSelectedCell,
    ]
  );

  return (
    <div
      id={containerId}
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        background: '#efeff3',
        ...style,
      }}
    />
  );
});

BitmapGrid.displayName = 'BitmapGrid';
