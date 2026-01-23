import React from "react";
import StockInForm from "./StockInForm";
import { createStockIn } from "../../api/stockIn";
import { IProductJoinStockIn } from "../../api/stockIn";
import { IVendorUpdateParams } from "../../api/vendor";
import { message } from "antd";

export default function StockInCreate() {
	const onFinishCallback = async (
		formValue: IVendorUpdateParams & { productJoinStockIn: IProductJoinStockIn[] }
	) => {
		const res = await createStockIn(formValue);
		if (res.code !== 200) {
			message.warning(res.message);
		} else {
			message.success(res.message);
		}
		return Promise.resolve();
	};
	return (
		<div>
			<StockInForm onFinishCallback={onFinishCallback} pageOperation="create" />
		</div>
	);
}
