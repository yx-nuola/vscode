/**
 * 主引擎，编排所有模块
 */

import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import type { BitmapGridConfig, MatrixData, ColorRule, BitmapTheme, ScrollState, CellData } from '../types';
import { EventBus } from './EventBus';
import { LayoutCalculator } from './LayoutCalculator';
import { DataManager } from './DataManager';
import { VirtualScrollSync } from './VirtualScrollSync';

/**
 * Bitmap Grid 引擎类
 */
export class BitmapGridEngine {
  private stage: Stage | null;
  private layers: Map<string, Layer>;
  private eventBus: EventBus;
  private layoutCalculator: LayoutCalculator;
  private dataManager: DataManager;
  private virtualScrollSync: VirtualScrollSync;
  private config: BitmapGridConfig;
  private container: HTMLElement | null;
  private scrollState: ScrollState;
  private cellSize: number;
  private selectedCell: CellData | null;

  constructor(config: BitmapGridConfig) {
    this.stage = null;
    this.layers = new Map();
    this.eventBus = new EventBus();
    this.layoutCalculator = new LayoutCalculator(config.layout);
    this.dataManager = new DataManager();
    this.virtualScrollSync = new VirtualScrollSync(0, 0, config.initialCellSize || 10);
    this.config = config;
    this.container = null;
    this.scrollState = { scrollX: 0, scrollY: 0 };
    this.cellSize = config.initialCellSize || 10;
    this.selectedCell = null;
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

    this.virtualScrollSync.updateViewport(width, height);

    this.setupEventListeners();
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
      this.config.callbacks?.onCellClick?.(cell);
    });

    this.eventBus.on('cell:hover', (cell) => {
      this.config.callbacks?.onCellHover?.(cell);
    });
  }

  /**
   * 销毁引擎
   */
  destroy(): void {
    this.eventBus.clear();
    this.dataManager.clear();
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

    this.virtualScrollSync.updateViewport(width, height);

    const layout = this.layoutCalculator.calculate(width, height);
    this.virtualScrollSync.updateViewport(layout.cellArea.width, layout.cellArea.height);
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
    this.virtualScrollSync.updateDataSize(data.rows, data.cols);
  }

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
    const maxCellSize = this.config.maxCellSize || 50;
    const newSize = Math.min(this.cellSize + 2, maxCellSize);
    this.setCellSize(newSize);
  }

  /**
   * 缩小
   */
  zoomOut(): void {
    const minCellSize = this.config.minCellSize || 2;
    const newSize = Math.max(this.cellSize - 2, minCellSize);
    this.setCellSize(newSize);
  }

  /**
   * 重置缩放
   */
  resetZoom(): void {
    this.setCellSize(this.config.initialCellSize || 10);
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
    if (cell) {
      this.selectedCell = cell;
      this.eventBus.emit('selection:change', cell);
    }
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
  getStage(): Stage | null {
    return this.stage;
  }

  /**
   * 添加图层
   */
  addLayer(name: string, layer: Layer): void {
    this.layers.set(name, layer);
    this.stage?.add(layer);
  }

  /**
   * 获取图层
   */
  getLayer(name: string): Layer | undefined {
    return this.layers.get(name);
  }
}
