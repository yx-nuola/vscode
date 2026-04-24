import { ParserResult, ParserOptions } from '../types';

export interface Parser {
	parse(file: File, options?: ParserOptions): Promise<ParserResult>;
	validate(file: File): boolean;
	getSupportedExtensions(): string[];
}

export interface ParsedRow {
	bl: number;
	wl: number;
	vset?: number;
	vreset?: number;
	imeas?: number;
	status?: 'pass' | 'fail';
	[key: string]: unknown;
}

export interface ParseContext {
	fileName: string;
	fileSize: number;
	totalLines?: number;
	processedLines: number;
}

export type DelimiterType = 'tab' | 'comma' | 'space' | 'semicolon' | 'auto';

export interface TXTParseConfig {
	delimiter: DelimiterType;
	hasHeader: boolean;
	columnMapping: Record<string, string>;
	skipLines: number;
}

export interface STDFParseConfig {
	version?: string;
	includeMetadata: boolean;
}

export abstract class BaseParser implements Parser {
	abstract parse(file: File, options?: ParserOptions): Promise<ParserResult>;
	abstract validate(file: File): boolean;
	abstract getSupportedExtensions(): string[];

	protected reportProgress(options: ParserOptions | undefined, progress: number): void {
		options?.onProgress?.(progress);
	}

	protected reportError(options: ParserOptions | undefined, error: string): void {
		options?.onError?.(error);
	}
}
