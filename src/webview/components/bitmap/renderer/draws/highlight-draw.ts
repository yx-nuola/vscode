/**
 * 选择/高亮覆盖层
 */

import Konva from 'konva';
import type { BitmapGridEngine } from '../../utils/bitmap-gridEngine';

const { Animation, Group, Rect } = Konva;
type AnimationType = InstanceType<typeof Animation>;
type GroupType = InstanceType<typeof Group>;
type RectType = InstanceType<typeof Rect>;

/**
 * 高亮绘制类
 */
export class HighlightDraw {
  private engine: BitmapGridEngine;
  private group: GroupType;
  private highlightRect: RectType;
  private pulseAnimation: AnimationType | null;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.group = new Group({ name: 'highlight' });
    this.highlightRect = new Rect({
      listening: false,
      visible: false,
    });
    this.group.add(this.highlightRect);
    this.pulseAnimation = null;
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

    this.highlightRect.setAttrs({
      x: col * cellSize - scrollState.scrollX,
      y: row * cellSize - scrollState.scrollY,
      width: cellSize,
      height: cellSize,
      stroke: theme.highlightColor,
      strokeWidth: 2,
      opacity: 1,
      shadowColor: theme.highlightColor,
      shadowBlur: Math.max(4, cellSize * 0.18),
      shadowOpacity: 0.35,
      visible: true,
    });

    this.startPulse();
    this.group.getLayer()?.batchDraw();
  }

  private startPulse(): void {
    const layer = this.group.getLayer();

    if (!layer) {
      return;
    }

    if (!this.pulseAnimation) {
      const rect = this.highlightRect;
      this.pulseAnimation = new Animation((frame) => {
        const time = frame?.time ?? 0;
        const wave = (Math.sin(time / 180) + 1) / 2;

        rect.opacity(0.45 + wave * 0.55);
        rect.strokeWidth(2 + wave * 1.5);
        rect.shadowOpacity(0.15 + wave * 0.35);
      }, layer);
    }

    if (!this.pulseAnimation.isRunning()) {
      this.pulseAnimation.start();
    }
  }

  private stopPulse(): void {
    if (this.pulseAnimation) {
      this.pulseAnimation.stop();
    }
  }

  /**
   * 清除高亮
   */
  clear(): void {
    this.stopPulse();

    if (this.highlightRect.isVisible()) {
      this.highlightRect.visible(false);
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
