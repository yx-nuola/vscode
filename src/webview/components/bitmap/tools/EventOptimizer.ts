/**
 * RAF 调度 + 防抖
 */

import type { BitmapGridEngine } from '../core/BitmapGridEngine';

/**
 * 事件优化器类
 */
export class EventOptimizer {
  private engine: BitmapGridEngine;
  private wheelAccumulatorX: number;
  private wheelAccumulatorY: number;
  private rafId: number | null;
  private resizeTimeout: number | null;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.wheelAccumulatorX = 0;
    this.wheelAccumulatorY = 0;
    this.rafId = null;
    this.resizeTimeout = null;
  }

  /**
   * 处理滚轮事件
   */
  handleWheel(deltaX: number, deltaY: number): void {
    this.wheelAccumulatorX += deltaX;
    this.wheelAccumulatorY += deltaY;

    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        this.processWheel();
      });
    }
  }

  /**
   * 处理滚轮累积
   */
  private processWheel(): void {
    if (this.wheelAccumulatorX !== 0 || this.wheelAccumulatorY !== 0) {
      const scrollState = this.engine.getScrollState();
      this.engine.scrollTo(
        scrollState.scrollX + this.wheelAccumulatorX,
        scrollState.scrollY + this.wheelAccumulatorY
      );

      this.wheelAccumulatorX = 0;
      this.wheelAccumulatorY = 0;
    }

    this.rafId = null;
  }

  /**
   * 处理尺寸调整事件
   */
  handleResize(width: number, height: number): void {
    if (this.resizeTimeout !== null) {
      clearTimeout(this.resizeTimeout);
    }

    this.resizeTimeout = window.setTimeout(() => {
      this.engine.resize(width, height);
      this.resizeTimeout = null;
    }, 150);
  }

  /**
   * 取消待处理的尺寸调整
   */
  cancelPendingResize(): void {
    if (this.resizeTimeout !== null) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }
  }

  /**
   * 销毁优化器
   */
  destroy(): void {
    this.cancelPendingResize();
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
