/**
 * 基于 VisActor VTable 的虚拟滚动表格组件
 * 用于展示 RRAM 测试数据
 */

import React, { useRef, useEffect, useMemo } from 'react';
import { ListTable, TABLE_EVENT_TYPE } from '@visactor/vtable';
import type {
  ColumnDefine as VTableColumnDefine,
  ListTableConstructorOptions,
  MousePointerCellEvent,
} from '@visactor/vtable';
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
  /** 行高 */
  rowHeight?: number;
  /** 容器高度 */
  height?: number | string;
  /** 行点击回调 */
  onRowClick?: (row: number, cell: CellData) => void;
  /** 高亮行索引 */
  highlightedRow?: number;
  /** 滚动到指定行 */
  scrollToRow?: ScrollToRowRequest;
}

interface TableRecord extends Record<string, unknown> {
  __index: number;
  __cell: CellData;
}

export interface ScrollToRowRequest {
  row: number;
  nonce: number;
}

const TABLE_COLUMNS: TableColumn[] = [
  { key: 'bl', title: 'BL', width: 60 },
  { key: 'wl', title: 'WL', width: 60 },
  { key: 'vset', title: 'Vset', width: 80 },
  { key: 'vreset', title: 'Vreset', width: 80 },
  { key: 'imeas', title: 'Imeas', width: 80 },
  {
    key: 'status',
    title: 'Status',
    width: 80,
    render: (value) => {
      const status = String(value);
      const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'gray';
      return <span style={{ color }}>{status}</span>;
    },
  },
];

function getColumnValue(cell: CellData, key: string): unknown {
  return (cell.metadata?.[key] as unknown) ?? (cell as unknown as Record<string, unknown>)[key];
}

function stringifyCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return JSON.stringify(value);
}

/**
 * 虚拟滚动表格组件
 */
export function VirtualTable({
  data,
  rowHeight = 32,
  height = 400,
  onRowClick,
  highlightedRow,
  scrollToRow,
}: VirtualTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<ListTable | null>(null);
  const onRowClickRef = useRef(onRowClick);
  const highlightedRowRef = useRef(highlightedRow);
  const recordsRef = useRef<TableRecord[]>([]);

  const records = useMemo<TableRecord[]>(
    () =>
      data.map((cell, index) => {
        const record: TableRecord = {
          __index: index,
          __cell: cell,
        };

        for (const column of TABLE_COLUMNS) {
          record[column.key] = stringifyCellValue(getColumnValue(cell, column.key));
        }

        return record;
      }),
    [data]
  );

  const vtableColumns = useMemo<VTableColumnDefine[]>(
    () =>
      TABLE_COLUMNS.map((column) => ({
        field: column.key,
        title: column.title,
        width: column.width ?? 100,
        cellType: 'text',
        style: ({ row, table, value }) => {
          const recordIndex = table.getRecordShowIndexByCell(0, row);
          const record = recordsRef.current[recordIndex];
          const isHighlighted = record?.__index === highlightedRowRef.current;
          const status = String(value ?? '');

          return {
            bgColor: isHighlighted ? '#e3f2fd' : '#ffffff',
            color: column.key === 'status'
              ? status === 'pass'
                ? '#2e7d32'
                : status === 'fail'
                  ? '#c62828'
                  : '#666666'
              : '#1f2329',
            fontSize: 12,
            padding: [0, 8, 0, 8],
            textOverflow: 'ellipsis',
          };
        },
        headerStyle: {
          bgColor: '#f5f5f5',
          color: '#1f2329',
          fontSize: 12,
          fontWeight: 'bold',
          padding: [0, 8, 0, 8],
        },
      })),
    []
  );

  useEffect(() => {
    onRowClickRef.current = onRowClick;
  }, [onRowClick]);

  useEffect(() => {
    highlightedRowRef.current = highlightedRow;
    tableRef.current?.renderWithRecreateCells();
  }, [highlightedRow]);

  useEffect(() => {
    recordsRef.current = records;
  }, [records]);

  // 初始化/更新 VTable。VTable 自带行列虚拟滚动，这里只维护外部 React 生命周期。
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    tableRef.current?.release();

    const options: ListTableConstructorOptions = {
      container: containerRef.current,
      records,
      columns: vtableColumns,
      defaultRowHeight: rowHeight,
      defaultHeaderRowHeight: rowHeight,
      widthMode: 'standard',
      heightMode: 'standard',
      autoFillWidth: true,
      autoFillHeight: true,
      columnResizeMode: 'none',
      rowResizeMode: 'none',
      overscrollBehavior: 'none',
      select: {
        highlightMode: 'row',
        makeSelectCellVisible: true,
      },
      hover: {
        highlightMode: 'row',
      },
      theme: {
        frameStyle: {
          borderColor: '#e0e0e0',
          borderLineWidth: 1,
        },
        bodyStyle: {
          borderColor: '#f0f0f0',
          borderLineWidth: 1,
        },
        headerStyle: {
          borderColor: '#e0e0e0',
          borderLineWidth: 1,
        },
      },
    };

    const table = new ListTable(options);
    tableRef.current = table;

    table.on(TABLE_EVENT_TYPE.CLICK_CELL, (event: MousePointerCellEvent) => {
      const recordIndex = table.getRecordShowIndexByCell(event.col, event.row);
      const record = recordsRef.current[recordIndex];

      if (!record) {
        return;
      }

      onRowClickRef.current?.(record.__index, record.__cell);
    });

    return () => {
      table.release();
      if (tableRef.current === table) {
        tableRef.current = null;
      }
    };
  }, [records, rowHeight, vtableColumns]);

  useEffect(() => {
    if (!scrollToRow || !tableRef.current) {
      return;
    }

    const tableRow = tableRef.current.getTableIndexByRecordIndex(scrollToRow.row);
    const targetTableRow = typeof tableRow === 'number' ? tableRow : scrollToRow.row + 1;
    const visibleRows = containerRef.current
      ? Math.max(1, Math.floor((containerRef.current.clientHeight - rowHeight) / rowHeight))
      : 1;
    const centeredTableRow = Math.max(1, targetTableRow - Math.floor(visibleRows / 2));

    tableRef.current.scrollToRow(centeredTableRow);
    tableRef.current.selectCell(0, targetTableRow, false, false, false);
  }, [scrollToRow]);

  useEffect(() => {
    if (!containerRef.current || !tableRef.current) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      tableRef.current?.resize();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: '100%',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    />
  );
}
