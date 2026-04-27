/**
 * 工具栏按钮渲染
 */

import { Group, Rect, Text } from 'konva/lib/Konva';
import type { BitmapGridEngine } from '../core/BitmapGridEngine';

/**
 * 工具栏绘制类
 */
export class ToolbarDraw {
  private engine: BitmapGridEngine;
  private group: Group;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.group = new Group({ name: 'toolbar' });
  }

  /**
   * 获取组
   */
  getGroup(): Group {
    return this.group;
  }

  /**
   * 渲染工具栏
   */
  renderToolbar(): void {
    const config = this.engine.getConfig();
    const theme = config.theme;

    // 清除现有内容
    this.group.destroyChildren();

    // 渲染背景
    const background = new Rect({
      x: 0,
      y: 0,
      width: this.group.width(),
      height: this.group.height(),
      fill: theme.backgroundColor,
    });
    this.group.add(background);

    // TODO: 渲染缩放按钮、定位按钮、缩放比例显示、缩放控制
  }

  /**
   * 销毁绘制
   */
  destroy(): void {
    this.group.destroy();
  }
}
