import StockOutForm from "./StockOutForm";
import { getStockOutDetailById, IStockOut, updateStockOut } from "../../api/stockOut";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import { Spin } from "antd";

export default function StockInView() {
	const [stockOutData, setStockOutData] = useState<IStockOut>();
	const { id } = useParams();

	const fetcher = async (id: number) => {
		const res = await getStockOutDetailById(Number(id));
		return res;
	};
	const [completed, setCompleted] = useState(false);
	const { data, isLoading, error } = useSWR(id, fetcher, { revalidateOnFocus: false });

	useEffect(() => {
		if (!error && data) {
			setStockOutData(data);
			setCompleted(true);
		}
	}, [data, error]);
	useEffect(() => {
		setCompleted(false);
	}, []);
	return (
		<div>
			<Spin spinning={isLoading}>
				{completed && <StockOutForm initialValues={stockOutData} pageOperation="view" />}
			</Spin>
		</div>
	);
}
