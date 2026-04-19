## 1. 类型定义与接口设计

- [x] 1.1 定义 MatrixGridProps 接口，包含 data、cellSize、scrollbar、colorMapping、事件回调等配置
- [x] 1.2 定义 CellSizeConfig 接口，包含 minSize、maxSize、preferredCount
- [x] 1.3 定义 ScrollbarConfig 接口，包含 horizontal、vertical、autoHide
- [x] 1.4 定义 ColorMappingConfig 接口，支持 solid 和 range 两种模式
- [x] 1.5 定义 CellInfo 接口，包含 rowIndex、colIndex、data、position
- [x] 1.6 定义 MatrixData 接口，包含 rows、cols、cells

## 2. 格子尺寸计算逻辑

- [x] 2.1 实现 calculateCellSize 函数，根据容器尺寸和配置计算格子大小
- [x] 2.2 实现 useCellSize hook，管理格子尺寸状态
- [x] 2.3 处理 minSize 约束，确保格子不小于最小值
- [x] 2.4 处理 maxSize 约束，确保格子不超过最大值
- [x] 2.5 根据 preferredCount 计算初始格子尺寸
- [x] 2.6 容器尺寸变化时自动重新计算格子尺寸

## 3. 滚动条配置实现

- [x] 3.1 创建 ScrollbarContainer 组件，包装 Konva 画布
- [x] 3.2 实现横向滚动条显示/隐藏逻辑
- [x] 3.3 实现纵向滚动条显示/隐藏逻辑
- [x] 3.4 实现滚动条拖动同步 Konva 视口位置
- [x] 3.5 实现 autoHide 功能（可选）

## 4. MatrixGrid 核心组件

- [x] 4.1 创建 MatrixGrid 组件基础结构
- [x] 4.2 实现 Konva Stage 和 Layer 初始化
- [x] 4.3 实现单元格渲染，使用虚拟化只渲染可见区域
- [x] 4.4 实现 Ctrl+滚轮缩放功能
- [x] 4.5 实现鼠标拖拽平移功能
- [x] 4.6 实现点击单元格触发回调
- [x] 4.7 实现悬停单元格触发回调（带节流）
- [x] 4.8 实现选中单元格高亮显示

## 5. 颜色映射配置

- [x] 5.1 实现纯色模式（solid），所有单元格显示相同颜色
- [x] 5.2 实现区间映射模式（range），根据值映射颜色
- [x] 5.3 支持自定义 getColor 函数获取颜色
- [x] 5.4 实现颜色预计算，优化渲染性能

## 6. 数据模式配置

- [x] 6.1 实现覆盖模式（overwrite），新数据替换旧数据
- [x] 6.2 实现拼接模式（append），新数据追加到旧数据
- [x] 6.3 拼接模式下处理相同坐标的数据覆盖逻辑
- [x] 6.4 提供数据合并工具函数

## 7. 适配现有 BitmapVisualization

- [x] 7.1 创建 BitmapCanvasAdapter 适配层组件
- [x] 7.2 将现有 RRAM 数据转换为通用 MatrixData 格式
- [x] 7.3 将现有颜色配置转换为 ColorMappingConfig 格式
- [x] 7.4 将现有事件处理转换为回调函数形式
- [ ] 7.5 更新 BitmapVisualization 使用新的 MatrixGrid 组件
- [ ] 7.6 保持现有功能不变，验证无回归

## 8. 测试与文档

- [ ] 8.1 编写 useCellSize hook 单元测试
- [ ] 8.2 编写颜色映射工具函数单元测试
- [ ] 8.3 编写数据合并函数单元测试
- [ ] 8.4 编写 MatrixGrid 组件集成测试
- [ ] 8.5 编写组件使用文档和示例
