/**
 * Y 轴 + 纵向滚动条 Konva 图层
 */

import { Layer } from 'konva/lib/Layer';
import type { BitmapGridEngine } from '../core/BitmapGridEngine';

/**
 * Y 轴滚动条图层类
 */
export class YAxisScrollbarLayer {
  private layer: Layer;
  private engine: BitmapGridEngine;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.layer = new Layer({ name: 'yAxisScrollbar' });
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

    eventBus.on('scroll:vertical', (scrollY) => {
      this.updateYAxisLabels(scrollY);
    });
  }

  /**
   * 更新 Y 轴标签
   */
  private updateYAxisLabels(scrollY: number): void {
    // TODO: 实现标签更新
  }

  /**
   * 销毁图层
   */
  destroy(): void {
    this.layer.destroy();
  }
}
