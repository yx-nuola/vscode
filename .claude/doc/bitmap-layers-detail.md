# Layers 模块详细说明

## 概述

`layers` 模块负责 Konva 图层管理，每个图层类负责管理一种 UI 元素的绘制类，并监听事件触发重新渲染。

---

## 文件列表

| 文件 | 功能 | 状态 |
|------|------|------|
| `ToolbarLayer.ts` | 工具栏图层，管理 ToolbarDraw | ✅ 完成 |
| `XAxisLayer.ts` | X 轴图层，管理 AxisDraw 的 X 轴部分 | ✅ 完成 |
| `YAxisLayer.ts` | Y 轴图层，管理 AxisDraw 的 Y 轴部分 | ✅ 完成 |
| `CellLayer.ts` | 单元格图层，管理 CellDraw，只渲染可见区域 | ✅ 完成 |
| `XAxisScrollbarLayer.ts` | X 轴滚动条图层，管理 ScrollbarDraw 的横向滚动条 | ✅ 完成 |
| `YAxisScrollbarLayer.ts` | Y 轴滚动条图层，管理 ScrollbarDraw 的纵向滚动条 | ✅ 完成 |
| `HighlightLayer.ts` | 高亮图层，管理 HighlightDraw，显示选中格子 | ✅ 完成 |

---

## 1. ToolbarLayer.ts - 工具栏图层

### 类结构

```typescript
export class ToolbarLayer {
  private layer: LayerType;           // Konva Layer
  private engine: BitmapGridEngine;  // 引擎引用
  private toolbarDraw: ToolbarDraw;  // 工具栏绘制类
}
```

### 主要方法

| 方法 | 说明 |
|------|------|
| `getLayer()` | 获取 Konva Layer |
| `initialize()` | 初始化图层，设置事件监听 |
| `destroy()` | 销毁图层 |

### 初始化逻辑

```typescript
initialize(): void {
  const eventBus = this.engine.getEventBus();
  const layoutCalculator = this.engine.getLayoutCalculator();

  // 1. 设置工具栏位置
  const layout = layoutCalculator.calculate(
    this.engine.getStage()?.width() || 0,
    this.engine.getStage()?.height() || 0
  );
  this.toolbarDraw.setPosition(layout.toolbar.x, layout.toolbar.y);

  // 2. 监听滚动变化
  eventBus.on('scroll:change', () => {
    this.updateToolbar();
  });

  // 3. 监听缩放变化
  eventBus.on('zoom:change', () => {
    this.updateToolbar();
  });

  // 4. 初始渲染
  this.updateToolbar();
}
```

### 更新工具栏

```typescript
private updateToolbar(): void {
  this.toolbarDraw.renderButtons();
}
```

---

## 2. XAxisLayer.ts - X 轴图层

### 类结构

```typescript
export class XAxisLayer {
  private layer: LayerType;           // Konva Layer
  private engine: BitmapGridEngine;  // 引擎引用
  private axisDraw: AxisDraw;         // 坐标轴绘制类
}
```

### 主要方法

| 方法 | 说明 |
|------|------|
| `getLayer()` | 获取 Konva Layer |
| `initialize()` | 初始化图层，设置事件监听 |
| `destroy()` | 销毁图层 |

### 初始化逻辑

```typescript
initialize(): void {
  const eventBus = this.engine.getEventBus();
  const layoutCalculator = this.engine.getLayoutCalculator();

  // 1. 设置 X 轴位置
  const layout = layoutCalculator.calculate(
    this.engine.getStage()?.width() || 0,
    this.engine.getStage()?.height() || 0
  );
  this.axisDraw.setXAxisPosition(layout.xAxis.x, layout.xAxis.y);

  // 2. 监听滚动变化
  eventBus.on('scroll:change', () => {
    this.updateAxis();
  });

  // 3. 监听缩放变化
  eventBus.on('zoom:change', () => {
    this.updateAxis();
  });

  // 4. 初始渲染
  this.updateAxis();
}
```

### 更新坐标轴

```typescript
private updateAxis(): void {
  this.axisDraw.renderXAxis();
}
```

---

## 3. YAxisLayer.ts - Y 轴图层

### 类结构

```typescript
export class YAxisLayer {
  private layer: LayerType;           // Konva Layer
  private engine: BitmapGridEngine;  // 引擎引用
  private axisDraw: AxisDraw;         // 坐标轴绘制类
}
```

### 主要方法

| 方法 | 说明 |
|------|------|
| `getLayer()` | 获取 Konva Layer |
| `initialize()` | 初始化图层，设置事件监听 |
| `destroy()` | 销毁图层 |

### 初始化逻辑

```typescript
initialize(): void {
  const eventBus = this.engine.getEventBus();
  const layoutCalculator = this.engine.getLayoutCalculator();

  // 1. 设置 Y 轴位置
  const layout = layoutCalculator.calculate(
    this.engine.getStage()?.width() || 0,
    this.engine.getStage()?.height() || 0
  );
  this.axisDraw.setYAxisPosition(layout.yAxis.x, layout.yAxis.y);

  // 2. 监听滚动变化
  eventBus.on('scroll:change', () => {
    this.updateAxis();
  });

  // 3. 监听缩放变化
  eventBus.on('zoom:change', () => {
    this.updateAxis();
  });

  // 4. 初始渲染
  this.updateAxis();
}
```

### 更新坐标轴

```typescript
private updateAxis(): void {
  this.axisDraw.renderYAxis();
}
```

---

## 4. CellLayer.ts - 单元格图层

### 类结构

```typescript
export class CellLayer {
  private layer: LayerType;           // Konva Layer
  private engine: BitmapGridEngine;  // 引擎引用
  private cellDraw: CellDraw;        // 单元格绘制类
}
```

### 主要方法

| 方法 | 说明 |
|------|------|
| `getLayer()` | 获取 Konva Layer |
| `initialize()` | 初始化图层，设置事件监听 |
| `destroy()` | 销毁图层 |

### 初始化逻辑

```typescript
initialize(): void {
  const eventBus = this.engine.getEventBus();
  const layoutCalculator = this.engine.getLayoutCalculator();

  // 1. 设置格子区域位置
  const layout = layoutCalculator.calculate(
    this.engine.getStage()?.width() || 0,
    this.engine.getStage()?.height() || 0
  );
  this.cellDraw.setPosition(layout.cellArea.x, layout.cellArea.y);

  // 2. 监听数据变化
  eventBus.on('data:change', () => {
    this.updateCells();
  });

  // 3. 监听滚动变化
  eventBus.on('scroll:change', () => {
    this.updateCells();
  });

  // 4. 监听缩放变化
  eventBus.on('zoom:change', () => {
    this.updateCells();
  });

  // 5. 初始渲染
  this.updateCells();
}
```

### 更新格子

```typescript
private updateCells(): void {
  const virtualScrollSync = this.engine.getVirtualScrollSync();
  const scrollState = this.engine.getScrollState();
  const dataManager = this.engine.getDataManager();

  // 1. 获取可见范围
  const visibleRange = virtualScrollSync.getVisibleRange(scrollState.scrollX, scrollState.scrollY);

  // 2. 获取可见区域的数据
  const cells = dataManager.getDataByArea(
    visibleRange.startRow,
    visibleRange.endRow,
    visibleRange.startCol,
    visibleRange.endCol
  );

  // 3. 渲染格子
  this.cellDraw.renderCells(cells);
}
```

---

## 5. XAxisScrollbarLayer.ts - X 轴滚动条图层

### 类结构

```typescript
export class XAxisScrollbarLayer {
  private layer: LayerType;           // Konva Layer
  private engine: BitmapGridEngine;  // 引擎引用
  private scrollbarDraw: ScrollbarDraw; // 滚动条绘制类
}
```

### 主要方法

| 方法 | 说明 |
|------|------|
| `getLayer()` | 获取 Konva Layer |
| `initialize()` | 初始化图层，设置事件监听 |
| `destroy()` | 销毁图层 |

### 初始化逻辑

```typescript
initialize(): void {
  const eventBus = this.engine.getEventBus();
  const layoutCalculator = this.engine.getLayoutCalculator();

  // 1. 设置横向滚动条位置
  const layout = layoutCalculator.calculate(
    this.engine.getStage()?.width() || 0,
    this.engine.getStage()?.height() || 0
  );
  this.scrollbarDraw.setHorizontalPosition(layout.horizontalScrollbar.x, layout.horizontalScrollbar.y);

  // 2. 监听滚动变化
  eventBus.on('scroll:change', () => {
    this.updateScrollbar();
  });

  // 3. 监听缩放变化
  eventBus.on('zoom:change', () => {
    this.updateScrollbar();
  });

  // 4. 初始渲染
  this.updateScrollbar();
}
```

### 更新滚动条

```typescript
private updateScrollbar(): void {
  this.scrollbarDraw.renderHorizontal();
}
```

---

## 6. YAxisScrollbarLayer.ts - Y 轴滚动条图层

### 类结构

```typescript
export class YAxisScrollbarLayer {
  private layer: LayerType;           // Konva Layer
  private engine: BitmapGridEngine;  // 引擎引用
  private scrollbarDraw: ScrollbarDraw; // 滚动条绘制类
}
```

### 主要方法

| 方法 | 说明 |
|------|------|
| `getLayer()` | 获取 Konva Layer |
| `initialize()` | 初始化图层，设置事件监听 |
| `destroy()` | 销毁图层 |

### 初始化逻辑

```typescript
initialize(): void {
  const eventBus = this.engine.getEventBus();
  const layoutCalculator = this.engine.getLayoutCalculator();

  // 1. 设置纵向滚动条位置
  const layout = layoutCalculator.calculate(
    this.engine.getStage()?.width() || 0,
    this.engine.getStage()?.height() || 0
  );
  this.scrollbarDraw.setVerticalPosition(layout.verticalScrollbar.x, layout.verticalScrollbar.y);

  // 2. 监听滚动变化
  eventBus.on('scroll:change', () => {
    this.updateScrollbar();
  });

  // 3. 监听缩放变化
  eventBus.on('zoom:change', () => {
    this.updateScrollbar();
  });

  // 4. 初始渲染
  this.updateScrollbar();
}
```

### 更新滚动条

```typescript
private updateScrollbar(): void {
  this.scrollbarDraw.renderVertical();
}
```

---

## 7. HighlightLayer.ts - 高亮图层

### 类结构

```typescript
export class HighlightLayer {
  private layer: LayerType;           // Konva Layer
  private engine: BitmapGridEngine;  // 引擎引用
  private highlightDraw: HighlightDraw; // 高亮绘制类
}
```

### 主要方法

| 方法 | 说明 |
|------|------|
| `getLayer()` | 获取 Konva Layer |
| `initialize()` | 初始化图层，设置事件监听 |
| `destroy()` | 销毁图层 |

### 初始化逻辑

```typescript
initialize(): void {
  const eventBus = this.engine.getEventBus();
  const layoutCalculator = this.engine.getLayoutCalculator();

  // 1. 设置高亮位置
  const layout = layoutCalculator.calculate(
    this.engine.getStage()?.width() || 0,
    this.engine.getStage()?.height() || 0
  );
  this.highlightDraw.setPosition(layout.cellArea.x, layout.cellArea.y);

  // 2. 监听高亮事件
  eventBus.on('highlight', (data) => {
    if (data) {
      this.highlightDraw.draw(data.col, data.row);
    } else {
      this.highlightDraw.clear();
    }
  });

  // 3. 监听清除高亮事件
  eventBus.on('clear-highlight', () => {
    this.highlightDraw.clear();
  });

  // 4. 监听选择变化事件
  eventBus.on('selection:change', (cell) => {
    if (cell) {
      this.highlightDraw.draw(cell.col, cell.row);
    } else {
      this.highlightDraw.clear();
    }
  });
}
```

---

## Layers 模块设计模式

### 1. 统一接口

所有 Layer 类都遵循相同的模式：

```typescript
export class XxxLayer {
  private layer: LayerType;
  private engine: BitmapGridEngine;
  private xxxDraw: XxxDraw;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.layer = new Layer({ name: 'xxx' });
    this.xxxDraw = new XxxDraw(engine);
    this.layer.add(this.xxxDraw.getGroup());
  }

  getLayer(): LayerType {
    return this.layer;
  }

  initialize(): void {
    // 设置位置
    // 监听事件
    // 初始渲染
  }

  destroy(): void {
    this.xxxDraw.destroy();
    this.layer.destroy();
  }
}
```

### 2. 事件驱动

- 每个图层监听相关事件（scroll:change、zoom:change、data:change 等）
- 事件触发时调用对应的 Draw 类的渲染方法
- 通过 EventBus 解耦图层间的依赖

### 3. 响应式更新

- 滚动、缩放变化时自动更新
- 数据变化时自动更新
- 选择变化时自动更新高亮

### 4. 位置管理

- 通过 `LayoutCalculator` 计算各区域位置
- 初始化时设置位置
- 滚动、缩放时不需要更新位置（由 Draw 类处理）

---

## 与其他模块的关系

```
BitmapGridEngine (core/)
    ↓ 创建
Layers (layers/) ←─── 本模块
    ↓ 使用
Draws (draws/)
    ↓ 绘制到
Konva Canvas
```

### 调用链

1. `BitmapGridEngine` 初始化时创建各 `Layer`
2. `Layer` 初始化时创建对应的 `Draw` 类
3. `Layer` 监听 EventBus 事件
4. 事件触发时调用 `Draw.renderXxx()` 重新绘制
5. `Draw` 类从 `Engine` 获取配置、数据、状态
6. `Draw` 类创建/更新 Konva 图形对象

---

## 图层顺序

Konva Stage 中的图层顺序（后面的覆盖前面的）：

```
1. ToolbarLayer (工具栏)
2. CellLayer (格子)
3. XAxisLayer (X 轴)
4. YAxisLayer (Y 轴)
5. XAxisScrollbarLayer (横向滚动条)
6. YAxisScrollbarLayer (纵向滚动条)
7. HighlightLayer (高亮)
```

### 图层顺序说明

- **ToolbarLayer**：最底层，工具栏按钮
- **CellLayer**：格子层，在工具栏上方
- **XAxisLayer / YAxisLayer**：坐标轴，在格子上方
- **XAxisScrollbarLayer / YAxisScrollbarLayer**：滚动条，在坐标轴上方
- **HighlightLayer**：最顶层，高亮边框覆盖所有内容

---

## 监听的事件

| 图层 | 监听的事件 |
|------|-----------|
| `ToolbarLayer` | scroll:change, zoom:change |
| `XAxisLayer` | scroll:change, zoom:change |
| `YAxisLayer` | scroll:change, zoom:change |
| `CellLayer` | data:change, scroll:change, zoom:change |
| `XAxisScrollbarLayer` | scroll:change, zoom:change |
| `YAxisScrollbarLayer` | scroll:change, zoom:change |
| `HighlightLayer` | highlight, clear-highlight, selection:change |
