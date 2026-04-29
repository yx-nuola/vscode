/**
 * 滚动条轨道 + 滑块渲染
 */

import Konva from 'konva';
import type { BitmapGridEngine } from '../core/BitmapGridEngine';

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
   * 设置横向滚动条位置
   */
  setHorizontalPosition(x: number, y: number): void {
    this.horizontalGroup.x(x);
    this.horizontalGroup.y(y);
  }

  /**
   * 设置纵向滚动条位置
   */
  setVerticalPosition(x: number, y: number): void {
    this.verticalGroup.x(x);
    this.verticalGroup.y(y);
  }

  /**
   * 获取布局和滚动条状态
   */
  private getLayoutAndScrollbarState() {
    const layoutCalculator = this.engine.getLayoutCalculator();
    const virtualScrollSync = this.engine.getVirtualScrollSync();
    const scrollState = this.engine.getScrollState();

    const layout = layoutCalculator.calculate(
      this.engine.getStage()?.width() || 0,
      this.engine.getStage()?.height() || 0
    );

    return { layout, virtualScrollSync, scrollState };
  }

  /**
   * 渲染横向滚动条
   */
  renderHorizontal(): void {
    const config = this.engine.getConfig();
    const theme = config.theme;
    const { layout, virtualScrollSync, scrollState } = this.getLayoutAndScrollbarState();
    const { horizontalScrollbar } = layout;

    const scrollbarState = virtualScrollSync.getScrollbarState(
      scrollState.scrollX,
      scrollState.scrollY,
      horizontalScrollbar.width,
      horizontalScrollbar.height
    );

    const maxThumbX = horizontalScrollbar.width - scrollbarState.thumbWidth;

    // 如果正在拖动横向滑块，只更新位置，不重建
    if (this.isDraggingHorizontal && this.horizontalThumb && this.horizontalTrack) {
      this.horizontalThumb.x(scrollbarState.thumbX);
      this.horizontalThumb.width(scrollbarState.thumbWidth);
      return;
    }

    this.horizontalGroup.destroyChildren();

    // 轨道
    this.horizontalTrack = new Rect({
      x: 0,
      y: 0,
      width: horizontalScrollbar.width,
      height: horizontalScrollbar.height,
      fill: theme.scrollbarTrackColor,
    });
    this.horizontalGroup.add(this.horizontalTrack);

    // 滑块
    this.horizontalThumb = new Rect({
      x: scrollbarState.thumbX,
      y: 0,
      width: scrollbarState.thumbWidth,
      height: horizontalScrollbar.height,
      fill: theme.scrollbarThumbColor,
      draggable: true,
      dragBoundFunc: (pos) => {
        return {
          x: Math.max(0, Math.min(pos.x, maxThumbX)),
          y: 0,
        };
      },
    });

    this.attachHorizontalEvents();
    this.horizontalGroup.add(this.horizontalThumb);
  }

  /**
   * 渲染纵向滚动条
   */
  renderVertical(): void {
    const config = this.engine.getConfig();
    const theme = config.theme;
    const { layout, virtualScrollSync, scrollState } = this.getLayoutAndScrollbarState();
    const { verticalScrollbar } = layout;

    const scrollbarState = virtualScrollSync.getScrollbarState(
      scrollState.scrollX,
      scrollState.scrollY,
      verticalScrollbar.width,
      verticalScrollbar.height
    );

    const maxThumbY = verticalScrollbar.height - scrollbarState.thumbHeight;

    // 如果正在拖动纵向滑块，只更新位置，不重建
    if (this.isDraggingVertical && this.verticalThumb && this.verticalTrack) {
      this.verticalThumb.y(scrollbarState.thumbY);
      this.verticalThumb.height(scrollbarState.thumbHeight);
      return;
    }

    this.verticalGroup.destroyChildren();

    // 轨道
    this.verticalTrack = new Rect({
      x: 0,
      y: 0,
      width: verticalScrollbar.width,
      height: verticalScrollbar.height,
      fill: theme.scrollbarTrackColor,
    });
    this.verticalGroup.add(this.verticalTrack);

    // 滑块
    this.verticalThumb = new Rect({
      x: 0,
      y: scrollbarState.thumbY,
      width: verticalScrollbar.width,
      height: scrollbarState.thumbHeight,
      fill: theme.scrollbarThumbColor,
      draggable: true,
      dragBoundFunc: (pos) => {
        return {
          x: 0,
          y: Math.max(0, Math.min(pos.y, maxThumbY)),
        };
      },
    });

    this.attachVerticalEvents();
    this.verticalGroup.add(this.verticalThumb);
  }

  /**
   * 附加横向滚动条事件
   */
  private attachHorizontalEvents(): void {
    if (!this.horizontalThumb) return;

    const eventBus = this.engine.getEventBus();
    const virtualScrollSync = this.engine.getVirtualScrollSync();

    this.horizontalThumb.on('dragstart', () => {
      this.isDraggingHorizontal = true;
    });

    this.horizontalThumb.on('dragmove', () => {
      if (!this.isDraggingHorizontal || !this.horizontalThumb) return;

      const { layout } = this.getLayoutAndScrollbarState();

      const thumbX = this.horizontalThumb.x();
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

    // 添加轨道点击事件
    this.horizontalGroup.on('click', (e) => {
      if (e.target === this.horizontalThumb) return;

      const { layout, virtualScrollSync } = this.getLayoutAndScrollbarState();

      const clickX = e.evt.offsetX;
      const scrollbarState = virtualScrollSync.getScrollbarState(
        this.engine.getScrollState().scrollX,
        this.engine.getScrollState().scrollY,
        layout.horizontalScrollbar.width,
        layout.horizontalScrollbar.height
      );

      const thumbCenterX = Math.max(
        scrollbarState.thumbWidth / 2,
        Math.min(clickX, layout.horizontalScrollbar.width - scrollbarState.thumbWidth / 2)
      );

      const scrollState = virtualScrollSync.getScrollFromThumb(
        thumbCenterX - scrollbarState.thumbWidth / 2,
        0,
        layout.horizontalScrollbar.width,
        layout.horizontalScrollbar.height
      );

      eventBus.emit('scroll:change', scrollState);
    });
  }

  /**
   * 附加纵向滚动条事件
   */
  private attachVerticalEvents(): void {
    if (!this.verticalThumb) return;

    const eventBus = this.engine.getEventBus();
    const virtualScrollSync = this.engine.getVirtualScrollSync();

    this.verticalThumb.on('dragstart', () => {
      this.isDraggingVertical = true;
    });

    this.verticalThumb.on('dragmove', () => {
      if (!this.isDraggingVertical || !this.verticalThumb) return;

      const { layout } = this.getLayoutAndScrollbarState();

      const thumbY = this.verticalThumb.y();
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

    // 添加轨道点击事件
    this.verticalGroup.on('click', (e) => {
      if (e.target === this.verticalThumb) return;

      const { layout, virtualScrollSync } = this.getLayoutAndScrollbarState();

      const clickY = e.evt.offsetY;
      const scrollbarState = virtualScrollSync.getScrollbarState(
        this.engine.getScrollState().scrollX,
        this.engine.getScrollState().scrollY,
        layout.verticalScrollbar.width,
        layout.verticalScrollbar.height
      );

      const thumbCenterY = Math.max(
        scrollbarState.thumbHeight / 2,
        Math.min(clickY, layout.verticalScrollbar.height - scrollbarState.thumbHeight / 2)
      );

      const scrollState = virtualScrollSync.getScrollFromThumb(
        0,
        thumbCenterY - scrollbarState.thumbHeight / 2,
        layout.verticalScrollbar.width,
        layout.verticalScrollbar.height
      );

      eventBus.emit('scroll:change', scrollState);
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
