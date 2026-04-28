/**
 * 滚动条轨道 + 滑块渲染
 */

import Konva from 'konva';
import type { BitmapGridEngine } from '../core/BitmapGridEngine';
import type { ScrollbarState } from '../types';

const { Group, Rect } = Konva;
type GroupType = InstanceType<typeof Group>;
type RectType = InstanceType<typeof Rect>;

/**
 * 滚动条绘制类
 */
export class ScrollbarDraw {
  private engine: BitmapGridEngine;
  private horizontalGroup: GroupType;
  private verticalGroup: GroupType;
  private horizontalTrack: RectType | null;
  private horizontalThumb: RectType | null;
  private verticalTrack: RectType | null;
  private verticalThumb: RectType | null;
  private isDraggingHorizontal: boolean;
  private isDraggingVertical: boolean;
  private lastMouseX: number;
  private lastMouseY: number;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.horizontalGroup = new Group({ name: 'horizontalScrollbar' });
    this.verticalGroup = new Group({ name: 'verticalScrollbar' });
    this.horizontalTrack = null;
    this.horizontalThumb = null;
    this.verticalTrack = null;
    this.verticalThumb = null;
    this.isDraggingHorizontal = false;
    this.isDraggingVertical = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
  }

  /**
   * 获取横向滚动条组
   */
  getHorizontalGroup(): GroupType {
    return this.horizontalGroup;
  }

  /**
   * 获取纵向滚动条组
   */
  getVerticalGroup(): GroupType {
    return this.verticalGroup;
  }

  /**
   * 渲染横向滚动条
   */
  renderHorizontal(): void {
    const config = this.engine.getConfig();
    const theme = config.theme;
    const layoutCalculator = this.engine.getLayoutCalculator();
    const virtualScrollSync = this.engine.getVirtualScrollSync();
    const scrollState = this.engine.getScrollState();

    this.horizontalGroup.destroyChildren();

    // 获取布局
    const layout = layoutCalculator.calculate(
      this.engine.getStage()?.width() || 0,
      this.engine.getStage()?.height() || 0
    );

    const { horizontalScrollbar } = layout;

    // 轨道
    this.horizontalTrack = new Rect({
      x: horizontalScrollbar.x,
      y: horizontalScrollbar.y,
      width: horizontalScrollbar.width,
      height: horizontalScrollbar.height,
      fill: theme.scrollbarTrackColor,
    });
    this.horizontalGroup.add(this.horizontalTrack);

    // 滑块
    const scrollbarState = virtualScrollSync.getScrollbarState(
      scrollState.scrollX,
      scrollState.scrollY,
      horizontalScrollbar.width,
      horizontalScrollbar.height
    );

    this.horizontalThumb = new Rect({
      x: horizontalScrollbar.x + scrollbarState.thumbX,
      y: horizontalScrollbar.y,
      width: scrollbarState.thumbWidth,
      height: horizontalScrollbar.height,
      fill: theme.scrollbarThumbColor,
      draggable: true,
    });

    // 添加拖动事件
    this.attachHorizontalEvents();

    this.horizontalGroup.add(this.horizontalThumb);
  }

  /**
   * 渲染纵向滚动条
   */
  renderVertical(): void {
    const config = this.engine.getConfig();
    const theme = config.theme;
    const layoutCalculator = this.engine.getLayoutCalculator();
    const virtualScrollSync = this.engine.getVirtualScrollSync();
    const scrollState = this.engine.getScrollState();

    this.verticalGroup.destroyChildren();

    // 获取布局
    const layout = layoutCalculator.calculate(
      this.engine.getStage()?.width() || 0,
      this.engine.getStage()?.height() || 0
    );

    const { verticalScrollbar } = layout;

    // 轨道
    this.verticalTrack = new Rect({
      x: verticalScrollbar.x,
      y: verticalScrollbar.y,
      width: verticalScrollbar.width,
      height: verticalScrollbar.height,
      fill: theme.scrollbarTrackColor,
    });
    this.verticalGroup.add(this.verticalTrack);

    // 滑块
    const scrollbarState = virtualScrollSync.getScrollbarState(
      scrollState.scrollX,
      scrollState.scrollY,
      verticalScrollbar.width,
      verticalScrollbar.height
    );

    this.verticalThumb = new Rect({
      x: verticalScrollbar.x,
      y: verticalScrollbar.y + scrollbarState.thumbY,
      width: verticalScrollbar.width,
      height: scrollbarState.thumbHeight,
      fill: theme.scrollbarThumbColor,
      draggable: true,
    });

    // 添加拖动事件
    this.attachVerticalEvents();

    this.verticalGroup.add(this.verticalThumb);
  }

  /**
   * 附加横向滚动条事件
   */
  private attachHorizontalEvents(): void {
    if (!this.horizontalThumb) return;

    const eventBus = this.engine.getEventBus();
    const layoutCalculator = this.engine.getLayoutCalculator();
    const virtualScrollSync = this.engine.getVirtualScrollSync();

    this.horizontalThumb.on('dragstart', () => {
      this.isDraggingHorizontal = true;
    });

    this.horizontalThumb.on('dragmove', () => {
      if (!this.isDraggingHorizontal || !this.horizontalThumb) return;

      const layout = layoutCalculator.calculate(
        this.engine.getStage()?.width() || 0,
        this.engine.getStage()?.height() || 0
      );

      const thumbX = this.horizontalThumb.x() - layout.horizontalScrollbar.x;
      const scrollState = virtualScrollSync.getScrollFromThumb(
        thumbX,
        0,
        layout.horizontalScrollbar.width,
        layout.horizontalScrollbar.height
      );

      eventBus.emit('scroll:change', scrollState);
    });

    this.horizontalThumb.on('dragend', () => {
      this.isDraggingHorizontal = false;
    });
  }

  /**
   * 附加纵向滚动条事件
   */
  private attachVerticalEvents(): void {
    if (!this.verticalThumb) return;

    const eventBus = this.engine.getEventBus();
    const layoutCalculator = this.engine.getLayoutCalculator();
    const virtualScrollSync = this.engine.getVirtualScrollSync();

    this.verticalThumb.on('dragstart', () => {
      this.isDraggingVertical = true;
    });

    this.verticalThumb.on('dragmove', () => {
      if (!this.isDraggingVertical || !this.verticalThumb) return;

      const layout = layoutCalculator.calculate(
        this.engine.getStage()?.width() || 0,
        this.engine.getStage()?.height() || 0
      );

      const thumbY = this.verticalThumb.y() - layout.verticalScrollbar.y;
      const scrollState = virtualScrollSync.getScrollFromThumb(
        0,
        thumbY,
        layout.verticalScrollbar.width,
        layout.verticalScrollbar.height
      );

      eventBus.emit('scroll:change', scrollState);
    });

    this.verticalThumb.on('dragend', () => {
      this.isDraggingVertical = false;
    });
  }

  /**
   * 销毁绘制
   */
  destroy(): void {
    this.horizontalGroup.destroy();
    this.verticalGroup.destroy();
  }
}
