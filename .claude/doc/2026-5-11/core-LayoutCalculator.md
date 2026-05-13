# core/LayoutCalculator.ts - 布局计算器

## 概述
`LayoutCalculator` 负责计算 Bitmap 网格各区域的位置和尺寸，包括坐标轴、格子区域和滚动条区域。

## 核心功能

### 布局计算
- 计算格子区域位置和尺寸
- 计算坐标轴位置和尺寸
- 计算滚动条位置和尺寸

### 布局配置
- 更新布局配置
- 获取当前布局配置

## 核心属性

```typescript
private config: LayoutConfig;  // 布局配置
```

## 核心方法

### 布局计算

#### `calculate(containerWidth: number, containerHeight: number): LayoutResult`
计算各区域位置

**参数**:
- `containerWidth`: 容器宽度
- `containerHeight`: 容器高度

**返回**: `LayoutResult` 对象

**计算逻辑**:
```typescript
const { axisSize, scrollbarSize, spacing } = this.config;

// 格子区域（固定宽度 896px，高度根据容器计算）
const cellArea: Area = {
  x: axisSize + spacing,
  y: axisSize + spacing,
  width: BITMAP_WIDTH,
  height: containerHeight - axisSize - spacing - scrollbarSize - spacing,
};

// X 轴区域（工具栏下方，Y 轴右侧）
const xAxis: Area = {
  x: axisSize + spacing,
  y: 0,
  width: BITMAP_WIDTH,
  height: axisSize,
};

// Y 轴区域（工具栏下方，左侧）
const yAxis: Area = {
  x: 0,
  y: axisSize + spacing,
  width: axisSize,
  height: cellArea.height,
};

// 横向滚动条区域（格子区域下方）
const horizontalScrollbar: Area = {
  x: axisSize + spacing,
  y: axisSize + spacing + cellArea.height + spacing,
  width: BITMAP_WIDTH,
  height: scrollbarSize,
};

// 纵向滚动条区域（格子区域右侧）
const verticalScrollbar: Area = {
  x: axisSize + spacing + BITMAP_WIDTH + spacing,
  y: axisSize + spacing,
  width: scrollbarSize,
  height: cellArea.height,
};
```

**布局示意图**:
```
┌──────────────────────────────────────────┐
│  Y 轴 (axisSize)                          │
│  ┌──────────────────────────────────────┐ │
│  │  格子区域 (BITMAP_WIDTH)              │ │
│  │  ┌─────┬─────┬─────┬─────┬─────┐    │ │
│  │  │     │     │     │     │     │    │ │
│  │  └─────┴─────┴─────┴─────┴─────┘    │ │
│  │  ┌─────┬─────┬─────┬─────┬─────┐    │ │
│  │  │     │     │     │     │     │    │ │
│  │  └─────┴─────┴─────┴─────┴─────┘    │ │
│  └──────────────────────────────────────┘ │
│  ┌──────────────────────────────────────┐ │
│  │  X 轴 (axisSize)                      │ │
│  └──────────────────────────────────────┘ │
│  ┌──────────────────────────────────────┐ │
│  │  横向滚动条 (scrollbarSize)           │ │
│  └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
│  纵向滚动条 (scrollbarSize)               │
└──────────────────────────────────────────┘
```

**使用示例**:
```typescript
const layoutCalculator = new LayoutCalculator({
  axisSize: 30,
  scrollbarSize: 16,
  spacing: 4,
});

const layout = layoutCalculator.calculate(1000, 600);
console.log('格子区域:', layout.cellArea);
console.log('X 轴区域:', layout.xAxis);
console.log('Y 轴区域:', layout.yAxis);
console.log('横向滚动条:', layout.horizontalScrollbar);
console.log('纵向滚动条:', layout.verticalScrollbar);
```

### 配置管理

#### `updateConfig(config: Partial<LayoutConfig>): void`
更新布局配置

```typescript
this.config = { ...this.config, ...config };
```

**使用示例**:
```typescript
layoutCalculator.updateConfig({
  axisSize: 40,
  scrollbarSize: 20,
});
```

#### `getConfig(): LayoutConfig`
获取当前布局配置

```typescript
return { ...this.config };
```

## 数据结构

### LayoutConfig 接口
```typescript
interface LayoutConfig {
  axisSize: number;           // 坐标轴尺寸（X 轴和 Y 轴）
  scrollbarSize: number;      // 滚动条尺寸（X 轴和 Y 轴）
  spacing: number;            // 间距
}
```

### LayoutResult 接口
```typescript
interface LayoutResult {
  xAxis: Area;                // X 轴区域
  yAxis: Area;                // Y 轴区域
  cellArea: Area;             // 格子区域
  horizontalScrollbar: Area;  // 横向滚动条区域
  verticalScrollbar: Area;    // 纵向滚动条区域
}
```

### Area 接口
```typescript
interface Area {
  x: number;      // X 坐标
  y: number;      // Y 坐标
  width: number;  // 宽度
  height: number; // 高度
}
```

## 使用示例

### 在引擎中使用
```typescript
import { BitmapGridEngine } from './core';

const engine = new BitmapGridEngine(config);

const layoutCalculator = engine.getLayoutCalculator();

// 计算布局
const layout = layoutCalculator.calculate(1000, 600);
console.log('格子区域:', layout.cellArea);

// 更新配置
layoutCalculator.updateConfig({
  axisSize: 40,
  scrollbarSize: 20,
});
```

### 在图层中使用
```typescript
import { AxisLayer } from '../renderer/layers';

class AxisLayer {
  private getLayout() {
    return this.engine.getLayoutCalculator().calculate(
      this.engine.getStage()?.width() || 0,
      this.engine.getStage()?.height() || 0
    );
  }
}
```

## 注意事项

1. **格子区域宽度**: 固定为 `BITMAP_WIDTH`（896px）
2. **格子区域高度**: 根据容器高度计算，减去坐标轴和滚动条
3. **坐标轴位置**: 固定在顶部和左侧
4. **滚动条位置**: 固定在底部和右侧
5. **间距**: 坐标轴和滚动条与格子区域之间有间距
