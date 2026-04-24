import { getParser, isSupportedFile, getSupportedExtensions } from './index';

export interface ValidationResult {
	valid: boolean;
	error?: string;
	warning?: string;
}

export function validateFile(file: File): ValidationResult {
	if (!file) {
		return { valid: false, error: '未选择文件' };
	}

	if (file.size === 0) {
		return { valid: false, error: '文件为空' };
	}

	const maxSize = 100 * 1024 * 1024;
	if (file.size > maxSize) {
		return { valid: false, error: `文件过大，最大支持 ${maxSize / 1024 / 1024}MB` };
	}

	if (!isSupportedFile(file.name)) {
		const supported = getSupportedExtensions().join(', ');
		return {
			valid: false,
			error: `不支持的文件格式。支持的格式: ${supported}`,
		};
	}

	const parser = getParser(file.name);
	if (parser && !parser.validate(file)) {
		return { valid: false, error: '文件验证失败，请检查文件格式' };
	}

	if (file.size > 10 * 1024 * 1024) {
		return {
			valid: true,
			warning: `文件较大 (${(file.size / 1024 / 1024).toFixed(2)}MB)，解析可能需要较长时间`,
		};
	}

	return { valid: true };
}

export function validateFileExtension(fileName: string): boolean {
	return isSupportedFile(fileName);
}

export function getFileInfo(file: File): {
	name: string;
	size: number;
	sizeFormatted: string;
	extension: string;
} {
	const extension = file.name.split('.').pop()?.toLowerCase() || '';
	const size = file.size;
	let sizeFormatted: string;

	if (size < 1024) {
		sizeFormatted = `${size} B`;
	} else if (size < 1024 * 1024) {
		sizeFormatted = `${(size / 1024).toFixed(2)} KB`;
	} else if (size < 1024 * 1024 * 1024) {
		sizeFormatted = `${(size / 1024 / 1024).toFixed(2)} MB`;
	} else {
		sizeFormatted = `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;
	}

	return {
		name: file.name,
		size,
		sizeFormatted,
		extension,
	};
}
