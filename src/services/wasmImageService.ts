/**
 * 浏览器端 WASM 图片处理服务（对齐 Python image_service）
 *
 * 使用 onnxruntime-web（WASM 后端）在浏览器内运行与服务端完全相同的
 * AI 抠图模型 isnet-general-use（ONNX），复刻 rembg 的前后处理：
 *
 *   解码(含 EXIF 方向) → 1024² LANCZOS 缩放 → (x/255-0.5) 归一化
 *   → ONNX 推理 → mask min-max 拉伸 → 1024² mask 缩回原尺寸
 *   → naive_cutout（mask 直接作 alpha）→ 背景合成/保留透明
 *   → 方形补边 → 等比缩放（只缩不放）→ 编码
 *
 * 模型文件（约 170MB，md5 fc16ebd8b0c10d971d3513d564d01e29）放在
 * public/models/isnet-general-use.onnx，首次使用时下载并由浏览器缓存。
 * 推理在本地 WASM 运行，图片不会上传到任何服务器。
 */
import * as ort from "onnxruntime-web";
import type { ProcessResult } from "../types/pyodide";

/** 模型输入尺寸（rembg DisSession 固定 1024×1024） */
const MODEL_SIZE = 1024;
/** 模型文件随站点发布（public/models），图片与模型数据均不出本机 */
const MODEL_URL = `${import.meta.env.BASE_URL}models/isnet-general-use.onnx`;
/**
 * onnxruntime-web 的 WASM 运行文件（约 27MB）从 jsdelivr 加载——
 * Vite dev 不允许 ESM 动态 import /public 内文件，且项目已有从 CDN
 * 加载 Pyodide 运行时的先例。版本需与 package.json 中 onnxruntime-web 对齐。
 */
const ORT_WASM_PATHS = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/";

export interface WasmProcessOptions {
	removeBackground?: boolean;
	maxWidth?: number;
	maxHeight?: number;
	/** 短边居中补边至正方形 */
	square?: boolean;
	/** 背景色 #RRGGBB；空串表示保留透明（仅 PNG/WEBP） */
	background?: string;
	format?: "PNG" | "JPEG" | "WEBP";
	quality?: number;
}

export interface WasmModelStatus {
	loading: boolean;
	ready: boolean;
	error: string | null;
	/** 0-100，模型下载与初始化进度 */
	progress: number;
	stage: string;
}

interface Cutout {
	/** 抠图结果画布（RGBA，尺寸=EXIF 修正后的原图） */
	canvas: HTMLCanvasElement;
	width: number;
	height: number;
}

/** #RRGGBB / #RGB → [r,g,b] */
function hexToRgb(color: string): [number, number, number] {
	const s = (color || "").trim().replace(/^#/, "");
	const full =
		s.length === 3
			? s
					.split("")
					.map(ch => ch + ch)
					.join("")
			: s;
	if (!/^[0-9a-fA-F]{6}$/.test(full)) {
		throw new Error(`非法背景色: ${color}`);
	}
	return [
		parseInt(full.slice(0, 2), 16),
		parseInt(full.slice(2, 4), 16),
		parseInt(full.slice(4, 6), 16),
	];
}

/** 高质量绘制（近似 Pillow LANCZOS） */
function drawHighQuality(
	ctx: CanvasRenderingContext2D,
	src: CanvasImageSource,
	dx: number,
	dy: number,
	dw: number,
	dh: number
) {
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = "high";
	ctx.drawImage(src, dx, dy, dw, dh);
}

function canvasToBlob(
	canvas: HTMLCanvasElement,
	mimeType: string,
	quality?: number
): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			blob => (blob ? resolve(blob) : reject(new Error("图片编码失败"))),
			mimeType,
			quality
		);
	});
}

class WasmImageService {
	private session: ort.InferenceSession | null = null;
	private loadingPromise: Promise<ort.InferenceSession> | null = null;
	private status: WasmModelStatus = {
		loading: false,
		ready: false,
		error: null,
		progress: 0,
		stage: "",
	};
	private listeners: Set<(status: WasmModelStatus) => void> = new Set();

	/** 当前已抠图的文件与结果（换背景色时复用 mask，不重复推理） */
	private cutoutCache: { file: Blob; promise: Promise<Cutout> } | null = null;

	subscribe(listener: (status: WasmModelStatus) => void) {
		this.listeners.add(listener);
		listener(this.status);
		return () => {
			this.listeners.delete(listener);
		};
	}

	getStatus(): WasmModelStatus {
		return { ...this.status };
	}

	private notify() {
		this.listeners.forEach(fn => fn({ ...this.status }));
	}

	private updateStatus(partial: Partial<WasmModelStatus>) {
		this.status = { ...this.status, ...partial };
		this.notify();
	}

	/**
	 * 加载 ONNX 模型（单例）。首次会下载约 170MB 模型并初始化 WASM。
	 */
	async load(): Promise<ort.InferenceSession> {
		if (this.session) return this.session;
		if (this.loadingPromise) return this.loadingPromise;
		this.loadingPromise = this._doLoad();
		try {
			this.session = await this.loadingPromise;
		} catch (e) {
			// 加载失败允许下次重试
			this.loadingPromise = null;
			throw e;
		}
		return this.session;
	}

	private async _doLoad(): Promise<ort.InferenceSession> {
		this.updateStatus({
			loading: true,
			ready: false,
			error: null,
			progress: 0,
			stage: "正在下载 AI 模型...",
		});

		try {
			// WASM 运行时：支持跨域隔离时开多线程，否则单线程
			ort.env.wasm.wasmPaths = ORT_WASM_PATHS;
			ort.env.wasm.simd = true;
			ort.env.wasm.numThreads =
				typeof self !== "undefined" && self.crossOriginIsolated
					? Math.min(4, navigator.hardwareConcurrency || 2)
					: 1;
			ort.env.wasm.proxy = false;

			const modelBuffer = await this._downloadModel();

			this.updateStatus({ progress: 100, stage: "正在初始化 WASM 推理引擎..." });
			const session = await ort.InferenceSession.create(modelBuffer, {
				executionProviders: ["wasm"],
				graphOptimizationLevel: "all",
			});

			this.updateStatus({ loading: false, ready: true, progress: 100, stage: "就绪" });
			return session;
		} catch (e) {
			const errorMsg = e instanceof Error ? e.message : "AI 模型加载失败";
			this.updateStatus({ loading: false, ready: false, error: errorMsg, progress: 0, stage: "" });
			throw e;
		}
	}

	/** 下载模型并回报进度（HTTP 缓存命中时秒完） */
	private async _downloadModel(): Promise<ArrayBuffer> {
		const resp = await fetch(MODEL_URL);
		if (!resp.ok) throw new Error(`模型下载失败: HTTP ${resp.status}`);

		const total = Number(resp.headers.get("Content-Length") || 0);
		if (!resp.body || !total) {
			// 无流式信息时交给浏览器直接下载
			return await resp.arrayBuffer();
		}

		const reader = resp.body.getReader();
		const chunks: Uint8Array[] = [];
		let received = 0;
		for (;;) {
			const { done, value } = await reader.read();
			if (done) break;
			if (value) {
				chunks.push(value);
				received += value.length;
				const percent = Math.min(99, Math.floor((received / total) * 100));
				this.updateStatus({ progress: percent, stage: `正在下载 AI 模型（${percent}%）` });
			}
		}
		const ab = new Uint8Array(received);
		let offset = 0;
		for (const chunk of chunks) {
			ab.set(chunk, offset);
			offset += chunk.length;
		}
		return ab.buffer;
	}

	/**
	 * 图片处理（对齐 image_service.standardize）。
	 * 同一文件重复调用（如切换背景色）会复用抠图结果，只做合成/编码。
	 */
	async processImage(file: Blob, options: WasmProcessOptions): Promise<ProcessResult> {
		const originalSize = file.size;
		const wantCutout = options.removeBackground !== false;
		const cutout = wantCutout ? await this._getCutout(file) : await this._decodeOriginal(file);

		const format = (options.format || "JPEG").toUpperCase() as "PNG" | "JPEG" | "WEBP";
		const keepAlpha = (format === "PNG" || format === "WEBP") && !options.background;

		let canvas: HTMLCanvasElement = cutout.canvas;

		// 1. 背景合成
		if (wantCutout && !keepAlpha) {
			canvas = this._composeOnBackground(cutout, hexToRgb(options.background || "#FFFFFF"));
		}

		// 2. 方形补边
		if (options.square) {
			canvas = this._padToSquare(canvas, options.background || "#FFFFFF", keepAlpha);
		}

		// 3. 等比缩放（只缩不放）
		canvas = this._resizeWithin(canvas, options.maxWidth ?? 0, options.maxHeight ?? 0);

		// 4. 编码
		const mimeMap = { PNG: "image/png", JPEG: "image/jpeg", WEBP: "image/webp" } as const;
		const mimeType = mimeMap[format];
		const blob = await canvasToBlob(canvas, mimeType, (options.quality ?? 90) / 100);

		return {
			image: new Uint8Array(await blob.arrayBuffer()),
			mimeType,
			width: canvas.width,
			height: canvas.height,
			originalSize,
			processedSize: blob.size,
		};
	}

	/** 解码原图（不抠图时使用），含 EXIF 方向修正 */
	private async _decodeOriginal(file: Blob): Promise<Cutout> {
		const bitmap = await this._decodeBitmap(file);
		const canvas = document.createElement("canvas");
		canvas.width = bitmap.width;
		canvas.height = bitmap.height;
		const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
		ctx.drawImage(bitmap, 0, 0);
		bitmap.close?.();
		return { canvas, width: canvas.width, height: canvas.height };
	}

	/** 获取（或复用）文件的抠图结果 */
	private async _getCutout(file: Blob): Promise<Cutout> {
		if (this.cutoutCache?.file === file) return this.cutoutCache.promise;
		const promise = this._runCutout(file);
		this.cutoutCache = { file, promise };
		try {
			return await promise;
		} catch (e) {
			this.cutoutCache = null;
			throw e;
		}
	}

	private async _runCutout(file: Blob): Promise<Cutout> {
		const session = await this.load();

		this.updateStatus({ loading: true, ready: true, stage: "AI 正在识别图片主体..." });

		// 解码（createImageBitmap 默认 imageOrientation: from-image，修正 EXIF）
		const bitmap = await this._decodeBitmap(file);
		const width = bitmap.width;
		const height = bitmap.height;

		try {
			// ---- 原图 RGBA ----
			const origCanvas = document.createElement("canvas");
			origCanvas.width = width;
			origCanvas.height = height;
			const origCtx = origCanvas.getContext("2d", { willReadFrequently: true })!;
			origCtx.drawImage(bitmap, 0, 0);
			const origData = origCtx.getImageData(0, 0, width, height).data;

			// ---- 1024² 模型输入（对齐 rembg normalize：LANCZOS 缩放 + 归一化）----
			const inputCanvas = document.createElement("canvas");
			inputCanvas.width = MODEL_SIZE;
			inputCanvas.height = MODEL_SIZE;
			const inputCtx = inputCanvas.getContext("2d", { willReadFrequently: true })!;
			drawHighQuality(inputCtx, bitmap, 0, 0, MODEL_SIZE, MODEL_SIZE);
			const inputPixels = inputCtx.getImageData(0, 0, MODEL_SIZE, MODEL_SIZE).data;

			let maxValue = 1e-6;
			for (let i = 0; i < inputPixels.length; i += 4) {
				const r = inputPixels[i];
				const g = inputPixels[i + 1];
				const b = inputPixels[i + 2];
				if (r > maxValue) maxValue = r;
				if (g > maxValue) maxValue = g;
				if (b > maxValue) maxValue = b;
			}

			// NCHW float32：(x / max - 0.5) / 1.0
			const plane = MODEL_SIZE * MODEL_SIZE;
			const inputData = new Float32Array(3 * plane);
			for (let p = 0, i = 0; p < plane; p++, i += 4) {
				inputData[p] = inputPixels[i] / maxValue - 0.5;
				inputData[plane + p] = inputPixels[i + 1] / maxValue - 0.5;
				inputData[2 * plane + p] = inputPixels[i + 2] / maxValue - 0.5;
			}

			// ---- ONNX 推理 ----
			const inputName = session.inputNames[0];
			const outputName = session.outputNames[0];
			const tensor = new ort.Tensor("float32", inputData, [1, 3, MODEL_SIZE, MODEL_SIZE]);
			const outputs = await session.run({ [inputName]: tensor });
			const output = outputs[outputName];
			const pred = output.data as Float32Array; // [1,1,1024,1024]

			// ---- mask min-max 拉伸到 0-1（对齐 DisSession.predict）----
			let ma = -Infinity;
			let mi = Infinity;
			for (let i = 0; i < pred.length; i++) {
				const v = pred[i];
				if (v > ma) ma = v;
				if (v < mi) mi = v;
			}
			const range = ma - mi || 1;

			const maskCanvas = document.createElement("canvas");
			maskCanvas.width = MODEL_SIZE;
			maskCanvas.height = MODEL_SIZE;
			const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true })!;
			const maskImg = maskCtx.createImageData(MODEL_SIZE, MODEL_SIZE);
			for (let i = 0, j = 0; i < pred.length; i++, j += 4) {
				const v = Math.round(((pred[i] - mi) / range) * 255);
				maskImg.data[j] = v;
				maskImg.data[j + 1] = v;
				maskImg.data[j + 2] = v;
				maskImg.data[j + 3] = 255;
			}
			maskCtx.putImageData(maskImg, 0, 0);

			// ---- mask 缩回原尺寸（rembg 用 LANCZOS）----
			const fullMaskCanvas = document.createElement("canvas");
			fullMaskCanvas.width = width;
			fullMaskCanvas.height = height;
			const fullMaskCtx = fullMaskCanvas.getContext("2d", { willReadFrequently: true })!;
			drawHighQuality(fullMaskCtx, maskCanvas, 0, 0, width, height);
			const maskAlpha = fullMaskCtx.getImageData(0, 0, width, height).data;

			// ---- naive_cutout：Image.composite(img, empty, mask) ----
			// RGB = 原图 * mask，Alpha = mask
			const cutoutCanvas = document.createElement("canvas");
			cutoutCanvas.width = width;
			cutoutCanvas.height = height;
			const cutoutCtx = cutoutCanvas.getContext("2d", { willReadFrequently: true })!;
			const cutoutImg = cutoutCtx.createImageData(width, height);
			for (let p = 0, i = 0; p < width * height; p++, i += 4) {
				const a = maskAlpha[i]; // 灰度 mask，取 R 通道即可
				cutoutImg.data[i] = (origData[i] * a) / 255;
				cutoutImg.data[i + 1] = (origData[i + 1] * a) / 255;
				cutoutImg.data[i + 2] = (origData[i + 2] * a) / 255;
				cutoutImg.data[i + 3] = a;
			}
			cutoutCtx.putImageData(cutoutImg, 0, 0);

			return { canvas: cutoutCanvas, width, height };
		} finally {
			bitmap.close?.();
			this.updateStatus({ loading: false, stage: "就绪" });
		}
	}

	/** 把 RGBA 抠图合成到纯色背景（对齐 _compose_on_background），返回 RGB 画布 */
	private _composeOnBackground(
		cutout: Cutout,
		[br, bg, bb]: [number, number, number]
	): HTMLCanvasElement {
		const { canvas, width, height } = cutout;
		const out = document.createElement("canvas");
		out.width = width;
		out.height = height;
		const ctx = out.getContext("2d", { willReadFrequently: true })!;

		// 底图填充背景色
		ctx.fillStyle = `rgb(${br},${bg},${bb})`;
		ctx.fillRect(0, 0, width, height);

		const srcCtx = canvas.getContext("2d", { willReadFrequently: true })!;
		const src = srcCtx.getImageData(0, 0, width, height).data;
		const dst = ctx.getImageData(0, 0, width, height).data;

		// out = bg * (1-a) + cutout * a（cutout 的 RGB 已按 mask 预乘）
		for (let i = 0; i < src.length; i += 4) {
			const af = src[i + 3] / 255;
			dst[i] = br * (1 - af) + src[i] * af;
			dst[i + 1] = bg * (1 - af) + src[i + 1] * af;
			dst[i + 2] = bb * (1 - af) + src[i + 2] * af;
			dst[i + 3] = 255;
		}
		ctx.putImageData(new ImageData(dst, width, height), 0, 0);
		return out;
	}

	/** 短边居中补边至正方形（对齐 _pad_to_square） */
	private _padToSquare(
		src: HTMLCanvasElement,
		background: string,
		keepAlpha: boolean
	): HTMLCanvasElement {
		const side = Math.max(src.width, src.height);
		if (side === src.width && side === src.height) return src;

		const out = document.createElement("canvas");
		out.width = side;
		out.height = side;
		const ctx = out.getContext("2d")!;
		if (!keepAlpha) {
			const [r, g, b] = hexToRgb(background);
			ctx.fillStyle = `rgb(${r},${g},${b})`;
			ctx.fillRect(0, 0, side, side);
		}
		const dx = Math.floor((side - src.width) / 2);
		const dy = Math.floor((side - src.height) / 2);
		ctx.drawImage(src, dx, dy);
		return out;
	}

	/** 等比缩放到不超过最大宽高（只缩不放，对齐 _resize_within / ImageOps.contain） */
	private _resizeWithin(
		src: HTMLCanvasElement,
		maxWidth: number,
		maxHeight: number
	): HTMLCanvasElement {
		const targetW = maxWidth > 0 ? maxWidth : src.width;
		const targetH = maxHeight > 0 ? maxHeight : src.height;
		if (src.width <= targetW && src.height <= targetH) return src;

		const scale = Math.min(targetW / src.width, targetH / src.height, 1);
		const w = Math.max(1, Math.round(src.width * scale));
		const h = Math.max(1, Math.round(src.height * scale));

		const out = document.createElement("canvas");
		out.width = w;
		out.height = h;
		const ctx = out.getContext("2d")!;
		drawHighQuality(ctx, src, 0, 0, w, h);
		return out;
	}

	private async _decodeBitmap(file: Blob): Promise<ImageBitmap> {
		try {
			// from-image：按 EXIF Orientation 修正（现代浏览器默认即此行为，显式传入兜底）
			return await createImageBitmap(file, {
				imageOrientation: "from-image",
			} as ImageBitmapOptions);
		} catch {
			return await createImageBitmap(file);
		}
	}
}

export const wasmImageService = new WasmImageService();
