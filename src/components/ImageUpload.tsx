import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { message, Upload } from "antd";
import { RcFile } from "antd/es/upload";
import { useState } from "react";
import { md5File } from "../utils/file";
import { getTrueType } from "../utils/common";
import { checkAndUploadFile } from "../api/util";

interface ImageUploadProps {
	onChange?: (url: string) => void;
	value?: string;
}
export default function ImageUpload({ onChange, value }: ImageUploadProps) {
	const [uploading, setUploading] = useState(false);
	const [imageUrl, setImageUrl] = useState<string | undefined>(value);

	const uploadButton = (
		<button style={{ border: 0, background: "none" }} type="button">
			{uploading ? <LoadingOutlined /> : <PlusOutlined />}
			<div style={{ marginTop: 8 }}>Upload</div>
		</button>
	);

	const beforeUpload = (file: RcFile) => {
		const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
		if (!isJpgOrPng) {
			message.error("只能上传 JPG，PNG 格式图片!");
		}
		return isJpgOrPng;
	};
	const handleChange = (info: any) => {
		const status = info?.file?.status as string | undefined;
		setUploading(status === "uploading");
		const fileObj = info?.file?.originFileObj as RcFile | undefined;
		if (!fileObj) return;
		setImageUrl(URL.createObjectURL(fileObj));
	};
	const handleCustomRequest = async (options: any) => {
		try {
			const { file } = options;
			const md5 = await md5File(file);
			const res = await checkAndUploadFile(md5, file);
			const formData = new FormData();
			formData.append("file", file);

			formData.append("hash", md5);
			// const res = await uploadFile(formData);
			console.log("---res---: ", res);
			// form.setFieldsValue({
			// 	img: `${res.filePath}`,
			// });
			onChange?.(res.filePath);
		} catch (e) {
			message.error("上传失败: " + (e as Error).message);
		}
	};

	return (
		<Upload
			accept={".jpg,.jpeg,.png,.gif,.bmp,.webp"}
			name="file"
			listType="picture-card"
			className="avatar-uploader"
			showUploadList={false}
			customRequest={handleCustomRequest}
			beforeUpload={beforeUpload}
			onChange={handleChange}
		>
			{imageUrl ? (
				<div className="w-[100px] h-[100px] overflow-hidden flex justify-center items-center">
					<img
						draggable={false}
						src={imageUrl}
						alt="avatar"
						style={{ width: "100%", objectFit: "cover" }}
					/>
				</div>
			) : (
				uploadButton
			)}
		</Upload>
	);
}
