/**
 * 工具栏 Konva 图层
 */

import { Layer } from 'konva/lib/Layer';
import type { BitmapGridEngine } from '../core/BitmapGridEngine';

/**
 * 工具栏图层类
 */
export class ToolbarLayer {
  private layer: Layer;
  private engine: BitmapGridEngine;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.layer = new Layer({ name: 'toolbar' });
  }

  /**
   * 获取图层
   */
  getLayer(): Layer {
    return this.layer;
  }

  /**
   * 初始化工具栏
   */
  initialize(): void {
    const eventBus = this.engine.getEventBus();

    eventBus.on('zoom:change', () => {
      this.updateZoomDisplay();
    });
  }

  /**
   * 更新缩放显示
   */
  private updateZoomDisplay(): void {
    // TODO: 实现缩放显示更新
  }

  /**
   * 销毁图层
   */
  destroy(): void {
    this.layer.destroy();
  }
}
