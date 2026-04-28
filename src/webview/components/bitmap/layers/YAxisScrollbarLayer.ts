/**
 * Y 轴 + 纵向滚动条 Konva 图层
 */

import Konva from 'konva';
import type { BitmapGridEngine } from '../core/BitmapGridEngine';
import { ScrollbarDraw } from '../draws/ScrollbarDraw';

const { Layer } = Konva;
type LayerType = InstanceType<typeof Layer>;

/**
 * Y 轴滚动条图层类
 */
export class YAxisScrollbarLayer {
  private layer: LayerType;
  private engine: BitmapGridEngine;
  private scrollbarDraw: ScrollbarDraw;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.layer = new Layer({ name: 'yAxisScrollbar' });
    this.scrollbarDraw = new ScrollbarDraw(engine);
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
      this.updateScrollbar();
    });

    eventBus.on('zoom:change', () => {
      this.updateScrollbar();
    });

    // 初始渲染
    this.updateScrollbar();
  }

  /**
   * 更新滚动条
   */
  private updateScrollbar(): void {
    this.scrollbarDraw.renderVertical();
  }

  /**
   * 销毁图层
   */
  destroy(): void {
    this.scrollbarDraw.destroy();
    this.layer.destroy();
  }
}
