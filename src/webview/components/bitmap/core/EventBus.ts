/**
 * 基于 mitt 的事件总线
 */

import mitt, { Emitter } from 'mitt';
import type { BitmapEvents } from '../types';

/**
 * 事件总线类
 */
export class EventBus {
  private emitter: Emitter<BitmapEvents>;

  constructor() {
    this.emitter = mitt<BitmapEvents>();
  }

  /**
   * 监听事件
   */
  on<K extends keyof BitmapEvents>(event: K, handler: (data: BitmapEvents[K]) => void): void {
    this.emitter.on(event, handler);
  }

  /**
   * 移除事件监听
   */
  off<K extends keyof BitmapEvents>(event: K, handler: (data: BitmapEvents[K]) => void): void {
    this.emitter.off(event, handler);
  }

  /**
   * 发射事件
   */
  emit<K extends keyof BitmapEvents>(event: K, data: BitmapEvents[K]): void {
    this.emitter.emit(event, data);
  }

  /**
   * 清除所有事件监听
   */
  clear(): void {
    this.emitter.all.clear();
  }

  /**
   * 清除指定事件的所有监听
   */
  clearEvent<K extends keyof BitmapEvents>(event: K): void {
    this.emitter.all.delete(event);
  }
}
