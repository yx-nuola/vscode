/**
 * LIGHT_THEME、DARK_THEME 预设
 */

import type { BitmapTheme } from '../types';

/**
 * 浅色主题
 */
export const LIGHT_THEME: BitmapTheme = {
  backgroundColor: '#ffffff',
  axisColor: '#e0e0e0',
  axisTextColor: '#333333',
  scrollbarTrackColor: '#f0f0f0',
  scrollbarThumbColor: '#c0c0c0',
  highlightColor: '#2196f3',
  borderColor: '#e0e0e0',
  defaultCellColor: '#f5f5f5',
};

/**
 * 深色主题
 */
export const DARK_THEME: BitmapTheme = {
  backgroundColor: '#1e1e1e',
  axisColor: '#3e3e3e',
  axisTextColor: '#cccccc',
  scrollbarTrackColor: '#2e2e2e',
  scrollbarThumbColor: '#4e4e4e',
  highlightColor: '#64b5f6',
  borderColor: '#3e3e3e',
  defaultCellColor: '#2e2e2e',
};
