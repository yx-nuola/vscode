/**
 * X 轴 + 横向滚动条 Konva 图层
 */

import Konva from 'konva';
import type { BitmapGridEngine } from '../core/BitmapGridEngine';
import { ScrollbarDraw } from '../draws/ScrollbarDraw';

const { Layer } = Konva;
type LayerType = InstanceType<typeof Layer>;

/**
 * X 轴滚动条图层类
 */
export class XAxisScrollbarLayer {
  private layer: LayerType;
  private engine: BitmapGridEngine;
  private scrollbarDraw: ScrollbarDraw;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.layer = new Layer({ name: 'xAxisScrollbar' });
    this.scrollbarDraw = new ScrollbarDraw(engine);

    // 将 ScrollbarDraw 的 group 添加到 layer 中
    this.layer.add(this.scrollbarDraw.getHorizontalGroup());
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
    const layoutCalculator = this.engine.getLayoutCalculator();

    // 设置横向滚动条位置
    const layout = layoutCalculator.calculate(
      this.engine.getStage()?.width() || 0,
      this.engine.getStage()?.height() || 0
    );
    this.scrollbarDraw.setHorizontalPosition(layout.horizontalScrollbar.x, layout.horizontalScrollbar.y);

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
    const layoutCalculator = this.engine.getLayoutCalculator();
    const layout = layoutCalculator.calculate(
      this.engine.getStage()?.width() || 0,
      this.engine.getStage()?.height() || 0
    );
    this.scrollbarDraw.setHorizontalPosition(layout.horizontalScrollbar.x, layout.horizontalScrollbar.y);
    this.scrollbarDraw.renderHorizontal();
  }

  /**
   * 销毁图层
   */
  destroy(): void {
    this.scrollbarDraw.destroy();
    this.layer.destroy();
  }
}
