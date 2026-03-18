import { useMemo } from "react";
import { IPaginationResp } from "../api/commonDef";
// 当前选中的行是否是已删除的
export const useSelectedRowsAreDeleted = <T extends { deletedAt?: Date }>(
	selectedRowKeys: React.Key[],
	origin?: IPaginationResp<T>
) => {
	return useMemo(() => {
		if (selectedRowKeys.length === 0) return false;
		const firstRecordDeletedAt = origin?.list?.[0]?.deletedAt;
		return firstRecordDeletedAt !== null;
	}, [selectedRowKeys, origin]);
};

