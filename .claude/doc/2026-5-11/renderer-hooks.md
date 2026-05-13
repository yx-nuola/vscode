# renderer/hooks/useBitmapGrid.ts - React Hook

## 概述
`useBitmapGrid` 是一个 React Hook，用于在 React 组件中集成 Bitmap 网格引擎，提供状态管理和交互方法。

## 核心功能

### 初始化
- 创建 `BitmapGridEngine` 实例
- 初始化容器引用
- 设置配置、数据、主题和颜色规则
- 监听容器尺寸变化（ResizeObserver）

### 数据更新
- 通过 `data` 参数更新数据
- 通过 `theme` 参数更新主题
- 通过 `colorRules` 参数更新颜色规则

### 交互方法

#### 缩放操作
- `zoomIn()` - 放大
- `zoomOut()` - 缩小
- `resetZoom()` - 重置缩放
- `getZoomLevel()` - 获取当前缩放级别

#### 滚动操作
- `scrollTo(scrollX, scrollY)` - 滚动到指定位置
- `getScrollState()` - 获取滚动状态

#### 选择操作
- `selectCell(col, row)` - 选择格子
- `clearSelection()` - 清除选择
- `getSelectedCell()` - 获取选中的格子

#### 定位操作
- `locateAndHighlight(col, row)` - 定位并高亮格子

## API 接口

### UseBitmapGridParams
```typescript
interface UseBitmapGridParams {
  containerId: string;           // 容器 ID
  config: BitmapGridConfig;      // 配置
  data?: MatrixData;             // 数据（可选）
  theme?: BitmapTheme;           // 主题（可选）
  colorRules?: ColorRule[];      // 颜色规则（可选）
}
```

### UseBitmapGridReturn
```typescript
interface UseBitmapGridReturn {
  engine: BitmapGridEngine | null;           // 引擎实例
  containerRef: React.RefObject<HTMLDivElement>;  // 容器引用
  zoomIn: () => void;                        // 放大
  zoomOut: () => void;                        // 缩小
  resetZoom: () => void;                      // 重置缩放
  scrollTo: (scrollX: number, scrollY: number) => void;  // 滚动到指定位置
  selectCell: (col: number, row: number) => void;       // 选择格子
  clearSelection: () => void;                 // 清除选择
  locateAndHighlight: (col: number, row: number) => void;  // 定位并高亮
  getZoomLevel: () => number;                 // 获取缩放级别
  getScrollState: () => ScrollState;          // 获取滚动状态
  getSelectedCell: () => CellData | null;     // 获取选中的格子
}
```

## 使用示例

### 基础用法
```typescript
import { useBitmapGrid } from './renderer/hooks/useBitmapGrid';

function MyComponent() {
  const { containerRef, zoomIn, zoomOut, selectCell } = useBitmapGrid({
    containerId: 'bitmap-container',
    config: {
      initialCellSize: 10,
      minCellSize: 2,
      maxCellSize: 50,
    },
    data: matrixData,
    theme: {
      axisColor: '#cccccc',
      axisTextColor: '#ffffff',
      highlightColor: '#ff0000',
    },
    colorRules: [
      { min: 0, max: 100, color: '#00ff00' },
      { min: 100, max: 200, color: '#ffff00' },
    ],
  });

  return (
    <div ref={containerRef} style={{ width: '100%', height: '500px' }} />
  );
}
```

### 响应式缩放
```typescript
const { zoomIn, zoomOut, getZoomLevel } = useBitmapGrid({ /* ... */ });

<button onClick={zoomIn}>放大</button>
<button onClick={zoomOut}>缩小</button>
<span>当前缩放: {getZoomLevel()}px</span>
```

### 选择格子
```typescript
const { selectCell, getSelectedCell } = useBitmapGrid({ /* ... */ });

function handleClick(col: number, row: number) {
  selectCell(col, row);
}

const selected = getSelectedCell();
console.log('选中格子:', selected);
```

### 滚动定位
```typescript
const { scrollTo, locateAndHighlight } = useBitmapGrid({ /* ... */ });

// 滚动到指定位置
scrollTo(100, 200);

// 定位到格子并高亮
locateAndHighlight(50, 50);
```

## 生命周期

### 初始化阶段
```typescript
useEffect(() => {
  const engine = new BitmapGridEngine(config);
  engineRef.current = engine;
  engine.initialize(containerRef.current);

  // 设置初始数据、主题、颜色规则
  if (data) engine.setData(data);
  if (theme) engine.setTheme(theme);
  if (colorRules) engine.setColorRules(colorRules);

  // 强制触发重绘
  requestAnimationFrame(() => {
    const { width, height } = containerRef.current?.getBoundingClientRect() || { width: 0, height: 0 };
    if (width > 0 && height > 0) {
      engine.resize(width, height);
    }
  });

  return () => {
    engine.destroy();
    engineRef.current = null;
  };
}, [containerId]);  // 只在 containerId 变化时重新初始化
```

### 更新阶段
```typescript
// 数据更新
useEffect(() => {
  if (data && engineRef.current) {
    engineRef.current.setData(data);
  }
}, [data]);

// 主题更新
useEffect(() => {
  if (theme && engineRef.current) {
    engineRef.current.setTheme(theme);
  }
}, [theme]);

// 颜色规则更新
useEffect(() => {
  if (colorRules && engineRef.current) {
    engineRef.current.setColorRules(colorRules);
  }
}, [colorRules]);

// 容器尺寸变化
useEffect(() => {
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

## 依赖项说明

### containerId
- **作用**: 唯一标识符，用于重新初始化引擎
- **变化时机**: 容器元素被卸载或重新挂载时
- **注意**: 其他参数变化不会触发重新初始化

### data
- **作用**: 矩阵数据
- **变化时机**: 数据更新时
- **注意**: 使用 `useEffect` 监听变化

### theme
- **作用**: 主题配置
- **变化时机**: 主题更新时
- **注意**: 使用 `useEffect` 监听变化

### colorRules
- **作用**: 颜色规则
- **变化时机**: 颜色规则更新时
- **注意**: 使用 `useEffect` 监听变化

## 性能优化

### useCallback
所有返回的方法都使用 `useCallback` 缓存，避免子组件不必要的重新渲染：
```typescript
const zoomIn = useCallback(() => {
  engineRef.current?.zoomIn();
}, []);
```

### ResizeObserver
使用 ResizeObserver 监听容器尺寸变化，而不是 `window.resize`，更精确且性能更好。

### 请求动画帧
初始化时使用 `requestAnimationFrame` 确保渲染在下一帧执行。
