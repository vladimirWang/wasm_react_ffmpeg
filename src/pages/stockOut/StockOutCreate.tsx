import StockOutForm from "./StockOutForm";
import {
	getStockOutDetailById,
	createStockOut,
	IStockOut,
	updateStockOut,
	IProductJoinStockOut,
	IStockOutCreateParams,
} from "../../api/stockOut";
import { useEffect, useState } from "react";

export default function StockInCreate() {
	const onFinishCallback = async (formValue: IStockOutCreateParams) => {
		// console.log(formValue, "--formvalue");
		try {
			await createStockOut(formValue);
		} finally {
			return Promise.resolve();
		}
	};
	return (
		<div>
			<StockOutForm
				redirect={"/stockout/create"}
				// initialValues={initialValues}
				// joinData={joinData}
				onFinishCallback={onFinishCallback}
				pageOperation="create"
			/>
		</div>
	);
}
