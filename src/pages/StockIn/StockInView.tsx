import StockInForm from "./StockInForm";
import { getStockInDetailById, IStockIn } from "../../api/stockIn";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import { Card, Spin } from "antd";

export default function StockInView() {
	const { id } = useParams();

	const fetcher = async (id: number) => {
		const res = await getStockInDetailById(Number(id));
		return res;
	};
	const [completed, setCompleted] = useState(false);
	const { data, isLoading, error } = useSWR(id, fetcher, { revalidateOnFocus: false });
	const [stockInData, setStockInData] = useState<IStockIn>();

	useEffect(() => {
		if (data && !error) {
			setStockInData({ ...data });
			setCompleted(true);
		}
	}, [data, error]);

	return (
		<div style={{ background: "#f5f5f5" }}>
			<Spin spinning={isLoading}>
				<section className="flex flex-col gap-2">
					<Card
						title="元数据"
						style={{
							width: "100%",
							margin: "0 auto",
							boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
							borderRadius: "8px",
						}}
					>
						<section className="grid grid-cols-3 gap-2">
							<div>状态: {stockInData?.status}</div>
							<div>总金额: {stockInData?.totalCost}</div>
						</section>
					</Card>
					<Card
						title="入库单信息"
						style={{
							width: "100%",
							margin: "0 auto",
							boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
							borderRadius: "8px",
						}}
					>
						{completed && <StockInForm initialValues={stockInData} pageOperation="view" />}
					</Card>
				</section>
			</Spin>
		</div>
	);
}
