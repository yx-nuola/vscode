/**
 * 坐标轴刻度 + 标签渲染
 */

import Konva from 'konva';
import type { BitmapGridEngine } from '../core/BitmapGridEngine';

const { Group, Line, Text } = Konva;
type GroupType = InstanceType<typeof Group>;
type LineType = InstanceType<typeof Line>;
type TextType = InstanceType<typeof Text>;

/**
 * 坐标轴绘制类
 */
export class AxisDraw {
  private engine: BitmapGridEngine;
  private xAxisGroup: GroupType;
  private yAxisGroup: GroupType;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.xAxisGroup = new Group({ name: 'xAxis' });
    this.yAxisGroup = new Group({ name: 'yAxis' });
  }

  /**
   * 获取 X 轴组
   */
  getXAxisGroup(): GroupType {
    return this.xAxisGroup;
  }

  /**
   * 获取 Y 轴组
   */
  getYAxisGroup(): GroupType {
    return this.yAxisGroup;
  }

  /**
   * 渲染 X 轴
   */
  renderXAxis(): void {
    const config = this.engine.getConfig();
    const theme = config.theme;
    const layoutCalculator = this.engine.getLayoutCalculator();
    const virtualScrollSync = this.engine.getVirtualScrollSync();
    const scrollState = this.engine.getScrollState();

    this.xAxisGroup.destroyChildren();

    // 获取布局
    const layout = layoutCalculator.calculate(
      this.engine.getStage()?.width() || 0,
      this.engine.getStage()?.height() || 0
    );

    const { xAxis } = layout;
    const cellSize = virtualScrollSync.currentCellSize;

    // 计算可见范围
    const visibleRange = virtualScrollSync.getVisibleRange(scrollState.scrollX, scrollState.scrollY);

    // 计算刻度步长（自适应）
    const step = this.calculateStep(visibleRange.endCol - visibleRange.startCol + 1);

    // 绘制 X 轴线
    const axisLine = new Line({
      points: [xAxis.x, xAxis.y + xAxis.height, xAxis.x + xAxis.width, xAxis.y + xAxis.height],
      stroke: theme.axisColor,
      strokeWidth: 1,
    });
    this.xAxisGroup.add(axisLine);

    // 绘制刻度和标签
    for (let col = visibleRange.startCol; col <= visibleRange.endCol; col += step) {
      const x = xAxis.x + (col - visibleRange.startCol) * cellSize;

      // 刻度线
      const tick = new Line({
        points: [x, xAxis.y + xAxis.height - 5, x, xAxis.y + xAxis.height],
        stroke: theme.axisColor,
        strokeWidth: 1,
      });
      this.xAxisGroup.add(tick);

      // 标签
      const label = new Text({
        x: x,
        y: xAxis.y + 2,
        text: col.toString(),
        fontSize: 10,
        fontFamily: 'Arial',
        fill: theme.axisTextColor,
        align: 'center',
      });
      this.xAxisGroup.add(label);
    }
  }

  /**
   * 渲染 Y 轴
   */
  renderYAxis(): void {
    const config = this.engine.getConfig();
    const theme = config.theme;
    const layoutCalculator = this.engine.getLayoutCalculator();
    const virtualScrollSync = this.engine.getVirtualScrollSync();
    const scrollState = this.engine.getScrollState();

    this.yAxisGroup.destroyChildren();

    // 获取布局
    const layout = layoutCalculator.calculate(
      this.engine.getStage()?.width() || 0,
      this.engine.getStage()?.height() || 0
    );

    const { yAxis } = layout;
    const cellSize = virtualScrollSync.currentCellSize;

    // 计算可见范围
    const visibleRange = virtualScrollSync.getVisibleRange(scrollState.scrollX, scrollState.scrollY);

    // 计算刻度步长（自适应）
    const step = this.calculateStep(visibleRange.endRow - visibleRange.startRow + 1);

    // 绘制 Y 轴线
    const axisLine = new Line({
      points: [yAxis.x + yAxis.width, yAxis.y, yAxis.x + yAxis.width, yAxis.y + yAxis.height],
      stroke: theme.axisColor,
      strokeWidth: 1,
    });
    this.yAxisGroup.add(axisLine);

    // 绘制刻度和标签
    for (let row = visibleRange.startRow; row <= visibleRange.endRow; row += step) {
      const y = yAxis.y + (row - visibleRange.startRow) * cellSize;

      // 刻度线
      const tick = new Line({
        points: [yAxis.x + yAxis.width - 5, y, yAxis.x + yAxis.width, y],
        stroke: theme.axisColor,
        strokeWidth: 1,
      });
      this.yAxisGroup.add(tick);

      // 标签
      const label = new Text({
        x: yAxis.x + 2,
        y: y,
        text: row.toString(),
        fontSize: 10,
        fontFamily: 'Arial',
        fill: theme.axisTextColor,
        align: 'left',
      });
      this.yAxisGroup.add(label);
    }
  }

  /**
   * 计算刻度步长
   */
  private calculateStep(visibleCount: number): number {
    // 根据可见数量自适应计算步长
    if (visibleCount <= 10) return 1;
    if (visibleCount <= 20) return 2;
    if (visibleCount <= 50) return 5;
    if (visibleCount <= 100) return 10;
    if (visibleCount <= 200) return 20;
    if (visibleCount <= 500) return 50;
    return 100;
  }

  /**
   * 销毁绘制
   */
  destroy(): void {
    this.xAxisGroup.destroy();
    this.yAxisGroup.destroy();
  }
}
