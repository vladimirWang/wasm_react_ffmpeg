import StockInForm from "./StockInForm";
import { createStockIn, getStockInDetailById, IStockIn, updateStockIn } from "../../api/stockIn";
import { IProductJoinStockIn } from "../../api/stockIn";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import { message, Spin } from "antd";

export default function StockInUpdate() {
	const [stockInData, setStockInData] = useState<IStockIn>();
	const { id } = useParams();

	const fetcher = async (id: number) => {
		const res = await getStockInDetailById(Number(id));
		return res;
	};
	const [completed, setCompleted] = useState(false);
	// const [joinData, setJoinData] = useState<IProductJoinStockIn[]>([]);
	const { data, isLoading, error } = useSWR(id, fetcher, { revalidateOnFocus: false });
	const onFinishCallback = async (
		formValue: { remark?: string } & { productJoinStockIn: IProductJoinStockIn[] }
	) => {
		setCompleted(false);
		try {
			await updateStockIn(Number(id), formValue);
		} catch (e) {
			message.error((e as Error).message);
		} finally {
			return Promise.resolve();
		}
	};
	useEffect(() => {
		if (!error && data) {
			setCompleted(true);
			setStockInData(data);
		}
		// setJoinData(initialValues);
		// setJoinData(initialValues.productsJoinStock);
		// console.log("initialValues: ", initialValues);
	}, [error, data]);
	return (
		<div>
			<Spin spinning={isLoading}>
				{completed && (
					<StockInForm
						initialValues={stockInData}
						onFinishCallback={onFinishCallback}
						pageOperation="update"
					/>
				)}
			</Spin>
		</div>
	);
}
