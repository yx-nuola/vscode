# Hooks 模块详细说明

## 概述

`hooks` 模块提供 React Hooks，用于在 React 组件中使用 Bitmap 功能。

---

## 文件列表

| 文件 | 功能 | 状态 |
|------|------|------|
| `useBitmapGrid.ts` | 主 Hook，初始化 BitmapGridEngine，管理生命周期，暴露 zoomIn/zoomOut/scrollTo 等方法 | ✅ 完成 |

---

## 1. useBitmapGrid.ts - 主 Hook

### Hook 参数

```typescript
export interface UseBitmapGridParams {
  containerId: string;
  config: BitmapGridConfig;
  data?: MatrixData;
  theme?: BitmapTheme;
  colorRules?: ColorRule[];
}
```

### Hook 返回值

```typescript
export interface UseBitmapGridReturn {
  engine: BitmapGridEngine | null;
  containerRef: React.RefObject<HTMLDivElement>;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  scrollTo: (scrollX: number, scrollY: number) => void;
  selectCell: (col: number, row: number) => void;
  clearSelection: () => void;
  locateAndHighlight: (col: number, row: number) => void;
  getZoomLevel: () => number;
  getScrollState: () => ScrollState;
  getSelectedCell: () => CellData | null;
}
```

### Hook 实现

```typescript
export function useBitmapGrid(params: UseBitmapGridParams): UseBitmapGridReturn {
  const { containerId, config, data, theme, colorRules } = params;

  const engineRef = useRef<BitmapGridEngine | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. 初始化引擎
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new BitmapGridEngine(config);
    engineRef.current = engine;

    engine.initialize(containerRef.current);

    // 初始化时设置数据
    if (data) {
      engine.setData(data);
    }

    // 初始化时设置主题
    if (theme) {
      engine.setTheme(theme);
    }

    // 初始化时设置颜色规则
    if (colorRules) {
      engine.setColorRules(colorRules);
    }

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [containerId]); // 只在 containerId 变化时重新初始化

  // 2. 更新数据
  useEffect(() => {
    if (data && engineRef.current) {
      engineRef.current.setData(data);
    }
  }, [data]);

  // 3. 更新主题
  useEffect(() => {
    if (theme && engineRef.current) {
      engineRef.current.setTheme(theme);
    }
  }, [theme]);

  // 4. 更新颜色规则
  useEffect(() => {
    if (colorRules && engineRef.current) {
      engineRef.current.setColorRules(colorRules);
    }
  }, [colorRules]);

  // 5. 监听容器尺寸变化
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        engineRef.current?.resize(width, height);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 6. 暴露方法
  const zoomIn = useCallback(() => {
    engineRef.current?.zoomIn();
  }, []);

  const zoomOut = useCallback(() => {
    engineRef.current?.zoomOut();
  }, []);

  const resetZoom = useCallback(() => {
    engineRef.current?.resetZoom();
  }, []);

  const scrollTo = useCallback((scrollX: number, scrollY: number) => {
    engineRef.current?.scrollTo(scrollX, scrollY);
  }, []);

  const selectCell = useCallback((col: number, row: number) => {
    engineRef.current?.selectCell(col, row);
  }, []);

  const clearSelection = useCallback(() => {
    engineRef.current?.clearSelection();
  }, []);

  const locateAndHighlight = useCallback((col: number, row: number) => {
    engineRef.current?.locateAndHighlight(col, row);
  }, []);

  const getZoomLevel = useCallback(() => {
    return engineRef.current?.getZoomLevel() || 10;
  }, []);

  const getScrollState = useCallback(() => {
    return engineRef.current?.getScrollState() || { scrollX: 0, scrollY: 0 };
  }, []);

  const getSelectedCell = useCallback(() => {
    return engineRef.current?.getSelectedCell() || null;
  }, []);

  return {
    engine: engineRef.current,
    containerRef,
    zoomIn,
    zoomOut,
    resetZoom,
    scrollTo,
    selectCell,
    clearSelection,
    locateAndHighlight,
    getZoomLevel,
    getScrollState,
    getSelectedCell,
  };
}
```

### 使用示例

```typescript
import { useBitmapGrid } from './hooks/useBitmapGrid';

const MyComponent = () => {
  const containerId = 'bitmap-grid-container';
  const config: BitmapGridConfig = {
    layout: {
      toolbarHeight: 40,
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

  const {
    containerRef,
    zoomIn,
    zoomOut,
    resetZoom,
    scrollTo,
    selectCell,
    clearSelection,
    locateAndHighlight,
  } = useBitmapGrid({
    containerId,
    config,
    data,
    theme,
    colorRules,
  });

  return (
    <div id={containerId} ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <button onClick={zoomIn}>放大</button>
      <button onClick={zoomOut}>缩小</button>
      <button onClick={resetZoom}>重置</button>
    </div>
  );
};
```

---

## Hooks 模块设计模式

### 1. Hook 模式

使用 React Hook 模式，封装引擎生命周期：

```typescript
export function useBitmapGrid(params: UseBitmapGridParams): UseBitmapGridReturn {
  // 初始化引擎
  useEffect(() => {
    const engine = new BitmapGridEngine(config);
    engine.initialize(containerRef.current);
    return () => engine.destroy();
  }, [containerId]);

  // 更新数据
  useEffect(() => {
    if (data && engineRef.current) {
      engineRef.current.setData(data);
    }
  }, [data]);

  // 暴露方法
  const zoomIn = useCallback(() => {
    engineRef.current?.zoomIn();
  }, []);

  return { zoomIn, /* ... */ };
}
```

### 2. 依赖管理

使用 `useEffect` 管理依赖，自动更新：

```typescript
// 只在 containerId 变化时重新初始化
useEffect(() => {
  const engine = new BitmapGridEngine(config);
  engine.initialize(containerRef.current);
  return () => engine.destroy();
}, [containerId]);

// 数据变化时自动更新
useEffect(() => {
  if (data && engineRef.current) {
    engineRef.current.setData(data);
  }
}, [data]);
```

### 3. 回调优化

使用 `useCallback` 优化回调，避免不必要的重新渲染：

```typescript
const zoomIn = useCallback(() => {
  engineRef.current?.zoomIn();
}, []);
```

### 4. ResizeObserver

使用 `ResizeObserver` 监听容器尺寸变化：

```typescript
useEffect(() => {
  if (!containerRef.current) return;

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      engineRef.current?.resize(width, height);
    }
  });

  resizeObserver.observe(containerRef.current);

  return () => {
    resizeObserver.disconnect();
  };
}, []);
```

---

## 与其他模块的关系

```
React 组件 (components/)
    ↓ 使用
useBitmapGrid Hook (hooks/) ←─── 本模块
    ↓ 创建
BitmapGridEngine (core/)
    ↓ 创建
Layers (layers/)
    ↓ 使用
Draws (draws/)
    ↓ 绘制到
Konva Canvas
```

### 调用链

1. React 组件调用 `useBitmapGrid` Hook
2. Hook 初始化时创建 `BitmapGridEngine`
3. `BitmapGridEngine` 初始化时创建各核心模块和图层
4. 图层监听 EventBus 事件
5. 事件触发时调用 Draw 类的渲染方法
6. Draw 类从 Engine 获取配置、数据、状态
7. Draw 类创建/更新 Konva 图形对象
8. Hook 暴露方法供 React 组件调用

---

## Hook 使用场景

| 场景 | 使用方法 |
|------|---------|
| 基础使用 | `useBitmapGrid({ containerId, config, data, theme, colorRules })` |
| 动态更新数据 | 修改 `data` prop，Hook 自动更新 |
| 动态更新主题 | 修改 `theme` prop，Hook 自动更新 |
| 动态更新颜色规则 | 修改 `colorRules` prop，Hook 自动更新 |
| 调用方法 | 使用 Hook 返回的 `zoomIn`、`zoomOut` 等方法 |
| 获取状态 | 使用 Hook 返回的 `getZoomLevel`、`getScrollState` 等方法 |
