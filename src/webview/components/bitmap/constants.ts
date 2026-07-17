/**
 * 格子矩阵图形固定宽度,高度（不包含坐标轴、滚动条）
 */
export const BITMAP_WIDTH = 896;
export const BITMAP_HEIGHT = 896;
/**
 * 默认格子尺寸（一行64个格子）
 */
export const DEFAULT_CELL_SIZE = 14;

/**
 * 最大格子尺寸（一行16个格子）
 */
export const MAX_CELL_SIZE = 56;

/**
 * 默认列数（固定64列）
 */
export const DEFAULT_COLS = 64;

/**
 * 默认行数（固定64行）
 */
export const DEFAULT_ROWS = 64;

/**
 * 起始位置
 */
export const START_POSITION = 40;

/**
 * 间距
 */
export const PADDING = 4;

/**
 * 滚动条
 */
export const SCROLL = 12;

export const defaultColorRule = [
  { min: 0, max: 0.2, color: '#D8D8D8', title: '0~0.2(Unformed)', value:0 },
  { min: 0.2, max: 2, color: '#3377DD', title: '0.2~2(Reset)' , value:1}, // 蓝色
  { min: 2, max: 4, color: '#FFAA33', title: '2~4(Unstable)', value:2 }, // 黄
  { min: 4, max: 6, color: '#33AA55', title: '4~6(Set)', value:3 }, // 绿色
  { min: 6, color: '#DD3333', title: '>6(Strong Set)', value:4 }, // 红色
];

export const EMPTY_CELL_VAL = -999999;
