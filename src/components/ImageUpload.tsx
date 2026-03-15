import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { message, Upload } from "antd";
import { RcFile } from "antd/es/upload";
import { useEffect, useRef, useState } from "react";
import { md5File } from "../utils/file";
import { checkAndUploadFile } from "../api/util";
import type { GetProps } from "antd";

interface ImageUploadProps {
	onChange?: (url: string[]) => void;
	value?: string[];
}
export default function ImageUpload({
	onChange,
	value,
	...restProps
}: ImageUploadProps & GetProps<typeof Upload>) {
	const [uploading, setUploading] = useState(false);
	const [imageUrl, setImageUrl] = useState<string[]>(value ?? []);

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
		// const status = info?.file?.status as string | undefined;
		// setUploading(status === "uploading");
		// 不要在这里往 imageUrl 里追加：否则选第三张时 length 立刻变为 3，Upload 会被卸载，customRequest 无法执行
	};
	const handleCustomRequest = async (options: any) => {
		try {
			const { file } = options;
			setUploading(true);
			const md5 = await md5File(file);
			const res = await checkAndUploadFile(md5, file);
			// const currentList = listRef.current;
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

	return (
		<div className="flex flex-wrap items-center gap-2 w-full min-w-0">
			{imageUrl.map(url => {
				return (
					<div
						key={url}
						className="w-[100px] h-[100px] shrink-0 overflow-hidden flex justify-center items-center rounded border border-gray-200 bg-gray-50"
					>
						<img
							draggable={false}
							src={url}
							alt="avatar"
							style={{ width: "100%", height: "100%", objectFit: "cover" }}
						/>
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
	);
}
