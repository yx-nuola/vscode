import { ColorConfig, ColorRange, CellData } from '../types';
import { normalizeColor } from './colorValidation';

export interface ColorMap {
	getColor(value: number): string;
	getColorByCell(cell: CellData): string;
	getColorByStatus(status: 'pass' | 'fail'): string;
}

export class PrecomputedColorMap implements ColorMap {
	private valueColorMap: Map<number, string> = new Map();
	private ranges: ColorRange[];
	private fallbackColor: string;
	private passColor: string = '#22c55e';
	private failColor: string = '#ef4444';
	private minStep: number = 0.01;

	constructor(config: ColorConfig) {
		this.ranges = config.ranges.map(range => ({
			...range,
			color: normalizeColor(range.color),
		}));
		this.fallbackColor = normalizeColor(config.fallbackColor);
		this.precomputeColors();
	}

	private precomputeColors(): void {
		this.valueColorMap.clear();

		for (const range of this.ranges) {
			const start = Math.floor(range.min / this.minStep) * this.minStep;
			const end = Math.ceil(range.max / this.minStep) * this.minStep;

			for (let value = start; value <= end; value += this.minStep) {
				const roundedValue = Math.round(value * 100) / 100;
				if (!this.valueColorMap.has(roundedValue)) {
					this.valueColorMap.set(roundedValue, range.color);
				}
			}
		}
	}

	getColor(value: number): string {
		const roundedValue = Math.round(value * 100) / 100;
		const directMatch = this.valueColorMap.get(roundedValue);
		if (directMatch) return directMatch;

		for (const range of this.ranges) {
			if (value >= range.min && value < range.max) {
				return range.color;
			}
		}

		return this.fallbackColor;
	}

	getColorByCell(cell: CellData): string {
		if (cell.status === 'pass') {
			return this.passColor;
		}
		if (cell.status === 'fail') {
			return this.failColor;
		}

		return this.getColor(cell.imeas);
	}

	getColorByStatus(status: 'pass' | 'fail'): string {
		return status === 'pass' ? this.passColor : this.failColor;
	}

	getRangeForValue(value: number): ColorRange | null {
		for (const range of this.ranges) {
			if (value >= range.min && value < range.max) {
				return range;
			}
		}
		return null;
	}

	getAllRanges(): ColorRange[] {
		return [...this.ranges];
	}

	getFallbackColor(): string {
		return this.fallbackColor;
	}

	updateConfig(config: ColorConfig): void {
		this.ranges = config.ranges.map(range => ({
			...range,
			color: normalizeColor(range.color),
		}));
		this.fallbackColor = normalizeColor(config.fallbackColor);
		this.precomputeColors();
	}
}

export function createColorMap(config: ColorConfig): ColorMap {
	return new PrecomputedColorMap(config);
}

export function getCellColor(
	cell: CellData,
	config: ColorConfig,
	colorMap?: ColorMap
): string {
	const map = colorMap || new PrecomputedColorMap(config);
	return map.getColorByCell(cell);
}

export function batchComputeColors(
	cells: CellData[],
	config: ColorConfig
): Map<string, string> {
	const colorMap = new PrecomputedColorMap(config);
	const result = new Map<string, string>();

	for (const cell of cells) {
		const key = `${cell.bl}-${cell.wl}`;
		result.set(key, colorMap.getColorByCell(cell));
	}

	return result;
}
