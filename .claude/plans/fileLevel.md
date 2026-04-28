src/webview/components/bitmap/
├── components/
│   ├── BitmapGrid.tsx              # 主组件
│   ├── BitmapTableLayout.tsx       # 左右布局（60% 图形 + 40% 表格）
│   ├── VirtualTable.tsx            # 虚拟滚动表格
│   ├── FileUpload.tsx              # 文件上传组件
│   └── BitmapTestPage.tsx          # 测试页面
├── core/
│   ├── BitmapGridEngine.ts         # 主引擎
│   ├── DataManager.ts              # 数据管理器
│   ├── DataParser.ts               # 数据解析器
│   ├── EventBus.ts                 # 事件总线
│   ├── LayoutCalculator.ts         # 布局计算器
│   └── VirtualScrollSync.ts        # 虚拟滚动同步
├── draws/
│   ├── AxisDraw.ts                 # 坐标轴绘制
│   ├── CellDraw.ts                 # 格子绘制
│   ├── HighlightDraw.ts            # 高亮绘制
│   ├── ScrollbarDraw.ts            # 滚动条绘制
│   └── ToolbarDraw.ts              # 工具栏绘制
├── layers/
│   ├── CellLayer.ts                # 格子图层
│   ├── ToolbarLayer.ts             # 工具栏图层
│   ├── XAxisLayer.ts               # X 轴图层
│   ├── YAxisLayer.ts               # Y 轴图层
│   ├── XAxisScrollbarLayer.ts      # X 轴滚动条图层
│   ├── YAxisScrollbarLayer.ts      # Y 轴滚动条图层
│   └── HighlightLayer.ts           # 高亮图层
└── index.ts                        # 公共 API 导出