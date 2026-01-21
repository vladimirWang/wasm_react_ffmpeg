import React from "react";
import StockInForm from "./StockInForm";
import { createStockIn } from "../../api/stockIn";
import { IProductJoinStockIn } from "../../api/stockIn";
import { IVendorUpdateParams } from "../../api/vendor";

export default function StockInCreate() {
	const onFinishCallback = async (
		formValue: IVendorUpdateParams & { productJoinStockIn: IProductJoinStockIn[] }
	) => {
		const res = await createStockIn(formValue);

		return Promise.resolve();
	};
	return (
		<div>
			<StockInForm onFinishCallback={onFinishCallback} pageOperation="create" />
		</div>
	);
}
