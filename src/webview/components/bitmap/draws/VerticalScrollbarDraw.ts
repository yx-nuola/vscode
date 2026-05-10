import type { BitmapGridEngine } from '../core/BitmapGridEngine';
import type { Area, LayoutResult, ScrollState } from '../types';
import { BaseScrollbarDraw, type ScrollbarRenderState } from './BaseScrollbarDraw';

export class VerticalScrollbarDraw extends BaseScrollbarDraw {
  constructor(engine: BitmapGridEngine) {
    super(engine, 'verticalScrollbar');
  }

  protected getArea(layout: LayoutResult): Area {
    return layout.verticalScrollbar;
  }

  protected getThumbX(): number {
    return 0;
  }

  protected getThumbY(state: ScrollbarRenderState): number {
    return state.scrollbar.thumbY;
  }

  protected getThumbWidth(state: ScrollbarRenderState): number {
    return state.area.width;
  }

  protected getThumbHeight(state: ScrollbarRenderState): number {
    return state.scrollbar.thumbHeight;
  }

  protected getDragBound(pos: { x: number; y: number }, state: ScrollbarRenderState): { x: number; y: number } {
    const local = this.toLocalPosition(pos);
    const maxThumbY = state.area.height - state.scrollbar.thumbHeight;
    const clampedY = Math.max(0, Math.min(local.y, maxThumbY));

    return {
      x: local.groupX,
      y: local.groupY + clampedY,
    };
  }

  protected getScrollStateFromThumb(state: ScrollbarRenderState): ScrollState {
    return this.engine.getVirtualScrollSync().getScrollFromThumb(
      0,
      this.thumb?.y() ?? 0,
      state.area.width,
      state.area.height
    );
  }

  protected getScrollStateFromTrackClick(state: ScrollbarRenderState, pointer: { x: number; y: number }): ScrollState {
    const thumbCenterY = Math.max(
      state.scrollbar.thumbHeight / 2,
      Math.min(pointer.y, state.area.height - state.scrollbar.thumbHeight / 2)
    );

    return this.engine.getVirtualScrollSync().getScrollFromThumb(
      0,
      thumbCenterY - state.scrollbar.thumbHeight / 2,
      state.area.width,
      state.area.height
    );
  }
}
