/**
 * Pyodide 图片处理服务
 *
 * 使用 Pyodide (Python WebAssembly) 在浏览器端运行 Python 代码，
 * 提供图片智能分析和本地预处理功能，无需后端服务。
 *
 * 功能：
 * 1. 图片智能分析（主色调、清晰度、亮度、对比度、优化建议）
 * 2. 本地图片预处理（缩放、补边、压缩、亮度/对比度调整、锐化）
 * 3. 智能优化建议（一键优化参数）
 */

import type {
	ImageAnalysis,
	ProcessOptions,
	ProcessResult,
	OptimizationSuggestion,
	PyodideStatus,
} from "../types/pyodide";

// Pyodide 全局类型声明
declare global {
	interface Window {
		loadPyodide?: (options?: any) => Promise<any>;
		pyodide?: any;
	}
}

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js";
const PY_SCRIPT_PATH = "/py/image_processor.py";

class PyodideImageService {
	private pyodide: any = null;
	private loadingPromise: Promise<any> | null = null;
	private status: PyodideStatus = {
		loading: false,
		ready: false,
		error: null,
		progress: 0,
		stage: "",
	};
	private listeners: Set<(status: PyodideStatus) => void> = new Set();

	/** 订阅加载状态变化 */
	subscribe(listener: (status: PyodideStatus) => void) {
		this.listeners.add(listener);
		listener(this.status);
		return () => this.listeners.delete(listener);
	}

	private notify() {
		this.listeners.forEach(fn => fn({ ...this.status }));
	}

	private updateStatus(partial: Partial<PyodideStatus>) {
		this.status = { ...this.status, ...partial };
		this.notify();
	}

	/**
	 * 加载 Pyodide 运行时和 Python 依赖
	 * 单例模式：多次调用返回同一个 Promise
	 */
	async load(): Promise<any> {
		if (this.pyodide) return this.pyodide;
		if (this.loadingPromise) return this.loadingPromise;

		this.loadingPromise = this._doLoad();
		return this.loadingPromise;
	}

	private async _doLoad(): Promise<any> {
		this.updateStatus({ loading: true, ready: false, error: null, progress: 0, stage: "正在加载 Pyodide 运行时..." });

		try {
			// 1. 动态加载 Pyodide 脚本
			if (!window.loadPyodide) {
				await this._loadScript(PYODIDE_CDN);
			}
			this.updateStatus({ progress: 20, stage: "正在初始化 Python 环境..." });

			// 2. 初始化 Pyodide
			const pyodide = await window.loadPyodide!({
				stdin: () => "",
				stdout: (text: string) => console.log("[Pyodide]", text),
				stderr: (text: string) => console.warn("[Pyodide]", text),
			});
			this.updateStatus({ progress: 40, stage: "正在安装 Pillow 库..." });

			// 3. 加载 Pillow 依赖（Pyodide 内置的包）
			await pyodide.loadPackage(["pillow"]);
			this.updateStatus({ progress: 70, stage: "正在加载图像处理模块..." });

			// 4. 加载并执行 Python 脚本
			const pyCode = await this._fetchPythonScript();
			await pyodide.runPythonAsync(pyCode);
			this.updateStatus({ progress: 90, stage: "正在初始化 AI 引擎..." });

			// 5. 验证函数可用性
			const hasAnalyze = pyodide.globals.has("analyze_image");
			const hasProcess = pyodide.globals.has("process_image");
			const hasSuggest = pyodide.globals.has("suggest_optimization");

			if (!hasAnalyze || !hasProcess || !hasSuggest) {
				throw new Error("Python 模块加载失败：缺少必要函数");
			}

			this.pyodide = pyodide;
			this.updateStatus({ loading: false, ready: true, progress: 100, stage: "就绪" });

			console.log("✅ Pyodide 图片处理服务已就绪");
			return pyodide;
		} catch (e) {
			const errorMsg = (e as Error).message || "加载失败";
			this.updateStatus({ loading: false, ready: false, error: errorMsg, progress: 0 });
			this.loadingPromise = null;
			console.error("❌ Pyodide 加载失败:", e);
			throw e;
		}
	}

	/** 动态加载 JS 脚本 */
	private _loadScript(src: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const script = document.createElement("script");
			script.src = src;
			script.async = true;
			script.onload = () => resolve();
			script.onerror = () => reject(new Error(`加载脚本失败: ${src}`));
			document.head.appendChild(script);
		});
	}

	/** 获取 Python 脚本内容 */
	private async _fetchPythonScript(): Promise<string> {
		const resp = await fetch(PY_SCRIPT_PATH);
		if (!resp.ok) {
			throw new Error(`加载 Python 脚本失败: HTTP ${resp.status}`);
		}
		return await resp.text();
	}

	// ============== 公开 API ==============

	/**
	 * 智能分析图片
	 */
	async analyzeImage(file: File | Blob): Promise<ImageAnalysis> {
		const pyodide = await this.load();
		const bytes = new Uint8Array(await file.arrayBuffer());

		// 将 JS Uint8Array 传入 Python
		pyodide.globals.set("_img_bytes", bytes);

		const result = await pyodide.runPythonAsync(`
import json
result = analyze_image(bytes(_img_bytes))
json.dumps(result)
`);

		return JSON.parse(result);
	}

	/**
	 * 图片预处理
	 */
	async processImage(file: File | Blob, options: ProcessOptions): Promise<ProcessResult> {
		const pyodide = await this.load();
		const bytes = new Uint8Array(await file.arrayBuffer());

		pyodide.globals.set("_img_bytes", bytes);
		pyodide.globals.set("_options", JSON.stringify(options));

		const result = await pyodide.runPythonAsync(`
import json
opts = json.loads(_options)
result = process_image(bytes(_img_bytes), opts)
# 将 bytes 转成 JS 可用的格式
result["image"] = list(result["image"])
json.dumps(result)
`);

		const parsed = JSON.parse(result);
		return {
			...parsed,
			image: new Uint8Array(parsed.image),
		};
	}

	/**
	 * 获取智能优化建议
	 */
	async suggestOptimization(analysis: ImageAnalysis): Promise<OptimizationSuggestion> {
		const pyodide = await this.load();

		pyodide.globals.set("_analysis", JSON.stringify(analysis));

		const result = await pyodide.runPythonAsync(`
import json
analysis = json.loads(_analysis)
result = suggest_optimization(analysis)
json.dumps(result)
`);

		return JSON.parse(result);
	}

	/** 获取当前状态 */
	getStatus(): PyodideStatus {
		return { ...this.status };
	}
}

// 导出单例
export const pyodideImageService = new PyodideImageService();
