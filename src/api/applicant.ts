import { nodejsRequest } from "../request";
import { IPagination, IPaginationResp } from "./commonDef";
import { ParamEmail } from "./user";

const prefix = "/applicant";

export const checkInviteCode = (data: { email: string; inviteCode: string }): Promise<void> => {
	return nodejsRequest.post<void>(`${prefix}/checkInviteCode`, data);
};

// 获取邀请码
export const sendInviteCode = (
	data: ParamEmail & { tenantName?: string },
): Promise<void> => {
	return nodejsRequest.post<void>(`${prefix}/sendInviteCode`, data, { showSuccessMessage: true });
};
export interface IApplicant {
	id: number;
	email: string;
	inviteCode: string;
	status: string;
	tenantName?: string | null;
	createdAt: string;
	updatedAt: string;
}
export type IApplicantQueryResponse = IPaginationResp<IApplicant>;

// 申请人列表
export const getApplicants = (params: IPagination): Promise<IApplicantQueryResponse> => {
	return nodejsRequest.get<IApplicantQueryResponse>(`${prefix}`, { params });
};

// 审核申请人
export const approveApplication = (data: { id: number }): Promise<void> => {
	return nodejsRequest.post<void>(`${prefix}/approve`, data);
};

export const checkApplicantExisted = (email: string): Promise<boolean> => {
	return nodejsRequest.get<boolean>(`${prefix}/checkApplicantExisted/${email}`);
};
