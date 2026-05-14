import type { BitmapGridEngine } from '../../core/BitmapGridEngine';
import type { Area, LayoutResult, ScrollState } from '../../types';
import { BaseScrollbarDraw, type ScrollbarRenderState } from './BaseScrollbarDraw';

export class VerticalScrollbarDraw extends BaseScrollbarDraw {
  constructor(engine: BitmapGridEngine) {
    super(engine, 'verticalScrollbar');
  }

  protected getArea(layout: LayoutResult): Area {
    return layout.verticalScrollbar;
  }

  protected getSliderX(): number {
    return 0;
  }

  protected getSliderY(state: ScrollbarRenderState): number {
    return state.scrollbar.sliderY;
  }

  protected getSliderWidth(state: ScrollbarRenderState): number {
    return state.area.width;
  }

  protected getSliderHeight(state: ScrollbarRenderState): number {
    return state.scrollbar.sliderHeight;
  }

  protected getDragBound(pos: { x: number; y: number }, state: ScrollbarRenderState): { x: number; y: number } {
    const local = this.toLocalPosition(pos);
    const maxSliderY = state.area.height - state.scrollbar.sliderHeight;
    const clampedY = Math.max(0, Math.min(local.y, maxSliderY));

    return {
      x: local.groupX,
      y: local.groupY + clampedY,
    };
  }

  protected getScrollStateFromSlider(state: ScrollbarRenderState): ScrollState {
    return this.engine.getVirtualScrollSync().getScrollFromSlider(
      0,
      this.slider?.y() ?? 0,
      state.area.width,
      state.area.height
    );
  }

  protected getScrollStateFromTrackClick(state: ScrollbarRenderState, pointer: { x: number; y: number }): ScrollState {
    const sliderCenterY = Math.max(
      state.scrollbar.sliderHeight / 2,
      Math.min(pointer.y, state.area.height - state.scrollbar.sliderHeight / 2)
    );

    return this.engine.getVirtualScrollSync().getScrollFromSlider(
      0,
      sliderCenterY - state.scrollbar.sliderHeight / 2,
      state.area.width,
      state.area.height
    );
  }
}
