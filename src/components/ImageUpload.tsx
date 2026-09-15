import { LoadingOutlined, PlusOutlined, DeleteOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { Button, message, Switch, Upload } from "antd";
import { RcFile } from "antd/es/upload";
import { useEffect, useState } from "react";
import { md5File } from "../utils/file";
import { checkAndUploadFile } from "../api/util";
import { standardizeImage } from "../api/image";
import type { GetProps } from "antd";

interface ImageUploadProps {
	onChange?: (url: string[]) => void;
	value?: string[];
	/** 显示「一键标准化」按钮：白底方形补边 + 缩放到 800×800 + JPEG 85 质量 */
	showStandardize?: boolean;
}

/** mime → 文件扩展名 */
const MIME_EXT: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/jpg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
};

export default function ImageUpload({
	onChange,
	value,
	showStandardize,
	...restProps
}: ImageUploadProps & GetProps<typeof Upload>) {
	const [uploading, setUploading] = useState(false);
	const [standardizing, setStandardizing] = useState(false);
	/** AI 抠图开关：开启后标准化会扣除背景只保留主体，其余区域铺纯色底 */
	const [removeBg, setRemoveBg] = useState(true);
	const [imageUrl, setImageUrl] = useState<string[]>(value ?? []);

	// 外部 value 变化时同步内部预览（表单回显、标准化后程序化更新都依赖它）
	useEffect(() => {
		const next = value ?? [];
		setImageUrl(prev => (prev.join("|") === next.join("|") ? prev : next));
	}, [value]);

	const uploadButton = (
		<button style={{ border: 0, background: "none" }} type="button">
			{uploading ? <LoadingOutlined /> : <PlusOutlined />}
			<div style={{ marginTop: 8 }}>Upload</div>
		</button>
	);

	const beforeUpload = (file: RcFile) => {
		return true;
		// const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
		// if (!isJpgOrPng) {
		// 	message.error("只能上传 JPG，PNG 格式图片!");
		// }
		// return isJpgOrPng;
	};
	const handleChange = (info: any) => {
		// 不要在这里往 imageUrl 里追加：否则选第三张时 length 立刻变为 3，Upload 会被卸载，customRequest 无法执行
	};
	const handleCustomRequest = async (options: any) => {
		try {
			const { file } = options;
			setUploading(true);
			const md5 = await md5File(file);
			const res = await checkAndUploadFile(md5, file);
			const fileUrl = URL.createObjectURL(file);
			setImageUrl([...imageUrl, fileUrl]);

			const prefix = /^https?:\/\/(localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):\d{4}/;
			const convertedValues = (value ?? []).map(url => {
				return url.replace(prefix, "");
			});
			onChange?.([...convertedValues, res.filePath]);
		} catch (e) {
			message.error("上传失败: " + (e as Error).message);
		} finally {
			setUploading(false);
		}
	};

	/**
	 * 一键标准化：
	 * 取当前图片 → 调 Python gRPC（/image/standardize，白底方形 800×800 JPEG）
	 * → 处理后的图走原有秒传链路 → 更新表单值与预览
	 */
	const handleStandardize = async () => {
		const source = value?.[0];
		if (!source) {
			message.warning("请先上传图片");
			return;
		}
		try {
			setStandardizing(true);
			// blob:（刚上传的本地预览）和 /uploads/xxx（已保存图片）都可直接 fetch
			const sourceBlob = await fetch(source).then(r => {
				if (!r.ok) throw new Error(`读取图片失败：HTTP ${r.status}`);
				return r.blob();
			});

			const result = await standardizeImage(sourceBlob, {
				removeBackground: removeBg,
				square: true,
				maxWidth: 800,
				maxHeight: 800,
				background: "#FFFFFF",
				format: "JPEG",
				quality: 85,
			});

			const ext = MIME_EXT[result.mimeType] ?? "jpg";
			const processedFile = new File([result.blob], `standardized.${ext}`, {
				type: result.mimeType,
			});
			const md5 = await md5File(processedFile);
			const res = await checkAndUploadFile(md5, processedFile);

			setImageUrl([URL.createObjectURL(result.blob)]);
			onChange?.([res.filePath]);
			message.success(`标准化完成：${result.width}×${result.height}`);
		} catch (e) {
			// standardizeImage 内部已弹错误提示，这里兜底网络层异常
			if (e instanceof TypeError) message.error("标准化服务不可用，请确认图片服务已启动");
		} finally {
			setStandardizing(false);
		}
	};

	/** AI 抠图开关提示文案 */
	const removeBgLabel = (
		<span className="text-xs text-gray-500">
			AI 抠图：只保留主体，其余换纯白底（约 1-3 秒）
		</span>
	);

	return (
		<div className="flex flex-col items-start gap-2 w-full min-w-0">
			<div className="flex flex-wrap items-center gap-2 w-full min-w-0">
				{imageUrl.map(url => {
					return (
						<div
							key={url}
							className="group relative w-[100px] h-[100px] shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-50 cursor-pointer"
						>
							<img draggable={false} src={url} alt="avatar" className="w-full h-full object-cover" />
							{/* hover 时显示的遮罩与图标 */}
							<div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
								<span className="w-8 h-8 flex items-center justify-center rounded-full bg-white/90 text-gray-700 hover:bg-white hover:text-red-500 transition-colors">
									<DeleteOutlined
										className="text-base"
										onClick={() => {
											const newImageUrl = imageUrl.filter(item => item !== url);
											setImageUrl(newImageUrl);
											onChange?.(newImageUrl);
										}}
									/>
								</span>
							</div>
						</div>
					);
				})}
				{imageUrl.length < (restProps.maxCount ?? 1) && (
					<Upload
						accept={".jpg,.jpeg,.png,.gif,.bmp,.webp"}
						name="file"
						listType="picture-card"
						className="avatar-uploader [&_.ant-upload]:m-0!"
						showUploadList={false}
						customRequest={handleCustomRequest}
						beforeUpload={beforeUpload}
						onChange={handleChange}
					>
						{uploadButton}
					</Upload>
				)}
			</div>
			{showStandardize && imageUrl.length > 0 && (
				<div className="flex flex-wrap items-center gap-3">
					<Button
						size="small"
						type="primary"
						ghost
						icon={<ThunderboltOutlined />}
						loading={standardizing}
						onClick={handleStandardize}
					>
						一键标准化（白底方形 800×800）
					</Button>
					<label className="flex items-center gap-1.5 cursor-pointer select-none">
						<Switch size="small" checked={removeBg} onChange={setRemoveBg} />
						{removeBgLabel}
					</label>
				</div>
			)}
		</div>
	);
}
