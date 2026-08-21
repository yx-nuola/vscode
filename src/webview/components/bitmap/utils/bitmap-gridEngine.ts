import Konva from 'konva';
import type {
  BitmapGridConfig,
  MatrixData,
  ColorRule,
  BitmapTheme,
  ScrollState,
  CellData,
  LayoutResult,
} from '../types';
import { VirtualScrollSync, DataManager, LayoutCalculator, EventBus } from './index';
import { AxisLayer, CellLayer, HighlightLayer } from '../renderer/layers';
import { LocationManager, SelectionManager } from '../renderer/tools';
import { DEFAULT_CELL_SIZE, MAX_CELL_SIZE, DEFAULT_COLS, DEFAULT_ROWS } from '../constants';

const { Stage } = Konva;
type StageType = InstanceType<typeof Stage>;

const DRAG_SCROLL_THRESHOLD = 4;

interface DragScrollState {
  pointerId: number;
  startX: number;
  startY: number;
  startScrollX: number;
  startScrollY: number;
  moved: boolean;
}

export class BitmapGridEngine {
  private stage: StageType | null;
  private eventBus: EventBus;
  private layoutCalculator: LayoutCalculator;
  private dataManager: DataManager;
  private virtualScrollSync: VirtualScrollSync;
  private config: BitmapGridConfig;
  private container: HTMLElement | null;
  private scrollState: ScrollState;
  private cellSize: number;
  private locationManager: LocationManager;
  private selectionManager: SelectionManager;
  private wheelHandler: ((event: WheelEvent) => void) | null;
  private keydownHandler: ((event: KeyboardEvent) => void) | null;
  private pointerDownHandler: (() => void) | null;
  private dragPointerDownHandler: ((event: PointerEvent) => void) | null;
  private dragPointerMoveHandler: ((event: PointerEvent) => void) | null;
  private dragPointerUpHandler: ((event: PointerEvent) => void) | null;
  private dragClickHandler: ((event: MouseEvent) => void) | null;
  private dragScrollState: DragScrollState | null;
  private suppressNextClick: boolean;
  private suppressClickTimer: ReturnType<typeof setTimeout> | null;

  // 图层实例
  private axisLayer: AxisLayer;
  private cellLayer: CellLayer;
  private highlightLayer: HighlightLayer;

  constructor(config: BitmapGridConfig) {
    this.stage = null;
    this.eventBus = new EventBus();
    this.layoutCalculator = new LayoutCalculator(config.layout);
    this.dataManager = new DataManager();
    this.virtualScrollSync = new VirtualScrollSync(DEFAULT_ROWS, DEFAULT_COLS, DEFAULT_CELL_SIZE);
    this.config = config;
    this.container = null;
    this.scrollState = { scrollX: 0, scrollY: 0 };
    this.cellSize = this.clampCellSize(config.initialCellSize ?? DEFAULT_CELL_SIZE);
    this.virtualScrollSync.updateCellSize(this.cellSize);
    this.layoutCalculator.updateContentSize(DEFAULT_ROWS, DEFAULT_COLS);
    this.locationManager = new LocationManager(this);
    this.selectionManager = new SelectionManager(this);
    this.wheelHandler = null;
    this.keydownHandler = null;
    this.pointerDownHandler = null;
    this.dragPointerDownHandler = null;
    this.dragPointerMoveHandler = null;
    this.dragPointerUpHandler = null;
    this.dragClickHandler = null;
    this.dragScrollState = null;
    this.suppressNextClick = false;
    this.suppressClickTimer = null;

    // 初始化图层
    this.axisLayer = new AxisLayer(this);
    this.cellLayer = new CellLayer(this);
    this.highlightLayer = new HighlightLayer(this);
  }

  /**
   * 初始化引擎
   */
  initialize(container: HTMLDivElement): void {
    this.container = container;
    const initialLayout = this.getLayout();

    this.stage = new Stage({
      container,
      width: this.getStageWidth(initialLayout),
      height: this.getStageHeight(initialLayout),
      offset: { x: -0.5, y: -0.5 },
    });

    // 同步格子区域的实际视口尺寸
    this.virtualScrollSync.updateViewport(
      initialLayout.cellArea.width,
      initialLayout.cellArea.height
    );
    this.clampCurrentScroll();

    // 初始化并添加图层
    this.setupLayers();

    this.setupEventListeners();

    // 添加鼠标滚轮
    this.setupWheelEvents();
    // 支持键盘快捷键选中
    this.setupKeydownEvents();
    this.setupFocusEvents();
    this.setupDragScrollEvents();
  }

  /**
   * 设置图层
   */
  private setupLayers(): void {
    // 滚动条必须在最顶层，否则会被其他图层覆盖
    this.stage?.add(this.axisLayer.getLayer());
    this.stage?.add(this.cellLayer.getLayer());
    this.stage?.add(this.highlightLayer.getLayer());

    // 初始化图层
    this.axisLayer.initialize();
    this.cellLayer.initialize();
    this.highlightLayer.initialize();
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    this.eventBus.on('scroll:change', (state) => {
      this.scrollState = state;
      this.config.callbacks?.onScrollChange?.(state);
    });

    this.eventBus.on('zoom:change', (size) => {
      this.cellSize = size;
      this.config.callbacks?.onZoomChange?.(size);
    });

    this.eventBus.on('selection:change', (cell) => {
      this.config.callbacks?.onSelectionChange?.(cell);
    });

    this.eventBus.on('cell:click', (cell) => {
      this.selectCell(cell.col, cell.row);
      this.config.callbacks?.onCellClick?.(cell);
    });

    this.eventBus.on('cell:hover', (cell) => {
      if (cell) {
        this.config.callbacks?.onCellHover?.(cell);
      }
    });
  }

  /**
   * 设置鼠标滚轮事件
   */
  private setupWheelEvents(): void {
    if (!this.container) {
      return;
    }

    this.wheelHandler = (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey) {
        if (e.deltaY < 0) {
          this.zoomIn();
        } else if (e.deltaY > 0) {
          this.zoomOut();
        }
        return;
      }

      const deltaX = e.deltaX;
      const deltaY = e.deltaY;

      // 根据滚轮方向滚动
      const scrollSpeed = 1; // 滚动速度倍数
      const newScrollX = this.scrollState.scrollX + deltaX * scrollSpeed;
      const newScrollY = this.scrollState.scrollY + deltaY * scrollSpeed;

      this.scrollTo(newScrollX, newScrollY);
    };

    this.container.addEventListener('wheel', this.wheelHandler, { passive: false });
  }

  /**
   * 设置键盘快捷键事件
   */
  private setupKeydownEvents(): void {
    if (!this.container) {
      return;
    }

    this.keydownHandler = (e: KeyboardEvent) => {
      const dataManager = this.dataManager;
      const totalRows = Math.max(dataManager.rows, DEFAULT_ROWS);
      const totalCols = Math.max(dataManager.cols, DEFAULT_COLS);

      const current = this.getSelectedCell();
      if (!current) {
        // 没有选中格子时不处理
        return;
      }

      let nextCol = current.col;
      let nextRow = current.row;

      switch (e.key) {
        case 'ArrowUp':
          nextRow = current.row - 1;
          break;
        case 'ArrowDown':
          nextRow = current.row + 1;
          break;
        case 'ArrowLeft':
          nextCol = current.col - 1;
          break;
        case 'ArrowRight':
          nextCol = current.col + 1;
          break;
        default:
          return; // 不处理其他键
      }
      e.preventDefault();

      // 边界 clamp，越界则不动
      nextCol = Math.max(0, Math.min(nextCol, totalCols - 1));
      nextRow = Math.max(0, Math.min(nextRow, totalRows - 1));
      if (nextCol === current.col && nextRow === current.row) {
        return;
      }
      // 移出视口时自动滚动带进视口
      this.locateAndHighlight(nextCol, nextRow);
    };

    this.container.addEventListener('keydown', this.keydownHandler, { passive: false });
  }

  private setupFocusEvents(): void {
    if (!this.container) {
      return;
    }

    this.pointerDownHandler = () => {
      this.container?.focus();
    };
    this.container.addEventListener('pointerdown', this.pointerDownHandler);
  }

  /**
   * 按住鼠标左键拖动画布，并同步更新滚动条。
   */
  private setupDragScrollEvents(): void {
    if (!this.container) {
      return;
    }

    this.dragPointerDownHandler = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || event.button !== 0 || !this.container) {
        return;
      }

      const rect = this.container.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;
      const { cellArea } = this.getLayout();
      const isInCellArea =
        pointerX >= cellArea.x &&
        pointerX <= cellArea.x + cellArea.width &&
        pointerY >= cellArea.y &&
        pointerY <= cellArea.y + cellArea.height;

      if (!isInCellArea) {
        return;
      }

      this.dragScrollState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startScrollX: this.scrollState.scrollX,
        startScrollY: this.scrollState.scrollY,
        moved: false,
      };
    };

    this.dragPointerMoveHandler = (event: PointerEvent) => {
      const dragState = this.dragScrollState;
      if (!dragState || event.pointerId !== dragState.pointerId) {
        return;
      }

      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;
      if (!dragState.moved && Math.hypot(deltaX, deltaY) < DRAG_SCROLL_THRESHOLD) {
        return;
      }

      if (!dragState.moved && this.container) {
        this.container.setPointerCapture(event.pointerId);
      }

      dragState.moved = true;
      event.preventDefault();
      if (this.container) {
        this.container.style.cursor = 'grabbing';
      }
      this.scrollTo(dragState.startScrollX - deltaX, dragState.startScrollY - deltaY);
    };

    this.dragPointerUpHandler = (event: PointerEvent) => {
      const dragState = this.dragScrollState;
      if (!dragState || event.pointerId !== dragState.pointerId) {
        return;
      }

      this.suppressNextClick = dragState.moved && event.type === 'pointerup';
      this.dragScrollState = null;
      if (this.container) {
        this.container.style.cursor = '';
        if (this.container.hasPointerCapture(event.pointerId)) {
          this.container.releasePointerCapture(event.pointerId);
        }
      }

      if (this.suppressNextClick) {
        this.suppressClickTimer = setTimeout(() => {
          this.suppressNextClick = false;
          this.suppressClickTimer = null;
        }, 0);
      }
    };

    this.dragClickHandler = (event: MouseEvent) => {
      if (!this.suppressNextClick) {
        return;
      }
      this.suppressNextClick = false;
      event.preventDefault();
      event.stopPropagation();
    };

    this.container.addEventListener('pointerdown', this.dragPointerDownHandler);
    this.container.addEventListener('pointermove', this.dragPointerMoveHandler);
    this.container.addEventListener('pointerup', this.dragPointerUpHandler);
    this.container.addEventListener('pointercancel', this.dragPointerUpHandler);
    this.container.addEventListener('click', this.dragClickHandler, true);
  }

  /**
   * 销毁引擎
   */
  destroy(): void {
    if (this.container && this.wheelHandler) {
      this.container.removeEventListener('wheel', this.wheelHandler);
    }
    if (this.container && this.keydownHandler) {
      this.container.removeEventListener('keydown', this.keydownHandler);
    }
    if (this.container && this.pointerDownHandler) {
      this.container.removeEventListener('pointerdown', this.pointerDownHandler);
    }
    if (this.container && this.dragPointerDownHandler) {
      this.container.removeEventListener('pointerdown', this.dragPointerDownHandler);
    }
    if (this.container && this.dragPointerMoveHandler) {
      this.container.removeEventListener('pointermove', this.dragPointerMoveHandler);
    }
    if (this.container && this.dragPointerUpHandler) {
      this.container.removeEventListener('pointerup', this.dragPointerUpHandler);
      this.container.removeEventListener('pointercancel', this.dragPointerUpHandler);
    }
    if (this.container && this.dragClickHandler) {
      this.container.removeEventListener('click', this.dragClickHandler, true);
    }
    if (this.suppressClickTimer) {
      clearTimeout(this.suppressClickTimer);
    }
    this.wheelHandler = null;
    this.keydownHandler = null;
    this.pointerDownHandler = null;
    this.dragPointerDownHandler = null;
    this.dragPointerMoveHandler = null;
    this.dragPointerUpHandler = null;
    this.dragClickHandler = null;
    this.dragScrollState = null;
    this.suppressNextClick = false;
    this.suppressClickTimer = null;

    this.eventBus.clear();
    this.dataManager.clear();

    // 销毁所有图层（Layer 包装类负责销毁其内部 Konva.Layer）
    this.axisLayer.destroy();
    this.cellLayer.destroy();
    this.highlightLayer.destroy();

    this.stage?.destroy();
    this.stage = null;
    this.container = null;
  }

  /**
   * 调整尺寸
   */
  resize(width: number, height: number): void {
    if (!this.stage) {
      return;
    }

    const layout = this.layoutCalculator.calculate(width, height);
    this.stage.width(this.getStageWidth(layout));
    this.stage.height(this.getStageHeight(layout));

    // 同步格子区域的实际视口尺寸
    this.virtualScrollSync.updateViewport(layout.cellArea.width, layout.cellArea.height);
    this.clampCurrentScroll();
    this.eventBus.emit('layout:change', undefined);
  }

  getLayout(): LayoutResult {
    const { width, height } = this.container?.getBoundingClientRect() || { width: 0, height: 0 };
    return this.layoutCalculator.calculate(width, height);
  }

  private getStageWidth(layout: LayoutResult): number {
    return layout.verticalScrollbar.x + layout.verticalScrollbar.width;
  }

  private getStageHeight(layout: LayoutResult): number {
    return layout.horizontalScrollbar.y + layout.horizontalScrollbar.height;
  }

  private syncLayout(): void {
    if (!this.stage) {
      return;
    }

    const layout = this.getLayout();
    this.stage.width(this.getStageWidth(layout));
    this.stage.height(this.getStageHeight(layout));
    this.syncViewportWithLayout(layout);
    this.eventBus.emit('layout:change', undefined);
  }

  private syncViewportWithLayout(layout: LayoutResult): void {
    this.virtualScrollSync.updateViewport(layout.cellArea.width, layout.cellArea.height);
    this.clampCurrentScroll();
  }

  /**
   * 设置主题
   */
  setTheme(theme: BitmapTheme): void {
    this.config.theme = theme;
    this.eventBus.emit('theme:change', undefined);
  }

  /**
   * 同步 React 侧更新后的配置，避免回调和布局配置停留在初始化时的值。
   */
  updateConfig(config: BitmapGridConfig): void {
    const previousLayout = this.config.layout;
    const layoutChanged =
      previousLayout.axisSize !== config.layout.axisSize ||
      previousLayout.scrollbarSize !== config.layout.scrollbarSize ||
      previousLayout.spacing !== config.layout.spacing;
    const themeChanged = this.config.theme !== config.theme;
    const colorRulesChanged = this.config.colorRules !== config.colorRules;

    this.config = config;
    this.layoutCalculator.updateConfig(config.layout);

    const nextCellSize = this.clampCellSize(this.cellSize);
    if (nextCellSize !== this.cellSize) {
      this.setCellSize(nextCellSize);
    } else if (layoutChanged) {
      this.syncLayout();
    }

    if (themeChanged) {
      this.eventBus.emit('theme:change', undefined);
    }
    if (colorRulesChanged) {
      this.eventBus.emit('color-rules:change', undefined);
    }
  }

  /**
   * 设置数据
   */
  setData(data: MatrixData): void {
    this.clearSelection();
    this.dataManager.setData(data);
    const rows = Math.max(DEFAULT_ROWS, data.rows);
    const cols = Math.max(DEFAULT_COLS, data.cols);

    this.layoutCalculator.updateContentSize(rows, cols);
    this.virtualScrollSync.updateDataSize(rows, cols);
    this.syncLayout();

    // 触发数据更新事件，通知图层重新渲染
    this.eventBus.emit('data:change', data);
    this.revealNearestCellToOrigin(data.cells);
  }

  /**
   * 数据可能落在默认 64x64 视口外，加载后定位到离 (0,0) 最近的真实数据点。
   */
  private revealNearestCellToOrigin(cells: CellData[]): void {
    const nearestCell = cells.reduce<CellData | null>((nearest, cell) => {
      if (!nearest) {
        return cell;
      }

      const currentDistance = cell.row * cell.row + cell.col * cell.col;
      const nearestDistance = nearest.row * nearest.row + nearest.col * nearest.col;

      if (currentDistance !== nearestDistance) {
        return currentDistance < nearestDistance ? cell : nearest;
      }

      if (cell.row !== nearest.row) {
        return cell.row < nearest.row ? cell : nearest;
      }

      return cell.col < nearest.col ? cell : nearest;
    }, null);

    if (!nearestCell) {
      this.scrollTo(0, 0);
      return;
    }

    const topLeftRange = this.virtualScrollSync.getVisibleRange(0, 0);
    const isVisibleFromDefaultOrigin =
      nearestCell.row >= topLeftRange.startRow &&
      nearestCell.row <= topLeftRange.endRow &&
      nearestCell.col >= topLeftRange.startCol &&
      nearestCell.col <= topLeftRange.endCol;

    if (isVisibleFromDefaultOrigin) {
      this.scrollTo(0, 0);
    } else {
      this.locationManager.locateToCell(nearestCell.col, nearestCell.row);
      this.eventBus.emit('locate', { col: nearestCell.col, row: nearestCell.row });
    }

    this.selectCell(nearestCell.col, nearestCell.row);
  }

  /**
   * 设置颜色规则
   */
  setColorRules(rules: ColorRule[]): void {
    this.config.colorRules = rules;
    this.eventBus.emit('color-rules:change', undefined);
  }

  /**
   * 放大
   */
  zoomIn(): void {
    const newSize = Math.min(this.cellSize + 2, this.maxCellSize);
    this.setCellSize(newSize);
  }

  /**
   * 缩小
   */
  zoomOut(): void {
    const newSize = Math.max(this.cellSize - 2, this.minCellSize);
    this.setCellSize(newSize);
  }

  /**
   * 重置缩放
   */
  resetZoom(): void {
    this.setCellSize(this.config.initialCellSize ?? DEFAULT_CELL_SIZE);
  }

  /**
   * 设置格子尺寸
   */
  private setCellSize(size: number): void {
    const nextSize = this.clampCellSize(size);
    if (nextSize === this.cellSize) {
      return;
    }

    this.cellSize = nextSize;
    this.layoutCalculator.updateContentSize(
      this.virtualScrollSync.getTotalRows(),
      this.virtualScrollSync.getTotalCols()
    );
    this.virtualScrollSync.updateCellSize(nextSize);
    this.syncLayout();

    const selectedCell = this.getSelectedCell();
    if (selectedCell) {
      this.locationManager.ensureCellVisible(selectedCell.col, selectedCell.row);
    }

    this.eventBus.emit('zoom:change', nextSize);
  }

  private clampCellSize(size: number): number {
    return Math.max(this.minCellSize, Math.min(size, this.maxCellSize));
  }

  private get minCellSize(): number {
    return this.config.minCellSize ?? DEFAULT_CELL_SIZE;
  }

  private get maxCellSize(): number {
    return Math.max(this.minCellSize, this.config.maxCellSize ?? MAX_CELL_SIZE);
  }

  /**
   * 滚动到指定位置
   */
  scrollTo(scrollX: number, scrollY: number): void {
    const nextScrollState = this.virtualScrollSync.clampScrollState({ scrollX, scrollY });
    this.applyScrollState(nextScrollState);
  }

  private clampCurrentScroll(): void {
    const nextScrollState = this.virtualScrollSync.clampScrollState(this.scrollState);
    this.applyScrollState(nextScrollState);
  }

  private applyScrollState(nextScrollState: ScrollState): void {
    const changed =
      nextScrollState.scrollX !== this.scrollState.scrollX ||
      nextScrollState.scrollY !== this.scrollState.scrollY;

    this.scrollState = nextScrollState;

    if (changed) {
      this.eventBus.emit('scroll:change', this.scrollState);
    }
  }

  /**
   * 选择格子
   */
  selectCell(col: number, row: number): void {
    this.selectionManager.selectCell(col, row);
  }

  /**
   * 清除选择
   */
  clearSelection(): void {
    this.selectionManager.clearSelection();
  }

  /**
   * 定位并高亮格子
   */
  locateAndHighlight(col: number, row: number): void {
    this.locationManager.locateToCell(col, row);
    this.eventBus.emit('locate', { col, row });
    this.selectCell(col, row);
  }

  /**
   * 获取缩放级别
   */
  getZoomLevel(): number {
    return this.cellSize;
  }

  /**
   * 获取滚动状态
   */
  getScrollState(): ScrollState {
    return { ...this.scrollState };
  }

  /**
   * 获取选中的格子
   */
  getSelectedCell(): CellData | null {
    return this.selectionManager.getSelectedCell();
  }

  /**
   * 获取事件总线
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }

  /**
   * 获取布局计算器
   */
  getLayoutCalculator(): LayoutCalculator {
    return this.layoutCalculator;
  }

  /**
   * 获取数据管理器
   */
  getDataManager(): DataManager {
    return this.dataManager;
  }

  /**
   * 获取虚拟滚动同步
   */
  getVirtualScrollSync(): VirtualScrollSync {
    return this.virtualScrollSync;
  }

  /**
   * 获取配置
   */
  getConfig(): BitmapGridConfig {
    return { ...this.config };
  }

  /**
   * 获取 Stage
   */
  getStage(): StageType | null {
    return this.stage;
  }
}
