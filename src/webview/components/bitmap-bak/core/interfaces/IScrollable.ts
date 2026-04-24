/**
 * 滚动控制接口
 * 定义滚动功能的契约
 */

// ========== 滚动配置 ==========

export interface ScrollConfig {
  /** 是否显示水平滚动条 */
  showHorizontal: boolean;
  /** 是否显示垂直滚动条 */
  showVertical: boolean;
  /** 是否自动隐藏滚动条 */
  autoHide: boolean;
  /** 滚动速度（像素/帧） */
  scrollSpeed?: number;
}

export interface ScrollPosition {
  /** 水平滚动位置 */
  left: number;
  /** 垂直滚动位置 */
  top: number;
}

// ========== 滚动接口 ==========

export interface IScrollable {
  /** 滚动配置 */
  readonly scrollConfig: ScrollConfig;
  
  /** 当前滚动位置 */
  readonly scrollPosition: ScrollPosition;
  
  /**
   * 滚动到指定位置
   * @param x 水平位置
   * @param y 垂直位置
   */
  scrollTo(x: number, y: number): void;
  
  /**
   * 相对滚动
   * @param deltaX 水平偏移
   * @param deltaY 垂直偏移
   */
  scrollBy(deltaX: number, deltaY: number): void;
  
  /**
   * 获取当前滚动位置
   * @returns 滚动位置
   */
  getScrollPosition(): ScrollPosition;
  
  /**
   * 设置滚动位置
   * @param position 滚动位置
   */
  setScrollPosition(position: ScrollPosition): void;
  
  /**
   * 检查是否显示水平滚动条
   * @returns 是否显示
   */
  shouldShowHorizontalScroll(): boolean;
  
  /**
   * 检查是否显示垂直滚动条
   * @returns 是否显示
   */
  shouldShowVerticalScroll(): boolean;
  
  /**
   * 获取内容总宽度
   * @returns 宽度（像素）
   */
  getContentWidth(): number;
  
  /**
   * 获取内容总高度
   * @returns 高度（像素）
   */
  getContentHeight(): number;
  
  /**
   * 获取视口宽度
   * @returns 宽度（像素）
   */
  getViewportWidth(): number;
  
  /**
   * 获取视口高度
   * @returns 高度（像素）
   */
  getViewportHeight(): number;
  
  /**
   * 滚动位置变化回调
   * @param offsetX 水平偏移
   * @param offsetY 垂直偏移
   */
  onScrollChange?(offsetX: number, offsetY: number): void;
}
