# Bitmap 组件结构说明

## 概述

`bitmap` 文件夹是一个 RRAM 测试结果二维矩阵图可视化组件，基于 Konva.js Canvas 渲染，支持虚拟滚动、缩放、选择、高亮等功能。

## 目录结构

```
bitmap/
├── components/      # React 组件层
├── core/           # 核心引擎层
├── draws/          # 绘制层（Konva 图形绘制）
├── hooks/          # React Hooks
├── layers/         # Konva 图层管理
├── renderer/       # 旧版渲染器（已废弃）
├── theme/          # 主题配置
├── tools/          # 工具类
├── types.ts        # 类型定义
└── index.ts        # 公共 API 导出
```

---

## 各子文件夹功能说明

### 1. components/ - React 组件层

| 文件 | 功能 |
|------|------|
| `BitmapGrid.tsx` | 主组件，forwardRef 封装，暴露 zoomIn/zoomOut/scrollTo/selectCell 等 API |
| `BitmapTableLayout.tsx` | 60/40 左右布局，左侧 BitmapGrid，右侧 VirtualTable，支持表格-图形联动 |
| `BitmapTestPage.tsx` | 测试页面，包含文件上传、数据解析、可视化展示 |
| `FileUpload.tsx` | 文件上传组件，支持覆盖/追加模式导入 JSON 数据 |
| `VirtualTable.tsx` | 虚拟滚动表格组件，用于展示单元格数据 |

### 2. core/ - 核心引擎层

| 文件 | 功能 |
|------|------|
| `BitmapGridEngine.ts` | **主引擎**，编排所有模块，管理 Konva Stage、图层、事件总线、数据管理、虚拟滚动 |
| `DataManager.ts` | 数据管理器，存储 MatrixData，提供 getCell/setCell 等数据访问方法 |
| `DataParser.ts` | 数据解析器，将 RRAM 测试数据 JSON 转换为 MatrixData 格式，支持覆盖/追加模式 |
| `EventBus.ts` | 事件总线，基于 mitt，用于模块间通信（scroll:change, zoom:change, selection:change 等） |
| `LayoutCalculator.ts` | 布局计算器，计算各区域位置（toolbar, xAxis, yAxis, cellArea, scrollbars） |
| `VirtualScrollSync.ts` | 虚拟滚动同步，计算可见范围、滚动条状态、最大滚动距离 |

### 3. draws/ - 绘制层（Konva 图形绘制）

| 文件 | 功能 |
|------|------|
| `AxisDraw.ts` | 坐标轴绘制，绘制 X/Y 轴线、刻度、标签，根据滚动和缩放动态更新 |
| `CellDraw.ts` | 单元格绘制，绘制矩阵格子，根据颜色规则着色，只绘制可见区域 |
| `HighlightDraw.ts` | 高亮绘制，绘制选中/高亮格子的边框矩形 |
| `ScrollbarDraw.ts` | 滚动条绘制，绘制轨道和滑块，支持拖拽和点击跳转 |
| `ToolbarDraw.ts` | 工具栏绘制，绘制放大/缩小/重置等按钮 |

### 4. hooks/ - React Hooks

| 文件 | 功能 |
|------|------|
| `useBitmapGrid.ts` | 主 Hook，初始化 BitmapGridEngine，管理生命周期，暴露 zoomIn/zoomOut/scrollTo 等方法 |

### 5. layers/ - Konva 图层管理

| 文件 | 功能 |
|------|------|
| `ToolbarLayer.ts` | 工具栏图层，管理 ToolbarDraw，监听事件更新 |
| `XAxisLayer.ts` | X 轴图层，管理 AxisDraw 的 X 轴部分 |
| `YAxisLayer.ts` | Y 轴图层，管理 AxisDraw 的 Y 轴部分 |
| `CellLayer.ts` | 单元格图层，管理 CellDraw，只渲染可见区域 |
| `XAxisScrollbarLayer.ts` | X 轴滚动条图层，管理 ScrollbarDraw 的横向滚动条 |
| `YAxisScrollbarLayer.ts` | Y 轴滚动条图层，管理 ScrollbarDraw 的纵向滚动条 |
| `HighlightLayer.ts` | 高亮图层，管理 HighlightDraw，显示选中格子 |

### 6. renderer/ - 旧版渲染器（已废弃）

| 文件 | 功能 |
|------|------|
| `index.ts` | 旧版 TimingRenderer，基于 Konva 的分层渲染器（layerFloor/layer/layerCosine/layerCover） |
| `tools/index.ts` | 旧版工具导出 |

### 7. theme/ - 主题配置

| 文件 | 功能 |
|------|------|
| `presets.ts` | 预设主题，LIGHT_THEME 和 DARK_THEME，定义颜色、字体、边框等样式 |

### 8. tools/ - 工具类

| 文件 | 功能 |
|------|------|
| `EventOptimizer.ts` | 事件优化器，使用 RAF 调度和防抖优化滚轮和 resize 事件 |
| `LocationManager.ts` | 位置管理器，计算格子坐标、屏幕坐标转换 |
| `ScrollManager.ts` | 滚动管理器，管理滚动位置、边界钳制、滚动到顶部/底部等 |
| `SelectionManager.ts` | 选择管理器，管理选中状态、多选、范围选择 |
| `ZoomManager.ts` | 缩放管理器，管理缩放级别、边界（2-50px）、锚点缩放 |

### 9. 根目录文件

| 文件 | 功能 |
|------|------|
| `types.ts` | 类型定义，包含 CellData, MatrixData, LayoutConfig, ColorRule, BitmapTheme 等 |
| `index.ts` | 公共 API 导出，导出引擎、组件、Hooks、主题、类型等 |

---

## 数据流

```
用户操作 → React 组件 → useBitmapGrid Hook → BitmapGridEngine
    ↓
事件总线 (EventBus)
    ↓
各图层 (layers/) → 各绘制类 (draws/) → Konva Canvas
    ↓
工具类 (tools/) 辅助计算
```

---

## 核心概念

1. **虚拟滚动**：只渲染可见区域的格子，支持大数据量
2. **分层渲染**：不同元素在不同图层，便于独立更新
3. **事件驱动**：通过 EventBus 解耦模块间通信
4. **响应式布局**：LayoutCalculator 动态计算各区域位置
5. **颜色映射**：通过 ColorRule 将数值映射到颜色
