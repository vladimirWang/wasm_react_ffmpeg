import React from "react";
import StockInForm from "./StockInForm";
import { createStockIn } from "../../api/stockIn";
import { IProductJoinStockIn } from "../../api/stockIn";

export default function StockInCreate() {
	const onFinishCallback = async (
		formValue: { remark?: string },
		talbeValue: IProductJoinStockIn[]
	) => {
		const res = await createStockIn({ joinData: talbeValue, ...formValue });

		return Promise.resolve();
	};
	return (
		<div>
			<StockInForm onFinishCallback={onFinishCallback} pageOperation="create" />
		</div>
	);
}
