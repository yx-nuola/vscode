/**
 * 滚动位置管理 + 边界钳制
 */

import type { BitmapGridEngine } from '../core/BitmapGridEngine';

/**
 * 滚动管理器类
 */
export class ScrollManager {
  private engine: BitmapGridEngine;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
  }

  /**
   * 设置 X 轴滚动位置
   */
  setScrollX(scrollX: number): void {
    const virtualScrollSync = this.engine.getVirtualScrollSync();
    const maxScrollX = virtualScrollSync.maxScrollX;
    const clampedX = Math.max(0, Math.min(scrollX, maxScrollX));

    const scrollState = this.engine.getScrollState();
    this.engine.scrollTo(clampedX, scrollState.scrollY);
  }

  /**
   * 设置 Y 轴滚动位置
   */
  setScrollY(scrollY: number): void {
    const virtualScrollSync = this.engine.getVirtualScrollSync();
    const maxScrollY = virtualScrollSync.maxScrollY;
    const clampedY = Math.max(0, Math.min(scrollY, maxScrollY));

    const scrollState = this.engine.getScrollState();
    this.engine.scrollTo(scrollState.scrollX, clampedY);
  }

  /**
   * 增量滚动
   */
  scrollBy(deltaX: number, deltaY: number): void {
    const scrollState = this.engine.getScrollState();
    this.engine.scrollTo(scrollState.scrollX + deltaX, scrollState.scrollY + deltaY);
  }

  /**
   * 滚动到顶部
   */
  scrollToTop(): void {
    const scrollState = this.engine.getScrollState();
    this.engine.scrollTo(scrollState.scrollX, 0);
  }

  /**
   * 滚动到底部
   */
  scrollToBottom(): void {
    const virtualScrollSync = this.engine.getVirtualScrollSync();
    const maxScrollY = virtualScrollSync.maxScrollY;
    const scrollState = this.engine.getScrollState();
    this.engine.scrollTo(scrollState.scrollX, maxScrollY);
  }

  /**
   * 滚动到左侧
   */
  scrollToLeft(): void {
    this.engine.scrollTo(0, this.engine.getScrollState().scrollY);
  }

  /**
   * 滚动到右侧
   */
  scrollToRight(): void {
    const virtualScrollSync = this.engine.getVirtualScrollSync();
    const maxScrollX = virtualScrollSync.maxScrollX;
    this.engine.scrollTo(maxScrollX, this.engine.getScrollState().scrollY);
  }
}
