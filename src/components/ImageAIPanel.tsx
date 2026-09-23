import { useEffect, useRef, useState } from "react";
import {
	BulbOutlined,
	ThunderboltOutlined,
	InfoCircleOutlined,
	ReloadOutlined,
	CheckCircleOutlined,
	ExclamationCircleOutlined,
	StarOutlined,
	PictureOutlined,
	RollbackOutlined,
	CheckOutlined,
} from "@ant-design/icons";
import { Button, Progress, Tooltip, message } from "antd";
import { usePyodideImage } from "../hooks/usePyodideImage";
import type { ProcessResult, DominantColor } from "../types/pyodide";

interface ImageAIPanelProps {
	/** 当前图片的 File 或 Blob 对象 */
	imageFile: File | Blob | null;
	/** 背景色预览回调（点击颜色时实时触发） */
	onBgPreview?: (result: ProcessResult | null) => void;
	/** 应用处理结果回调（点击"应用"时触发） */
	onProcessed?: (result: ProcessResult) => void;
	/** 面板样式 */
	className?: string;
}

/** 电商常用预设背景色 */
const PRESET_BG_COLORS = [
	{ name: "纯白", hex: "#FFFFFF" },
	{ name: "浅灰", hex: "#F5F5F5" },
	{ name: "米色", hex: "#FFF8E7" },
	{ name: "天蓝", hex: "#E6F4FF" },
	{ name: "浅粉", hex: "#FFF0F3" },
	{ name: "薄荷", hex: "#E8FBF2" },
	{ name: "暖橙", hex: "#FFF0E6" },
	{ name: "薰衣", hex: "#F3EEFF" },
];

/** 格式化文件大小 */
function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** 评分颜色 */
function scoreColor(score: number): string {
	if (score >= 70) return "#52c41a";
	if (score >= 40) return "#faad14";
	return "#ff4d4f";
}

/** 判断颜色深浅，用于决定选中边框的颜色 */
function isLightColor(hex: string): boolean {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
	return brightness > 180;
}

export default function ImageAIPanel({ imageFile, onBgPreview, onProcessed, className }: ImageAIPanelProps) {
	const {
		status,
		analysis,
		suggestion,
		analyzing,
		processing,
		load,
		analyze,
		process,
		smartOptimize,
		reset,
	} = usePyodideImage();

	const fileRef = useRef<File | Blob | null>(null);
	/** 当前选中的背景色（用于预览和应用） */
	const [selectedBgColor, setSelectedBgColor] = useState<string | null>(null);
	/** 是否正在换背景 */
	const [changingBg, setChangingBg] = useState(false);

	// 图片变化时自动分析
	useEffect(() => {
		if (!imageFile) {
			reset();
			fileRef.current = null;
			setSelectedBgColor(null);
			onBgPreview?.(null);
			return;
		}
		if (fileRef.current === imageFile) return;
		fileRef.current = imageFile;
		setSelectedBgColor(null);
		onBgPreview?.(null);

		// 延迟自动分析，确保 Pyodide 有时间加载
		const doAutoAnalyze = async () => {
			try {
				await load();
				if (fileRef.current === imageFile && status.ready) {
					await analyze(imageFile);
				}
			} catch (e) {
				// 静默失败，用户可以手动点击分析
				console.warn("自动分析失败:", e);
			}
		};
		doAutoAnalyze();
	}, [imageFile, load, analyze, reset, status.ready]);

	/** 手动触发分析 */
	const handleAnalyze = async () => {
		if (!imageFile) return;
		const result = await analyze(imageFile);
		if (result) {
			message.success("图片分析完成");
		} else {
			message.error("分析失败，请重试");
		}
	};

	/** 一键智能优化 */
	const handleSmartOptimize = async () => {
		if (!imageFile) return;
		const result = await smartOptimize(imageFile);
		if (result) {
			message.success(`智能优化完成 (${result.width}×${result.height})`);
			onProcessed?.(result);
		} else {
			message.error("优化失败，请重试");
		}
	};

	/**
	 * 切换背景色（实时预览）
	 * 点击颜色时立即处理并通过回调通知父组件更新预览
	 */
	const handleBgColorClick = async (color: string) => {
		if (!imageFile || changingBg) return;

		// 如果点击已选中的颜色，取消选择
		if (selectedBgColor === color) {
			setSelectedBgColor(null);
			onBgPreview?.(null);
			return;
		}

		setSelectedBgColor(color);
		setChangingBg(true);

		try {
			const result = await process(imageFile, {
				square: true,
				background: color,
				format: "JPEG",
				quality: 90,
			});

			if (result) {
				onBgPreview?.(result);
			}
		} catch (e) {
			console.error("换背景失败:", e);
			message.error("换背景失败，请重试");
		} finally {
			setChangingBg(false);
		}
	};

	/**
	 * 应用当前选中的背景色（回调给父组件）
	 */
	const handleApplyBgColor = async () => {
		if (!imageFile || !selectedBgColor) return;
		setChangingBg(true);
		try {
			const result = await process(imageFile, {
				square: true,
				background: selectedBgColor,
				format: "JPEG",
				quality: 90,
			});
			if (result) {
				message.success(`已应用 ${selectedBgColor} 背景色`);
				onProcessed?.(result);
				// 应用后重置预览状态（最终结果已通过 onProcessed 交给父组件）
				setSelectedBgColor(null);
				onBgPreview?.(null);
			}
		} catch (e) {
			message.error("应用失败，请重试");
		} finally {
			setChangingBg(false);
		}
	};

	/** 恢复原图（取消预览） */
	const handleResetBg = () => {
		setSelectedBgColor(null);
		onBgPreview?.(null);
	};

	// 没有图片时不显示
	if (!imageFile) return null;

	return (
		<div className={`border border-gray-200 rounded-lg bg-white overflow-hidden ${className || ""}`}>
			{/* 头部 */}
			<div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-gray-100">
				<div className="flex items-center gap-2">
					<StarOutlined className="text-orange-500 text-base" />
					<span className="text-sm font-medium text-gray-800">AI 图片智能分析</span>
					{status.ready && (
						<Tooltip title="Python Wasm 引擎已就绪">
							<CheckCircleOutlined className="text-green-500 text-xs" />
						</Tooltip>
					)}
				</div>
				<Button
					type="text"
					size="small"
					icon={<ReloadOutlined spin={analyzing} />}
					onClick={handleAnalyze}
					disabled={analyzing || processing}
					className="text-xs"
				>
					{analyzing ? "分析中..." : "重新分析"}
				</Button>
			</div>

			{/* 加载状态 */}
			{status.loading && (
				<div className="px-4 py-6">
					<div className="text-center mb-3">
						<div className="text-sm text-gray-600 mb-2">{status.stage}</div>
						<Progress percent={status.progress} size="small" status="active" />
					</div>
					<div className="text-xs text-gray-400 text-center">
						首次加载约需 5-10 秒，后续使用无需等待
					</div>
				</div>
			)}

			{/* 加载失败 */}
			{status.error && (
				<div className="px-4 py-6 text-center">
					<ExclamationCircleOutlined className="text-red-500 text-2xl mb-2" />
					<div className="text-sm text-gray-600 mb-3">AI 引擎加载失败</div>
					<div className="text-xs text-gray-400 mb-3">{status.error}</div>
					<Button size="small" onClick={load}>
						重试
					</Button>
				</div>
			)}

			{/* 分析中 */}
			{analyzing && !status.loading && (
				<div className="px-4 py-6 text-center">
					<div className="inline-block animate-spin text-orange-500 text-xl mb-2">
						<StarOutlined />
					</div>
					<div className="text-sm text-gray-600">AI 正在分析图片...</div>
				</div>
			)}

			{/* 分析结果 */}
			{analysis && !analyzing && (
				<div className="p-4 space-y-4">
					{/* 基本信息 */}
					<div className="flex items-center gap-4 text-xs text-gray-500">
						<span>
							{analysis.width} × {analysis.height}
						</span>
						<span>{analysis.format}</span>
						<span>{formatSize(analysis.fileSize)}</span>
					</div>

					{/* 质量指标 */}
					<div className="grid grid-cols-3 gap-3">
						<QualityItem
							label="清晰度"
							value={analysis.sharpness}
							max={100}
							unit="分"
						/>
						<QualityItem
							label="亮度"
							value={analysis.brightness}
							max={255}
							unit=""
						/>
						<QualityItem
							label="色彩度"
							value={analysis.colorfulness}
							max={100}
							unit="%"
						/>
					</div>

					{/* 主色调 - 可点击换背景 */}
					{analysis.dominantColors && analysis.dominantColors.length > 0 && (
						<div>
							<div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
								<InfoCircleOutlined /> 主色调
								<span className="text-orange-500 ml-1">· 点击换背景</span>
							</div>
							<div className="flex flex-wrap gap-2">
								{analysis.dominantColors.map((c: DominantColor, i: number) => {
									const isSelected = selectedBgColor === c.hex;
									const light = isLightColor(c.hex);
									return (
										<button
											key={i}
											onClick={() => handleBgColorClick(c.hex)}
											disabled={changingBg}
											className="relative group"
											title={`${c.hex} (${c.ratio}%) - 点击设为背景色`}
										>
											<div
												className={`w-9 h-9 rounded-md border-2 shadow-sm transition-all duration-200 ${
													isSelected
														? "scale-110 ring-2 ring-offset-1 ring-orange-400"
														: "border-gray-200 hover:scale-105 hover:shadow-md"
												}`}
												style={{
													backgroundColor: c.hex,
													borderColor: isSelected
														? light
															? "#F97316"
															: "#F97316"
														: undefined,
												}}
											>
												{isSelected && (
													<CheckOutlined
														className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs`}
														style={{ color: light ? "#F97316" : "#fff" }}
													/>
												)}
											</div>
											<span className="text-[10px] text-gray-400 mt-1 block text-center">
												{c.ratio}%
											</span>
										</button>
									);
								})}
							</div>
						</div>
					)}

					{/* 预设背景色 - 电商常用 */}
					<div>
						<div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
							<PictureOutlined /> 预设背景
						</div>
						<div className="flex flex-wrap gap-1.5">
							{PRESET_BG_COLORS.map((preset, i) => {
								const isSelected = selectedBgColor === preset.hex;
								const light = isLightColor(preset.hex);
								return (
									<button
										key={i}
										onClick={() => handleBgColorClick(preset.hex)}
										disabled={changingBg}
										className="relative group"
										title={`${preset.name} ${preset.hex} - 点击设为背景色`}
									>
										<div
											className={`w-7 h-7 rounded border-2 transition-all duration-200 ${
												isSelected
													? "scale-110 ring-2 ring-offset-1 ring-orange-400"
													: "border-gray-200 hover:scale-105 hover:shadow"
											}`}
											style={{ backgroundColor: preset.hex }}
										>
											{isSelected && (
												<CheckOutlined
													className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px]"
													style={{ color: light ? "#F97316" : "#fff" }}
												/>
											)}
										</div>
									</button>
								);
							})}
						</div>
					</div>

					{/* 当前选中背景色操作栏 */}
					{selectedBgColor && (
						<div className="flex items-center justify-between px-3 py-2 rounded-md bg-orange-50 border border-orange-100">
							<div className="flex items-center gap-2">
								<div
									className="w-5 h-5 rounded border border-gray-300"
									style={{ backgroundColor: selectedBgColor }}
								/>
								<span className="text-xs text-gray-700">
									{changingBg ? "处理中..." : `已选 ${selectedBgColor}`}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<Button
									size="small"
									type="text"
									icon={<RollbackOutlined />}
									onClick={handleResetBg}
									disabled={changingBg}
									className="text-xs h-6 px-2"
								>
									取消
								</Button>
								<Button
									size="small"
									type="primary"
									icon={<CheckOutlined />}
									onClick={handleApplyBgColor}
									loading={changingBg}
									className="text-xs h-6 px-2 bg-orange-500 hover:bg-orange-600!"
								>
									应用
								</Button>
							</div>
						</div>
					)}

					{/* 优化建议 */}
					{analysis.suggestions && analysis.suggestions.length > 0 && (
						<div>
							<div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
								<BulbOutlined /> AI 建议
							</div>
							<div className="space-y-1.5">
								{analysis.suggestions.map((s: string, i: number) => (
									<div key={i} className="flex items-start gap-2 text-xs">
										<span className="text-orange-400 mt-0.5">•</span>
										<span className="text-gray-600 leading-relaxed">{s}</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* 智能优化按钮 */}
					<div className="pt-2 border-t border-gray-100">
						{suggestion && (
							<div className="text-xs text-gray-500 mb-2">
								<Tooltip title={suggestion.reason}>
									<span className="cursor-help">
										<ThunderboltOutlined className="text-orange-500 mr-1" />
										方案：{suggestion.presetName}
									</span>
								</Tooltip>
							</div>
						)}
						<Button
							type="primary"
							block
							size="small"
							icon={<ThunderboltOutlined />}
							loading={processing}
							onClick={handleSmartOptimize}
							className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-none!"
						>
							{processing ? "优化中..." : "一键智能优化"}
						</Button>
						<div className="text-[10px] text-gray-400 text-center mt-1.5">
							本地 Wasm 处理，不上传服务器，保护隐私
						</div>
					</div>
				</div>
			)}

			{/* 未分析且未加载中 */}
			{!analysis && !analyzing && !status.loading && status.ready && (
				<div className="px-4 py-6 text-center">
					<div className="text-sm text-gray-500 mb-3">点击按钮开始 AI 分析</div>
					<Button type="primary" size="small" icon={<StarOutlined />} onClick={handleAnalyze}>
						智能分析图片
					</Button>
				</div>
			)}
		</div>
	);
}

/** 质量指标项 */
function QualityItem({
	label,
	value,
	max,
	unit,
}: {
	label: string;
	value: number;
	max: number;
	unit: string;
}) {
	const percent = Math.min(100, (value / max) * 100);
	const color = scoreColor(percent);

	return (
		<div className="text-center">
			<div className="text-xs text-gray-500 mb-1">{label}</div>
			<div className="text-lg font-semibold" style={{ color }}>
				{Math.round(value)}
				<span className="text-xs font-normal text-gray-400 ml-0.5">{unit}</span>
			</div>
			<div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-1">
				<div
					className="h-full rounded-full transition-all duration-500"
					style={{ width: `${percent}%`, backgroundColor: color }}
				/>
			</div>
		</div>
	);
}
