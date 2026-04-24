import Konva from 'konva';
import {
  AbstractKonvaGrid,
  GridConfig,
  AxisConfig,
  CellCoord,
  ViewState,
  MatrixData,
  CellRenderContext,
  VisibleRange,
} from './AbstractKonvaGrid';

const MIN_ZOOM = 0.8;
const MAX_ZOOM = 1.4;
const ZOOM_STEP = 0.1;
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

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export abstract class BaseKonvaGrid<T> extends AbstractKonvaGrid<T> {
  // ========== Konva 核心对象 ==========
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
  protected _cellPixelSize = 12;
  protected _baseCellSize = 12;
  protected _scrollPos = { left: 0, top: 0 };
  
  // ========== 缓存 ==========
  protected cellPool: Map<string, Konva.Rect> = new Map();
  protected cellMap: Map<string, T> = new Map();
  
  // ========== RAF 相关 ==========
  private rafId: number | null = null;
  private pendingRender = false;
  
  // ========== 拖拽状态 ==========
  private isDragging = false;
  private lastPointer = { x: 0, y: 0 };
  
  // ========== 必需实现的属性 ==========
  abstract readonly config: GridConfig;
  abstract readonly axisConfig: AxisConfig;
  abstract data: MatrixData<T>;
  
  constructor() {
    super();
    
    // 绑定方法
    this.handleWheel = this.handleWheel.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
  }
  
  // ========== Getter/Setter ==========
  
  get viewState(): ViewState {
    return this._viewState;
  }
  
  get selectedCell(): CellCoord | null {
    return this._selectedCell;
  }
  
  get cellPixelSize(): number {
    return this._cellPixelSize;
  }
  
  get contentWidth(): number {
    return Math.max(1, this.data.cols) * this._cellPixelSize;
  }
  
  get contentHeight(): number {
    return Math.max(1, this.data.rows) * this._cellPixelSize;
  }
  
  // ========== 初始化方法 ==========
  
  initialize(container: HTMLDivElement): void {
    this.container = container;
    
    // 从配置初始化基础格子大小
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
      width: this.contentWidth,
      height: this.contentHeight,
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
    if (this.container && this.container.parentElement) {
      this.container.parentElement.addEventListener('scroll', this.handleScroll, { passive: true });
    }
  }
  
  // ========== 事件处理器 ==========
  
  protected handleWheel(e: Konva.KonvaEventObject<WheelEvent>): void {
    e.evt.preventDefault();
    
    // 只有按住 Ctrl 键时才进行缩放
    if (!e.evt.ctrlKey) return;
    
    if (!this.stage || !this.container) return;
    
    const pointer = this.stage.getPointerPosition();
    if (!pointer) return;
    
    const oldZoom = this._viewState.zoom;
    const nextZoom = e.evt.deltaY < 0
      ? clamp(oldZoom + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM)
      : clamp(oldZoom - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM);
    
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
      
      this.panBy(dx, dy);
    } else {
      // 处理悬停
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
    
    const context = this.getCellContext(row, col, false);
    this.onCellClick?.(context, e.evt);
  }
  
  protected handleScroll(): void {
    if (!this.container || !this.container.parentElement) return;
    
    const parent = this.container.parentElement;
    this._scrollPos = { left: parent.scrollLeft, top: parent.scrollTop };
    this.onScrollChange?.(parent.scrollLeft, parent.scrollTop);
    this.scheduleRender();
  }
  
  protected handleHover(event: MouseEvent): void {
    if (!this.stage) return;
    if (!this.onCellHover) return;
    
    const pointer = this.stage.getPointerPosition();
    if (!pointer) return;
    
    const cp = this._cellPixelSize;
    const col = Math.floor(pointer.x / cp);
    const row = Math.floor(pointer.y / cp);
    
    if (row < 0 || col < 0 || row >= this.data.rows || col >= this.data.cols) return;
    
    const context = this.getCellContext(row, col, true);
    this.onCellHover(context, event);
  }
  
  // ========== 核心功能方法 ==========
  
  protected getCellContext(row: number, col: number, hovered: boolean): CellRenderContext<T> {
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
      isSelected: this._selectedCell?.row === row && this._selectedCell?.col === col,
      isHovered: hovered,
    };
  }
  
  protected calculateVisibleRange(): VisibleRange {
    const cp = this._cellPixelSize;
    const scrollLeft = this._scrollPos.left;
    const scrollTop = this._scrollPos.top;
    
    const mergedAxisConfig = { ...DEFAULT_AXIS_CONFIG, ...this.axisConfig };
    const vw = this.viewportSize.width - (mergedAxisConfig.showY ? mergedAxisConfig.axisWidth! : 0);
    const vh = this.viewportSize.height - (mergedAxisConfig.showX ? mergedAxisConfig.axisHeight! : 0);
    
    // Overscan：扩展可见区域
    const overscanPixels = Math.max(vw, vh) * OVERSCAN_COUNT;
    
    const startCol = Math.max(0, Math.floor((scrollLeft - overscanPixels) / cp));
    const startRow = Math.max(0, Math.floor((scrollTop - overscanPixels) / cp));
    const endCol = Math.min(this.data.cols, Math.ceil((scrollLeft + vw + overscanPixels) / cp));
    const endRow = Math.min(this.data.rows, Math.ceil((scrollTop + vh + overscanPixels) / cp));
    
    return { startRow, endRow, startCol, endCol };
  }
  
  // ========== 缩放控制 ==========
  
  zoomIn(step: number = ZOOM_STEP): void {
    const newZoom = clamp(this._viewState.zoom + step, MIN_ZOOM, MAX_ZOOM);
    this.setZoom(newZoom);
  }
  
  zoomOut(step: number = ZOOM_STEP): void {
    const newZoom = clamp(this._viewState.zoom - step, MIN_ZOOM, MAX_ZOOM);
    this.setZoom(newZoom);
  }
  
  setZoom(zoom: number): void {
    const clampedZoom = clamp(zoom, MIN_ZOOM, MAX_ZOOM);
    if (clampedZoom === this._viewState.zoom) return;
    
    const centerX = this.viewportSize.width / 2;
    const centerY = this.viewportSize.height / 2;
    
    this.updateZoom(clampedZoom, { x: centerX, y: centerY });
  }
  
  protected updateZoom(newZoom: number, centerPoint?: { x: number; y: number }): void {
    const oldZoom = this._viewState.zoom;
    const oldPixel = this._baseCellSize * oldZoom;
    const newPixel = this._baseCellSize * newZoom;
    
    this._viewState = { ...this._viewState, zoom: newZoom };
    this._cellPixelSize = newPixel;
    
    // 更新 stage 尺寸
    if (this.stage) {
      this.stage.width(this.contentWidth);
      this.stage.height(this.contentHeight);
    }
    
    // 调整滚动位置以保持在中心点
    if (this.container && this.container.parentElement && centerPoint) {
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
  
  fitToScreen(): void {
    if (!this.container) return;
    
    const vw = this.viewportSize.width;
    const vh = this.viewportSize.height;
    
    if (this.data.rows <= 0 || this.data.cols <= 0) return;
    
    const zW = vw / (this.data.cols * this._baseCellSize);
    const zH = vh / (this.data.rows * this._baseCellSize);
    const fitZoom = clamp(Math.min(zW, zH), MIN_ZOOM, MAX_ZOOM);
    
    this._viewState = { zoom: fitZoom, offsetX: 0, offsetY: 0 };
    this._cellPixelSize = this._baseCellSize * fitZoom;
    
    if (this.container.parentElement) {
      this.container.parentElement.scrollTo({ left: 0, top: 0 });
      this._scrollPos = { left: 0, top: 0 };
    }
    
    this.onZoomChange?.(fitZoom);
    this.onScrollChange?.(0, 0);
    this.scheduleRender();
  }
  
  resetView(): void {
    this._viewState = DEFAULT_VIEW;
    this._cellPixelSize = this._baseCellSize;
    
    if (this.container && this.container.parentElement) {
      this.container.parentElement.scrollTo({ left: 0, top: 0 });
      this._scrollPos = { left: 0, top: 0 };
    }
    
    this.onZoomChange?.(DEFAULT_VIEW.zoom);
    this.onScrollChange?.(0, 0);
    this.scheduleRender();
  }
  
  // ========== 滚动/平移 ==========
  
  protected panBy(deltaX: number, deltaY: number): void {
    if (!this.container || !this.container.parentElement) return;
    
    const parent = this.container.parentElement;
    parent.scrollLeft -= deltaX;
    parent.scrollTop -= deltaY;
    
    this._scrollPos = { left: parent.scrollLeft, top: parent.scrollTop };
    this.onScrollChange?.(parent.scrollLeft, parent.scrollTop);
  }
  
  scrollTo(x: number, y: number): void {
    if (!this.container || !this.container.parentElement) return;
    
    const parent = this.container.parentElement;
    const maxL = Math.max(0, parent.scrollWidth - parent.clientWidth);
    const maxT = Math.max(0, parent.scrollHeight - parent.clientHeight);
    
    parent.scrollLeft = clamp(x, 0, maxL);
    parent.scrollTop = clamp(y, 0, maxT);
    
    this._scrollPos = { left: parent.scrollLeft, top: parent.scrollTop };
    this.onScrollChange?.(parent.scrollLeft, parent.scrollTop);
    this.scheduleRender();
  }
  
  // ========== 格子选择 ==========
  
  selectCell(row: number, col: number): void {
    if (row < 0 || col < 0 || row >= this.data.rows || col >= this.data.cols) return;
    
    this._selectedCell = { row, col };
    this.scheduleRender();
  }
  
  clearSelection(): void {
    this._selectedCell = null;
    this.scheduleRender();
  }
  
  // ========== 渲染方法 ==========
  
  protected render(): void {
    this.onBeforeRender?.();
    this.renderVisibleCells();
    this.renderAxis();
    this.onAfterRender?.();
  }
  
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
        const isSelected = this._selectedCell?.row === row && this._selectedCell?.col === col;
        const fill = this.getCellColor(cell, row, col);
        
        let rect = this.cellPool.get(key);
        
        if (!rect) {
          rect = new Konva.Rect({
            x: col * cp,
            y: row * cp,
            width: cp,
            height: cp,
            fill,
            stroke: isSelected ? '#ff0000' : '#cccccc',
            strokeWidth: isSelected ? Math.max(1, cp * 0.08) : Math.max(0.5, cp * 0.02),
            listening: false,
          });
          this.cellPool.set(key, rect);
          this.cellGroup.add(rect);
        } else {
          rect.x(col * cp);
          rect.y(row * cp);
          rect.width(cp);
          rect.height(cp);
          rect.fill(fill);
          rect.stroke(isSelected ? '#ff0000' : '#cccccc');
          rect.strokeWidth(isSelected ? Math.max(1, cp * 0.08) : Math.max(0.5, cp * 0.02));
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
  
  protected renderAxis(): void {
    // 基类提供空实现，子类可覆盖
    // 坐标轴渲染逻辑较为复杂，建议由具体子类实现或单独提取 AxisRenderer
  }
  
  // ========== 数据更新 ==========
  
  setData(data: MatrixData<T>): void {
    this.data = data;
    this.buildCellMap();
    
    // 更新 stage 尺寸
    if (this.stage) {
      this.stage.width(this.contentWidth);
      this.stage.height(this.contentHeight);
    }
    
    this.scheduleRender();
  }
  
  updateColorConfig(): void {
    // 触发重绘，颜色会根据新的配置重新计算
    this.scheduleRender();
  }
  
  // ========== 销毁 ==========
  
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
}
