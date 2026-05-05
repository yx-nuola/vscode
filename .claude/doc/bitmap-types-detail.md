# Types 模块详细说明

## 概述

`types` 模块提供类型定义，定义 Bitmap 组件的所有类型。

---

## 文件列表

| 文件 | 功能 | 状态 |
|------|------|------|
| `types.ts` | 类型定义，包含 CellData, MatrixData, LayoutConfig, ColorRule, BitmapTheme 等 | ✅ 完成 |

---

## 1. types.ts - 类型定义

### 核心类型

#### CellData - 格子数据

```typescript
export interface CellData {
  row: number;           // 行号
  col: number;           // 列号
  value: number;         // 数值（用于颜色映射）
  metadata?: {           // 元数据
    vset?: string;       // 设置电压
    vreset?: string;     // 复位电压
    imeas?: string;      // 测量电流
    status?: string;     // 状态（pass/fail）
  };
}
```

#### MatrixData - 矩阵数据

```typescript
export interface MatrixData {
  rows: number;          // 总行数
  cols: number;          // 总列数
  cells: CellData[];     // 格子数据数组
}
```

### 布局类型

#### LayoutConfig - 布局配置

```typescript
export interface LayoutConfig {
  toolbarHeight: number;  // 工具栏高度
  axisSize: number;        // 坐标轴尺寸
  scrollbarSize: number;   // 滚动条尺寸
  spacing: number;         // 间距
}
```

#### LayoutResult - 布局结果

```typescript
export interface LayoutResult {
  toolbar: Area;              // 工具栏区域
  xAxis: Area;                // X 轴区域
  yAxis: Area;                // Y 轴区域
  cellArea: Area;             // 格子区域
  horizontalScrollbar: Area;  // 横向滚动条区域
  verticalScrollbar: Area;    // 纵向滚动条区域
}
```

#### Area - 区域

```typescript
export interface Area {
  x: number;      // X 坐标
  y: number;      // Y 坐标
  width: number;  // 宽度
  height: number; // 高度
}
```

### 颜色类型

#### ColorRule - 颜色规则

```typescript
export interface ColorRule {
  min: number;   // 最小值
  max: number;   // 最大值
  color: string; // 颜色
}
```

#### BitmapTheme - 主题

```typescript
export interface BitmapTheme {
  backgroundColor: string;           // 背景色
  borderColor: string;               // 边框颜色
  axisColor: string;                 // 坐标轴颜色
  axisTextColor: string;             // 坐标轴文字颜色
  scrollbarTrackColor: string;       // 滚动条轨道颜色
  scrollbarThumbColor: string;        // 滚动条滑块颜色
  highlightColor: string;             // 高亮颜色
  toolbarButtonColor: string;        // 工具栏按钮颜色
  toolbarButtonBorderColor: string;  // 工具栏按钮边框颜色
  defaultCellColor: string;          // 默认格子颜色
}
```

### 配置类型

#### BitmapGridConfig - Bitmap 配置

```typescript
export interface BitmapGridConfig {
  layout: LayoutConfig;      // 布局配置
  theme: BitmapTheme;         // 主题
  colorRules?: ColorRule[];  // 颜色规则
  initialCellSize?: number;   // 初始格子尺寸
  minCellSize?: number;       // 最小格子尺寸
  maxCellSize?: number;       // 最大格子尺寸
  callbacks?: BitmapGridCallbacks; // 回调函数
}
```

#### BitmapGridCallbacks - 回调函数

```typescript
export interface BitmapGridCallbacks {
  onScrollChange?: (state: ScrollState) => void;
  onZoomChange?: (size: number) => void;
  onSelectionChange?: (cell: CellData | null) => void;
  onCellClick?: (cell: CellData) => void;
  onCellHover?: (cell: CellData) => void;
}
```

### 状态类型

#### ScrollState - 滚动状态

```typescript
export interface ScrollState {
  scrollX: number;  // 横向滚动位置
  scrollY: number;  // 纵向滚动位置
}
```

#### VisibleRange - 可见范围

```typescript
export interface VisibleRange {
  startCol: number;  // 起始列
  endCol: number;    // 结束列
  startRow: number;  // 起始行
  endRow: number;    // 结束行
}
```

#### ScrollbarState - 滚动条状态

```typescript
export interface ScrollbarState {
  thumbX: number;       // 横向滑块 X 位置
  thumbY: number;       // 纵向滑块 Y 位置
  thumbWidth: number;   // 横向滑块宽度
  thumbHeight: number;  // 纵向滑块高度
}
```

### 事件类型

#### BitmapEvents - 事件类型

```typescript
export type BitmapEvents = {
  'scroll:change': ScrollState;
  'zoom:change': number;
  'selection:change': CellData | null;
  'cell:click': CellData;
  'cell:hover': CellData;
  'data:change': MatrixData;
  'locate': { col: number; row: number };
  'highlight': { col: number; row: number } | null;
  'clear-highlight': void;
};
```

### 导入模式

#### ImportMode - 导入模式

```typescript
export type ImportMode = 'overwrite' | 'append';
```

---

## Types 模块设计模式

### 1. 接口模式

所有类型都使用 `interface` 定义，便于扩展：

```typescript
export interface CellData {
  row: number;
  col: number;
  value: number;
  metadata?: { /* ... */ };
}
```

### 2. 可选属性

使用 `?` 标记可选属性：

```typescript
export interface CellData {
  row: number;
  col: number;
  value: number;
  metadata?: { /* ... */ };  // 可选
}
```

### 3. 联合类型

使用联合类型定义枚举：

```typescript
export type ImportMode = 'overwrite' | 'append';
```

### 4. 事件类型

使用映射类型定义事件：

```typescript
export type BitmapEvents = {
  'scroll:change': ScrollState;
  'zoom:change': number;
  // ...
};
```

---

## 类型使用示例

### 使用 CellData

```typescript
const cell: CellData = {
  row: 0,
  col: 0,
  value: 5.5,
  metadata: {
    vset: '1.2V',
    vreset: '0.5V',
    imeas: '1.2e-6',
    status: 'pass',
  },
};
```

### 使用 MatrixData

```typescript
const data: MatrixData = {
  rows: 64,
  cols: 64,
  cells: [
    { row: 0, col: 0, value: 5.5 },
    { row: 0, col: 1, value: 3.2 },
    // ...
  ],
};
```

### 使用 ColorRule

```typescript
const colorRules: ColorRule[] = [
  { min: 0, max: 5, color: '#ff9800' },
  { min: 5, max: 10, color: '#2196f3' },
  { min: 10, max: 100, color: '#4caf50' },
];
```

### 使用 BitmapTheme

```typescript
const theme: BitmapTheme = {
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

### 使用 BitmapGridConfig

```typescript
const config: BitmapGridConfig = {
  layout: {
    toolbarHeight: 40,
    axisSize: 40,
    scrollbarSize: 12,
    spacing: 4,
  },
  theme: LIGHT_THEME,
  colorRules: [
    { min: 0, max: 5, color: '#ff9800' },
    { min: 5, max: 10, color: '#2196f3' },
    { min: 10, max: 100, color: '#4caf50' },
  ],
  initialCellSize: 10,
  minCellSize: 2,
  maxCellSize: 50,
  callbacks: {
    onScrollChange: (state) => console.log('Scroll changed:', state),
    onCellClick: (cell) => console.log('Cell clicked:', cell),
  },
};
```

---

## 与其他模块的关系

```
所有模块
    ↓ 使用
Types (types/) ←─── 本模块
    ↓ 定义
所有模块
```

### 调用链

1. 所有模块导入 `types` 中的类型
2. `core` 模块使用 `CellData`、`MatrixData`、`BitmapGridConfig` 等
3. `draws` 模块使用 `BitmapTheme`、`ColorRule` 等
4. `components` 模块使用 `BitmapGridConfig`、`BitmapGridCallbacks` 等
5. `hooks` 模块使用 `BitmapGridConfig`、`MatrixData` 等
6. `theme` 模块使用 `BitmapTheme` 等

---

## 类型使用场景

| 场景 | 使用类型 |
|------|---------|
| 定义格子数据 | `CellData` |
| 定义矩阵数据 | `MatrixData` |
| 定义布局配置 | `LayoutConfig`、`LayoutResult`、`Area` |
| 定义颜色规则 | `ColorRule` |
| 定义主题 | `BitmapTheme` |
| 定义配置 | `BitmapGridConfig`、`BitmapGridCallbacks` |
| 定义状态 | `ScrollState`、`VisibleRange`、`ScrollbarState` |
| 定义事件 | `BitmapEvents` |
| 定义导入模式 | `ImportMode` |
