import StockOutForm from "./StockOutForm";
import {
	getStockOutDetailById,
	IStockOut,
	updateStockOut,
	IProductJoinStockOut,
} from "../../api/stockOut";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import { message, Spin } from "antd";

export default function StockInUpdate() {
	// const [initialValues, setInitialValues] = useState<IStockIn>();
	const { id } = useParams();
	// const loadDetail = async () => {
	// 	try {
	// 		const res = await getStockInDetailById(Number(id));
	// 		if (res.code === 200) {
	// 			console.log("res, ", res.data);
	// 		}
	// 	} catch (e) {}
	// };
	// useEffect(() => {
	// 	loadDetail();
	// }, []);
	const fetcher = async (id: number) => {
		try {
			const res = await getStockOutDetailById(Number(id));
			if (res.code === 200) {
				// setInitialValues(res.data);
				return res.data;
			}
		} catch (e) {}
	};
	const [completed, setCompleted] = useState(false);
	// const [joinData, setJoinData] = useState<IProductJoinStockIn[]>([]);
	const {
		data: initialValues,
		isLoading,
		error,
	} = useSWR(id, fetcher, { revalidateOnFocus: false });
	const onFinishCallback = async (
		formValue: { remark?: string } & { productJoinStockOut: IProductJoinStockOut[] }
	) => {
		setCompleted(false);
		// console.log(formValue, "--formvalue");
		const res = await updateStockOut(Number(id), formValue);
		if (res.code !== 200) {
			message.warning(res.message);
		} else {
			message.success(res.message);
		}
		return Promise.resolve();
	};
	useEffect(() => {
		if (!initialValues) return;
		setCompleted(true);
		// setJoinData(initialValues);
		// setJoinData(initialValues.productsJoinStock);
		// console.log("initialValues: ", initialValues);
	}, [initialValues]);
	return (
		<div>
			<Spin spinning={isLoading}>
				{completed && (
					<StockOutForm
						initialValues={initialValues}
						// joinData={joinData}
						onFinishCallback={onFinishCallback}
						pageOperation="update"
					/>
				)}
			</Spin>
		</div>
	);
}
