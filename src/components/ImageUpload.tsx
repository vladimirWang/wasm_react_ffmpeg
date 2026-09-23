import { PlusOutlined, DeleteOutlined, LoadingOutlined } from "@ant-design/icons";
import { Upload, message } from "antd";
import { useEffect, useRef, useState } from "react";
import { md5File } from "../utils/file";
import { checkAndUploadFile } from "../api/util";
import ImageProcessDrawer from "./ImageProcessDrawer";
import type { GetProps } from "antd";
import type { ProcessResult } from "../types/pyodide";

interface ImageUploadProps {
	onChange?: (url: string[]) => void;
	value?: string[];
	/** 是否启用 AI 自动处理（上传后自动弹出处理结果抽屉） */
	autoProcess?: boolean;
}

/** mime → 文件扩展名 */
const MIME_EXT: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/jpg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
};

/** 去掉历史数据里的绝对地址前缀 */
function stripOrigin(url: string) {
	return url.replace(/^https?:\/\/(localhost|\d{1,3}(?:\.\d{1,3}){3}):\d{4}/, "");
}

export default function ImageUpload({
	onChange,
	value,
	autoProcess = true,
	...restProps
}: ImageUploadProps & GetProps<typeof Upload>) {
	const [uploading, setUploading] = useState(false);

	/** 表单值：服务器相对路径（/uploads/xxx.jpg） */
	const [serverUrls, setServerUrls] = useState<string[]>(() =>
		(value ?? []).map(stripOrigin)
	);
	/** 本会话刚上传/处理出来的图：服务器路径 → blob 预览地址 */
	const blobMap = useRef(new Map<string, string>());
	/** 当前最新的原始 File 对象（用于传给抽屉做处理） */
	const currentFileRef = useRef<File | Blob | null>(null);
	/** 抽屉是否打开 */
	const [drawerOpen, setDrawerOpen] = useState(false);
	/** 抽屉中展示的原图预览 URL */
	const [drawerOriginalUrl, setDrawerOriginalUrl] = useState<string>("");

	// 外部 value 变化时同步
	useEffect(() => {
		const next = (value ?? []).map(stripOrigin);
		setServerUrls(prev => (prev.join("|") === next.join("|") ? prev : next));
		if ((value?.length ?? 0) === 0) {
			currentFileRef.current = null;
		}
	}, [value]);

	/** 实际展示地址：优先本地 blob，否则用服务器相对路径 */
	const displayUrls = serverUrls.map(u => blobMap.current.get(u) ?? u);

	const uploadButton = (
		<button style={{ border: 0, background: "none" }} type="button">
			{uploading ? <LoadingOutlined /> : <PlusOutlined />}
			<div style={{ marginTop: 8 }}>Upload</div>
		</button>
	);

	const handleChange = (_info: any) => {
		// 不要在这里往 imageUrl 里追加
	};

	const handleCustomRequest = async (options: any) => {
		try {
			const { file } = options;
			setUploading(true);

			// 保存原始文件引用
			currentFileRef.current = file;

			// 秒传 + 上传
			const md5 = await md5File(file);
			const res = await checkAndUploadFile(md5, file);
			const filePath = stripOrigin(res.filePath);

			// 登记 blob 预览
			blobMap.current.set(filePath, URL.createObjectURL(file));
			const next = [...serverUrls, filePath];
			setServerUrls(next);
			onChange?.(next);

			// 自动处理：打开抽屉
			if (autoProcess) {
				setDrawerOriginalUrl(URL.createObjectURL(file));
				setDrawerOpen(true);
			}
		} catch (e) {
			message.error("上传失败: " + (e as Error).message);
		} finally {
			setUploading(false);
		}
	};

	/** 使用处理结果（替换当前图片） */
	const handleUseResult = async (result: ProcessResult) => {
		try {
			const ext = MIME_EXT[result.mimeType] ?? "jpg";
			const processedBlob = new Blob([result.image as any], { type: result.mimeType });
			const processedFile = new File([processedBlob], `processed.${ext}`, {
				type: result.mimeType,
			});

			const md5 = await md5File(processedFile);
			const res = await checkAndUploadFile(md5, processedFile);
			const filePath = stripOrigin(res.filePath);

			blobMap.current.set(filePath, URL.createObjectURL(processedBlob));
			currentFileRef.current = processedFile;
			setServerUrls([filePath]);
			onChange?.([filePath]);
			message.success("已使用处理后的图片");
		} catch (e) {
			message.error("保存处理结果失败: " + (e as Error).message);
		}
	};

	/** 保留原图（什么都不做，关闭抽屉即可） */
	const handleKeepOriginal = () => {
		// 保持现状
	};

	/** 重新上传（删除当前图片，触发重新上传） */
	const handleReupload = () => {
		// 删除当前图片，用户可以重新上传
		if (serverUrls.length > 0) {
			const next: string[] = [];
			setServerUrls(next);
			onChange?.(next);
			currentFileRef.current = null;
		}
	};

	const handleDelete = (index: number) => {
		const next = serverUrls.filter((_, i) => i !== index);
		setServerUrls(next);
		onChange?.(next);
		if (next.length === 0) {
			currentFileRef.current = null;
		}
	};

	return (
		<div className="flex flex-col items-start gap-3 w-full min-w-0">
			<div className="flex flex-wrap items-center gap-2 w-full min-w-0">
				{displayUrls.map((url, index) => {
					return (
						<div
							key={serverUrls[index] ?? url}
							className="group relative w-[100px] h-[100px] shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-50 cursor-pointer"
						>
							<img draggable={false} src={url} alt="avatar" className="w-full h-full object-cover" />
							{/* hover 时显示的遮罩与图标 */}
							<div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
								<span className="w-8 h-8 flex items-center justify-center rounded-full bg-white/90 text-gray-700 hover:bg-white hover:text-red-500 transition-colors">
									<DeleteOutlined className="text-base" onClick={() => handleDelete(index)} />
								</span>
							</div>
						</div>
					);
				})}
				{serverUrls.length < (restProps.maxCount ?? 1) && (
					<Upload
						accept={".jpg,.jpeg,.png,.gif,.bmp,.webp"}
						name="file"
						listType="picture-card"
						className="avatar-uploader [&_.ant-upload]:m-0!"
						showUploadList={false}
						customRequest={handleCustomRequest}
						beforeUpload={() => true}
						onChange={handleChange}
					>
						{uploadButton}
					</Upload>
				)}
			</div>

			{/* AI 图片处理结果抽屉 */}
			<ImageProcessDrawer
				open={drawerOpen}
				originalFile={currentFileRef.current}
				originalUrl={drawerOriginalUrl}
				onClose={() => setDrawerOpen(false)}
				onUseResult={handleUseResult}
				onKeepOriginal={handleKeepOriginal}
				onReupload={handleReupload}
			/>
		</div>
	);
}
