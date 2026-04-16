import { ColorRange, ColorConfig } from '../types';

export interface ColorValidationResult {
	valid: boolean;
	errors: string[];
}

export function validateColorRange(range: ColorRange): ColorValidationResult {
	const errors: string[] = [];

	if (range.min === undefined || range.min === null) {
		errors.push('最小值不能为空');
	}

	if (range.max === undefined || range.max === null) {
		errors.push('最大值不能为空');
	}

	if (range.min >= range.max) {
		errors.push('最小值必须小于最大值');
	}

	if (range.min < 0) {
		errors.push('最小值不能为负数');
	}

	if (!range.color) {
		errors.push('颜色不能为空');
	}

	if (!isValidColor(range.color)) {
		errors.push('颜色格式无效');
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

export function validateColorConfig(config: ColorConfig): ColorValidationResult {
	const errors: string[] = [];

	if (!config.ranges || config.ranges.length === 0) {
		errors.push('至少需要一个颜色区间');
	}

	config.ranges.forEach((range, index) => {
		const rangeResult = validateColorRange(range);
		rangeResult.errors.forEach(err => {
			errors.push(`区间 ${index + 1}: ${err}`);
		});
	});

	for (let i = 0; i < config.ranges.length - 1; i++) {
		const current = config.ranges[i];
		const next = config.ranges[i + 1];
		if (current.max > next.min) {
			errors.push(`区间 ${i + 1} 和 ${i + 2} 存在重叠`);
		}
	}

	if (!config.fallbackColor || !isValidColor(config.fallbackColor)) {
		errors.push('回退颜色格式无效');
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

export function isValidColor(color: string): boolean {
	if (!color) return false;

	const hexPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
	if (hexPattern.test(color)) return true;

	const rgbPattern = /^rgb\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i;
	if (rgbPattern.test(color)) return true;

	const rgbaPattern = /^rgba\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/i;
	if (rgbaPattern.test(color)) return true;

	const namedColors = ['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'cyan', 'magenta', 'white', 'black', 'gray', 'grey'];
	if (namedColors.includes(color.toLowerCase())) return true;

	return false;
}

export function normalizeColor(color: string): string {
	if (!color) return '#808080';

	const trimmed = color.trim();

	if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
		return trimmed.toLowerCase();
	}

	if (/^#[0-9A-Fa-f]{3}$/.test(trimmed)) {
		const r = trimmed[1];
		const g = trimmed[2];
		const b = trimmed[3];
		return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
	}

	const rgbMatch = trimmed.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
	if (rgbMatch) {
		const r = parseInt(rgbMatch[1], 10);
		const g = parseInt(rgbMatch[2], 10);
		const b = parseInt(rgbMatch[3], 10);
		return rgbToHex(r, g, b);
	}

	return '#808080';
}

export function rgbToHex(r: number, g: number, b: number): string {
	const toHex = (n: number) => {
		const hex = Math.min(255, Math.max(0, Math.round(n))).toString(16);
		return hex.length === 1 ? `0${hex}` : hex;
	};
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (!result) return null;

	return {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16),
	};
}

export function parseColorInput(input: string): string {
	if (!input) return '#808080';

	let color = input.trim();

	if (!color.startsWith('#') && !color.startsWith('rgb')) {
		color = `#${color}`;
	}

	return normalizeColor(color);
}
