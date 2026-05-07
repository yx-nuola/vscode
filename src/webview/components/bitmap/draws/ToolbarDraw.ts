/**
 * 工具栏按钮渲染
 */

import Konva from 'konva';
import type { BitmapGridEngine } from '../core/BitmapGridEngine';

const { Group, Rect, Text } = Konva;
type GroupType = InstanceType<typeof Group>;
type RectType = InstanceType<typeof Rect>;
type TextType = InstanceType<typeof Text>;

/**
 * 工具栏绘制类
 */
export class ToolbarDraw {
  private engine: BitmapGridEngine;
  private group: GroupType;
  private zoomInButton: RectType | null;
  private zoomOutButton: RectType | null;
  private resetButton: RectType | null;
  private zoomText: TextType | null;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.group = new Group({ name: 'toolbar' });
    this.zoomInButton = null;
    this.zoomOutButton = null;
    this.resetButton = null;
    this.zoomText = null;
  }

  /**
   * 获取组
   */
  getGroup(): GroupType {
    return this.group;
  }

  /**
   * 设置工具栏位置
   */
  setPosition(x: number, y: number): void {
    this.group.x(x);
    this.group.y(y);
  }

  /**
   * 渲染工具栏
   */
  renderToolbar(): void {
    const config = this.engine.getConfig();
    const theme = config.theme;
    const layoutCalculator = this.engine.getLayoutCalculator();

    // 如果已经渲染过，只更新缩放文本
    if (this.zoomInButton && this.zoomOutButton && this.resetButton) {
      this.updateZoomText();
      return;
    }

    // 获取布局
    const layout = layoutCalculator.calculate(
      this.engine.getStage()?.width() || 0,
      this.engine.getStage()?.height() || 0
    );

    const { toolbar } = layout;

    // 渲染背景
    const background = new Rect({
      x: 0,
      y: 0,
      width: toolbar.width,
      height: toolbar.height,
      fill: theme.backgroundColor,
    });
    this.group.add(background);

    // 按钮配置
    const buttonWidth = 60;
    const buttonHeight = 24;
    const buttonSpacing = 10;
    const startX = 10;
    const startY = (toolbar.height - buttonHeight) / 2;

    // 放大按钮
    this.zoomInButton = new Rect({
      x: startX,
      y: startY,
      width: buttonWidth,
      height: buttonHeight,
      fill: '#f0f0f0',
      stroke: '#ccc',
      strokeWidth: 1,
      cornerRadius: 4,
    });
    this.attachZoomInEvents();
    this.group.add(this.zoomInButton);

    const zoomInLabel = new Text({
      x: startX + buttonWidth / 2,
      y: startY + buttonHeight / 2,
      text: '放大',
      fontSize: 12,
      fontFamily: 'Arial',
      fill: '#333',
      align: 'center',
      verticalAlign: 'middle',
      offsetX: 20,
      offsetY: 8,
    });
    this.group.add(zoomInLabel);

    // 缩小按钮
    this.zoomOutButton = new Rect({
      x: startX + buttonWidth + buttonSpacing,
      y: startY,
      width: buttonWidth,
      height: buttonHeight,
      fill: '#f0f0f0',
      stroke: '#ccc',
      strokeWidth: 1,
      cornerRadius: 4,
    });
    this.attachZoomOutEvents();
    this.group.add(this.zoomOutButton);

    const zoomOutLabel = new Text({
      x: startX + buttonWidth + buttonSpacing + buttonWidth / 2,
      y: startY + buttonHeight / 2,
      text: '缩小',
      fontSize: 12,
      fontFamily: 'Arial',
      fill: '#333',
      align: 'center',
      verticalAlign: 'middle',
      offsetX: 20,
      offsetY: 8,
    });
    this.group.add(zoomOutLabel);

    // 还原按钮
    this.resetButton = new Rect({
      x: startX + (buttonWidth + buttonSpacing) * 2,
      y: startY,
      width: buttonWidth,
      height: buttonHeight,
      fill: '#f0f0f0',
      stroke: '#ccc',
      strokeWidth: 1,
      cornerRadius: 4,
    });
    this.attachResetEvents();
    this.group.add(this.resetButton);

    const resetLabel = new Text({
      x: startX + (buttonWidth + buttonSpacing) * 2 + buttonWidth / 2,
      y: startY + buttonHeight / 2,
      text: '还原',
      fontSize: 12,
      fontFamily: 'Arial',
      fill: '#333',
      align: 'center',
      verticalAlign: 'middle',
      offsetX: 20,
      offsetY: 8,
    });
    this.group.add(resetLabel);

    // 缩放比例显示
    this.zoomText = new Text({
      x: startX + (buttonWidth + buttonSpacing) * 3 + 20,
      y: startY + buttonHeight / 2,
      text: `Zoom: ${this.engine.getZoomLevel()}px`,
      fontSize: 12,
      fontFamily: 'Arial',
      fill: '#333',
      align: 'left',
      verticalAlign: 'middle',
      offsetY: 8,
    });
    this.group.add(this.zoomText);
  }

  /**
   * 附加放大按钮事件
   */
  private attachZoomInEvents(): void {
    if (!this.zoomInButton) return;

    this.zoomInButton.on('click', () => {
      this.engine.zoomIn();
      this.updateZoomText();
    });

    this.zoomInButton.on('mouseenter', () => {
      this.zoomInButton?.fill('#e0e0e0');
    });

    this.zoomInButton.on('mouseleave', () => {
      this.zoomInButton?.fill('#f0f0f0');
    });
  }

  /**
   * 附加缩小按钮事件
   */
  private attachZoomOutEvents(): void {
    if (!this.zoomOutButton) return;

    this.zoomOutButton.on('click', () => {
      this.engine.zoomOut();
      this.updateZoomText();
    });

    this.zoomOutButton.on('mouseenter', () => {
      this.zoomOutButton?.fill('#e0e0e0');
    });

    this.zoomOutButton.on('mouseleave', () => {
      this.zoomOutButton?.fill('#f0f0f0');
    });
  }

  /**
   * 附加还原按钮事件
   */
  private attachResetEvents(): void {
    if (!this.resetButton) return;

    this.resetButton.on('click', () => {
      this.engine.resetZoom();
      this.updateZoomText();
    });

    this.resetButton.on('mouseenter', () => {
      this.resetButton?.fill('#e0e0e0');
    });

    this.resetButton.on('mouseleave', () => {
      this.resetButton?.fill('#f0f0f0');
    });
  }

  /**
   * 更新缩放文本
   */
  private updateZoomText(): void {
    if (this.zoomText) {
      this.zoomText.text(`Zoom: ${this.engine.getZoomLevel()}px`);
    }
  }

  /**
   * 销毁绘制
   */
  destroy(): void {
    this.group.destroy();
  }
}
