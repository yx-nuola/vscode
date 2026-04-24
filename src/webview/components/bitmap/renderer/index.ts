import Konva from 'konva';
import * as Types from './types';
import * as Tools from './tools';
import * as Draws from './draws';
import * as Handlers from './handlers';
import { isEmpty } from 'lodash-es';
import mitt, { type Emitter } from 'mitt';

export default class TimingRenderer {
  stage: Konva.Stage;
  // 主要层 绘制 tick period waveform
  layer: Konva.Layer = new Konva.Layer({ id: 'main' });
  // 绘制 cosine waveform
  layerCosine: Konva.Layer = new Konva.Layer({ id: 'cosine' });
  // 绘制网格 滚动条
  layerFloor: Konva.Layer = new Konva.Layer({ id: 'floor' });
  // 绘制 mark
  layerCover: Konva.Layer = new Konva.Layer({ id: 'cover' });
  // 配置
  config: Types.Config;
  // 缩放分辨率工具
  zoomTool: Tools.ZoomTool;
  // 滚动条工具
  verticalbarTool: Tools.VerticalbarTool;
  horizontalbarTool: Tools.HorizontalbarTool;
  // marker 工具
  markerTool: Tools.MarkerTool;
  // 控制 x轴 和 y轴显示 delta 的工具
  deltaTool: Tools.DeltaTool;
  // 波形管理工具
  waveformTool: Tools.WaveformTool;
  // 通信工具 链接renderer 和 外部
  channelTool: Tools.ChannelTool;
  // 绘制
  draws: { [index: string]: Types.Draw & Types.Handler } = {};
  // 事件处理
  handlers: { [index: string]: Types.Handler } = {};
  protected emitter: Emitter<Types.RenderEvents> = mitt();
  on: Emitter<Types.RenderEvents>['on'] = this.emitter.on.bind(this.emitter);
  off: Emitter<Types.RenderEvents>['off'] = this.emitter.off.bind(this.emitter);
  emit: Emitter<Types.RenderEvents>['emit'] = this.emitter.emit.bind(this.emitter);

  constructor(container: HTMLElement, config: Types.Config) {
    this.config = config;
    this.on = this.emitter.on.bind(this.emitter);
    this.off = this.emitter.off.bind(this.emitter);
    this.emit = this.emitter.emit.bind(this.emitter);
    this.stage = new Konva.Stage({
      container: container as HTMLDivElement,
      width: container.clientWidth,
      height: container.clientHeight,
      pixelRatio: window.devicePixelRatio || 1,
      // 偏移
      offset: { x: -0.5, y: -0.5 },
    });
    this.zoomTool = new Tools.ZoomTool(this);
    this.horizontalbarTool = new Tools.HorizontalbarTool(this);
    this.verticalbarTool = new Tools.VerticalbarTool(this);
    this.markerTool = new Tools.MarkerTool(this);
    this.deltaTool = new Tools.DeltaTool(this);
    this.waveformTool = new Tools.WaveformTool(this);
    this.channelTool = new Tools.ChannelTool(this);
    // 背景层
    this.draws[Draws.DashedDraw.name] = new Draws.DashedDraw(this, this.config, this.layerFloor);
    this.draws[Draws.HorizontalbarDraw.name] = new Draws.HorizontalbarDraw(this, this.config, this.layerFloor);
    this.draws[Draws.VerticalbarDraw.name] = new Draws.VerticalbarDraw(this, this.config, this.layerFloor);
    // 绘制层
    this.draws[Draws.TickDraw.name] = new Draws.TickDraw(this, this.config, this.layer);
    this.draws[Draws.PeriodDraw.name] = new Draws.PeriodDraw(this, this.config, this.layer);
    this.draws[Draws.LayoutDraw.name] = new Draws.LayoutDraw(this, this.config, this.layer);
    // 绘制层
    this.draws[Draws.CosineDraw.name] = new Draws.CosineDraw(this, this.config, this.layerCosine);
    // marker 层
    this.draws[Draws.MarkerDraw.name] = new Draws.MarkerDraw(this, this.config, this.layerCover);
    this.draws[Draws.DeltayDraw.name] = new Draws.DeltayDraw(this, this.config, this.layerCover);
    // 事件处理
    this.handlers[Handlers.WheelHandler.name] = new Handlers.WheelHandler(this);
    // 初始化
    this.init();
  }

  private init() {
    this.stage.add(this.layerFloor);
    this.draws[Draws.DashedDraw.name]?.init();
    this.draws[Draws.HorizontalbarDraw.name]?.init();
    this.draws[Draws.VerticalbarDraw.name]?.init();
    this.stage.add(this.layer);
    this.draws[Draws.TickDraw.name]?.init();
    this.draws[Draws.PeriodDraw.name]?.init();
    this.draws[Draws.LayoutDraw.name]?.init();
    this.stage.add(this.layerCosine);
    this.draws[Draws.CosineDraw.name]?.init();
    this.stage.add(this.layerCover);
    this.draws[Draws.DeltayDraw.name]?.init();
    this.draws[Draws.MarkerDraw.name]?.init();
    // 事件绑定
    this.eventsBind();
  }

  redraw(drawNames?: string[]) {
    const all = [
      Draws.TickDraw.name,
      Draws.PeriodDraw.name,
      Draws.HorizontalbarDraw.name,
      Draws.VerticalbarDraw.name,
      Draws.DashedDraw.name,
      Draws.LayoutDraw.name,
      Draws.CosineDraw.name,
      Draws.MarkerDraw.name,
      Draws.DeltayDraw.name,
    ];

    if (Array.isArray(drawNames)) {
      // 选择性 draw 也要保持顺序
      for (const name of all) {
        if (drawNames.includes(name)) {
          this.draws[name]?.draw();
        }
      }
    } else {
      for (const name of all) {
        this.draws[name]?.draw();
      }
    }
  }

  private eventsBind() {
    for (const event of ['mousedown', 'mouseup', 'mousemove', 'mouseover', 'wheel', 'contextmenu']) {
      this.stage.on(event, (e) => {
        e.evt?.preventDefault();

        for (const k in this.draws) {
          this.draws[k]?.handlers?.stage?.[event]?.(e);
        }

        for (const k in this.handlers) {
          this.handlers[k]?.handlers?.stage?.[event]?.(e);
        }
      });
    }
  }

  // 获取 stage 状态
  getContext() {
    return {
      width: this.stage.width(),
      height: this.stage.height(),
      zoom: this.stage.attrs.zoom,
      translateX: this.stage.attrs.translateX,
      xAxis: this.stage.attrs.xAxis,
      translateY: this.stage.attrs.translateY,
      yAxis: this.stage.attrs.yAxis,
      marker: this.stage.attrs.marker,
      scrollbar: this.stage.attrs.scrollbar,
      delta: this.stage.attrs.delta,
      display: this.stage.attrs.display,
    };
  }

  zoom(zoom: Types.Zoom) {
    if (!this.zoomTool) {
      console.warn('zoomTool is not properly initialized');
      return;
    }
    try {
      // 执行缩放操作
      if (zoom === Types.Zoom.In) {
        this.zoomTool.zoomIn();
      } else {
        this.zoomTool.zoomOut();
      }
    } catch (error) {
      console.error('Error occurred during zoom operation:', error);
    }
  }

  // 切换主题
  setTheme(theme: Types.Themes) {
    if (!this.channelTool) {
      console.warn('channelTool is not properly initialized');
      return;
    }
    this.channelTool.onThemeRequest(theme);
  }

  // 显示隐藏 Deltay
  setDelta() {
    if (!this.deltaTool) {
      console.warn('deltaTool is not properly initialized');
      return;
    }
    this.deltaTool?.setDeltayAttrs();
  }

  // 显示隐藏 square 波形
  setDisplay(edge: Types.Edge) {
    if (!this.waveformTool) {
      console.warn('waveformTool is not properly initialized');
      return;
    }
    this.waveformTool?.setDisplayAttrs(edge);
  }

  // 清除 cosine 波形
  clearCosine() {
    if (!this.waveformTool) {
      console.warn('waveformTool is not properly initialized');
      return;
    }
    this.waveformTool.clearCosineWaveform();
  }

  sendRequest(ticks: number[]) {
    if (isEmpty(ticks)) return;
    if (!this.channelTool) {
      console.warn('channelTool is not properly initialized');
      return;
    }
    this.channelTool.onCosineRequest(ticks);
  }

  // 通知 renderer 更新了 marker 的位置
  sendMarker(marker: Types.Marker) {
    if (isEmpty(marker)) return;
    if (!this.channelTool) {
      console.warn('channelTool is not properly initialized');
      return;
    }
    this.channelTool.onMarkerRequest(marker);
  }

  // 通知 renderer 定位到指定 signal 的位置
  sendThumbtack(signalName: string) {
    if (!this.channelTool) {
      console.warn('channelTool is not properly initialized');
      return;
    }
    this.channelTool.onThumbtackRequest(signalName);
  }

  // 重设 stage 尺寸 暂时先不开放
  resize(width: number, height: number) {
    const context = this.getContext();
    const { zoom, xAxis, yAxis } = context;

    const lastGridWidth = zoom.gridWidth;

    // 1、设置新的宽高
    this.stage.setAttrs({
      width: width,
      height: height,
    });
    // 2、根据新的宽高 设置缩放 得到横向纵向是否展示滚动条
    this.zoomTool.setZoomAttrs(zoom.ratio);
    // 这里可以分别判断width 和 height 发生变化处理
    this.verticalbarTool.resizeAxisAttrs(height, yAxis);
    this.horizontalbarTool.resizeAxisAttrs(width, lastGridWidth);
    // 重绘
    this.redraw();
  }

  destroy() {
    this.emitter.all.clear();
    this.stage.destroy();
  }
}