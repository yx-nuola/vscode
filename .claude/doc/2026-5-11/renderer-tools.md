# renderer/tools/ - 工具模块

## 概述
`tools/` 目录包含各种工具类，负责处理滚动、选择、缩放、定位等交互逻辑。

## 模块结构

### ScrollManager.ts - 滚动位置管理器
**功能**: 管理滚动位置，提供边界钳制和快捷滚动方法

**核心方法**:
- `setScrollX(scrollX)` - 设置 X 轴滚动位置
  - 边界钳制: `Math.max(0, Math.min(scrollX, maxScrollX))`
  - 调用 `engine.scrollTo()`

- `setScrollY(scrollY)` - 设置 Y 轴滚动位置
  - 边界钳制: `Math.max(0, Math.min(scrollY, maxScrollY))`
  - 调用 `engine.scrollTo()`

- `scrollBy(deltaX, deltaY)` - 增量滚动
  - `scrollTo(scrollX + deltaX, scrollY + deltaY)`

- `scrollToTop()` - 滚动到顶部
  - `scrollTo(scrollX, 0)`

- `scrollToBottom()` - 滚动到底部
  - `scrollTo(scrollX, maxScrollY)`

- `scrollToLeft()` - 滚动到左侧
  - `scrollTo(0, scrollY)`

- `scrollToRight()` - 滚动到右侧
  - `scrollTo(maxScrollX, scrollY)`

**边界钳制逻辑**:
```typescript
const maxScrollX = virtualScrollSync.maxScrollX;
const clampedX = Math.max(0, Math.min(scrollX, maxScrollX));
```

### SelectionManager.ts - 选择管理器
**功能**: 管理格子选择状态，提供选择/清除/查询方法

**核心属性**:
- `selectedCell` - 当前选中的格子（CellData | null）

**核心方法**:
- `selectCell(col, row)` - 选择格子
  1. 从 DataManager 获取格子数据
  2. 如果存在，设置选中状态
  3. 触发 `selection:change` 事件

- `clearSelection()` - 清除选择
  1. 清空选中状态
  2. 触发 `selection:change` 事件（null）

- `isSelected(col, row)` - 检查格子是否被选中
  - 比较 `selectedCell.col` 和 `selectedCell.row`

- `getSelectedCell()` - 获取选中的格子
  - 返回 `selectedCell`

**事件触发**:
```typescript
eventBus.emit('selection:change', cell);  // 选择时
eventBus.emit('selection:change', null);  // 清除时
```

### ZoomManager.ts - 缩放管理器
**功能**: 管理缩放操作，提供边界限制和锚点缩放

**核心属性**:
- `minCellSize` - 最小格子尺寸（默认 2px）
- `maxCellSize` - 最大格子尺寸（默认 50px）

**核心方法**:
- `zoomAt(delta, anchorX, anchorY)` - 以锚点为中心缩放
  1. 计算新尺寸: `Math.max(min, Math.min(current + delta, max))`
  2. 如果尺寸未变化，直接返回
  3. 计算缩放比例: `ratio = newSize / currentSize`
  4. 保持锚点位置不变:
     ```typescript
     newScrollX = anchorX + (scrollX - anchorX) * ratio
     newScrollY = anchorY + (scrollY - anchorY) * ratio
     ```
  5. 设置新尺寸和滚动位置

- `setCellSize(size)` - 设置格子尺寸
  - 边界钳制后调用 `engine.setCellSize()`

- `resetZoom()` - 重置缩放
  - 恢复到初始尺寸: `config.initialCellSize || 10`

**边界限制**:
```typescript
const clampedSize = Math.max(this.minCellSize, Math.min(size, this.maxCellSize));
```

### LocationManager.ts - 定位管理器
**功能**: 定位到指定格子，确保格子完整显示在可视区域内

**核心方法**:
- `locateToCell(col, row)` - 定位到格子
  1. 边界检查: `col < 0 || col >= totalCols || row < 0 || row >= totalRows`
  2. 计算目标格子位置: `targetX = col * cellSize`
  3. 获取视口尺寸
  4. 计算需要的滚动位置:
     - 如果目标在左侧: `newScrollX = targetX`
     - 如果目标在右侧: `newScrollX = targetX + cellSize - viewportWidth`
     - 否则保持不变
  5. Y 轴同理
  6. 边界钳制
  7. 调用 `engine.scrollTo()`

**定位逻辑**:
```typescript
// X 轴定位
if (targetX < scrollX) {
  newScrollX = targetX;  // 目标在左侧，滚动到目标
} else if (targetX + cellSize > scrollX + viewportWidth) {
  newScrollX = targetX + cellSize - viewportWidth;  // 目标在右侧，滚动到目标右侧边缘
}

// Y 轴同理
```

### EventOptimizer.ts - 事件优化器
**功能**: 优化高频事件处理，使用 RAF 和防抖

**核心属性**:
- `wheelAccumulatorX/Y` - 滚轮累积量
- `rafId` - RAF 请求 ID
- `resizeTimeout` - 调整大小防抖定时器

**核心方法**:
- `handleWheel(deltaX, deltaY)` - 处理滚轮事件
  1. 累加滚轮量
  2. 如果没有待处理的 RAF，启动 RAF
  3. RAF 中处理累积量并滚动

- `processWheel()` - 处理滚轮累积
  1. 如果有累积量，执行滚动
  2. 清空累积量
  3. 清除 RAF ID

- `handleResize(width, height)` - 处理尺寸调整
  1. 清除之前的防抖定时器
  2. 设置新定时器（150ms）
  3. 定时器中调用 `engine.resize()`

- `cancelPendingResize()` - 取消待处理的尺寸调整
  - 清除防抖定时器

- `destroy()` - 销毁优化器
  - 取消待处理的尺寸调整
  - 取消 RAF

**事件优化策略**:
- **滚轮事件**: 累积 + RAF，减少滚动频率
- **窗口调整**: 防抖 150ms，避免频繁重绘

## 工具类协作

### 使用场景
```
用户操作
  ↓
EventOptimizer 处理高频事件
  ↓
ScrollManager / LocationManager / ZoomManager 执行具体逻辑
  ↓
SelectionManager 更新选择状态
  ↓
触发事件总线
  ↓
Layers 重新渲染
```

### 依赖关系
- 所有工具类都依赖 `BitmapGridEngine`
- 通过 `engine.scrollTo()`, `engine.setCellSize()` 等方法与引擎交互
- 通过 `engine.getEventBus()` 触发事件
