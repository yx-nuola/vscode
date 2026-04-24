/**
 * 缩放控制接口
 * 定义缩放功能的契约
 */

// ========== 视图状态 ==========

export interface ViewState {
  /** 缩放比例 */
  zoom: number;
  /** X轴偏移 */
  offsetX: number;
  /** Y轴偏移 */
  offsetY: number;
}

// ========== 缩放配置 ==========

export interface ZoomConfig {
  /** 最小缩放比例 */
  minZoom: number;
  /** 最大缩放比例 */
  maxZoom: number;
  /** 缩放步长 */
  zoomStep: number;
}

// ========== 缩放接口 ==========

export interface IZoomable {
  /** 当前视图状态 */
  readonly viewState: ViewState;
  
  /** 缩放配置 */
  readonly zoomConfig: ZoomConfig;
  
  /**
   * 放大
   * @param step 缩放步长，默认为配置值
   */
  zoomIn(step?: number): void;
  
  /**
   * 缩小
   * @param step 缩放步长，默认为配置值
   */
  zoomOut(step?: number): void;
  
  /**
   * 设置指定缩放比例
   * @param zoom 缩放比例
   */
  setZoom(zoom: number): void;
  
  /**
   * 适应屏幕
   * 自动计算最佳缩放比例使全部内容可见
   */
  fitToScreen(): void;
  
  /**
   * 重置视图
   * 恢复默认缩放和位置
   */
  resetView(): void;
  
  /**
   * 缩放到指定单元格
   * @param row 行号
   * @param col 列号
   * @param zoom 可选的缩放比例
   */
  zoomToCell(row: number, col: number, zoom?: number): void;
  
  /**
   * 获取当前视图状态
   * @returns 视图状态
   */
  getViewState(): ViewState;
  
  /**
   * 设置视图状态
   * @param state 视图状态
   */
  setViewState(state: Partial<ViewState>): void;
  
  /**
   * 缩放变化回调
   * @param callback 回调函数
   */
  onZoomChange?(zoom: number): void;
}
