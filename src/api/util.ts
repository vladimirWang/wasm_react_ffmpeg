import { goRequest } from "../request";
import { IResponse } from "./commonDef";
import { md5File } from "../utils/file";

interface IUploadFileParams {
	file: File;
}
interface IUploadFileResponse {
	filePath: string;
	baseUrl: string;
	hash: string;
}
export const uploadFile = async (file: File): Promise<IUploadFileResponse> => {
	const formData = new FormData();
	formData.append("file", file);

	const md5 = await md5File(file);
	formData.append("hash", md5);
	// const formData = new FormData();
	return goRequest.post<IUploadFileResponse>("/user/upload", formData, {
		headers: {
			"Content-Type": "multipart/form-data",
		},
	});
};

interface IFileExisted {
	// existed: boolean;
	filePath: string;
	baseUrl: string;
}

export const checkFileExistedByHash = (
	hash: string,
	config?: { showSuccessMessage?: boolean }
): Promise<IFileExisted> => {
	return goRequest.get<IFileExisted>("/user/checkFileExisted/" + hash, {
		showSuccessMessage: config?.showSuccessMessage,
	});
};

// 检查文件是否存在，不存在则上传
export const checkAndUploadFile = async (file: File): Promise<IUploadFileResponse> => {
	const md5 = await md5File(file);
	const existed = await checkFileExistedByHash(md5);
	if (existed.filePath) {
		return { ...existed, hash: md5 };
	}
	return uploadFile(file);
};

// 上传分片文件
export const uploadChunkFile = async (formData: FormData): Promise<IUploadFileResponse> => {
	return goRequest.post<IUploadFileResponse>("/user/uploadChunkFile", formData, {
		headers: {
			"Content-Type": "multipart/form-data",
		},
	});
};
