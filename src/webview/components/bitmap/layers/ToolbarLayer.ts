/**
 * 工具栏 Konva 图层
 */

import Konva from 'konva';
import type { BitmapGridEngine } from '../core/BitmapGridEngine';
import { ToolbarDraw } from '../draws/ToolbarDraw';

const { Layer } = Konva;
type LayerType = InstanceType<typeof Layer>;

/**
 * 工具栏图层类
 */
export class ToolbarLayer {
  private layer: LayerType;
  private engine: BitmapGridEngine;
  private toolbarDraw: ToolbarDraw;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.layer = new Layer({ name: 'toolbar' });
    this.toolbarDraw = new ToolbarDraw(engine);
  }

  /**
   * 获取图层
   */
  getLayer(): LayerType {
    return this.layer;
  }

  /**
   * 初始化工具栏
   */
  initialize(): void {
    const eventBus = this.engine.getEventBus();

    eventBus.on('zoom:change', () => {
      this.updateToolbar();
    });

    // 初始渲染
    this.updateToolbar();
  }

  /**
   * 更新工具栏
   */
  private updateToolbar(): void {
    this.toolbarDraw.renderToolbar();
  }

  /**
   * 销毁图层
   */
  destroy(): void {
    this.toolbarDraw.destroy();
    this.layer.destroy();
  }
}
