/**
 * 坐标轴刻度 + 标签渲染
 */

import Konva from 'konva';
import type { BitmapGridEngine } from '../core/BitmapGridEngine';

const { Group, Line, Text } = Konva;
type GroupType = InstanceType<typeof Group>;

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
   * 设置 X 轴组位置
   */
  setXAxisPosition(x: number, y: number): void {
    this.xAxisGroup.x(x);
    this.xAxisGroup.y(y);
  }

  /**
   * 设置 Y 轴组位置
   */
  setYAxisPosition(x: number, y: number): void {
    this.yAxisGroup.x(x);
    this.yAxisGroup.y(y);
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

    const layout = layoutCalculator.calculate(
      this.engine.getStage()?.width() || 0,
      this.engine.getStage()?.height() || 0
    );

    const { xAxis } = layout;
    const cellSize = virtualScrollSync.currentCellSize;
    const totalCols = virtualScrollSync.getTotalCols();
    const visibleRange = virtualScrollSync.getVisibleRange(scrollState.scrollX, scrollState.scrollY);
    const step = this.calculateStep(totalCols);

    // 绘制 X 轴线
    const axisLine = new Line({
      points: [0, xAxis.height - 1, xAxis.width, xAxis.height - 1],
      stroke: theme.axisColor,
      strokeWidth: 1,
    });
    this.xAxisGroup.add(axisLine);

    // 从可见范围起始列对齐 step，确保滚动后始终有刻度可见
    const firstTick = Math.ceil(visibleRange.startCol / step) * step;
    const lastTick = Math.min(visibleRange.endCol + step, totalCols);

    for (let col = firstTick; col <= lastTick; col += step) {
      if (col < 0 || col > totalCols) { continue; }

      const x = col * cellSize - scrollState.scrollX;

      // 刻度线
      const tick = new Line({
        points: [x, xAxis.height - 6, x, xAxis.height - 1],
        stroke: theme.axisColor,
        strokeWidth: 1,
      });
      this.xAxisGroup.add(tick);

      // 标签
      const label = new Text({
        x: x,
        y: xAxis.height - 20,
        text: col.toString(),
        fontSize: 10,
        fontFamily: 'Arial',
        fill: theme.axisTextColor,
        align: 'center',
        verticalAlign: 'top',
        offsetX: 0,
        offsetY: 0,
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

    const layout = layoutCalculator.calculate(
      this.engine.getStage()?.width() || 0,
      this.engine.getStage()?.height() || 0
    );

    const { yAxis } = layout;
    const cellSize = virtualScrollSync.currentCellSize;
    const totalRows = virtualScrollSync.getTotalRows();
    const visibleRange = virtualScrollSync.getVisibleRange(scrollState.scrollX, scrollState.scrollY);
    const step = this.calculateStep(totalRows);

    // 绘制 Y 轴线
    const axisLine = new Line({
      points: [yAxis.width - 1, 0, yAxis.width - 1, yAxis.height],
      stroke: theme.axisColor,
      strokeWidth: 1,
    });
    this.yAxisGroup.add(axisLine);

    // 从可见范围起始行对齐 step，确保滚动后始终有刻度可见
    const firstTick = Math.ceil(visibleRange.startRow / step) * step;
    const lastTick = Math.min(visibleRange.endRow + step, totalRows);

    for (let row = firstTick; row <= lastTick; row += step) {
      if (row < 0 || row > totalRows) { continue; }

      const y = row * cellSize - scrollState.scrollY;

      // 刻度线
      const tick = new Line({
        points: [yAxis.width - 6, y, yAxis.width - 1, y],
        stroke: theme.axisColor,
        strokeWidth: 1,
      });
      this.yAxisGroup.add(tick);

      // 标签
      const label = new Text({
        x: yAxis.width - 20,
        y: y,
        text: row.toString(),
        fontSize: 10,
        fontFamily: 'Arial',
        fill: theme.axisTextColor,
        align: 'right',
        verticalAlign: 'middle',
        offsetX: 0,
        offsetY: 0,
      });
      this.yAxisGroup.add(label);
    }
  }

  /**
   * 计算刻度步长（基于数据总量，不随滚动变化）
   * 目标：确保坐标轴上始终有合理密度的刻度
   */
  private calculateStep(totalCount: number): number {
    if (totalCount <= 64) { return 2; }
    if (totalCount <= 128) { return 5; }
    return 10;
  }

  /**
   * 销毁绘制
   */
  destroy(): void {
    this.xAxisGroup.destroy();
    this.yAxisGroup.destroy();
  }
}
