/**
 * 格子渲染，含对象池
 */

import { Group, Rect } from 'konva/lib/Konva';
import type { BitmapGridEngine } from '../core/BitmapGridEngine';
import type { CellData, ColorRule } from '../types';

/**
 * 格子绘制类
 */
export class CellDraw {
  private engine: BitmapGridEngine;
  private group: Group;
  private cellPool: Map<string, Rect>;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.group = new Group({ name: 'cells' });
    this.cellPool = new Map();
  }

  /**
   * 获取组
   */
  getGroup(): Group {
    return this.group;
  }

  /**
   * 渲染格子
   */
  renderCells(cells: CellData[]): void {
    const config = this.engine.getConfig();
    const theme = config.theme;
    const colorRules = config.colorRules;
    const cellSize = this.engine.getZoomLevel();

    // 隐藏不可见格子
    const visibleKeys = new Set(cells.map((cell) => `${cell.row},${cell.col}`));

    for (const [key, rect] of this.cellPool) {
      if (!visibleKeys.has(key)) {
        rect.visible(false);
      }
    }

    // 渲染可见格子
    for (const cell of cells) {
      const key = `${cell.row},${cell.col}`;
      let rect = this.cellPool.get(key);

      if (!rect) {
        rect = new Rect({
          x: cell.col * cellSize,
          y: cell.row * cellSize,
          width: cellSize,
          height: cellSize,
          stroke: theme.borderColor,
          strokeWidth: 1,
        });
        this.group.add(rect);
        this.cellPool.set(key, rect);
      }

      rect.visible(true);
      rect.x(cell.col * cellSize);
      rect.y(cell.row * cellSize);
      rect.width(cellSize);
      rect.height(cellSize);
      rect.fill(this.mapColor(cell.value, colorRules) || theme.defaultCellColor);
    }
  }

  /**
   * 映射颜色
   */
  private mapColor(value: number, rules: ColorRule[]): string | undefined {
    for (const rule of rules) {
      if (value >= rule.min && value <= rule.max) {
        return rule.color;
      }
    }
    return undefined;
  }

  /**
   * 销毁绘制
   */
  destroy(): void {
    this.cellPool.clear();
    this.group.destroy();
  }
}
