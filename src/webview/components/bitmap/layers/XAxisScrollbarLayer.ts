/**
 * X 轴 + 横向滚动条 Konva 图层
 */

import { Layer } from 'konva/lib/Layer';
import type { BitmapGridEngine } from '../core/BitmapGridEngine';

/**
 * X 轴滚动条图层类
 */
export class XAxisScrollbarLayer {
  private layer: Layer;
  private engine: BitmapGridEngine;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.layer = new Layer({ name: 'xAxisScrollbar' });
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

    eventBus.on('scroll:horizontal', (scrollX) => {
      this.updateXAxisLabels(scrollX);
    });
  }

  /**
   * 更新 X 轴标签
   */
  private updateXAxisLabels(scrollX: number): void {
    // TODO: 实现标签更新
  }

  /**
   * 销毁图层
   */
  destroy(): void {
    this.layer.destroy();
  }
}
