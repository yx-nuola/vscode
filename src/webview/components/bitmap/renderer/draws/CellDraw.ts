/**
 * 格子渲染，含对象池
 */

import Konva from 'konva';
import type { BitmapGridEngine } from '../../core/BitmapGridEngine';
import type { CellData, ColorRule } from '../../types';

const { Group, Rect } = Konva;
type GroupType = InstanceType<typeof Group>;
type RectType = InstanceType<typeof Rect>;

/**
 * 格子绘制类
 */
export class CellDraw {
  private engine: BitmapGridEngine;
  private group: GroupType;
  // 缓存格子
  private cellPool: Map<string, RectType>;
  private hoveredCell: CellData | null;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.group = new Group({ name: 'cells' });
    this.cellPool = new Map();
    this.hoveredCell = null;
  }

  /**
   * 获取组
   */
  getGroup(): GroupType {
    return this.group;
  }

  /**
   * 设置组位置
   */
  setPosition(x: number, y: number): void {
    this.group.x(x);
    this.group.y(y);
  }

  /**
   * 设置裁剪区域
   */
  setClip(width: number, height: number): void {
    this.group.clipX(0);
    this.group.clipY(0);
    this.group.clipWidth(width);
    this.group.clipHeight(height);
  }

  /**
   * 渲染格子
   */
  renderCells(cells: CellData[], scrollX: number, scrollY: number): void {
    const config = this.engine.getConfig();
    const theme = config.theme;
    const colorRules = config.colorRules;
    const cellSize = this.engine.getZoomLevel();

    // 收集当前可见格子的 key
    const visibleKeys = new Set(cells.map((cell) => `${cell.row},${cell.col}`));

    // 清理不可见的格子（从对象池中移除并销毁）
    for (const [key, rect] of this.cellPool) {
      if (!visibleKeys.has(key)) {
        rect.destroy();
        this.cellPool.delete(key);
      }
    }

    // 渲染可见格子
    for (const cell of cells) {
      const key = `${cell.row},${cell.col}`;
      let rect = this.cellPool.get(key);

      // 计算格子位置（考虑滚动偏移）
      const x = cell.col * cellSize - scrollX;
      const y = cell.row * cellSize - scrollY;

      if (!rect) {
        rect = new Rect({
          x,
          y,
          width: cellSize,
          height: cellSize,
          stroke: theme.borderColor,
          strokeWidth: 1,
        });

        // 添加鼠标事件
        this.attachCellEvents(rect, cell);

        this.group.add(rect);
        this.cellPool.set(key, rect);
      }

      rect.visible(true);
      rect.x(x);
      rect.y(y);
      rect.width(cellSize);
      rect.height(cellSize);

      // 根据颜色规则映射颜色
      if (cell.value === -1) {
        // 无数据的格子显示灰色
        rect.fill(theme.defaultCellColor);
      } else {
        // 有数据的格子根据 colorRules 映射颜色
        const color = this.mapColor(cell.value, colorRules);
        rect.fill(color || theme.defaultCellColor);
      }
    }
  }

  /**
   * 附加格子事件
   */
  private attachCellEvents(rect: RectType, cell: CellData): void {
    const eventBus = this.engine.getEventBus();

    // 鼠标悬停
    rect.on('mouseenter', () => {
      this.hoveredCell = cell;
      eventBus.emit('cell:hover', cell);
    });

    rect.on('mouseleave', () => {
      this.hoveredCell = null;
      eventBus.emit('cell:hover', null);
    });

    // 鼠标点击
    rect.on('click', () => {
      eventBus.emit('cell:click', cell);
    });
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
