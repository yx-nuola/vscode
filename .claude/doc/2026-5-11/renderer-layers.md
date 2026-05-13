# renderer/layers/ - 图层模块

## 概述
`layers/` 目录包含 Konva 图层类，负责组织不同类型的渲染内容，实现分层渲染和事件处理。

## 模块结构

### AxisLayer.ts - 坐标轴 + 滚动条图层
**功能**: 管理坐标轴和滚动条的渲染，处理滚动和缩放事件

**核心属性**:
- `layer` - Konva 图层（name: 'axis'）
- `horizontalAxisDraw` - 水平坐标轴绘制器
- `verticalAxisDraw` - 垂直坐标轴绘制器
- `horizontalScrollbarDraw` - 水平滚动条绘制器
- `verticalScrollbarDraw` - 垂直滚动条绘制器

**核心方法**:
- `initialize()` - 初始化图层
  - 更新坐标轴和滚动条位置
  - 监听 `scroll:change` 事件
  - 监听 `zoom:change` 事件
  - 触发首次渲染

- `update()` - 更新坐标轴和滚动条
  - 更新位置
  - 计算可视范围
  - 渲染坐标轴和滚动条

- `updatePositions()` - 更新绘制器位置
  - 根据布局计算位置
  - 设置到绘制器

- `getLayout()` - 获取布局结果
  - 调用 LayoutCalculator 计算布局

- `destroy()` - 销毁图层
  - 销毁所有绘制器
  - 销毁图层

**渲染流程**:
```
初始化
  ↓
更新位置
  ↓
监听事件
  ↓
scroll:change → update()
  ↓
zoom:change → update()
  ↓
渲染坐标轴和滚动条
```

### CellLayer.ts - 格子网格图层
**功能**: 管理数据格子的渲染，实现虚拟滚动效果

**核心属性**:
- `layer` - Konva 图层（name: 'cell'）
- `cellDraw` - 格子绘制器（CellDraw 实例）

**核心方法**:
- `initialize()` - 初始化图层
  - 设置格子位置和裁剪区域
  - 监听事件:
    - `scroll:change` - 滚动变化时重新渲染
    - `zoom:change` - 缩放变化时重新渲染
    - `locate` - 定位时重新渲染
    - `data:change` - 数据变化时重新渲染
  - 触发首次渲染

- `renderVisibleCells()` - 渲染可见格子
  1. 获取可视范围
  2. 遍历可见区域的所有格子
  3. 从 DataManager 获取格子数据
  4. 无数据格子创建占位格子（value: -1）
  5. 调用 CellDraw 渲染

**渲染逻辑**:
```typescript
for (let row = startRow; row <= endRow; row++) {
  for (let col = startCol; col <= endCol; col++) {
    const cell = dataManager.getCell(row, col);
    if (cell) {
      visibleCells.push(cell);
    } else {
      visibleCells.push({ row, col, value: -1 });
    }
  }
}
cellDraw.renderCells(visibleCells, scrollX, scrollY);
```

### HighlightLayer.ts - 高亮图层
**功能**: 管理格子高亮效果，处理选择和定位事件

**核心属性**:
- `layer` - Konva 图层（name: 'highlight'）
- `highlightDraw` - 高亮绘制器（HighlightDraw 实例）

**核心方法**:
- `initialize()` - 初始化图层
  - 设置高亮位置和裁剪区域
  - 监听事件:
    - `highlight` - 定位高亮
    - `clear-highlight` - 清除高亮
    - `selection:change` - 选择变化
    - `scroll:change` - 滚动变化时重绘
    - `zoom:change` - 缩放变化时重绘
    - `data:change` - 数据变化时重绘

- `redrawSelectedCell()` - 重绘选中的格子
  - 获取选中格子
  - 调用 HighlightDraw 绘制或清除

**事件处理**:
```
highlight → highlightDraw.draw()
clear-highlight → highlightDraw.clear()
selection:change → highlightDraw.draw() 或 clear()
scroll:change → redrawSelectedCell()
zoom:change → redrawSelectedCell()
data:change → redrawSelectedCell()
```

## 图层组织

### 分层渲染
```
Stage
├── AxisLayer (底层)
│   ├── horizontalAxisDraw
│   ├── verticalAxisDraw
│   ├── horizontalScrollbarDraw
│   └── verticalScrollbarDraw
├── CellLayer (中层)
│   └── cellDraw
└── HighlightLayer (顶层)
    └── highlightDraw
```

### 渲染顺序
1. **AxisLayer** - 坐标轴和滚动条在最底层
2. **CellLayer** - 数据格子在中层
3. **HighlightLayer** - 高亮效果在顶层（覆盖在格子上）

### 裁剪区域
所有图层都设置了裁剪区域，确保内容只在网格区域内显示：
```typescript
setClip(width, height)  // 裁剪为格子区域大小
```

## 事件总线集成
所有图层都通过事件总线与引擎通信：
```typescript
const eventBus = this.engine.getEventBus();
eventBus.on('scroll:change', () => this.update());
eventBus.on('zoom:change', () => this.update());
```

## 清理机制
所有图层在销毁时会清理资源：
```typescript
destroy() {
  draw.destroy();  // 销毁绘制器
  layer.destroy(); // 销毁图层
}
```
