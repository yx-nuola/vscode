import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { Table, TableColumnProps } from '@arco-design/web-react';
import { useBitmap, useSelectedCell } from '../context';
import { CellData } from '../types';

export const BitmapDataTable: React.FC = () => {
	const { state, dispatch } = useBitmap();
	const selectedCell = useSelectedCell();
	const tableRef = useRef<HTMLDivElement>(null);

	const columns: TableColumnProps[] = useMemo(() => [
		{
			title: 'BL (行)',
			dataIndex: 'bl',
			width: 80,
			sorter: (a: CellData, b: CellData) => a.bl - b.bl,
		},
		{
			title: 'WL (列)',
			dataIndex: 'wl',
			width: 80,
			sorter: (a: CellData, b: CellData) => a.wl - b.wl,
		},
		{
			title: 'Vset (V)',
			dataIndex: 'vset',
			width: 100,
			sorter: (a: CellData, b: CellData) => a.vset - b.vset,
		},
		{
			title: 'Vreset (V)',
			dataIndex: 'vreset',
			width: 100,
			sorter: (a: CellData, b: CellData) => a.vreset - b.vreset,
		},
		{
			title: 'Imeas (mA)',
			dataIndex: 'imeas',
			width: 100,
			sorter: (a: CellData, b: CellData) => a.imeas - b.imeas,
		},
		{
			title: '状态',
			dataIndex: 'status',
			width: 80,
			render: (status: string) => {
				const color = status === 'pass' ? 'rgb(var(--success-6))' : status === 'fail' ? 'rgb(var(--danger-6))' : 'rgb(var(--gray-6))';
				return (
					<span style={{ color }}>
						{status === 'pass' ? 'Pass' : status === 'fail' ? 'Fail' : '-'}
					</span>
				);
			},
		},
	], []);

	const handleRowClick = useCallback((row: CellData) => {
		dispatch({ type: 'SELECT_CELL', payload: { bl: row.bl, wl: row.wl } });
	}, [dispatch]);

	useEffect(() => {
		if (selectedCell && tableRef.current) {
			const rowElement = tableRef.current.querySelector(
				`tr[data-row-key="${selectedCell.bl}-${selectedCell.wl}"]`
			);
			if (rowElement) {
				rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		}
	}, [selectedCell]);

	if (!state.data || state.data.cells.length === 0) {
		return (
			<div className="bitmap-data-table-empty">
				暂无数据
			</div>
		);
	}

	return (
		<div className="bitmap-data-table" ref={tableRef}>
			<Table
				columns={columns}
				data={state.data.cells}
				rowKey={(record: CellData) => `${record.bl}-${record.wl}`}
				pagination={{
					pageSize: 100,
					showTotal: true,
					showJumper: true,
				}}
				scroll={{ y: 400 }}
				stripe
				onRow={(record: CellData) => ({
					onClick: () => handleRowClick(record),
					style: {
						cursor: 'pointer',
						backgroundColor:
							selectedCell?.bl === record.bl && selectedCell?.wl === record.wl
								? 'rgba(var(--primary-6), 0.1)'
								: undefined,
					},
				})}
			/>
		</div>
	);
};
