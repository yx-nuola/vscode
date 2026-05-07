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

    // 获取布局
    const layout = layoutCalculator.calculate(
      this.engine.getStage()?.width() || 0,
      this.engine.getStage()?.height() || 0
    );

    const { xAxis } = layout;
    const cellSize = virtualScrollSync.currentCellSize;
    const dataManager = this.engine.getDataManager();
    const totalCols = dataManager.cols;

    // 计算可见范围
    const visibleRange = virtualScrollSync.getVisibleRange(scrollState.scrollX, scrollState.scrollY);

    // 计算刻度步长（基于整个数据范围，不受滚动影响）
    const step = this.calculateStep(totalCols);

    // 绘制 X 轴线
    const axisLine = new Line({
      points: [0, xAxis.height - 1, xAxis.width, xAxis.height - 1],
      stroke: theme.axisColor,
      strokeWidth: 1,
    });
    this.xAxisGroup.add(axisLine);

    // 绘制刻度和标签：遍历所有列号，只绘制落在可见范围内的
    for (let col = 0; col < totalCols; col += step) {
      // 列号在可视范围内才绘制
      if (col < visibleRange.startCol || col > visibleRange.endCol) continue;

      // 根据滚动偏移计算刻度在轴上的位置
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

    // 获取布局
    const layout = layoutCalculator.calculate(
      this.engine.getStage()?.width() || 0,
      this.engine.getStage()?.height() || 0
    );

    const { yAxis } = layout;
    const cellSize = virtualScrollSync.currentCellSize;
    const dataManager = this.engine.getDataManager();
    const totalRows = dataManager.rows;

    // 计算可见范围
    const visibleRange = virtualScrollSync.getVisibleRange(scrollState.scrollX, scrollState.scrollY);

    // 计算刻度步长（基于整个数据范围，不受滚动影响）
    const step = this.calculateStep(totalRows);

    // 绘制 Y 轴线
    const axisLine = new Line({
      points: [yAxis.width - 1, 0, yAxis.width - 1, yAxis.height],
      stroke: theme.axisColor,
      strokeWidth: 1,
    });
    this.yAxisGroup.add(axisLine);

    // 绘制刻度和标签：遍历所有行号，只绘制落在可见范围内的
    for (let row = 0; row < totalRows; row += step) {
      // 行号在可视范围内才绘制
      if (row < visibleRange.startRow || row > visibleRange.endRow) continue;

      // 根据滚动偏移计算刻度在轴上的位置
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
   */
  private calculateStep(totalCount: number): number {
    if (totalCount <= 10) return 1;
    if (totalCount <= 20) return 2;
    if (totalCount <= 50) return 5;
    if (totalCount <= 100) return 10;
    if (totalCount <= 200) return 20;
    if (totalCount <= 500) return 50;
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
