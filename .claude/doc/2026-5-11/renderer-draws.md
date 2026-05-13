# renderer/draws/ - 绘制模块

## 概述
`draws/` 目录包含所有 Konva 绘制相关的类，负责渲染坐标轴、滚动条、格子和高亮效果。

## 模块结构

### BaseAxisDraw.ts - 坐标轴绘制基类
**功能**: 提供坐标轴绘制的抽象接口和通用方法

**核心方法**:
- `render(state: AxisRenderState)` - 渲染坐标轴（调用子类实现）
- `renderAxisLine(state)` - 抽象方法，绘制坐标轴线
- `renderTicks(state)` - 抽象方法，绘制刻度线
- `addLine(points)` - 添加线条
- `addLabel(options)` - 添加文字标签
- `calculateStep(totalCount)` - 计算刻度步长（根据总数自动调整）

**AxisRenderState 接口**:
```typescript
{
  area: Area;           // 绘制区域
  cellSize: number;     // 格子尺寸
  scrollX: number;      // X轴滚动偏移
  scrollY: number;      // Y轴滚动偏移
  totalRows: number;    // 总行数
  totalCols: number;    // 总列数
  visibleRange: VisibleRange;  // 可视范围
}
```

### HorizontalAxisDraw.ts - 水平坐标轴
**功能**: 渲染底部 X 轴坐标

**核心方法**:
- `renderAxisLine(state)` - 绘制底部横线
- `renderTicks(state)` - 绘制 X 轴刻度（大刻度带数字，小刻度无数字）

**刻度步长规则**:
- 总数 ≤ 64: 步长 2
- 总数 ≤ 128: 步长 5
- 总数 > 128: 步长 10

### VerticalAxisDraw.ts - 垂直坐标轴
**功能**: 渲染右侧 Y 轴坐标

**核心方法**:
- `renderAxisLine(state)` - 绘制右侧竖线
- `renderTicks(state)` - 绘制 Y 轴刻度（大刻度带数字，小刻度无数字）

### BaseScrollbarDraw.ts - 滚动条绘制基类
**功能**: 提供滚动条绘制的抽象接口

**核心方法**:
- `render(state)` - 渲染滚动条（轨道 + 滑块）
- `isDragging()` - 检查滑块是否正在拖拽
- `createScrollbar(state)` - 创建滚动条组件
- `updateThumb(state)` - 更新滑块位置
- `attachEvents()` - 绑定拖拽和点击事件
- `getDragBound(pos, state)` - 抽象方法，计算拖拽边界

**ScrollbarRenderState 接口**:
```typescript
{
  area: Area;           // 绘制区域
  scrollbar: ScrollbarState;  // 滚动条状态
}
```

### HorizontalScrollbarDraw.ts - 水平滚动条
**功能**: 渲染底部水平滚动条

**核心方法**:
- `getArea(layout)` - 获取水平滚动条区域
- `getThumbX(state)` - 获取滑块 X 位置
- `getThumbY()` - 返回 0（水平滚动条）
- `getThumbWidth(state)` - 获取滑块宽度
- `getThumbHeight(state)` - 获取滑块高度
- `getDragBound(pos, state)` - 计算水平拖拽边界
- `getScrollStateFromThumb(state)` - 从滑块位置计算滚动状态
- `getScrollStateFromTrackClick(state, pointer)` - 从轨道点击位置计算滚动状态

### VerticalScrollbarDraw.ts - 垂直滚动条
**功能**: 渲染右侧垂直滚动条

**核心方法**:
- `getArea(layout)` - 获取垂直滚动条区域
- `getThumbX()` - 返回 0（垂直滚动条）
- `getThumbY(state)` - 获取滑块 Y 位置
- `getThumbWidth(state)` - 获取滑块宽度
- `getThumbHeight(state)` - 获取滑块高度
- `getDragBound(pos, state)` - 计算垂直拖拽边界
- `getScrollStateFromThumb(state)` - 从滑块位置计算滚动状态
- `getScrollStateFromTrackClick(state, pointer)` - 从轨道点击位置计算滚动状态

### CellDraw.ts - 格子绘制
**功能**: 渲染数据格子，使用对象池优化性能

**核心方法**:
- `renderCells(cells, scrollX, scrollY)` - 渲染可见格子
  - 清理不可见格子（从对象池移除）
  - 复用可见格子（从对象池获取）
  - 根据颜色规则映射格子颜色
  - 无数据格子显示灰色

- `attachCellEvents(rect, cell)` - 为格子添加鼠标事件
  - `mouseenter` - 触发悬停事件
  - `mouseleave` - 触发离开事件
  - `click` - 触发点击事件

- `mapColor(value, rules)` - 根据颜色规则映射颜色
  - 遍历规则，找到匹配的范围
  - 返回对应的颜色

**颜色映射逻辑**:
```typescript
if (cell.value === -1) {
  // 无数据格子显示灰色
  rect.fill(theme.defaultCellColor);
} else {
  // 有数据格子根据 colorRules 映射颜色
  const color = this.mapColor(cell.value, colorRules);
  rect.fill(color || theme.defaultCellColor);
}
```

### HighlightDraw.ts - 高亮绘制
**功能**: 渲染格子高亮效果（选择/定位时显示）

**核心方法**:
- `draw(col, row)` - 绘制高亮矩形
- `clear()` - 清除高亮
- `setPosition(x, y)` - 设置高亮位置
- `setClip(width, height)` - 设置裁剪区域

**高亮样式**:
- 边框颜色: `theme.highlightColor`
- 边框宽度: 2px
- 不响应鼠标事件 (`listening: false`)

## 绘制顺序
1. **AxisLayer** - 坐标轴 + 滚动条
2. **CellLayer** - 数据格子
3. **HighlightLayer** - 高亮效果

## 依赖关系
- BaseAxisDraw ← HorizontalAxisDraw, VerticalAxisDraw
- BaseScrollbarDraw ← HorizontalScrollbarDraw, VerticalScrollbarDraw
- CellDraw, HighlightDraw 独立
