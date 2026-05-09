/**
 * 主引擎，编排所有模块
 */

import Konva from 'konva';
import type { BitmapGridConfig, MatrixData, ColorRule, BitmapTheme, ScrollState, CellData } from '../types';
import { EventBus } from './EventBus';
import { LayoutCalculator } from './LayoutCalculator';
import { DataManager } from './DataManager';
import { VirtualScrollSync } from './VirtualScrollSync';
import { AxisLayer } from '../layers/AxisLayer';
import { CellLayer } from '../layers/CellLayer';
import { HighlightLayer } from '../layers/HighlightLayer';

const { Stage, Layer } = Konva;
type StageType = InstanceType<typeof Stage>;
type LayerType = InstanceType<typeof Layer>;

// 固定常量
const BITMAP_WIDTH = 896;
const DEFAULT_CELL_SIZE = 14;
const MAX_CELL_SIZE = 56;
const DEFAULT_COLS = 64;
const DEFAULT_ROWS = 64;

/**
 * Bitmap Grid 引擎类
 */
export class BitmapGridEngine {
  private stage: StageType | null;
  private layers: Map<string, LayerType>;
  private eventBus: EventBus;
  private layoutCalculator: LayoutCalculator;
  private dataManager: DataManager;
  private virtualScrollSync: VirtualScrollSync;
  private config: BitmapGridConfig;
  private container: HTMLElement | null;
  private scrollState: ScrollState;
  private cellSize: number;
  private selectedCell: CellData | null;

  // 图层实例
  private axisLayer: AxisLayer;
  private cellLayer: CellLayer;
  private highlightLayer: HighlightLayer;

  constructor(config: BitmapGridConfig) {
    this.stage = null;
    this.layers = new Map();
    this.eventBus = new EventBus();
    this.layoutCalculator = new LayoutCalculator(config.layout);
    this.dataManager = new DataManager();
    this.virtualScrollSync = new VirtualScrollSync(DEFAULT_ROWS, DEFAULT_COLS, DEFAULT_CELL_SIZE);
    this.config = config;
    this.container = null;
    this.scrollState = { scrollX: 0, scrollY: 0 };
    this.cellSize = DEFAULT_CELL_SIZE;
    this.selectedCell = null;

    // 初始化图层
    this.axisLayer = new AxisLayer(this);
    this.cellLayer = new CellLayer(this);
    this.highlightLayer = new HighlightLayer(this);
  }

  /**
   * 初始化引擎
   */
  initialize(container: HTMLElement): void {
    this.container = container;

    const { width, height } = container.getBoundingClientRect();

    this.stage = new Stage({
      container: container.id,
      width,
      height,
    });

    // 计算布局，获取格子区域尺寸
    const layout = this.layoutCalculator.calculate(width, height);
    // 只更新视口高度，宽度固定为 BITMAP_WIDTH
    this.virtualScrollSync.updateViewport(BITMAP_WIDTH, layout.cellArea.height);

    // 初始化并添加图层
    this.setupLayers();

    this.setupEventListeners();

    // 添加鼠标滚轮支持
    this.setupWheelEvents();
  }

  /**
   * 设置图层
   */
  private setupLayers(): void {
    // 添加所有图层到 stage（注意顺序：后面的图层会覆盖前面的）
    this.addLayer('cell', this.cellLayer.getLayer());
    this.addLayer('axis', this.axisLayer.getLayer());
    this.addLayer('highlight', this.highlightLayer.getLayer());

    // 初始化图层
    this.cellLayer.initialize();
    this.axisLayer.initialize();
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
      this.selectedCell = cell;
      this.config.callbacks?.onSelectionChange?.(cell);
    });

    this.eventBus.on('cell:click', (cell) => {
      this.selectCell(cell.col, cell.row);
      this.config.callbacks?.onCellClick?.(cell);
    });

    this.eventBus.on('cell:hover', (cell) => {
      this.config.callbacks?.onCellHover?.(cell);
    });
  }

  /**
   * 设置鼠标滚轮事件
   */
  private setupWheelEvents(): void {
    if (!this.container) return;

    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();

      const deltaX = e.deltaX;
      const deltaY = e.deltaY;

      // 根据滚轮方向滚动
      const scrollSpeed = 1; // 滚动速度倍数
      const newScrollX = this.scrollState.scrollX + deltaX * scrollSpeed;
      const newScrollY = this.scrollState.scrollY + deltaY * scrollSpeed;

      this.scrollTo(newScrollX, newScrollY);
    }, { passive: false });
  }

  /**
   * 销毁引擎
   */
  destroy(): void {
    this.eventBus.clear();
    this.dataManager.clear();

    // 销毁所有图层
    this.axisLayer.destroy();
    this.cellLayer.destroy();
    this.highlightLayer.destroy();

    this.layers.forEach((layer) => layer.destroy());
    this.layers.clear();
    this.stage?.destroy();
    this.stage = null;
    this.container = null;
  }

  /**
   * 调整尺寸
   */
  resize(width: number, height: number): void {
    if (!this.stage) return;

    this.stage.width(width);
    this.stage.height(height);

    const layout = this.layoutCalculator.calculate(width, height);
    // 只更新视口高度，宽度固定为 BITMAP_WIDTH
    this.virtualScrollSync.updateViewport(BITMAP_WIDTH, layout.cellArea.height);
  }

  /**
   * 设置主题
   */
  setTheme(theme: BitmapTheme): void {
    this.config.theme = theme;
  }

  /**
   * 设置数据
   */
  setData(data: MatrixData): void {
    this.dataManager.setData(data);

    // 使用实际数据的行列数，但最小为 64x64
    const rows = Math.max(DEFAULT_ROWS, data.rows);
    const cols = Math.max(DEFAULT_COLS, data.cols);
    this.virtualScrollSync.updateDataSize(rows, cols);

    // 触发数据更新事件，通知图层重新渲染
    this.eventBus.emit('data:change', data);
  }

  /**
   * 自动计算合适的cellSize以全屏展示
   */
  // private autoFitCellSize(): void {
  //   if (!this.stage) return;

  //   const layout = this.layoutCalculator.calculate(this.stage.width(), this.stage.height());
  //   const cellAreaWidth = layout.cellArea.width;

  //   // 优先根据 X 轴宽度计算格子大小，确保 64 列完全占满 X 轴
  //   const cellSizeX = cellAreaWidth / 64;

  //   // 确保cellSize在合理范围内
  //   const minSize = this.config.minCellSize || 2;
  //   const maxSize = this.config.maxCellSize || 50;
  //   const finalCellSize = Math.max(minSize, Math.min(cellSizeX, maxSize));

  //   this.setCellSize(finalCellSize);
  // }

  /**
   * 设置颜色规则
   */
  setColorRules(rules: ColorRule[]): void {
    this.config.colorRules = rules;
  }

  /**
   * 放大
   */
  zoomIn(): void {
    const newSize = Math.min(this.cellSize + 2, MAX_CELL_SIZE);
    this.setCellSize(newSize);
  }

  /**
   * 缩小
   */
  zoomOut(): void {
    const newSize = Math.max(this.cellSize - 2, DEFAULT_CELL_SIZE);
    this.setCellSize(newSize);
  }

  /**
   * 重置缩放
   */
  resetZoom(): void {
    this.setCellSize(DEFAULT_CELL_SIZE);
  }

  /**
   * 设置格子尺寸
   */
  private setCellSize(size: number): void {
    this.cellSize = size;
    this.virtualScrollSync.updateCellSize(size);
    this.eventBus.emit('zoom:change', size);
  }

  /**
   * 滚动到指定位置
   */
  scrollTo(scrollX: number, scrollY: number): void {
    const maxScrollX = this.virtualScrollSync.maxScrollX;
    const maxScrollY = this.virtualScrollSync.maxScrollY;

    this.scrollState = {
      scrollX: Math.max(0, Math.min(scrollX, maxScrollX)),
      scrollY: Math.max(0, Math.min(scrollY, maxScrollY)),
    };

    this.eventBus.emit('scroll:change', this.scrollState);
  }

  /**
   * 选择格子
   */
  selectCell(col: number, row: number): void {
    const cell = this.dataManager.getCell(row, col);
    // 即使没有数据，也创建一个临时的格子对象用于选中
    const selectedCell = cell || {
      row,
      col,
      value: -1, // 特殊值表示无数据
    };
    this.selectedCell = selectedCell;
    this.eventBus.emit('selection:change', selectedCell);
  }

  /**
   * 清除选择
   */
  clearSelection(): void {
    this.selectedCell = null;
    this.eventBus.emit('selection:change', null);
  }

  /**
   * 定位并高亮格子
   */
  locateAndHighlight(col: number, row: number): void {
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
    return this.selectedCell;
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

  /**
   * 添加图层
   */
  addLayer(name: string, layer: LayerType): void {
    this.layers.set(name, layer);
    this.stage?.add(layer);
  }

  /**
   * 获取图层
   */
  getLayer(name: string): LayerType | undefined {
    return this.layers.get(name);
  }
}
