/**
 * 格子网格渲染 Konva 图层
 */

import Konva from 'konva';
import type { BitmapGridEngine } from '../../utils/bitmap-gridEngine';
import { CellDraw } from '../draws/cell-draw';

const { Layer } = Konva;
type LayerType = InstanceType<typeof Layer>;

export class CellLayer {
  private layer: LayerType;
  private engine: BitmapGridEngine;
  private cellDraw: CellDraw;
  private renderFrame: number | null;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.layer = new Layer({ name: 'cell' });
    this.cellDraw = new CellDraw(engine);
    this.renderFrame = null;

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
    this.updateLayout();

    // 设置格子位置

    eventBus.on('scroll:change', () => {
      this.scheduleRender();
    });

    eventBus.on('zoom:change', () => {
      this.scheduleRender(true);
    });

    eventBus.on('locate', () => {
      this.scheduleRender();
    });

    eventBus.on('data:change', () => {
      this.scheduleRender(true);
    });

    eventBus.on('layout:change', () => {
      this.scheduleRender();
    });

    eventBus.on('theme:change', () => {
      this.scheduleRender(true);
    });

    eventBus.on('color-rules:change', () => {
      this.scheduleRender(true);
    });

    // 初始渲染
    this.renderVisibleCells();
  }

  /**
   * 将同一帧内的布局、数据、滚动等更新合并为一次绘制。
   */
  private scheduleRender(invalidateCache: boolean = false): void {
    if (invalidateCache) {
      this.cellDraw.invalidateCache();
    }

    if (this.renderFrame !== null) {
      return;
    }

    this.renderFrame = requestAnimationFrame(() => {
      this.renderFrame = null;
      this.renderVisibleCells();
    });
  }

  /**
   * 渲染可见格子
   */
  private renderVisibleCells(): void {
    this.updateLayout();

    const virtualScrollSync = this.engine.getVirtualScrollSync();
    const scrollState = this.engine.getScrollState();

    // 获取当前可视范围
    const visibleRange = virtualScrollSync.getVisibleRange(
      scrollState.scrollX,
      scrollState.scrollY
    );

    // 渲染格子（传递滚动偏移）
    this.cellDraw.renderCells(visibleRange, scrollState.scrollX, scrollState.scrollY);
  }

  private updateLayout(): void {
    const layout = this.engine.getLayout();
    this.cellDraw.setPosition(layout.cellArea.x, layout.cellArea.y);
    this.cellDraw.setClip(layout.cellArea.width, layout.cellArea.height);
  }

  /**
   * 销毁图层
   */
  destroy(): void {
    if (this.renderFrame !== null) {
      cancelAnimationFrame(this.renderFrame);
      this.renderFrame = null;
    }
    this.cellDraw.destroy();
    this.layer.destroy();
  }
}
