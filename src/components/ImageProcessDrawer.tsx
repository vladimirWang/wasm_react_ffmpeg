import { useEffect, useRef, useState } from "react";
import {
	CloseOutlined,
	CheckOutlined,
	UploadOutlined,
	UndoOutlined,
	LoadingOutlined,
} from "@ant-design/icons";
import { Button, Drawer, message } from "antd";
import { wasmImageService } from "../services/wasmImageService";
import type { WasmModelStatus } from "../services/wasmImageService";
import type { ProcessResult } from "../types/pyodide";

interface ImageProcessDrawerProps {
	/** 是否打开抽屉 */
	open: boolean;
	/** 原始图片 */
	originalFile: File | Blob | null;
	/** 原图预览 URL */
	originalUrl?: string;
	/** 关闭抽屉 */
	onClose: () => void;
	/** 使用处理结果（替换当前图片） */
	onUseResult: (result: ProcessResult) => void;
	/** 保留原图（不替换） */
	onKeepOriginal?: () => void;
	/** 重新上传 */
	onReupload?: () => void;
}

/** 电商预设背景色 */
const BG_PRESETS = [
	{ name: "纯白", hex: "#FFFFFF" },
	{ name: "浅灰", hex: "#F3F4F6" },
	{ name: "中灰", hex: "#E5E7EB" },
	{ name: "暖黄", hex: "#FEF3C7" },
	{ name: "浅橙", hex: "#FFEDD5" },
	{ name: "浅蓝", hex: "#DBEAFE" },
	{ name: "浅绿", hex: "#DCFCE7" },
	{ name: "浅粉", hex: "#FCE7F3" },
];

export default function ImageProcessDrawer({
	open,
	originalFile,
	originalUrl,
	onClose,
	onUseResult,
	onKeepOriginal,
	onReupload,
}: ImageProcessDrawerProps) {
	/** 当前选中的背景色 */
	const [bgColor, setBgColor] = useState<string>("#FFFFFF");
	/** 处理后的图片结果 */
	const [processedResult, setProcessedResult] = useState<ProcessResult | null>(null);
	/** 处理中状态 */
	const [processing, setProcessing] = useState(false);
	/** 处理失败提示（供底部状态区展示） */
	const [errorText, setErrorText] = useState("");
	/** WASM AI 模型加载/推理状态 */
	const [modelStatus, setModelStatus] = useState<WasmModelStatus>(() =>
		wasmImageService.getStatus()
	);
	/** 当前处理的颜色（用于防抖，避免快速切换时的竞态） */
	const processingColorRef = useRef<string>("");

	// 订阅 WASM 模型状态（首次下载 170MB 模型时有进度）
	useEffect(() => {
		const unsubscribe = wasmImageService.subscribe(s => setModelStatus(s));
		return () => {
			unsubscribe();
		};
	}, []);

	// 抽屉打开且有原图时，自动处理一次
	useEffect(() => {
		if (open && originalFile && !processedResult && !processing) {
			handleProcessImage("#FFFFFF");
		}
		// 仅在 open 或 originalFile 变化时触发
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, originalFile]);

	// 抽屉关闭时重置状态
	useEffect(() => {
		if (!open) {
			setProcessedResult(null);
			setBgColor("#FFFFFF");
			setErrorText("");
			processingColorRef.current = "";
		}
	}, [open]);

	/**
	 * 处理图片：浏览器内 WASM 运行 isnet AI 抠图（与 Python image_service 同模型同逻辑），
	 * 再把抠出的商品主体合成到选中的背景色上，方形补边 + 等比缩放。
	 * 首次使用会下载约 170MB 模型（浏览器缓存后无需重下）；切换背景色复用抠图结果。
	 */
	const handleProcessImage = async (color: string) => {
		if (!originalFile) return;
		// 同一颜色处理中或已出结果时不重复请求（失败后会放开，允许重试）
		if (processingColorRef.current === color) return;

		processingColorRef.current = color;
		setProcessing(true);
		setBgColor(color);
		setErrorText("");

		try {
			const result = await wasmImageService.processImage(originalFile, {
				removeBackground: true,
				square: true,
				background: color,
				format: "JPEG",
				quality: 90,
				maxWidth: 800,
				maxHeight: 800,
			});

			// 防止竞态：只有当处理的颜色仍是当前请求的颜色时才更新
			if (processingColorRef.current === color) {
				setProcessedResult(result);
			}
		} catch (e) {
			console.error("图片处理失败:", e);
			if (processingColorRef.current === color) {
				setErrorText(e instanceof Error ? e.message : "图片处理失败，请重试");
				message.error("图片处理失败，请重试");
				// 放开同色重试
				processingColorRef.current = "";
			}
		} finally {
			if (processingColorRef.current === color) {
				setProcessing(false);
			}
		}
	};

	/** 点击预设颜色 */
	const handleColorClick = (color: string) => {
		handleProcessImage(color);
	};

	/** 自定义颜色变化（拖动取色器触发频繁，做 300ms 防抖） */
	const customColorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const handleCustomColor = (e: React.ChangeEvent<HTMLInputElement>) => {
		const color = e.target.value;
		setBgColor(color);
		if (customColorTimerRef.current) clearTimeout(customColorTimerRef.current);
		customColorTimerRef.current = setTimeout(() => {
			handleProcessImage(color);
		}, 300);
	};

	/** 使用处理结果 */
	const handleUseResult = () => {
		if (processedResult) {
			onUseResult(processedResult);
			onClose();
		}
	};

	/** 保留原图 */
	const handleKeepOriginal = () => {
		onKeepOriginal?.();
		onClose();
	};

	/** 重新上传 */
	const handleReupload = () => {
		onReupload?.();
		onClose();
	};

	// 处理后图片的 Blob URL
	const processedUrl = processedResult
		? URL.createObjectURL(
				new Blob([processedResult.image as any], { type: processedResult.mimeType })
			)
		: "";

	return (
		<Drawer
			open={open}
			onClose={onClose}
			width={440}
			closable={false}
			drawerStyle={{
				boxShadow:
					"-6px 0 12px rgba(0,0,0,0.06), -18px 0 36px rgba(0,0,0,0.12), -40px 0 80px rgba(0,0,0,0.18), -72px 0 144px rgba(0,0,0,0.16)",
			}}
			title={
				<div className="flex items-center justify-between">
					<span className="text-base font-semibold">图片处理结果</span>
					<Button
						type="text"
						icon={<CloseOutlined />}
						onClick={onClose}
						className="!p-0 !w-8 !h-8 flex items-center justify-center"
					/>
				</div>
			}
			footer={
				<div className="space-y-3">
					<Button
						type="primary"
						block
						size="large"
						icon={<CheckOutlined />}
						onClick={handleUseResult}
						disabled={!processedResult || processing}
						className="!h-10 !bg-orange-500 hover:!bg-orange-600"
					>
						使用处理结果
					</Button>
					<div className="grid grid-cols-2 gap-3">
						<Button size="large" icon={<UndoOutlined />} onClick={handleKeepOriginal}>
							保留原图
						</Button>
						<Button size="large" icon={<UploadOutlined />} onClick={handleReupload}>
							重新上传
						</Button>
					</div>
				</div>
			}
		>
			<div className="space-y-5">
				{/* 层叠卡片对比区域 */}
				<div className="relative w-full pt-[75%]">
					{/* 后层：原图 */}
					<div
						className="absolute top-4 left-0 w-[55%] aspect-square rounded-lg border border-gray-200 bg-white p-1.5"
						style={{
							transform: "rotate(-3deg)",
							boxShadow:
								"0 2px 4px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.12), 0 20px 40px rgba(0,0,0,0.16), 0 40px 80px rgba(0,0,0,0.12)",
						}}
					>
						<div className="relative w-full h-full rounded-md overflow-hidden bg-gray-100">
							{originalUrl && (
								<img src={originalUrl} alt="原图" className="w-full h-full object-contain" />
							)}
							<span className="absolute bottom-2 left-2 inline-flex items-center rounded-full bg-black/60 text-white text-[10px] px-2 py-0.5 backdrop-blur-sm">
								原图
							</span>
						</div>
					</div>

					{/* 前层：处理后 */}
					<div
						className="absolute top-0 right-0 w-[60%] aspect-square rounded-lg border border-gray-200 bg-white overflow-hidden z-10"
						style={{
							transform: "rotate(2deg)",
							boxShadow:
								"0 2px 4px rgba(0,0,0,0.06), 0 10px 22px rgba(0,0,0,0.14), 0 26px 56px rgba(0,0,0,0.20), 0 48px 96px rgba(0,0,0,0.18)",
						}}
					>
						<div
							className="relative w-full h-full overflow-hidden"
							style={{ backgroundColor: bgColor }}
						>
							{processing && (
								<div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
									<div className="flex flex-col items-center">
										<LoadingOutlined className="text-orange-500 text-2xl mb-2" />
										<span className="text-xs text-gray-500">处理中...</span>
									</div>
								</div>
							)}
							{processedUrl && !processing && (
								<img src={processedUrl} alt="处理后" className="w-full h-full object-contain" />
							)}
							<span className="absolute bottom-2 right-2 inline-flex items-center rounded-full bg-orange-500 text-white text-[10px] px-2 py-0.5 shadow-sm z-10">
								处理后
							</span>
						</div>
					</div>
				</div>

				{/* 背景色选择 */}
				<div className="rounded-md border border-gray-200 p-4 space-y-3">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium text-gray-800">背景色</span>
						<span className="text-xs text-gray-400">点击可修改处理后图片背景</span>
					</div>
					<div className="flex flex-wrap gap-2.5">
						{BG_PRESETS.map(preset => {
							const isActive = bgColor.toLowerCase() === preset.hex.toLowerCase();
							return (
								<button
									key={preset.hex}
									type="button"
									onClick={() => handleColorClick(preset.hex)}
									className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
										isActive
											? "border-orange-500 ring-2 ring-orange-500/30"
											: "border-gray-200 hover:border-gray-300 hover:scale-110"
									}`}
									style={{ backgroundColor: preset.hex }}
									title={preset.name}
									aria-label={preset.name}
								/>
							);
						})}
					</div>
					<div className="flex items-center gap-3 pt-1">
						<div className="relative w-8 h-8 rounded-full border border-gray-200 overflow-hidden shrink-0">
							<input
								type="color"
								value={bgColor}
								onChange={handleCustomColor}
								className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer"
								aria-label="自定义背景色"
							/>
						</div>
						<span className="text-sm text-gray-500">自定义颜色</span>
					</div>
				</div>

				{/* 处理信息 */}
				<div
					className={`rounded-md border p-3 ${
						modelStatus.error ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
					}`}
				>
					{modelStatus.error ? (
						<div className="space-y-1">
							<p className="text-sm text-red-700">AI 模型不可用：{modelStatus.error}</p>
							<p className="text-xs text-red-600">关闭后重新打开抽屉可重试，或选择「保留原图」</p>
						</div>
					) : modelStatus.loading && !modelStatus.ready ? (
						<div className="space-y-1">
							<p className="text-sm text-gray-700 flex items-center gap-2">
								<LoadingOutlined className="text-orange-500" />
								{modelStatus.stage || "正在加载 AI 引擎"}（{modelStatus.progress}%）
							</p>
							<p className="text-xs text-green-700">
								🧠 首次使用需下载约 170MB 抠图模型，浏览器缓存后离线可用
							</p>
						</div>
					) : processing ? (
						<div className="space-y-1">
							<p className="text-sm text-gray-700 flex items-center gap-2">
								<LoadingOutlined className="text-orange-500 animate-spin" />
								{modelStatus.stage || "AI 正在处理图片"}
							</p>
							<p className="text-xs text-green-700">
								🔒 本地 Wasm 推理（isnet-general-use），图片不上传服务器
							</p>
						</div>
					) : processedResult ? (
						<div className="space-y-1">
							<p className="text-sm text-gray-700">
								已完成：方形 {processedResult.width}×{processedResult.height}
							</p>
							<p className="text-xs text-green-700 flex items-center gap-1">
								<CheckOutlined />
								纯本地 Wasm AI 抠图 · 零服务器调用 · 隐私安全
							</p>
						</div>
					) : (
						<p className="text-sm text-gray-500">准备处理图片...</p>
					)}
					{errorText && !modelStatus.error && (
						<p className="text-xs text-red-600 mt-1">{errorText}</p>
					)}
				</div>
			</div>
		</Drawer>
	);
}
