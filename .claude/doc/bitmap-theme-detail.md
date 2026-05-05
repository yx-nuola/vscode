# Theme 模块详细说明

## 概述

`theme` 模块提供主题配置，定义颜色、字体、边框等样式。

---

## 文件列表

| 文件 | 功能 | 状态 |
|------|------|------|
| `presets.ts` | 预设主题，LIGHT_THEME 和 DARK_THEME | ✅ 完成 |

---

## 1. presets.ts - 预设主题

### 主题类型

```typescript
export interface BitmapTheme {
  // 背景色
  backgroundColor: string;

  // 边框颜色
  borderColor: string;

  // 坐标轴
  axisColor: string;
  axisTextColor: string;

  // 滚动条
  scrollbarTrackColor: string;
  scrollbarThumbColor: string;

  // 高亮
  highlightColor: string;

  // 工具栏
  toolbarButtonColor: string;
  toolbarButtonBorderColor: string;

  // 默认格子颜色
  defaultCellColor: string;
}
```

### LIGHT_THEME

```typescript
export const LIGHT_THEME: BitmapTheme = {
  backgroundColor: '#ffffff',
  borderColor: '#e0e0e0',
  axisColor: '#333333',
  axisTextColor: '#666666',
  scrollbarTrackColor: '#f0f0f0',
  scrollbarThumbColor: '#c0c0c0',
  highlightColor: '#1890ff',
  toolbarButtonColor: '#ffffff',
  toolbarButtonBorderColor: '#d9d9d9',
  defaultCellColor: '#f5f5f5',
};
```

### DARK_THEME

```typescript
export const DARK_THEME: BitmapTheme = {
  backgroundColor: '#1e1e1e',
  borderColor: '#3e3e3e',
  axisColor: '#cccccc',
  axisTextColor: '#999999',
  scrollbarTrackColor: '#2e2e2e',
  scrollbarThumbColor: '#5e5e5e',
  highlightColor: '#40a9ff',
  toolbarButtonColor: '#2e2e2e',
  toolbarButtonBorderColor: '#4e4e4e',
  defaultCellColor: '#2e2e2e',
};
```

### 使用示例

```typescript
import { LIGHT_THEME, DARK_THEME } from './theme/presets';

// 使用浅色主题
const config: BitmapGridConfig = {
  theme: LIGHT_THEME,
  // ...
};

// 使用深色主题
const config: BitmapGridConfig = {
  theme: DARK_THEME,
  // ...
};

// 自定义主题
const customTheme: BitmapTheme = {
  ...LIGHT_THEME,
  highlightColor: '#ff0000',
  // ...
};
```

---

## Theme 模块设计模式

### 1. 对象模式

主题使用对象模式，所有样式属性集中在一个对象中：

```typescript
const theme: BitmapTheme = {
  backgroundColor: '#ffffff',
  borderColor: '#e0e0e0',
  // ...
};
```

### 2. 预设模式

提供预设主题，方便快速切换：

```typescript
export const LIGHT_THEME: BitmapTheme = { /* ... */ };
export const DARK_THEME: BitmapTheme = { /* ... */ };
```

### 3. 扩展模式

支持基于预设主题进行自定义：

```typescript
const customTheme: BitmapTheme = {
  ...LIGHT_THEME,
  highlightColor: '#ff0000',
};
```

---

## 主题属性说明

| 属性 | 说明 | 浅色主题 | 深色主题 |
|------|------|---------|---------|
| `backgroundColor` | 背景色 | `#ffffff` | `#1e1e1e` |
| `borderColor` | 边框颜色 | `#e0e0e0` | `#3e3e3e` |
| `axisColor` | 坐标轴颜色 | `#333333` | `#cccccc` |
| `axisTextColor` | 坐标轴文字颜色 | `#666666` | `#999999` |
| `scrollbarTrackColor` | 滚动条轨道颜色 | `#f0f0f0` | `#2e2e2e` |
| `scrollbarThumbColor` | 滚动条滑块颜色 | `#c0c0c0` | `#5e5e5e` |
| `highlightColor` | 高亮颜色 | `#1890ff` | `#40a9ff` |
| `toolbarButtonColor` | 工具栏按钮颜色 | `#ffffff` | `#2e2e2e` |
| `toolbarButtonBorderColor` | 工具栏按钮边框颜色 | `#d9d9d9` | `#4e4e4e` |
| `defaultCellColor` | 默认格子颜色 | `#f5f5f5` | `#2e2e2e` |

---

## 与其他模块的关系

```
React 组件 (components/)
    ↓ 使用
BitmapGridConfig (types/)
    ↓ 包含
BitmapTheme (theme/) ←─── 本模块
    ↓ 使用
Draws (draws/)
    ↓ 应用
Konva Canvas
```

### 调用链

1. React 组件创建 `BitmapGridConfig`
2. `BitmapGridConfig` 包含 `theme` 属性
3. `BitmapGridEngine` 接收 `config`
4. `Draw` 类从 `Engine` 获取 `theme`
5. `Draw` 类使用 `theme` 中的颜色、字体等样式
6. Konva Canvas 渲染图形

---

## 主题使用场景

| 场景 | 推荐主题 |
|------|---------|
| 白天使用 | LIGHT_THEME |
| 夜间使用 | DARK_THEME |
| 自定义品牌色 | 自定义主题 |
| 跟随系统主题 | 根据系统设置动态切换 |
