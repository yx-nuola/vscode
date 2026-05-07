/**
 * RRAM 测试结果可视化测试页面
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  BitmapTableLayout,
  FileUpload,
  DataParser,
  ImportMode,
  MatrixData,
  ColorRule,
  LIGHT_THEME,
  type BitmapGridConfig,
} from '..';

/**
 * 测试页面组件
 */
export function BitmapTestPage() {
  const [data, setData] = useState<MatrixData | null>(null);
  const [parsedData, setParsedData] = useState<MatrixData | null>(null);
  const [colorRules, setColorRules] = useState<ColorRule[]>([
    { min: 0, max: 5, color: '#ff9800' },   // 橙色
    { min: 5, max: 10, color: '#2196f3' },  // 蓝色
    { min: 10, max: 100, color: '#4caf50' }, // 绿色
  ]);

  // 使用 useMemo 确保 config 对象在 colorRules 变化时重新创建
  const config: BitmapGridConfig = useMemo(() => ({
    layout: {
      toolbarHeight: 40,
      axisSize: 40,
      scrollbarSize: 12,
      spacing: 4,
    },
    theme: LIGHT_THEME,
    colorRules,
    initialCellSize: 10,
    minCellSize: 2,
    maxCellSize: 50,
  }), [colorRules]);

  // 处理数据加载
  const handleDataLoad = useCallback(
    (newData: MatrixData, mode: ImportMode) => {
      if (mode === 'overwrite' || !data) {
        setData(newData);
      } else {
        // 追加模式：合并数据
        const mergedData = DataParser.mergeData(data, newData);
        setData(mergedData);
      }
    },
    [data]
  );

  // 处理解析
  const handleParse = useCallback(() => {
    if (data) {
      setParsedData(data);
    }
  }, [data]);

  // 处理格子点击
  const handleCellClick = useCallback((col: number, row: number) => {
    console.log('Cell clicked:', { col, row });
  }, []);

  // 处理表格行点击
  const handleTableRowClick = useCallback((row: number, cell: any) => {
    console.log('Table row clicked:', { row, cell });
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部工具栏 */}
      <div
        style={{
          padding: '12px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '16px' }}>RRAM 测试结果可视化</h2>

        {/* 文件上传 */}
        <FileUpload onDataLoad={handleDataLoad} />

        {/* 解析按钮 */}
        {data && !parsedData && (
          <button
            onClick={handleParse}
            style={{
              padding: '6px 12px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            解析数据
          </button>
        )}

        {/* 数据统计 */}
        {data && (
          <div style={{ fontSize: '12px', color: '#666' }}>
            <span>总行数: {data.rows}</span>
            <span style={{ marginLeft: '8px' }}>总列数: {data.cols}</span>
            <span style={{ marginLeft: '8px' }}>总单元数: {data.cells.length}</span>
          </div>
        )}
      </div>

      {/* 主内容区域 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {parsedData ? (
          <BitmapTableLayout
            config={config}
            data={parsedData}
            onCellClick={handleCellClick}
            onTableRowClick={handleTableRowClick}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#999',
              fontSize: '14px',
            }}
          >
            {data ? '请点击"解析数据"按钮开始可视化' : '请上传 JSON 格式的测试数据文件'}
          </div>
        )}
      </div>
    </div>
  );
}
