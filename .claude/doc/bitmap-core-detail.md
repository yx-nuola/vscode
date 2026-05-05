# Core 模块详细说明

## 概述

`core` 模块是 Bitmap 组件的核心引擎层，负责数据管理、事件通信、布局计算、虚拟滚动等核心功能。

---

## 文件列表

| 文件 | 功能 | 状态 |
|------|------|------|
| `BitmapGridEngine.ts` | **主引擎**，编排所有模块，管理 Konva Stage、图层、事件总线 | ✅ 完成 |
| `DataManager.ts` | 数据管理器，存储 MatrixData，提供数据访问方法 | ✅ 完成 |
| `DataParser.ts` | 数据解析器，将 RRAM 测试数据 JSON 转换为 MatrixData | ✅ 完成 |
| `EventBus.ts` | 事件总线，基于 mitt，用于模块间通信 | ✅ 完成 |
| `LayoutCalculator.ts` | 布局计算器，计算各区域位置 | ✅ 完成 |
| `VirtualScrollSync.ts` | 虚拟滚动同步，计算可见范围、滚动条状态 | ✅ 完成 |

---

## 1. BitmapGridEngine.ts - 主引擎

### 类结构

```typescript
export class BitmapGridEngine {
  // Konva 相关
  private stage: StageType | null;              // Konva Stage
  private layers: Map<string, LayerType>;        // 图层映射

  // 核心模块
  private eventBus: EventBus;                    // 事件总线
  private layoutCalculator: LayoutCalculator;    // 布局计算器
  private dataManager: DataManager;              // 数据管理器
  private virtualScrollSync: VirtualScrollSync;  // 虚拟滚动同步

  // 配置和状态
  private config: BitmapGridConfig;              // 配置
  private container: HTMLElement | null;         // 容器 DOM
  private scrollState: ScrollState;               // 滚动状态
  private cellSize: number;                       // 格子尺寸
  private selectedCell: CellData | null;          // 选中的格子

  // 图层实例
  private toolbarLayer: ToolbarLayer;
  private xAxisLayer: XAxisLayer;
  private yAxisLayer: YAxisLayer;
  private cellLayer: CellLayer;
  private xAxisScrollbarLayer: XAxisScrollbarLayer;
  private yAxisScrollbarLayer: YAxisScrollbarLayer;
  private highlightLayer: HighlightLayer;
}
```

### 主要方法

| 方法 | 说明 |
|------|------|
| `initialize(container)` | 初始化引擎，创建 Stage 和图层 |
| `setData(data)` | 设置数据，触发数据更新事件 |
| `setTheme(theme)` | 设置主题 |
| `setColorRules(rules)` | 设置颜色规则 |
| `zoomIn()` / `zoomOut()` / `resetZoom()` | 缩放控制 |
| `scrollTo(scrollX, scrollY)` | 滚动到指定位置 |
| `selectCell(col, row)` | 选择格子 |
| `clearSelection()` | 清除选择 |
| `locateAndHighlight(col, row)` | 定位并高亮格子 |
| `resize(width, height)` | 调整尺寸 |
| `destroy()` | 销毁引擎 |

### 初始化流程

```typescript
initialize(container: HTMLElement): void {
  this.container = container;

  // 1. 获取容器尺寸
  const { width, height } = container.getBoundingClientRect();

  // 2. 创建 Konva Stage
  this.stage = new Stage({
    container: container.id,
    width,
    height,
  });

  // 3. 更新虚拟滚动视口
  this.virtualScrollSync.updateViewport(width, height);

  // 4. 设置图层（按顺序添加，后面的覆盖前面的）
  this.setupLayers();

  // 5. 设置事件监听
  this.setupEventListeners();

  // 6. 设置鼠标滚轮事件
  this.setupWheelEvents();
}
```

### 图层设置

```typescript
private setupLayers(): void {
  // 添加所有图层到 stage（注意顺序：后面的图层会覆盖前面的）
  this.addLayer('toolbar', this.toolbarLayer.getLayer());
  this.addLayer('cell', this.cellLayer.getLayer());
  this.addLayer('xAxis', this.xAxisLayer.getLayer());
  this.addLayer('yAxis', this.yAxisLayer.getLayer());
  this.addLayer('xAxisScrollbar', this.xAxisScrollbarLayer.getLayer());
  this.addLayer('yAxisScrollbar', this.yAxisScrollbarLayer.getLayer());
  this.addLayer('highlight', this.highlightLayer.getLayer());

  // 初始化图层
  this.toolbarLayer.initialize();
  this.cellLayer.initialize();
  this.xAxisLayer.initialize();
  this.yAxisLayer.initialize();
  this.xAxisScrollbarLayer.initialize();
  this.yAxisScrollbarLayer.initialize();
  this.highlightLayer.initialize();
}
```

### 事件监听

```typescript
private setupEventListeners(): void {
  // 滚动变化
  this.eventBus.on('scroll:change', (state) => {
    this.scrollState = state;
    this.config.callbacks?.onScrollChange?.(state);
  });

  // 缩放变化
  this.eventBus.on('zoom:change', (size) => {
    this.cellSize = size;
    this.config.callbacks?.onZoomChange?.(size);
  });

  // 选择变化
  this.eventBus.on('selection:change', (cell) => {
    this.selectedCell = cell;
    this.config.callbacks?.onSelectionChange?.(cell);
  });

  // 格子点击
  this.eventBus.on('cell:click', (cell) => {
    this.config.callbacks?.onCellClick?.(cell);
  });

  // 格子悬停
  this.eventBus.on('cell:hover', (cell) => {
    this.config.callbacks?.onCellHover?.(cell);
  });
}
```

### 数据设置

```typescript
setData(data: MatrixData): void {
  // 1. 设置数据到 DataManager
  this.dataManager.setData(data);

  // 2. 更新虚拟滚动数据尺寸
  this.virtualScrollSync.updateDataSize(data.rows, data.cols);

  // 3. 触发数据更新事件，通知图层重新渲染
  this.eventBus.emit('data:change', data);

  // 4. 如果是64x64数据，自动计算合适的cellSize以全屏展示
  if (data.rows === 64 && data.cols === 64 && this.stage) {
    this.autoFitCellSize();
  }
}
```

### 自动适配格子尺寸

```typescript
private autoFitCellSize(): void {
  if (!this.stage) return;

  const layout = this.layoutCalculator.calculate(this.stage.width(), this.stage.height());
  const cellAreaWidth = layout.cellArea.width;
  const cellAreaHeight = layout.cellArea.height;

  // 计算合适的cellSize（取宽高的较小值）
  const cellSizeX = Math.floor(cellAreaWidth / 64);
  const cellSizeY = Math.floor(cellAreaHeight / 64);
  const newCellSize = Math.min(cellSizeX, cellSizeY);

  // 确保cellSize在合理范围内
  const minSize = this.config.minCellSize || 2;
  const maxSize = this.config.maxCellSize || 50;
  const finalCellSize = Math.max(minSize, Math.min(newCellSize, maxSize));

  this.setCellSize(finalCellSize);
}
```

### 滚动控制

```typescript
scrollTo(scrollX: number, scrollY: number): void {
  const maxScrollX = this.virtualScrollSync.maxScrollX;
  const maxScrollY = this.virtualScrollSync.maxScrollY;

  // 边界钳制
  this.scrollState = {
    scrollX: Math.max(0, Math.min(scrollX, maxScrollX)),
    scrollY: Math.max(0, Math.min(scrollY, maxScrollY)),
  };

  // 触发滚动变化事件
  this.eventBus.emit('scroll:change', this.scrollState);
}
```

### Getter 方法

```typescript
getEventBus(): EventBus {
  return this.eventBus;
}

getLayoutCalculator(): LayoutCalculator {
  return this.layoutCalculator;
}

getDataManager(): DataManager {
  return this.dataManager;
}

getVirtualScrollSync(): VirtualScrollSync {
  return this.virtualScrollSync;
}

getConfig(): BitmapGridConfig {
  return { ...this.config };
}

getStage(): StageType | null {
  return this.stage;
}
```

---

## 2. DataManager.ts - 数据管理器

### 类结构

```typescript
export class DataManager {
  private cellMap: Map<string, CellData>;  // 格子数据映射：key="row,col" → CellData
  private totalRows: number;               // 总行数
  private totalCols: number;               // 总列数
}
```

### 主要方法

| 方法 | 说明 |
|------|------|
| `setData(data)` | 设置数据，清空旧数据 |
| `getCell(row, col)` | 获取单个格子数据 |
| `getDataByArea(startRow, endRow, startCol, endCol)` | 按区域获取数据 |
| `rows` | 获取总行数 |
| `cols` | 获取总列数 |
| `clear()` | 清除数据 |
| `getAllCells()` | 获取所有格子数据 |

### 设置数据

```typescript
setData(data: MatrixData): void {
  // 1. 清空旧数据
  this.cellMap.clear();

  // 2. 更新行列数
  this.totalRows = data.rows;
  this.totalCols = data.cols;

  // 3. 构建格子映射
  for (const cell of data.cells) {
    const key = `${cell.row},${cell.col}`;
    this.cellMap.set(key, cell);
  }
}
```

### 获取单个格子

```typescript
getCell(row: number, col: number): CellData | undefined {
  const key = `${row},${col}`;
  return this.cellMap.get(key);
}
```

### 按区域获取数据

```typescript
getDataByArea(startRow: number, endRow: number, startCol: number, endCol: number): CellData[] {
  const result: CellData[] = [];

  // 遍历区域内的所有格子
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const cell = this.getCell(row, col);
      if (cell) {
        result.push(cell);
      }
    }
  }

  return result;
}
```

### 设计特点

- **Map 存储**：使用 `Map<string, CellData>` 存储格子数据，key 为 `"row,col"` 格式
- **快速查找**：O(1) 时间复杂度获取单个格子
- **区域查询**：支持按区域批量获取数据，用于虚拟滚动

---

## 3. DataParser.ts - 数据解析器

### 类结构

```typescript
export class DataParser {
  // 静态方法，无需实例化
}
```

### 主要方法

| 方法 | 说明 |
|------|------|
| `parseRRAMData(data)` | 解析 RRAM 测试数据 |
| `mergeData(existingData, newData)` | 合并数据（追加模式） |
| `parseJSON(jsonString)` | 解析 JSON 字符串 |
| `validateData(data)` | 验证数据格式 |

### RRAM 测试数据格式

```typescript
export interface RRAMTestData {
  rows: number;
  cols: number;
  metadata: {
    total: number;
    date: string;
    mode: string;
  };
  cells: Array<{
    bl: number;      // 位线（行）
    wl: number;      // 字线（列）
    vset: string;    // 设置电压
    vreset: string;  // 复位电压
    imeas: string;   // 测量电流
    status: string;  // 状态（pass/fail）
  }>;
}
```

### 解析 RRAM 数据

```typescript
static parseRRAMData(data: RRAMTestData): MatrixData {
  // 1. 转换 cells 数组
  const cells: CellData[] = data.cells.map((cell) => ({
    row: cell.bl,      // bl → row
    col: cell.wl,      // wl → col
    value: parseFloat(cell.imeas),  // 使用 imeas 作为颜色映射值
    metadata: {
      vset: cell.vset,
      vreset: cell.vreset,
      imeas: cell.imeas,
      status: cell.status,
    },
  }));

  // 2. 返回 MatrixData
  return {
    rows: data.rows,
    cols: data.cols,
    cells,
  };
}
```

### 合并数据（追加模式）

```typescript
static mergeData(existingData: MatrixData, newData: MatrixData): MatrixData {
  const cellMap = new Map<string, CellData>();

  // 1. 添加现有数据
  for (const cell of existingData.cells) {
    const key = `${cell.row},${cell.col}`;
    cellMap.set(key, cell);
  }

  // 2. 添加新数据（覆盖重复的）
  for (const cell of newData.cells) {
    const key = `${cell.row},${cell.col}`;
    cellMap.set(key, cell);
  }

  // 3. 计算新的行列数
  const maxRow = Math.max(
    existingData.rows,
    ...newData.cells.map((c) => c.row)
  );
  const maxCol = Math.max(
    existingData.cols,
    ...newData.cells.map((c) => c.col)
  );

  return {
    rows: maxRow + 1,
    cols: maxCol + 1,
    cells: Array.from(cellMap.values()),
  };
}
```

### 验证数据格式

```typescript
static validateData(data: unknown): data is RRAMTestData {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const rramData = data as RRAMTestData;

  return (
    typeof rramData.rows === 'number' &&
    typeof rramData.cols === 'number' &&
    typeof rramData.metadata === 'object' &&
    Array.isArray(rramData.cells) &&
    rramData.cells.every(
      (cell) =>
        typeof cell.bl === 'number' &&
        typeof cell.wl === 'number' &&
        typeof cell.vset === 'string' &&
        typeof cell.vreset === 'string' &&
        typeof cell.imeas === 'string' &&
        typeof cell.status === 'string'
    )
  );
}
```

---

## 4. EventBus.ts - 事件总线

### 类结构

```typescript
export class EventBus {
  private emitter: Emitter<BitmapEvents>;  // mitt 事件发射器
}
```

### 主要方法

| 方法 | 说明 |
|------|------|
| `on(event, handler)` | 监听事件 |
| `off(event, handler)` | 移除事件监听 |
| `emit(event, data)` | 发射事件 |
| `clear()` | 清除所有事件监听 |
| `clearEvent(event)` | 清除指定事件的所有监听 |

### 事件类型

```typescript
export type BitmapEvents = {
  'scroll:change': ScrollState;
  'zoom:change': number;
  'selection:change': CellData | null;
  'cell:click': CellData;
  'cell:hover': CellData;
  'data:change': MatrixData;
  'locate': { col: number; row: number };
  'highlight': { col: number; row: number } | null;
  'clear-highlight': void;
};
```

### 使用示例

```typescript
// 1. 监听事件
eventBus.on('scroll:change', (state) => {
  console.log('滚动变化:', state);
});

// 2. 发射事件
eventBus.emit('scroll:change', { scrollX: 100, scrollY: 200 });

// 3. 移除监听
eventBus.off('scroll:change', handler);

// 4. 清除所有监听
eventBus.clear();
```

### 设计特点

- **类型安全**：使用 TypeScript 泛型确保事件类型安全
- **解耦**：模块间通过事件通信，降低耦合度
- **轻量级**：基于 mitt 库，体积小、性能好

---

## 5. LayoutCalculator.ts - 布局计算器

### 类结构

```typescript
export class LayoutCalculator {
  private config: LayoutConfig;  // 布局配置
}
```

### 主要方法

| 方法 | 说明 |
|------|------|
| `calculate(containerWidth, containerHeight)` | 计算各区域位置 |
| `updateConfig(config)` | 更新布局配置 |
| `getConfig()` | 获取当前布局配置 |

### 布局配置

```typescript
export interface LayoutConfig {
  toolbarHeight: number;  // 工具栏高度
  axisSize: number;        // 坐标轴尺寸
  scrollbarSize: number;   // 滚动条尺寸
  spacing: number;         // 间距
}
```

### 布局结果

```typescript
export interface LayoutResult {
  toolbar: Area;              // 工具栏区域
  xAxis: Area;                // X 轴区域
  yAxis: Area;                // Y 轴区域
  cellArea: Area;             // 格子区域
  horizontalScrollbar: Area;  // 横向滚动条区域
  verticalScrollbar: Area;    // 纵向滚动条区域
}

export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### 布局计算逻辑

```typescript
calculate(containerWidth: number, containerHeight: number): LayoutResult {
  const { toolbarHeight, axisSize, scrollbarSize, spacing } = this.config;

  // 1. 工具栏区域（顶部，全宽）
  const toolbar: Area = {
    x: 0,
    y: 0,
    width: containerWidth,
    height: toolbarHeight,
  };

  // 2. X 轴区域（工具栏下方，Y 轴右侧）
  const xAxis: Area = {
    x: axisSize + spacing,
    y: toolbarHeight + spacing,
    width: containerWidth - axisSize - spacing - scrollbarSize - spacing,
    height: axisSize,
  };

  // 3. Y 轴区域（工具栏下方，左侧）
  const yAxis: Area = {
    x: 0,
    y: toolbarHeight + spacing + axisSize + spacing,
    width: axisSize,
    height: containerHeight - toolbarHeight - spacing - axisSize - spacing - scrollbarSize - spacing,
  };

  // 4. 格子区域（X 轴下方，Y 轴右侧）
  const cellArea: Area = {
    x: axisSize + spacing,
    y: toolbarHeight + spacing + axisSize + spacing,
    width: containerWidth - axisSize - spacing - scrollbarSize - spacing,
    height: containerHeight - toolbarHeight - spacing - axisSize - spacing - scrollbarSize - spacing,
  };

  // 5. 横向滚动条区域（格子区域下方）
  const horizontalScrollbar: Area = {
    x: axisSize + spacing,
    y: toolbarHeight + spacing + axisSize + spacing + cellArea.height + spacing,
    width: containerWidth - axisSize - spacing - scrollbarSize - spacing,
    height: scrollbarSize,
  };

  // 6. 纵向滚动条区域（格子区域右侧）
  const verticalScrollbar: Area = {
    x: axisSize + spacing + cellArea.width + spacing,
    y: toolbarHeight + spacing + axisSize + spacing,
    width: scrollbarSize,
    height: containerHeight - toolbarHeight - spacing - axisSize - spacing - scrollbarSize - spacing,
  };

  return {
    toolbar,
    xAxis,
    yAxis,
    cellArea,
    horizontalScrollbar,
    verticalScrollbar,
  };
}
```

### 布局示意图

```
┌─────────────────────────────────────────┐
│           Toolbar (顶部)               │
├─────────────────────────────────────────┤
│         │  X Axis (横向)                │
│  Y Axis ├────────────────────┬─────────┤
│  (纵向) │                    │         │
│         │    Cell Area       │  V      │
│         │    (格子区域)       │  S      │
│         │                    │  B      │
│         │                    │         │
├─────────┴────────────────────┴─────────┤
│         H Scrollbar (横向滚动条)        │
└─────────────────────────────────────────┘
```

---

## 6. VirtualScrollSync.ts - 虚拟滚动同步

### 类结构

```typescript
export class VirtualScrollSync {
  private totalRows: number;           // 总行数
  private totalCols: number;           // 总列数
  private viewportWidth: number;        // 视口宽度
  private viewportHeight: number;       // 视口高度
  private currentCellSize: number;      // 当前格子尺寸

  // 计算属性
  get maxScrollX(): number;             // 最大横向滚动距离
  get maxScrollY(): number;             // 最大纵向滚动距离
}
```

### 主要方法

| 方法 | 说明 |
|------|------|
| `updateDataSize(rows, cols)` | 更新数据尺寸 |
| `updateViewport(width, height)` | 更新视口尺寸 |
| `updateCellSize(size)` | 更新格子尺寸 |
| `getVisibleRange(scrollX, scrollY)` | 获取可见范围 |
| `getScrollbarState(scrollX, scrollY, width, height)` | 获取滚动条状态 |
| `getScrollFromThumb(thumbX, thumbY, width, height)` | 从滑块位置计算滚动位置 |

### 更新数据尺寸

```typescript
updateDataSize(rows: number, cols: number): void {
  this.totalRows = rows;
  this.totalCols = cols;
}
```

### 更新视口尺寸

```typescript
updateViewport(width: number, height: number): void {
  this.viewportWidth = width;
  this.viewportHeight = height;
}
```

### 更新格子尺寸

```typescript
updateCellSize(size: number): void {
  this.currentCellSize = size;
}
```

### 获取可见范围

```typescript
getVisibleRange(scrollX: number, scrollY: number): VisibleRange {
  // 计算可见的起始和结束行列
  const startCol = Math.floor(scrollX / this.currentCellSize);
  const startRow = Math.floor(scrollY / this.currentCellSize);

  const endCol = Math.ceil((scrollX + this.viewportWidth) / this.currentCellSize);
  const endRow = Math.ceil((scrollY + this.viewportHeight) / this.currentCellSize);

  return {
    startCol: Math.max(0, startCol),
    endCol: Math.min(this.totalCols - 1, endCol),
    startRow: Math.max(0, startRow),
    endRow: Math.min(this.totalRows - 1, endRow),
  };
}
```

### 获取滚动条状态

```typescript
getScrollbarState(scrollX: number, scrollY: number, width: number, height: number): ScrollbarState {
  // 计算内容总尺寸
  const contentWidth = this.totalCols * this.currentCellSize;
  const contentHeight = this.totalRows * this.currentCellSize;

  // 计算滑块大小（比例）
  const thumbWidth = (this.viewportWidth / contentWidth) * width;
  const thumbHeight = (this.viewportHeight / contentHeight) * height;

  // 计算滑块位置（比例）
  const thumbX = (scrollX / (contentWidth - this.viewportWidth)) * (width - thumbWidth);
  const thumbY = (scrollY / (contentHeight - this.viewportHeight)) * (height - thumbHeight);

  return {
    thumbX: Math.max(0, thumbX),
    thumbY: Math.max(0, thumbY),
    thumbWidth: Math.max(20, thumbWidth),  // 最小 20px
    thumbHeight: Math.max(20, thumbHeight), // 最小 20px
  };
}
```

### 从滑块位置计算滚动位置

```typescript
getScrollFromThumb(thumbX: number, thumbY: number, width: number, height: number): ScrollState {
  // 计算内容总尺寸
  const contentWidth = this.totalCols * this.currentCellSize;
  const contentHeight = this.totalRows * this.currentCellSize;

  // 计算滑块比例
  const thumbRatioX = thumbX / (width - 20);  // 减去最小滑块宽度
  const thumbRatioY = thumbY / (height - 20); // 减去最小滑块高度

  // 计算滚动位置
  const scrollX = thumbRatioX * (contentWidth - this.viewportWidth);
  const scrollY = thumbRatioY * (contentHeight - this.viewportHeight);

  return {
    scrollX: Math.max(0, scrollX),
    scrollY: Math.max(0, scrollY),
  };
}
```

### 最大滚动距离

```typescript
get maxScrollX(): number {
  const contentWidth = this.totalCols * this.currentCellSize;
  return Math.max(0, contentWidth - this.viewportWidth);
}

get maxScrollY(): number {
  const contentHeight = this.totalRows * this.currentCellSize;
  return Math.max(0, contentHeight - this.viewportHeight);
}
```

---

## Core 模块设计模式

### 1. 单例模式

- `BitmapGridEngine` 是单例，每个容器只有一个引擎实例
- 通过 `initialize()` 方法初始化，`destroy()` 方法销毁

### 2. 依赖注入

- 各模块通过构造函数接收 `BitmapGridEngine` 引用
- 通过 getter 方法访问其他模块（如 `getEventBus()`、`getDataManager()`）

### 3. 事件驱动

- 使用 `EventBus` 解耦模块间通信
- 模块通过 `emit()` 发射事件，通过 `on()` 监听事件

### 4. 响应式更新

- 数据变化时触发事件，通知相关模块更新
- 滚动、缩放变化时触发事件，通知图层重新渲染

---

## 与其他模块的关系

```
React 组件 (components/)
    ↓ 使用
useBitmapGrid Hook (hooks/)
    ↓ 创建
BitmapGridEngine (core/) ←─── 本模块
    ↓ 创建
Layers (layers/)
    ↓ 使用
Draws (draws/)
    ↓ 绘制到
Konva Canvas
```

### 调用链

1. React 组件通过 `useBitmapGrid` Hook 创建 `BitmapGridEngine`
2. `BitmapGridEngine` 初始化时创建各核心模块（EventBus、DataManager、VirtualScrollSync 等）
3. `BitmapGridEngine` 创建各图层（ToolbarLayer、CellLayer 等）
4. 图层初始化时创建对应的 Draw 类
5. 图层监听 EventBus 事件（scroll:change、zoom:change 等）
6. 事件触发时调用 Draw 类的渲染方法
7. Draw 类从 Engine 获取配置、数据、状态
8. Draw 类创建/更新 Konva 图形对象

---

## 核心概念

1. **虚拟滚动**：只渲染可见区域的格子，支持大数据量
2. **分层渲染**：不同元素在不同图层，便于独立更新
3. **事件驱动**：通过 EventBus 解耦模块间通信
4. **响应式布局**：LayoutCalculator 动态计算各区域位置
5. **颜色映射**：通过 ColorRule 将数值映射到颜色
