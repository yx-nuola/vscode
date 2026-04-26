/**
 * 坐标轴刻度 + 标签渲染
 */

import { Group, Line, Text } from 'konva/lib/Konva';
import type { BitmapGridEngine } from '../core/BitmapGridEngine';

/**
 * 坐标轴绘制类
 */
export class AxisDraw {
  private engine: BitmapGridEngine;
  private xAxisGroup: Group;
  private yAxisGroup: Group;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.xAxisGroup = new Group({ name: 'xAxis' });
    this.yAxisGroup = new Group({ name: 'yAxis' });
  }

  /**
   * 获取 X 轴组
   */
  getXAxisGroup(): Group {
    return this.xAxisGroup;
  }

  /**
   * 获取 Y 轴组
   */
  getYAxisGroup(): Group {
    return this.yAxisGroup;
  }

  /**
   * 渲染 X 轴
   */
  renderXAxis(): void {
    const config = this.engine.getConfig();
    const theme = config.theme;

    this.xAxisGroup.destroyChildren();

    // TODO: 实现自适应刻度步长、线宽算法自适应
  }

  /**
   * 渲染 Y 轴
   */
  renderYAxis(): void {
    const config = this.engine.getConfig();
    const theme = config.theme;

    this.yAxisGroup.destroyChildren();

    // TODO: 实现自适应刻度步长、线宽算法自适应
  }

  /**
   * 销毁绘制
   */
  destroy(): void {
    this.xAxisGroup.destroy();
    this.yAxisGroup.destroy();
  }
}
