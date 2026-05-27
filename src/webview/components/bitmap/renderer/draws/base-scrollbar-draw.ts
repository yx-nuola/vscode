import Konva from 'konva';
import type { BitmapGridEngine } from '../../utils/bitmap-gridEngine';
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
  protected slider: RectType | null;

  constructor(engine: BitmapGridEngine, name: string) {
    this.engine = engine;
    this.group = new Group({ name });
    this.track = null;
    this.slider = null;
  }

  getGroup(): GroupType {
    return this.group;
  }

  setPosition(x: number, y: number): void {
    this.group.x(x);
    this.group.y(y);
  }

  isDragging(): boolean {
    return this.slider?.isDragging() ?? false;
  }

  render(state: ScrollbarRenderState): void {
    if (!this.track || !this.slider) {
      this.createScrollbar(state);
      return;
    }

    const theme = this.engine.getConfig().theme;
    this.track.width(state.area.width);
    this.track.height(state.area.height);
    this.track.fill(theme.scrollbarTrackColor);
    this.slider.fill(theme.scrollbarSliderColor);
    this.slider.dragBoundFunc((pos) => this.getDragBound(pos, state));

    if (!this.slider.isDragging()) {
      this.updateSlider(state);
    }
  }

  destroy(): void {
    this.group.destroy();
  }

  protected abstract getSliderX(state: ScrollbarRenderState): number;

  protected abstract getSliderY(state: ScrollbarRenderState): number;

  protected abstract getSliderWidth(state: ScrollbarRenderState): number;

  protected abstract getSliderHeight(state: ScrollbarRenderState): number;

  protected abstract getDragBound(pos: { x: number; y: number }, state: ScrollbarRenderState): { x: number; y: number };

  protected abstract getScrollStateFromSlider(state: ScrollbarRenderState): ScrollState;

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

    this.slider = new Rect({
      x: this.getSliderX(state),
      y: this.getSliderY(state),
      width: this.getSliderWidth(state),
      height: this.getSliderHeight(state),
      fill: theme.scrollbarSliderColor,
      draggable: true,
      dragBoundFunc: (pos) => this.getDragBound(pos, state),
    });

    this.attachEvents();
    this.group.add(this.slider);
  }

  private updateSlider(state: ScrollbarRenderState): void {
    if (!this.slider) {
      return;
    }

    this.slider.x(this.getSliderX(state));
    this.slider.y(this.getSliderY(state));
    this.slider.width(this.getSliderWidth(state));
    this.slider.height(this.getSliderHeight(state));
  }

  private attachEvents(): void {
    if (!this.slider) {
      return;
    }

    this.slider.on('dragmove', () => {
      const scrollState = this.getScrollStateFromCurrentSlider();
      this.engine.scrollTo(scrollState.scrollX, scrollState.scrollY);
    });

    this.slider.on('dragend', () => {
      const scrollState = this.getScrollStateFromCurrentSlider();
      this.engine.scrollTo(scrollState.scrollX, scrollState.scrollY);
    });

    this.group.on('click', (event) => {
      if (event.target === this.slider) {
        return;
      }

      const state = this.getCurrentRenderState();
      const pointer = this.getPointerPositionInGroup();
      if (!pointer) {
        return;
      }

      const scrollState = this.getScrollStateFromTrackClick(state, pointer);
      this.engine.scrollTo(scrollState.scrollX, scrollState.scrollY);
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

  private getScrollStateFromCurrentSlider(): ScrollState {
    return this.getScrollStateFromSlider(this.getCurrentRenderState());
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
