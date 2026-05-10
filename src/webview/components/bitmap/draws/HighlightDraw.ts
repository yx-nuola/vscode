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

  setClip(width: number, height: number): void {
    this.group.clipX(0);
    this.group.clipY(0);
    this.group.clipWidth(width);
    this.group.clipHeight(height);
  }

  /**
   * 绘制高亮
   */
  draw(col: number, row: number): void {
    const config = this.engine.getConfig();
    const theme = config.theme;
    const cellSize = this.engine.getZoomLevel();
    const scrollState = this.engine.getScrollState();

    if (this.highlightRect) {
      this.highlightRect.destroy();
    }

    this.highlightRect = new Rect({
      x: col * cellSize - scrollState.scrollX,
      y: row * cellSize - scrollState.scrollY,
      width: cellSize,
      height: cellSize,
      stroke: theme.highlightColor,
      strokeWidth: 2,
      listening: false,
    });

    this.group.add(this.highlightRect);
    this.group.getLayer()?.batchDraw();
  }

  /**
   * 清除高亮
   */
  clear(): void {
    if (this.highlightRect) {
      this.highlightRect.destroy();
      this.highlightRect = null;
      this.group.getLayer()?.batchDraw();
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
