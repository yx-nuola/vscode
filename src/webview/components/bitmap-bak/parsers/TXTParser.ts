import { BaseParser, ParsedRow } from './types';
import { ParserResult, ParserOptions, BitmapData, CellData } from '../types';

export class TXTParser extends BaseParser {
	getSupportedExtensions(): string[] {
		return ['.txt', '.csv', '.log', '.dat'];
	}

	validate(file: File): boolean {
		const ext = file.name.toLowerCase();
		return this.getSupportedExtensions().some(e => ext.endsWith(e));
	}

	async parse(file: File, options?: ParserOptions): Promise<ParserResult> {
		try {
			this.reportProgress(options, 5);

			const text = await this.readFile(file);
			this.reportProgress(options, 20);

			const lines = text.split(/\r?\n/).filter(line => line.trim());
			this.reportProgress(options, 30);

			const delimiter = this.detectDelimiter(lines);
			const headerLine = lines[0];
			const hasHeader = this.isHeaderLine(headerLine, delimiter);
			const startIndex = hasHeader ? 1 : 0;

			const columns = hasHeader
				? this.parseHeader(headerLine, delimiter)
				: this.generateDefaultColumns(lines[1]?.split(delimiter).length || 5);

			const cells: CellData[] = [];
			const totalLines = lines.length - startIndex;
			let processedLines = 0;

			for (let i = startIndex; i < lines.length; i++) {
				const line = lines[i].trim();
				if (!line || line.startsWith('#') || line.startsWith('//')) {
					continue;
				}

				const row = this.parseLine(line, delimiter, columns, i - startIndex);
				if (row) {
					cells.push({
						bl: row.bl,
						wl: row.wl,
						vset: row.vset ?? 0,
						vreset: row.vreset ?? 0,
						imeas: row.imeas ?? 0,
						status: row.status,
					});
				}

				processedLines++;
				if (processedLines % 1000 === 0) {
					const progress = 30 + Math.floor((processedLines / totalLines) * 60);
					this.reportProgress(options, progress);
				}
			}

			this.reportProgress(options, 95);

			const maxBl = cells.length > 0 ? Math.max(...cells.map(c => c.bl)) + 1 : 0;
			const maxWl = cells.length > 0 ? Math.max(...cells.map(c => c.wl)) + 1 : 0;

			const data: BitmapData = {
				rows: maxBl,
				cols: maxWl,
				cells,
			};

			this.reportProgress(options, 100);
			return { success: true, data };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error parsing TXT';
			this.reportError(options, errorMessage);
			return { success: false, error: `TXT 解析失败: ${errorMessage}` };
		}
	}

	private readFile(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = () => reject(new Error('文件读取失败'));
			reader.readAsText(file);
		});
	}

	private detectDelimiter(lines: string[]): string {
		const firstLine = lines.find(l => l.trim() && !l.startsWith('#') && !l.startsWith('//')) || lines[0];
		const counts: Record<string, number> = {
			'\t': 0,
			',': 0,
			';': 0,
			'\\s+': 0,
		};

		for (const delim of Object.keys(counts)) {
			const regex = delim === '\\s+' ? /\s+/g : new RegExp(delim, 'g');
			const matches = firstLine.match(regex);
			counts[delim] = matches ? matches.length : 0;
		}

		let maxCount = 0;
		let bestDelim = '\t';
		for (const [delim, count] of Object.entries(counts)) {
			if (count > maxCount) {
				maxCount = count;
				bestDelim = delim;
			}
		}

		return bestDelim === '\\s+' ? ' ' : bestDelim;
	}

	private isHeaderLine(line: string, delimiter: string): boolean {
		const values = delimiter === ' '
			? line.trim().split(/\s+/)
			: line.split(delimiter);

		const headerKeywords = ['bl', 'wl', 'vset', 'vreset', 'imeas', 'row', 'col', 'x', 'y', 'index'];
		const firstValue = values[0]?.toLowerCase().trim() || '';

		return headerKeywords.some(k => firstValue.includes(k)) ||
			isNaN(Number(firstValue));
	}

	private parseHeader(line: string, delimiter: string): Record<number, string> {
		const values = delimiter === ' '
			? line.trim().split(/\s+/)
			: line.split(delimiter);

		const mapping: Record<number, string> = {};
		values.forEach((val, index) => {
			mapping[index] = val.trim().toLowerCase();
		});
		return mapping;
	}

	private generateDefaultColumns(count: number): Record<number, string> {
		const defaultCols = ['bl', 'wl', 'vset', 'vreset', 'imeas'];
		const mapping: Record<number, string> = {};
		for (let i = 0; i < count; i++) {
			mapping[i] = defaultCols[i] || `col${i}`;
		}
		return mapping;
	}

	private parseLine(line: string, delimiter: string, columns: Record<number, string>, rowIndex: number): ParsedRow | null {
		const values = delimiter === ' '
			? line.trim().split(/\s+/)
			: line.split(delimiter);

		if (values.length === 0) return null;

		const row: ParsedRow = {
			bl: rowIndex,
			wl: 0,
		};

		values.forEach((val, index) => {
			const colName = columns[index];
			const trimmedVal = val.trim();
			const numValue = parseFloat(trimmedVal);

			switch (colName) {
				case 'bl':
				case 'row':
				case 'y':
					row.bl = isNaN(numValue) ? rowIndex : numValue;
					break;
				case 'wl':
				case 'col':
				case 'x':
					row.wl = isNaN(numValue) ? index : numValue;
					break;
				case 'vset':
				case 'vset_v':
					row.vset = isNaN(numValue) ? undefined : numValue;
					break;
				case 'vreset':
				case 'vreset_v':
					row.vreset = isNaN(numValue) ? undefined : numValue;
					break;
				case 'imeas':
				case 'current':
				case 'i_meas':
					row.imeas = isNaN(numValue) ? undefined : numValue;
					break;
				case 'status':
				case 'result':
					row.status = this.parseStatus(trimmedVal);
					break;
			}
		});

		return row;
	}

	private parseStatus(value: string): 'pass' | 'fail' | undefined {
		const lower = value.toLowerCase();
		if (['pass', '1', 'true', 'yes', 'ok'].includes(lower)) return 'pass';
		if (['fail', '0', 'false', 'no', 'ng'].includes(lower)) return 'fail';
		return undefined;
	}
}
