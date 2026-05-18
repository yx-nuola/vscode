import type { BitmapGridEngine } from '../../utils/bitmap-gridEngine';
import type { Area, LayoutResult, ScrollState } from '../../types';
import { BaseScrollbarDraw, type ScrollbarRenderState } from './base-scrollbar-draw';

export class HorizontalScrollbarDraw extends BaseScrollbarDraw {
  constructor(engine: BitmapGridEngine) {
    super(engine, 'horizontalScrollbar');
  }

  protected getArea(layout: LayoutResult): Area {
    return layout.horizontalScrollbar;
  }

  protected getSliderX(state: ScrollbarRenderState): number {
    return state.scrollbar.sliderX;
  }

  protected getSliderY(): number {
    return 0;
  }

  protected getSliderWidth(state: ScrollbarRenderState): number {
    return state.scrollbar.sliderWidth;
  }

  protected getSliderHeight(state: ScrollbarRenderState): number {
    return state.area.height;
  }

  protected getDragBound(pos: { x: number; y: number }, state: ScrollbarRenderState): { x: number; y: number } {
    const local = this.toLocalPosition(pos);
    const maxSliderX = state.area.width - state.scrollbar.sliderWidth;
    const clampedX = Math.max(0, Math.min(local.x, maxSliderX));

    return {
      x: local.groupX + clampedX,
      y: local.groupY,
    };
  }

  protected getScrollStateFromSlider(state: ScrollbarRenderState): ScrollState {
    return this.engine.getVirtualScrollSync().getScrollFromSlider(
      this.slider?.x() ?? 0,
      0,
      state.area.width,
      state.area.height
    );
  }

  protected getScrollStateFromTrackClick(state: ScrollbarRenderState, pointer: { x: number; y: number }): ScrollState {
    const sliderCenterX = Math.max(
      state.scrollbar.sliderWidth / 2,
      Math.min(pointer.x, state.area.width - state.scrollbar.sliderWidth / 2)
    );

    return this.engine.getVirtualScrollSync().getScrollFromSlider(
      sliderCenterX - state.scrollbar.sliderWidth / 2,
      0,
      state.area.width,
      state.area.height
    );
  }
}
