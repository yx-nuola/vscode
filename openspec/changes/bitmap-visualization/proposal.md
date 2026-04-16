## Why

RRAM测试结果分析依赖人工逐行检查数据，效率低下且难以直观识别存储单元的测试差异。需要开发一个支持二维矩阵图可视化、多模式数据呈现及交互式分析的工具，帮助用户快速定位问题单元、理解测试结果分布。

## What Changes

- 新增 BitmapVisualization 组件，支持 128×1024 规模的二维矩阵图渲染
- 实现基于 Konva.js 的 Canvas 绘制，支持缩放、平移交互
- 开发文件解析模块，支持 JSON/TXT/STDF 格式的前端纯解析
- 实现颜色映射系统，支持用户自定义电流区间颜色配置
- 开发表格-图形双向联动定位功能
- 实现鼠标悬停/点击信息弹窗，展示单元格详细参数

## Capabilities

### New Capabilities

- `bitmap-renderer`: 二维矩阵图渲染引擎，使用 Konva.js 实现 Canvas 绘制，支持 128×1024 规模数据的高性能渲染
- `file-parser`: 文件解析模块，支持 JSON/TXT/STDF 格式的前端纯解析，提取测试数据
- `color-mapping`: 颜色映射系统，支持自定义电流区间与颜色对应关系，实时预览
- `table-graph-linkage`: 表格-图形双向联动，点击图形单元定位表格行，点击表格行定位图形单元
- `cell-info-popup`: 单元格信息弹窗，显示 Vset/Vreset/Imeas 等详细参数，支持多标签页展示

### Modified Capabilities

- 无（本功能为新增模块，不修改现有 capability）

## Impact

- **新增依赖**: `konva`, `react-konva`（Canvas 渲染库）
- **新增目录**: `src/webview/components/bitmap/`（组件主目录）
- **影响模块**: 
  - `src/webview/App.tsx` - 需集成 BitmapVisualization 组件
  - `src/webview/types/index.ts` - 新增数据类型定义
- **性能要求**: 131,072 单元格渲染 ≤ 2秒，交互响应 ≤ 0.5秒
