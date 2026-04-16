import React, { useRef, useEffect, useState } from 'react';
import Konva from 'konva';
import { useBitmap, useColorConfig, useViewState } from '../context';
import { createColorMap } from '../utils/colorMap';

const CELL_SIZE = 4;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;

interface BitmapCanvasProps {
	onCellClick?: (bl: number, wl: number) => void;
	onCellHover?: (bl: number, wl: number) => void;
}

export const BitmapCanvas: React.FC<BitmapCanvasProps> = ({ onCellClick, onCellHover }) => {
	const { state, dispatch } = useBitmap();
	const colorConfig = useColorConfig();
	const viewState = useViewState();
	const containerRef = useRef<HTMLDivElement>(null);
	const stageRef = useRef<Konva.Stage | null>(null);
	const layerRef = useRef<Konva.Layer | null>(null);
	const cellsGroupRef = useRef<Konva.Group | null>(null);
	const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
	const colorMap = createColorMap(colorConfig);

	useEffect(() => {
		if (!containerRef.current) return;

		const updateDimensions = () => {
			if (containerRef.current) {
				const width = containerRef.current.offsetWidth;
				const height = containerRef.current.offsetHeight;
				setDimensions({ width, height });

				if (stageRef.current) {
					stageRef.current.width(width);
					stageRef.current.height(height);
				}
			}
		};

		updateDimensions();
		window.addEventListener('resize', updateDimensions);
		return () => window.removeEventListener('resize', updateDimensions);
	}, []);

	useEffect(() => {
		if (!containerRef.current || !state.data) return;

		if (!stageRef.current) {
			const stage = new Konva.Stage({
				container: containerRef.current,
				width: dimensions.width,
				height: dimensions.height,
			});

			const layer = new Konva.Layer({
				listening: true,
			});

			const cellsGroup = new Konva.Group();
			layer.add(cellsGroup);

			stage.add(layer);

			stageRef.current = stage;
			layerRef.current = layer;
			cellsGroupRef.current = cellsGroup;

			stage.on('wheel', (e) => {
				e.evt.preventDefault();
				const oldScale = viewState.zoom;
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

				dispatch({
					type: 'SET_VIEW_STATE',
					payload: {
						zoom: newScale,
						offsetX: pointer.x - mousePointTo.x * newScale,
						offsetY: pointer.y - mousePointTo.y * newScale,
					},
				});
			});

			let isDragging = false;
			let lastPos = { x: 0, y: 0 };

			stage.on('mousedown', (e) => {
				if (e.evt.button === 0) {
					isDragging = true;
					lastPos = { x: e.evt.clientX, y: e.evt.clientY };
				}
			});

			stage.on('mousemove', (e) => {
				if (!isDragging) {
					const pointer = stage.getPointerPosition();
					if (pointer) {
						const x = (pointer.x - stage.x()) / viewState.zoom;
						const y = (pointer.y - stage.y()) / viewState.zoom;
						const wl = Math.floor(x / CELL_SIZE);
						const bl = Math.floor(y / CELL_SIZE);

						if (onCellHover && bl >= 0 && wl >= 0) {
							onCellHover(bl, wl);
						}
					}
				} else {
					const dx = e.evt.clientX - lastPos.x;
					const dy = e.evt.clientY - lastPos.y;

					dispatch({
						type: 'SET_VIEW_STATE',
						payload: {
							offsetX: viewState.offsetX + dx,
							offsetY: viewState.offsetY + dy,
						},
					});

					lastPos = { x: e.evt.clientX, y: e.evt.clientY };
				}
			});

			stage.on('mouseup', () => {
				isDragging = false;
			});

			stage.on('click', () => {
				const pointer = stage.getPointerPosition();
				if (!pointer) return;

				const x = (pointer.x - stage.x()) / viewState.zoom;
				const y = (pointer.y - stage.y()) / viewState.zoom;

				const wl = Math.floor(x / CELL_SIZE);
				const bl = Math.floor(y / CELL_SIZE);

				dispatch({ type: 'SELECT_CELL', payload: { bl, wl } });

				if (onCellClick) {
					onCellClick(bl, wl);
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
	}, [state.data]);

	useEffect(() => {
		if (!stageRef.current || !state.data) return;

		const stage = stageRef.current;
		stage.scaleX(viewState.zoom);
		stage.scaleY(viewState.zoom);
		stage.x(viewState.offsetX);
		stage.y(viewState.offsetY);
		stage.batchDraw();
	}, [viewState.zoom, viewState.offsetX, viewState.offsetY]);

	useEffect(() => {
		if (!state.data || !cellsGroupRef.current || !layerRef.current) return;

		const cellsGroup = cellsGroupRef.current;
		const layer = layerRef.current;

		cellsGroup.destroyChildren();

		const visibleWidth = dimensions.width / viewState.zoom;
		const visibleHeight = dimensions.height / viewState.zoom;

		const startWl = Math.max(0, Math.floor(-viewState.offsetX / viewState.zoom / CELL_SIZE) - 1);
		const startBl = Math.max(0, Math.floor(-viewState.offsetY / viewState.zoom / CELL_SIZE) - 1);
		const endWl = Math.min(state.data.cols, Math.ceil((visibleWidth - viewState.offsetX / viewState.zoom) / CELL_SIZE) + 1);
		const endBl = Math.min(state.data.rows, Math.ceil((visibleHeight - viewState.offsetY / viewState.zoom) / CELL_SIZE) + 1);

		const cellMap = new Map<string, typeof state.data.cells[0]>();
		for (const cell of state.data.cells) {
			cellMap.set(`${cell.bl}-${cell.wl}`, cell);
		}

		for (let bl = startBl; bl < endBl; bl++) {
			for (let wl = startWl; wl < endWl; wl++) {
				const cell = cellMap.get(`${bl}-${wl}`);
				const color = cell ? colorMap.getColorByCell(cell) : '#FFFFFF';
				const isSelected = viewState.selectedCell?.bl === bl && viewState.selectedCell?.wl === wl;

				const rect = new Konva.Rect({
					x: wl * CELL_SIZE,
					y: bl * CELL_SIZE,
					width: CELL_SIZE,
					height: CELL_SIZE,
					fill: color,
					stroke: isSelected ? '#FF0000' : '#CCCCCC',
					strokeWidth: isSelected ? 2 : 0.5,
					listening: false,
				});

				cellsGroup.add(rect);
			}
		}

		layer.batchDraw();
	}, [state.data, colorConfig, viewState.selectedCell, dimensions, viewState.zoom, viewState.offsetX, viewState.offsetY]);

	useEffect(() => {
		if (!stageRef.current || !state.data) return;

		const stage = stageRef.current;
		const cellsGroup = cellsGroupRef.current;
		if (!cellsGroup) return;

		const cellMap = new Map<string, typeof state.data.cells[0]>();
		for (const cell of state.data.cells) {
			cellMap.set(`${cell.bl}-${cell.wl}`, cell);
		}

		const children = cellsGroup.getChildren() as Konva.Rect[];
		children.forEach((rect) => {
			const x = rect.x();
			const y = rect.y();
			const wl = Math.floor(x / CELL_SIZE);
			const bl = Math.floor(y / CELL_SIZE);

			const isSelected = viewState.selectedCell?.bl === bl && viewState.selectedCell?.wl === wl;
			rect.stroke(isSelected ? '#FF0000' : '#CCCCCC');
			rect.strokeWidth(isSelected ? 2 : 0.5);
		});

		stageRef.current.batchDraw();
	}, [viewState.selectedCell, state.data]);

	if (!state.data) {
		return (
			<div ref={containerRef} className="bitmap-canvas-container">
				<div className="no-data">请上传数据文件</div>
			</div>
		);
	}

	return (
		<div ref={containerRef} className="bitmap-canvas-container">
			<div className="zoom-indicator">
				Zoom: {viewState.zoom.toFixed(2)}x
			</div>
		</div>
	);
};
