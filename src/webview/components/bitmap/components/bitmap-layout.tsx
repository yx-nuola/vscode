import { useRef, useCallback, useEffect, useState } from 'react';
import { Button, Space } from '@arco-design/web-react';
import { BitmapGrid, BitmapGridRef, BitmapGridProps } from './bitmap-grid';
import { ScrollToRowRequest, VirtualTable } from './virtual-table';
import type { CellData } from '../types';
import {
  BITMAP_WIDTH,
  DEFAULT_COLS,
  DEFAULT_ROWS,
} from '../constants';

export interface BitmapTableLayoutProps extends Omit<BitmapGridProps, 'style'> {
  /** 表格行点击回调 */
  onTableRowClick?: (row: number, cell: CellData) => void;
  /** 格子点击回调 */
  onCellClick?: (col: number, row: number) => void;
}

/**
 * BitmapLayout 组件
 */
export function BitmapLayout(props: BitmapTableLayoutProps) {
  const { onTableRowClick, onCellClick, data, config } = props;

  const bitmapRef = useRef<BitmapGridRef>(null);
  const scrollRequestNonceRef = useRef(0);
  const [highlightedRow, setHighlightedRow] = useState<number | undefined>();
  const [scrollToRow, setScrollToRow] = useState<ScrollToRowRequest | undefined>();
  const dataRows = data?.rows ?? DEFAULT_ROWS;
  const dataCols = data?.cols ?? DEFAULT_COLS;
  const idealBitmapSize =
    config.layout.axisSize +
    config.layout.spacing +
    BITMAP_WIDTH +
    config.layout.spacing +
    config.layout.scrollbarSize;
  const shouldShrinkBitmap = dataRows <= DEFAULT_ROWS && dataCols <= DEFAULT_COLS;

  useEffect(() => {
    // 数据更新清除之前的高亮和选中
    setHighlightedRow(undefined);
    setScrollToRow(undefined);
    bitmapRef.current?.clearSelection();
  }, [data]);

  // 处理表格行点击
  const handleTableRowClick = useCallback(
    (row: number, cell: CellData) => {
      // 图形定位并高亮
      setHighlightedRow(row);
      bitmapRef.current?.locateAndHighlight(cell.col, cell.row);
      onTableRowClick?.(row, cell);
    },
    [onTableRowClick]
  );

  // 处理格子点击
  const handleCellClick = useCallback(
    (col: number, row: number) => {
      onCellClick?.(col, row);

      // 查找对应的表格行索引
      if (data) {
        const rowIndex = data.cells.findIndex(
          (c: CellData) => c.row === row && c.col === col
        );
        if (rowIndex >= 0) {
          setHighlightedRow(rowIndex);
          scrollRequestNonceRef.current += 1;
          setScrollToRow({
            row: rowIndex,
            nonce: scrollRequestNonceRef.current,
          });
        } else {
          setHighlightedRow(undefined);
          setScrollToRow(undefined);
        }
      }
    },
    [onCellClick, data]
  );

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
      }}
    >
      {/* 小数据保持理想尺寸，大数据与右侧表格共同使用可视区宽度 */}
      <div
        style={{
          width: shouldShrinkBitmap ? `min(${idealBitmapSize}px, 100%)` : undefined,
          height: '100%',
          boxShadow: 'inset -1px 0 #e0e0e0',
          flex: shouldShrinkBitmap
            ? `0 0 min(${idealBitmapSize}px, 100%)`
            : '1 1 0',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 工具栏 */}
        <div
          style={{
            padding: '0 8px',
            // borderBottom: '1px solid #e0e0e0',
            // backgroundColor: '#f5f5f5',
          }}
        >
          <Space style={{ display: 'flex' }}>
            <Button size="small" onClick={() => bitmapRef.current?.zoomIn()}>
              放大
            </Button>
            <Button size="small" onClick={() => bitmapRef.current?.zoomOut()}>
              缩小
            </Button>
            <Button size="small" onClick={() => bitmapRef.current?.resetZoom()}>
              还原
            </Button>
          </Space>
        </div>
        <div
          style={{
            flex: '1 1 auto',
            minHeight: 0,
            width: '100%',
            maxHeight: shouldShrinkBitmap ? `${idealBitmapSize}px` : undefined,
            overflow: 'hidden',
          }}
        >
          <BitmapGrid
            ref={bitmapRef}
            data={data}
            config={{
              ...config,
              callbacks: {
                ...config.callbacks,
                onCellClick: (cell) => handleCellClick(cell.col, cell.row),
              },
            }}
          />
        </div>
      </div>
      <div
        style={{
          flex: '1 1 0',
          minWidth: 0,
          height: '100%',
          padding: '8px',
          boxSizing: 'border-box',
          overflow: 'auto',
        }}
      >
        {data && (
          <VirtualTable
            data={data.cells}
            height="100%"
            onRowClick={handleTableRowClick}
            highlightedRow={highlightedRow}
            scrollToRow={scrollToRow}
          />
        )}
      </div>
    </div>
  );
}
