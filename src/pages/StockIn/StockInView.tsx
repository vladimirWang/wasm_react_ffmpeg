import StockInForm from "./StockInForm";
import { createStockIn, getStockInDetailById, IStockIn, updateStockIn } from "../../api/stockIn";
import { IProductJoinStockIn } from "../../api/stockIn";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import { Spin } from "antd";

export default function StockInView() {
	const { id } = useParams();

	const fetcher = async (id: number) => {
		const res = await getStockInDetailById(Number(id));
		console.log("------------fetcher-----data--------------: ", data);
		return res;
	};
	const [completed, setCompleted] = useState(false);
	const { data, isLoading, error } = useSWR(id, fetcher, { revalidateOnFocus: false });
	const [stockInData, setStockInData] = useState<IStockIn>();

	useEffect(() => {
		if (data && !error) {
			console.log("-----------------data--------------: ", data);
			setStockInData(data);
			setCompleted(true);
		}
	}, [data, error]);

	useEffect(() => {
		setCompleted(false);
	}, []);

	return (
		<div>
			<Spin spinning={isLoading}>
				{completed && <StockInForm initialValues={stockInData} pageOperation="view" />}
			</Spin>
		</div>
	);
}
