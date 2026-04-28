/**
 * 格子网格渲染 Konva 图层
 */

import Konva from 'konva';
import type { BitmapGridEngine } from '../core/BitmapGridEngine';
import { CellDraw } from '../draws/CellDraw';

const { Layer } = Konva;
type LayerType = InstanceType<typeof Layer>;

/**
 * 格子图层类
 */
export class CellLayer {
  private layer: LayerType;
  private engine: BitmapGridEngine;
  private cellDraw: CellDraw;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.layer = new Layer({ name: 'cell' });
    this.cellDraw = new CellDraw(engine);
  }

  /**
   * 获取图层
   */
  getLayer(): LayerType {
    return this.layer;
  }

  /**
   * 初始化图层
   */
  initialize(): void {
    const eventBus = this.engine.getEventBus();

    eventBus.on('scroll:change', () => {
      this.renderVisibleCells();
    });

    eventBus.on('zoom:change', () => {
      this.renderVisibleCells();
    });

    eventBus.on('locate', () => {
      this.renderVisibleCells();
    });
  }

  /**
   * 渲染可见格子
   */
  private renderVisibleCells(): void {
    const virtualScrollSync = this.engine.getVirtualScrollSync();
    const dataManager = this.engine.getDataManager();
    const scrollState = this.engine.getScrollState();

    // 获取当前可视范围
    const visibleRange = virtualScrollSync.getVisibleRange(scrollState.scrollX, scrollState.scrollY);

    // 获取可视区域的数据
    const visibleCells = dataManager.getDataByArea(
      visibleRange.startRow,
      visibleRange.endRow,
      visibleRange.startCol,
      visibleRange.endCol
    );

    // 渲染格子
    this.cellDraw.renderCells(visibleCells);
  }

  /**
   * 销毁图层
   */
  destroy(): void {
    this.cellDraw.destroy();
    this.layer.destroy();
  }
}
