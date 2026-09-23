/**
 * Pyodide 图片处理器相关类型定义
 */

export interface DominantColor {
	hex: string;
	ratio: number; // 百分比
}

export interface ImageAnalysis {
	width: number;
	height: number;
	format: string;
	mode: string;
	fileSize: number;
	dominantColors: DominantColor[];
	brightness: number; // 0-255 平均亮度
	contrast: number; // 对比度（标准差）
	sharpness: number; // 清晰度评分 0-100
	colorfulness: number; // 色彩丰富度 0-100
	isDark: boolean;
	isBlurry: boolean;
	suggestions: string[];
}

export interface ProcessOptions {
	maxWidth?: number;
	maxHeight?: number;
	square?: boolean;
	background?: string;
	format?: "PNG" | "JPEG" | "WEBP";
	quality?: number;
	brightness?: number; // -100 到 100
	contrast?: number; // -100 到 100
	sharpen?: boolean;
}

export interface ProcessResult {
	image: Uint8Array;
	mimeType: string;
	width: number;
	height: number;
	originalSize: number;
	processedSize: number;
}

export interface OptimizationSuggestion {
	presetName: string;
	options: ProcessOptions;
	reason: string;
}

export interface PyodideStatus {
	loading: boolean;
	ready: boolean;
	error: string | null;
	progress: number; // 0-100
	stage: string; // 当前加载阶段描述
}
