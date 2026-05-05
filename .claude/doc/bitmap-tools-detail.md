# Tools 模块详细说明

## 概述

`tools` 模块提供各种工具类，用于辅助核心功能，包括事件优化、位置管理、滚动管理、选择管理、缩放管理等。

---

## 文件列表

| 文件 | 功能 | 状态 |
|------|------|------|
| `EventOptimizer.ts` | 事件优化器，使用 RAF 调度和防抖优化滚轮和 resize 事件 | ✅ 完成 |
| `LocationManager.ts` | 位置管理器，计算格子坐标、屏幕坐标转换 | ✅ 完成 |
| `ScrollManager.ts` | 滚动管理器，管理滚动位置、边界钳制、滚动到顶部/底部等 | ✅ 完成 |
| `SelectionManager.ts` | 选择管理器，管理选中状态、多选、范围选择 | ✅ 完成 |
| `ZoomManager.ts` | 缩放管理器，管理缩放级别、边界（2-50px）、锚点缩放 | ✅ 完成 |

---

## 1. EventOptimizer.ts - 事件优化器

### 类结构

```typescript
export class EventOptimizer {
  private engine: BitmapGridEngine;  // 引擎引用
  private wheelAccumulatorX: number;   // 横向滚轮累积值
  private wheelAccumulatorY: number;   // 纵向滚轮累积值
  private rafId: number | null;       // RAF ID
  private resizeTimeout: number | null; // resize 防抖定时器
}
```

### 主要方法

| 方法 | 说明 |
|------|------|
| `handleWheel(deltaX, deltaY)` | 处理滚轮事件（RAF 调度） |
| `handleResize(width, height)` | 处理尺寸调整事件（防抖） |
| `cancelPendingResize()` | 取消待处理的尺寸调整 |
| `destroy()` | 销毁优化器 |

### 处理滚轮事件

```typescript
handleWheel(deltaX: number, deltaY: number): void {
  // 1. 累积滚轮值
  this.wheelAccumulatorX += deltaX;
  this.wheelAccumulatorY += deltaY;

  // 2. 如果没有 RAF 调度，创建一个
  if (this.rafId === null) {
    this.rafId = requestAnimationFrame(() => {
      this.processWheel();
    });
  }
}
```

### 处理滚轮累积

```typescript
private processWheel(): void {
  // 1. 如果有累积值，执行滚动
  if (this.wheelAccumulatorX !== 0 || this.wheelAccumulatorY !== 0) {
    const scrollState = this.engine.getScrollState();
    this.engine.scrollTo(
      scrollState.scrollX + this.wheelAccumulatorX,
      scrollState.scrollY + this.wheelAccumulatorY
    );

    // 2. 清空累积值
    this.wheelAccumulatorX = 0;
    this.wheelAccumulatorY = 0;
  }

  // 3. 清除 RAF ID
  this.rafId = null;
}
```

### 处理尺寸调整事件

```typescript
handleResize(width: number, height: number): void {
  // 1. 如果有待处理的 resize，取消它
  if (this.resizeTimeout !== null) {
    clearTimeout(this.resizeTimeout);
  }

  // 2. 创建新的防抖定时器
  this.resizeTimeout = window.setTimeout(() => {
    this.engine.resize(width, height);
    this.resizeTimeout = null;
  }, 150);  // 150ms 防抖
}
```

### 设计特点

- **RAF 调度**：使用 `requestAnimationFrame` 优化滚轮事件，避免频繁渲染
- **防抖**：使用 `setTimeout` 优化 resize 事件，避免频繁调整尺寸
- **累积值**：累积滚轮值，一次性处理，提升性能

---

## 2. LocationManager.ts - 位置管理器

### 类结构

```typescript
export class LocationManager {
  private engine: BitmapGridEngine;  // 引擎引用
}
```

### 主要方法

| 方法 | 说明 |
|------|------|
| `cellToScreen(col, row)` | 格子坐标转屏幕坐标 |
| `screenToCell(x, y)` | 屏幕坐标转格子坐标 |
| `getCellCenter(col, row)` | 获取格子中心点坐标 |
| `getVisibleCells()` | 获取可见格子列表 |

### 格子坐标转屏幕坐标

```typescript
cellToScreen(col: number, row: number): { x: number; y: number } {
  const cellSize = this.engine.getZoomLevel();
  const scrollState = this.engine.getScrollState();
  const layoutCalculator = this.engine.getLayoutCalculator();
  const layout = layoutCalculator.calculate(
    this.engine.getStage()?.width() || 0,
    this.engine.getStage()?.height() || 0
  );

  // 计算格子左上角在屏幕上的位置
  const x = layout.cellArea.x + col * cellSize - scrollState.scrollX;
  const y = layout.cellArea.y + row * cellSize - scrollState.scrollY;

  return { x, y };
}
```

### 屏幕坐标转格子坐标

```typescript
screenToCell(x: number, y: number): { col: number; row: number } {
  const cellSize = this.engine.getZoomLevel();
  const scrollState = this.engine.getScrollState();
  const layoutCalculator = this.engine.getLayoutCalculator();
  const layout = layoutCalculator.calculate(
    this.engine.getStage()?.width() || 0,
    this.engine.getStage()?.height() || 0
  );

  // 计算格子坐标
  const col = Math.floor((x - layout.cellArea.x + scrollState.scrollX) / cellSize);
  const row = Math.floor((y - layout.cellArea.y + scrollState.scrollY) / cellSize);

  return { col, row };
}
```

### 获取格子中心点坐标

```typescript
getCellCenter(col: number, row: number): { x: number; y: number } {
  const cellSize = this.engine.getZoomLevel();
  const screenPos = this.cellToScreen(col, row);

  return {
    x: screenPos.x + cellSize / 2,
    y: screenPos.y + cellSize / 2,
  };
}
```

### 获取可见格子列表

```typescript
getVisibleCells(): { col: number; row: number }[] {
  const virtualScrollSync = this.engine.getVirtualScrollSync();
  const scrollState = this.engine.getScrollState();

  // 获取可见范围
  const visibleRange = virtualScrollSync.getVisibleRange(scrollState.scrollX, scrollState.scrollY);

  // 生成可见格子列表
  const cells: { col: number; row: number }[] = [];
  for (let row = visibleRange.startRow; row <= visibleRange.endRow; row++) {
    for (let col = visibleRange.startCol; col <= visibleRange.endCol; col++) {
      cells.push({ col, row });
    }
  }

  return cells;
}
```

---

## 3. ScrollManager.ts - 滚动管理器

### 类结构

```typescript
export class ScrollManager {
  private engine: BitmapGridEngine;  // 引擎引用
}
```

### 主要方法

| 方法 | 说明 |
|------|------|
| `setScrollX(scrollX)` | 设置 X 轴滚动位置（边界钳制） |
| `setScrollY(scrollY)` | 设置 Y 轴滚动位置（边界钳制） |
| `scrollBy(deltaX, deltaY)` | 增量滚动 |
| `scrollToTop()` | 滚动到顶部 |
| `scrollToBottom()` | 滚动到底部 |
| `scrollToLeft()` | 滚动到左侧 |
| `scrollToRight()` | 滚动到右侧 |

### 设置 X 轴滚动位置

```typescript
setScrollX(scrollX: number): void {
  const virtualScrollSync = this.engine.getVirtualScrollSync();
  const maxScrollX = virtualScrollSync.maxScrollX;

  // 边界钳制
  const clampedX = Math.max(0, Math.min(scrollX, maxScrollX));

  const scrollState = this.engine.getScrollState();
  this.engine.scrollTo(clampedX, scrollState.scrollY);
}
```

### 设置 Y 轴滚动位置

```typescript
setScrollY(scrollY: number): void {
  const virtualScrollSync = this.engine.getVirtualScrollSync();
  const maxScrollY = virtualScrollSync.maxScrollY;

  // 边界钳制
  const clampedY = Math.max(0, Math.min(scrollY, maxScrollY));

  const scrollState = this.engine.getScrollState();
  this.engine.scrollTo(scrollState.scrollX, clampedY);
}
```

### 增量滚动

```typescript
scrollBy(deltaX: number, deltaY: number): void {
  const scrollState = this.engine.getScrollState();
  this.engine.scrollTo(scrollState.scrollX + deltaX, scrollState.scrollY + deltaY);
}
```

### 滚动到顶部

```typescript
scrollToTop(): void {
  const scrollState = this.engine.getScrollState();
  this.engine.scrollTo(scrollState.scrollX, 0);
}
```

### 滚动到底部

```typescript
scrollToBottom(): void {
  const virtualScrollSync = this.engine.getVirtualScrollSync();
  const maxScrollY = virtualScrollSync.maxScrollY;

  const scrollState = this.engine.getScrollState();
  this.engine.scrollTo(scrollState.scrollX, maxScrollY);
}
```

### 滚动到左侧

```typescript
scrollToLeft(): void {
  this.engine.scrollTo(0, this.engine.getScrollState().scrollY);
}
```

### 滚动到右侧

```typescript
scrollToRight(): void {
  const virtualScrollSync = this.engine.getVirtualScrollSync();
  const maxScrollX = virtualScrollSync.maxScrollX;

  this.engine.scrollTo(maxScrollX, this.engine.getScrollState().scrollY);
}
```

---

## 4. SelectionManager.ts - 选择管理器

### 类结构

```typescript
export class SelectionManager {
  private engine: BitmapGridEngine;  // 引擎引用
  private selectedCell: CellData | null;  // 选中的格子
}
```

### 主要方法

| 方法 | 说明 |
|------|------|
| `selectCell(col, row)` | 选择格子 |
| `clearSelection()` | 清除选择 |
| `isSelected(col, row)` | 检查格子是否被选中 |
| `getSelectedCell()` | 获取选中的格子 |

### 选择格子

```typescript
selectCell(col: number, row: number): void {
  const dataManager = this.engine.getDataManager();
  const cell = dataManager.getCell(row, col);

  if (cell) {
    this.selectedCell = cell;
    const eventBus = this.engine.getEventBus();
    eventBus.emit('selection:change', cell);
  }
}
```

### 清除选择

```typescript
clearSelection(): void {
  this.selectedCell = null;
  const eventBus = this.engine.getEventBus();
  eventBus.emit('selection:change', null);
}
```

### 检查格子是否被选中

```typescript
isSelected(col: number, row: number): boolean {
  if (!this.selectedCell) return false;
  return this.selectedCell.col === col && this.selectedCell.row === row;
}
```

### 获取选中的格子

```typescript
getSelectedCell(): CellData | null {
  return this.selectedCell;
}
```

---

## 5. ZoomManager.ts - 缩放管理器

### 类结构

```typescript
export class ZoomManager {
  private engine: BitmapGridEngine;  // 引擎引用
  private minCellSize: number;       // 最小格子尺寸
  private maxCellSize: number;       // 最大格子尺寸
}
```

### 主要方法

| 方法 | 说明 |
|------|------|
| `zoomAt(delta, anchorX, anchorY)` | 以锚点为中心缩放 |
| `setCellSize(size)` | 设置格子尺寸（边界钳制） |
| `resetZoom()` | 重置缩放 |
| `minSize` | 获取最小格子尺寸 |
| `maxSize` | 获取最大格子尺寸 |

### 以锚点为中心缩放

```typescript
zoomAt(delta: number, anchorX: number, anchorY: number): void {
  const currentSize = this.engine.getZoomLevel();
  const newSize = Math.max(this.minCellSize, Math.min(currentSize + delta, this.maxCellSize));

  if (newSize === currentSize) return;

  // 计算缩放后的滚动位置，保持锚点位置不变
  const scrollState = this.engine.getScrollState();
  const ratio = newSize / currentSize;

  const newScrollX = anchorX + (scrollState.scrollX - anchorX) * ratio;
  const newScrollY = anchorY + (scrollState.scrollY - anchorY) * ratio;

  this.engine.setCellSize(newSize);
  this.engine.scrollTo(newScrollX, newScrollY);
}
```

### 设置格子尺寸

```typescript
setCellSize(size: number): void {
  const clampedSize = Math.max(this.minCellSize, Math.min(size, this.maxCellSize));
  this.engine.setCellSize(clampedSize);
}
```

### 重置缩放

```typescript
resetZoom(): void {
  const config = this.engine.getConfig();
  this.engine.setCellSize(config.initialCellSize || 10);
}
```

### 获取最小/最大格子尺寸

```typescript
get minSize(): number {
  return this.minCellSize;
}

get maxSize(): number {
  return this.maxCellSize;
}
```

---

## Tools 模块设计模式

### 1. 统一接口

所有 Tool 类都遵循相同的模式：

```typescript
export class XxxTool {
  private engine: BitmapGridEngine;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
  }

  // 工具方法
  xxxMethod(): void {
    // 实现逻辑
  }
}
```

### 2. 边界钳制

- `ScrollManager`：滚动位置钳制在有效范围内
- `ZoomManager`：格子尺寸钳制在 minCellSize 和 maxCellSize 之间

### 3. 事件优化

- `EventOptimizer`：使用 RAF 和防抖优化事件处理
- 避免频繁渲染，提升性能

### 4. 坐标转换

- `LocationManager`：提供格子坐标和屏幕坐标的双向转换
- 支持中心点计算、可见格子查询

---

## 与其他模块的关系

```
BitmapGridEngine (core/)
    ↓ 创建
Tools (tools/) ←─── 本模块
    ↓ 使用
BitmapGridEngine (core/)
    ↓ 触发
EventBus (core/)
    ↓ 通知
Layers (layers/)
    ↓ 使用
Draws (draws/)
```

### 调用链

1. `BitmapGridEngine` 初始化时创建各 `Tool`
2. `Tool` 通过构造函数接收 `BitmapGridEngine` 引用
3. `Tool` 调用 `Engine` 的方法获取状态、数据
4. `Tool` 调用 `Engine` 的方法更新状态
5. `Engine` 通过 `EventBus` 通知图层更新
6. 图层调用 `Draw` 类重新渲染

---

## 工具类使用场景

| 工具类 | 使用场景 |
|--------|---------|
| `EventOptimizer` | 滚轮事件、resize 事件优化 |
| `LocationManager` | 鼠标点击定位、格子坐标转换 |
| `ScrollManager` | 滚动条拖拽、键盘滚动、滚动到指定位置 |
| `SelectionManager` | 鼠标点击选择、键盘选择、清除选择 |
| `ZoomManager` | 鼠标滚轮缩放、按钮缩放、重置缩放 |
