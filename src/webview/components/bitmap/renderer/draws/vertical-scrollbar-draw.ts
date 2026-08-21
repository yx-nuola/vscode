import type { BitmapGridEngine } from '../../utils/bitmap-gridEngine';
import type { Area, LayoutResult, ScrollState } from '../../types';
import { BaseScrollbarDraw, type ScrollbarRenderState } from './base-scrollbar-draw';

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

  protected getDragBound(
    pos: { x: number; y: number },
    state: ScrollbarRenderState
  ): { x: number; y: number } {
    const local = this.toLocalPosition(pos);
    const maxSliderY = state.area.height - state.scrollbar.sliderHeight;
    const clampedY = Math.max(0, Math.min(local.y, maxSliderY));

    return {
      x: local.groupX,
      y: local.groupY + clampedY,
    };
  }

  protected getScrollStateFromSlider(state: ScrollbarRenderState): ScrollState {
    const currentScrollState = this.engine.getScrollState();
    const scrollY = this.engine
      .getVirtualScrollSync()
      .getScrollYFromSlider(this.slider?.y() ?? 0, state.area.height);

    return {
      scrollX: currentScrollState.scrollX,
      scrollY,
    };
  }

  protected getScrollStateFromTrackClick(
    state: ScrollbarRenderState,
    pointer: { x: number; y: number }
  ): ScrollState {
    const sliderCenterY = Math.max(
      state.scrollbar.sliderHeight / 2,
      Math.min(pointer.y, state.area.height - state.scrollbar.sliderHeight / 2)
    );

    const currentScrollState = this.engine.getScrollState();
    const scrollY = this.engine
      .getVirtualScrollSync()
      .getScrollYFromSlider(sliderCenterY - state.scrollbar.sliderHeight / 2, state.area.height);

    return {
      scrollX: currentScrollState.scrollX,
      scrollY,
    };
  }
}
