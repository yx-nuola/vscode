import Konva from 'konva';
import * as Types from '../types';
import * as Constants from '../constants';
import { throttle } from 'lodash-es';


interface Option {
  barHeight: number; // 滚动条的高度
  margin: number; // 滚动条和旁边方块的间距
  contentOffset: number; // 实际容器宽度的偏移量
  triangle: number;
}

interface State {
  dragging: boolean;
  maxWidth: number;
  actualWidth: number;
  maxGrids: number;
  gridWidth: number;
  offsetY: number;
  minOffsetX: number;
  maxOffsetX: number;
  thumbWidth: number;
  left: number;
  visible: boolean;
}

export class HorizontalBarDraw extends Types.BaseDraw implements Types.D {
  static override readonly name = 'HorizontalBarDraw';
  private readonly option: Option = {
    barHeight: Constants.SCROLLBAR_CLIENT,
    margin: Constants.SCROLLBAR_MARGIN,
    contentOffset: Constants.ROW_AVATAR_WIDTH,
    triangle: Constants.SCROLLBAR_TRIANGLE,
  };
  private leftCube!: Konva.Rect;
  private leftTriangle!: Konva.Path;
  private rightCube!: Konva.Rect;
  private rightTriangle!: Konva.Path;
  private barTrack!: Konva.Rect;
  private barHandle!: Konva.Rect;

  private state: State = {
    dragging: false,
    maxWidth: 0,
    actualWidth: 0,
    maxGrids: 0,
    gridWidth: 0,
    offsetY: 0,
    minOffsetX: 0,
    maxOffsetX: 0,
    thumbWidth: 0,
    left: 0,
    visible: false,
  };

  constructor(renderer: Types.Renderer, config: Types.Config, layer: Konva.Layer) {
    super(renderer, config, layer);

    this.group.offset({ x: 0.5, y: 0.5 });

    this.renderer.horizontalBarTool.initAxisAttrs();

    this.setState();

    // 一次控制 后面再不绘制
    this.permanent();
  }

  private setState(): void {
    const context = this.renderer.getContext();
    const { width, height, zoom, translateX = 0, scrollbar } = context;
    const { actualGrids, maxGrids } = zoom;

    this.state.maxGrids = maxGrids;
    this.state.actualWidth = width - this.option.contentOffset - (scrollbar.vertical ? this.option.barHeight : 0);
    this.state.gridWidth = this.state.actualWidth / actualGrids;
    this.state.maxWidth = maxGrids * this.state.gridWidth;

    this.state.thumbWidth = Math.max(this.option.barHeight, (this.state.actualWidth / this.state.maxWidth) * this.state.actualWidth);
    this.state.minOffsetY = height - this.option.barHeight;
    // this.state.minOffsetX = this.option.contentOffset;
    this.state.minOffsetX = this.option.contentOffset;
    this.state.maxOffsetX = width - this.state.thumbWidth - (scrollbar.vertical ? this.option.barHeight : 0);
    this.state.visible = scrollbar.horizontal;

    this.state.left = this.state.minOffsetX;
    if (translateX) {
      const dx = this.option.contentOffset;
      const ratio = translateX / (this.state.maxOffsetX - dx);
      this.state.left = (this.state.maxOffsetX - dx) * ratio + dx;
    }
  }

  private permanent(): void {
    // stage 状态
    const context = this.renderer.getContext();
    const { width, scrollbar } = context;
    const group = new Konva.Group();
    this.barTrack = new Konva.Rect({
      name: this.constructor.name,
      x: 0,
      y: this.state.offsetY,
      width: width - (scrollbar.vertical ? this.option.barHeight : 0),
      height: this.option.barHeight,
      fill: 'transparent',
    });
    group.add(this.barTrack);

    // 滑块
    this.barHandle = new Konva.Rect({
      name: 'thumb_${this.constructor.name}',
      x: this.state.left,
      y: this.state.offsetY,
      width: this.state.thumbWidth,
      height: this.option.barHeight,
      // fill: this.theme.header.fill,
      fill: 'rgba(121, 121, 121, 0.4)',
      draggable: true,
      dragBoundFunc: (pos) => ({
        x: Math.min(Math.max(pos.x, this.state.minOffsetX), this.state.maxOffsetX),
        y: this.state.offsetY,
      }),
    });

    this.barHandle.on('dragstart', (e) => {
      if (e.evt.button === 0) {
        const left = e.target.x();
        this.drag(left);
      }
      e.evt.preventDefault();
    });

    this.barHandle.on('dragmove', (e) => {
      if (this.state.dragging) {
        const left = e.target.x();
        this.drag(left);
      }
      e.evt.preventDefault();
    });

    this.barHandle.on('dragend', () => {
      this.state.dragging = false;
    });

    this.barHandle.on('mousedown', (e) => {
      e.cancelBubble = true;
      this.state.dragging = false;
    });

    this.barHandle.on('mouseup', () => {
      this.state.dragging = false;
    });

    group.add(this.barHandle);

    this.group.add(group);
    this.group.visible(this.state.visible);
  }

  private drag = throttle((left: number) => {
    const dx = this.option.contentOffset;
    const ratio = (left - dx) / (this.state.maxOffsetX - dx);
    const translateX = ratio * (this.state.maxWidth - this.state.actualWidth);
    this.renderer.horizontalbarTool.setAxisAttrs(translateX, 16);
  }, 16);

  override draw(): void {
    // 更新状态
    const { width, scrollbar } = this.renderer.getContext();
    const { left, thumbWidth, visible, offsetY, minOffsetX, maxOffsetX } = this.state;
    this.barTrack.y(offsetY);
    this.barTrack.width(width - (scrollbar.vertical ? this.option.barHeight : 0));
    this.barHandle.x(left);
    this.barHandle.y(offsetY);
    this.barHandle.width(thumbWidth);
    this.barHandle.dragBoundFunc(() => ({ x: Math.min(Math.max(pos.x, minOffsetX), maxOffsetX), y: offsetY }));
    this.group.visible(visible);
    this.layer.batchDraw();
  }
}