import StockOutForm from "./StockOutForm";
import { getStockOutDetailById, IStockOut, updateStockOut } from "../../api/stockOut";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import { Spin } from "antd";

export default function StockInView() {
	const { id } = useParams();

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
	const {
		data: initialValues,
		isLoading,
		error,
	} = useSWR(id, fetcher, { revalidateOnFocus: false });

	useEffect(() => {
		if (!initialValues) return;
		setCompleted(true);
	}, [initialValues]);
	return (
		<div>
			<Spin spinning={isLoading}>
				{completed && <StockOutForm initialValues={initialValues} pageOperation="view" />}
			</Spin>
		</div>
	);
}
