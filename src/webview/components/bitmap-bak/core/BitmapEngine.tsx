// import React, {
//   forwardRef,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
//   useImperativeHandle,
//   useCallback,
// } from 'react';
// import Konva from 'konva';
// import type {
//   BitmapEngineProps,
//   BitmapEngineRef,
//   CellCoord,
//   ViewState,
//   CellRenderContext,
//   AxisConfig,
// } from './types';
// import { Button, Tooltip } from '@arco-design/web-react';
// import {
//   IconZoomIn,
//   IconZoomOut,
//   IconRefresh,
//   IconFullscreen,
// } from '@arco-design/web-react/icon';

// const DEFAULT_VIEW: ViewState = { zoom: 1, offsetX: 0, offsetY: 0 };
// const MIN_ZOOM = 0.8; // 最小缩放0.8倍
// const MAX_ZOOM = 1.4; // 最大缩放1.4倍
// const ZOOM_STEP = 0.1; // 每次缩放步长0.1

// const DEFAULT_AXIS_CONFIG: AxisConfig = {
//   showX: true,
//   showY: true,
//   stepX: 4, // 默认X轴刻度间隔4
//   stepY: 4, // 默认Y轴刻度间隔4
//   axisHeight: 36, // 增加高度容纳按钮
//   axisWidth: 50,
//   tickColor: '#666666',
//   labelColor: '#333333',
//   bgColor: '#f5f5f5',
//   fontSize: 12,
//   showToolbar: true, // 默认显示工具栏
// };

// function clamp(v: number, min: number, max: number): number {
//   return Math.max(min, Math.min(max, v));
// }

// function clampBaseCellSize(value: number, minCellSize: number, maxCellSize: number): number {
//   return clamp(value, minCellSize, maxCellSize);
// }

// export const BitmapEngine = forwardRef(function BitmapEngineInner<T>(
//   props: BitmapEngineProps<T>,
//   ref: React.Ref<BitmapEngineRef>
// ) {
//   const {
//     data,
//     className,
//     style,
//     minCellSize: minCellSizeProp,
//     maxCellSize: maxCellSizeProp,
//     defaultCellSize: defaultCellSizeProp,
//     getCellColor,
//     onCellClick,
//     onCellHover,
//     selectedCell: selectedCellProp,
//     defaultSelectedCell = null,
//     onSelectedCellChange,
//     viewState: viewStateProp,
//     defaultViewState = DEFAULT_VIEW,
//     onViewStateChange,
//     axisConfig: axisConfigProp,
//   } = props;

//   const axisConfig = useMemo(() => ({ ...DEFAULT_AXIS_CONFIG, ...axisConfigProp }), [axisConfigProp]);

//   const minCellSize = minCellSizeProp ?? 8;
//   const maxCellSize = maxCellSizeProp ?? 32;

//   const resolvedDefaultBase = useMemo(() => {
//     const fallback = Math.min(Math.max(12, minCellSize), maxCellSize);
//     const raw = defaultCellSizeProp ?? fallback;
//     return clampBaseCellSize(raw, minCellSize, maxCellSize);
//   }, [defaultCellSizeProp, minCellSize, maxCellSize]);

//   const [baseCellSize, setBaseCellSize] = useState(resolvedDefaultBase);

//   useEffect(() => {
//     setBaseCellSize((prev) => clampBaseCellSize(prev, minCellSize, maxCellSize));
//   }, [minCellSize, maxCellSize]);

//   useEffect(() => {
//     setBaseCellSize(resolvedDefaultBase);
//   }, [resolvedDefaultBase]);

//   const viewportRef = useRef<HTMLDivElement>(null);
//   const konvaContainerRef = useRef<HTMLDivElement>(null);
//   const stageRef = useRef<Konva.Stage | null>(null);
//   const layerRef = useRef<Konva.Layer | null>(null);
//   const groupRef = useRef<Konva.Group | null>(null);

//   const [viewportSize, setViewportSize] = useState({ width: 800, height: 600 });
//   const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 });
//   const [innerSelected, setInnerSelected] = useState<CellCoord | null>(defaultSelectedCell);
//   const [innerView, setInnerView] = useState<ViewState>(defaultViewState);

//   const selectedCell = selectedCellProp !== undefined ? selectedCellProp : innerSelected;
//   const viewState = viewStateProp !== undefined ? viewStateProp : innerView;

//   const zoom = viewState.zoom;

//   const cellPixelSize = useMemo(() => baseCellSize * zoom, [baseCellSize, zoom]);

//   const contentWidth = useMemo(
//     () => Math.max(1, data.cols) * cellPixelSize,
//     [data.cols, cellPixelSize]
//   );
//   const contentHeight = useMemo(
//     () => Math.max(1, data.rows) * cellPixelSize,
//     [data.rows, cellPixelSize]
//   );

//   const zoomRef = useRef(zoom);
//   const baseCellSizeRef = useRef(baseCellSize);
//   const cellPixelSizeRef = useRef(cellPixelSize);
//   const viewStateRef = useRef(viewState);
//   const dataRef = useRef(data);
//   const selectedCellRef = useRef(selectedCell);
//   // 对象池：复用 Konva.Rect 对象
//   const cellPoolRef = useRef<Map<string, Konva.Rect>>(new Map());
//   // RAF 节流相关
//   const rafIdRef = useRef<number | null>(null);
//   const pendingRenderRef = useRef(false);
//   // Overscan 预渲染倍数（多渲染几屏内容）
//   const OVERSCAN_COUNT = 2;

//   zoomRef.current = zoom;
//   baseCellSizeRef.current = baseCellSize;
//   cellPixelSizeRef.current = cellPixelSize;
//   viewStateRef.current = viewState;
//   dataRef.current = data;
//   selectedCellRef.current = selectedCell;

//   const getCellContextRef = useRef<(row: number, col: number, hovered: boolean) => CellRenderContext<T>>(
//     (row, col, hovered) => ({
//       cell: null,
//       row,
//       col,
//       x: 0,
//       y: 0,
//       width: 0,
//       height: 0,
//       isSelected: false,
//       isHovered: hovered,
//     })
//   );
//   const onCellClickRef = useRef(onCellClick);
//   const onCellHoverRef = useRef(onCellHover);
//   const setSelectedCellRef = useRef<(next: CellCoord | null) => void>(() => {});

//   onCellClickRef.current = onCellClick;
//   onCellHoverRef.current = onCellHover;

//   const setSelectedCell = useCallback((next: CellCoord | null) => {
//     if (selectedCellProp === undefined) {
//       setInnerSelected(next);
//     }
//     onSelectedCellChange?.(next);
//   }, [selectedCellProp, onSelectedCellChange]);

//   setSelectedCellRef.current = setSelectedCell;

//   const setViewState = useCallback((next: ViewState) => {
//     if (viewStateProp === undefined) {
//       setInnerView(next);
//     }
//     onViewStateChange?.(next);
//   }, [viewStateProp, onViewStateChange]);

//   const emitScrollAsViewState = useCallback(() => {
//     const el = viewportRef.current;
//     if (!el) {
//       return;
//     }
//     setViewState({
//       zoom: zoomRef.current,
//       offsetX: el.scrollLeft,
//       offsetY: el.scrollTop,
//     });
//   }, [setViewState]);

//   const cellMap = useMemo(() => {
//     const map = new Map<string, T>();
//     const getRow = data.getRowIndex ?? ((_cell: T, idx: number) => idx % data.rows);
//     const getCol = data.getColIndex ?? ((_cell: T, idx: number) => Math.floor(idx / data.rows));
//     data.cells.forEach((cell, idx) => {
//       const row = getRow(cell, idx);
//       const col = getCol(cell, idx);
//       map.set(`${row}-${col}`, cell);
//     });
//     return map;
//   }, [data]);

//   const getCellContext = useCallback((row: number, col: number, hovered: boolean): CellRenderContext<T> => {
//     const cell = cellMap.get(`${row}-${col}`) ?? null;
//     return {
//       cell,
//       row,
//       col,
//       x: col * cellPixelSize,
//       y: row * cellPixelSize,
//       width: cellPixelSize,
//       height: cellPixelSize,
//       isSelected: selectedCell?.row === row && selectedCell?.col === col,
//       isHovered: hovered,
//     };
//   }, [cellMap, cellPixelSize, selectedCell]);

//   getCellContextRef.current = getCellContext;

//   // 计算可见区域的刻度
//   const visibleTicks = useMemo(() => {
//     const cp = cellPixelSize;
//     const scrollLeft = scrollPos.left;
//     const scrollTop = scrollPos.top;
//     const vw = viewportSize.width - (axisConfig.showY ? axisConfig.axisWidth! : 0);
//     const vh = viewportSize.height - (axisConfig.showX ? axisConfig.axisHeight! : 0);

//     // 计算刻度步长（根据缩放级别自适应）
//     const getStep = (pixelSize: number, customStep?: number): number => {
//       if (customStep && customStep > 0) return customStep;
//       if (pixelSize >= 64) return 1;
//       if (pixelSize >= 32) return 2;
//       if (pixelSize >= 16) return 4;
//       if (pixelSize >= 8) return 8;
//       if (pixelSize >= 4) return 16;
//       return 32;
//     };

//     const xStep = getStep(cp, axisConfig.stepX);
//     const yStep = getStep(cp, axisConfig.stepY);

//     // 可见区域的刻度范围（0-based索引）
//     const xStartTick = Math.floor(scrollLeft / cp / xStep) * xStep;
//     const xEndTick = Math.min(data.cols, Math.ceil((scrollLeft + vw) / cp / xStep) * xStep + xStep);
//     const yStartTick = Math.floor(scrollTop / cp / yStep) * yStep;
//     const yEndTick = Math.min(data.rows, Math.ceil((scrollTop + vh) / cp / yStep) * yStep + yStep);

//     // X轴刻度（列）- 从1开始显示，0不显示
//     const xTicks: { index: number; label: string; position: number }[] = [];
//     for (let col = Math.max(xStep, xStartTick); col < xEndTick; col += xStep) {
//       if (col >= 0 && col < data.cols) {
//         xTicks.push({
//           index: col,
//           label: axisConfig.formatX ? axisConfig.formatX(col) : (col + 1).toString(),
//           position: col * cp - scrollLeft,
//         });
//       }
//     }

//     // Y轴刻度（行）- 从1开始显示，0不显示
//     const yTicks: { index: number; label: string; position: number }[] = [];
//     for (let row = Math.max(yStep, yStartTick); row < yEndTick; row += yStep) {
//       if (row >= 0 && row < data.rows) {
//         yTicks.push({
//           index: row,
//           label: axisConfig.formatY ? axisConfig.formatY(row) : (row + 1).toString(),
//           position: row * cp - scrollTop,
//         });
//       }
//     }

//     return { xTicks, yTicks, xStep, yStep };
//   }, [cellPixelSize, scrollPos, viewportSize, data.cols, data.rows, axisConfig]);

//   useEffect(() => {
//     const el = viewportRef.current;
//     if (!el) {
//       return;
//     }
//     const update = () => {
//       setViewportSize({ width: el.clientWidth || 800, height: el.clientHeight || 600 });
//     };
//     update();
//     const ro = new ResizeObserver(update);
//     ro.observe(el);
//     return () => ro.disconnect();
//   }, []);

//   useEffect(() => {
//     if (viewStateProp === undefined) {
//       return;
//     }
//     const el = viewportRef.current;
//     if (!el) {
//       return;
//     }
//     if (el.scrollLeft !== viewState.offsetX || el.scrollTop !== viewState.offsetY) {
//       el.scrollLeft = viewState.offsetX;
//       el.scrollTop = viewState.offsetY;
//       setScrollPos({ left: el.scrollLeft, top: el.scrollTop });
//     }
//   }, [viewStateProp, viewState.offsetX, viewState.offsetY]);

//   useEffect(() => {
//     const el = viewportRef.current;
//     if (!el) {
//       return;
//     }
//     el.scrollTo({ left: 0, top: 0 });
//     setScrollPos({ left: 0, top: 0 });
//     emitScrollAsViewState();
//   }, [data.rows, data.cols, emitScrollAsViewState]);

//   useEffect(() => {
//     if (!konvaContainerRef.current || contentWidth <= 0 || contentHeight <= 0) {
//       return;
//     }

//     if (!stageRef.current) {
//       const stage = new Konva.Stage({
//         container: konvaContainerRef.current,
//         width: contentWidth,
//         height: contentHeight,
//       });
//       const layer = new Konva.Layer({ listening: true });
//       const group = new Konva.Group();
//       layer.add(group);
//       stage.add(layer);

//       stageRef.current = stage;
//       layerRef.current = layer;
//       groupRef.current = group;

//       let dragging = false;
//       let lastPointer = { x: 0, y: 0 };

//       stage.on('wheel', (e) => {
//         e.evt.preventDefault();
//         // 只有按住 Ctrl 键时才进行缩放
//         if (!e.evt.ctrlKey) {
//           return;
//         }
//         const vp = viewportRef.current;
//         const st = stageRef.current;
//         if (!vp || !st) {
//           return;
//         }

//         const pointer = st.getPointerPosition();
//         if (!pointer) {
//           return;
//         }

//         const oldZoom = zoomRef.current;
//         // 每次缩放 +/- 0.1
//         const nextZoom = e.evt.deltaY < 0
//           ? clamp(oldZoom + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM)
//           : clamp(oldZoom - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM);

//         if (nextZoom === oldZoom) {
//           return;
//         }

//         // 立即更新 ref 和 stage，不等待 React 渲染
//         zoomRef.current = nextZoom;
//         const oldPixel = baseCellSizeRef.current * oldZoom;
//         const newPixel = baseCellSizeRef.current * nextZoom;
//         const scrollLeft = vp.scrollLeft;
//         const scrollTop = vp.scrollTop;
//         const contentX = scrollLeft + pointer.x;
//         const contentY = scrollTop + pointer.y;
//         const ratio = newPixel / oldPixel;

//         const newScrollLeft = contentX * ratio - pointer.x;
//         const newScrollTop = contentY * ratio - pointer.y;

//         // 立即更新视图状态（用于外部同步）
//         setViewState({
//           zoom: nextZoom,
//           offsetX: newScrollLeft,
//           offsetY: newScrollTop,
//         });

//         // 同步更新 scroll 位置和 stage 尺寸，无延迟
//         const maxL = Math.max(0, vp.scrollWidth - vp.clientWidth);
//         const maxT = Math.max(0, vp.scrollHeight - vp.clientHeight);
//         const clampedLeft = clamp(newScrollLeft, 0, maxL);
//         const clampedTop = clamp(newScrollTop, 0, maxT);
//         vp.scrollLeft = clampedLeft;
//         vp.scrollTop = clampedTop;
//         setScrollPos({ left: clampedLeft, top: clampedTop });

//         // 触发重渲染（使用微任务，在状态更新后执行）
//         Promise.resolve().then(() => {
//           emitScrollAsViewState();
//         });
//       });

//       stage.on('mousedown', (e) => {
//         if (e.evt.button !== 0) {
//           return;
//         }
//         dragging = true;
//         lastPointer = { x: e.evt.clientX, y: e.evt.clientY };
//         if (viewportRef.current) {
//           viewportRef.current.style.cursor = 'grabbing';
//         }
//       });

//       stage.on('mousemove', (e) => {
//         const st = stageRef.current;
//         const vp = viewportRef.current;
//         if (!st || !vp) {
//           return;
//         }

//         if (dragging) {
//           const dx = e.evt.clientX - lastPointer.x;
//           const dy = e.evt.clientY - lastPointer.y;
//           lastPointer = { x: e.evt.clientX, y: e.evt.clientY };
//           vp.scrollLeft -= dx;
//           vp.scrollTop -= dy;
//           setScrollPos({ left: vp.scrollLeft, top: vp.scrollTop });
//           emitScrollAsViewState();
//           return;
//         }

//         const hover = onCellHoverRef.current;
//         if (!hover) {
//           return;
//         }

//         const pointer = st.getPointerPosition();
//         if (!pointer) {
//           return;
//         }

//         const cp = cellPixelSizeRef.current;
//         const col = Math.floor(pointer.x / cp);
//         const row = Math.floor(pointer.y / cp);
//         const d = dataRef.current;
//         if (row < 0 || col < 0 || row >= d.rows || col >= d.cols) {
//           return;
//         }
//         hover(getCellContextRef.current(row, col, true), e.evt);
//       });

//       stage.on('mouseup', () => {
//         dragging = false;
//         if (viewportRef.current) {
//           viewportRef.current.style.cursor = '';
//         }
//       });

//       stage.on('mouseleave', () => {
//         dragging = false;
//         if (viewportRef.current) {
//           viewportRef.current.style.cursor = '';
//         }
//       });

//       stage.on('click', (e) => {
//         const st = stageRef.current;
//         if (!st) {
//           return;
//         }
//         const pointer = st.getPointerPosition();
//         if (!pointer) {
//           return;
//         }
//         const cp = cellPixelSizeRef.current;
//         const col = Math.floor(pointer.x / cp);
//         const row = Math.floor(pointer.y / cp);
//         const d = dataRef.current;
//         if (row < 0 || col < 0 || row >= d.rows || col >= d.cols) {
//           return;
//         }
//         setSelectedCellRef.current({ row, col });
//         onCellClickRef.current?.(getCellContextRef.current(row, col, false), e.evt);
//       });
//     } else {
//       stageRef.current.width(contentWidth);
//       stageRef.current.height(contentHeight);
//     }
//   }, [contentWidth, contentHeight, emitScrollAsViewState, setViewState]);

//   useEffect(() => {
//     return () => {
//       stageRef.current?.destroy();
//       stageRef.current = null;
//       layerRef.current = null;
//       groupRef.current = null;
//       // 清理对象池
//       cellPoolRef.current.clear();
//       if (rafIdRef.current) {
//         cancelAnimationFrame(rafIdRef.current);
//       }
//     };
//   }, []);

//   useEffect(() => {
//     const vp = viewportRef.current;
//     if (!vp) {
//       return;
//     }
//     const onScroll = () => {
//       setScrollPos({ left: vp.scrollLeft, top: vp.scrollTop });
//       emitScrollAsViewState();
//     };
//     vp.addEventListener('scroll', onScroll, { passive: true });
//     return () => vp.removeEventListener('scroll', onScroll);
//   }, [emitScrollAsViewState]);

//   useEffect(() => {
//     const stage = stageRef.current;
//     const layer = layerRef.current;
//     const group = groupRef.current;
//     if (!stage || !layer || !group) {
//       return;
//     }

//     // 取消之前的 RAF
//     if (rafIdRef.current) {
//       cancelAnimationFrame(rafIdRef.current);
//     }
//     pendingRenderRef.current = true;

//     rafIdRef.current = requestAnimationFrame(() => {
//       if (!pendingRenderRef.current) return;
//       pendingRenderRef.current = false;

//       const scrollLeft = scrollPos.left;
//       const scrollTop = scrollPos.top;
//       const vw = viewportSize.width - (axisConfig.showY ? axisConfig.axisWidth! : 0);
//       const vh = viewportSize.height - (axisConfig.showX ? axisConfig.axisHeight! : 0);
//       const cp = cellPixelSize;

//       // Overscan：扩展可见区域，预渲染多屏内容
//       const overscanPixels = Math.max(vw, vh) * OVERSCAN_COUNT;
//       const startCol = Math.max(0, Math.floor((scrollLeft - overscanPixels) / cp));
//       const startRow = Math.max(0, Math.floor((scrollTop - overscanPixels) / cp));
//       const endCol = Math.min(data.cols, Math.ceil((scrollLeft + vw + overscanPixels) / cp));
//       const endRow = Math.min(data.rows, Math.ceil((scrollTop + vh + overscanPixels) / cp));

//       // 当前可见区域的 key 集合
//       const visibleKeys = new Set<string>();
//       const pool = cellPoolRef.current;

//       // 更新或创建可见区域的 Rect
//       for (let row = startRow; row < endRow; row++) {
//         for (let col = startCol; col < endCol; col++) {
//           const key = `${row}-${col}`;
//           visibleKeys.add(key);

//           const cell = cellMap.get(key) ?? null;
//           const isSelected = selectedCell?.row === row && selectedCell?.col === col;
//           const fill = getCellColor?.(cell, row, col) ?? '#ffffff';

//           let rect = pool.get(key);

//           if (!rect) {
//             // 创建新的 Rect
//             rect = new Konva.Rect({
//               x: col * cp,
//               y: row * cp,
//               width: cp,
//               height: cp,
//               fill,
//               stroke: isSelected ? '#ff0000' : '#cccccc',
//               strokeWidth: isSelected ? Math.max(1, cp * 0.08) : Math.max(0.5, cp * 0.02),
//               listening: false,
//             });
//             pool.set(key, rect);
//             group.add(rect);
//           } else {
//             // 复用现有的 Rect，只更新属性
//             rect.x(col * cp);
//             rect.y(row * cp);
//             rect.width(cp);
//             rect.height(cp);
//             rect.fill(fill);
//             rect.stroke(isSelected ? '#ff0000' : '#cccccc');
//             rect.strokeWidth(isSelected ? Math.max(1, cp * 0.08) : Math.max(0.5, cp * 0.02));
//             rect.visible(true);
//           }
//         }
//       }

//       // 隐藏不在可见区域的 Rect（而非销毁）
//       pool.forEach((rect, key) => {
//         if (!visibleKeys.has(key)) {
//           rect.visible(false);
//         }
//       });

//       layer.batchDraw();
//     });

//     return () => {
//       if (rafIdRef.current) {
//         cancelAnimationFrame(rafIdRef.current);
//       }
//     };
//   }, [
//     cellMap,
//     cellPixelSize,
//     data.cols,
//     data.rows,
//     getCellColor,
//     scrollPos.left,
//     scrollPos.top,
//     selectedCell,
//     viewportSize.height,
//     viewportSize.width,
//     axisConfig.showX,
//     axisConfig.showY,
//     axisConfig.axisHeight,
//     axisConfig.axisWidth,
//   ]);

//   useImperativeHandle(ref, (): BitmapEngineRef => ({
//     zoomIn: (step = 1.1) => {
//       const z = clamp(viewStateRef.current.zoom * step, MIN_ZOOM, MAX_ZOOM);
//       setViewState({ ...viewStateRef.current, zoom: z });
//     },
//     zoomOut: (step = 1.1) => {
//       const z = clamp(viewStateRef.current.zoom / step, MIN_ZOOM, MAX_ZOOM);
//       setViewState({ ...viewStateRef.current, zoom: z });
//     },
//     setZoom: (z: number) => {
//       setViewState({
//         ...viewStateRef.current,
//         zoom: clamp(z, MIN_ZOOM, MAX_ZOOM),
//       });
//     },
//     resetView: () => {
//       const vp = viewportRef.current;
//       if (vp) {
//         vp.scrollTo({ left: 0, top: 0 });
//       }
//       setViewState({ zoom: 1, offsetX: 0, offsetY: 0 });
//       setScrollPos({ left: 0, top: 0 });
//     },
//     fitToScreen: () => {
//       const vp = viewportRef.current;
//       if (!vp) {
//         return;
//       }
//       const vw = vp.clientWidth || 800;
//       const vh = vp.clientHeight || 600;
//       const rows = dataRef.current.rows;
//       const cols = dataRef.current.cols;
//       if (rows <= 0 || cols <= 0) {
//         return;
//       }
//       const zW = vw / (cols * baseCellSizeRef.current);
//       const zH = vh / (rows * baseCellSizeRef.current);
//       const fitZoom = clamp(Math.min(zW, zH), MIN_ZOOM, MAX_ZOOM);
//       setViewState({ zoom: fitZoom, offsetX: 0, offsetY: 0 });
//       requestAnimationFrame(() => {
//         vp.scrollTo({ left: 0, top: 0 });
//         setScrollPos({ left: 0, top: 0 });
//         emitScrollAsViewState();
//       });
//     },
//     zoomToCell: (row: number, col: number, zoomArg?: number) => {
//       const vp = viewportRef.current;
//       if (!vp) {
//         return;
//       }
//       const z = clamp(zoomArg ?? zoomRef.current, MIN_ZOOM, MAX_ZOOM);
//       setSelectedCellRef.current({ row, col });
//       setViewState({
//         zoom: z,
//         offsetX: vp.scrollLeft,
//         offsetY: vp.scrollTop,
//       });
//       requestAnimationFrame(() => {
//         requestAnimationFrame(() => {
//           const v = viewportRef.current;
//           if (!v) {
//             return;
//           }
//           const cp = baseCellSizeRef.current * z;
//           const cx = col * cp + cp / 2;
//           const cy = row * cp + cp / 2;
//           const maxL = Math.max(0, v.scrollWidth - v.clientWidth);
//           const maxT = Math.max(0, v.scrollHeight - v.clientHeight);
//           const targetL = clamp(cx - v.clientWidth / 2, 0, maxL);
//           const targetT = clamp(cy - v.clientHeight / 2, 0, maxT);
//           v.scrollLeft = targetL;
//           v.scrollTop = targetT;
//           setScrollPos({ left: v.scrollLeft, top: v.scrollTop });
//           emitScrollAsViewState();
//         });
//       });
//     },
//     getViewState: () => viewStateRef.current,
//     getStage: () => stageRef.current,
//   }), [emitScrollAsViewState, setViewState]);

//   const axisHeight = axisConfig.axisHeight ?? 24;
//   const axisWidth = axisConfig.axisWidth ?? 50;

//   return (
//     <div
//       className={className}
//       style={{
//         width: '100%',
//         height: '100%',
//         position: 'relative',
//         overflow: 'hidden',
//         display: 'flex',
//         flexDirection: 'column',
//         ...style,
//       }}
//     >
//       {/* 顶部区域：空白 + X轴 */}
//       {axisConfig.showX && (
//         <div
//           style={{
//             display: 'flex',
//             flexDirection: 'row',
//             height: axisHeight,
//             flexShrink: 0,
//           }}
//         >
//           {/* 左上角空白（对齐Y轴） */}
//           {axisConfig.showY && (
//             <div
//               style={{
//                 width: axisWidth,
//                 flexShrink: 0,
//                 backgroundColor: axisConfig.bgColor ?? '#f5f5f5',
//                 borderRight: '1px solid #ddd',
//                 borderBottom: '1px solid #ddd',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 fontSize: axisConfig.fontSize ?? 12,
//                 fontWeight: 'bold',
//                 color: axisConfig.labelColor ?? '#333',
//               }}
//             >
//               {axisConfig.xLabel || axisConfig.yLabel || ''}
//             </div>
//           )}
// {/* X轴区域（固定顶部） */}
//         <div
//           style={{
//             flex: 1,
//             backgroundColor: axisConfig.bgColor ?? '#f5f5f5',
//             borderBottom: '1px solid #ddd',
//             position: 'relative',
//             overflow: 'hidden',
//           }}
//         >
//           {/* X轴刻度区域 */}
//           <div style={{ width: '100%', height: '100%', position: 'relative' }}>
//             {visibleTicks.xTicks.map((tick) => (
//               <div key={`x-${tick.index}`}>
//                 {/* 刻度线（短竖线） */}
//                 <div
//                   style={{
//                     position: 'absolute',
//                     left: tick.position,
//                     top: axisHeight - 10,
//                     width: 1,
//                     height: 6,
//                     backgroundColor: axisConfig.tickColor ?? '#666',
//                     transform: 'translateX(-50%)',
//                   }}
//                 />
//                 {/* 刻度文字 */}
//                 <div
//                   style={{
//                     position: 'absolute',
//                     left: tick.position,
//                     top: '50%',
//                     transform: 'translateX(-50%) translateY(-50%)',
//                     fontSize: axisConfig.fontSize ?? 12,
//                     color: axisConfig.tickColor ?? '#666',
//                     whiteSpace: 'nowrap',
//                   }}
//                 >
//                   {tick.label}
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* X轴工具栏按钮组 - 绝对定位在右上角 */}
//           {axisConfig.showToolbar !== false && (
//             <div
//               style={{
//                 position: 'absolute',
//                 top: '50%',
//                 right: '8px',
//                 transform: 'translateY(-50%)',
//                 display: 'flex',
//                 alignItems: 'center',
//                 padding: '4px 8px',
//                 backgroundColor: 'rgba(245, 245, 245, 0.95)',
//                 border: '1px solid #ddd',
//                 borderRadius: '4px',
//                 gap: '4px',
//                 zIndex: 10,
//               }}
//             >
//               <Tooltip content="放大 (+0.1)" position="bottom">
//                 <Button
//                   type="secondary"
//                   size="small"
//                   icon={<IconZoomIn />}
//                   onClick={() => {
//                     const z = clamp(viewStateRef.current.zoom + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM);
//                     setViewState({ ...viewStateRef.current, zoom: z });
//                   }}
//                 />
//               </Tooltip>
//               <Tooltip content="缩小 (-0.1)" position="bottom">
//                 <Button
//                   type="secondary"
//                   size="small"
//                   icon={<IconZoomOut />}
//                   onClick={() => {
//                     const z = clamp(viewStateRef.current.zoom - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM);
//                     setViewState({ ...viewStateRef.current, zoom: z });
//                   }}
//                 />
//               </Tooltip>
//               <Tooltip content="还原 (1:1)" position="bottom">
//                 <Button
//                   type="secondary"
//                   size="small"
//                   icon={<IconRefresh />}
//                   onClick={() => {
//                     setViewState({ zoom: 1, offsetX: 0, offsetY: 0 });
//                     const vp = viewportRef.current;
//                     if (vp) {
//                       vp.scrollTo({ left: 0, top: 0 });
//                       setScrollPos({ left: 0, top: 0 });
//                     }
//                   }}
//                 />
//               </Tooltip>
//               <Tooltip content="适应屏幕" position="bottom">
//                 <Button
//                   type="secondary"
//                   size="small"
//                   icon={<IconFullscreen />}
//                   onClick={() => {
//                     const vp = viewportRef.current;
//                     if (!vp) return;
//                     const vw = vp.clientWidth || 800;
//                     const vh = vp.clientHeight || 600;
//                     const rows = dataRef.current.rows;
//                     const cols = dataRef.current.cols;
//                     if (rows <= 0 || cols <= 0) return;
//                     const zW = vw / (cols * baseCellSizeRef.current);
//                     const zH = vh / (rows * baseCellSizeRef.current);
//                     const fitZoom = clamp(Math.min(zW, zH), MIN_ZOOM, MAX_ZOOM);
//                     setViewState({ zoom: fitZoom, offsetX: 0, offsetY: 0 });
//                     requestAnimationFrame(() => {
//                       vp.scrollTo({ left: 0, top: 0 });
//                       setScrollPos({ left: 0, top: 0 });
//                       emitScrollAsViewState();
//                     });
//                   }}
//                 />
//               </Tooltip>
//               <div
//                 style={{
//                   fontSize: 11,
//                   color: axisConfig.tickColor ?? '#666',
//                   marginLeft: '4px',
//                   minWidth: '45px',
//                   textAlign: 'center',
//                   fontWeight: 'bold',
//                 }}
//               >
//                 {viewState.zoom.toFixed(1)}x
//               </div>
//             </div>
//           )}
//         </div>
//         </div>
//       )}

//       {/* 主内容区域：Y轴标签 + Canvas区域 */}
//       <div
//         style={{
//           display: 'flex',
//           flexDirection: 'row',
//           flex: 1,
//           overflow: 'hidden',
//         }}
//       >
//         {/* Y轴标签区域（固定左侧） */}
//         {axisConfig.showY && (
//           <div
//             style={{
//               width: axisWidth,
//               flexShrink: 0,
//               backgroundColor: axisConfig.bgColor ?? '#f5f5f5',
//               borderRight: '1px solid #ddd',
//               position: 'relative',
//               overflow: 'hidden',
//             }}
//           >
//             {/* Y轴刻度线和文字 */}
//             {visibleTicks.yTicks.map((tick) => (
//               <div key={`y-${tick.index}`}>
//                 {/* 刻度线（短横线） */}
//                 <div
//                   style={{
//                     position: 'absolute',
//                     left: axisWidth - 8,
//                     top: tick.position,
//                     width: 6,
//                     height: 1,
//                     backgroundColor: axisConfig.tickColor ?? '#666',
//                     transform: 'translateY(-50%)',
//                   }}
//                 />
//                 {/* 刻度文字 */}
//                 <div
//                   style={{
//                     position: 'absolute',
//                     left: 4,
//                     top: tick.position,
//                     transform: 'translateY(-50%)',
//                     fontSize: axisConfig.fontSize ?? 12,
//                     color: axisConfig.tickColor ?? '#666',
//                     whiteSpace: 'nowrap',
//                   }}
//                 >
//                   {tick.label}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* Canvas 区域（可滚动） */}
//         <div
//           ref={viewportRef}
//           style={{
//             flex: 1,
//             overflow: 'auto',
//             position: 'relative',
//           }}
//         >
//           <div
//             ref={konvaContainerRef}
//             style={{
//               width: contentWidth,
//               height: contentHeight,
//               position: 'relative',
//               display: 'block',
//             }}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }) as <T>(
//   props: BitmapEngineProps<T> & { ref?: React.Ref<BitmapEngineRef> }
// ) => React.ReactElement;
