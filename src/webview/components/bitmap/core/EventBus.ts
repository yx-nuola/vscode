/**
 * 基于 mitt 的事件总线
 */

import mitt, { Emitter } from 'mitt';
import type { BitmapEvents } from '../types';

/**
 * 扩展事件类型以支持 mitt 的类型约束
 */
type ExtendedEvents = BitmapEvents & {
  [key: string]: unknown;
  [key: symbol]: unknown;
};

/**
 * 事件总线类
 */
export class EventBus {
  private emitter: Emitter<ExtendedEvents>;

  constructor() {
    this.emitter = mitt<ExtendedEvents>();
  }

  /**
   * 监听事件
   */
  on<K extends keyof BitmapEvents>(event: K, handler: (data: BitmapEvents[K]) => void): void {
    this.emitter.on(event as keyof ExtendedEvents, handler as (data: unknown) => void);
  }

  /**
   * 移除事件监听
   */
  off<K extends keyof BitmapEvents>(event: K, handler: (data: BitmapEvents[K]) => void): void {
    this.emitter.off(event as keyof ExtendedEvents, handler as (data: unknown) => void);
  }

  /**
   * 发射事件
   */
  emit<K extends keyof BitmapEvents>(event: K, data: BitmapEvents[K]): void {
    this.emitter.emit(event as keyof ExtendedEvents, data);
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
    this.emitter.all.delete(event as keyof ExtendedEvents);
  }
}
