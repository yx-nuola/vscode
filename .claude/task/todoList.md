# Bitmap Grid 组件实现任务清单

## 阶段 1：基础模块

- [x] 1. types.ts — 所有类型/接口定义
- [x] 2. core/EventBus.ts — 基于 mitt 的事件总线
- [x] 3. core/LayoutCalculator.ts — 统一布局计算
- [x] 4. core/DataManager.ts — 按区域获取数据

## 阶段 2：核心引擎 + 虚拟滚动同步

- [x] 5. core/VirtualScrollSync.ts — 双向滚动条↔虚拟滚动同步
- [x] 6. core/BitmapGridEngine.ts — 主引擎，编排所有模块

## 阶段 3：图层

- [x] 7. layers/ToolbarLayer.ts — 工具栏 Konva 图层
- [x] 8. layers/XAxisScrollbarLayer.ts — X 轴 + 横向滚动条 Konva 图层
- [x] 9. layers/YAxisScrollbarLayer.ts — Y 轴 + 纵向滚动条 Konva 图层
- [x] 10. layers/CellLayer.ts — 格子网格渲染 Konva 图层

## 阶段 4：工具管理器

- [x] 11. tools/ScrollManager.ts — 滚动位置管理 + 边界钳制
- [x] 12. tools/ZoomManager.ts — 缩放管理，边界 2-50px
- [x] 13. tools/SelectionManager.ts — 坐标定位选择
- [x] 14. tools/LocationManager.ts — 定位到格子，确保可见
- [x] 15. tools/EventOptimizer.ts — RAF 调度 + 防抖

## 阶段 5：绘制组件

- [x] 16. draws/ToolbarDraw.ts — 工具栏按钮渲染
- [x] 17. draws/AxisDraw.ts — 坐标轴刻度 + 标签渲染
- [x] 18. draws/ScrollbarDraw.ts — 滚动条轨道 + 滑块渲染
- [x] 19. draws/CellDraw.ts — 格子渲染，含对象池
- [x] 20. draws/HighlightDraw.ts — 选择/高亮覆盖层

## 阶段 6：主题预设

- [x] 21. theme/presets.ts — LIGHT_THEME、DARK_THEME 预设

## 阶段 7：React 集成

- [x] 22. hooks/useBitmapGrid.ts — React Hook
- [x] 23. components/BitmapGrid.tsx — React 组件（forwardRef）
- [x] 24. components/BitmapTableLayout.tsx — 60/40 左右布局

## 阶段 8：公共 API

- [x] 25. index.ts — 公共 API 导出

## 验证阶段

- [x] 26. `npm run build:webview` 构建通过
- [x] 27. `npm run check-types` 类型检查通过
- [ ] 28. 开发服务器测试：加载 64×64 测试数据
- [ ] 29. 大数据测试：128×1024 数据平滑滚动
- [ ] 30. 尺寸调整测试：拖拽 VS Code 面板边缘 → 布局自动重算

---

**总计：30 个任务**

**构建顺序：** 按阶段顺序完成，每个阶段内按编号顺序完成。
