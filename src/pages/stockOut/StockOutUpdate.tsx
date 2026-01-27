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
	const [stockOutData, setStockOutData] = useState<IStockOut>();
	const { id } = useParams();

	const fetcher = async (id: number) => {
		const res = await getStockOutDetailById(Number(id));
		return res;
	};
	const [completed, setCompleted] = useState(false);
	// const [joinData, setJoinData] = useState<IProductJoinStockIn[]>([]);
	const { data, isLoading, error } = useSWR(id, fetcher, { revalidateOnFocus: false });
	const onFinishCallback = async (
		formValue: { remark?: string } & { productJoinStockOut: IProductJoinStockOut[] }
	) => {
		try {
			await updateStockOut(Number(id), formValue);
		} finally {
			return Promise.resolve();
		}
	};
	useEffect(() => {
		if (!error && data) {
			setCompleted(true);
			setStockOutData(data);
		}
	}, [data, error]);
	useEffect(() => {
		setCompleted(false);
	}, []);
	return (
		<div>
			<Spin spinning={isLoading}>
				{completed && (
					<StockOutForm
						initialValues={stockOutData}
						// joinData={joinData}
						onFinishCallback={onFinishCallback}
						pageOperation="update"
					/>
				)}
			</Spin>
		</div>
	);
}
