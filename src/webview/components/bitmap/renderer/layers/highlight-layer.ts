/**
 * 高亮 Konva 图层
 */

import Konva from 'konva';
import type { BitmapGridEngine } from '../../utils/bitmap-gridEngine';
import type { CellData } from '../../types';
import { HighlightDraw } from '../draws/highlight-draw';

const { Layer } = Konva;
type LayerType = InstanceType<typeof Layer>;

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

  handle(data: CellData | null): void {
    if (data) {
      this.highlightDraw.draw(data.col, data.row);
    } else {
      this.highlightDraw.clear();
    }
  };

  /**
   * 初始化图层
   */
  initialize(): void {
    const eventBus = this.engine.getEventBus();
    this.updateLayout();

    // eventBus.on('highlight', (data) => this.handle(data));

    // eventBus.on('clear-highlight', () => {
    //   this.highlightDraw.clear();
    // });

    eventBus.on('selection:change', (data) => {
      this.handle(data);
    });

    eventBus.on('scroll:change', () => {
      this.redrawSelectedCell();
    });

    eventBus.on('zoom:change', () => {
      this.redrawSelectedCell();
    });

    eventBus.on('layout:change', () => {
      this.updateLayout();
      this.redrawSelectedCell();
    });

    eventBus.on('data:change', () => {
      this.redrawSelectedCell();
    });

    eventBus.on('theme:change', () => {
      this.redrawSelectedCell();
    });
  }

  private redrawSelectedCell(): void {
    const selectedCell = this.engine.getSelectedCell();
    this.handle(selectedCell);
  }

  private updateLayout(): void {
    const layout = this.engine.getLayout();
    this.highlightDraw.setPosition(layout.cellArea.x, layout.cellArea.y);
    this.highlightDraw.setClip(layout.cellArea.width, layout.cellArea.height);
  }

  /**
   * 销毁图层
   */
  destroy(): void {
    this.highlightDraw.destroy();
    this.layer.destroy();
  }
}
