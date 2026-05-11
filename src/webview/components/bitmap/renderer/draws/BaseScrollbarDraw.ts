import Konva from 'konva';
import type { BitmapGridEngine } from '../../core/BitmapGridEngine';
import type { Area, LayoutResult, ScrollbarState, ScrollState } from '../../types';

const { Group, Rect } = Konva;
type GroupType = InstanceType<typeof Group>;
type RectType = InstanceType<typeof Rect>;

export interface ScrollbarRenderState {
  area: Area;
  scrollbar: ScrollbarState;
}

export abstract class BaseScrollbarDraw {
  protected readonly engine: BitmapGridEngine;
  protected readonly group: GroupType;
  protected track: RectType | null;
  protected thumb: RectType | null;

  constructor(engine: BitmapGridEngine, name: string) {
    this.engine = engine;
    this.group = new Group({ name });
    this.track = null;
    this.thumb = null;
  }

  getGroup(): GroupType {
    return this.group;
  }

  setPosition(x: number, y: number): void {
    this.group.x(x);
    this.group.y(y);
  }

  isDragging(): boolean {
    return this.thumb?.isDragging() ?? false;
  }

  render(state: ScrollbarRenderState): void {
    if (!this.track || !this.thumb) {
      this.createScrollbar(state);
      return;
    }

    this.track.width(state.area.width);
    this.track.height(state.area.height);
    this.thumb.dragBoundFunc((pos) => this.getDragBound(pos, state));

    if (!this.thumb.isDragging()) {
      this.updateThumb(state);
    }
  }

  destroy(): void {
    this.group.destroy();
  }

  protected abstract getThumbX(state: ScrollbarRenderState): number;

  protected abstract getThumbY(state: ScrollbarRenderState): number;

  protected abstract getThumbWidth(state: ScrollbarRenderState): number;

  protected abstract getThumbHeight(state: ScrollbarRenderState): number;

  protected abstract getDragBound(pos: { x: number; y: number }, state: ScrollbarRenderState): { x: number; y: number };

  protected abstract getScrollStateFromThumb(state: ScrollbarRenderState): ScrollState;

  protected abstract getScrollStateFromTrackClick(state: ScrollbarRenderState, pointer: { x: number; y: number }): ScrollState;

  private createScrollbar(state: ScrollbarRenderState): void {
    const theme = this.engine.getConfig().theme;

    this.group.destroyChildren();

    this.track = new Rect({
      x: 0,
      y: 0,
      width: state.area.width,
      height: state.area.height,
      fill: theme.scrollbarTrackColor,
    });
    this.group.add(this.track);

    this.thumb = new Rect({
      x: this.getThumbX(state),
      y: this.getThumbY(state),
      width: this.getThumbWidth(state),
      height: this.getThumbHeight(state),
      fill: theme.scrollbarThumbColor,
      draggable: true,
      dragBoundFunc: (pos) => this.getDragBound(pos, state),
    });

    this.attachEvents();
    this.group.add(this.thumb);
  }

  private updateThumb(state: ScrollbarRenderState): void {
    if (!this.thumb) {
      return;
    }

    this.thumb.x(this.getThumbX(state));
    this.thumb.y(this.getThumbY(state));
    this.thumb.width(this.getThumbWidth(state));
    this.thumb.height(this.getThumbHeight(state));
  }

  private attachEvents(): void {
    if (!this.thumb) {
      return;
    }

    const eventBus = this.engine.getEventBus();

    this.thumb.on('dragmove', () => {
      eventBus.emit('scroll:change', this.getScrollStateFromCurrentThumb());
    });

    this.thumb.on('dragend', () => {
      eventBus.emit('scroll:change', this.getScrollStateFromCurrentThumb());
    });

    this.group.on('click', (event) => {
      if (event.target === this.thumb) {
        return;
      }

      const state = this.getCurrentRenderState();
      const pointer = this.getPointerPositionInGroup();
      if (!pointer) {
        return;
      }

      eventBus.emit('scroll:change', this.getScrollStateFromTrackClick(state, pointer));
    });
  }

  protected getCurrentRenderState(): ScrollbarRenderState {
    const layoutCalculator = this.engine.getLayoutCalculator();
    const virtualScrollSync = this.engine.getVirtualScrollSync();
    const scrollState = this.engine.getScrollState();
    const layout = layoutCalculator.calculate(
      this.engine.getStage()?.width() || 0,
      this.engine.getStage()?.height() || 0
    );
    const area = this.getArea(layout);

    return {
      area,
      scrollbar: virtualScrollSync.getScrollbarState(
        scrollState.scrollX,
        scrollState.scrollY,
        area.width,
        area.height
      ),
    };
  }

  protected abstract getArea(layout: LayoutResult): Area;

  private getScrollStateFromCurrentThumb(): ScrollState {
    return this.getScrollStateFromThumb(this.getCurrentRenderState());
  }

  protected getPointerPositionInGroup(): { x: number; y: number } | null {
    const pointer = this.engine.getStage()?.getPointerPosition();
    if (!pointer) {
      return null;
    }

    const groupPos = this.group.getAbsolutePosition();
    return {
      x: pointer.x - groupPos.x,
      y: pointer.y - groupPos.y,
    };
  }

  protected toLocalPosition(pos: { x: number; y: number }): { x: number; y: number; groupX: number; groupY: number } {
    const groupPos = this.group.getAbsolutePosition();
    return {
      x: pos.x - groupPos.x,
      y: pos.y - groupPos.y,
      groupX: groupPos.x,
      groupY: groupPos.y,
    };
  }
}
