## Context

当前 BitmapCanvas 组件基于 Konva.js 实现，但与业务逻辑紧密耦合：
- 数据结构固定为 `{ bl, wl, vset, vreset, imeas }`
- 颜色映射逻辑硬编码在组件内
- 事件处理直接调用 Context dispatch
- 滚动条、缩放等交互行为不可配置

需要将其重构为通用组件，使其他业务场景可以：
1. 只传入数据和配置，无需关心内部实现
2. 通过回调函数处理业务逻辑
3. 自定义格子样式、滚动条、颜色映射等

## Goals / Non-Goals

**Goals:**
- 封装通用的 MatrixGrid 组件，支持完全配置化
- 支持自定义格子最小尺寸和显示数量
- 横向/纵向滚动条独立配置
- 点击/悬停事件支持自定义回调
- 支持 Ctrl+滚轮缩放
- 数据支持覆盖/拼接模式

**Non-Goals:**
- 不修改现有 Konva.js 底层实现
- 不支持非矩形网格（如六边形）
- 不实现数据编辑功能（仅展示）

## Decisions

### D1: 组件 Props 设计 - 配置对象模式

**决定**: 使用配置对象模式，而非多个独立 Props

**备选方案**:
| 方案 | 优点 | 缺点 |
|------|------|------|
| 配置对象模式 | 易于扩展、配置集中 | 配置项多时对象较大 |
| 多个独立 Props | 简单直观 | Props 列表过长，难以维护 |
| Builder 模式 | 灵活性高 | React 不常用，增加复杂度 |

**理由**: 配置对象模式在 React 组件库中广泛使用（如 Arco Design），易于扩展新配置项。

**接口设计**:
```typescript
interface MatrixGridProps {
  // 数据
  data: MatrixData;
  // 尺寸配置
  cellSize: CellSizeConfig;
  // 滚动条配置
  scrollbar: ScrollbarConfig;
  // 颜色配置
  colorMapping: ColorMappingConfig;
  // 事件回调
  onCellClick?: (cell: CellInfo, event: MouseEvent) => void;
  onCellHover?: (cell: CellInfo, event: MouseEvent) => void;
  // 数据模式
  dataMode?: 'overwrite' | 'append';
}
```

### D2: 格子尺寸计算策略

**决定**: 基于最小尺寸和容器尺寸自动计算显示格子数

**策略**:
```typescript
interface CellSizeConfig {
  minSize: number;        // 最小格子尺寸，如 12px
  maxSize?: number;       // 最大格子尺寸（可选）
  preferredCount?: {      // 期望显示格子数（可选）
    horizontal?: number;  // 横向格子数
    vertical?: number;    // 纵向格子数
  };
}
```

计算逻辑：
1. 根据容器尺寸和 `preferredCount` 计算格子尺寸
2. 如果小于 `minSize`，则使用 `minSize` 并显示滚动条
3. 如果有 `maxSize`，格子尺寸不超过该值

### D3: 滚动条配置

**决定**: 使用原生滚动条 + Konva 缩放/平移

**配置**:
```typescript
interface ScrollbarConfig {
  horizontal: boolean;    // 是否显示横向滚动条
  vertical: boolean;      // 是否显示纵向滚动条
  autoHide?: boolean;     // 是否自动隐藏（默认 false）
}
```

### D4: 颜色映射配置

**决定**: 支持两种模式：纯色模式和区间映射模式

```typescript
interface ColorMappingConfig {
  mode: 'solid' | 'range';
  // 纯色模式
  solidColor?: string;
  // 区间映射模式
  ranges?: ColorRange[];
  // 回退颜色
  fallbackColor?: string;
  // 自定义颜色获取函数
  getColor?: (cell: unknown) => string;
}
```

### D5: 事件回调设计

**决定**: 提供单元格信息和原始事件

```typescript
interface CellInfo {
  rowIndex: number;
  colIndex: number;
  data: unknown;         // 原始单元格数据
  position: { x: number; y: number };  // 在矩阵中的位置
}

type CellClickCallback = (cell: CellInfo, event: MouseEvent) => void;
type CellHoverCallback = (cell: CellInfo, event: MouseEvent) => void;
```

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 重构可能影响现有功能 | 现有 BitmapVisualization 需要适配 | 1. 保持向后兼容的适配层 2. 充分测试 |
| 配置项过多导致复杂度高 | 用户使用成本增加 | 1. 提供合理默认值 2. 提供使用示例 |
| 性能优化可能受影响 | 131k 单元格渲染性能 | 保持虚拟化渲染策略 |

## Migration Plan

**阶段 1**: 创建新组件
- 新建 MatrixGrid 组件，不影响现有代码
- 编写单元测试验证组件功能

**阶段 2**: 适配现有功能
- 创建 BitmapCanvas 适配层，调用 MatrixGrid
- 保持现有 API 不变

**阶段 3**: 文档和示例
- 编写组件使用文档
- 提供配置示例

**回滚策略**: 保留原有 BitmapCanvas，可随时切换回旧实现。

## Open Questions

1. 是否需要支持动态调整格子尺寸（运行时调整）？
2. 滚动条样式是否需要可配置（如颜色、宽度）？
3. 是否需要支持虚拟化配置（如缓冲区大小）？
