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
		const res = await createStockOut(formValue);
		if (res.code !== 200) {
			message.warning(res.message);
		} else {
			message.success(res.message);
		}
		return Promise.resolve();
	};
	return (
		<div>
			<StockOutForm
				// initialValues={initialValues}
				// joinData={joinData}
				onFinishCallback={onFinishCallback}
				pageOperation="update"
			/>
		</div>
	);
}
