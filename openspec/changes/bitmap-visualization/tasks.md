## 1. 环境配置与依赖安装

- [x] 1.1 安装 konva 和 react-konva 依赖
- [x] 1.2 在 `src/webview/components/bitmap/` 创建组件目录结构
- [x] 1.3 在 `src/webview/components/bitmap/types.ts` 定义 TypeScript 类型
- [x] 1.4 在 `src/webview/components/bitmap/context/` 创建 DataContext 和 reducer

## 2. 文件解析模块实现

- [x] 2.1 在 `src/webview/components/bitmap/parsers/types.ts` 创建解析器接口和类型定义
- [x] 2.2 实现 JSONParser 用于解析 JSON 格式文件
- [x] 2.3 实现 TXTParser 用于解析带分隔符的 TXT 文件，支持自动检测分隔符
- [x] 2.4 实现 STDFParser 用于解析 STDF 格式文件
- [x] 2.5 创建 ParserFactory 根据文件扩展名选择合适的解析器
- [x] 2.6 在解析前添加文件验证逻辑
- [x] 2.7 实现大文件解析进度回调
- [x] 2.8 默认上传文件是覆盖模式，数据覆盖，开启合并按钮，上传的文件解析之后数据进行拼接

## 3. 颜色映射系统

- [x] 3.1 创建 ColorConfig 组件，包含区间输入 UI
- [x] 3.2 实现颜色区间验证和 RGB 输入处理
- [x] 3.3 创建颜色预计算工具以提升性能
- [x] 3.4 实现默认配色方案（Pass/Fail）
- [x] 3.5 为超出范围的值添加回退颜色
- [x] 3.6 将颜色配置连接到 DataContext

## 4. 位图渲染器 (Konva.js)

- [x] 4.1 创建 BitmapCanvas 组件，包含 Stage 和 Layer 设置
- [x] 4.2 实现分块单元格渲染（64x64 块）
- [x] 4.3 添加基于视口的虚拟化（仅渲染可见块）
- [x] 4.4 实现单元格点击处理和选中高亮
- [x] 4.5 添加鼠标滚轮缩放功能
- [x] 4.6 实现鼠标拖拽平移功能
- [x] 4.7 创建缩放级别指示器组件
- [x] 4.8 使用 React.memo 和 FastLayer 优化静态元素

## 5. 表格视图与联动

- [x] 5.1 使用 Arco Design Table 创建 DataTable 组件
- [x] 5.2 实现点击表格行高亮对应的位图单元格
- [x] 5.3 实现点击二维矩形单元格滚动并高亮对应的表格行
- [x] 5.4 添加键盘导航（方向键）用于联动选择
- [x] 5.5 确保两个视图之间的选择状态同步

## 6. 单元格信息弹窗

- [x] 6.1 创建 CellInfoPopup 组件，包含弹窗结构
- [x] 6.2 实现"Information"标签页，显示 Vset、Vreset、Imeas
- [x] 6.3 实现"Address"标签页，显示 BL、WL 坐标
- [x] 6.4 实现"Logical"标签页，显示逻辑地址数据
- [x] 6.5 添加悬停提示组件用于快速查看单元格信息
- [x] 6.6 实现智能定位，避免超出视口边界
- [x] 6.7 添加点击外部关闭弹窗的行为

## 7. 集成与完善

- [x] 7.1 创建主 BitmapVisualization 组件，组合所有子组件
- [x] 7.2 添加文件上传 UI，支持拖拽上传
- [x] 7.3 实现加载状态和进度指示器
- [x] 7.4 添加错误处理和用户友好的错误提示
- [x] 7.5 将 BitmapVisualization 集成到 App.tsx
- [x] 7.6 添加与现有项目设计风格一致的 CSS 样式
- [x] 7.7 使用 128x1024 数据集进行性能测试

## 8. 测试

- [x] 8.1 为 JSONParser 编写单元测试
- [x] 8.2 为 TXTParser 编写单元测试
- [x] 8.3 为颜色映射工具编写单元测试
- [x] 8.4 为表格-图形联动编写集成测试
- [x] 8.5 验证性能指标（渲染 < 2秒，交互响应 < 0.5秒）
