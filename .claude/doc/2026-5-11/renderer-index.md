# renderer/index.ts - Bitmap 渲染器入口

## 概述
这是 Bitmap 组件的渲染器模块入口文件，导出所有核心渲染组件。

## 导出内容

### 工具类
- **EventOptimizer** - 事件优化器，处理滚轮事件和窗口大小调整
- **LocationManager** - 坐标定位管理器，定位格子并确保可见
- **ScrollManager** - 滚动位置管理器，处理滚动和边界钳制
- **SelectionManager** - 选择管理器，管理格子选择状态
- **ZoomManager** - 缩放管理器，处理缩放操作

## 使用示例

```typescript
import { BitmapGridEngine } from '../core/BitmapGridEngine';
import { EventOptimizer, LocationManager, ScrollManager, SelectionManager, ZoomManager } from '../renderer';

// 在引擎中初始化工具
const engine = new BitmapGridEngine(config);
const eventOptimizer = new EventOptimizer(engine);
const locationManager = new LocationManager(engine);
const scrollManager = new ScrollManager(engine);
const selectionManager = new SelectionManager(engine);
const zoomManager = new ZoomManager(engine);
```
