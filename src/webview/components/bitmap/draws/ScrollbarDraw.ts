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

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.horizontalGroup = new Group({ name: 'horizontalScrollbar' });
    this.verticalGroup = new Group({ name: 'verticalScrollbar' });
    this.horizontalTrack = null;
    this.horizontalThumb = null;
    this.verticalTrack = null;
    this.verticalThumb = null;
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
   * 检查是否正在拖动横向滚动条
   */
  isDraggingHorizontalScrollbar(): boolean {
    return this.horizontalThumb?.isDragging() ?? false;
  }

  /**
   * 检查是否正在拖动纵向滚动条
   */
  isDraggingVerticalScrollbar(): boolean {
    return this.verticalThumb?.isDragging() ?? false;
  }

  /**
   * 设置横向滚动条位置
   */
  setHorizontalPosition(x: number, y: number): void {
    // Group 的位置是相对于 Layer 的，Layer 的位置是 (0, 0)
    // 所以 Group 的位置就是相对于 Stage 的绝对坐标
    this.horizontalGroup.x(x);
    this.horizontalGroup.y(y);
  }

  /**
   * 设置纵向滚动条位置
   */
  setVerticalPosition(x: number, y: number): void {
    // Group 的位置是相对于 Layer 的，Layer 的位置是 (0, 0)
    // 所以 Group 的位置就是相对于 Stage 的绝对坐标
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
   * Konva 的 dragBoundFunc 接收和返回的都是绝对坐标，这里转换成滚动条组内坐标后再限制范围。
   */
  private getHorizontalDragBound(pos: { x: number; y: number }, maxThumbX: number): { x: number; y: number } {
    const groupPos = this.horizontalGroup.getAbsolutePosition();
    const localX = pos.x - groupPos.x;
    const clampedX = Math.max(0, Math.min(localX, maxThumbX));

    return {
      x: groupPos.x + clampedX,
      y: groupPos.y,
    };
  }

  /**
   * Konva 的 dragBoundFunc 接收和返回的都是绝对坐标，这里转换成滚动条组内坐标后再限制范围。
   */
  private getVerticalDragBound(pos: { x: number; y: number }, maxThumbY: number): { x: number; y: number } {
    const groupPos = this.verticalGroup.getAbsolutePosition();
    const localY = pos.y - groupPos.y;
    const clampedY = Math.max(0, Math.min(localY, maxThumbY));

    return {
      x: groupPos.x,
      y: groupPos.y + clampedY,
    };
  }

  /**
   * 获取鼠标相对滚动条组的点击位置。
   */
  private getPointerPositionInGroup(group: GroupType): { x: number; y: number } | null {
    const pointer = this.engine.getStage()?.getPointerPosition();
    if (!pointer) {
      return null;
    }

    const groupPos = group.getAbsolutePosition();
    return {
      x: pointer.x - groupPos.x,
      y: pointer.y - groupPos.y,
    };
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

    // 如果滚动条已经存在，只更新边界（拖动中不更新位置，由 Konva drag 管理）
    if (this.horizontalThumb && this.horizontalTrack) {
      // 更新拖动边界
      this.horizontalThumb.dragBoundFunc((pos) => {
        const currentMaxThumbX = horizontalScrollbar.width - scrollbarState.thumbWidth;
        return this.getHorizontalDragBound(pos, currentMaxThumbX);
      });

      // 只有不在拖动状态时才更新位置和尺寸
      if (!this.horizontalThumb.isDragging()) {
        this.horizontalThumb.x(scrollbarState.thumbX);
        this.horizontalThumb.width(scrollbarState.thumbWidth);
      }

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
        return this.getHorizontalDragBound(pos, maxThumbX);
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

    // 如果滚动条已经存在，只更新边界（拖动中不更新位置，由 Konva drag 管理）
    if (this.verticalThumb && this.verticalTrack) {
      // 更新拖动边界
      this.verticalThumb.dragBoundFunc((pos) => {
        const currentMaxThumbY = verticalScrollbar.height - scrollbarState.thumbHeight;
        return this.getVerticalDragBound(pos, currentMaxThumbY);
      });

      // 只有不在拖动状态时才更新位置和尺寸
      if (!this.verticalThumb.isDragging()) {
        this.verticalThumb.y(scrollbarState.thumbY);
        this.verticalThumb.height(scrollbarState.thumbHeight);
      }

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
        return this.getVerticalDragBound(pos, maxThumbY);
      },
    });

    this.attachVerticalEvents();
    this.verticalGroup.add(this.verticalThumb);
  }

  /**
   * 附加横向滚动条事件
   */
  private attachHorizontalEvents(): void {
    if (!this.horizontalThumb) { return; }

    const eventBus = this.engine.getEventBus();
    const virtualScrollSync = this.engine.getVirtualScrollSync();

    this.horizontalThumb.on('dragmove', () => {
      if (!this.horizontalThumb) return;

      const { layout } = this.getLayoutAndScrollbarState();

      const thumbX = this.horizontalThumb.x();
      const scrollState = virtualScrollSync.getScrollFromThumb(
        thumbX,
        0,
        layout.horizontalScrollbar.width,
        layout.horizontalScrollbar.height
      );

      // 实时触发 scroll:change 事件
      eventBus.emit('scroll:change', scrollState);
    });

    this.horizontalThumb.on('dragend', () => {
      if (!this.horizontalThumb) return;

      const { layout } = this.getLayoutAndScrollbarState();

      const thumbX = this.horizontalThumb.x();
      const scrollState = virtualScrollSync.getScrollFromThumb(
        thumbX,
        0,
        layout.horizontalScrollbar.width,
        layout.horizontalScrollbar.height
      );

      // 触发 scroll:change 事件，render 会根据 isDragging() 状态正确更新
      eventBus.emit('scroll:change', scrollState);
    });

    // 添加轨道点击事件
    this.horizontalGroup.on('click', (e) => {
      if (e.target === this.horizontalThumb) { return; }

      const { layout, virtualScrollSync } = this.getLayoutAndScrollbarState();

      // 获取点击位置相对于 Group 的坐标
      const pointer = this.getPointerPositionInGroup(this.horizontalGroup);
      if (!pointer) return;

      const clickX = pointer.x;
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
    if (!this.verticalThumb) { return; }

    const eventBus = this.engine.getEventBus();
    const virtualScrollSync = this.engine.getVirtualScrollSync();

    this.verticalThumb.on('dragmove', () => {
      if (!this.verticalThumb) return;

      const { layout } = this.getLayoutAndScrollbarState();

      const thumbY = this.verticalThumb.y();
      const scrollState = virtualScrollSync.getScrollFromThumb(
        0,
        thumbY,
        layout.verticalScrollbar.width,
        layout.verticalScrollbar.height
      );

      // 实时触发 scroll:change 事件
      eventBus.emit('scroll:change', scrollState);
    });

    this.verticalThumb.on('dragend', () => {
      if (!this.verticalThumb) return;

      const { layout } = this.getLayoutAndScrollbarState();

      const thumbY = this.verticalThumb.y();
      const scrollState = virtualScrollSync.getScrollFromThumb(
        0,
        thumbY,
        layout.verticalScrollbar.width,
        layout.verticalScrollbar.height
      );

      // 触发 scroll:change 事件，render 会根据 isDragging() 状态正确更新
      eventBus.emit('scroll:change', scrollState);
    });

    // 添加轨道点击事件
    this.verticalGroup.on('click', (e) => {
      if (e.target === this.verticalThumb) { return; }

      const { layout, virtualScrollSync } = this.getLayoutAndScrollbarState();

      const pointer = this.getPointerPositionInGroup(this.verticalGroup);
      if (!pointer) return;

      const clickY = pointer.y;
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
