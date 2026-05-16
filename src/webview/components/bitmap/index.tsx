/**
 * RRAM 测试结果可视化测试页面
 */

import { useState, useCallback, useMemo } from 'react';
import { BitmapLayout } from './components/BitmapLayout';
import { FileUpload } from './components/FileUpload';
import {
  DataParser,
} from './core';

import type {
  MatrixData,
  BitmapGridConfig,
  ColorRule,
  BitmapTheme,
  ImportMode, 
} from './types';
import { MAX_CELL_SIZE, DEFAULT_CELL_SIZE, START_POSITION, PADDING, SCROLL } from './constants';

import { DARK_THEME, LIGHT_THEME } from './theme/presets';

type ThemeMode = 'light' | 'dark';

export function BitmapTestPage() {
  const [data, setData] = useState<MatrixData | null>(null);
  const [parsedData, setParsedData] = useState<MatrixData | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [colorRules, setColorRules] = useState<ColorRule[]>([
    { min: 0, max: 5, color: '#ff9800' },   // 橙色
    { min: 5, max: 10, color: '#4caf50' },  // 绿色
    { min: 10, max: 100, color: '#ec4646' }, // 红色
  ]);
  const theme: BitmapTheme = themeMode === 'light' ? LIGHT_THEME : DARK_THEME;

  const config: BitmapGridConfig = useMemo(() => ({
    layout: {
      axisSize: START_POSITION,
      scrollbarSize: SCROLL,
      spacing: PADDING,
    },
    theme,
    colorRules,
    initialCellSize: DEFAULT_CELL_SIZE,
    minCellSize: DEFAULT_CELL_SIZE,
    maxCellSize: MAX_CELL_SIZE,
  }), [colorRules, theme]);

  // 处理数据加载
  const handleDataLoad = useCallback(
    (newData: MatrixData, mode: ImportMode) => {
      if (mode === 'overwrite' || !data) {
        setData(newData);
      } else {
        // 追加模式：合并数据
        const mergedData = DataParser.mergeData(data, newData);
        console.log('Merged data:', mergedData);
        setData(mergedData);
      }
    },
    [data, setData]
  );

  // 处理解析
  const handleParse = useCallback(() => {
    if (data) {
      setParsedData(data);
    }
  }, [data]);

  // 处理格子点击
  const handleThemeToggle = useCallback(() => {
    setThemeMode((mode) => mode === 'light' ? 'dark' : 'light');
  }, []);

  const handleColorRuleChange = useCallback((index: number, color: string) => {
    setColorRules((rules) =>
      rules.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, color } : rule
      )
    );
  }, []);

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
          padding: '4px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '16px' }}>RRAM 测试结果可视化</h2>

        {/* 文件上传 */}
        <FileUpload onDataLoad={handleDataLoad} />

        {/* 解析按钮 */}
        {/* {data && !parsedData && ( */}
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
        {/* )} */}

        {/* 数据统计 */}
        <button
          onClick={handleThemeToggle}
          style={{
            padding: '6px 12px',
            backgroundColor: themeMode === 'light' ? '#ffffff' : '#2b2f36',
            color: themeMode === 'light' ? '#1f2329' : '#f5f7fa',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          {themeMode === 'light' ? '暗色主题' : '亮色主题'}
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            fontSize: '12px',
          }}
        >
          <span style={{ color: '#666' }}>Color Rules</span>
          {colorRules.map((rule, index) => (
            <label
              key={`${rule.min}-${rule.max}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 6px',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                backgroundColor: '#fff',
              }}
            >
              <span>{rule.min}-{rule.max}</span>
              <input
                type="color"
                value={rule.color}
                onChange={(event) => handleColorRuleChange(index, event.target.value)}
                style={{
                  width: '22px',
                  height: '22px',
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              />
              <span style={{ color: '#666', minWidth: '56px' }}>{rule.color}</span>
            </label>
          ))}
        </div>

        {data && (
          <div style={{ fontSize: '12px', color: '#666' }}>
            <span>总行数: {data.rows}</span>
            <span style={{ marginLeft: '8px' }}>总列数: {data.cols}</span>
            {/* <span style={{ marginLeft: '8px' }}>总单元数: {data.cells && data.cells.length}</span> */}
          </div>
        )}
      </div>

      {/* 主内容区域 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {parsedData ? (
          <BitmapLayout
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
