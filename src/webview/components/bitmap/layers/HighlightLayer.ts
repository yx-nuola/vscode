/**
 * 高亮 Konva 图层
 */

import Konva from 'konva';
import type { BitmapGridEngine } from '../core/BitmapGridEngine';
import { HighlightDraw } from '../draws/HighlightDraw';

const { Layer } = Konva;
type LayerType = InstanceType<typeof Layer>;

/**
 * 高亮图层类
 */
export class HighlightLayer {
  private layer: LayerType;
  private engine: BitmapGridEngine;
  private highlightDraw: HighlightDraw;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.layer = new Layer({ name: 'highlight' });
    this.highlightDraw = new HighlightDraw(engine);

    // 将 HighlightDraw 的 group 添加到 layer 中
    this.layer.add(this.highlightDraw.getGroup());
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

    // 设置高亮位置
    const layout = layoutCalculator.calculate(
      this.engine.getStage()?.width() || 0,
      this.engine.getStage()?.height() || 0
    );
    this.highlightDraw.setPosition(layout.cellArea.x, layout.cellArea.y);

    eventBus.on('highlight', (data) => {
      if (data) {
        this.highlightDraw.draw(data.col, data.row);
      } else {
        this.highlightDraw.clear();
      }
    });

    eventBus.on('clear-highlight', () => {
      this.highlightDraw.clear();
    });

    eventBus.on('selection:change', (cell) => {
      if (cell) {
        this.highlightDraw.draw(cell.col, cell.row);
      } else {
        this.highlightDraw.clear();
      }
    });
  }

  /**
   * 销毁图层
   */
  destroy(): void {
    this.highlightDraw.destroy();
    this.layer.destroy();
  }
}
