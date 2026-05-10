import type { BitmapGridEngine } from '../core/BitmapGridEngine';
import type { Area, LayoutResult, ScrollState } from '../types';
import { BaseScrollbarDraw, type ScrollbarRenderState } from './BaseScrollbarDraw';

export class HorizontalScrollbarDraw extends BaseScrollbarDraw {
  constructor(engine: BitmapGridEngine) {
    super(engine, 'horizontalScrollbar');
  }

  protected getArea(layout: LayoutResult): Area {
    return layout.horizontalScrollbar;
  }

  protected getThumbX(state: ScrollbarRenderState): number {
    return state.scrollbar.thumbX;
  }

  protected getThumbY(): number {
    return 0;
  }

  protected getThumbWidth(state: ScrollbarRenderState): number {
    return state.scrollbar.thumbWidth;
  }

  protected getThumbHeight(state: ScrollbarRenderState): number {
    return state.area.height;
  }

  protected getDragBound(pos: { x: number; y: number }, state: ScrollbarRenderState): { x: number; y: number } {
    const local = this.toLocalPosition(pos);
    const maxThumbX = state.area.width - state.scrollbar.thumbWidth;
    const clampedX = Math.max(0, Math.min(local.x, maxThumbX));

    return {
      x: local.groupX + clampedX,
      y: local.groupY,
    };
  }

  protected getScrollStateFromThumb(state: ScrollbarRenderState): ScrollState {
    return this.engine.getVirtualScrollSync().getScrollFromThumb(
      this.thumb?.x() ?? 0,
      0,
      state.area.width,
      state.area.height
    );
  }

  protected getScrollStateFromTrackClick(state: ScrollbarRenderState, pointer: { x: number; y: number }): ScrollState {
    const thumbCenterX = Math.max(
      state.scrollbar.thumbWidth / 2,
      Math.min(pointer.x, state.area.width - state.scrollbar.thumbWidth / 2)
    );

    return this.engine.getVirtualScrollSync().getScrollFromThumb(
      thumbCenterX - state.scrollbar.thumbWidth / 2,
      0,
      state.area.width,
      state.area.height
    );
  }
}
