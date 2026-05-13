# core/index.ts - 核心模块入口

## 概述
这是 Bitmap 网格引擎的核心模块入口文件，导出所有核心组件。

## 导出内容

### 核心引擎
- **BitmapGridEngine** - 主引擎类，编排所有模块

### 数据管理
- **DataManager** - 数据管理器，管理格子数据

### 数据解析
- **DataParser** - 数据解析器，解析 RRAM 测试数据

### 事件系统
- **EventBus** - 事件总线，基于 mitt 实现

### 布局计算
- **LayoutCalculator** - 布局计算器，计算各区域位置

### 虚拟滚动
- **VirtualScrollSync** - 虚拟滚动同步，管理滚动状态

## 使用示例

```typescript
import { BitmapGridEngine, DataManager, DataParser, EventBus, LayoutCalculator, VirtualScrollSync } from './core';

// 创建引擎
const engine = new BitmapGridEngine(config);

// 创建各个模块
const dataManager = new DataManager();
const eventBus = new EventBus();
const layoutCalculator = new LayoutCalculator(config.layout);
const virtualScrollSync = new VirtualScrollSync(rows, cols, cellSize);
```

## 模块依赖关系

```
BitmapGridEngine
  ├── DataManager
  ├── EventBus
  ├── LayoutCalculator
  ├── VirtualScrollSync
  └── renderer/layers (AxisLayer, CellLayer, HighlightLayer)
```
