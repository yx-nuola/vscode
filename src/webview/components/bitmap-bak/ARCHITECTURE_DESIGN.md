# Bitmap Grid Architecture Design

## 一、设计目标

基于 think.md 的设计理念，构建高性能、可维护、可扩展的位图网格可视化系统。

### 核心需求
- 支持 128×1024 矩阵可视化（131,072 个格子）
- 虚拟滚动支持大规模数据集（100k+ 格子）
- 自定义滚动条和坐标轴（全 Konva 实现）
- 颜色映射和格子选择
- 表格-图形联动
- 多种数据导入格式（STDF、TXT 等）
- **定位功能**：表格点击后跳转到对应格子，自动滚动到可视区
- **自定义颜色映射**：支持外部配置颜色规则，根据数据值显示不同颜色
- **左右布局**：左边 60% 宽度（图形），右边 40% 宽度（表格）

### 设计原则（来自 think.md）
1. **模块化与分层架构** - 将复杂功能拆分为独立组件
2. **高内聚低耦合** - 每个文件有明确职责
3. **性能优化** - 分层渲染、节流/防抖、状态最小化
4. **事件驱动** - 响应式交互机制
5. **代码复用** - 基础类提供通用功能

## 二、目录结构

```
src/webview/components/bitmap/
├── renderer/                      # 图形渲染核心（重点）
│   ├── draws/                     # 绘图逻辑（引入图形，处理对应的逻辑）
│   │   ├── CellDrawer.ts          # 格子绘制
│   │   ├── XAxisDrawer.ts         # X坐标轴绘制
│   │   ├── YAxisDrawer.ts         # Y坐标轴绘制
│   │   ├── VerticalScrollbarDrawer.ts  # 垂直滚动条绘制
│   │   ├── HorizontalScrollbarDrawer.ts # 水平滚动条绘制
│   │   ├── SelectionDrawer.ts     # 选择框绘制
│   │   ├── HighlightDrawer.ts     # 高亮绘制（定位时使用）
│   │   └── index.ts               # 导出所有绘图类
│   │
│   ├── graphs/                    # 所有的图形（图形实例管理）
│   │   ├── XAxisGraph.ts          # X轴图形（独立文件）
│   │   ├── HorizontalScrollbarGraph.ts  # 横向滚动条图形（独立文件）
│   │   ├── YAxisGraph.ts          # Y轴图形（独立文件）
│   │   ├── VerticalScrollbarGraph.ts    # 纵向滚动条图形（独立文件）
│   │   ├── CellGraph.ts           # 格子图形（独立文件）
│   │   ├── SelectionGraph.ts      # 选择框图形（独立文件）
│   │   ├── HighlightGraph.ts      # 高亮图形（独立文件）
│   │   └── index.ts               # 导出所有图形类
│   │
│   ├── tools/                     # 工具（垂直滚动条，水平滚动条，显示和交互，以及控制x轴，y轴可视范围）（放大缩小等工具）
│   │   ├── VerticalScrollManager.ts    # 垂直滚动管理器（包含事件处理）
│   │   ├── HorizontalScrollManager.ts  # 水平滚动管理器（包含事件处理）
│   │   ├── XAxisManager.ts             # X轴管理器（包含事件处理）
│   │   ├── YAxisManager.ts             # Y轴管理器（包含事件处理）
│   │   ├── ZoomManager.ts              # 缩放管理器（包含 Ctrl+滚动事件处理）
│   │   ├── SelectionManager.ts         # 选择管理器（包含事件处理）
│   │   ├── ColorMapper.ts              # 颜色映射器
│   │   ├── VirtualScrollManager.ts     # 虚拟滚动管理器
│   │   ├── LocationManager.ts          # 定位管理器
│   │   └── index.ts                    # 导出所有工具类
│   │
│   └── utils/                     # 工具函数
│       ├── workers/                # Web Workers（性能优化）
│       │   └── CellRenderWorker.ts # 格子渲染 Worker
│       ├── constants.ts            # 常量定义
│       ├── index.ts                # 创建 Stage，分 Layer，然后注册工具，事件处理
│       ├── theme.ts                # 不同主题下的配色
│       ├── coordinate.ts            # 坐标转换
│       ├── formatting.ts            # 数值格式化
│       ├── event.ts                # 事件封装
│       ├── performance.ts          # 性能优化工具
│       └── types.ts                # 类型定义
│
├── core/                          # 核心架构
│   ├── interfaces/                # 接口定义
│   │   ├── IGridRenderer.ts       # 网格渲染接口
│   │   ├── IAxisRenderer.ts       # 坐标轴渲染接口
│   │   ├── IZoomable.ts           # 缩放控制接口
│   │   ├── IColorConfigurable.ts  # 颜色配置接口
│   │   ├── IScrollable.ts         # 滚动控制接口
│   │   ├── ISelectable.ts         # 选择功能接口
│   │   └── ILocatable.ts          # 定位功能接口
│   ├── KonvaGridBase.ts           # 基础类（实现所有接口）
│   └── index.ts                   # 核心导出
│
├── components/                    # React 组件
│   ├── BitmapGrid.tsx             # React 包装器
│   ├── BitmapGridDemo.tsx         # 演示组件
│   └── BitmapTableLayout.tsx     # 左右布局组件（图形 + 表格）
│
├── types.ts                       # 类型定义（全局）
├── index.tsx                      # 主组件
├── exports.ts                     # 统一导出
├── ARCHITECTURE_DESIGN.md         # 架构设计文档
├── think.md                       # 设计原则
└── index.md                       # 需求文档
```

## 三、分层架构设计

### 3.1 Konva 分层结构（推荐方案四）

```
Stage (固定视口大小)
├── Layer 1: X轴 + 横向滚动条层（固定）
│   ├── X轴（WL 刻度 + 标签）画布最上面显示
│   └── 横向滚动条（滑轨 + 滑块）画布最下面显示
├── Layer 2: Y轴 + 纵向滚动条层（固定）
│   ├── Y轴（BL 刻度 + 标签）画布左侧显示
│   └── 纵向滚动条（滑轨 + 滑块）画布右侧显示
└── Layer 3: 格子层（可滚动）
    └── Group（随滚动位置移动）由坐标轴和滚动条包围，中间区域展示格子绘制的网格图形
        └── 可见区域的格子（虚拟滚动）
```

**设计优势**：
- ✅ 横向滚动时，只更新 X轴 + 横向滚动条层，Y轴 + 纵向滚动条层不更新
- ✅ 垂直滚动时，只更新 Y轴 + 纵向滚动条层，X轴 + 横向滚动条层不更新
- ✅ 定位时，根据需要只更新必要的层
- ✅ 职责清晰：X轴相关、Y轴相关、格子
- ✅ 性能优化：横向/垂直滚动时节点数量最少
- ✅ 代码清晰：易于理解和维护

**性能对比**（百万数据量场景）：
- 横向滚动：更新 12 + 1000 = 1012 个节点
- 垂直滚动：更新 12 + 1000 = 1012 个节点
- 定位（双轴）：更新 12 + 12 + 1000 = 1024 个节点

### 3.2 分层渲染优势（think.md 原则）

✅ **避免全屏重绘**
- 仅更新变化的层（如横向滚动时只更新 X轴 + 横向滚动条层）
- Y轴 + 纵向滚动条层保持固定

✅ **性能优化**
- 每层独立管理自己的 Konva 节点
- 减少不必要的重绘操作
- 横向/垂直滚动时节点数量最少（百万数据量场景）

✅ **职责分离**
- 每层负责特定的渲染内容
- X轴相关、Y轴相关、格子各自独立
- 便于维护和扩展

✅ **定位优化**
- 根据需要只更新必要的层
- 定位（单轴）时只更新 2 层
- 定位（双轴）时更新 3 层

## 四、模块职责划分

### 4.1 核心接口层（interfaces/）

#### IGridRenderer<T>
```typescript
interface IGridRenderer<T> {
    render(data: T[]): void;
    updateViewport(viewport: Viewport): void;
    clear(): void;
}
```
**职责**：定义网格渲染的基本接口

#### IAxisRenderer
```typescript
interface IAxisRenderer {
    renderXAxis(): void;
    renderYAxis(): void;
    updateAxisLabels(scrollX: number, scrollY: number): void;
}
```
**职责**：定义坐标轴渲染接口

#### IScrollable
```typescript
interface IScrollable {
    scrollTo(x: number, y: number): void;
    scrollBy(dx: number, dy: number): void;
    getScrollPosition(): { x: number; y: number };
}
```
**职责**：定义滚动控制接口

#### IZoomable
```typescript
interface IZoomable {
    zoomTo(scale: number): void;
    zoomBy(delta: number): void;
    getZoomLevel(): number;
}
```
**职责**：定义缩放控制接口

#### IColorConfigurable<T>
```typescript
interface IColorConfigurable<T> {
    setColorMapper(mapper: (value: T) => string): void;
    getColor(value: T): string;
}
```
**职责**：定义颜色配置接口

#### ISelectable<T>
```typescript
interface ISelectable<T> {
    selectCell(cell: T): void;
    deselectAll(): void;
    getSelectedCells(): T[];
}
```
**职责**：定义选择功能接口

#### ILocatable<T>
```typescript
interface ILocatable<T> {
    locateTo(cell: T): void;
    locateToPosition(x: number, y: number): void;
    highlightCell(cell: T, duration?: number): void;
    clearHighlight(): void;
}
```
**职责**：定义定位功能接口

### 4.2 分层渲染层（layers/）

#### XAxisScrollbarLayer
**职责**：管理 X 轴和横向滚动条的渲染和交互
- 绘制 X 轴（WL 刻度 + 标签）
- 绘制横向滚动条（滑轨 + 滑块）
- 处理横向滚动条拖拽事件
- 根据滚动位置更新 X 轴标签
- 格式化 X 轴坐标显示（formatX）
- 使用 Group 组织不同位置的内容（X 轴在顶部，横向滚动条在底部）

#### YAxisScrollbarLayer
**职责**：管理 Y 轴和纵向滚动条的渲染和交互
- 绘制 Y 轴（BL 刻度 + 标签）
- 绘制纵向滚动条（滑轨 + 滑块）
- 处理纵向滚动条拖拽事件
- 根据滚动位置更新 Y 轴标签
- 格式化 Y 轴坐标显示（formatY）
- 使用 Group 组织不同位置的内容（Y 轴在左侧，纵向滚动条在右侧）

#### CellLayer
**职责**：管理格子的渲染和虚拟滚动
- 使用 VirtualScrollManager 计算可见区域
- 使用 CellDrawer 绘制可见格子
- 使用对象池复用 Konva.Rect 对象
- 处理格子点击和悬停事件

### 4.3 绘图逻辑层（draws/）

#### CellDrawer
**职责**：负责格子绘制逻辑
- 创建和更新 Konva.Rect 对象
- 应用颜色映射
- 处理格子样式（边框、阴影等）
- 对象池管理（复用 Konva.Rect）

#### xAxisDrawer yAxisDrawer
**职责**：负责坐标轴绘制逻辑
- 绘制坐标轴线
- 绘制刻度线
- 绘制刻度标签
- 格式化坐标显示

#### verticalbarDraw horizontalbarDraw
**职责**：负责滚动条绘制逻辑
- 绘制滑轨
- 绘制滑块
- 绘制滚动条样式（颜色、圆角等）

#### SelectionDrawer
**职责**：负责选择框绘制逻辑
- 绘制选择框
- 绘制高亮格子
- 绘制选择指示器

#### HighlightDrawer
**职责**：负责高亮绘制逻辑（定位时使用）
- 绘制定位高亮框
- 绘制定位指示器
- 支持动画效果（淡入淡出）
- 自动清除高亮（可配置持续时间）

### 4.4 业务逻辑层（tools/）

#### ScrollManager
**职责**：管理滚动状态和逻辑
- 维护滚动位置（scrollX, scrollY）
- 计算滚动范围
- 处理滚动事件（wheel, drag）
- 边界控制（防止超出范围）
- 节流/防抖优化

#### ZoomManager
**职责**：管理缩放状态和逻辑
- 维护缩放级别（zoomLevel）
- 处理缩放事件（wheel, pinch）
- 计算缩放后的坐标
- 边界控制（防止无效缩放）

#### SelectionManager
**职责**：管理选择状态和逻辑
- 维护选中的格子列表
- 处理选择事件（click, drag-select）
- 支持多选和单选
- 触发选择回调

#### ColorMapper
**职责**：管理颜色映射逻辑
- 定义颜色映射规则
- 根据值返回颜色
- 支持自定义颜色映射
- 支持渐变色映射

#### VirtualScrollManager
**职责**：管理虚拟滚动逻辑
- 计算可见区域
- 计算需要渲染的格子范围
- Overscan 优化（预渲染边缘格子）
- 滚动位置同步

#### LocationManager
**职责**：管理定位逻辑
- 计算目标格子的位置
- 自动滚动到可视区
- 高亮目标格子
- 支持动画效果（平滑滚动）
- 边界控制（确保目标格子完全可见）

### 4.5 工具函数层（utils/）

#### coordinate.ts
**职责**：坐标转换工具
- 数据坐标 → 屏幕坐标
- 屏幕坐标 → 数据坐标
- 滚动位置计算
- 缩放坐标计算

#### formatting.ts
**职责**：数值格式化工具
- WL 坐标格式化
- BL 坐标格式化
- 数值精度控制
- 单位转换

#### event.ts
**职责**：事件封装工具
- 节流函数
- 防抖函数
- 事件合成
- 事件委托

#### performance.ts
**职责**：性能优化工具
- RAF 调度
- 对象池管理
- 性能监控
- 内存优化

### 4.6 渲染器实现层（renderers/）

#### SimpleBitmapGrid
**职责**：标准渲染器实现
- 继承 KonvaGridBase
- 实现所有接口
- 适用于一般场景

#### PerformanceBitmapGrid
**职责**：高性能渲染器实现
- 继承 KonvaGridBase
- 实现所有接口
- 包含性能优化（对象池、RAF 调度等）
- 适用于大规模数据集

### 4.7 React 组件层（components/）

#### BitmapGrid.tsx
**职责**：React 包装器
- 封装 Konva Stage
- 管理 React 状态
- 处理 React 事件
- 提供 React API

#### BitmapGridDemo.tsx
**职责**：演示组件
- 展示完整用法
- 包含示例数据
- 展示所有功能

#### BitmapTableLayout.tsx
**职责**：左右布局组件（图形 + 表格）
- 左侧 60% 宽度：图形区域（BitmapGrid）
- 右侧 40% 宽度：表格区域（数据表格）
- 处理表格-图形联动
- 同步滚动和选择状态
- 支持自定义颜色映射配置

## 五、数据流设计

### 5.1 初始化流程

```
1. React 组件挂载
   ↓
2. 创建 Konva Stage
   ↓
3. 创建 3 个 Layer（XAxisScrollbarLayer, YAxisScrollbarLayer, CellLayer）
   ↓
4. 在 XAxisScrollbarLayer 中创建 2 个 Group（X轴 Group、横向滚动条 Group）
   ↓
5. 在 YAxisScrollbarLayer 中创建 2 个 Group（Y轴 Group、纵向滚动条 Group）
   ↓
6. 初始化各个 Manager（ScrollManager, ZoomManager, SelectionManager, ColorMapper, VirtualScrollManager, LocationManager）
   ↓
7. 初始化各个 Drawer（CellDrawer, AxisDrawer, verticalbarDraw, horizontalbarDraw , SelectionDrawer, HighlightDrawer）
   ↓
8. 注册事件监听器
   ↓
9. 首次渲染
```

### 5.2 滚动流程

#### 横向滚动流程

```
1. 用户触发横向滚动事件（wheel 或拖拽横向滚动条）
   ↓
2. ScrollManager 处理横向滚动事件
   ↓
3. ScrollManager 更新横向滚动位置（scrollX）
   ↓
4. ScrollManager 触发横向滚动回调
   ↓
5. VirtualScrollManager 计算新的可见区域
   ↓
6. XAxisScrollbarLayer 更新 X 轴标签和横向滚动条滑块位置
   ↓
7. CellLayer 更新可见格子
   ↓
8. Konva 重绘（XAxisScrollbarLayer + CellLayer，YAxisScrollbarLayer 不更新）
```

#### 垂直滚动流程

```
1. 用户触发垂直滚动事件（wheel 或拖拽纵向滚动条）
   ↓
2. ScrollManager 处理垂直滚动事件
   ↓
3. ScrollManager 更新垂直滚动位置（scrollY）
   ↓
4. ScrollManager 触发垂直滚动回调
   ↓
5. VirtualScrollManager 计算新的可见区域
   ↓
6. YAxisScrollbarLayer 更新 Y 轴标签和纵向滚动条滑块位置
   ↓
7. CellLayer 更新可见格子
   ↓
8. Konva 重绘（YAxisScrollbarLayer + CellLayer，XAxisScrollbarLayer 不更新）
```

### 5.3 缩放流程

```
1. 用户触发缩放事件（wheel 或 pinch）
   ↓
2. ZoomManager 处理缩放事件
   ↓
3. ZoomManager 更新缩放级别（zoomLevel）
   ↓
4. ZoomManager 触发缩放回调
   ↓
5. CellLayer 更新格子大小
   ↓
6. XAxisScrollbarLayer 更新 X 轴刻度和横向滚动条滑块大小
   ↓
7. YAxisScrollbarLayer 更新 Y 轴刻度和纵向滚动条滑块大小
   ↓
8. Konva 重绘（XAxisScrollbarLayer + YAxisScrollbarLayer + CellLayer）
```

### 5.4 选择流程

```
1. 用户触发选择事件（click 或 drag-select）
   ↓
2. SelectionManager 处理选择事件
   ↓
3. SelectionManager 更新选中格子列表
   ↓
4. SelectionManager 触发选择回调
   ↓
5. SelectionDrawer 绘制选择框
   ↓
6. CellLayer 高亮选中的格子
   ↓
7. Konva 重绘（CellLayer，其他层不更新）
```

### 5.5 定位流程

```
1. 用户在表格中点击某个格子
   ↓
2. BitmapTableLayout 接收点击事件
   ↓
3. LocationManager 计算目标格子的位置
   ↓
4. LocationManager 判断目标格子是否在可视区
   ↓
5. 如果不在可视区：
   a. 计算需要滚动的距离
   b. 判断需要横向滚动、垂直滚动还是双轴滚动
   c. ScrollManager 执行滚动操作
   d. VirtualScrollManager 更新可见区域
   e. 根据需要更新 XAxisScrollbarLayer（横向滚动时）
   f. 根据需要更新 YAxisScrollbarLayer（垂直滚动时）
   g. CellLayer 更新可见格子
   ↓
6. HighlightDrawer 绘制高亮框
   ↓
7. Konva 重绘（根据需要更新必要的层）
   ↓
8. （可选）自动清除高亮（可配置持续时间）
```

## 六、性能优化策略

### 6.1 虚拟滚动

**原理**：只渲染可见区域的格子，不渲染所有数据

**实现**：
- VirtualScrollManager 计算可见区域
- CellLayer 只渲染可见格子
- Overscan 优化（预渲染边缘格子）

**收益**：
- 100k+ 格子只渲染 ~1000 个可见格子
- 大幅减少 DOM 节点数量
- 提升渲染性能

### 6.2 对象池

**原理**：复用 Konva.Rect 对象，避免频繁创建和销毁

**实现**：
- CellDrawer 维护对象池
- 滚动时复用对象池中的对象
- 只更新对象的属性（x, y, fill）

**收益**：
- 减少垃圾回收压力
- 提升滚动性能
- 降低内存占用

### 6.3 RAF 调度

**原理**：使用 requestAnimationFrame 调度渲染

**实现**：
- 使用 RAF 调度渲染函数
- 避免高频事件导致的性能问题
- 合并多次渲染请求

**收益**：
- 平滑的滚动和缩放
- 避免掉帧
- 提升用户体验

### 6.4 分层渲染

**原理**：只更新变化的层，不重绘整个 Stage

**实现**：
- 每层独立管理自己的 Konva 节点
- 横向滚动时只更新 XAxisScrollbarLayer + CellLayer
- 垂直滚动时只更新 YAxisScrollbarLayer + CellLayer
- XAxisScrollbarLayer 和 YAxisScrollbarLayer 互不影响

**收益**：
- 减少不必要的重绘
- 提升渲染性能
- 降低 CPU 占用
- 百万数据量场景下性能最优

### 6.5 节流/防抖

**原理**：限制高频事件的触发频率

**实现**：
- wheel 事件使用节流
- mousemove 事件使用防抖
- resize 事件使用防抖

**收益**：
- 减少事件处理次数
- 提升性能
- 避免卡顿

### 6.6 Konva 性能优化

**配置**：
```typescript
Konva.Rect({
    perfectDrawEnabled: false,  // 禁用完美绘制
    shadowEnabled: false,       // 禁用阴影
    listening: false,           // 禁用事件监听（格子不需要）
});
```

**收益**：
- 提升渲染性能
- 降低内存占用
- 减少事件处理开销

### 6.7 方案四设计优势

**方案四：三层架构（X轴+横向滚动条、Y轴+纵向滚动条、格子）**

#### 性能优势

| 场景 | 更新节点数 | 说明 |
|------|-----------|------|
| 横向滚动 | 12 + 1000 = 1012 | 只更新 XAxisScrollbarLayer + CellLayer |
| 垂直滚动 | 12 + 1000 = 1012 | 只更新 YAxisScrollbarLayer + CellLayer |
| 定位（单轴） | 12 + 1000 = 1012 | 只更新必要的层 |
| 定位（双轴） | 12 + 12 + 1000 = 1024 | 更新所有层 |

**对比其他方案**：
- 方案一（三层）：横向/垂直滚动更新 1022 个节点
- 方案二（两层）：横向/垂直滚动更新 1022 个节点
- 方案三（四层）：横向/垂直滚动更新 1012 个节点
- **方案四（三层）：横向/垂直滚动更新 1012 个节点** ✅

**百万数据量场景**：
- 每秒少更新 600 个节点（约 1%）
- CPU 占用略低
- 性能最优

#### 代码优势

**职责清晰**：
- XAxisScrollbarLayer：X 轴相关
- YAxisScrollbarLayer：Y 轴相关
- CellLayer：格子相关

**逻辑清晰**：
- 横向滚动只影响 X 轴
- 垂直滚动只影响 Y 轴
- 易于理解和维护

**Group 使用简单**：
```typescript
// XAxisScrollbarLayer
const xAxisGroup = new Konva.Group({ y: 0 });
const horizontalScrollbarGroup = new Konva.Group({ y: viewportHeight - scrollbarHeight });
xAxisScrollbarLayer.add(xAxisGroup);
xAxisScrollbarLayer.add(horizontalScrollbarGroup);

// YAxisScrollbarLayer
const yAxisGroup = new Konva.Group({ x: 0 });
const verticalScrollbarGroup = new Konva.Group({ x: viewportWidth - scrollbarWidth });
yAxisScrollbarLayer.add(yAxisGroup);
yAxisScrollbarLayer.add(verticalScrollbarGroup);
```

#### 实现示例

```typescript
class KonvaGridBase {
    private xAxisScrollbarLayer: Konva.Layer;
    private yAxisScrollbarLayer: Konva.Layer;
    private cellLayer: Konva.Layer;

    private xAxisGroup: Konva.Group;
    private horizontalScrollbarGroup: Konva.Group;
    private yAxisGroup: Konva.Group;
    private verticalScrollbarGroup: Konva.Group;

    constructor() {
        // 创建三个Layer
        this.xAxisScrollbarLayer = new Konva.Layer();
        this.yAxisScrollbarLayer = new Konva.Layer();
        this.cellLayer = new Konva.Layer();

        // 创建Group
        this.xAxisGroup = new Konva.Group({ y: 0 });
        this.horizontalScrollbarGroup = new Konva.Group({ y: viewportHeight - scrollbarHeight });
        this.yAxisGroup = new Konva.Group({ x: 0 });
        this.verticalScrollbarGroup = new Konva.Group({ x: viewportWidth - scrollbarWidth });

        // 添加到Layer
        this.xAxisScrollbarLayer.add(this.xAxisGroup);
        this.xAxisScrollbarLayer.add(this.horizontalScrollbarGroup);
        this.yAxisScrollbarLayer.add(this.yAxisGroup);
        this.yAxisScrollbarLayer.add(this.verticalScrollbarGroup);

        // 添加到Stage
        this.stage.add(this.xAxisScrollbarLayer);
        this.stage.add(this.yAxisScrollbarLayer);
        this.stage.add(this.cellLayer);
    }

    // 横向滚动
    handleHorizontalScroll(scrollX: number) {
        // 更新X轴
        this.updateXAxis(scrollX);
        // 更新横向滚动条
        this.updateHorizontalScrollbar(scrollX);
        // 重绘Layer（只重绘X轴和横向滚动条）
        this.xAxisScrollbarLayer.batchDraw();

        // 更新格子
        this.updateCells(scrollX, this.scrollY);
        this.cellLayer.batchDraw();
    }

    // 垂直滚动
    handleVerticalScroll(scrollY: number) {
        // 更新Y轴
        this.updateYAxis(scrollY);
        // 更新纵向滚动条
        this.updateVerticalScrollbar(scrollY);
        // 重绘Layer（只重绘Y轴和纵向滚动条）
        this.yAxisScrollbarLayer.batchDraw();

        // 更新格子
        this.updateCells(this.scrollX, scrollY);
        this.cellLayer.batchDraw();
    }

    // 定位
    locateTo(cell: CellData) {
        const targetPosition = this.calculateCellPosition(cell);
        const scrollOffset = this.calculateScrollOffset(targetPosition);

        const needHorizontalScroll = scrollOffset.x !== this.scrollX;
        const needVerticalScroll = scrollOffset.y !== this.scrollY;

        // 根据需要更新
        if (needHorizontalScroll) {
            this.updateXAxis(scrollOffset.x);
            this.updateHorizontalScrollbar(scrollOffset.x);
            this.xAxisScrollbarLayer.batchDraw();
        }

        if (needVerticalScroll) {
            this.updateYAxis(scrollOffset.y);
            this.updateVerticalScrollbar(scrollOffset.y);
            this.yAxisScrollbarLayer.batchDraw();
        }

        // 更新格子
        this.updateCells(scrollOffset.x, scrollOffset.y);
        this.cellLayer.batchDraw();
    }
}
```

## 七、事件处理设计

### 7.1 事件类型

| 事件类型 | 处理器 | 说明 |
|---------|--------|------|
| wheel | ScrollManager, ZoomManager | 滚动和缩放 |
| mousedown | SelectionManager | 开始选择 |
| mousemove | SelectionManager | 拖拽选择 |
| mouseup | SelectionManager | 结束选择 |
| click | SelectionManager | 单击选择 |
| drag | ScrollManager | 拖拽滚动 |
| resize | VirtualScrollManager | 窗口大小变化 |
| table-row-click | LocationManager | 表格行点击（定位） |
| color-config-change | ColorMapper | 颜色配置变更 |

### 7.2 事件流

```
用户交互
   ↓
Konva Stage 捕获事件
   ↓
事件分发到对应的 Layer
   ↓
Layer 转发到对应的 Manager
   ↓
Manager 处理业务逻辑
   ↓
Manager 更新状态
   ↓
Manager 触发回调
   ↓
Layer 更新渲染
   ↓
Konva 重绘
```

### 7.3 事件优化

- **事件委托**：在 Stage 层统一处理事件，避免在每个格子上注册事件
- **节流/防抖**：限制高频事件的触发频率
- **事件合成**：将多个事件合并为一个事件处理

## 八、状态管理设计

### 8.1 状态类型

```typescript
interface GridState {
    // 滚动状态
    scrollX: number;
    scrollY: number;
    maxScrollX: number;
    maxScrollY: number;

    // 缩放状态
    zoomLevel: number;
    minZoomLevel: number;
    maxZoomLevel: number;

    // 选择状态
    selectedCells: CellData[];
    selectionMode: 'single' | 'multiple';

    // 颜色状态
    colorMapper: (value: any) => string;
    colorRules: ColorRule[];  // 颜色规则列表

    // 定位状态
    highlightedCell: CellData | null;
    highlightDuration: number;  // 高亮持续时间（毫秒）

    // 视口状态
    viewportWidth: number;
    viewportHeight: number;
    contentWidth: number;
    contentHeight: number;
}

interface ColorRule {
    condition: (value: any) => boolean;  // 判断条件
    color: string;  // 颜色值
    label?: string;  // 规则标签（可选）
}
```

### 8.2 状态更新流程

```
1. Manager 更新内部状态
   ↓
2. Manager 触发状态变更回调
   ↓
3. React 组件更新 React 状态
   ↓
4. React 组件重新渲染
   ↓
5. Konva 更新渲染
```

### 8.3 状态同步

- **单向数据流**：状态从 Manager 流向 React 组件，再流向 Konva
- **状态最小化**：只存储必要的状态，避免冗余
- **状态缓存**：缓存计算结果（如视口范围、坐标映射）

## 九、扩展性设计

### 9.1 新增绘图类型

**步骤**：
1. 在 `draws/` 目录下创建新的 Drawer 类
2. 实现必要的接口（如 IDrawable）
3. 在对应的 Layer 中注册新的 Drawer
4. 在 KonvaGridBase 中添加新的 Layer

**示例**：新增标注绘制
```typescript
// draws/AnnotationDrawer.ts
class AnnotationDrawer {
    draw(annotations: Annotation[]): void {
        // 绘制标注
    }
}

// 在 AxisLayer 中使用
class AxisLayer {
    private annotationDrawer = new AnnotationDrawer();

    render() {
        this.annotationDrawer.draw(this.annotations);
    }
}
```

### 9.2 新增功能

**步骤**：
1. 在 `tools/` 目录下创建新的 Manager 类
2. 实现必要的接口
3. 在 KonvaGridBase 中注册新的 Manager
4. 在 React 组件中暴露新的 API

**示例**：新增框选功能
```typescript
// tools/BoxSelectionManager.ts
class BoxSelectionManager {
    selectBox(rect: Rect): void {
        // 框选逻辑
    }
}

// 在 KonvaGridBase 中使用
class KonvaGridBase {
    private boxSelectionManager = new BoxSelectionManager();

    handleMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
        this.boxSelectionManager.startSelection(e);
    }
}
```

### 9.3 替换渲染引擎

**步骤**：
1. 创建新的渲染引擎（如 WebGL）
2. 实现相同的接口（IGridRenderer, IAxisRenderer 等）
3. 在 KonvaGridBase 中替换渲染引擎

**示例**：使用 WebGL 替换 Canvas
```typescript
// renderers/WebGLBitmapGrid.ts
class WebGLBitmapGrid implements IGridRenderer<CellData> {
    render(data: CellData[]): void {
        // WebGL 渲染逻辑
    }
}

// 在 React 组件中使用
<BitmapGrid renderer={WebGLBitmapGrid} />
```

### 9.4 自定义颜色映射

**步骤**：
1. 定义颜色规则（ColorRule）
2. 创建自定义颜色映射函数
3. 通过 ColorMapper 应用颜色规则
4. 触发重新渲染

**示例**：根据数值范围设置颜色
```typescript
// 定义颜色规则
const colorRules: ColorRule[] = [
    { condition: (value) => value < 0, color: '#ff0000', label: '负数' },
    { condition: (value) => value >= 0 && value < 50, color: '#00ff00', label: '0-50' },
    { condition: (value) => value >= 50 && value < 100, color: '#0000ff', label: '50-100' },
    { condition: (value) => value >= 100, color: '#ffff00', label: '100+' },
];

// 创建颜色映射函数
const customColorMapper = (value: any) => {
    for (const rule of colorRules) {
        if (rule.condition(value)) {
            return rule.color;
        }
    }
    return '#ffffff';  // 默认白色
};

// 应用颜色映射
bitmapGrid.setColorMapper(customColorMapper);
bitmapGrid.render(data);
```

### 9.5 表格-图形联动

**步骤**：
1. 在 BitmapTableLayout 中同时渲染图形和表格
2. 监听表格的点击事件
3. 调用 LocationManager 定位到对应格子
4. 同步选择状态

**示例**：表格点击定位
```typescript
// BitmapTableLayout.tsx
const BitmapTableLayout: React.FC<BitmapTableLayoutProps> = ({ data }) => {
    const [selectedCell, setSelectedCell] = useState<CellData | null>(null);

    const handleTableRowClick = (cell: CellData) => {
        // 定位到对应格子
        bitmapGridRef.current?.locateTo(cell);
        // 高亮显示
        bitmapGridRef.current?.highlightCell(cell, 2000);
        // 更新选择状态
        setSelectedCell(cell);
    };

    return (
        <div className="bitmap-table-layout">
            <div className="bitmap-container" style={{ width: '60%' }}>
                <BitmapGrid ref={bitmapGridRef} data={data} />
            </div>
            <div className="table-container" style={{ width: '40%' }}>
                <DataTable data={data} onRowClick={handleTableRowClick} />
            </div>
        </div>
    );
};
```

## 十、测试策略

### 10.1 单元测试

**测试范围**：
- 工具函数（utils/）
- Manager 逻辑（tools/）
- Drawer 逻辑（draws/）

**测试工具**：
- Jest
- React Testing Library

### 10.2 集成测试

**测试范围**：
- Layer 渲染
- 事件处理
- 状态管理

**测试工具**：
- Jest
- React Testing Library
- Konva Testing Utils

### 10.3 性能测试

**测试范围**：
- 虚拟滚动性能
- 对象池性能
- 渲染性能

**测试工具**：
- Chrome DevTools
- Lighthouse
- Performance API

## 十一、总结

### 11.1 设计优势

✅ **模块化**：清晰的目录结构，每个文件有明确职责
✅ **高性能**：虚拟滚动、对象池、RAF 调度、分层渲染
✅ **可维护**：高内聚低耦合，易于理解和修改
✅ **可扩展**：易于添加新功能和替换组件
✅ **响应式**：事件驱动的响应机制
✅ **定位功能**：支持表格点击定位，自动滚动到可视区
✅ **自定义颜色**：支持外部配置颜色规则，灵活映射数据值
✅ **左右布局**：图形（60%）+ 表格（40%）布局，支持联动
✅ **方案四优化**：三层架构（X轴+横向滚动条、Y轴+纵向滚动条、格子），性能最优

### 11.2 适用场景

🎯 大规模波形分析
🎯 EDA 工具
🎯 金融行情图
🎯 科学可视化
🎯 高性能图形应用

### 11.3 下一步

1. 实现新的架构
2. 编写单元测试
3. 性能优化和调优
4. 文档完善

## 十二、新功能详细设计

### 12.1 定位功能设计

#### 12.1.1 功能描述

用户在表格中点击某个格子后，图形区域需要：
1. 自动滚动到目标格子所在位置
2. 确保目标格子完全可见（在可视区中心）
3. 高亮显示目标格子（可配置持续时间）
4. 支持平滑滚动动画

#### 12.1.2 实现方案

**LocationManager 核心逻辑**：

```typescript
class LocationManager {
    private scrollManager: ScrollManager;
    private highlightDrawer: HighlightDrawer;

    /**
     * 定位到指定格子
     * @param cell 目标格子
     * @param animate 是否使用动画
     */
    locateTo(cell: CellData, animate: boolean = true): void {
        // 1. 计算目标格子的位置
        const targetPosition = this.calculateCellPosition(cell);

        // 2. 计算需要滚动的距离
        const scrollOffset = this.calculateScrollOffset(targetPosition);

        // 3. 执行滚动
        if (animate) {
            this.scrollManager.scrollToAnimated(scrollOffset.x, scrollOffset.y);
        } else {
            this.scrollManager.scrollTo(scrollOffset.x, scrollOffset.y);
        }

        // 4. 高亮目标格子
        this.highlightDrawer.highlight(cell);
    }

    /**
     * 计算格子的位置
     */
    private calculateCellPosition(cell: CellData): { x: number; y: number } {
        const cellWidth = this.getCellWidth();
        const cellHeight = this.getCellHeight();
        return {
            x: cell.wl * cellWidth,
            y: cell.bl * cellHeight,
        };
    }

    /**
     * 计算滚动偏移量（确保目标格子完全可见）
     */
    private calculateScrollOffset(targetPosition: { x: number; y: number }): { x: number; y: number } {
        const viewportWidth = this.getViewportWidth();
        const viewportHeight = this.getViewportHeight();
        const cellWidth = this.getCellWidth();
        const cellHeight = this.getCellHeight();

        // 计算目标格子中心点
        const targetCenterX = targetPosition.x + cellWidth / 2;
        const targetCenterY = targetPosition.y + cellHeight / 2;

        // 计算滚动位置（使目标格子居中）
        const scrollX = targetCenterX - viewportWidth / 2;
        const scrollY = targetCenterY - viewportHeight / 2;

        // 边界控制
        const maxScrollX = this.getMaxScrollX();
        const maxScrollY = this.getMaxScrollY();

        return {
            x: Math.max(0, Math.min(scrollX, maxScrollX)),
            y: Math.max(0, Math.min(scrollY, maxScrollY)),
        };
    }
}
```

**HighlightDrawer 核心逻辑**：

```typescript
class HighlightDrawer {
    private layer: Konva.Layer;
    private highlightRect: Konva.Rect | null = null;
    private timeoutId: NodeJS.Timeout | null = null;

    /**
     * 高亮指定格子
     * @param cell 目标格子
     * @param duration 持续时间（毫秒），0 表示不自动清除
     */
    highlight(cell: CellData, duration: number = 2000): void {
        // 清除之前的高亮
        this.clear();

        // 创建高亮矩形
        const position = this.calculateCellPosition(cell);
        this.highlightRect = new Konva.Rect({
            x: position.x,
            y: position.y,
            width: this.getCellWidth(),
            height: this.getCellHeight(),
            stroke: '#ff0000',
            strokeWidth: 3,
            opacity: 1,
        });

        this.layer.add(this.highlightRect);
        this.layer.batchDraw();

        // 自动清除高亮
        if (duration > 0) {
            this.timeoutId = setTimeout(() => {
                this.clear();
            }, duration);
        }
    }

    /**
     * 清除高亮
     */
    clear(): void {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }

        if (this.highlightRect) {
            this.highlightRect.destroy();
            this.highlightRect = null;
            this.layer.batchDraw();
        }
    }
}
```

#### 12.1.3 使用示例

```typescript
// 在表格点击事件中调用
const handleTableRowClick = (cell: CellData) => {
    // 定位到对应格子
    bitmapGrid.locateTo(cell, true);
    // 高亮显示 2 秒
    bitmapGrid.highlightCell(cell, 2000);
};
```

### 12.2 自定义颜色映射设计

#### 12.2.1 功能描述

用户需要：
1. 通过外部输入框配置颜色规则
2. 根据数据值自动应用对应的颜色
3. 支持多种条件判断（数值范围、字符串匹配等）
4. 实时更新颜色映射

#### 12.2.2 实现方案

**ColorRule 类型定义**：

```typescript
interface ColorRule {
    id: string;  // 规则唯一标识
    condition: (value: any) => boolean;  // 判断条件
    color: string;  // 颜色值（十六进制、RGB 等）
    label?: string;  // 规则标签（用于显示）
    enabled: boolean;  // 是否启用
}
```

**ColorMapper 核心逻辑**：

```typescript
class ColorMapper {
    private colorRules: ColorRule[] = [];
    private defaultColor: string = '#ffffff';

    /**
     * 设置颜色规则
     */
    setColorRules(rules: ColorRule[]): void {
        this.colorRules = rules;
    }

    /**
     * 添加颜色规则
     */
    addColorRule(rule: ColorRule): void {
        this.colorRules.push(rule);
    }

    /**
     * 删除颜色规则
     */
    removeColorRule(ruleId: string): void {
        this.colorRules = this.colorRules.filter(rule => rule.id !== ruleId);
    }

    /**
     * 更新颜色规则
     */
    updateColorRule(ruleId: string, updates: Partial<ColorRule>): void {
        const index = this.colorRules.findIndex(rule => rule.id === ruleId);
        if (index !== -1) {
            this.colorRules[index] = { ...this.colorRules[index], ...updates };
        }
    }

    /**
     * 根据值获取颜色
     */
    getColor(value: any): string {
        // 按顺序遍历规则，返回第一个匹配的颜色
        for (const rule of this.colorRules) {
            if (rule.enabled && rule.condition(value)) {
                return rule.color;
            }
        }
        return this.defaultColor;
    }

    /**
     * 创建颜色映射函数
     */
    createColorMapper(): (value: any) => string {
        return (value: any) => this.getColor(value);
    }
}
```

**颜色规则配置组件**：

```typescript
const ColorRuleConfig: React.FC<ColorRuleConfigProps> = ({ onRulesChange }) => {
    const [rules, setRules] = useState<ColorRule[]>([
        {
            id: '1',
            condition: (value) => value < 0,
            color: '#ff0000',
            label: '负数',
            enabled: true,
        },
        {
            id: '2',
            condition: (value) => value >= 0 && value < 50,
            color: '#00ff00',
            label: '0-50',
            enabled: true,
        },
        {
            id: '3',
            condition: (value) => value >= 50 && value < 100,
            color: '#0000ff',
            label: '50-100',
            enabled: true,
        },
        {
            id: '4',
            condition: (value) => value >= 100,
            color: '#ffff00',
            label: '100+',
            enabled: true,
        },
    ]);

    const handleRuleChange = (ruleId: string, updates: Partial<ColorRule>) => {
        const newRules = rules.map(rule =>
            rule.id === ruleId ? { ...rule, ...updates } : rule
        );
        setRules(newRules);
        onRulesChange(newRules);
    };

    return (
        <div className="color-rule-config">
            {rules.map(rule => (
                <div key={rule.id} className="color-rule-item">
                    <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={(e) => handleRuleChange(rule.id, { enabled: e.target.checked })}
                    />
                    <span>{rule.label}</span>
                    <input
                        type="color"
                        value={rule.color}
                        onChange={(e) => handleRuleChange(rule.id, { color: e.target.value })}
                    />
                </div>
            ))}
        </div>
    );
};
```

#### 12.2.3 使用示例

```typescript
// 在主组件中使用
const BitmapTableLayout: React.FC = () => {
    const [colorRules, setColorRules] = useState<ColorRule[]>([]);

    const handleColorRulesChange = (rules: ColorRule[]) => {
        setColorRules(rules);
        // 更新颜色映射
        const colorMapper = new ColorMapper();
        colorMapper.setColorRules(rules);
        bitmapGrid.setColorMapper(colorMapper.createColorMapper());
        // 重新渲染
        bitmapGrid.render(data);
    };

    return (
        <div className="bitmap-table-layout">
            <div className="bitmap-container" style={{ width: '60%' }}>
                <BitmapGrid ref={bitmapGridRef} data={data} />
            </div>
            <div className="table-container" style={{ width: '40%' }}>
                <ColorRuleConfig onRulesChange={handleColorRulesChange} />
                <DataTable data={data} />
            </div>
        </div>
    );
};
```

### 12.3 左右布局设计

#### 12.3.1 功能描述

布局要求：
1. 左侧 60% 宽度：图形区域（BitmapGrid）
2. 右侧 40% 宽度：表格区域（数据表格）
3. 支持表格-图形联动
4. 同步滚动和选择状态
5. 响应式布局（可选）

#### 12.3.2 实现方案

**BitmapTableLayout 组件**：

```typescript
interface BitmapTableLayoutProps {
    data: CellData[];
    colorRules?: ColorRule[];
    onCellSelect?: (cell: CellData) => void;
}

const BitmapTableLayout: React.FC<BitmapTableLayoutProps> = ({
    data,
    colorRules,
    onCellSelect,
}) => {
    const bitmapGridRef = useRef<BitmapGridRef>(null);
    const [selectedCell, setSelectedCell] = useState<CellData | null>(null);

    // 处理表格行点击
    const handleTableRowClick = (cell: CellData) => {
        // 定位到对应格子
        bitmapGridRef.current?.locateTo(cell, true);
        // 高亮显示
        bitmapGridRef.current?.highlightCell(cell, 2000);
        // 更新选择状态
        setSelectedCell(cell);
        // 触发回调
        onCellSelect?.(cell);
    };

    // 处理图形格子点击
    const handleGridCellClick = (cell: CellData) => {
        // 更新选择状态
        setSelectedCell(cell);
        // 触发回调
        onCellSelect?.(cell);
    };

    // 处理颜色规则变更
    const handleColorRulesChange = (rules: ColorRule[]) => {
        const colorMapper = new ColorMapper();
        colorMapper.setColorRules(rules);
        bitmapGridRef.current?.setColorMapper(colorMapper.createColorMapper());
        bitmapGridRef.current?.render(data);
    };

    return (
        <div className="bitmap-table-layout">
            <div className="bitmap-container" style={{ width: '60%', height: '100%' }}>
                <BitmapGrid
                    ref={bitmapGridRef}
                    data={data}
                    onCellClick={handleGridCellClick}
                    selectedCell={selectedCell}
                />
            </div>
            <div className="table-container" style={{ width: '40%', height: '100%' }}>
                {colorRules && (
                    <ColorRuleConfig
                        rules={colorRules}
                        onRulesChange={handleColorRulesChange}
                    />
                )}
                <DataTable
                    data={data}
                    selectedCell={selectedCell}
                    onRowClick={handleTableRowClick}
                />
            </div>
        </div>
    );
};
```

**样式定义**：

```css
.bitmap-table-layout {
    display: flex;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.bitmap-container {
    border-right: 1px solid #ccc;
    overflow: hidden;
}

.table-container {
    overflow: auto;
    display: flex;
    flex-direction: column;
}

.color-rule-config {
    padding: 10px;
    border-bottom: 1px solid #ccc;
}

.color-rule-item {
    display: flex;
    align-items: center;
    margin-bottom: 5px;
}

.color-rule-item span {
    margin-left: 10px;
    margin-right: 10px;
}
```

#### 12.3.3 使用示例

```typescript
// 在主组件中使用
const App: React.FC = () => {
    const [data, setData] = useState<CellData[]>([]);
    const [colorRules, setColorRules] = useState<ColorRule[]>([]);

    useEffect(() => {
        // 加载数据
        loadData().then(setData);
    }, []);

    const handleCellSelect = (cell: CellData) => {
        console.log('Selected cell:', cell);
    };

    return (
        <div className="app">
            <BitmapTableLayout
                data={data}
                colorRules={colorRules}
                onCellSelect={handleCellSelect}
            />
        </div>
    );
};
```

### 12.4 新功能集成流程

```
1. 用户在表格中点击某个格子
   ↓
2. BitmapTableLayout 接收点击事件
   ↓
3. LocationManager 计算目标位置
   ↓
4. ScrollManager 执行滚动（横向、垂直或双轴）
   ↓
5. 根据需要更新 XAxisScrollbarLayer（横向滚动时）
   ↓
6. 根据需要更新 YAxisScrollbarLayer（垂直滚动时）
   ↓
7. HighlightDrawer 绘制高亮
   ↓
8. Konva 重绘（根据需要更新必要的层）
   ↓
9. 用户修改颜色规则
   ↓
10. ColorMapper 更新颜色映射
   ↓
11. CellLayer 重新渲染格子
   ↓
12. Konva 重绘（CellLayer，其他层不更新）
```

## 十三、方案对比总结

### 13.1 方案对比表

| 维度 | 方案一 | 方案二 | 方案三 | 方案四（推荐） |
|------|--------|--------|--------|---------------|
| **层数** | 3 | 2 | 4 | 3 |
| **横向滚动更新** | 3 层 | 2 层 | 3 层 | 2 层 |
| **垂直滚动更新** | 3 层 | 2 层 | 3 层 | 2 层 |
| **定位（单轴）更新** | 3 层 | 2 层 | 3 层 | 2 层 |
| **定位（双轴）更新** | 3 层 | 2 层 | 3 层 | 3 层 |
| **横向滚动节点数** | 1022 | 1022 | 1012 | 1012 |
| **垂直滚动节点数** | 1022 | 1022 | 1012 | 1012 |
| **定位（双轴）节点数** | 1022 | 1022 | 1022 | 1024 |
| **代码复杂度** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **代码可读性** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **职责清晰度** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **性能** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **百万数据量** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

### 13.2 方案详细说明

#### 方案一：三层架构（滚动条层、坐标轴层、格子层）

**结构**：
```
Layer 1: 滚动条层（固定在底部）
Layer 2: 坐标轴层（固定在中间）
Layer 3: 格子层（可滚动）
```

**优势**：
- ✅ 层数适中，复杂度低
- ✅ 职责相对清晰

**劣势**：
- ❌ 横向滚动时，Y 轴也被重绘（虽然不需要）
- ❌ 垂直滚动时，X 轴也被重绘（虽然不需要）
- ❌ 性能不是最优

#### 方案二：两层架构（滚动条+坐标轴层、格子层）

**结构**：
```
Layer 1: 滚动条 + 坐标轴层（固定）
Layer 2: 格子层（可滚动）
```

**优势**：
- ✅ 层数最少，复杂度最低
- ✅ 横向/垂直滚动只更新 2 层

**劣势**：
- ❌ 横向滚动时，Y 轴和纵向滚动条也被重绘（虽然不需要）
- ❌ 垂直滚动时，X 轴和横向滚动条也被重绘（虽然不需要）
- ❌ 职责不清晰，滚动条和坐标轴混在一起
- ❌ 代码可读性差

#### 方案三：四层架构（滚动条层、X轴层、Y轴层、格子层）

**结构**：
```
Layer 1: 滚动条层（固定在底部）
Layer 2: X 轴层（固定在顶部）
Layer 3: Y 轴层（固定在左侧）
Layer 4: 格子层（可滚动）
```

**优势**：
- ✅ 横向滚动时不更新 Y 轴
- ✅ 垂直滚动时不更新 X 轴
- ✅ 职责最清晰
- ✅ 性能好

**劣势**：
- ❌ 层数最多，复杂度最高
- ❌ 内存占用略增（但可忽略）

#### 方案四：三层架构（X轴+横向滚动条层、Y轴+纵向滚动条层、格子层）⭐ 推荐

**结构**：
```
Layer 1: X轴 + 横向滚动条层（固定）
Layer 2: Y轴 + 纵向滚动条层（固定）
Layer 3: 格子层（可滚动）
```

**优势**：
- ✅ 层数适中，复杂度低
- ✅ 横向滚动时只更新 XAxisScrollbarLayer
- ✅ 垂直滚动时只更新 YAxisScrollbarLayer
- ✅ 职责清晰：X 轴相关、Y 轴相关、格子
- ✅ 逻辑清晰：横向滚动只影响 X 轴，垂直滚动只影响 Y 轴
- ✅ 性能最优：横向/垂直滚动时节点数量最少
- ✅ 代码可读性好
- ✅ Group 使用简单，没有技术难度
- ✅ 定位优化：根据需要只更新必要的层
- ✅ 百万数据量场景性能最优

**劣势**：
- ❌ 定位（双轴）时需要更新 3 层（但这是必要的）

### 13.3 推荐结论

**强烈推荐方案四**，原因：

1. **性能最优**：横向/垂直滚动时节点数量最少，百万数据量场景性能最优
2. **复杂度最低**：只有 3 层，代码清晰
3. **逻辑清晰**：横向滚动只影响 X 轴，垂直滚动只影响 Y 轴
4. **职责清晰**：X 轴相关、Y 轴相关、格子各自独立
5. **易于维护**：代码可读性好，易于理解和修改
6. **定位优化**：根据需要只更新必要的层
7. **Group 使用简单**：没有技术难度
8. **符合 think.md 原则**：高内聚低耦合

### 13.4 实现建议

1. **使用方案四**作为最终方案
2. **使用 Group** 来组织不同位置的内容（X 轴在顶部，横向滚动条在底部）
3. **进行性能测试**，验证实际性能
4. **编写单元测试**，确保功能正确性
5. **完善文档**，便于后续维护
