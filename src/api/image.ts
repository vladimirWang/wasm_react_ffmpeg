import { message } from "antd";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/nodejs_api";

export interface StandardizeParams {
	/** AI 抠图（Python 端需装 rembg） */
	removeBackground?: boolean;
	/** 等比缩放最大宽（只缩不放） */
	maxWidth?: number;
	/** 等比缩放最大高 */
	maxHeight?: number;
	/** 短边补边成正方形 */
	square?: boolean;
	/** 补边/底色，默认 #FFFFFF */
	background?: string;
	/** 输出格式 PNG / JPEG / WEBP；不传沿用原格式 */
	format?: "PNG" | "JPEG" | "WEBP";
	/** 压缩质量 1-100 */
	quality?: number;
}

export interface StandardizeResult {
	blob: Blob;
	mimeType: string;
	width: number;
	height: number;
	originalSize: number;
	processedSize: number;
}

/**
 * POST /image/standardize（multipart/form-data）
 * 成功返回图片二进制，失败后端返回 ErrorResponse JSON——这里统一转成 Error 抛出
 */
export const standardizeImage = async (
	file: File | Blob,
	params: StandardizeParams = {},
): Promise<StandardizeResult> => {
	const formData = new FormData();
	formData.append("file", file);
	if (params.removeBackground) formData.append("removeBackground", "true");
	if (params.square) formData.append("square", "true");
	if (params.maxWidth) formData.append("maxWidth", String(params.maxWidth));
	if (params.maxHeight) formData.append("maxHeight", String(params.maxHeight));
	if (params.background) formData.append("background", params.background);
	if (params.format) formData.append("format", params.format);
	if (params.quality) formData.append("quality", String(params.quality));

	const token = localStorage.getItem("access_token");
	const resp = await fetch(`${API_BASE}/image/standardize`, {
		method: "POST",
		headers: token ? { authorization: token } : undefined,
		body: formData,
	});

	const contentType = resp.headers.get("content-type") || "";

	// 业务失败：后端返回 JSON（HTTP 200，code !== 200）
	if (contentType.includes("application/json")) {
		const data = await resp.json();
		const msg = data?.message || "图片标准化失败";
		message.error(msg);
		throw new Error(msg);
	}
	if (!resp.ok) {
		message.error("图片标准化失败");
		throw new Error(`图片标准化失败：HTTP ${resp.status}`);
	}

	const blob = await resp.blob();
	return {
		blob,
		mimeType: contentType.split(";")[0] || blob.type || "image/jpeg",
		width: Number(resp.headers.get("X-Image-Width") || 0),
		height: Number(resp.headers.get("X-Image-Height") || 0),
		originalSize: Number(resp.headers.get("X-Image-Original-Size") || 0),
		processedSize: Number(resp.headers.get("X-Image-Processed-Size") || blob.size),
	};
};
