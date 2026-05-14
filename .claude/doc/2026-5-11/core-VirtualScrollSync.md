# core/VirtualScrollSync.ts - 虚拟滚动同步

## 概述
`VirtualScrollSync` 负责管理虚拟滚动状态，计算可视范围、滚动条状态和滚动偏移。

## 核心功能

### 可视范围计算
- 计算当前可视格子范围
- 根据滚动位置和视口尺寸计算

### 滚动条状态计算
- 计算滚动条滑块位置和尺寸
- 根据数据总尺寸和视口尺寸计算

### 滚动偏移计算
- 从滑块位置反算滚动偏移
- 支持双向同步

## 核心属性

```typescript
private viewportWidth: number;      // 视口宽度（固定 896px）
private viewportHeight: number;     // 视口高度
private cellSize: number;           // 格子尺寸
private totalRows: number;          // 总行数
private totalCols: number;          // 总列数
```

## 核心方法

### 可视范围计算

#### `getVisibleRange(scrollX: number, scrollY: number): VisibleRange`
计算当前可视格子范围

**参数**:
- `scrollX`: X 轴滚动偏移
- `scrollY`: Y 轴滚动偏移

**返回**: `VisibleRange` 对象

**计算逻辑**:
```typescript
const startCol = Math.floor(scrollX / this.cellSize);
const endCol = Math.min(
  Math.ceil((scrollX + this.viewportWidth) / this.cellSize),
  this.totalCols - 1
);
const startRow = Math.floor(scrollY / this.cellSize);
const endRow = Math.min(
  Math.ceil((scrollY + this.viewportHeight) / this.cellSize),
  this.totalRows - 1
);

return {
  startCol: Math.max(0, startCol),
  endCol: Math.max(startCol, Math.min(endCol, this.totalCols - 1)),
  startRow: Math.max(0, startRow),
  endRow: Math.max(startRow, Math.min(endRow, this.totalRows - 1)),
};
```

**使用示例**:
```typescript
const visibleRange = virtualScrollSync.getVisibleRange(100, 200);
console.log('可视范围:', visibleRange);
// { startCol: 10, endCol: 89, startRow: 20, endRow: 29 }
```

### 滚动条状态计算

#### `getScrollbarState(scrollX: number, scrollY: number, trackWidth: number, trackHeight: number): ScrollbarState`
计算滚动条滑块位置和尺寸

**参数**:
- `scrollX`: X 轴滚动偏移
- `scrollY`: Y 轴滚动偏移
- `trackWidth`: 轨道宽度
- `trackHeight`: 轨道高度

**返回**: `ScrollbarState` 对象

**计算逻辑**:
```typescript
const totalWidth = this.totalCols * this.cellSize;
const totalHeight = this.totalRows * this.cellSize;

// 如果数据小于视口，滑块占满整个轨道
const sliderWidth = totalWidth <= this.viewportWidth
  ? trackWidth
  : Math.max((this.viewportWidth / totalWidth) * trackWidth, 20);
const sliderHeight = totalHeight <= this.viewportHeight
  ? trackHeight
  : Math.max((this.viewportHeight / totalHeight) * trackHeight, 20);

const maxSliderX = trackWidth - sliderWidth;
const maxSliderY = trackHeight - sliderHeight;

// 如果数据小于视口，滑块位置为0
const sliderX = totalWidth <= this.viewportWidth
  ? 0
  : (scrollX / (totalWidth - this.viewportWidth)) * maxSliderX;
const sliderY = totalHeight <= this.viewportHeight
  ? 0
  : (scrollY / (totalHeight - this.viewportHeight)) * maxSliderY;

return {
  sliderX: Math.max(0, Math.min(sliderX, maxSliderX)),
  sliderY: Math.max(0, Math.min(sliderY, maxSliderY)),
  sliderWidth,
  sliderHeight,
};
```

**使用示例**:
```typescript
const scrollbarState = virtualScrollSync.getScrollbarState(
  100,
  200,
  896,
  600
);
console.log('滚动条状态:', scrollbarState);
// { sliderX: 11.2, sliderY: 33.3, sliderWidth: 20, sliderHeight: 20 }
```

### 滚动偏移计算

#### `getScrollFromSlider(sliderX: number, sliderY: number, trackWidth: number, trackHeight: number): ScrollState`
从滑块位置反算滚动偏移

**参数**:
- `sliderX`: 滑块 X 位置
- `sliderY`: 滑块 Y 位置
- `trackWidth`: 轨道宽度
- `trackHeight`: 轨道高度

**返回**: `ScrollState` 对象

**计算逻辑**:
```typescript
const totalWidth = this.totalCols * this.cellSize;
const totalHeight = this.totalRows * this.cellSize;

// 计算滑块尺寸
const sliderWidth = Math.max(
  (this.viewportWidth / totalWidth) * trackWidth,
  20
);
const sliderHeight = Math.max(
  (this.viewportHeight / totalHeight) * trackHeight,
  20
);

// 计算滑块最大可移动范围
const maxSliderX = trackWidth - sliderWidth;
const maxSliderY = trackHeight - sliderHeight;

// 计算滚动偏移
let scrollX = 0;
let scrollY = 0;

// X轴滚动
if (totalWidth > this.viewportWidth && maxSliderX > 0) {
  scrollX = (sliderX / maxSliderX) * (totalWidth - this.viewportWidth);
}

// Y轴滚动
if (totalHeight > this.viewportHeight && maxSliderY > 0) {
  scrollY = (sliderY / maxSliderY) * (totalHeight - this.viewportHeight);
}

return {
  scrollX: Math.max(0, Math.min(scrollX, this.maxScrollX)),
  scrollY: Math.max(0, Math.min(scrollY, this.maxScrollY)),
};
```

**使用示例**:
```typescript
const scrollState = virtualScrollSync.getScrollFromSlider(
  11.2,
  33.3,
  896,
  600
);
console.log('滚动状态:', scrollState);
// { scrollX: 100, scrollY: 200 }
```

### 边界计算

#### `get maxScrollX(): number`
获取最大 X 轴滚动偏移

```typescript
const totalWidth = this.totalCols * this.cellSize;
return Math.max(0, totalWidth - this.viewportWidth);
```

#### `get maxScrollY(): number`
获取最大 Y 轴滚动偏移

```typescript
const totalHeight = this.totalRows * this.cellSize;
return Math.max(0, totalHeight - this.viewportHeight);
```

**使用示例**:
```typescript
console.log('最大 X 轴滚动:', virtualScrollSync.maxScrollX);
console.log('最大 Y 轴滚动:', virtualScrollSync.maxScrollY);
```

### 尺寸更新

#### `updateViewport(_width: number, height: number): void`
更新视口尺寸

```typescript
this.viewportWidth = BITMAP_WIDTH;
this.viewportHeight = height;
```

#### `updateCellSize(cellSize: number): void`
更新格子尺寸

```typescript
this.cellSize = cellSize;
```

#### `updateDataSize(rows: number, cols: number): void`
更新数据尺寸

```typescript
this.totalRows = rows;
this.totalCols = cols;
```

### 属性访问

#### `get currentCellSize(): number`
获取当前格子尺寸

```typescript
return this.cellSize;
```

#### `getTotalCols(): number`
获取总列数

```typescript
return this.totalCols;
```

#### `getTotalRows(): number`
获取总行数

```typescript
return this.totalRows;
```

## 数据结构

### VisibleRange 接口
```typescript
interface VisibleRange {
  startCol: number;  // 起始列
  endCol: number;    // 结束列
  startRow: number;  // 起始行
  endRow: number;    // 结束行
}
```

### ScrollbarState 接口
```typescript
interface ScrollbarState {
  sliderX: number;      // 滑块 X 位置
  sliderY: number;      // 滑块 Y 位置
  sliderWidth: number;  // 滑块宽度
  sliderHeight: number; // 滑块高度
}
```

### ScrollState 接口
```typescript
interface ScrollState {
  scrollX: number;  // X 轴滚动偏移
  scrollY: number;  // Y 轴滚动偏移
}
```

## 使用示例

### 基础用法
```typescript
import { VirtualScrollSync } from './core';

const virtualScrollSync = new VirtualScrollSync(100, 128, 10);

// 更新视口
virtualScrollSync.updateViewport(896, 600);

// 更新格子尺寸
virtualScrollSync.updateCellSize(20);

// 更新数据尺寸
virtualScrollSync.updateDataSize(200, 256);

// 计算可视范围
const visibleRange = virtualScrollSync.getVisibleRange(100, 200);
console.log('可视范围:', visibleRange);

// 计算滚动条状态
const scrollbarState = virtualScrollSync.getScrollbarState(100, 200, 896, 600);
console.log('滚动条状态:', scrollbarState);

// 从滑块位置反算滚动
const scrollState = virtualScrollSync.getScrollFromSlider(11.2, 33.3, 896, 600);
console.log('滚动状态:', scrollState);

// 获取最大滚动
console.log('最大 X 轴滚动:', virtualScrollSync.maxScrollX);
console.log('最大 Y 轴滚动:', virtualScrollSync.maxScrollY);
```

### 在引擎中使用
```typescript
import { BitmapGridEngine } from './core';

const engine = new BitmapGridEngine(config);

const virtualScrollSync = engine.getVirtualScrollSync();

// 设置数据
engine.setData(matrixData);

// 获取可视范围
const visibleRange = virtualScrollSync.getVisibleRange(
  engine.getScrollState().scrollX,
  engine.getScrollState().scrollY
);

// 获取滚动条状态
const scrollbarState = virtualScrollSync.getScrollbarState(
  engine.getScrollState().scrollX,
  engine.getScrollState().scrollY,
  896,
  600
);
```

## 注意事项

1. **视口宽度**: 固定为 `BITMAP_WIDTH`（896px）
2. **格子尺寸**: 影响可视范围和滚动条计算
3. **数据尺寸**: 决定最大滚动偏移
4. **滑块最小尺寸**: 最小为 20px
5. **边界钳制**: 所有滚动偏移都会被钳制在 0 到最大值之间
