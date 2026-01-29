import { Dayjs } from "dayjs";
import React, { useState } from "react";
import { IProductQueryParams } from "../api/product";
import { Button, DatePicker, Input } from "antd";
import { ArrowDownOutlined } from "@ant-design/icons";

type SearchBoxProps = {
	queryParams: IProductQueryParams;
	onSetQueryParams: (params: IProductQueryParams) => void;
};
export default function SearchBox(props: SearchBoxProps) {
	const { queryParams, onSetQueryParams } = props;
	const [moreVisible, setMoreVisible] = useState(false);
	const [productName, setProductName] = useState<string>(queryParams.productName || "");
	const [vendorName, setVendorName] = useState<string>(queryParams.vendorName || "");
	const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
	const [completedDateRange, setCompletedDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(
		null
	);
	const handleSetQueryParams = () => {
		const params: IProductQueryParams = {
			productName,
			vendorName,
			page: 1,
			limit: 20,
		};
		if (Array.isArray(dateRange)) {
			const [start, end] = dateRange;
			params.deletedStart = start?.startOf("day").millisecond(0).format("YYYY-MM-DD HH:mm:ss");
			params.deletedEnd = end?.endOf("day").millisecond(0).format("YYYY-MM-DD HH:mm:ss");
		}
		if (Array.isArray(completedDateRange)) {
			const [start, end] = completedDateRange;
			params.completedStart = start?.startOf("day").millisecond(0).format("YYYY-MM-DD HH:mm:ss");
			params.completedEnd = end?.endOf("day").millisecond(0).format("YYYY-MM-DD HH:mm:ss");
		}
		onSetQueryParams(params);
	};
	return (
		<div className="flex flex-col gap-2">
			<section className="flex justify-between">
				<div className="flex gap-5">
					<Input
						style={{ width: 300 }}
						placeholder="产品名称"
						value={productName}
						onChange={e => setProductName(e.target.value)}
						allowClear
					/>
					<Input
						style={{ width: 200 }}
						placeholder="供应商名称"
						value={vendorName}
						onChange={e => setVendorName(e.currentTarget.value)}
						allowClear
					/>
					<DatePicker.RangePicker
						className="w-[350px]"
						placeholder={["完成开始日期", "完成结束日期"]}
						value={completedDateRange}
						onChange={setCompletedDateRange}
					/>
				</div>
				<Button onClick={handleSetQueryParams} type="primary">
					查询
				</Button>
			</section>
			{!moreVisible && (
				<div className="text-center">
					<ArrowDownOutlined
						className={`${moreVisible ? "rotate-180" : ""}`}
						onClick={() => {
							setMoreVisible(!moreVisible);
						}}
					/>
				</div>
			)}
			{moreVisible && (
				<div className="flex gap-5 items-center">
					<DatePicker.RangePicker
						placeholder={["删除开始日期", "删除结束日期"]}
						value={dateRange}
						onChange={setDateRange}
					/>
					<Button
						type="primary"
						size="small"
						onClick={() => {
							setMoreVisible(false);
							setDateRange(null);
						}}
					>
						关闭高级查询
					</Button>
				</div>
			)}
		</div>
	);
}
