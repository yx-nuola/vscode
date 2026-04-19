import React from 'react';
import { MatrixGrid } from './MatrixGrid';
import {
	MatrixData,
	ColorMappingConfig,
	CellInfo,
} from '../matrixGridTypes';
import { CellData } from '../types';
import { useBitmap } from '../context';

const CELL_SIZE_CONFIG = {
	minSize: 4,
	maxSize: 20,
	preferredCount: {
		horizontal: 200,
		vertical: 50,
	},
};

const SCROLLBAR_CONFIG = {
	horizontal: true,
	vertical: true,
	autoHide: false,
};

interface BitmapCanvasAdapterProps {
	onCellClick?: (cell: CellInfo<CellData>, event: MouseEvent) => void;
	onCellHover?: (cell: CellInfo<CellData>, event: MouseEvent) => void;
}

export const BitmapCanvasAdapter: React.FC<BitmapCanvasAdapterProps> = ({
	onCellClick,
	onCellHover,
}) => {
	const { state, dispatch } = useBitmap();

	const matrixData: MatrixData<CellData> | null = state.data
		? {
				rows: state.data.rows,
				cols: state.data.cols,
				cells: state.data.cells,
				getRowIndex: (cell: CellData) => cell.bl,
				getColIndex: (cell: CellData) => cell.wl,
			}
		: null;

	const colorMapping: ColorMappingConfig<CellData> = {
		mode: 'custom',
		getColor: (cell: CellData) => {
			if (cell.status === 'pass') return '#22c55e';
			if (cell.status === 'fail') return '#ef4444';
			return '#FFFFFF';
		},
		fallbackColor: '#FFFFFF',
	};

	const handleCellClick = (cell: CellInfo<CellData>, event: MouseEvent) => {
		dispatch({
			type: 'SELECT_CELL',
			payload: { bl: cell.rowIndex, wl: cell.colIndex },
		});

		if (onCellClick) {
			onCellClick(cell, event);
		}
	};

	if (!matrixData) {
		return (
			<div className="bitmap-canvas-container">
				<div className="no-data">请上传数据文件</div>
			</div>
		);
	}

	return (
		<MatrixGrid
			data={matrixData}
			cellSize={CELL_SIZE_CONFIG}
			scrollbar={SCROLLBAR_CONFIG}
			colorMapping={colorMapping}
			onCellClick={handleCellClick}
			onCellHover={onCellHover}
		/>
	);
};
