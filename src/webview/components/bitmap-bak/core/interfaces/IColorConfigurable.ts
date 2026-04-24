/**
 * 颜色配置接口
 * 定义颜色映射功能的契约
 */

// ========== 颜色配置类型 ==========

export interface ColorRange {
  /** 最小值（包含） */
  min: number;
  /** 最大值（不包含） */
  max: number;
  /** 颜色值（CSS颜色） */
  color: string;
  /** 可选的标签 */
  label?: string;
}

export interface ColorConfig {
  /** 颜色区间数组 */
  ranges: ColorRange[];
  /** 回退颜色（不匹配任何区间时使用） */
  fallbackColor: string;
  /** Pass状态颜色 */
  passColor: string;
  /** Fail状态颜色 */
  failColor: string;
  /** 是否使用状态颜色（优先于区间颜色） */
  useStatusColor: boolean;
  /** 获取数值的函数（用于颜色区间映射） */
  getValue?: (cell: unknown) => number;
}

// ========== 颜色配置接口 ==========

export interface IColorConfigurable<T> {
  /** 颜色配置 */
  colorConfig: ColorConfig;
  
  /**
   * 设置颜色区间
   * @param ranges 颜色区间数组
   */
  setColorRanges(ranges: ColorRange[]): void;
  
  /**
   * 设置状态颜色
   * @param passColor Pass状态颜色
   * @param failColor Fail状态颜色
   */
  setStatusColors(passColor: string, failColor: string): void;
  
  /**
   * 设置回退颜色
   * @param color 回退颜色
   */
  setFallbackColor(color: string): void;
  
  /**
   * 设置是否优先使用状态颜色
   * @param use 是否优先使用
   */
  setUseStatusColor(use: boolean): void;
  
  /**
   * 更新颜色配置并触发重绘
   * 颜色变更后需要重新渲染所有单元格
   */
  updateColorConfig(): void;
  
  /**
   * 根据单元格数据获取颜色
   * @param cell 单元格数据
   * @param row 行号
   * @param col 列号
   * @returns CSS颜色值
   */
  getCellColor(cell: T | null, row: number, col: number): string;
}
