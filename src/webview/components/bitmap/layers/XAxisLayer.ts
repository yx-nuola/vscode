/**
 * X 轴 Konva 图层
 */

import Konva from 'konva';
import type { BitmapGridEngine } from '../core/BitmapGridEngine';
import { AxisDraw } from '../draws/AxisDraw';

const { Layer } = Konva;
type LayerType = InstanceType<typeof Layer>;

/**
 * X 轴图层类
 */
export class XAxisLayer {
  private layer: LayerType;
  private engine: BitmapGridEngine;
  private axisDraw: AxisDraw;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.layer = new Layer({ name: 'xAxis' });
    this.axisDraw = new AxisDraw(engine);

    // 将 AxisDraw 的 group 添加到 layer 中
    this.layer.add(this.axisDraw.getXAxisGroup());
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

    // 设置 X 轴位置
    const layout = layoutCalculator.calculate(
      this.engine.getStage()?.width() || 0,
      this.engine.getStage()?.height() || 0
    );
    this.axisDraw.setXAxisPosition(layout.xAxis.x, layout.xAxis.y);

    eventBus.on('scroll:change', () => {
      this.updateAxis();
    });

    eventBus.on('zoom:change', () => {
      this.updateAxis();
    });

    // 初始渲染
    this.updateAxis();
  }

  /**
   * 更新坐标轴
   */
  private updateAxis(): void {
    this.axisDraw.renderXAxis();
  }

  /**
   * 销毁图层
   */
  destroy(): void {
    this.axisDraw.destroy();
    this.layer.destroy();
  }
}
