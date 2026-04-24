import { ColorConfig } from '../types';

export const PASS_FAIL_SCHEME: ColorConfig = {
	ranges: [],
	fallbackColor: '#808080',
	defaultScheme: 'passFail',
};

export const CURRENT_BASED_SCHEME: ColorConfig = {
	ranges: [
		{ min: 0, max: 5, color: '#FFA500', label: '0-5mA' },
		{ min: 5, max: 10, color: '#1E90FF', label: '5-10mA' },
		{ min: 10, max: 15, color: '#32CD32', label: '10-15mA' },
		{ min: 15, max: 20, color: '#FF4500', label: '15-20mA' },
		{ min: 20, max: 50, color: '#9400D3', label: '20-50mA' },
	],
	fallbackColor: '#808080',
	defaultScheme: 'current',
};

export const THERMAL_SCHEME: ColorConfig = {
	ranges: [
		{ min: 0, max: 2, color: '#0000FF', label: '0-2mA' },
		{ min: 2, max: 4, color: '#00FFFF', label: '2-4mA' },
		{ min: 4, max: 6, color: '#00FF00', label: '4-6mA' },
		{ min: 6, max: 8, color: '#FFFF00', label: '6-8mA' },
		{ min: 8, max: 10, color: '#FF0000', label: '8-10mA' },
	],
	fallbackColor: '#FFFFFF',
	defaultScheme: 'current',
};

export const GRADIENT_SCHEME: ColorConfig = {
	ranges: [
		{ min: 0, max: 5, color: '#E8F5E9', label: '0-5mA' },
		{ min: 5, max: 10, color: '#81C784', label: '5-10mA' },
		{ min: 10, max: 15, color: '#4CAF50', label: '10-15mA' },
		{ min: 15, max: 20, color: '#2E7D32', label: '15-20mA' },
		{ min: 20, max: 25, color: '#1B5E20', label: '20-25mA' },
	],
	fallbackColor: '#BDBDBD',
	defaultScheme: 'current',
};

export const PASS_COLOR = '#22c55e';
export const FAIL_COLOR = '#ef4444';

export function getPassFailColor(status: 'pass' | 'fail'): string {
	return status === 'pass' ? PASS_COLOR : FAIL_COLOR;
}

export function getDefaultScheme(schemeName: 'passFail' | 'current' | 'thermal' | 'gradient' = 'current'): ColorConfig {
	switch (schemeName) {
		case 'passFail':
			return { ...PASS_FAIL_SCHEME };
		case 'thermal':
			return { ...THERMAL_SCHEME };
		case 'gradient':
			return { ...GRADIENT_SCHEME };
		case 'current':
		default:
			return { ...CURRENT_BASED_SCHEME };
	}
}

export const AVAILABLE_SCHEMES = [
	{ name: 'current', label: '电流值配色', config: CURRENT_BASED_SCHEME },
	{ name: 'passFail', label: 'Pass/Fail 配色', config: PASS_FAIL_SCHEME },
	{ name: 'thermal', label: '热力图配色', config: THERMAL_SCHEME },
	{ name: 'gradient', label: '渐变配色', config: GRADIENT_SCHEME },
];
