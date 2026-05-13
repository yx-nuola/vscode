# core/EventBus.ts - 事件总线

## 概述
`EventBus` 基于库 `mitt` 实现事件总线，用于模块间通信和事件分发。

## 核心功能

### 事件监听
- 监听内部事件
- 支持类型安全的泛型事件

### 事件触发
- 触发事件
- 传递事件数据

### 事件清理
- 清除所有事件监听
- 清除指定事件的所有监听

## 核心属性

```typescript
private emitter: Emitter<ExtendedEvents>;  // mitt 事件发射器
```

## 核心方法

### 事件监听

#### `on<K extends keyof BitmapEvents>(event: K, handler: (data: BitmapEvents[K]) => void): void`
监听事件

**参数**:
- `event`: 事件名称（K）
- `handler`: 事件处理函数

**使用示例**:
```typescript
eventBus.on('scroll:change', (state) => {
  console.log('滚动状态:', state);
});

eventBus.on('cell:click', (cell) => {
  console.log('点击格子:', cell);
});
```

### 事件触发

#### `emit<K extends keyof BitmapEvents>(event: K, data: BitmapEvents[K]): void`
触发事件

**参数**:
- `event`: 事件名称（K）
- `data`: 事件数据

**使用示例**:
```typescript
eventBus.emit('scroll:change', { scrollX: 100, scrollY: 200 });
eventBus.emit('cell:click', { row: 10, col: 20, value: 100 });
```

### 事件移除

#### `off<K extends keyof BitmapEvents>(event: K, handler: (data: BitmapEvents[K]) => void): void`
移除事件监听

**参数**:
- `event`: 事件名称（K）
- `handler`: 事件处理函数

**使用示例**:
```typescript
const handler = (state) => {
  console.log('滚动状态:', state);
};

eventBus.on('scroll:change', handler);
eventBus.off('scroll:change', handler);
```

### 清理

#### `clear(): void`
清除所有事件监听

```typescript
this.emitter.all.clear();
```

**使用示例**:
```typescript
// 销毁前清理
eventBus.clear();
```

#### `clearEvent<K extends keyof BitmapEvents>(event: K): void`
清除指定事件的所有监听

```typescript
this.emitter.all.delete(event as keyof ExtendedEvents);
```

**使用示例**:
```typescript
// 清除所有滚动事件监听
eventBus.clearEvent('scroll:change');
```

## 事件类型

### BitmapEvents 接口
```typescript
interface BitmapEvents {
  'scroll:change': ScrollState;              // 滚动状态变化
  'zoom:change': number;                     // 缩放级别变化
  'selection:change': CellData | null;       // 选择变化
  'cell:click': CellData;                    // 格子点击
  'cell:hover': CellData | null;             // 格子悬停
  'locate': { col: number; row: number };     // 定位
  'data:change': MatrixData;                 // 数据变化
  'highlight': { col: number; row: number };  // 高亮
  'clear-highlight': void;                   // 清除高亮
}
```

## 使用示例

### 基础用法
```typescript
import { EventBus } from './core';

const eventBus = new EventBus();

// 监听事件
eventBus.on('scroll:change', (state) => {
  console.log('滚动状态:', state);
});

// 触发事件
eventBus.emit('scroll:change', { scrollX: 100, scrollY: 200 });
```

### 在引擎中使用
```typescript
import { BitmapGridEngine } from './core';

const engine = new BitmapGridEngine(config);

// 监听事件
engine.getEventBus().on('scroll:change', (state) => {
  console.log('引擎滚动状态:', state);
});

engine.getEventBus().on('cell:click', (cell) => {
  console.log('点击格子:', cell);
});

// 触发事件
engine.scrollTo(100, 200);
engine.selectCell(10, 20);
```

### 在图层中使用
```typescript
import { AxisLayer } from '../renderer/layers';

class AxisLayer {
  private engine: BitmapGridEngine;

  initialize() {
    const eventBus = this.engine.getEventBus();

    // 监听滚动事件
    eventBus.on('scroll:change', () => {
      this.update();
    });

    // 监听缩放事件
    eventBus.on('zoom:change', () => {
      this.update();
    });
  }
}
```

### 在工具类中使用
```typescript
import { ZoomManager } from '../renderer/tools';

class ZoomManager {
  private engine: BitmapGridEngine;

  zoomAt(delta: number, anchorX: number, anchorY: number) {
    // ... 缩放逻辑

    // 触发事件
    this.engine.getEventBus().emit('zoom:change', newSize);
  }
}
```

## 事件流程

```
触发事件
  ↓
EventBus.emit()
  ↓
调用所有监听器
  ↓
各个模块响应
  ↓
更新状态或重新渲染
```

## 性能特点

- **轻量级**: 基于 mitt，体积小
- **高效**: 使用 Map 存储监听器，查找时间 O(1)
- **类型安全**: 使用泛型确保类型正确

## 注意事项

1. **事件清理**: 使用后记得调用 `clear()` 或 `off()` 清理监听器
2. **内存泄漏**: 避免在组件销毁时未移除监听器
3. **事件顺序**: 监听器按照注册顺序执行
4. **异步事件**: 事件处理是同步的，不要在处理函数中使用异步操作
