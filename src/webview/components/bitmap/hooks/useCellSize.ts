import { useState, useEffect, useCallback, useRef } from 'react';
import { CellSizeConfig, DEFAULT_CELL_SIZE } from '../matrixGridTypes';
import { calculateCellSize } from '../utils/cellSizeCalculator';

interface UseCellSizeParams {
	containerRef: React.RefObject<HTMLDivElement | null>;
	dataRows: number;
	dataCols: number;
	config?: CellSizeConfig;
}

interface CellSizeResult {
	cellWidth: number;
	cellHeight: number;
	showHorizontalScrollbar: boolean;
	showVerticalScrollbar: boolean;
	containerWidth: number;
	containerHeight: number;
	recalculate: () => void;
}

export function useCellSize(params: UseCellSizeParams): CellSizeResult {
	const { containerRef, dataRows, dataCols, config = DEFAULT_CELL_SIZE } = params;

	const [dimensions, setDimensions] = useState({
		cellWidth: config.minSize,
		cellHeight: config.minSize,
		showHorizontalScrollbar: false,
		showVerticalScrollbar: false,
		containerWidth: 0,
		containerHeight: 0,
	});

	const resizeObserverRef = useRef<ResizeObserver | null>(null);

	const recalculate = useCallback(() => {
		if (!containerRef.current) return;

		const container = containerRef.current;
		const containerWidth = container.offsetWidth;
		const containerHeight = container.offsetHeight;

		if (containerWidth === 0 || containerHeight === 0) return;

		const result = calculateCellSize({
			containerWidth,
			containerHeight,
			dataRows,
			dataCols,
			config,
		});

		setDimensions({
			...result,
			containerWidth,
			containerHeight,
		});
	}, [containerRef, dataRows, dataCols, config]);

	useEffect(() => {
		recalculate();

		const container = containerRef.current;
		if (!container) return;

		resizeObserverRef.current = new ResizeObserver(() => {
			recalculate();
		});

		resizeObserverRef.current.observe(container);

		return () => {
			if (resizeObserverRef.current) {
				resizeObserverRef.current.disconnect();
			}
		};
	}, [recalculate, containerRef]);

	useEffect(() => {
		recalculate();
	}, [dataRows, dataCols, config, recalculate]);

	return {
		...dimensions,
		recalculate,
	};
}
