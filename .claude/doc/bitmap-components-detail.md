# Bitmap 组件架构详解

## 概述

Bitmap 组件是一个 RRAM（阻变存储器）测试结果的二维矩阵可视化工具，使用 Konva.js 进行图形渲染。组件采用分层架构，包含核心引擎、图层渲染、数据管理、工具类和 React 组件。

---

## 目录结构

```
bitmap/
├── index.ts                    # 公共 API 导出
├── types.ts                    # 类型定义
├── core/                       # 核心引擎模块
│   ├── BitmapGridEngine.ts     # 主引擎，编排所有模块
│   ├── DataManager.ts          # 数据管理器
│   ├── DataParser.ts           # 数据解析器
│   ├── EventBus.ts             # 事件总线
│   ├── LayoutCalculator.ts     # 布局计算器
│   └── VirtualScrollSync.ts    # 虚拟滚动同步
├── layers/                     # 图层模块
│   ├── AxisLayer.ts            # 坐标轴 + 滚动条图层
│   ├── CellLayer.ts            # 格子网格图层
│   └── HighlightLayer.ts       # 高亮图层
├── draws/                      # 绘制模块
│   ├── AxisDraw.ts             # 坐标轴绘制
│   ├── CellDraw.ts             # 格子绘制（含对象池）
│   ├── HighlightDraw.ts        # 高亮绘制
│   ├── BaseAxisDraw.ts         # 坐标轴基类
│   ├── BaseScrollbarDraw.ts    # 滚动条基类
│   ├── HorizontalAxisDraw.ts   # X 轴绘制
│   ├── VerticalAxisDraw.ts     # Y 轴绘制
│   ├── HorizontalScrollbarDraw.ts  # 横向滚动条绘制
│   └── VerticalScrollbarDraw.ts    # 纵向滚动条绘制
├── tools/                      # 工具类
│   ├── EventOptimizer.ts       # 事件优化器（RAF 调度 + 防抖）
│   ├── ScrollManager.ts        # 滚动管理器
│   ├── SelectionManager.ts     # 选择管理器
│   ├── ZoomManager.ts          # 缩放管理器
│   └── LocationManager.ts      # 定位管理器
├── theme/                      # 主题
│   └── presets.ts              # 浅色/深色主题预设
└── components/                 # React 组件
    ├── BitmapGrid.tsx          # Bitmap Grid 组件
    ├── BitmapTableLayout.tsx   # 图形 + 表格布局
    ├── VirtualTable.tsx        # 虚拟滚动表格
    ├── FileUpload.tsx          # 文件上传组件
    └── BitmapTestPage.tsx      # 测试页面
```

---

## 核心模块详解

### 1. types.ts - 类型定义

定义了组件的所有数据类型和常量。

**常量：**
- `BITMAP_WIDTH = 896` - 格子矩阵固定宽度
- `BITMAP_HEIGHT = 896` - 格子矩阵固定高度
- `DEFAULT_CELL_SIZE = 14` - 默认格子尺寸
- `MAX_CELL_SIZE = 56` - 最大格子尺寸
- `DEFAULT_COLS = 64` - 默认列数
- `DEFAULT_ROWS = 64` - 默认行数

**核心类型：**
- `CellData` - 单个格子数据（行、列、值、元数据）
- `MatrixData` - 矩阵数据（总行数、总列数、格子数组）
- `LayoutConfig` - 布局配置（坐标轴尺寸、滚动条尺寸、间距）
- `LayoutResult` - 布局计算结果（各区域位置）
- `ColorRule` - 颜色映射规则（最小值、最大值、颜色）
- `BitmapTheme` - 主题配置（背景色、坐标轴色、滚动条色等）
- `ScrollState` - 滚动状态（X 轴偏移、Y 轴偏移）
- `VisibleRange` - 可见范围（起始/结束行、起始/结束列）
- `BitmapEvents` - 事件类型定义

---

### 2. core/BitmapGridEngine.ts - 主引擎

**功能：** 编排所有模块，是组件的核心控制器。

**职责：**
- 初始化 Konva Stage 和图层
- 管理滚动、缩放、选择、高亮状态
- 协调事件总线，分发事件到各模块
- 提供公共 API 给 React 组件

**关键方法：**
- `initialize(container)` - 初始化引擎
- `setData(data)` - 设置矩阵数据
- `zoomIn()` / `zoomOut()` / `resetZoom()` - 缩放控制
- `scrollTo(scrollX, scrollY)` - 滚动到指定位置
- `selectCell(col, row)` - 选择格子
- `locateAndHighlight(col, row)` - 定位并高亮格子

---

### 3. core/DataManager.ts - 数据管理器

**功能：** 管理矩阵数据的存储和查询。

**职责：**
- 使用 Map 存储格子数据（key: "row,col"）
- 提供按坐标获取数据的方法
- 提供按区域获取数据的方法

**关键方法：**
- `setData(data)` - 设置矩阵数据
- `getCell(row, col)` - 获取单个格子
- `getDataByArea(startRow, endRow, startCol, endCol)` - 按区域获取数据
- `getAllCells()` - 获取所有格子

---

### 4. core/DataParser.ts - 数据解析器

**功能：** 解析 RRAM 测试数据的 JSON 格式。

**支持的原始格式：**
```typescript
{
  rows: number,           // 总行数
  cols: number,           // 总列数
  metadata: {             // 元数据
    total: number,
    date: string,
    mode: string
  },
  cells: [                // 格子数组
    { bl: number,         // 位线（列）
      wl: number,         // 字线（行）
      vset: number|string,// 设置电压
      vreset: number|string,// 复位电压
      imeas: number|string,// 测量电流
      status: string      // 状态
    }
  ]
}
```

**关键方法：**
- `parseRRAMData(data)` - 解析 RRAM 测试数据
- `mergeData(existingData, newData)` - 合并数据（追加模式）
- `parseJSON(jsonString)` - 解析 JSON 字符串
- `validateData(data)` - 验证数据格式

---

### 5. core/EventBus.ts - 事件总线

**功能：** 基于 mitt 库的事件发布/订阅系统。

**职责：**
- 统一管理组件内部事件
- 解耦模块间的直接依赖
- 支持事件监听、移除、发射

**主要事件：**
- `scroll:change` - 滚动变化
- `zoom:change` - 缩放变化
- `selection:change` - 选择变化
- `cell:click` - 格子点击
- `cell:hover` - 格子悬停
- `locate` - 定位事件
- `highlight` - 高亮事件
- `data:change` - 数据变化

---

### 6. core/LayoutCalculator.ts - 布局计算器

**功能：** 计算各区域的位置和尺寸。

**布局结构：**
```
┌─────────────────────────────────────────┐
│  工具栏区域 (toolbar)                    │
├──────────────┬──────────────────────────┤
│              │                          │
│   Y 轴       │      格子区域             │
│   (yAxis)    │    (cellArea, 896x?)     │
│              │                          │
│              │                          │
├──────────────┴──────────────────────────┤
│  X 轴 (xAxis)                            │
├─────────────────────────────────────────┤
│  横向滚动条 (horizontalScrollbar)        │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│  纵向滚动条 (verticalScrollbar)          │
└─────────────────────────────────────────┘
```

**关键方法：**
- `calculate(containerWidth, containerHeight)` - 计算各区域位置

---

### 7. core/VirtualScrollSync.ts - 虚拟滚动同步

**功能：** 双向同步滚动条和虚拟滚动。

**职责：**
- 计算当前可视格子范围
- 计算滚动条滑块位置和尺寸
- 从滑块位置反算滚动偏移
- 管理最大滚动偏移

**关键方法：**
- `getVisibleRange(scrollX, scrollY)` - 计算可见范围
- `getScrollbarState(scrollX, scrollY, trackWidth, trackHeight)` - 计算滚动条状态
- `getScrollFromThumb(thumbX, thumbY, trackWidth, trackHeight)` - 从滑块反算滚动

---

## 图层模块详解

### 8. layers/AxisLayer.ts - 坐标轴 + 滚动条图层

**功能：** 管理坐标轴和滚动条的渲染。

**职责：**
- 初始化坐标轴和滚动条绘制对象
- 监听滚动和缩放事件，更新显示
- 根据可视范围动态渲染刻度

**子组件：**
- `HorizontalAxisDraw` - X 轴绘制
- `VerticalAxisDraw` - Y 轴绘制
- `HorizontalScrollbarDraw` - 横向滚动条绘制
- `VerticalScrollbarDraw` - 纵向滚动条绘制

---

### 9. layers/CellLayer.ts - 格子网格图层

**功能：** 渲染矩阵格子。

**职责：**
- 渲染可见范围内的格子
- 处理格子点击和悬停事件
- 根据颜色规则映射格子颜色

**特点：**
- 使用对象池优化性能（复用 Rect 对象）
- 清理不可见格子，避免内存泄漏

---

### 10. layers/HighlightLayer.ts - 高亮图层

**功能：** 渲染选中/高亮格子的覆盖层。

**职责：**
- 监听选择和高亮事件
- 在选中格子上绘制高亮边框
- 监听滚动、缩放、数据变化，重绘高亮

---

## 绘制模块详解

### 11. draws/CellDraw.ts - 格子绘制

**功能：** 绘制单个格子。

**职责：**
- 创建和更新 Rect 对象
- 根据颜色规则映射格子颜色
- 处理格子事件（点击、悬停）

**优化：**
- 使用对象池复用 Rect 对象
- 只渲染可见格子

---

### 12. draws/HighlightDraw.ts - 高亮绘制

**功能：** 绘制高亮覆盖层。

**职责：**
- 在指定格子上绘制高亮边框
- 支持清除高亮

---

### 13. draws/AxisDraw.ts - 坐标轴绘制

**功能：** 绘制坐标轴刻度和标签。

**职责：**
- 绘制 X 轴和 Y 轴线
- 根据可视范围动态渲染刻度
- 显示刻度标签

**特点：**
- 刻度步长根据数据总量自动计算
- 确保滚动后始终有合理密度的刻度可见

---

### 14. draws/HorizontalAxisDraw.ts & VerticalAxisDraw.ts

**功能：** X 轴和 Y 轴的具体绘制实现。

**职责：**
- 继承自 BaseAxisDraw
- 实现各自的坐标轴线和刻度渲染逻辑

---

### 15. draws/HorizontalScrollbarDraw.ts & VerticalScrollbarDraw.ts

**功能：** 横向和纵向滚动条的具体绘制实现。

**职责：**
- 继承自 BaseScrollbarDraw
- 实现各自的滑块拖拽和点击滚动逻辑

---

## 工具类详解

### 16. tools/EventOptimizer.ts - 事件优化器

**功能：** 优化事件处理性能。

**职责：**
- 使用 requestAnimationFrame 调度滚轮事件
- 防抖处理尺寸调整事件
- 避免频繁触发重绘

**优化策略：**
- 滚轮事件累积后统一处理
- 尺寸调整防抖 150ms

---

### 17. tools/ScrollManager.ts - 滚动管理器

**功能：** 管理滚动位置和边界钳制。

**职责：**
- 设置 X/Y 轴滚动位置（带边界钳制）
- 增量滚动
- 滚动到顶部/底部/左侧/右侧

---

### 18. tools/SelectionManager.ts - 选择管理器

**功能：** 管理格子选择状态。

**职责：**
- 选择格子
- 清除选择
- 检查格子是否被选中
- 获取选中的格子

---

### 19. tools/ZoomManager.ts - 缩放管理器

**功能：** 管理缩放级别和边界。

**职责：**
- 以锚点为中心缩放
- 设置格子尺寸（带边界钳制）
- 重置缩放
- 管理最小/最大格子尺寸

---

### 20. tools/LocationManager.ts - 定位管理器

**功能：** 定位到指定格子，确保可见。

**职责：**
- 计算滚动位置，使目标格子完整显示在可视区域内
- 边界检查
- 钳制边界

---

## 主题模块详解

### 21. theme/presets.ts - 主题预设

**功能：** 提供浅色和深色主题配置。

**LIGHT_THEME：**
- 背景色：#ffffff
- 坐标轴色：#e0e0e0
- 滚动条轨道色：#f0f0f0
- 滚动条滑块色：#c0c0c0
- 高亮色：#2196f3
- 默认格子色：#f5f5f5

**DARK_THEME：**
- 背景色：#1e1e1e
- 坐标轴色：#3e3e3e
- 滚动条轨道色：#2e2e2e
- 滚动条滑块色：#4e4e4e
- 高亮色：#64b5f6
- 默认格子色：#2e2e2e

---

## React 组件详解

### 22. components/BitmapGrid.tsx - Bitmap Grid 组件

**功能：** React 封装的 Bitmap Grid 组件。

**Props：**
- `containerId` - 容器 ID
- `config` - 配置对象
- `data` - 矩阵数据
- `theme` - 主题
- `colorRules` - 颜色规则
- `className` / `style` - 样式

**Ref API：**
- `zoomIn()` / `zoomOut()` / `resetZoom()` - 缩放
- `scrollTo(scrollX, scrollY)` - 滚动
- `selectCell(col, row)` / `clearSelection()` - 选择
- `locateAndHighlight(col, row)` - 定位并高亮
- `getZoomLevel()` / `getScrollState()` / `getSelectedCell()` - 获取状态

---

### 23. components/BitmapTableLayout.tsx - 图形 + 表格布局

**功能：** 60/40 布局，左侧显示图形，右侧显示表格。

**布局结构：**
```
┌──────────────────────────────────────┐
│  工具栏（放大/缩小/还原）              │
├──────────┬───────────────────────────┤
│          │                           │
│  Bitmap  │                           │
│  Grid    │      VirtualTable         │
│          │                           │
└──────────┴───────────────────────────┘
```

**特点：**
- 图形和表格联动（点击表格行 → 图形定位；点击图形格子 → 表格高亮）
- 左侧固定宽度 956px（896px 格子区域 + 40px Y轴 + 12px 滚动条 + 8px 间距）

---

### 24. components/VirtualTable.tsx - 虚拟滚动表格

**功能：** 基于 VisActor VTable 的虚拟滚动表格。

**职责：**
- 展示 RRAM 测试数据
- 支持行点击回调
- 支持高亮行和滚动到指定行

**特点：**
- 自带行列虚拟滚动
- 使用 Arco Design 样式

---

### 25. components/FileUpload.tsx - 文件上传组件

**功能：** 支持 JSON 文件上传，支持覆盖和追加模式。

**Props：**
- `onDataLoad` - 数据加载回调
- `accept` - 支持的文件类型（默认 .json）
- `defaultMode` - 默认导入模式（默认 overwrite）

**功能：**
- 选择文件类型（覆盖/追加）
- 上传并解析 JSON 文件
- 验证数据格式
- 错误提示

---

### 26. components/BitmapTestPage.tsx - 测试页面

**功能：** RRAM 测试结果可视化测试页面。

**功能：**
- 文件上传
- 解析数据
- 显示数据统计（总行数、总列数、总单元数）
- 图形 + 表格联动展示

---

## 数据流

```
用户操作
    ↓
React 组件 (BitmapGrid / BitmapTableLayout)
    ↓
useBitmapGrid Hook
    ↓
BitmapGridEngine (主引擎)
    ↓
┌─────────────────────────────────┐
│  DataManager    │  EventBus     │
│  (数据管理)      │  (事件分发)    │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│  AxisLayer  CellLayer  HighlightLayer │
│  (图层渲染)                        │
└─────────────────────────────────┘
    ↓
Konva.js (图形渲染)
```

---

## 关键技术点

### 1. 对象池优化
- `CellDraw` 使用 Map 存储格子对象
- 复用 Rect 对象，避免频繁创建/销毁
- 清理不可见格子

### 2. 虚拟滚动
- `VirtualScrollSync` 计算可视范围
- 只渲染可见格子
- 滚动条与虚拟滚动双向同步

### 3. 事件总线
- 基于 mitt 库
- 解耦模块间依赖
- 统一事件管理

### 4. 布局计算
- 固定格子矩阵尺寸（896x896）
- 动态计算各区域位置
- 响应式布局

### 5. 颜色映射
- 支持多级颜色规则
- 根据格子值自动映射颜色
- 支持自定义颜色规则

---

## 使用示例

```typescript
import { BitmapGrid, BitmapTableLayout, LIGHT_THEME, type BitmapGridConfig } from './components/bitmap';

const config: BitmapGridConfig = {
  layout: {
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
};

<BitmapTableLayout
  config={config}
  data={matrixData}
  onCellClick={(col, row) => console.log('Clicked:', col, row)}
  onTableRowClick={(row, cell) => console.log('Row clicked:', row, cell)}
/>
```

---

## 总结

Bitmap 组件是一个功能完整的 RRAM 测试结果可视化工具，具有以下特点：

1. **分层架构**：核心引擎、图层渲染、工具类、React 组件分层清晰
2. **高性能**：对象池、虚拟滚动、事件优化等优化手段
3. **可扩展**：主题系统、颜色规则、事件总线便于扩展
4. **易用性**：React Hook 封装，提供完整的 Ref API
5. **完整性**：支持文件上传、数据解析、图形展示、表格联动
