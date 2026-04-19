// ==================== MatrixGrid 组件类型定义 ====================

// 单元格位置信息
export interface CellPosition {
	x: number;
	y: number;
}

// 单元格信息（传递给回调函数）
export interface CellInfo<T = unknown> {
	rowIndex: number;
	colIndex: number;
	data: T;
	position: CellPosition;
}

// 矩阵数据结构
export interface MatrixData<T = unknown> {
	rows: number;
	cols: number;
	cells: T[];
	getRowIndex?: (cell: T, index: number) => number;
	getColIndex?: (cell: T, index: number) => number;
}

// 格子尺寸配置
export interface CellSizeConfig {
	minSize: number;
	maxSize?: number;
	preferredCount?: {
		horizontal?: number;
		vertical?: number;
	};
}

// 滚动条配置
export interface ScrollbarConfig {
	horizontal: boolean;
	vertical: boolean;
	autoHide?: boolean;
}

// 颜色区间
export interface ColorRange {
	min: number;
	max: number;
	color: string;
}

// 颜色映射配置
export interface ColorMappingConfig<T = unknown> {
	mode: 'solid' | 'range' | 'custom';
	solidColor?: string;
	ranges?: ColorRange[];
	fallbackColor?: string;
	getColor?: (cell: T) => string;
	getValue?: (cell: T) => number;
}

// 视口状态
export interface ViewportState {
	zoom: number;
	offsetX: number;
	offsetY: number;
	selectedCell: { rowIndex: number; colIndex: number } | null;
}

// 事件回调类型
export type CellClickCallback<T = unknown> = (cell: CellInfo<T>, event: MouseEvent) => void;
export type CellHoverCallback<T = unknown> = (cell: CellInfo<T>, event: MouseEvent) => void;

// 数据模式
export type DataMode = 'overwrite' | 'append';

// MatrixGrid 组件 Props
export interface MatrixGridProps<T = unknown> {
	data: MatrixData<T>;
	cellSize?: CellSizeConfig;
	scrollbar?: ScrollbarConfig;
	colorMapping?: ColorMappingConfig<T>;
	onCellClick?: CellClickCallback<T>;
	onCellHover?: CellHoverCallback<T>;
	dataMode?: DataMode;
	className?: string;
	style?: React.CSSProperties;
}

// 默认配置
export const DEFAULT_CELL_SIZE: CellSizeConfig = {
	minSize: 12,
	maxSize: 50,
	preferredCount: {
		horizontal: 64,
		vertical: 64,
	},
};

export const DEFAULT_SCROLLBAR: ScrollbarConfig = {
	horizontal: true,
	vertical: true,
	autoHide: false,
};

export const DEFAULT_COLOR_MAPPING: ColorMappingConfig = {
	mode: 'solid',
	solidColor: '#FFFFFF',
	fallbackColor: '#CCCCCC',
};
