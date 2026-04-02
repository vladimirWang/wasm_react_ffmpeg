import { nodejsRequest } from "../request";
import { IPagination, IPaginationResp } from "./commonDef";
import { ParamEmail } from "./user";

const prefix = "/applicant";

export const checkInviteCode = (data: { email: string; inviteCode: string }): Promise<void> => {
	return nodejsRequest.post<void>(`${prefix}/checkInviteCode`, data);
};

// 获取邀请码
export const sendInviteCode = (data: ParamEmail): Promise<void> => {
	return nodejsRequest.post<void>(`${prefix}/sendInviteCode`, data);
};
export interface IApplicant {
	id: number;
	email: string;
	inviteCode: string;
	status: string;
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
