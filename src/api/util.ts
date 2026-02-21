import { goRequest } from "../request";
import { IResponse } from "./commonDef";

interface IUploadFileParams {
	file: File;
}
interface IUploadFileResponse {
	filePath: string;
	baseUrl: string;
}
export const uploadFile = (fd: FormData): Promise<IUploadFileResponse> => {
	// const formData = new FormData();
	return goRequest.post<IUploadFileResponse>("/user/upload", fd, {
		headers: {
			"Content-Type": "multipart/form-data",
		},
	});
};

interface IFileExisted {
	existed: boolean;
	filePath: string;
	baseUrl: string;
}

export const checkFileExistedByHash = (hash: string): Promise<IFileExisted> => {
	return goRequest.get<IFileExisted>("/user/checkFileExisted/" + hash);
};
