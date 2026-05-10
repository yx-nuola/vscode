import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BitmapCommands, type BitmapCell, type BitmapTableResponse } from '../../../../shared/bitmapProtocol';
import { useVSCode } from '../../../hooks/useVSCode';

interface BitmapVirtualTableProps {
  onRowClick?: (index: number, cell: BitmapCell) => void;
}

const rowHeight = 30;
const headerHeight = 30;
const overscan = 20;

function getValue(cell: BitmapCell, key: string): string {
  const value = cell.metadata?.[key] ?? (cell as unknown as Record<string, unknown>)[key];
  return value === undefined || value === null ? '' : String(value);
}

export function BitmapVirtualTable({ onRowClick }: BitmapVirtualTableProps) {
  const { request } = useVSCode();
  const containerRef = useRef<HTMLDivElement>(null);
  const [total, setTotal] = useState(0);
  const [start, setStart] = useState(0);
  const [rows, setRows] = useState<BitmapCell[]>([]);
  const [height, setHeight] = useState(400);
  const requestKeyRef = useRef('');

  const loadRange = useCallback(async (nextStart: number, visibleCount: number) => {
    const safeStart = Math.max(0, nextStart - overscan);
    const count = visibleCount + overscan * 2;
    const key = `${safeStart}:${count}`;
    if (requestKeyRef.current === key) {
      return;
    }
    requestKeyRef.current = key;

    const response = await request<BitmapTableResponse>(BitmapCommands.REQUEST_BITMAP_TABLE, {
      start: safeStart,
      count,
    });
    if (requestKeyRef.current !== key) {
      return;
    }
    setStart(response.start);
    setRows(response.cells);
    setTotal(response.total);
  }, [request]);

  useEffect(() => {
    void loadRange(0, Math.ceil(height / rowHeight));
  }, [height, loadRange]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      setHeight(Math.max(120, entry.contentRect.height));
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const onScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    const nextStart = Math.floor(scrollTop / rowHeight);
    const visibleCount = Math.ceil(height / rowHeight);
    void loadRange(nextStart, visibleCount);
  }, [height, loadRange]);

  const columns = useMemo(() => [
    { key: 'bl', title: 'BL', width: 70 },
    { key: 'wl', title: 'WL', width: 70 },
    { key: 'vset', title: 'Vset', width: 90 },
    { key: 'vreset', title: 'Vreset', width: 90 },
    { key: 'imeas', title: 'Imeas', width: 90 },
    { key: 'status', title: 'Status', width: 80 },
  ], []);

  return (
    <div ref={containerRef} style={{ height: '100%', borderLeft: '1px solid #d7dbe3', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: headerHeight, display: 'flex', borderBottom: '1px solid #d7dbe3', background: '#f6f8fa', flexShrink: 0 }}>
        {columns.map((column) => (
          <div key={column.key} style={{ width: column.width, padding: '7px 8px', fontWeight: 600, fontSize: 12 }}>
            {column.title}
          </div>
        ))}
      </div>
      <div onScroll={onScroll} style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <div style={{ height: total * rowHeight, position: 'relative' }}>
          <div style={{ position: 'absolute', top: start * rowHeight, left: 0, right: 0 }}>
            {rows.map((cell, index) => (
              <div
                key={`${cell.row}:${cell.col}`}
                onClick={() => onRowClick?.(start + index, cell)}
                style={{
                  height: rowHeight,
                  display: 'flex',
                  borderBottom: '1px solid #eef0f4',
                  cursor: 'pointer',
                  background: index % 2 === 0 ? '#ffffff' : '#fafbfc',
                }}
              >
                {columns.map((column) => (
                  <div key={column.key} style={{ width: column.width, padding: '7px 8px', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getValue(cell, column.key)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
