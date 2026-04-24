import { Parser } from './types';
import { JSONParser } from './JSONParser';
import { TXTParser } from './TXTParser';
import { STDFParser } from './STDFParser';
import { validateFile } from './validation';
import { ParserResult, ParserOptions, BitmapData } from '../types';

const parsers: Parser[] = [
	new JSONParser(),
	new TXTParser(),
	new STDFParser(),
];

export function getParser(fileName: string): Parser | null {
	const lowerName = fileName.toLowerCase();
	for (const parser of parsers) {
		if (parser.getSupportedExtensions().some(ext => lowerName.endsWith(ext))) {
			return parser;
		}
	}
	return null;
}

export function getSupportedExtensions(): string[] {
	return parsers.flatMap(p => p.getSupportedExtensions());
}

export function isSupportedFile(fileName: string): boolean {
	return getParser(fileName) !== null;
}

export { validateFile };

export async function parseFile(
	file: File,
	options?: ParserOptions
): Promise<ParserResult> {
	const parser = getParser(file.name);
	if (!parser) {
		return {
			success: false,
			error: `不支持的文件格式: ${file.name}`,
		};
	}

	const validation = validateFile(file);
	if (!validation.valid) {
		return {
			success: false,
			error: validation.error,
		};
	}

	return parser.parse(file, options);
}

export function mergeBitmapData(existing: BitmapData, newData: BitmapData): BitmapData {
	const mergedCells = [...existing.cells];

	const existingKeys = new Set(
		existing.cells.map(c => `${c.bl}-${c.wl}`)
	);

	for (const cell of newData.cells) {
		const key = `${cell.bl}-${cell.wl}`;
		if (!existingKeys.has(key)) {
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
		metadata: {
			...existing.metadata,
			...newData.metadata,
		},
	};
}

export { JSONParser, TXTParser, STDFParser };
