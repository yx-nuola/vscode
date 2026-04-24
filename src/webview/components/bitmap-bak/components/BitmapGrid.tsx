import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import type { KonvaGridBase } from '../core/KonvaGridBase';
import type {
  CellCoord,
  ViewState,
  ColorRange,
  SelectionEvent,
  MatrixData,
} from '../core/interfaces';

/**
 * BitmapGrid 组件 Props
 */
export interface BitmapGridProps<T> {
  /** 渲染器实例（SimpleBitmapGrid 或 PerformanceBitmapGrid） */
  renderer: KonvaGridBase<T>;
  /** 数据 */
  data: MatrixData<T>;
  /** 容器类名 */
  className?: string;
  /** 容器样式 */
  style?: React.CSSProperties;
  /** 格子点击回调 */
  onCellClick?: (event: SelectionEvent<T>) => void;
  /** 格子悬停回调 */
  onCellHover?: (event: SelectionEvent<T>) => void;
  /** 缩放变化回调 */
  onZoomChange?: (zoom: number) => void;
  /** 滚动变化回调 */
  onScrollChange?: (offsetX: number, offsetY: number) => void;
  /** 自定义颜色区间 */
  colorRanges?: ColorRange[];
  /** 是否优先使用状态颜色 */
  useStatusColor?: boolean;
}

/**
 * BitmapGrid 组件 Ref 方法
 */
export interface BitmapGridRef {
  /** 放大 */
  zoomIn: () => void;
  /** 缩小 */
  zoomOut: () => void;
  /** 设置缩放 */
  setZoom: (zoom: number) => void;
  /** 适应屏幕 */
  fitToScreen: () => void;
  /** 重置视图 */
  resetView: () => void;
  /** 缩放到指定格子 */
  zoomToCell: (row: number, col: number, zoom?: number) => void;
  /** 选中格子 */
  selectCell: (row: number, col: number) => void;
  /** 清除选择 */
  clearSelection: () => void;
  /** 获取当前视图状态 */
  getViewState: () => ViewState;
  /** 滚动到指定位置 */
  scrollTo: (x: number, y: number) => void;
  /** 获取当前选中格子 */
  getSelectedCell: () => CellCoord | null;
  /** 设置颜色区间 */
  setColorRanges: (ranges: ColorRange[]) => void;
}

/**
 * BitmapGrid React 组件
 * 
 * 使用示例：
 * ```tsx
 * const gridRef = useRef<BitmapGridRef>(null);
 * const renderer = useMemo(() => new SimpleBitmapGrid(data), []);
 * 
 * return (
 *   <BitmapGrid
 *     ref={gridRef}
 *     renderer={renderer}
 *     data={data}
 *     onCellClick={(e) => console.log(e.coord)}
 *     colorRanges={[
 *       { min: 0, max: 5, color: '#FFA500' },
 *       { min: 5, max: 10, color: '#0000FF' },
 *     ]}
 *   />
 * );
 * ```
 */
export const BitmapGrid = forwardRef<BitmapGridRef, BitmapGridProps<any>>(
  function BitmapGridInner<T>(
    {
      renderer,
      data,
      className,
      style,
      onCellClick,
      onCellHover,
      onZoomChange,
      onScrollChange,
      colorRanges,
      useStatusColor,
    }: BitmapGridProps<T>,
    ref: React.Ref<BitmapGridRef>
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<KonvaGridBase<T>>(renderer);

    // 更新 renderer 引用
    useEffect(() => {
      rendererRef.current = renderer;
    }, [renderer]);

    // 初始化渲染器
    useEffect(() => {
      if (!containerRef.current) return;

      // 设置回调
      if (onCellClick) {
        renderer.onCellClick = onCellClick;
      }
      if (onCellHover) {
        renderer.onCellHover = onCellHover;
      }
      if (onZoomChange) {
        renderer.onZoomChange = onZoomChange;
      }
      if (onScrollChange) {
        renderer.onScrollChange = onScrollChange;
      }

      // 初始化
      renderer.initialize(containerRef.current);

      return () => {
        renderer.destroy();
      };
    }, [renderer]);

    // 数据更新
    useEffect(() => {
      rendererRef.current.setData(data);
    }, [data]);

    // 颜色配置更新
    useEffect(() => {
      if (colorRanges) {
        rendererRef.current.setColorRanges(colorRanges);
      }
    }, [colorRanges]);

    useEffect(() => {
      if (useStatusColor !== undefined) {
        rendererRef.current.setUseStatusColor(useStatusColor);
      }
    }, [useStatusColor]);

    // 暴露 Ref 方法
    useImperativeHandle(ref, () => ({
      zoomIn: () => rendererRef.current.zoomIn(),
      zoomOut: () => rendererRef.current.zoomOut(),
      setZoom: (zoom: number) => rendererRef.current.setZoom(zoom),
      fitToScreen: () => rendererRef.current.fitToScreen(),
      resetView: () => rendererRef.current.resetView(),
      zoomToCell: (row: number, col: number, zoom?: number) =>
        rendererRef.current.zoomToCell(row, col, zoom),
      selectCell: (row: number, col: number) =>
        rendererRef.current.selectCell(row, col),
      clearSelection: () => rendererRef.current.clearSelection(),
      getViewState: () => rendererRef.current.getViewState(),
      scrollTo: (x: number, y: number) => rendererRef.current.scrollTo(x, y),
      getSelectedCell: () => rendererRef.current.selectedCell,
      setColorRanges: (ranges: ColorRange[]) =>
        rendererRef.current.setColorRanges(ranges),
    }), []);

    return (
      <div
        ref={containerRef}
        className={className}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'auto',
          position: 'relative',
          ...style,
        }}
      />
    );
  }
);

export default BitmapGrid;
