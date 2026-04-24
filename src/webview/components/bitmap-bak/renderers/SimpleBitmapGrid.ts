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
 * 标准二维矩阵图渲染器
 * 
 * 功能：
 * - 支持 128×1024 规模的二维矩阵展示
 * - 颜色编码：Pass=绿色, Fail=红色
 * - 支持自定义电流范围颜色映射
 * - X/Y 坐标轴（WL/BL）
 * - Ctrl+滚轮缩放
 * - 鼠标悬停/点击事件
 * 
 * 使用示例：
 * ```typescript
 * const grid = new SimpleBitmapGrid(data);
 * grid.initialize(container);
 * 
 * // 设置颜色区间
 * grid.setColorRanges([
 *   { min: 0, max: 5, color: '#FFA500' },
 *   { min: 5, max: 10, color: '#0000FF' },
 * ]);
 * 
 * // 监听点击事件
 * grid.onCellClick = (event) => {
 *   console.log('Selected:', event.coord, event.cell);
 * };
 * ```
 */
export class SimpleBitmapGrid extends KonvaGridBase<CellData> {
  /**
   * 网格配置
   * - minCellSize: 4px（最小可识别尺寸）
   * - maxCellSize: 32px（最大不占用过多空间）
   * - defaultCellSize: 12px（平衡清晰度与显示密度）
   */
  readonly config: GridConfig = {
    minCellSize: 4,
    maxCellSize: 32,
    defaultCellSize: 12,
  };

  /**
   * 坐标轴配置
   * - X轴：WL（字线）- 128列
   * - Y轴：BL（位线）- 1024行
   * - 刻度步长：每4格显示一个刻度
   */
  readonly axisConfig: AxisConfig = {
    showX: true,
    showY: true,
    xLabel: 'WL',
    yLabel: 'BL',
    stepX: 4,
    stepY: 4,
    axisHeight: 36,
    axisWidth: 50,
    tickColor: '#666666',
    labelColor: '#333333',
    bgColor: '#f5f5f5',
    fontSize: 12,
    showToolbar: true,
    // X轴标签格式化（WL）
    formatX: (col: number) => (col + 1).toString(),
    // Y轴标签格式化（BL）
    formatY: (row: number) => (row + 1).toString(),
  };

  constructor(data: MatrixData<CellData>) {
    super(data);
  }

  /**
   * 获取格子颜色
   * 
   * 优先级：
   * 1. 状态颜色（如果 useStatusColor 为 true）
   *    - Pass: #22c55e (绿色)
   *    - Fail: #ef4444 (红色)
   * 2. 电流范围颜色（根据 imeas 值匹配区间）
   * 3. 回退颜色: #FFFFFF (白色)
   */
  getCellColor(cell: CellData | null, _row: number, _col: number): string {
    if (!cell) {
      return this.colorConfig.fallbackColor;
    }

    // 优先使用状态颜色
    if (this.colorConfig.useStatusColor) {
      if (cell.status === 'pass') {
        return this.colorConfig.passColor;
      }
      if (cell.status === 'fail') {
        return this.colorConfig.failColor;
      }
    }

    // 使用电流范围颜色
    if (this.colorConfig.ranges.length > 0 && this.colorConfig.getValue) {
      const value = this.colorConfig.getValue(cell);
      for (const range of this.colorConfig.ranges) {
        if (value >= range.min && value < range.max) {
          return range.color;
        }
      }
    }

    // 默认使用 imeas 进行颜色映射
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

  /**
   * 创建格子形状
   * 使用 Konva.Rect 绘制矩形格子
   */
  createCellShape(context: CellRenderContext<CellData>): Konva.Shape {
    const rect = new Konva.Rect({
      x: context.x,
      y: context.y,
      width: context.width,
      height: context.height,
      fill: this.getCellColor(context.cell, context.row, context.col),
      stroke: context.isSelected ? this.selectionConfig.selectionColor : '#CCCCCC',
      strokeWidth: context.isSelected
        ? Math.max(1, context.width * this.selectionConfig.selectionBorderWidth)
        : Math.max(0.5, context.width * 0.02),
      listening: false,
    });

    return rect;
  }

  /**
   * 获取 X 轴标签（WL）
   * 显示为 1-based 索引
   */
  getXAxisLabel(col: number): string {
    return (col + 1).toString();
  }

  /**
   * 获取 Y 轴标签（BL）
   * 显示为 1-based 索引
   */
  getYAxisLabel(row: number): string {
    return (row + 1).toString();
  }
}
