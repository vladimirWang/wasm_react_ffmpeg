import { goRequest } from "../request";
import { IResponse } from "./commonDef";

interface IUploadFileParams {
	file: File;
}
interface IUploadFileResponse {
	filePath: string;
	baseUrl: string;
}
export const uploadFile = (file: File): Promise<IUploadFileResponse> => {
	const formData = new FormData();
	formData.append("file", file);
	return goRequest.post<IUploadFileResponse>("/user/upload", formData, {
		headers: {
			"Content-Type": "multipart/form-data",
		},
	});
};
