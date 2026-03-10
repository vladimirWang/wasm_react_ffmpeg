import { nodejsRequest } from "../request";
import { IPaginationResp, IPagination, IResponse } from "./commonDef";

export interface IClient {
	readonly id: number;
	name: string;
	tel?: string;
	address?: string;
	remark?: string;
}

export type IClientBody = Omit<IClient, "id" | "createdAt" | "updatedAt" | "deletedAt">;

export type IClientQueryParams = IPagination & {
	name?: string;
	tel?: string;
	address?: string;
};

export const getClients = async (
	params?: IClientQueryParams
): Promise<IPaginationResp<IClient>> => {
	return nodejsRequest.get<IPaginationResp<IClient>>("/client", { params });
};

export const createClient = async (data: IClientBody): Promise<IClient> => {
	return nodejsRequest.post<IClient>("/client", data);
};

export type IClientUpdateParams = Partial<IClient>;
export const patchClient = async (id: number, data: IClientUpdateParams): Promise<IClient> => {
	return nodejsRequest.patch<IClient>("/client/" + id, data);
};

export const getClientDetailById = async (id: number): Promise<IClient> => {
	return nodejsRequest.get<IClient>("/client/" + id);
};
