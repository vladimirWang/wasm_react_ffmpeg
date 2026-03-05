import { goRequest, nodejsRequest } from "../request";
import { IResponse } from "./commonDef";

interface IUploadFileParams {
	file: File;
}
interface IUploadFileResponse {
	filePath: string;
	baseUrl: string;
	hash: string;
}
export const uploadFile = async (formData: FormData): Promise<IUploadFileResponse> => {
	// return goRequest.post<IUploadFileResponse>("/user/upload", formData);
	console.log("---uploadFile---: ", formData);
	return nodejsRequest.post<IUploadFileResponse>("/user/upload", formData);
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
	// return goRequest.get<IFileExisted>("/user/checkFileExisted/" + hash, {
	// 	showSuccessMessage: config?.showSuccessMessage,
	// });
	return nodejsRequest.get<IFileExisted>("/user/checkFileExisted/" + hash, {
		showSuccessMessage: config?.showSuccessMessage,
	});
};

// 检查文件是否存在，不存在则上传
export const checkAndUploadFile = async (hash: string, file: File): Promise<IUploadFileResponse> => {
	const existed = await checkFileExistedByHash(hash);
	if (existed.filePath) {
		return { ...existed, hash };
	}
	const formData = new FormData();
	formData.append("hash", hash);
	formData.append("file", file);
	return uploadFile(formData);
};

// 上传分片文件
export const uploadChunkFile = async (formData: FormData): Promise<IUploadFileResponse> => {
	// return goRequest.post<IUploadFileResponse>("/user/uploadChunk", formData);
	return nodejsRequest.post<IUploadFileResponse>("/user/uploadChunk", formData);
};

interface IMergeChunkFilesParams {
	hash: string;
	filename: string;
}
// 上传分片文件
// "c40788c8a7c2198732b2031843a4f893"
export const mergeChunkFiles = async (
	data: IMergeChunkFilesParams
): Promise<IUploadFileResponse> => {
	// return goRequest.post<IUploadFileResponse>("/user/mergeChunks", data);
	return nodejsRequest.post<IUploadFileResponse>("/user/mergeChunks", data);
};
