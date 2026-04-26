# Bitmap Grid 组件实现计划

## 背景

替换旧的 `bitmap-bak/` 实现，基于 `design-review.md` 中确认的设计决策，构建新的三层 Konva 架构。组件将 RRAM 测试结果渲染为二维矩阵图（最大 128×1024 = 131,072 个格子），支持虚拟滚动、坐标轴标签、滚动条同步、缩放、选择、高亮和 React 集成。

**关键约束：**
- 基于 Konva.js 渲染（与 bitmap-bak 相同技术栈）
- 三个 Konva Layer（XAxisScrollbar、YAxisScrollbar、Cell）
- 实例级主题 BitmapTheme（非全局配置）
- 暂不实现：错误处理、可访问性、国际化、数据导入优化、数据更新
- 滚动条采用系统默认样式（不做自定义美化）

## 目录结构

```
bitmap/
├── types.ts                    # 所有类型/接口定义
├── core/
│   ├── EventBus.ts             # 基于 mitt 的事件总线
│   ├── LayoutCalculator.ts     # 统一布局计算（2.1 已确认正确）
│   ├── VirtualScrollSync.ts    # 双向滚动条↔虚拟滚动同步（2.3 补充设计）
│   ├── DataManager.ts          # 按区域获取数据（2.7 补充设计）
│   └── BitmapGridEngine.ts     # 主引擎，编排所有模块
├── layers/
│   ├── ToolbarLayer.ts         # 工具栏 Konva 图层（缩放、定位按钮等）
│   ├── XAxisScrollbarLayer.ts  # X 轴 + 横向滚动条 Konva 图层
│   ├── YAxisScrollbarLayer.ts  # Y 轴 + 纵向滚动条 Konva 图层
│   └── CellLayer.ts            # 格子网格渲染 Konva 图层
├── tools/
│   ├── ZoomManager.ts          # 缩放管理，边界 2-50px（2.18 补充设计）
│   ├── ScrollManager.ts        # 滚动位置管理 + 边界钳制
│   ├── SelectionManager.ts     # 坐标定位选择（2.19 补充设计）
│   ├── LocationManager.ts      # 定位到格子，确保可见（2.4 简化方案）
│   └── EventOptimizer.ts       # RAF 调度 + 防抖（2.8 补充设计）
├── draws/
│   ├── ToolbarDraw.ts          # 工具栏按钮渲染
│   ├── AxisDraw.ts             # 坐标轴刻度 + 标签渲染
│   ├── ScrollbarDraw.ts        # 滚动条轨道 + 滑块渲染
│   ├── CellDraw.ts             # 格子渲染，含对象池
│   └── HighlightDraw.ts        # 选择/高亮覆盖层
├── theme/
│   └── presets.ts              # LIGHT_THEME、DARK_THEME 预设
├── hooks/
│   └── useBitmapGrid.ts        # React Hook
├── components/
│   ├── BitmapGrid.tsx           # React 组件（forwardRef）
│   └── BitmapTableLayout.tsx    # 60/40 左右布局（2.9 已确认正确）
├── index.ts                    # 公共 API 导出
```

## 阶段 1：基础模块

### types.ts
所有类型定义：CellData、MatrixData、LayoutConfig、LayoutResult、Area、BitmapTheme、ColorRule、BitmapGridCallbacks、BitmapGridConfig、ScrollState、VisibleRange、ScrollbarState、BitmapEvents

### core/EventBus.ts
mitt 封装：on/off/emit/clear，支持 BitmapEvents 类型

### core/LayoutCalculator.ts
- `calculate(containerWidth, containerHeight): LayoutResult`
- 统一计算各区域位置：toolbar、xAxis、yAxis、cellArea、horizontalScrollbar、verticalScrollbar
- 各区域独立，不重叠，通过 spacing 间隔
- 工具栏位于顶部，X 轴在工具栏下方、Y 轴右侧

### core/DataManager.ts
- `setData(data)` — 构建内部 cellMap（Map，key 为 "row,col"）
- `getCell(row, col)` — 获取单个格子数据
- `getDataByArea(startRow, endRow, startCol, endCol)` — 按区域获取数据
- `totalRows`、`totalCols` getter

**依赖：** 无

## 阶段 2：核心引擎 + 虚拟滚动同步

### core/VirtualScrollSync.ts
- `getVisibleRange(scrollX, scrollY)` — 计算当前可视格子范围
- `getScrollbarState(scrollX, scrollY, trackWidth, trackHeight)` — 计算滚动条滑块位置和尺寸
- `getScrollFromThumb(thumbX, thumbY, trackWidth, trackHeight)` — 从滑块位置反算滚动偏移
- `updateViewport(width, height)`、`updateCellSize(cellSize)` — 更新视口/格子尺寸
- `maxScrollX`、`maxScrollY` getter

### core/BitmapGridEngine.ts
主引擎，编排所有模块：
- 持有 Stage、3 个 Layer、所有 tools/draws、EventBus、DataManager、VirtualScrollSync
- 公共 API：constructor、initialize、destroy、resize、setTheme、setData、setColorRules
- 委托方法：zoomIn/Out/reset、scrollTo、selectCell/clearSelection、locateAndHighlight
- 状态获取：getZoomLevel、getScrollState、getSelectedCell

**依赖：** 阶段 1

## 阶段 3：图层

### layers/ToolbarLayer.ts
- 创建 Konva.Layer，包含 ToolbarDraw（缩放、定位按钮等）
- 处理工具栏按钮点击事件 → 触发缩放、定位等操作

### layers/XAxisScrollbarLayer.ts
- 创建 Konva.Layer，包含 AxisDraw（X 轴）+ ScrollbarDraw（横向滚动条）
- 监听 `scroll:horizontal` 事件更新 X 轴标签（仅更新标签，滑块无需更新）
- 处理横向滚动条拖拽 → 通过 EventBus 触发滚动位置更新

### layers/YAxisScrollbarLayer.ts
- 创建 Konva.Layer，包含 AxisDraw（Y 轴）+ ScrollbarDraw（纵向滚动条）
- 监听 `scroll:vertical` 事件更新 Y 轴标签
- 处理纵向滚动条拖拽

### layers/CellLayer.ts
- 创建 Konva.Layer，包含 CellDraw + HighlightDraw
- 监听 `scroll:change` + `zoom:change` 重新渲染可见格子
- 处理 click/hover 事件 → 计算格子位置 → 触发外部回调

**依赖：** 阶段 1、阶段 2

## 阶段 4：工具管理器

### tools/ScrollManager.ts
- setScrollX/Y：钳制边界 + 通过 EventBus 发射事件
- scrollBy：增量滚动

### tools/ZoomManager.ts
- zoomAt(delta, anchorX, anchorY)：以锚点为中心缩放
- 格子最小尺寸 2px，最大 50px，默认 10px
- setCellSize、resetZoom

### tools/SelectionManager.ts
- selectCell(col, row)：单选模式，增量重绘
- clearSelection、isSelected
- 发射 `selection:change` 事件

### tools/LocationManager.ts
- locateToCell(col, row)：确保目标格子完整显示在可视区域内
- 最小幅度滚动，不居中

### tools/EventOptimizer.ts
- handleWheel：累积增量，合并到单次 RAF 渲染
- handleResize：防抖 150ms

**依赖：** 阶段 1、阶段 2

## 阶段 5：绘制组件

### draws/ToolbarDraw.ts
- renderToolbar：渲染缩放按钮（↖ ↗）、定位按钮（■ □）、缩放比例显示（x1）、缩放控制（+ -）
- 处理按钮点击事件 → 触发 ZoomManager、LocationManager 操作

### draws/AxisDraw.ts
- renderXAxis、renderYAxis：自适应刻度步长，theme.axisColor，线宽算法自适应
- 固定布局：X 轴顶部、Y 轴左侧，颜色跟随主题

### draws/ScrollbarDraw.ts
- renderHorizontal、renderVertical：轨道 + 滑块，主题色
- 系统默认样式，拖拽事件处理

### draws/CellDraw.ts
- renderCells：对象池（Map），复用 Konva.Rect
- mapColor(value, rules)：外部规则遍历，无缓存
- 隐藏不可见格子

### draws/HighlightDraw.ts
- draw(col, row, ...)：绘制高亮边框，theme.highlightColor
- clear()：清除高亮

**依赖：** 阶段 1、阶段 3

## 阶段 6：主题预设

### theme/presets.ts
- LIGHT_THEME、DARK_THEME 常量（实例级主题参数）

**依赖：** 阶段 1（types.ts）

## 阶段 7：React 集成

### hooks/useBitmapGrid.ts
- 创建/管理 BitmapGridEngine 生命周期
- ResizeObserver 监听容器尺寸变化

### components/BitmapGrid.tsx
- forwardRef 组件
- Props：config、data、onCellClick、onCellHover、className、style
- Ref API：zoomIn/Out/reset、scrollTo、selectCell、clearSelection、locateAndHighlight

### components/BitmapTableLayout.tsx
- 左 60% BitmapGrid + 右 40% DataTable
- 点击联动：表格行点击 → locateAndHighlight，格子点击 → 表格滚动定位

**依赖：** 阶段 2（引擎）、阶段 6（主题）

## 阶段 8：公共 API

### index.ts
导出：BitmapGridEngine、BitmapGrid、BitmapTableLayout、LIGHT_THEME、DARK_THEME、所有类型

## 构建顺序（25 个文件）

1. types.ts → 2. EventBus.ts → 3. LayoutCalculator.ts → 4. DataManager.ts → 5. VirtualScrollSync.ts → 6. ScrollManager.ts → 7. ZoomManager.ts → 8. SelectionManager.ts → 9. LocationManager.ts → 10. EventOptimizer.ts → 11. ToolbarDraw.ts → 12. AxisDraw.ts → 13. ScrollbarDraw.ts → 14. CellDraw.ts → 15. HighlightDraw.ts → 16. presets.ts → 17. ToolbarLayer.ts → 18. XAxisScrollbarLayer.ts → 19. YAxisScrollbarLayer.ts → 20. CellLayer.ts → 21. BitmapGridEngine.ts → 22. useBitmapGrid.ts → 23. BitmapGrid.tsx → 24. BitmapTableLayout.tsx → 25. index.ts

## 验证方式

1. `npm run build:webview` 构建通过
2. `npm run check-types` 类型检查通过
3. 开发服务器：加载 64×64 测试数据 → 矩阵图正确渲染、坐标轴/滚动条正常工作、缩放 2-50px 边界有效、点击/悬停事件触发、定位高亮正常、主题切换渲染正确
4. 大数据测试：128×1024 数据平滑滚动
5. 尺寸调整：拖拽 VS Code 面板边缘 → 布局自动重算
