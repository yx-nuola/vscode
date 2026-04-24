import React, { useRef, useMemo, useState, useCallback } from 'react';
import { BitmapGrid, type BitmapGridRef } from './BitmapGrid';
import { SimpleBitmapGrid, PerformanceBitmapGrid } from '../renderers';
import type { CellData } from '../renderers/SimpleBitmapGrid';
import type { ColorRange } from '../core/interfaces';
import { Button, Select, InputNumber, Space, Card, Tooltip } from '@arco-design/web-react';
import {
  IconZoomIn,
  IconZoomOut,
  IconRefresh,
  IconFullscreen,
} from '@arco-design/web-react/icon';

const { Option } = Select;

/**
 * BitmapGridDemo 示例组件
 * 
 * 展示如何使用 BitmapGrid 组件
 * 包含：
 * - 缩放控制工具栏
 * - 颜色配置面板
 * - 选择信息显示
 * - 模式切换（普通/高性能）
 */
export const BitmapGridDemo: React.FC = () => {
  const gridRef = useRef<BitmapGridRef>(null);
  
  // 模拟数据
  const [data] = useState<CellData[]>(() => {
    const cells: CellData[] = [];
    for (let bl = 0; bl < 128; bl++) {
      for (let wl = 0; wl < 1024; wl++) {
        const isFail = Math.random() < 0.05; // 5% 失败率
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
    return cells;
  });

  const matrixData = useMemo(
    () => ({
      rows: 128,
      cols: 1024,
      cells: data,
      getRowIndex: (cell: CellData) => cell.bl,
      getColIndex: (cell: CellData) => cell.wl,
    }),
    [data]
  );

  // 渲染器选择
  const [rendererMode, setRendererMode] = useState<'simple' | 'performance'>('simple');
  
  const renderer = useMemo(() => {
    if (rendererMode === 'performance') {
      return new PerformanceBitmapGrid(matrixData);
    }
    return new SimpleBitmapGrid(matrixData);
  }, [matrixData, rendererMode]);

  // 颜色配置
  const [colorRanges, setColorRanges] = useState<ColorRange[]>([
    { min: 0, max: 3, color: '#FFA500', label: '低电流' },
    { min: 3, max: 7, color: '#4169E1', label: '中电流' },
    { min: 7, max: 10, color: '#8A2BE2', label: '高电流' },
  ]);

  const [useStatusColor, setUseStatusColor] = useState(true);
  
  // 选中信息
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedData, setSelectedData] = useState<CellData | null>(null);

  // 缩放控制
  const handleZoomIn = useCallback(() => gridRef.current?.zoomIn(), []);
  const handleZoomOut = useCallback(() => gridRef.current?.zoomOut(), []);
  const handleReset = useCallback(() => gridRef.current?.resetView(), []);
  const handleFit = useCallback(() => gridRef.current?.fitToScreen(), []);

  // 颜色配置
  const handleColorChange = useCallback((index: number, field: keyof ColorRange, value: number | string) => {
    setColorRanges((prev) => {
      const next = [...prev];
      if (field === 'min' || field === 'max') {
        next[index] = { ...next[index], [field]: value as number };
      } else {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  }, []);

  // 添加颜色区间
  const handleAddRange = useCallback(() => {
    setColorRanges((prev) => [
      ...prev,
      { min: prev[prev.length - 1]?.max || 0, max: 10, color: '#808080' },
    ]);
  }, []);

  // 删除颜色区间
  const handleRemoveRange = useCallback((index: number) => {
    setColorRanges((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // 格子点击事件
  const handleCellClick = useCallback((event: { coord: { row: number; col: number }; cell: CellData | null }) => {
    setSelectedCell(event.coord);
    setSelectedData(event.cell);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '20px' }}>
      {/* 工具栏 */}
      <Card style={{ marginBottom: '16px' }}>
        <Space>
          <Select
            value={rendererMode}
            onChange={(v) => setRendererMode(v as 'simple' | 'performance')}
            style={{ width: '120px' }}
          >
            <Option value="simple">标准模式</Option>
            <Option value="performance">高性能模式</Option>
          </Select>

          <Tooltip content="放大">
            <Button type="secondary" icon={<IconZoomIn />} onClick={handleZoomIn} />
          </Tooltip>
          <Tooltip content="缩小">
            <Button type="secondary" icon={<IconZoomOut />} onClick={handleZoomOut} />
          </Tooltip>
          <Tooltip content="重置">
            <Button type="secondary" icon={<IconRefresh />} onClick={handleReset} />
          </Tooltip>
          <Tooltip content="适应屏幕">
            <Button type="secondary" icon={<IconFullscreen />} onClick={handleFit} />
          </Tooltip>

          <Button type={useStatusColor ? 'primary' : 'secondary'} onClick={() => setUseStatusColor(!useStatusColor)}>
            {useStatusColor ? '使用状态颜色' : '使用电流颜色'}
          </Button>
        </Space>
      </Card>

      {/* 主内容区 */}
      <div style={{ display: 'flex', flex: 1, gap: '16px' }}>
        {/* 颜色配置面板 */}
        <Card title="颜色配置" style={{ width: '300px', flexShrink: 0 }}>
          <div style={{ marginBottom: '16px' }}>
            {colorRanges.map((range, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  padding: '8px',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                }}
              >
                <InputNumber
                  style={{ width: '60px' }}
                  value={range.min}
                  onChange={(v) => handleColorChange(index, 'min', v as number)}
                  size="small"
                />
                <span>-</span>
                <InputNumber
                  style={{ width: '60px' }}
                  value={range.max}
                  onChange={(v) => handleColorChange(index, 'max', v as number)}
                  size="small"
                />
                <input
                  type="color"
                  value={range.color}
                  onChange={(e) => handleColorChange(index, 'color', e.target.value)}
                  style={{ width: '40px', height: '28px', border: 'none', cursor: 'pointer' }}
                />
                <Button type="text" size="small" onClick={() => handleRemoveRange(index)}>
                  删除
                </Button>
              </div>
            ))}
            <Button type="outline" onClick={handleAddRange} style={{ width: '100%' }}>
              添加颜色区间
            </Button>
          </div>

          {selectedCell && selectedData && (
            <div style={{ borderTop: '1px solid #eee', paddingTop: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0' }}>选中格子信息</h4>
              <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
                <div>BL: {selectedCell.row}</div>
                <div>WL: {selectedCell.col}</div>
                <div>状态: {selectedData.status}</div>
                <div>Vset: {selectedData.vset.toFixed(2)}V</div>
                <div>Vreset: {selectedData.vreset.toFixed(2)}V</div>
                <div>Imeas: {selectedData.imeas.toFixed(2)}mA</div>
              </div>
            </div>
          )}
        </Card>

        {/* 网格展示区 */}
        <Card style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <BitmapGrid
            ref={gridRef}
            renderer={renderer}
            data={matrixData}
            colorRanges={colorRanges}
            useStatusColor={useStatusColor}
            onCellClick={handleCellClick}
            onZoomChange={(zoom) => console.log('Zoom:', zoom)}
            style={{ flex: 1, minHeight: '500px' }}
          />
        </Card>
      </div>
    </div>
  );
};

export default BitmapGridDemo;
