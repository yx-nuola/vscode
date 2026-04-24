import Konva from 'konva';
import { KonvaGridBase } from '../core/KonvaGridBase';
import type {
  GridConfig,
  AxisConfig,
  MatrixData,
  CellRenderContext,
} from '../core/interfaces';

// 从 types.ts 重新导出 CellData 类型，确保类型一致性
export type { CellData } from '../types';
import type { CellData } from '../types';

/**
 * 高性能二维矩阵图渲染器
 * 
 * 相对于 SimpleBitmapGrid 的优化：
 * - 使用更激进的预渲染策略
 * - 批量更新属性减少重绘
 * - 智能缓存机制
 * - 适合 128×1024 大规模数据
 * 
 * 使用示例：
 * ```typescript
 * const grid = new PerformanceBitmapGrid(data);
 * grid.initialize(container);
 * ```
 */
export class PerformanceBitmapGrid extends KonvaGridBase<CellData> {
  readonly config: GridConfig = {
    minCellSize: 2,  // 更小以便显示更多数据
    maxCellSize: 48,
    defaultCellSize: 8,
  };

  readonly axisConfig: AxisConfig = {
    showX: true,
    showY: true,
    xLabel: 'WL',
    yLabel: 'BL',
    stepX: 8,  // 更大的步长减少刻度数量
    stepY: 8,
    axisHeight: 36,
    axisWidth: 50,
    tickColor: '#666666',
    labelColor: '#333333',
    bgColor: '#f5f5f5',
    fontSize: 10,  // 更小的字体
    showToolbar: true,
    // X轴标签格式化（WL）
    formatX: (col: number) => (col + 1).toString(),
    // Y轴标签格式化（BL）
    formatY: (row: number) => (row + 1).toString(),
  };

  // 批量更新标志和脏单元格集合
  private dirtyCells = new Set<string>();

  constructor(data: MatrixData<CellData>) {
    super(data);
  }

  getCellColor(cell: CellData | null, _row: number, _col: number): string {
    if (!cell) {
      return this.colorConfig.fallbackColor;
    }

    if (this.colorConfig.useStatusColor) {
      if (cell.status === 'pass') {
        return this.colorConfig.passColor;
      }
      if (cell.status === 'fail') {
        return this.colorConfig.failColor;
      }
    }

    if (this.colorConfig.ranges.length > 0) {
      const value = cell.imeas;
      for (const range of this.colorConfig.ranges) {
        if (value >= range.min && value < range.max) {
          return range.color;
        }
      }
    }

    return this.colorConfig.fallbackColor;
  }

  createCellShape(context: CellRenderContext<CellData>): Konva.Shape {
    // 小尺寸时禁用描边以提升性能
    const cp = context.width;
    const showStroke = cp >= 4;

    const rect = new Konva.Rect({
      x: context.x,
      y: context.y,
      width: context.width,
      height: context.height,
      fill: this.getCellColor(context.cell, context.row, context.col),
      stroke: showStroke
        ? (context.isSelected ? this.selectionConfig.selectionColor : '#CCCCCC')
        : undefined,
      strokeWidth: showStroke
        ? (context.isSelected
            ? Math.max(1, cp * this.selectionConfig.selectionBorderWidth)
            : Math.max(0.5, cp * 0.02))
        : 0,
      listening: false,
      perfectDrawEnabled: false,  // 禁用完美绘制提升性能
      shadowEnabled: false,
    });

    return rect;
  }

  getXAxisLabel(col: number): string {
    return (col + 1).toString();
  }

  getYAxisLabel(row: number): string {
    return (row + 1).toString();
  }

  /**
   * 批量更新颜色（用于色阶变更时）
   * 避免逐格重绘
   */
  batchUpdateColors(cells: { row: number; col: number }[]): void {
    cells.forEach(({ row, col }) => {
      const key = `${row}-${col}`;
      this.dirtyCells.add(key);
    });

    this.scheduleRender();
  }

  /**
   * 覆盖 renderVisibleCells 添加批量优化
   */
  protected renderVisibleCells(): void {
    if (!this.layer || !this.cellGroup) return;

    const { startRow, endRow, startCol, endCol } = this.calculateVisibleRange();
    const cp = this.cellPixelSize;
    const visibleKeys = new Set<string>();

    // 收集需要更新的格子
    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const key = `${row}-${col}`;
        visibleKeys.add(key);

        const cell = this.cellMap.get(key) ?? null;
        const isSelected = this.isCellSelected(row, col);
        const fill = this.getCellColor(cell, row, col);

        let rect = this.cellPool.get(key);

        if (!rect) {
          const context = this.getCellContext(row, col, false);
          const shape = this.createCellShape(context);
          if (shape instanceof Konva.Rect) {
            rect = shape;
          } else {
            // 如果不是 Rect，创建默认 Rect
            const showStroke = cp >= 4;
            rect = new Konva.Rect({
              x: col * cp,
              y: row * cp,
              width: cp,
              height: cp,
              fill,
              stroke: showStroke
                ? (isSelected ? this.selectionConfig.selectionColor : '#cccccc')
                : undefined,
              strokeWidth: showStroke
                ? (isSelected
                    ? Math.max(1, cp * this.selectionConfig.selectionBorderWidth)
                    : Math.max(0.5, cp * 0.02))
                : 0,
              listening: false,
              perfectDrawEnabled: false,
              shadowEnabled: false,
            });
          }
          this.cellPool.set(key, rect);
          this.cellGroup.add(rect);
        } else {
          // 只更新变化的属性
          if (rect.fill() !== fill) {
            rect.fill(fill);
          }
          
          const showStroke = cp >= 4;
          const expectedStroke = showStroke
            ? (isSelected ? this.selectionConfig.selectionColor : '#cccccc')
            : undefined;
          
          if (showStroke && rect.stroke() !== expectedStroke) {
            rect.stroke(expectedStroke);
          }

          if (rect.visible() === false) {
            rect.visible(true);
          }
        }
      }
    }

    // 隐藏不在可见区域的 Rect
    this.cellPool.forEach((rect, key) => {
      if (!visibleKeys.has(key)) {
        rect.visible(false);
      }
    });

    // 使用 batchDraw 合并绘制
    this.layer.batchDraw();
  }
}
