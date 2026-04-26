/**
 * 滚动条轨道 + 滑块渲染
 */

import { Group, Rect } from 'konva/lib/Konva';
import type { BitmapGridEngine } from '../core/BitmapGridEngine';

/**
 * 滚动条绘制类
 */
export class ScrollbarDraw {
  private engine: BitmapGridEngine;
  private horizontalGroup: Group;
  private verticalGroup: Group;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.horizontalGroup = new Group({ name: 'horizontalScrollbar' });
    this.verticalGroup = new Group({ name: 'verticalScrollbar' });
  }

  /**
   * 获取横向滚动条组
   */
  getHorizontalGroup(): Group {
    return this.horizontalGroup;
  }

  /**
   * 获取纵向滚动条组
   */
  getVerticalGroup(): Group {
    return this.verticalGroup;
  }

  /**
   * 渲染横向滚动条
   */
  renderHorizontal(): void {
    const config = this.engine.getConfig();
    const theme = config.theme;

    this.horizontalGroup.destroyChildren();

    // TODO: 实现轨道 + 滑块渲染，系统默认样式
  }

  /**
   * 渲染纵向滚动条
   */
  renderVertical(): void {
    const config = this.engine.getConfig();
    const theme = config.theme;

    this.verticalGroup.destroyChildren();

    // TODO: 实现轨道 + 滑块渲染，系统默认样式
  }

  /**
   * 销毁绘制
   */
  destroy(): void {
    this.horizontalGroup.destroy();
    this.verticalGroup.destroy();
  }
}
