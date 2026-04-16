import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { BitmapState, BitmapAction, ColorConfig, ViewState } from '../types';
import { getDefaultScheme } from '../utils/colorSchemes';

const defaultColorConfig: ColorConfig = getDefaultScheme('current');

const initialViewState: ViewState = {
	zoom: 1,
	offsetX: 0,
	offsetY: 0,
	selectedCell: null,
	hoveredCell: null,
};

const initialState: BitmapState = {
	data: null,
	colorConfig: defaultColorConfig,
	viewState: initialViewState,
	loading: false,
	error: null,
	dataMode: 'overwrite',
};

function bitmapReducer(state: BitmapState, action: BitmapAction): BitmapState {
	switch (action.type) {
		case 'SET_DATA':
			return { ...state, data: action.payload, error: null };
		case 'MERGE_DATA': {
			if (!state.data) {
				return { ...state, data: action.payload, error: null };
			}
			const mergedCells = [...state.data.cells, ...action.payload.cells];
			const maxRows = Math.max(state.data.rows, action.payload.rows);
			const maxCols = Math.max(state.data.cols, action.payload.cols);
			return {
				...state,
				data: {
					...state.data,
					rows: maxRows,
					cols: maxCols,
					cells: mergedCells,
				},
				error: null,
			};
		}
		case 'SET_COLOR_CONFIG':
			return { ...state, colorConfig: action.payload };
		case 'SET_VIEW_STATE':
			return { ...state, viewState: { ...state.viewState, ...action.payload } };
		case 'SELECT_CELL':
			return { ...state, viewState: { ...state.viewState, selectedCell: action.payload } };
		case 'HOVER_CELL':
			return { ...state, viewState: { ...state.viewState, hoveredCell: action.payload } };
		case 'SET_LOADING':
			return { ...state, loading: action.payload };
		case 'SET_ERROR':
			return { ...state, error: action.payload, loading: false };
		case 'SET_DATA_MODE':
			return { ...state, dataMode: action.payload };
		default:
			return state;
	}
}

interface BitmapContextValue {
	state: BitmapState;
	dispatch: React.Dispatch<BitmapAction>;
}

const BitmapContext = createContext<BitmapContextValue | undefined>(undefined);

export function BitmapProvider({ children }: { children: ReactNode }) {
	const [state, dispatch] = useReducer(bitmapReducer, initialState);
	return (
		<BitmapContext.Provider value={{ state, dispatch }}>
			{children}
		</BitmapContext.Provider>
	);
}

export function useBitmap() {
	const context = useContext(BitmapContext);
	if (!context) {
		throw new Error('useBitmap must be used within a BitmapProvider');
	}
	return context;
}

export function useBitmapData() {
	const { state } = useBitmap();
	return state.data;
}

export function useColorConfig() {
	const { state } = useBitmap();
	return state.colorConfig;
}

export function useViewState() {
	const { state } = useBitmap();
	return state.viewState;
}

export function useSelectedCell() {
	const { state } = useBitmap();
	return state.viewState.selectedCell;
}

export { defaultColorConfig };
