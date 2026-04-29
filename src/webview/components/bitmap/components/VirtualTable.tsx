/**
 * 虚拟滚动表格组件
 * 用于展示 RRAM 测试数据
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { CellData } from '../types';

/**
 * 表格列配置
 */
export interface TableColumn {
  /** 列键 */
  key: string;
  /** 列标题 */
  title: string;
  /** 列宽度 */
  width?: number;
  /** 渲染函数 */
  render?: (value: unknown, row: CellData) => React.ReactNode;
}

/**
 * 表格组件 Props
 */
export interface VirtualTableProps {
  /** 数据 */
  data: CellData[];
  /** 列配置 */
  columns: TableColumn[];
  /** 行高 */
  rowHeight?: number;
  /** 容器高度 */
  height?: number | string;
  /** 行点击回调 */
  onRowClick?: (row: number, cell: CellData) => void;
  /** 高亮行索引 */
  highlightedRow?: number;
  /** 滚动到指定行 */
  scrollToRow?: number;
}

/**
 * 虚拟滚动表格组件
 */
export function VirtualTable({
  data,
  columns,
  rowHeight = 32,
  height = 400,
  onRowClick,
  highlightedRow,
  scrollToRow,
}: VirtualTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(typeof height === 'number' ? height : 400);

  // 计算可见范围
  const visibleCount = Math.ceil(containerHeight / rowHeight);
  const startIndex = Math.floor(scrollTop / rowHeight);
  const endIndex = Math.min(startIndex + visibleCount, data.length);

  // 监听容器尺寸变化
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
        if (typeof height === 'string') {
          setContainerHeight(entry.contentRect.height);
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [height]);

  // 滚动到指定行
  useEffect(() => {
    if (scrollToRow !== undefined && containerRef.current) {
      const targetScrollTop = scrollToRow * rowHeight;
      containerRef.current.scrollTop = targetScrollTop;
      setScrollTop(targetScrollTop);
    }
  }, [scrollToRow, rowHeight]);

  // 处理滚动
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    requestAnimationFrame(() => {
      const scrollTop = e.currentTarget.scrollTop;
      console.log('scrollTop', scrollTop);
      setScrollTop(scrollTop);
    });
  }, []);

  // 处理行点击
  const handleRowClick = useCallback(
    (index: number, cell: CellData) => {
      onRowClick?.(index, cell);
    },
    [onRowClick]
  );

  // 计算列宽
  const columnWidths = columns.map((col) => col.width || 100);
  const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);

  return (
    <div
      ref={containerRef}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        overflow: 'auto',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
      }}
      onScroll={handleScroll}
    >
      <div
        style={{
          width: totalWidth,
          minHeight: data.length * rowHeight,
        }}
      >
        {/* 表头 */}
        <div
          style={{
            display: 'flex',
            position: 'sticky',
            top: 0,
            backgroundColor: '#f5f5f5',
            borderBottom: '1px solid #e0e0e0',
            zIndex: 1,
          }}
        >
          {columns.map((col) => (
            <div
              key={col.key}
              style={{
                width: col.width || 100,
                padding: '8px',
                fontWeight: 'bold',
                fontSize: '12px',
                borderRight: '1px solid #e0e0e0',
                boxSizing: 'border-box',
              }}
            >
              {col.title}
            </div>
          ))}
        </div>

        {/* 表格内容 */}
        <div>
          {data.slice(startIndex, endIndex).map((cell, index) => {
            const actualIndex = startIndex + index;
            const isHighlighted = actualIndex === highlightedRow;

            return (
              <div
                key={`${cell.row}-${cell.col}`}
                style={{
                  display: 'flex',
                  height: rowHeight,
                  borderBottom: '1px solid #f0f0f0',
                  backgroundColor: isHighlighted ? '#e3f2fd' : 'white',
                  cursor: onRowClick ? 'pointer' : 'default',
                }}
                onClick={() => handleRowClick(actualIndex, cell)}
              >
                {columns.map((col) => {
                  const value = (cell.metadata?.[col.key] as unknown) ?? (cell as Record<string, unknown>)[col.key];

                  return (
                    <div
                      key={col.key}
                      style={{
                        width: col.width || 100,
                        padding: '8px',
                        fontSize: '12px',
                        borderRight: '1px solid #f0f0f0',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {col.render ? col.render(value, cell) : String(value ?? '')}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
