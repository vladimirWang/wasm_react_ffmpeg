import { nodejsRequest } from "../request";
import { IPaginationResp, IPagination, IResponse } from "./commonDef";

export interface IPlatform {
	readonly id: number;
	name: string;
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
}

export const getPlatforms = async (): Promise<IPlatform[]> => {
	return nodejsRequest.get<IPlatform[]>("/platform");
};
