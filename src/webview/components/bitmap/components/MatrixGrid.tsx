import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import Konva from 'konva';
import {
	MatrixGridProps,
	CellInfo,
	DEFAULT_CELL_SIZE,
	DEFAULT_SCROLLBAR,
	DEFAULT_COLOR_MAPPING,
} from '../matrixGridTypes';
import { useCellSize } from '../hooks/useCellSize';
import { getVisibleRange } from '../utils/cellSizeCalculator';
import { ScrollbarContainer } from './ScrollbarContainer';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;
const HOVER_THROTTLE_MS = 50;

export function MatrixGrid<T = unknown>({
	data,
	cellSize = DEFAULT_CELL_SIZE,
	scrollbar = DEFAULT_SCROLLBAR,
	colorMapping = DEFAULT_COLOR_MAPPING,
	onCellClick,
	onCellHover,
	className,
	style,
}: MatrixGridProps<T>) {
	const containerRef = useRef<HTMLDivElement>(null);
	const stageRef = useRef<Konva.Stage | null>(null);
	const layerRef = useRef<Konva.Layer | null>(null);
	const cellsGroupRef = useRef<Konva.Group | null>(null);

	const [zoom, setZoom] = useState(1);
	const [offsetX, setOffsetX] = useState(0);
	const [offsetY, setOffsetY] = useState(0);
	const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
	const [hoverThrottle, setHoverThrottle] = useState(0);

	const rows = data.rows;
	const cols = data.cols;

	const getRowIndex = data.getRowIndex ?? ((_cell: unknown, index: number) => index % rows);
	const getColIndex = data.getColIndex ?? ((_cell: unknown, index: number) => Math.floor(index / rows));

	const cellSizeResult = useCellSize({
		containerRef,
		dataRows: rows,
		dataCols: cols,
		config: cellSize,
	});

	const { cellWidth, cellHeight, showHorizontalScrollbar, showVerticalScrollbar } = cellSizeResult;

	const getColor = useCallback(
		(cell: T): string => {
			if (colorMapping.mode === 'solid' && colorMapping.solidColor) {
				return colorMapping.solidColor;
			}

			if (colorMapping.mode === 'custom' && colorMapping.getColor) {
				return colorMapping.getColor(cell);
			}

			if (colorMapping.mode === 'range' && colorMapping.ranges && colorMapping.getValue) {
				const value = colorMapping.getValue(cell);
				for (const range of colorMapping.ranges) {
					if (value >= range.min && value < range.max) {
						return range.color;
					}
				}
				return colorMapping.fallbackColor || '#CCCCCC';
			}

			return colorMapping.fallbackColor || '#FFFFFF';
		},
		[colorMapping]
	);

	const cellMap = useMemo(() => {
		const map = new Map<string, T>();
		data.cells.forEach((cell, index) => {
			const row = getRowIndex(cell, index);
			const col = getColIndex(cell, index);
			map.set(`${row}-${col}`, cell);
		});
		return map;
	}, [data, getRowIndex, getColIndex]);

	useEffect(() => {
		if (!containerRef.current || data.cells.length === 0) return;

		if (!stageRef.current) {
			const stage = new Konva.Stage({
				container: containerRef.current,
				width: cellSizeResult.containerWidth || 800,
				height: cellSizeResult.containerHeight || 600,
			});

			const layer = new Konva.Layer({ listening: true });
			const cellsGroup = new Konva.Group();

			layer.add(cellsGroup);
			stage.add(layer);

			stageRef.current = stage;
			layerRef.current = layer;
			cellsGroupRef.current = cellsGroup;

			stage.on('wheel', (e) => {
				e.evt.preventDefault();

				if (!e.evt.ctrlKey) {
					const dx = e.evt.deltaX;
					const dy = e.evt.deltaY;

					const contentWidth = cols * cellWidth * zoom;
					const contentHeight = rows * cellHeight * zoom;
					const viewportWidth = stage.width();
					const viewportHeight = stage.height();

					setOffsetX((prev) => Math.max(-(contentWidth - viewportWidth), Math.min(0, prev - dx)));
					setOffsetY((prev) => Math.max(-(contentHeight - viewportHeight), Math.min(0, prev - dy)));
					return;
				}

				const oldScale = zoom;
				const pointer = stage.getPointerPosition();
				if (!pointer) return;

				const scaleBy = 1.1;
				const newScale = e.evt.deltaY < 0
					? Math.min(oldScale * scaleBy, MAX_ZOOM)
					: Math.max(oldScale / scaleBy, MIN_ZOOM);

				const mousePointTo = {
					x: (pointer.x - stage.x()) / oldScale,
					y: (pointer.y - stage.y()) / oldScale,
				};

				const newOffsetX = pointer.x - mousePointTo.x * newScale;
				const newOffsetY = pointer.y - mousePointTo.y * newScale;

				setZoom(newScale);
				setOffsetX(newOffsetX);
				setOffsetY(newOffsetY);
			});

			let isDragging = false;
			let lastPos = { x: 0, y: 0 };

			stage.on('mousedown', (e) => {
				if (e.evt.button === 0) {
					isDragging = true;
					lastPos = { x: e.evt.clientX, y: e.evt.clientY };
					stage.container().style.cursor = 'grabbing';
				}
			});

			stage.on('mousemove', (e) => {
				const now = Date.now();
				if (now - hoverThrottle < HOVER_THROTTLE_MS) return;
				setHoverThrottle(now);

				if (!isDragging && onCellHover) {
					const pointer = stage.getPointerPosition();
					if (pointer) {
						const x = (pointer.x - stage.x()) / zoom / cellWidth;
						const y = (pointer.y - stage.y()) / zoom / cellHeight;

						const col = Math.floor(x);
						const row = Math.floor(y);

						if (row >= 0 && row < rows && col >= 0 && col < cols) {
							const cell = cellMap.get(`${row}-${col}`);
							if (cell) {
								const cellInfo: CellInfo<T> = {
									rowIndex: row,
									colIndex: col,
									data: cell,
									position: { x: col * cellWidth, y: row * cellHeight },
								};
								onCellHover(cellInfo, e.evt);
							}
						}
					}
				} else if (isDragging) {
					const dx = e.evt.clientX - lastPos.x;
					const dy = e.evt.clientY - lastPos.y;

					setOffsetX((prev) => prev + dx);
					setOffsetY((prev) => prev + dy);

					lastPos = { x: e.evt.clientX, y: e.evt.clientY };
				}
			});

			stage.on('mouseup', () => {
				isDragging = false;
				stage.container().style.cursor = 'default';
			});

			stage.on('click', (e) => {
				if (isDragging) return;

				const pointer = stage.getPointerPosition();
				if (!pointer) return;

				const x = (pointer.x - stage.x()) / zoom / cellWidth;
				const y = (pointer.y - stage.y()) / zoom / cellHeight;

				const col = Math.floor(x);
				const row = Math.floor(y);

				if (row >= 0 && row < rows && col >= 0 && col < cols) {
					setSelectedCell({ row, col });

					if (onCellClick) {
						const cell = cellMap.get(`${row}-${col}`);
						if (cell) {
							const cellInfo: CellInfo<T> = {
								rowIndex: row,
								colIndex: col,
								data: cell,
								position: { x: col * cellWidth, y: row * cellHeight },
							};
							onCellClick(cellInfo, e.evt);
						}
					}
				}
			});
		}

		return () => {
			if (stageRef.current) {
				stageRef.current.destroy();
				stageRef.current = null;
				layerRef.current = null;
				cellsGroupRef.current = null;
			}
		};
	}, [data.cells.length]);

	useEffect(() => {
		if (!stageRef.current) return;

		const stage = stageRef.current;
		stage.scaleX(zoom);
		stage.scaleY(zoom);
		stage.x(offsetX);
		stage.y(offsetY);
		stage.batchDraw();
	}, [zoom, offsetX, offsetY]);

	useEffect(() => {
		if (!stageRef.current || !cellsGroupRef.current || !layerRef.current) return;

		const stage = stageRef.current;
		const cellsGroup = cellsGroupRef.current;
		const layer = layerRef.current;

		cellsGroup.destroyChildren();

		const { startRow, endRow, startCol, endCol } = getVisibleRange(
			stage.width(),
			stage.height(),
			cellWidth,
			cellHeight,
			offsetX,
			offsetY,
			zoom,
			rows,
			cols
		);

		for (let row = startRow; row < endRow; row++) {
			for (let col = startCol; col < endCol; col++) {
				const cell = cellMap.get(`${row}-${col}`);
				const color = cell ? getColor(cell) : colorMapping.fallbackColor || '#FFFFFF';
				const isSelected = selectedCell?.row === row && selectedCell?.col === col;

				const rect = new Konva.Rect({
					x: col * cellWidth,
					y: row * cellHeight,
					width: cellWidth,
					height: cellHeight,
					fill: color,
					stroke: isSelected ? '#FF0000' : '#CCCCCC',
					strokeWidth: isSelected ? 2 : 0.5,
					listening: false,
				});

				cellsGroup.add(rect);
			}
		}

		layer.batchDraw();
	}, [cellMap, cellWidth, cellHeight, rows, cols, zoom, offsetX, offsetY, selectedCell, colorMapping, getColor]);

	const handleScroll = useCallback((newOffsetX: number, newOffsetY: number) => {
		setOffsetX(newOffsetX);
		setOffsetY(newOffsetY);
	}, []);

	const contentWidth = cols * cellWidth * zoom;
	const contentHeight = rows * cellHeight * zoom;

	if (data.cells.length === 0) {
		return (
			<div className={className} style={style}>
				<div className="matrix-grid-empty">暂无数据</div>
			</div>
		);
	}

	return (
		<div className={className} style={style}>
			<ScrollbarContainer
				showHorizontal={scrollbar.horizontal && showHorizontalScrollbar}
				showVertical={scrollbar.vertical && showVerticalScrollbar}
				autoHide={scrollbar.autoHide}
				contentWidth={contentWidth}
				contentHeight={contentHeight}
				viewportWidth={cellSizeResult.containerWidth}
				viewportHeight={cellSizeResult.containerHeight}
				offsetX={offsetX}
				offsetY={offsetY}
				onScroll={handleScroll}
			>
				<div
					ref={containerRef}
					className="matrix-grid-canvas"
					style={{
						width: cellSizeResult.containerWidth,
						height: cellSizeResult.containerHeight,
					}}
				/>
			</ScrollbarContainer>
			<div className="matrix-grid-info">
				缩放: {zoom.toFixed(2)}x | 格子: {cellWidth}x{cellHeight}px
			</div>
		</div>
	);
}
