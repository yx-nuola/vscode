import Konva from 'konva';
import type { BitmapGridEngine } from '../core/BitmapGridEngine';
import type { Area, VisibleRange } from '../types';

const { Group, Line, Text } = Konva;
type GroupType = InstanceType<typeof Group>;

export interface AxisRenderState {
  area: Area;
  cellSize: number;
  scrollX: number;
  scrollY: number;
  totalRows: number;
  totalCols: number;
  visibleRange: VisibleRange;
}

export abstract class BaseAxisDraw {
  protected readonly engine: BitmapGridEngine;
  protected readonly group: GroupType;

  constructor(engine: BitmapGridEngine, name: string) {
    this.engine = engine;
    this.group = new Group({ name });
  }

  getGroup(): GroupType {
    return this.group;
  }

  setPosition(x: number, y: number): void {
    this.group.x(x);
    this.group.y(y);
  }

  render(state: AxisRenderState): void {
    this.group.destroyChildren();
    this.renderAxisLine(state);
    this.renderTicks(state);
  }

  destroy(): void {
    this.group.destroy();
  }

  protected abstract renderAxisLine(state: AxisRenderState): void;

  protected abstract renderTicks(state: AxisRenderState): void;

  protected addLine(points: number[]): void {
    const theme = this.engine.getConfig().theme;
    this.group.add(
      new Line({
        points,
        stroke: theme.axisColor,
        strokeWidth: 1,
      })
    );
  }

  protected addLabel(options: {
    x: number;
    y: number;
    text: string;
    align: 'center' | 'right';
    verticalAlign: 'top' | 'middle';
  }): void {
    const theme = this.engine.getConfig().theme;
    this.group.add(
      new Text({
        x: options.x,
        y: options.y,
        text: options.text,
        fontSize: 10,
        fontFamily: 'Arial',
        fill: theme.axisTextColor,
        align: options.align,
        verticalAlign: options.verticalAlign,
        offsetX: 0,
        offsetY: 0,
      })
    );
  }

  protected calculateStep(totalCount: number): number {
    if (totalCount <= 64) {
      return 2;
    }
    if (totalCount <= 128) {
      return 5;
    }
    return 10;
  }
}
