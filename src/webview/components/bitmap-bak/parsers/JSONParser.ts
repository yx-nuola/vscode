import { BaseParser, ParsedRow } from './types';
import { ParserResult, ParserOptions, BitmapData, CellData } from '../types';

export class JSONParser extends BaseParser {
	getSupportedExtensions(): string[] {
		return ['.json'];
	}

	validate(file: File): boolean {
		return file.name.toLowerCase().endsWith('.json');
	}

	async parse(file: File, options?: ParserOptions): Promise<ParserResult> {
		try {
			this.reportProgress(options, 10);

			const text = await this.readFile(file);
			this.reportProgress(options, 40);

			const parsed = JSON.parse(text);
			this.reportProgress(options, 70);

			const data = this.transformToBitmapData(parsed);
			this.reportProgress(options, 100);

			return { success: true, data };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error parsing JSON';
			this.reportError(options, errorMessage);
			return { success: false, error: `JSON 解析失败: ${errorMessage}` };
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

	private transformToBitmapData(parsed: unknown): BitmapData {
		if (Array.isArray(parsed)) {
			const cells: CellData[] = parsed.map((item, index) => {
				const row = this.extractRow(item, index);
				return {
					bl: row.bl,
					wl: row.wl,
					vset: row.vset ?? 0,
					vreset: row.vreset ?? 0,
					imeas: row.imeas ?? 0,
					status: row.status,
				};
			});

			const maxBl = Math.max(...cells.map(c => c.bl)) + 1;
			const maxWl = Math.max(...cells.map(c => c.wl)) + 1;

			return {
				rows: maxBl,
				cols: maxWl,
				cells,
			};
		}

		if (typeof parsed === 'object' && parsed !== null) {
			const obj = parsed as Record<string, unknown>;
			if (obj.cells && Array.isArray(obj.cells)) {
				return {
					rows: (obj.rows as number) ?? 128,
					cols: (obj.cols as number) ?? 1024,
					cells: (obj.cells as unknown[]).map((item, index) => {
						const row = this.extractRow(item, index);
						return {
							bl: row.bl,
							wl: row.wl,
							vset: row.vset ?? 0,
							vreset: row.vreset ?? 0,
							imeas: row.imeas ?? 0,
							status: row.status,
						};
					}),
					metadata: obj.metadata as BitmapData['metadata'],
				};
			}

			if (obj.data && Array.isArray(obj.data)) {
				const data = obj.data as unknown[][];
				const cells: CellData[] = [];
				data.forEach((row, bl) => {
					if (Array.isArray(row)) {
						row.forEach((value, wl) => {
							cells.push({
								bl,
								wl,
								vset: 0,
								vreset: 0,
								imeas: typeof value === 'number' ? value : 0,
							});
						});
					}
				});
				return {
					rows: data.length,
					cols: Math.max(...data.map(r => (Array.isArray(r) ? r.length : 0))),
					cells,
				};
			}
		}

		throw new Error('无法识别的 JSON 格式');
	}

	private extractRow(item: unknown, index: number): ParsedRow {
		if (typeof item !== 'object' || item === null) {
			throw new Error(`第 ${index} 行数据格式错误`);
		}

		const obj = item as Record<string, unknown>;
		return {
			bl: this.extractNumber(obj, ['bl', 'BL', 'row', 'y']) ?? index,
			wl: this.extractNumber(obj, ['wl', 'WL', 'col', 'x']) ?? 0,
			vset: this.extractNumber(obj, ['vset', 'Vset', 'VSET']),
			vreset: this.extractNumber(obj, ['vreset', 'Vreset', 'VRESET']),
			imeas: this.extractNumber(obj, ['imeas', 'Imeas', 'IMEAS', 'current', 'value']),
			status: this.extractStatus(obj),
		};
	}

	private extractNumber(obj: Record<string, unknown>, keys: string[]): number | undefined {
		for (const key of keys) {
			if (obj[key] !== undefined) {
				const value = obj[key];
				return typeof value === 'number' ? value : parseFloat(String(value));
			}
		}
		return undefined;
	}

	private extractStatus(obj: Record<string, unknown>): 'pass' | 'fail' | undefined {
		const statusKeys = ['status', 'result', 'pass_fail'];
		for (const key of statusKeys) {
			if (obj[key] !== undefined) {
				const value = String(obj[key]).toLowerCase();
				if (value === 'pass' || value === '1' || value === 'true') return 'pass';
				if (value === 'fail' || value === '0' || value === 'false') return 'fail';
			}
		}
		return undefined;
	}
}
