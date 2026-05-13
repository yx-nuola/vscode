# core/BitmapGridEngine.ts - 主引擎

## 概述
`BitmapGridEngine` 是 Bitmap 网格引擎的核心类，负责编排所有模块，管理渲染、交互和状态。

## 核心功能

### 初始化
- 创建 Konva Stage
- 初始化所有图层（AxisLayer, CellLayer, HighlightLayer）
- 设置事件监听
- 添加鼠标滚轮支持

### 数据管理
- 设置数据（MatrixData）
- 设置主题（BitmapTheme）
- 设置颜色规则（ColorRule[]）

### 交互操作
- 缩放（zoomIn, zoomOut, resetZoom）
- 滚动（scrollTo）
- 选择（selectCell, clearSelection）
- 定位并高亮（locateAndHighlight）

### 事件系统
- 监听内部事件（scroll:change, zoom:change, selection:change, cell:click, cell:hover）
- 触发回调函数（onScrollChange, onZoomChange, onSelectionChange, onCellClick, onCellHover）

## 核心属性

```typescript
private stage: StageType | null;                    // Konva Stage
private layers: Map<string, LayerType>;             // 图层映射
private eventBus: EventBus;                         // 事件总线
private layoutCalculator: LayoutCalculator;         // 布局计算器
private dataManager: DataManager;                   // 数据管理器
private virtualScrollSync: VirtualScrollSync;       // 虚拟滚动同步
private config: BitmapGridConfig;                   // 配置
private container: HTMLElement | null;              // 容器元素
private scrollState: ScrollState;                   // 滚动状态
private cellSize: number;                           // 格子尺寸
private selectedCell: CellData | null;              // 选中的格子
private locationManager: LocationManager;           // 定位管理器

// 图层实例
private axisLayer: AxisLayer;
private cellLayer: CellLayer;
private highlightLayer: HighlightLayer;
```

## 核心方法

### 初始化与销毁

#### `initialize(container: HTMLElement): void`
初始化引擎

**流程**:
1. 保存容器引用
2. 获取容器尺寸
3. 创建 Konva Stage
4. 计算布局
5. 设置视口尺寸
6. 初始化并添加图层
7. 设置事件监听
8. 添加鼠标滚轮事件

```typescript
const { width, height } = container.getBoundingClientRect();
this.stage = new Stage({
  container: container.id,
  width,
  height,
});
this.virtualScrollSync.updateViewport(BITMAP_WIDTH, layout.cellArea.height);
```

#### `destroy(): void`
销毁引擎

**流程**:
1. 清除事件总线
2. 清除数据管理器
3. 销毁所有图层
4. 销毁所有图层
5. 清空图层映射
6. 销毁 Stage
7. 清空引用

### 数据操作

#### `setData(data: MatrixData): void`
设置数据

**流程**:
1. 清空数据管理器
2. 设置行列数
3. 保存格子数据
4. 更新虚拟滚动同步的数据尺寸
5. 触发 `data:change` 事件

```typescript
this.dataManager.setData(data);
this.virtualScrollSync.updateDataSize(data.rows, data.cols);
this.eventBus.emit('data:change', data);
```

#### `setTheme(theme: BitmapTheme): void`
设置主题

```typescript
this.config.theme = theme;
```

#### `setColorRules(rules: ColorRule[]): void`
设置颜色规则

```typescript
this.config.colorRules = rules;
```

### 缩放操作

#### `zoomIn(): void`
放大

```typescript
const newSize = Math.min(this.cellSize + 2, MAX_CELL_SIZE);
this.setCellSize(newSize);
```

#### `zoomOut(): void`
缩小

```typescript
const newSize = Math.max(this.cellSize - 2, DEFAULT_CELL_SIZE);
this.setCellSize(newSize);
```

#### `resetZoom(): void`
重置缩放

```typescript
this.setCellSize(DEFAULT_CELL_SIZE);
```

#### `setCellSize(size: number): void`
设置格子尺寸（私有方法）

**流程**:
1. 更新格子尺寸
2. 更新虚拟滚动同步
3. 触发 `zoom:change` 事件

### 滚动操作

#### `scrollTo(scrollX: number, scrollY: number): void`
滚动到指定位置

**流程**:
1. 边界钳制
2. 更新滚动状态
3. 触发 `scroll:change` 事件

```typescript
this.scrollState = {
  scrollX: Math.max(0, Math.min(scrollX, maxScrollX)),
  scrollY: Math.max(0, Math.min(scrollY, maxScrollY)),
};
this.eventBus.emit('scroll:change', this.scrollState);
```

### 选择操作

#### `selectCell(col: number, row: number): void`
选择格子

**流程**:
1. 从 DataManager 获取格子数据
2. 如果没有数据，创建临时格子（value: -1）
3. 设置选中状态
4. 触发 `selection:change` 事件

```typescript
const cell = this.dataManager.getCell(row, col);
const selectedCell = cell || { row, col, value: -1 };
this.selectedCell = selectedCell;
this.eventBus.emit('selection:change', selectedCell);
```

#### `clearSelection(): void`
清除选择

```typescript
this.selectedCell = null;
this.eventBus.emit('selection:change', null);
```

### 定位操作

#### `locateAndHighlight(col: number, row: number): void`
定位并高亮格子

**流程**:
1. 调用 LocationManager 定位格子
2. 触发 `locate` 事件
3. 选择格子

```typescript
this.locationManager.locateToCell(col, row);
this.eventBus.emit('locate', { col, row });
this.selectCell(col, row);
```

### 尺寸调整

#### `resize(width: number, height: number): void`
调整尺寸

**流程**:
1. 更新 Stage 尺寸
2. 重新计算布局
3. 更新视口高度

```typescript
this.stage.width(width);
this.stage.height(height);
const layout = this.layoutCalculator.calculate(width, height);
this.virtualScrollSync.updateViewport(BITMAP_WIDTH, layout.cellArea.height);
```

### 状态查询

#### `getZoomLevel(): number`
获取缩放级别

```typescript
return this.cellSize;
```

#### `getScrollState(): ScrollState`
获取滚动状态

```typescript
return { ...this.scrollState };
```

#### `getSelectedCell(): CellData | null`
获取选中的格子

```typescript
return this.selectedCell;
```

### 模块访问

#### `getEventBus(): EventBus`
获取事件总线

#### `getLayoutCalculator(): LayoutCalculator`
获取布局计算器

#### `getDataManager(): DataManager`
获取数据管理器

#### `getVirtualScrollSync(): VirtualScrollSync`
获取虚拟滚动同步

#### `getConfig(): BitmapGridConfig`
获取配置

#### `getStage(): StageType | null`
获取 Stage

### 图层管理

#### `addLayer(name: string, layer: LayerType): void`
添加图层

```typescript
this.layers.set(name, layer);
this.stage?.add(layer);
```

#### `getLayer(name: string): LayerType | undefined`
获取图层

## 事件监听

### 内部事件监听

```typescript
this.eventBus.on('scroll:change', (state) => {
  this.scrollState = state;
  this.config.callbacks?.onScrollChange?.(state);
});

this.eventBus.on('zoom:change', (size) => {
  this.cellSize = size;
  this.config.callbacks?.onZoomChange?.(size);
});

this.eventBus.on('selection:change', (cell) => {
  this.selectedCell = cell;
  this.config.callbacks?.onSelectionChange?.(cell);
});

this.eventBus.on('cell:click', (cell) => {
  this.selectCell(cell.col, cell.row);
  this.config.callbacks?.onCellClick?.(cell);
});

this.eventBus.on('cell:hover', (cell) => {
  this.config.callbacks?.onCellHover?.(cell);
});
```

### 鼠标滚轮事件

```typescript
this.container.addEventListener('wheel', (e) => {
  e.preventDefault();
  const deltaX = e.deltaX;
  const deltaY = e.deltaY;
  const scrollSpeed = 1;
  const newScrollX = this.scrollState.scrollX + deltaX * scrollSpeed;
  const newScrollY = this.scrollState.scrollY + deltaY * scrollSpeed;
  this.scrollTo(newScrollX, newScrollY);
}, { passive: false });
```

## 图层顺序

```typescript
// 添加图层到 stage（注意顺序：后面的图层会覆盖前面的）
this.addLayer('cell', this.cellLayer.getLayer());      // 中层
this.addLayer('axis', this.axisLayer.getLayer());      // 底层
this.addLayer('highlight', this.highlightLayer.getLayer());  // 顶层
```

**渲染顺序**: AxisLayer → CellLayer → HighlightLayer

## 配置结构

```typescript
interface BitmapGridConfig {
  theme: BitmapTheme;
  colorRules: ColorRule[];
  layout: LayoutConfig;
  callbacks?: {
    onScrollChange?: (state: ScrollState) => void;
    onZoomChange?: (size: number) => void;
    onSelectionChange?: (cell: CellData | null) => void;
    onCellClick?: (cell: CellData) => void;
    onCellHover?: (cell: CellData | null) => void;
  };
  initialCellSize?: number;
  minCellSize?: number;
  maxCellSize?: number;
}
```
