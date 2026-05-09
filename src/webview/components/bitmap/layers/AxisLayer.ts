/**
 * 坐标轴 + 滚动条 Konva 图层（合并版）
 */

import Konva from 'konva';
import type { BitmapGridEngine } from '../core/BitmapGridEngine';
import { AxisDraw } from '../draws/AxisDraw';
import { ScrollbarDraw } from '../draws/ScrollbarDraw';

const { Layer } = Konva;
type LayerType = InstanceType<typeof Layer>;

/**
 * 坐标轴 + 滚动条图层类
 */
export class AxisLayer {
  private layer: LayerType;
  private engine: BitmapGridEngine;
  private axisDraw: AxisDraw;
  private scrollbarDraw: ScrollbarDraw;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.layer = new Layer({ name: 'axis' });
    this.axisDraw = new AxisDraw(engine);
    this.scrollbarDraw = new ScrollbarDraw(engine);

    // 将所有 Group 添加到 layer 中
    this.layer.add(this.axisDraw.getXAxisGroup());
    this.layer.add(this.axisDraw.getYAxisGroup());
    this.layer.add(this.scrollbarDraw.getHorizontalGroup());
    this.layer.add(this.scrollbarDraw.getVerticalGroup());
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

    // 设置初始位置
    const layout = layoutCalculator.calculate(
      this.engine.getStage()?.width() || 0,
      this.engine.getStage()?.height() || 0
    );

    this.axisDraw.setXAxisPosition(layout.xAxis.x, layout.xAxis.y);
    this.axisDraw.setYAxisPosition(layout.yAxis.x, layout.yAxis.y);
    this.scrollbarDraw.setHorizontalPosition(layout.horizontalScrollbar.x, layout.horizontalScrollbar.y);
    this.scrollbarDraw.setVerticalPosition(layout.verticalScrollbar.x, layout.verticalScrollbar.y);

    // 监听滚动和缩放事件
    eventBus.on('scroll:change', () => {
      this.update();
    });

    eventBus.on('zoom:change', () => {
      this.update();
    });

    // 初始渲染
    this.update();
  }

  /**
   * 更新坐标轴和滚动条
   */
  private update(): void {
    const layoutCalculator = this.engine.getLayoutCalculator();
    const layout = layoutCalculator.calculate(
      this.engine.getStage()?.width() || 0,
      this.engine.getStage()?.height() || 0
    );

    // 更新坐标轴
    this.axisDraw.renderXAxis();
    this.axisDraw.renderYAxis();

    // 更新滚动条位置和渲染
    // 注意：render 方法内部会检查是否正在拖动，如果拖动中只更新边界而不改变位置
    this.scrollbarDraw.setHorizontalPosition(layout.horizontalScrollbar.x, layout.horizontalScrollbar.y);
    this.scrollbarDraw.renderHorizontal();
    this.scrollbarDraw.setVerticalPosition(layout.verticalScrollbar.x, layout.verticalScrollbar.y);
    this.scrollbarDraw.renderVertical();
  }

  /**
   * 销毁图层
   */
  destroy(): void {
    this.axisDraw.destroy();
    this.scrollbarDraw.destroy();
    this.layer.destroy();
  }
}
