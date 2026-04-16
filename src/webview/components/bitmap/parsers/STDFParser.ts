import { BaseParser } from './types';
import { ParserResult, ParserOptions } from '../types';

export class STDFParser extends BaseParser {
	getSupportedExtensions(): string[] {
		return ['.stdf', '.std'];
	}

	validate(file: File): boolean {
		const ext = file.name.toLowerCase();
		return this.getSupportedExtensions().some(e => ext.endsWith(e));
	}

	async parse(_file: File, options?: ParserOptions): Promise<ParserResult> {
		this.reportProgress(options, 10);

		await new Promise(resolve => setTimeout(resolve, 100));

		this.reportProgress(options, 100);

		return {
			success: false,
			error: 'STDF 格式解析暂未实现，请使用 JSON 或 TXT 格式文件。如需 STDF 支持，请提供示例文件或格式规范。',
		};
	}
}
