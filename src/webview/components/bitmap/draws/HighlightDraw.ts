/**
 * 选择/高亮覆盖层
 */

import Konva from 'konva';
import type { BitmapGridEngine } from '../core/BitmapGridEngine';

const { Group, Rect } = Konva;
type GroupType = InstanceType<typeof Group>;
type RectType = InstanceType<typeof Rect>;

/**
 * 高亮绘制类
 */
export class HighlightDraw {
  private engine: BitmapGridEngine;
  private group: GroupType;
  private highlightRect: RectType | null;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.group = new Group({ name: 'highlight' });
    this.highlightRect = null;
  }

  /**
   * 获取组
   */
  getGroup(): GroupType {
    return this.group;
  }

  /**
   * 设置高亮位置
   */
  setPosition(x: number, y: number): void {
    this.group.x(x);
    this.group.y(y);
  }

  /**
   * 绘制高亮
   */
  draw(col: number, row: number): void {
    const config = this.engine.getConfig();
    const theme = config.theme;
    const cellSize = this.engine.getZoomLevel();

    if (this.highlightRect) {
      this.highlightRect.destroy();
    }

    this.highlightRect = new Rect({
      x: col * cellSize,
      y: row * cellSize,
      width: cellSize,
      height: cellSize,
      stroke: theme.highlightColor,
      strokeWidth: 2,
    });

    this.group.add(this.highlightRect);
  }

  /**
   * 清除高亮
   */
  clear(): void {
    if (this.highlightRect) {
      this.highlightRect.destroy();
      this.highlightRect = null;
    }
  }

  /**
   * 销毁绘制
   */
  destroy(): void {
    this.clear();
    this.group.destroy();
  }
}
