import { MatrixData, DataMode } from '../matrixGridTypes';

export function mergeMatrixData<T>(
	existing: MatrixData<T>,
	newData: MatrixData<T>,
	mode: DataMode
): MatrixData<T> {
	if (mode === 'overwrite') {
		return newData;
	}

	const mergedCells = [...existing.cells];
	const existingKeys = new Set<string>();

	const getRowIndex = existing.getRowIndex ?? ((_cell: unknown, index: number) => index % existing.rows);
	const getColIndex = existing.getColIndex ?? ((_cell: unknown, index: number) => Math.floor(index / existing.rows));

	for (const cell of existing.cells) {
		const index = existing.cells.indexOf(cell);
		const row = getRowIndex(cell, index);
		const col = getColIndex(cell, index);
		existingKeys.add(`${row}-${col}`);
	}

	const newGetRowIndex = newData.getRowIndex ?? ((_cell: unknown, index: number) => index % newData.rows);
	const newGetColIndex = newData.getColIndex ?? ((_cell: unknown, index: number) => Math.floor(index / newData.rows));

	for (const cell of newData.cells) {
		const index = newData.cells.indexOf(cell);
		const row = newGetRowIndex(cell, index);
		const col = newGetColIndex(cell, index);
		const key = `${row}-${col}`;

		if (existingKeys.has(key)) {
			const existingIndex = mergedCells.findIndex((c, i) => {
				const r = getRowIndex(c, i);
				const c2 = getColIndex(c, i);
				return r === row && c2 === col;
			});

			if (existingIndex >= 0) {
				mergedCells[existingIndex] = cell;
			}
		} else {
			mergedCells.push(cell);
			existingKeys.add(key);
		}
	}

	const maxRows = Math.max(existing.rows, newData.rows);
	const maxCols = Math.max(existing.cols, newData.cols);

	return {
		rows: maxRows,
		cols: maxCols,
		cells: mergedCells,
		getRowIndex: newGetRowIndex,
		getColIndex: newGetColIndex,
	};
}

export function createMatrixData<T>(
	cells: T[],
	options: {
		rows?: number;
		cols?: number;
		getRowIndex?: (cell: T, index: number) => number;
		getColIndex?: (cell: T, index: number) => number;
	} = {}
): MatrixData<T> {
	const { rows = 0, cols = 0, getRowIndex, getColIndex } = options;

	return {
		rows,
		cols,
		cells,
		getRowIndex,
		getColIndex,
	};
}
