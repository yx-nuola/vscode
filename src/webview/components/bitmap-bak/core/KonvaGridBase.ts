import Konva from 'konva';
import type {
  IGridRenderer,
  IAxisRenderer,
  IZoomable,
  IColorConfigurable,
  IScrollable,
  ISelectable,
  GridConfig,
  AxisConfig,
  MatrixData,
  CellCoord,
  CellRenderContext,
  VisibleRange,
  ViewState,
  ZoomConfig,
  ColorConfig,
  ColorRange,
  ScrollConfig,
  ScrollPosition,
  SelectionConfig,
  SelectionEvent,
  VisibleTicks,
  AxisTick,
} from './interfaces';

const DEFAULT_MIN_ZOOM = 0.8;
const DEFAULT_MAX_ZOOM = 1.4;
const DEFAULT_ZOOM_STEP = 0.1;
const DEFAULT_VIEW: ViewState = { zoom: 1, offsetX: 0, offsetY: 0 };
const OVERSCAN_COUNT = 2;

const DEFAULT_AXIS_CONFIG: AxisConfig = {
  showX: true,
  showY: true,
  stepX: 4,
  stepY: 4,
  axisHeight: 36,
  axisWidth: 50,
  tickColor: '#666666',
  labelColor: '#333333',
  bgColor: '#f5f5f5',
  fontSize: 12,
  showToolbar: true,
};

const DEFAULT_COLOR_CONFIG: ColorConfig = {
  ranges: [],
  fallbackColor: '#FFFFFF',
  passColor: '#22c55e',
  failColor: '#ef4444',
  useStatusColor: true,
};

const DEFAULT_SCROLL_CONFIG: ScrollConfig = {
  showHorizontal: true,
  showVertical: true,
  autoHide: false,
  scrollSpeed: 50,
};

const DEFAULT_SELECTION_CONFIG: SelectionConfig = {
  allowMultiple: false,
  selectionColor: '#FF0000',
  selectionBorderWidth: 0.08,
  showAnimation: false,
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Konva 网格基类
 * 实现所有核心接口，提供完整的二维矩阵图渲染功能
 * 
 * 功能包括：
 * - 基础网格渲染 (IGridRenderer)
 * - 坐标轴渲染 (IAxisRenderer)
 * - 缩放控制 (IZoomable)
 * - 颜色配置 (IColorConfigurable)
 * - 滚动控制 (IScrollable)
 * - 格子选择 (ISelectable)
 */
export abstract class KonvaGridBase<T>
  implements
    IGridRenderer<T>,
    IAxisRenderer,
    IZoomable,
    IColorConfigurable<T>,
    IScrollable,
    ISelectable<T>
{
  // ========== 配置属性 ==========
  abstract readonly config: GridConfig;
  readonly axisConfig: AxisConfig = DEFAULT_AXIS_CONFIG;
  readonly zoomConfig: ZoomConfig = {
    minZoom: DEFAULT_MIN_ZOOM,
    maxZoom: DEFAULT_MAX_ZOOM,
    zoomStep: DEFAULT_ZOOM_STEP,
  };
  colorConfig: ColorConfig = DEFAULT_COLOR_CONFIG;
  readonly scrollConfig: ScrollConfig = DEFAULT_SCROLL_CONFIG;
  selectionConfig: SelectionConfig = DEFAULT_SELECTION_CONFIG;

  // ========== 数据属性 ==========
  data: MatrixData<T>;

  // ========== Konva 对象 ==========
  protected stage: Konva.Stage | null = null;
  protected layer: Konva.Layer | null = null;
  protected cellGroup: Konva.Group | null = null;
  protected axisGroup: Konva.Group | null = null;

  // ========== 容器和尺寸 ==========
  protected container: HTMLDivElement | null = null;
  protected viewportSize = { width: 800, height: 600 };

  // ========== 状态管理 ==========
  protected _viewState: ViewState = DEFAULT_VIEW;
  protected _selectedCell: CellCoord | null = null;
  protected _selectedCells: CellCoord[] = [];
  protected _baseCellSize = 12;
  protected _cellPixelSize = 12;
  protected _scrollPos: ScrollPosition = { left: 0, top: 0 };

  // ========== 缓存 ==========
  protected cellPool: Map<string, Konva.Rect> = new Map();
  protected cellMap: Map<string, T> = new Map();

  // ========== RAF 相关 ==========
  private rafId: number | null = null;
  private pendingRender = false;

  // ========== 拖拽状态 ==========
  private isDragging = false;
  private lastPointer = { x: 0, y: 0 };

  constructor(data: MatrixData<T>) {
    this.data = data;

    // 绑定方法
    this.handleWheel = this.handleWheel.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
  }

  // ========== Getter ==========

  get viewState(): ViewState {
    return this._viewState;
  }

  get selectedCell(): CellCoord | null {
    return this._selectedCell;
  }

  get selectedCells(): CellCoord[] {
    return [...this._selectedCells];
  }

  get scrollPosition(): ScrollPosition {
    return { ...this._scrollPos };
  }

  get cellPixelSize(): number {
    return this._cellPixelSize;
  }

  // ========== IGridRenderer 实现 ==========

  initialize(container: HTMLDivElement): void {
    this.container = container;
    this._baseCellSize = clamp(
      this.config.defaultCellSize,
      this.config.minCellSize,
      this.config.maxCellSize
    );
    this._cellPixelSize = this._baseCellSize;

    this.updateViewportSize();
    this.buildCellMap();
    this.initializeStage();
    this.setupEventHandlers();
    this.render();
  }

  destroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // 移除事件监听
    if (this.stage) {
      this.stage.off('wheel');
      this.stage.off('mousedown');
      this.stage.off('mousemove');
      this.stage.off('mouseup');
      this.stage.off('mouseleave');
      this.stage.off('click');
    }

    if (this.container && this.container.parentElement) {
      this.container.parentElement.removeEventListener('scroll', this.handleScroll);
    }

    // 清理 Konva 对象
    this.stage?.destroy();
    this.stage = null;
    this.layer = null;
    this.cellGroup = null;
    this.axisGroup = null;

    // 清理对象池
    this.cellPool.clear();
    this.cellMap.clear();

    this.container = null;
  }

  render(): void {
    this.onBeforeRender?.();
    this.renderVisibleCells();
    this.renderAxis();
    this.onAfterRender?.();
  }

  abstract getCellColor(cell: T | null, row: number, col: number): string;

  abstract createCellShape(context: CellRenderContext<T>): Konva.Shape;

  getCellContext(row: number, col: number, hovered: boolean): CellRenderContext<T> {
    const cell = this.cellMap.get(`${row}-${col}`) ?? null;
    const cp = this._cellPixelSize;

    return {
      cell,
      row,
      col,
      x: col * cp,
      y: row * cp,
      width: cp,
      height: cp,
      isSelected: this.isCellSelected(row, col),
      isHovered: hovered,
    };
  }

  calculateVisibleRange(): VisibleRange {
    const cp = this._cellPixelSize;
    const scrollLeft = this._scrollPos.left;
    const scrollTop = this._scrollPos.top;

    const vw = this.getViewportWidth();
    const vh = this.getViewportHeight();

    // Overscan：扩展可见区域
    const overscanPixels = Math.max(vw, vh) * OVERSCAN_COUNT;

    const startCol = Math.max(0, Math.floor((scrollLeft - overscanPixels) / cp));
    const startRow = Math.max(0, Math.floor((scrollTop - overscanPixels) / cp));
    const endCol = Math.min(this.data.cols, Math.ceil((scrollLeft + vw + overscanPixels) / cp));
    const endRow = Math.min(this.data.rows, Math.ceil((scrollTop + vh + overscanPixels) / cp));

    return { startRow, endRow, startCol, endCol };
  }

  setData(data: MatrixData<T>): void {
    this.data = data;
    this.buildCellMap();

    // 更新 stage 尺寸
    if (this.stage) {
      this.stage.width(this.getContentWidth());
      this.stage.height(this.getContentHeight());
    }

    this.scheduleRender();
  }

  onBeforeRender?(): void;
  onAfterRender?(): void;

  // ========== IAxisRenderer 实现 ==========

  renderAxis(): void {
    if (!this.layer || !this.axisGroup) {
      return;
    }

    // 清除旧的坐标轴
    this.axisGroup.destroyChildren();

    const ticks = this.calculateVisibleTicks();

    // 渲染 X 轴刻度和标签
    if (this.axisConfig.showX) {
      ticks.xTicks.forEach((tick) => {
        // 刻度线
        const tickLine = new Konva.Line({
          points: [tick.position, 0, tick.position, 6],
          stroke: this.axisConfig.tickColor,
          strokeWidth: 1,
        });
        this.axisGroup?.add(tickLine);

        // 刻度标签
        const tickText = new Konva.Text({
          x: tick.position,
          y: 10,
          text: tick.label,
          fontSize: this.axisConfig.fontSize ?? 12,
          fill: this.axisConfig.labelColor ?? '#333333',
          align: 'center',
          verticalAlign: 'middle',
        });
        this.axisGroup?.add(tickText);
      });
    }

    // 渲染 Y 轴刻度和标签
    if (this.axisConfig.showY) {
      ticks.yTicks.forEach((tick) => {
        // 刻度线
        const tickLine = new Konva.Line({
          points: [0, tick.position, 6, tick.position],
          stroke: this.axisConfig.tickColor,
          strokeWidth: 1,
        });
        this.axisGroup?.add(tickLine);

        // 刻度标签
        const tickText = new Konva.Text({
          x: 10,
          y: tick.position,
          text: tick.label,
          fontSize: this.axisConfig.fontSize ?? 12,
          fill: this.axisConfig.labelColor ?? '#333333',
          align: 'left',
          verticalAlign: 'middle',
        });
        this.axisGroup?.add(tickText);
      });
    }

    this.layer.batchDraw();
  }

  calculateVisibleTicks(): VisibleTicks {
    const cp = this._cellPixelSize;
    const scrollLeft = this._scrollPos.left;
    const scrollTop = this._scrollPos.top;
    const vw = this.getViewportWidth();
    const vh = this.getViewportHeight();

    // 计算刻度步长
    const xStep = this.getStepByZoom(cp, this.axisConfig.stepX);
    const yStep = this.getStepByZoom(cp, this.axisConfig.stepY);

    // 可见范围
    const xStartTick = Math.floor(scrollLeft / cp / xStep) * xStep;
    const xEndTick = Math.min(this.data.cols, Math.ceil((scrollLeft + vw) / cp / xStep) * xStep + xStep);
    const yStartTick = Math.floor(scrollTop / cp / yStep) * yStep;
    const yEndTick = Math.min(this.data.rows, Math.ceil((scrollTop + vh) / cp / yStep) * yStep + yStep);

    // X轴刻度
    const xTicks: AxisTick[] = [];
    for (let col = Math.max(xStep, xStartTick); col < xEndTick; col += xStep) {
      if (col >= 0 && col < this.data.cols) {
        xTicks.push({
          index: col,
          label: this.axisConfig.formatX ? this.axisConfig.formatX(col) : (col + 1).toString(),
          position: col * cp - scrollLeft,
        });
      }
    }

    // Y轴刻度
    const yTicks: AxisTick[] = [];
    for (let row = Math.max(yStep, yStartTick); row < yEndTick; row += yStep) {
      if (row >= 0 && row < this.data.rows) {
        yTicks.push({
          index: row,
          label: this.axisConfig.formatY ? this.axisConfig.formatY(row) : (row + 1).toString(),
          position: row * cp - scrollTop,
        });
      }
    }

    return { xTicks, yTicks, xStep, yStep };
  }

  abstract getXAxisLabel(col: number): string;

  abstract getYAxisLabel(row: number): string;

  getStepByZoom(pixelSize: number, customStep?: number): number {
    if (customStep && customStep > 0) {
      return customStep;
    }
    if (pixelSize >= 64) {
      return 1;
    }
    if (pixelSize >= 32) {
      return 2;
    }
    if (pixelSize >= 16) {
      return 4;
    }
    if (pixelSize >= 8) {
      return 8;
    }
    if (pixelSize >= 4) {
      return 16;
    }
    return 32;
  }

  clearAxis(): void {
    this.axisGroup?.destroyChildren();
    this.layer?.batchDraw();
  }

  // ========== IZoomable 实现 ==========

  zoomIn(step?: number): void {
    const zoomStep = step ?? this.zoomConfig.zoomStep;
    const newZoom = clamp(
      this._viewState.zoom + zoomStep,
      this.zoomConfig.minZoom,
      this.zoomConfig.maxZoom
    );
    this.setZoom(newZoom);
  }

  zoomOut(step?: number): void {
    const zoomStep = step ?? this.zoomConfig.zoomStep;
    const newZoom = clamp(
      this._viewState.zoom - zoomStep,
      this.zoomConfig.minZoom,
      this.zoomConfig.maxZoom
    );
    this.setZoom(newZoom);
  }

  setZoom(zoom: number): void {
    const clampedZoom = clamp(zoom, this.zoomConfig.minZoom, this.zoomConfig.maxZoom);
    if (clampedZoom === this._viewState.zoom) return;

    const centerX = this.getViewportWidth() / 2;
    const centerY = this.getViewportHeight() / 2;

    this.updateZoom(clampedZoom, { x: centerX, y: centerY });
  }

  fitToScreen(): void {
    const vw = this.getViewportWidth();
    const vh = this.getViewportHeight();

    if (this.data.rows <= 0 || this.data.cols <= 0) return;

    const zW = vw / (this.data.cols * this._baseCellSize);
    const zH = vh / (this.data.rows * this._baseCellSize);
    const fitZoom = clamp(
      Math.min(zW, zH),
      this.zoomConfig.minZoom,
      this.zoomConfig.maxZoom
    );

    this._viewState = { zoom: fitZoom, offsetX: 0, offsetY: 0 };
    this._cellPixelSize = this._baseCellSize * fitZoom;

    if (this.container?.parentElement) {
      this.container.parentElement.scrollTo({ left: 0, top: 0 });
      this._scrollPos = { left: 0, top: 0 };
    }

    this.onZoomChange?.(fitZoom);
    this.scheduleRender();
  }

  resetView(): void {
    this._viewState = DEFAULT_VIEW;
    this._cellPixelSize = this._baseCellSize;

    if (this.container?.parentElement) {
      this.container.parentElement.scrollTo({ left: 0, top: 0 });
      this._scrollPos = { left: 0, top: 0 };
    }

    this.onZoomChange?.(DEFAULT_VIEW.zoom);
    this.scheduleRender();
  }

  zoomToCell(row: number, col: number, zoom?: number): void {
    if (!this.container?.parentElement) return;

    const z = zoom !== undefined
      ? clamp(zoom, this.zoomConfig.minZoom, this.zoomConfig.maxZoom)
      : this._viewState.zoom;

    this.selectCell(row, col);
    this._viewState.zoom = z;
    this._cellPixelSize = this._baseCellSize * z;

    const parent = this.container.parentElement;
    const cp = this._cellPixelSize;
    const cx = col * cp + cp / 2;
    const cy = row * cp + cp / 2;

    const maxL = Math.max(0, parent.scrollWidth - parent.clientWidth);
    const maxT = Math.max(0, parent.scrollHeight - parent.clientHeight);

    const targetL = clamp(cx - this.getViewportWidth() / 2, 0, maxL);
    const targetT = clamp(cy - this.getViewportHeight() / 2, 0, maxT);

    parent.scrollLeft = targetL;
    parent.scrollTop = targetT;
    this._scrollPos = { left: targetL, top: targetT };

    this.onZoomChange?.(z);
    this.onScrollChange?.(targetL, targetT);
    this.scheduleRender();
  }

  getViewState(): ViewState {
    return { ...this._viewState };
  }

  setViewState(state: Partial<ViewState>): void {
    if (state.zoom !== undefined) {
      this._viewState.zoom = clamp(
        state.zoom,
        this.zoomConfig.minZoom,
        this.zoomConfig.maxZoom
      );
      this._cellPixelSize = this._baseCellSize * this._viewState.zoom;
    }
    if (state.offsetX !== undefined) this._viewState.offsetX = state.offsetX;
    if (state.offsetY !== undefined) this._viewState.offsetY = state.offsetY;

    this.scheduleRender();
  }

  onZoomChange?(zoom: number): void;

  // ========== IColorConfigurable 实现 ==========

  setColorRanges(ranges: ColorRange[]): void {
    this.colorConfig.ranges = ranges;
    this.updateColorConfig();
  }

  setStatusColors(passColor: string, failColor: string): void {
    this.colorConfig.passColor = passColor;
    this.colorConfig.failColor = failColor;
    this.updateColorConfig();
  }

  setFallbackColor(color: string): void {
    this.colorConfig.fallbackColor = color;
    this.updateColorConfig();
  }

  setUseStatusColor(use: boolean): void {
    this.colorConfig.useStatusColor = use;
    this.updateColorConfig();
  }

  updateColorConfig(): void {
    this.scheduleRender();
  }

  // ========== IScrollable 实现 ==========

  scrollTo(x: number, y: number): void {
    if (!this.container?.parentElement) return;

    const parent = this.container.parentElement;
    const maxL = Math.max(0, parent.scrollWidth - parent.clientWidth);
    const maxT = Math.max(0, parent.scrollHeight - parent.clientHeight);

    parent.scrollLeft = clamp(x, 0, maxL);
    parent.scrollTop = clamp(y, 0, maxT);

    this._scrollPos = { left: parent.scrollLeft, top: parent.scrollTop };
    this.onScrollChange?.(this._scrollPos.left, this._scrollPos.top);
    this.scheduleRender();
  }

  scrollBy(deltaX: number, deltaY: number): void {
    if (!this.container?.parentElement) return;

    const parent = this.container.parentElement;
    this.scrollTo(parent.scrollLeft + deltaX, parent.scrollTop + deltaY);
  }

  getScrollPosition(): ScrollPosition {
    return { ...this._scrollPos };
  }

  setScrollPosition(position: ScrollPosition): void {
    this.scrollTo(position.left, position.top);
  }

  shouldShowHorizontalScroll(): boolean {
    return this.scrollConfig.showHorizontal && this.getContentWidth() > this.getViewportWidth();
  }

  shouldShowVerticalScroll(): boolean {
    return this.scrollConfig.showVertical && this.getContentHeight() > this.getViewportHeight();
  }

  getContentWidth(): number {
    return Math.max(1, this.data.cols) * this._cellPixelSize;
  }

  getContentHeight(): number {
    return Math.max(1, this.data.rows) * this._cellPixelSize;
  }

  getViewportWidth(): number {
    const axisWidth = this.axisConfig.showY ? (this.axisConfig.axisWidth ?? 50) : 0;
    return this.viewportSize.width - axisWidth;
  }

  getViewportHeight(): number {
    const axisHeight = this.axisConfig.showX ? (this.axisConfig.axisHeight ?? 36) : 0;
    return this.viewportSize.height - axisHeight;
  }

  onScrollChange?(offsetX: number, offsetY: number): void;

  // ========== ISelectable 实现 ==========

  selectCell(row: number, col: number, append?: boolean): void {
    if (row < 0 || col < 0 || row >= this.data.rows || col >= this.data.cols) return;

    const coord: CellCoord = { row, col };

    if (this.selectionConfig.allowMultiple && append) {
      // 多选模式
      const index = this._selectedCells.findIndex((c) => c.row === row && c.col === col);
      if (index === -1) {
        this._selectedCells.push(coord);
      } else {
        this._selectedCells.splice(index, 1);
      }
    } else {
      // 单选模式
      this._selectedCell = coord;
      this._selectedCells = [coord];
    }

    this.scheduleRender();
  }

  selectCells(cells: CellCoord[]): void {
    if (!this.selectionConfig.allowMultiple) {
      // 单选模式只保留第一个
      this._selectedCells = cells.length > 0 ? [cells[0]] : [];
      this._selectedCell = cells.length > 0 ? cells[0] : null;
    } else {
      this._selectedCells = [...cells];
      this._selectedCell = cells.length > 0 ? cells[0] : null;
    }

    this.scheduleRender();
  }

  clearSelection(): void {
    this._selectedCell = null;
    this._selectedCells = [];
    this.scheduleRender();
  }

  isCellSelected(row: number, col: number): boolean {
    if (this.selectionConfig.allowMultiple) {
      return this._selectedCells.some((c) => c.row === row && c.col === col);
    }
    return this._selectedCell?.row === row && this._selectedCell?.col === col;
  }

  getSelectionCount(): number {
    return this.selectionConfig.allowMultiple ? this._selectedCells.length : (this._selectedCell ? 1 : 0);
  }

  setSelectionConfig(config: Partial<SelectionConfig>): void {
    this.selectionConfig = { ...this.selectionConfig, ...config };
  }

  onCellClick?(event: SelectionEvent<T>): void;
  onCellHover?(event: SelectionEvent<T>): void;

  // ========== 保护方法 ==========

  protected updateViewportSize(): void {
    if (!this.container) return;

    const rect = this.container.getBoundingClientRect();
    this.viewportSize = {
      width: rect.width || 800,
      height: rect.height || 600,
    };
  }

  protected buildCellMap(): void {
    this.cellMap.clear();
    const getRow = this.data.getRowIndex ?? ((_cell: T, idx: number) => idx % this.data.rows);
    const getCol = this.data.getColIndex ?? ((_cell: T, idx: number) => Math.floor(idx / this.data.rows));

    this.data.cells.forEach((cell, idx) => {
      const row = getRow(cell, idx);
      const col = getCol(cell, idx);
      this.cellMap.set(`${row}-${col}`, cell);
    });
  }

  protected initializeStage(): void {
    if (!this.container) return;

    this.stage = new Konva.Stage({
      container: this.container,
      width: this.getContentWidth(),
      height: this.getContentHeight(),
    });

    this.layer = new Konva.Layer({ listening: true });
    this.cellGroup = new Konva.Group();
    this.axisGroup = new Konva.Group();

    this.layer.add(this.cellGroup);
    this.layer.add(this.axisGroup);
    this.stage.add(this.layer);
  }

  protected setupEventHandlers(): void {
    if (!this.stage) return;

    this.stage.on('wheel', this.handleWheel);
    this.stage.on('mousedown', this.handleMouseDown);
    this.stage.on('mousemove', this.handleMouseMove);
    this.stage.on('mouseup', this.handleMouseUp);
    this.stage.on('mouseleave', this.handleMouseUp);
    this.stage.on('click', this.handleClick);

    // 监听容器滚动
    if (this.container?.parentElement) {
      this.container.parentElement.addEventListener('scroll', this.handleScroll, { passive: true });
    }
  }

  // ========== 事件处理器 ==========

  protected handleWheel(e: Konva.KonvaEventObject<WheelEvent>): void {
    e.evt.preventDefault();

    // 只有按住 Ctrl 键时才进行缩放
    if (!e.evt.ctrlKey) {
      // 普通滚动由容器处理
      return;
    }

    if (!this.stage || !this.container) return;

    const pointer = this.stage.getPointerPosition();
    if (!pointer) return;

    const oldZoom = this._viewState.zoom;
    const nextZoom = e.evt.deltaY < 0
      ? clamp(oldZoom + this.zoomConfig.zoomStep, this.zoomConfig.minZoom, this.zoomConfig.maxZoom)
      : clamp(oldZoom - this.zoomConfig.zoomStep, this.zoomConfig.minZoom, this.zoomConfig.maxZoom);

    if (nextZoom === oldZoom) return;

    this.updateZoom(nextZoom, pointer);
  }

  protected handleMouseDown(e: Konva.KonvaEventObject<MouseEvent>): void {
    if (e.evt.button !== 0) return;

    this.isDragging = true;
    this.lastPointer = { x: e.evt.clientX, y: e.evt.clientY };

    if (this.container) {
      this.container.style.cursor = 'grabbing';
    }
  }

  protected handleMouseMove(e: Konva.KonvaEventObject<MouseEvent>): void {
    if (!this.stage) return;

    if (this.isDragging) {
      const dx = e.evt.clientX - this.lastPointer.x;
      const dy = e.evt.clientY - this.lastPointer.y;
      this.lastPointer = { x: e.evt.clientX, y: e.evt.clientY };

      this.scrollBy(-dx, -dy);
    } else {
      this.handleHover(e.evt);
    }
  }

  protected handleMouseUp(): void {
    this.isDragging = false;
    if (this.container) {
      this.container.style.cursor = '';
    }
  }

  protected handleClick(e: Konva.KonvaEventObject<MouseEvent>): void {
    if (!this.stage) return;

    const pointer = this.stage.getPointerPosition();
    if (!pointer) return;

    const cp = this._cellPixelSize;
    const col = Math.floor(pointer.x / cp);
    const row = Math.floor(pointer.y / cp);

    if (row < 0 || col < 0 || row >= this.data.rows || col >= this.data.cols) return;

    this.selectCell(row, col);

    const cell = this.cellMap.get(`${row}-${col}`) ?? null;
    const event: SelectionEvent<T> = {
      coord: { row, col },
      cell,
      originalEvent: e.evt,
    };

    this.onCellClick?.(event);
  }

  protected handleScroll(): void {
    if (!this.container?.parentElement) return;

    const parent = this.container.parentElement;
    this._scrollPos = { left: parent.scrollLeft, top: parent.scrollTop };
    this.onScrollChange?.(parent.scrollLeft, parent.scrollTop);
    this.scheduleRender();
  }

  protected handleHover(event: MouseEvent): void {
    if (!this.stage || !this.onCellHover) return;

    const pointer = this.stage.getPointerPosition();
    if (!pointer) return;

    const cp = this._cellPixelSize;
    const col = Math.floor(pointer.x / cp);
    const row = Math.floor(pointer.y / cp);

    if (row < 0 || col < 0 || row >= this.data.rows || col >= this.data.cols) return;

    const cell = this.cellMap.get(`${row}-${col}`) ?? null;
    const selectionEvent: SelectionEvent<T> = {
      coord: { row, col },
      cell,
      originalEvent: event,
    };

    this.onCellHover(selectionEvent);
  }

  // ========== 缩放辅助方法 ==========

  protected updateZoom(newZoom: number, centerPoint?: { x: number; y: number }): void {
    const oldZoom = this._viewState.zoom;
    const oldPixel = this._baseCellSize * oldZoom;
    const newPixel = this._baseCellSize * newZoom;

    this._viewState = { ...this._viewState, zoom: newZoom };
    this._cellPixelSize = newPixel;

    // 更新 stage 尺寸
    if (this.stage) {
      this.stage.width(this.getContentWidth());
      this.stage.height(this.getContentHeight());
    }

    // 调整滚动位置以保持在中心点
    if (this.container?.parentElement && centerPoint) {
      const parent = this.container.parentElement;
      const scrollLeft = parent.scrollLeft;
      const scrollTop = parent.scrollTop;

      const contentX = scrollLeft + centerPoint.x;
      const contentY = scrollTop + centerPoint.y;
      const ratio = newPixel / oldPixel;

      const newScrollLeft = contentX * ratio - centerPoint.x;
      const newScrollTop = contentY * ratio - centerPoint.y;

      const maxL = Math.max(0, parent.scrollWidth - parent.clientWidth);
      const maxT = Math.max(0, parent.scrollHeight - parent.clientHeight);

      parent.scrollLeft = clamp(newScrollLeft, 0, maxL);
      parent.scrollTop = clamp(newScrollTop, 0, maxT);
      this._scrollPos = { left: parent.scrollLeft, top: parent.scrollTop };
    }

    this.onZoomChange?.(newZoom);
    this.scheduleRender();
  }

  // ========== 渲染辅助方法 ==========

  protected scheduleRender(): void {
    if (this.pendingRender) return;
    this.pendingRender = true;

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    this.rafId = requestAnimationFrame(() => {
      this.pendingRender = false;
      this.render();
    });
  }

  protected renderVisibleCells(): void {
    if (!this.layer || !this.cellGroup) return;

    const { startRow, endRow, startCol, endCol } = this.calculateVisibleRange();
    const cp = this._cellPixelSize;
    const visibleKeys = new Set<string>();

    // 更新或创建可见区域的 Rect
    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const key = `${row}-${col}`;
        visibleKeys.add(key);

        const cell = this.cellMap.get(key) ?? null;
        const isSelected = this.isCellSelected(row, col);
        const fill = this.getCellColor(cell, row, col);

        let rect = this.cellPool.get(key);

        if (!rect) {
          const context = this.getCellContext(row, col, false);
          const shape = this.createCellShape(context);
          if (shape instanceof Konva.Rect) {
            rect = shape;
          } else {
            // 如果不是 Rect，创建默认 Rect
            rect = new Konva.Rect({
              x: col * cp,
              y: row * cp,
              width: cp,
              height: cp,
              fill,
              stroke: isSelected ? this.selectionConfig.selectionColor : '#cccccc',
              strokeWidth: isSelected
                ? Math.max(1, cp * this.selectionConfig.selectionBorderWidth)
                : Math.max(0.5, cp * 0.02),
              listening: false,
            });
          }
          this.cellPool.set(key, rect);
          this.cellGroup.add(rect);
        } else {
          rect.x(col * cp);
          rect.y(row * cp);
          rect.width(cp);
          rect.height(cp);
          rect.fill(fill);
          rect.stroke(isSelected ? this.selectionConfig.selectionColor : '#cccccc');
          rect.strokeWidth(
            isSelected
              ? Math.max(1, cp * this.selectionConfig.selectionBorderWidth)
              : Math.max(0.5, cp * 0.02)
          );
          rect.visible(true);
        }
      }
    }

    // 隐藏不在可见区域的 Rect
    this.cellPool.forEach((rect, key) => {
      if (!visibleKeys.has(key)) {
        rect.visible(false);
      }
    });

    this.layer.batchDraw();
  }
}
