## Why

现有的 BitmapCanvas 组件是一个紧耦合的业务组件，数据结构、事件处理、颜色映射等都硬编码在组件内部。其他业务场景无法直接复用该二维矩阵图组件，每次需要类似功能时都要重新开发。需要将其重构为一个**可配置、可复用的通用组件**，只需传入数据和配置即可快速集成。

## What Changes

- 重构 BitmapCanvas 为通用的 `MatrixGrid` 组件，支持完全配置化
- 新增格子最小展示尺寸配置（如 12px），支持自适应计算显示格子数
- 横向/纵向滚动条可配置显示/隐藏
- 颜色映射支持：全白色模式、自定义颜色区间配置
- 点击单元格事件支持传入回调函数，返回单元格数据和坐标
- 鼠标悬停显示信息，支持自定义信息内容和展示方式
- 数据模式支持拼接/覆盖，用户可配置，默认覆盖模式
- 支持 Ctrl+滚轮缩放矩阵图
- 支持滚动条拖动移动可视区域
- **BREAKING**: 现有 BitmapVisualization 需要适配新的通用组件 API

## Capabilities

### New Capabilities

- `matrix-grid-component`: 通用二维矩阵图组件，支持完全配置化，可复用于不同业务场景
- `cell-size-config`: 格子尺寸配置，支持最小展示尺寸设置和自适应计算
- `scrollbar-config`: 滚动条配置，支持横向/纵向独立控制显示隐藏
- `cell-event-callback`: 单元格事件回调，点击/悬停支持传入自定义回调函数
- `data-mode-config`: 数据模式配置，支持覆盖/拼接模式切换

### Modified Capabilities

- `bitmap-renderer`: 现有渲染器需要适配新的通用组件 API，不再直接依赖业务数据结构

## Impact

- **影响文件**: 
  - `src/webview/components/bitmap/components/BitmapCanvas.tsx` - 重构为 MatrixGrid
  - `src/webview/components/bitmap/index.tsx` - 适配新组件 API
  - `src/webview/components/bitmap/types.ts` - 新增配置类型定义
- **新增文件**:
  - `src/webview/components/bitmap/components/MatrixGrid.tsx` - 通用矩阵图组件
  - `src/webview/components/bitmap/hooks/useMatrixConfig.ts` - 配置处理 Hook
- **API 变化**: 组件 Props 从业务数据结构改为通用配置接口
