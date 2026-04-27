/**
 * 选择/高亮覆盖层
 */

import { Group, Rect } from 'konva/lib/Konva';
import type { BitmapGridEngine } from '../core/BitmapGridEngine';

/**
 * 高亮绘制类
 */
export class HighlightDraw {
  private engine: BitmapGridEngine;
  private group: Group;
  private highlightRect: Rect | null;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.group = new Group({ name: 'highlight' });
    this.highlightRect = null;
  }

  /**
   * 获取组
   */
  getGroup(): Group {
    return this.group;
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
