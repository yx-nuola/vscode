/**
 * React Hook
 */

import { useEffect, useRef, useCallback } from 'react';
import { BitmapGridEngine } from '../core/BitmapGridEngine';
import type { BitmapGridConfig, MatrixData, ColorRule, BitmapTheme, ScrollState, CellData } from '../types';

/**
 * Bitmap Grid Hook 参数
 */
export interface UseBitmapGridParams {
  /** 容器 ID */
  containerId: string;
  /** 配置 */
  config: BitmapGridConfig;
  /** 数据 */
  data?: MatrixData;
  /** 主题 */
  theme?: BitmapTheme;
  /** 颜色规则 */
  colorRules?: ColorRule[];
}

/**
 * Bitmap Grid Hook 返回值
 */
export interface UseBitmapGridReturn {
  /** 引擎实例 */
  engine: BitmapGridEngine | null;
  /** 容器引用 */
  containerRef: React.RefObject<HTMLDivElement>;
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
 * Bitmap Grid Hook
 */
export function useBitmapGrid(params: UseBitmapGridParams): UseBitmapGridReturn {
  const { containerId, config, data, theme, colorRules } = params;

  const engineRef = useRef<BitmapGridEngine | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 初始化引擎
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new BitmapGridEngine(config);
    engineRef.current = engine;

    engine.initialize(containerRef.current);

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [config]);

  // 更新数据
  useEffect(() => {
    if (data && engineRef.current) {
      engineRef.current.setData(data);
    }
  }, [data]);

  // 更新主题
  useEffect(() => {
    if (theme && engineRef.current) {
      engineRef.current.setTheme(theme);
    }
  }, [theme]);

  // 更新颜色规则
  useEffect(() => {
    if (colorRules && engineRef.current) {
      engineRef.current.setColorRules(colorRules);
    }
  }, [colorRules]);

  // 监听容器尺寸变化
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        engineRef.current?.resize(width, height);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const zoomIn = useCallback(() => {
    engineRef.current?.zoomIn();
  }, []);

  const zoomOut = useCallback(() => {
    engineRef.current?.zoomOut();
  }, []);

  const resetZoom = useCallback(() => {
    engineRef.current?.resetZoom();
  }, []);

  const scrollTo = useCallback((scrollX: number, scrollY: number) => {
    engineRef.current?.scrollTo(scrollX, scrollY);
  }, []);

  const selectCell = useCallback((col: number, row: number) => {
    engineRef.current?.selectCell(col, row);
  }, []);

  const clearSelection = useCallback(() => {
    engineRef.current?.clearSelection();
  }, []);

  const locateAndHighlight = useCallback((col: number, row: number) => {
    engineRef.current?.locateAndHighlight(col, row);
  }, []);

  const getZoomLevel = useCallback(() => {
    return engineRef.current?.getZoomLevel() || 10;
  }, []);

  const getScrollState = useCallback(() => {
    return engineRef.current?.getScrollState() || { scrollX: 0, scrollY: 0 };
  }, []);

  const getSelectedCell = useCallback(() => {
    return engineRef.current?.getSelectedCell() || null;
  }, []);

  return {
    engine: engineRef.current,
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
  };
}
