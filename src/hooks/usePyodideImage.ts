/**
 * usePyodideImage Hook
 *
 * 封装 Pyodide 图片处理服务的 React Hook，
 * 提供加载状态管理和图片分析/处理方法。
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { pyodideImageService } from "../services/pyodideImageService";
import type {
	ImageAnalysis,
	ProcessOptions,
	ProcessResult,
	OptimizationSuggestion,
	PyodideStatus,
} from "../types/pyodide";

export function usePyodideImage() {
	const [status, setStatus] = useState<PyodideStatus>(() => pyodideImageService.getStatus());
	const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null);
	const [analyzing, setAnalyzing] = useState(false);
	const [processing, setProcessing] = useState(false);
	const [suggestion, setSuggestion] = useState<OptimizationSuggestion | null>(null);
	const mountedRef = useRef(true);

	useEffect(() => {
		mountedRef.current = true;
		const unsubscribe = pyodideImageService.subscribe(s => {
			if (mountedRef.current) setStatus(s);
		});
		return () => {
			mountedRef.current = false;
			unsubscribe();
		};
	}, []);

	/** 手动触发加载 */
	const load = useCallback(async () => {
		try {
			await pyodideImageService.load();
			return true;
		} catch {
			return false;
		}
	}, []);

	/** 分析图片 */
	const analyze = useCallback(async (file: File | Blob): Promise<ImageAnalysis | null> => {
		setAnalyzing(true);
		setAnalysis(null);
		setSuggestion(null);
		try {
			const result = await pyodideImageService.analyzeImage(file);
			if (mountedRef.current) {
				setAnalysis(result);
			}
			return result;
		} catch (e) {
			console.error("图片分析失败:", e);
			return null;
		} finally {
			if (mountedRef.current) setAnalyzing(false);
		}
	}, []);

	/** 处理图片 */
	const process = useCallback(async (
		file: File | Blob,
		options: ProcessOptions
	): Promise<ProcessResult | null> => {
		setProcessing(true);
		try {
			const result = await pyodideImageService.processImage(file, options);
			return result;
		} catch (e) {
			console.error("图片处理失败:", e);
			return null;
		} finally {
			if (mountedRef.current) setProcessing(false);
		}
	}, []);

	/** 获取优化建议 */
	const getSuggestion = useCallback(async (analysisData: ImageAnalysis): Promise<OptimizationSuggestion | null> => {
		try {
			const result = await pyodideImageService.suggestOptimization(analysisData);
			if (mountedRef.current) {
				setSuggestion(result);
			}
			return result;
		} catch (e) {
			console.error("获取优化建议失败:", e);
			return null;
		}
	}, []);

	/** 一键智能优化：分析 + 建议 + 处理 */
	const smartOptimize = useCallback(async (file: File | Blob): Promise<ProcessResult | null> => {
		setAnalyzing(true);
		setProcessing(true);
		try {
			const analysisResult = await pyodideImageService.analyzeImage(file);
			if (mountedRef.current) setAnalysis(analysisResult);

			const suggestionResult = await pyodideImageService.suggestOptimization(analysisResult);
			if (mountedRef.current) setSuggestion(suggestionResult);

			const processResult = await pyodideImageService.processImage(file, suggestionResult.options);
			return processResult;
		} catch (e) {
			console.error("智能优化失败:", e);
			return null;
		} finally {
			if (mountedRef.current) {
				setAnalyzing(false);
				setProcessing(false);
			}
		}
	}, []);

	/** 重置状态 */
	const reset = useCallback(() => {
		setAnalysis(null);
		setSuggestion(null);
	}, []);

	return {
		// 状态
		status,
		analysis,
		suggestion,
		analyzing,
		processing,
		// 方法
		load,
		analyze,
		process,
		getSuggestion,
		smartOptimize,
		reset,
	};
}
