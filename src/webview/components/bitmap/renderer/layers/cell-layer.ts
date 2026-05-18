/**
 * 格子网格渲染 Konva 图层
 */

import Konva from 'konva';
import type { BitmapGridEngine } from '../../utils/bitmap-gridEngine';
import type { CellData } from '../../types';
import { CellDraw } from '../draws/cell-draw';

const { Layer } = Konva;
type LayerType = InstanceType<typeof Layer>;

export class CellLayer {
  private layer: LayerType;
  private engine: BitmapGridEngine;
  private cellDraw: CellDraw;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.layer = new Layer({ name: 'cell' });
    this.cellDraw = new CellDraw(engine);

    // 将 CellDraw 的 group 添加到 layer 中
    this.layer.add(this.cellDraw.getGroup());
  }

  /**
   * 获取图层
   */
  getLayer(): LayerType {
    return this.layer;
  }

  /**
   * 初始化图层
   */
  initialize(): void {
    const eventBus = this.engine.getEventBus();
    const layoutCalculator = this.engine.getLayoutCalculator();

    // 设置格子位置
    const layout = layoutCalculator.calculate(
      this.engine.getStage()?.width() || 0,
      this.engine.getStage()?.height() || 0
    );
    this.cellDraw.setPosition(layout.cellArea.x, layout.cellArea.y);
    this.cellDraw.setClip(layout.cellArea.width, layout.cellArea.height);

    eventBus.on('scroll:change', () => {
      this.renderVisibleCells();
    });

    eventBus.on('zoom:change', () => {
      this.renderVisibleCells();
    });

    eventBus.on('locate', () => {
      this.renderVisibleCells();
    });

    eventBus.on('data:change', () => {
      this.renderVisibleCells();
    });

    eventBus.on('theme:change', () => {
      this.renderVisibleCells();
    });

    eventBus.on('color-rules:change', () => {
      this.renderVisibleCells();
    });

    // 初始渲染
    this.renderVisibleCells();
  }

  /**
   * 渲染可见格子
   */
  private renderVisibleCells(): void {
    const virtualScrollSync = this.engine.getVirtualScrollSync();
    const dataManager = this.engine.getDataManager();
    const scrollState = this.engine.getScrollState();

    // 获取当前可视范围
    const visibleRange = virtualScrollSync.getVisibleRange(scrollState.scrollX, scrollState.scrollY);

    // 渲染整个网格，无数据的格子显示灰色
    const visibleCells: CellData[] = [];

    for (let row = visibleRange.startRow; row <= visibleRange.endRow; row++) {
      for (let col = visibleRange.startCol; col <= visibleRange.endCol; col++) {
        const cell = dataManager.getCell(row, col);
        if (cell) {
          // 有数据的格子，使用实际数据
          visibleCells.push(cell);
        } else {
          // 无数据的格子，创建一个灰色格子（占位）
          visibleCells.push({
            row,
            col,
            value: -1, // 特殊值表示无数据
          });
        }
      }
    }

    // 渲染格子（传递滚动偏移）
    this.cellDraw.renderCells(visibleCells, scrollState.scrollX, scrollState.scrollY);
  }

  /**
   * 销毁图层
   */
  destroy(): void {
    this.cellDraw.destroy();
    this.layer.destroy();
  }
}
