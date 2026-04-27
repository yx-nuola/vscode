/**
 * 格子网格渲染 Konva 图层
 */

import { Layer } from 'konva/lib/Layer';
import type { BitmapGridEngine } from '../core/BitmapGridEngine';

/**
 * 格子图层类
 */
export class CellLayer {
  private layer: Layer;
  private engine: BitmapGridEngine;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.layer = new Layer({ name: 'cell' });
  }

  /**
   * 获取图层
   */
  getLayer(): Layer {
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
  }

  /**
   * 渲染可见格子
   */
  private renderVisibleCells(): void {
    // TODO: 实现格子渲染
  }

  /**
   * 销毁图层
   */
  destroy(): void {
    this.layer.destroy();
  }
}
