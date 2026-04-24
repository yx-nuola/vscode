/**
 * 测试新 KonvaGridBase 架构
 * 
 * 运行方式：
 * 1. 在 VS Code 中打开此文件
 * 2. 按 F5 启动调试
 * 3. 在 webview 中查看效果
 */

import React, { useRef, useMemo, useState } from 'react';
import { BitmapGrid, type BitmapGridRef } from './components/BitmapGrid';
import { SimpleBitmapGrid } from './renderers';
import type { CellData } from './types';
import type { MatrixData, ColorRange } from './core/interfaces';

export const TestKonvaGridBase: React.FC = () => {
  const gridRef = useRef<BitmapGridRef>(null);
  const [zoom, setZoom] = useState(1);

  // 生成测试数据（64×64）
  const testData = useMemo<MatrixData<CellData>>(() => {
    const cells: CellData[] = [];
    for (let bl = 0; bl < 64; bl++) {
      for (let wl = 0; wl < 64; wl++) {
        const isFail = Math.random() < 0.05;
        cells.push({
          bl,
          wl,
          vset: Math.random() * 5 + 1,
          vreset: Math.random() * 3 + 0.5,
          imeas: Math.random() * 10,
          status: isFail ? 'fail' : 'pass',
        });
      }
    }

    return {
      rows: 64,
      cols: 64,
      cells,
      getRowIndex: (cell: CellData) => cell.bl,
      getColIndex: (cell: CellData) => cell.wl,
    };
  }, []);

  // 创建渲染器
  const renderer = useMemo(() => {
    return new SimpleBitmapGrid(testData);
  }, [testData]);

  // 颜色配置
  const colorRanges: ColorRange[] = [
    { min: 0, max: 3, color: '#FFA500', label: '低电流' },
    { min: 3, max: 7, color: '#4169E1', label: '中电流' },
    { min: 7, max: 10, color: '#8A2BE2', label: '高电流' },
  ];

  // 监听缩放变化
  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  // 处理格子点击
  const handleCellClick = (event: { coord: { row: number; col: number }; cell: CellData | null }) => {
    console.log('点击格子:', event.coord);
    console.log('格子数据:', event.cell);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '20px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h2>KonvaGridBase 测试</h2>
        <p>当前缩放: {zoom.toFixed(2)}x</p>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button onClick={() => gridRef.current?.zoomIn()}>放大</button>
          <button onClick={() => gridRef.current?.zoomOut()}>缩小</button>
          <button onClick={() => gridRef.current?.resetView()}>重置</button>
          <button onClick={() => gridRef.current?.fitToScreen()}>适应屏幕</button>
        </div>
      </div>

      <div style={{ flex: 1, border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
        <BitmapGrid
          ref={gridRef}
          renderer={renderer}
          data={testData}
          colorRanges={colorRanges}
          useStatusColor={true}
          onCellClick={handleCellClick}
          onZoomChange={handleZoomChange}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};

export default TestKonvaGridBase;
