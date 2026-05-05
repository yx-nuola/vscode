# Draws 模块详细说明

## 概述

`draws` 模块负责 Konva Canvas 上的图形绘制，每个类负责绘制一种 UI 元素。这些类被 `layers` 模块的图层类调用。

---

## 文件列表

| 文件 | 功能 | 状态 |
|------|------|------|
| `AxisDraw.ts` | 坐标轴绘制（X/Y 轴线、刻度、标签） | ⚠️ 未完成（TODO） |
| `CellDraw.ts` | 矩阵格子绘制（含对象池优化） | ✅ 完成 |
| `HighlightDraw.ts` | 选中/高亮格子边框绘制 | ✅ 完成 |
| `ScrollbarDraw.ts` | 滚动条绘制（轨道 + 滑块） | ⚠️ 未完成（TODO） |
| `ToolbarDraw.ts` | 工具栏按钮绘制 | ✅ 完成 |

---

## 1. AxisDraw.ts - 坐标轴绘制

### 类结构

```typescript
export class AxisDraw {
  private engine: BitmapGridEngine;  // 引擎引用
  private xAxisGroup: Group;         // X 轴 Konva 组
  private yAxisGroup: Group;         // Y 轴 Konva 组
}
```

### 主要方法

| 方法 | 说明 |
|------|------|
| `getXAxisGroup()` | 获取 X 轴 Konva Group |
| `getYAxisGroup()` | 获取 Y 轴 Konva Group |
| `renderXAxis()` | 渲染 X 轴（线、刻度、标签） |
| `renderYAxis()` | 渲染 Y 轴（线、刻度、标签） |
| `destroy()` | 销毁资源 |

### 当前状态

⚠️ **未完成** - 目前只有框架，`renderXAxis()` 和 `renderYAxis()` 都是 TODO 状态。

### 预期实现逻辑

```typescript
// renderXAxis() 预期逻辑：
renderXAxis(): void {
  const config = this.engine.getConfig();
  const theme = config.theme;
  const layoutCalculator = this.engine.getLayoutCalculator();
  const virtualScrollSync = this.engine.getVirtualScrollSync();
  const scrollState = this.engine.getScrollState();

  this.xAxisGroup.destroyChildren();

  // 1. 获取布局
  const layout = layoutCalculator.calculate(
    this.engine.getStage()?.width() || 0,
    this.engine.getStage()?.height() || 0
  );

  // 2. 绘制 X 轴线
  const axisLine = new Line({
    points: [0, xAxis.height - 1, xAxis.width, xAxis.height - 1],
    stroke: theme.axisColor,
    strokeWidth: 1,
  });

  // 3. 计算可见范围和刻度步长
  const visibleRange = virtualScrollSync.getVisibleRange(scrollState.scrollX, scrollState.scrollY);
  const step = this.calculateStep(totalCols);

  // 4. 遍历绘制刻度和标签（只绘制可见范围内的）
  for (let col = 0; col < totalCols; col += step) {
    if (col < visibleRange.startCol || col > visibleRange.endCol) continue;

    const x = col * cellSize - scrollState.scrollX;

    // 刻度线
    const tick = new Line({
      points: [x, xAxis.height - 6, x, xAxis.height - 1],
      stroke: theme.axisColor,
      strokeWidth: 1,
    });

    // 标签
    const label = new Text({
      x: x,
      y: xAxis.height - 20,
      text: col.toString(),
      fontSize: 10,
      fontFamily: 'Arial',
      fill: theme.axisTextColor,
    });
  }
}
```

---

## 2. CellDraw.ts - 矩阵格子绘制

### 类结构

```typescript
export class CellDraw {
  private engine: BitmapGridEngine;           // 引擎引用
  private group: Group;                       // Konva 组
  private cellPool: Map<string, Rect>;        // 对象池：key="row,col" → Rect
}
```

### 主要方法

| 方法 | 说明 |
|------|------|
| `getGroup()` | 获取 Konva Group |
| `renderCells(cells)` | 渲染格子数组（只渲染可见区域） |
| `mapColor(value, rules)` | 根据数值和颜色规则映射颜色 |
| `destroy()` | 销毁资源 |

### 核心逻辑：对象池优化

```typescript
renderCells(cells: CellData[]): void {
  const config = this.engine.getConfig();
  const theme = config.theme;
  const colorRules = config.colorRules;
  const cellSize = this.engine.getZoomLevel();

  // 1. 收集可见格子的 key
  const visibleKeys = new Set(cells.map((cell) => `${cell.row},${cell.col}`));

  // 2. 隐藏不可见格子（不销毁，复用）
  for (const [key, rect] of this.cellPool) {
    if (!visibleKeys.has(key)) {
      rect.visible(false);
    }
  }

  // 3. 渲染可见格子
  for (const cell of cells) {
    const key = `${cell.row},${cell.col}`;
    let rect = this.cellPool.get(key);

    // 3.1 如果对象池中没有，创建新的 Rect
    if (!rect) {
      rect = new Rect({
        x: cell.col * cellSize,
        y: cell.row * cellSize,
        width: cellSize,
        height: cellSize,
        stroke: theme.borderColor,
        strokeWidth: 1,
      });
      this.group.add(rect);
      this.cellPool.set(key, rect);
    }

    // 3.2 更新位置、尺寸、颜色
    rect.visible(true);
    rect.x(cell.col * cellSize);
    rect.y(cell.row * cellSize);
    rect.width(cellSize);
    rect.height(cellSize);
    rect.fill(this.mapColor(cell.value, colorRules) || theme.defaultCellColor);
  }
}
```

### 颜色映射逻辑

```typescript
private mapColor(value: number, rules: ColorRule[]): string | undefined {
  // 遍历颜色规则，找到匹配的区间
  for (const rule of rules) {
    if (value >= rule.min && value <= rule.max) {
      return rule.color;
    }
  }
  return undefined;  // 没有匹配则使用默认颜色
}
```

### 对象池的好处

- **避免频繁创建/销毁**：滚动时复用已有 Rect 对象
- **性能优化**：减少 GC 压力
- **内存控制**：只保留可见区域的 Rect 对象

---

## 3. HighlightDraw.ts - 高亮绘制

### 类结构

```typescript
export class HighlightDraw {
  private engine: BitmapGridEngine;    // 引擎引用
  private group: Group;                // Konva 组
  private highlightRect: Rect | null;  // 高亮矩形（单例）
}
```

### 主要方法

| 方法 | 说明 |
|------|------|
| `getGroup()` | 获取 Konva Group |
| `setPosition(x, y)` | 设置高亮位置（偏移） |
| `draw(col, row)` | 绘制高亮（指定格子坐标） |
| `clear()` | 清除高亮 |
| `destroy()` | 销毁资源 |

### 核心逻辑

```typescript
draw(col: number, row: number): void {
  const config = this.engine.getConfig();
  const theme = config.theme;
  const cellSize = this.engine.getZoomLevel();

  // 1. 如果已有高亮矩形，先销毁
  if (this.highlightRect) {
    this.highlightRect.destroy();
  }

  // 2. 创建新的高亮矩形
  this.highlightRect = new Rect({
    x: col * cellSize,      // 格子左上角 X
    y: row * cellSize,      // 格子左上角 Y
    width: cellSize,        // 格子宽度
    height: cellSize,       // 格子高度
    stroke: theme.highlightColor,  // 高亮边框颜色
    strokeWidth: 2,         // 边框宽度
  });

  this.group.add(this.highlightRect);
}
```

### 设计特点

- **单例模式**：只维护一个高亮矩形，避免多个高亮
- **边框绘制**：只绘制边框，不填充，不影响格子颜色
- **动态更新**：每次 `draw()` 都销毁旧矩形创建新矩形

---

## 4. ScrollbarDraw.ts - 滚动条绘制

### 类结构

```typescript
export class ScrollbarDraw {
  private engine: BitmapGridEngine;           // 引擎引用
  private horizontalGroup: Group;             // 横向滚动条组
  private verticalGroup: Group;               // 纵向滚动条组
}
```

### 主要方法

| 方法 | 说明 |
|------|------|
| `getHorizontalGroup()` | 获取横向滚动条 Konva Group |
| `getVerticalGroup()` | 获取纵向滚动条 Konva Group |
| `renderHorizontal()` | 渲染横向滚动条 |
| `renderVertical()` | 渲染纵向滚动条 |
| `destroy()` | 销毁资源 |

### 当前状态

⚠️ **未完成** - 目前只有框架，`renderHorizontal()` 和 `renderVertical()` 都是 TODO 状态。

### 预期实现逻辑

```typescript
renderHorizontal(): void {
  const config = this.engine.getConfig();
  const theme = config.theme;
  const { layout, virtualScrollSync, scrollState } = this.getLayoutAndScrollbarState();
  const { horizontalScrollbar } = layout;

  // 1. 计算滚动条状态（滑块位置、大小）
  const scrollbarState = virtualScrollSync.getScrollbarState(
    scrollState.scrollX,
    scrollState.scrollY,
    horizontalScrollbar.width,
    horizontalScrollbar.height
  );

  // 2. 清空旧内容
  this.horizontalGroup.destroyChildren();

  // 3. 绘制轨道
  const track = new Rect({
    x: 0,
    y: 0,
    width: horizontalScrollbar.width,
    height: horizontalScrollbar.height,
    fill: theme.scrollbarTrackColor,
  });
  this.horizontalGroup.add(track);

  // 4. 绘制滑块（可拖拽）
  const thumb = new Rect({
    x: scrollbarState.thumbX,
    y: 0,
    width: scrollbarState.thumbWidth,
    height: horizontalScrollbar.height,
    fill: theme.scrollbarThumbColor,
    draggable: true,
    dragBoundFunc: (pos) => {
      // 限制滑块在轨道范围内
      const maxThumbX = horizontalScrollbar.width - scrollbarState.thumbWidth;
      return {
        x: Math.max(0, Math.min(pos.x, maxThumbX)),
        y: 0,
      };
    },
  });

  // 5. 绑定拖拽事件
  thumb.on('dragmove', () => {
    const scrollState = virtualScrollSync.getScrollFromThumb(
      thumb.x(),
      0,
      horizontalScrollbar.width,
      horizontalScrollbar.height
    );
    eventBus.emit('scroll:change', scrollState);
  });

  this.horizontalGroup.add(thumb);
}
```

---

## 5. ToolbarDraw.ts - 工具栏绘制

### 类结构

```typescript
export class ToolbarDraw {
  private engine: BitmapGridEngine;    // 引擎引用
  private group: Group;                // Konva 组
  private buttons: Map<string, Button>; // 按钮对象池
}
```

### 主要方法

| 方法 | 说明 |
|------|------|
| `getGroup()` | 获取 Konva Group |
| `renderButtons()` | 渲染工具栏按钮 |
| `destroy()` | 销毁资源 |

### 核心逻辑

```typescript
renderButtons(): void {
  const config = this.engine.getConfig();
  const theme = config.theme;
  const layoutCalculator = this.engine.getLayoutCalculator();

  // 1. 获取布局
  const layout = layoutCalculator.calculate(
    this.engine.getStage()?.width() || 0,
    this.engine.getStage()?.height() || 0
  );

  // 2. 定义按钮配置
  const buttons = [
    { id: 'zoomIn', label: '+', x: 10, onClick: () => this.engine.zoomIn() },
    { id: 'zoomOut', label: '-', x: 50, onClick: () => this.engine.zoomOut() },
    { id: 'reset', label: 'Reset', x: 90, onClick: () => this.engine.resetZoom() },
  ];

  // 3. 渲染按钮
  for (const btnConfig of buttons) {
    let button = this.buttons.get(btnConfig.id);

    if (!button) {
      button = new Button({
        x: btnConfig.x,
        y: layout.toolbar.y + 5,
        width: 30,
        height: 30,
        text: btnConfig.label,
        fill: theme.toolbarButtonColor,
        stroke: theme.toolbarButtonBorderColor,
        strokeWidth: 1,
      });

      // 绑定点击事件
      button.on('click', btnConfig.onClick);

      this.group.add(button);
      this.buttons.set(btnConfig.id, button);
    }
  }
}
```

---

## Draws 模块设计模式

### 1. 统一接口

所有 Draw 类都遵循相同的模式：

```typescript
export class XxxDraw {
  private engine: BitmapGridEngine;
  private group: Group;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.group = new Group({ name: 'xxx' });
  }

  getGroup(): Group {
    return this.group;
  }

  renderXxx(): void {
    // 渲染逻辑
  }

  destroy(): void {
    this.group.destroy();
  }
}
```

### 2. 对象池模式

- `CellDraw` 使用对象池复用 Rect 对象
- `ToolbarDraw` 使用对象池复用 Button 对象
- 避免频繁创建/销毁，提升性能

### 3. 事件驱动

- 滚动条拖拽通过 `eventBus.emit('scroll:change')` 通知引擎
- 按钮点击直接调用引擎方法

### 4. 响应式更新

- 每次渲染前调用 `destroyChildren()` 清空旧内容
- 根据当前滚动、缩放状态重新计算位置

---

## 与其他模块的关系

```
BitmapGridEngine (core/)
    ↓ 创建
Layers (layers/)
    ↓ 使用
Draws (draws/) ←─── 本模块
    ↓ 绘制到
Konva Canvas
```

### 调用链

1. `BitmapGridEngine` 初始化时创建各 `Layer`
2. `Layer` 初始化时创建对应的 `Draw` 类
3. `Layer` 监听事件（scroll:change, zoom:change）
4. 事件触发时调用 `Draw.renderXxx()` 重新绘制
5. `Draw` 类从 `Engine` 获取配置、数据、状态
6. `Draw` 类创建/更新 Konva 图形对象

---

## 待完成功能

| 文件 | 待完成功能 |
|------|-----------|
| `AxisDraw.ts` | ✅ 实现自适应刻度步长算法<br>✅ 实现线宽自适应算法<br>✅ 完整的 X/Y 轴渲染逻辑 |
| `ScrollbarDraw.ts` | ✅ 实现轨道渲染<br>✅ 实现滑块渲染<br>✅ 实现拖拽事件<br>✅ 实现点击跳转 |
