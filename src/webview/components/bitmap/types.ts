export interface CellData {
	bl: number;
	wl: number;
	vset: number;
	vreset: number;
	imeas: number;
	status?: 'pass' | 'fail';
}

export interface BitmapData {
	rows: number;
	cols: number;
	cells: CellData[];
	metadata?: {
		total?: number;
		date?: string;
		mode?: string;
	};
}

export interface ColorRange {
	min: number;
	max: number;
	color: string;
	label?: string;
}

export interface ColorConfig {
	ranges: ColorRange[];
	fallbackColor: string;
	defaultScheme: 'passFail' | 'current';
}

export interface ViewState {
	zoom: number;
	offsetX: number;
	offsetY: number;
	selectedCell: { bl: number; wl: number } | null;
	hoveredCell: { bl: number; wl: number } | null;
}

export interface ParserResult {
	success: boolean;
	data?: BitmapData;
	error?: string;
}

export interface ParserOptions {
	onProgress?: (progress: number) => void;
	onError?: (error: string) => void;
}

export type DataMode = 'overwrite' | 'merge';

export interface BitmapState {
	data: BitmapData | null;
	colorConfig: ColorConfig;
	viewState: ViewState;
	loading: boolean;
	error: string | null;
	dataMode: DataMode;
}

export type BitmapAction =
	| { type: 'SET_DATA'; payload: BitmapData }
	| { type: 'MERGE_DATA'; payload: BitmapData }
	| { type: 'SET_COLOR_CONFIG'; payload: ColorConfig }
	| { type: 'SET_VIEW_STATE'; payload: Partial<ViewState> }
	| { type: 'SELECT_CELL'; payload: { bl: number; wl: number } | null }
	| { type: 'HOVER_CELL'; payload: { bl: number; wl: number } | null }
	| { type: 'SET_LOADING'; payload: boolean }
	| { type: 'SET_ERROR'; payload: string | null }
	| { type: 'SET_DATA_MODE'; payload: DataMode };
