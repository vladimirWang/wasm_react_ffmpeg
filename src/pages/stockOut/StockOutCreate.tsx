import StockOutForm from "./StockOutForm";
import {
	getStockOutDetailById,
	createStockOut,
	IStockOut,
	updateStockOut,
	IProductJoinStockOut,
} from "../../api/stockOut";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import { message, Spin } from "antd";

export default function StockInCreate() {
	const onFinishCallback = async (
		formValue: { remark?: string } & { productJoinStockOut: IProductJoinStockOut[] }
	) => {
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
				// initialValues={initialValues}
				// joinData={joinData}
				onFinishCallback={onFinishCallback}
				pageOperation="create"
			/>
		</div>
	);
}
