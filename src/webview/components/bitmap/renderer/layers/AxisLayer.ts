/**
 * 坐标轴 + 滚动条 Konva 图层
 */

import Konva from 'konva';
import type { BitmapGridEngine } from '../../core/BitmapGridEngine';
import type { LayoutResult } from '../../types';
import { HorizontalAxisDraw, VerticalAxisDraw, HorizontalScrollbarDraw, VerticalScrollbarDraw } from '../draws';



const { Layer } = Konva;
type LayerType = InstanceType<typeof Layer>;

/**
 * 坐标轴 + 滚动条图层
 */
export class AxisLayer {
  private layer: LayerType;
  private engine: BitmapGridEngine;
  private horizontalAxisDraw: HorizontalAxisDraw;
  private verticalAxisDraw: VerticalAxisDraw;
  private horizontalScrollbarDraw: HorizontalScrollbarDraw;
  private verticalScrollbarDraw: VerticalScrollbarDraw;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.layer = new Layer({ name: 'axis' });
    this.horizontalAxisDraw = new HorizontalAxisDraw(engine);
    this.verticalAxisDraw = new VerticalAxisDraw(engine);
    this.horizontalScrollbarDraw = new HorizontalScrollbarDraw(engine);
    this.verticalScrollbarDraw = new VerticalScrollbarDraw(engine);

    this.layer.add(this.horizontalAxisDraw.getGroup());
    this.layer.add(this.verticalAxisDraw.getGroup());
    this.layer.add(this.horizontalScrollbarDraw.getGroup());
    this.layer.add(this.verticalScrollbarDraw.getGroup());
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

    this.updatePositions();

    eventBus.on('scroll:change', () => {
      this.update();
    });

    eventBus.on('zoom:change', () => {
      this.update();
    });

    eventBus.on('data:change', () => {
      this.update();
    });

    this.update();
  }

  /**
   * 更新坐标轴和滚动条
   */
  private update(): void {
    this.updatePositions();

    const virtualScrollSync = this.engine.getVirtualScrollSync();
    const scrollState = this.engine.getScrollState();
    const layout = this.getLayout();
    const visibleRange = virtualScrollSync.getVisibleRange(scrollState.scrollX, scrollState.scrollY);
    const axisState = {
      cellSize: virtualScrollSync.currentCellSize,
      scrollX: scrollState.scrollX,
      scrollY: scrollState.scrollY,
      totalRows: virtualScrollSync.getTotalRows(),
      totalCols: virtualScrollSync.getTotalCols(),
      visibleRange,
    };

    this.horizontalAxisDraw.render({
      ...axisState,
      area: layout.xAxis,
    });
    this.verticalAxisDraw.render({
      ...axisState,
      area: layout.yAxis,
    });

    this.horizontalScrollbarDraw.render({
      area: layout.horizontalScrollbar,
      scrollbar: virtualScrollSync.getScrollbarState(
        scrollState.scrollX,
        scrollState.scrollY,
        layout.horizontalScrollbar.width,
        layout.horizontalScrollbar.height
      ),
    });
    this.verticalScrollbarDraw.render({
      area: layout.verticalScrollbar,
      scrollbar: virtualScrollSync.getScrollbarState(
        scrollState.scrollX,
        scrollState.scrollY,
        layout.verticalScrollbar.width,
        layout.verticalScrollbar.height
      ),
    });
  }

  private updatePositions(): void {
    const layout = this.getLayout();

    this.horizontalAxisDraw.setPosition(layout.xAxis.x, layout.xAxis.y);
    this.verticalAxisDraw.setPosition(layout.yAxis.x, layout.yAxis.y);
    this.horizontalScrollbarDraw.setPosition(layout.horizontalScrollbar.x, layout.horizontalScrollbar.y);
    this.verticalScrollbarDraw.setPosition(layout.verticalScrollbar.x, layout.verticalScrollbar.y);
  }

  private getLayout(): LayoutResult {
    return this.engine.getLayoutCalculator().calculate(
      this.engine.getStage()?.width() || 0,
      this.engine.getStage()?.height() || 0
    );
  }

  /**
   * 销毁图层
   */
  destroy(): void {
    this.horizontalAxisDraw.destroy();
    this.verticalAxisDraw.destroy();
    this.horizontalScrollbarDraw.destroy();
    this.verticalScrollbarDraw.destroy();
    this.layer.destroy();
  }
}
