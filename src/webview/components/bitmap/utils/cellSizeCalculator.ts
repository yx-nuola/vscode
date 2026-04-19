import { CellSizeConfig } from '../matrixGridTypes';

interface CalculateCellSizeParams {
	containerWidth: number;
	containerHeight: number;
	dataRows: number;
	dataCols: number;
	config: CellSizeConfig;
}

interface CalculatedSize {
	cellWidth: number;
	cellHeight: number;
	showHorizontalScrollbar: boolean;
	showVerticalScrollbar: boolean;
}

export function calculateCellSize(params: CalculateCellSizeParams): CalculatedSize {
	const { containerWidth, containerHeight, dataRows, dataCols, config } = params;
	const { minSize, maxSize, preferredCount } = config;

	let cellWidth = minSize;
	let cellHeight = minSize;
	let showHorizontalScrollbar = false;
	let showVerticalScrollbar = false;

	if (preferredCount?.horizontal && preferredCount.horizontal > 0) {
		cellWidth = Math.floor(containerWidth / preferredCount.horizontal);
	}

	if (preferredCount?.vertical && preferredCount.vertical > 0) {
		cellHeight = Math.floor(containerHeight / preferredCount.vertical);
	}

	if (cellWidth < minSize) {
		cellWidth = minSize;
	}

	if (cellHeight < minSize) {
		cellHeight = minSize;
	}

	if (maxSize) {
		cellWidth = Math.min(cellWidth, maxSize);
		cellHeight = Math.min(cellHeight, maxSize);
	}

	const totalWidth = dataCols * cellWidth;
	const totalHeight = dataRows * cellHeight;

	showHorizontalScrollbar = totalWidth > containerWidth;
	showVerticalScrollbar = totalHeight > containerHeight;

	return {
		cellWidth,
		cellHeight,
		showHorizontalScrollbar,
		showVerticalScrollbar,
	};
}

export function getVisibleRange(
	containerWidth: number,
	containerHeight: number,
	cellWidth: number,
	cellHeight: number,
	offsetX: number,
	offsetY: number,
	zoom: number,
	dataRows: number,
	dataCols: number
): { startRow: number; endRow: number; startCol: number; endCol: number } {
	const visibleWidth = containerWidth / zoom;
	const visibleHeight = containerHeight / zoom;

	const startCol = Math.max(0, Math.floor(-offsetX / zoom / cellWidth) - 1);
	const startRow = Math.max(0, Math.floor(-offsetY / zoom / cellHeight) - 1);
	const endCol = Math.min(dataCols, Math.ceil((visibleWidth - offsetX / zoom) / cellWidth) + 1);
	const endRow = Math.min(dataRows, Math.ceil((visibleHeight - offsetY / zoom) / cellHeight) + 1);

	return { startRow, endRow, startCol, endCol };
}
