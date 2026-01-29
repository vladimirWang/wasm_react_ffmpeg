import React, { useRef, useState } from "react";
import { Button, DatePicker, Input, Pagination, Space, Table, Tooltip } from "antd";
import {
	ArrowDownOutlined,
	CheckCircleOutlined,
	CloseCircleOutlined,
	PlusCircleOutlined,
} from "@ant-design/icons";
import type { TableProps } from "antd";
import { IProductQueryParams } from "../../api/product";
import {
	getStockIns,
	IStockIn,
	confirmStockInCompleted,
	batchDeleteStockIn,
	StockInRecord,
	createStockIn,
} from "../../api/stockIn";
import useSWR from "swr";
import { Link, useNavigate } from "react-router-dom";
import StockOperationUploadModal, {
	// StockOperationRecordWithComplete,
	StockOperationUploadModalRefProps,
} from "../../components/StockOperationUploadModal";
import dayjs, { Dayjs } from "dayjs";
import { composePromise } from "../../utils/common";

const StockIns: React.FC = () => {
	const [fileUploadModalOpen, setFileUploadModalOpen] = useState(false);
	const navigate = useNavigate();
	const [queryParams, setQueryParams] = useState<IProductQueryParams>({
		page: 1,
		limit: 20,
		productName: "",
		deletedStart: undefined,
		deletedEnd: undefined,
		vendorName: "",
		completedStart: undefined,
		completedEnd: undefined,
	});
	// 2. 定义SWR的fetcher函数：接收参数，调用getStockIns
	const fetcher = async (params: IProductQueryParams) => {
		const res = await getStockIns(params);
		return res; // 若你的getProducts返回的是响应体（如res.data），则这里取res.data
	};

	const {
		data: stockIns, // 接口返回的产品列表数据
		error, // 请求错误信息
		isLoading, // 加载状态
		mutate, // 用于手动刷新数据
	} = useSWR(
		queryParams, // SWR的key：参数变化则重新请求
		fetcher,
		{
			// 可选配置：比如页面聚焦时重新验证、禁用自动重试等
			revalidateOnFocus: false,
		}
	);

	const columns: TableProps<IStockIn>["columns"] = [
		// {
		// 	title: "name",
		// 	dataIndex: "name",
		// 	key: "name",
		// },
		{
			title: "进货单id",
			dataIndex: "id",
			key: "id",
		},
		{
			title: "进货单总金额",
			dataIndex: "totalCost",
			key: "totalCost",
		},
		{
			title: "状态",
			dataIndex: "status",
			key: "status",
			render: (_, record) => {
				return record.status === "COMPLETED" ? "已确认" : "未确认";
			},
		},
		{
			title: "创建日期",
			dataIndex: "createdAt",
			key: "createdAt",
			render: (_, record) => {
				return dayjs(record.createdAt).format("YYYY-MM-DD HH:mm:ss");
			},
		},
		{
			title: "确认日期",
			dataIndex: "completedAt",
			key: "completedAt",
			render: (_, record) => {
				return record.completedAt ? dayjs(record.completedAt).format("YYYY-MM-DD HH:mm:ss") : null;
			},
		},
		{
			title: "操作",
			key: "action",
			dataIndex: "action",
			fixed: "right",
			width: 150,
			render: (_, record) => (
				<Space size="middle">
					{record.status === "COMPLETED" && <Link to={`/stockin/${record.id}`}>查看</Link>}
					{record.status === "PENDING" && record.deletedAt === null && (
						<>
							<Link to={`/stockin/update/${record.id}`}>编辑</Link>
							<Tooltip title="确认进货完成">
								<Button
									onClick={async () => {
										await confirmStockInCompleted(record.id);
										mutate();
									}}
									icon={<CheckCircleOutlined style={{ color: "#52c41a", fontSize: 18 }} />}
								></Button>
							</Tooltip>
						</>
					)}
				</Space>
			),
		},
	];

	const batchOperationColumns: TableProps<StockInRecord>["columns"] = [
		{
			title: "行号",
			key: "rowIndex",
			width: 60,
			render: (_, record) => record.rowIndex || "-",
		},
		{
			title: "创建日期",
			dataIndex: "createdAt",
			key: "createdAt",
			width: 100,
		},
		{
			title: "商品ID",
			dataIndex: "productId",
			key: "productId",
			width: 80,
		},
		{
			title: "商品名称",
			key: "productName",
			width: 100,
			ellipsis: {
				showTitle: false,
			},
			// render: (_, record) => {
			// 	const product = products.find(p => p.id === record.productId);
			// 	const productName = product ? product.name : "-";
			// 	return (
			// 		<Tooltip placement="topLeft" title={productName}>
			// 			<span className="block overflow-hidden text-ellipsis whitespace-nowrap">
			// 				{productName}
			// 			</span>
			// 		</Tooltip>
			// 	);
			// },
		},
		{
			title: "供应商ID",
			dataIndex: "vendorId",
			key: "vendorId",
			width: 80,
		},
		{
			title: "供应商名称",
			key: "vendorName",
			width: 150,
			// render: (_, record) => {
			// 	const vendor = vendors.find(v => v.id === record.vendorId);
			// 	return vendor ? vendor.name : "-";
			// },
		},
		{
			title: "数量",
			dataIndex: "count",
			key: "count",
			width: 80,
		},
		{
			title: "价格",
			dataIndex: "cost",
			key: "cost",
			width: 100,
		},
		{
			title: "匹配结果",
			key: "matchResult",
			fixed: "right",
			width: 100,
			// render: (_, record) => {
			// 	const product = products.find(p => p.id === record.productId);
			// 	const vendor = vendors.find(v => v.id === record.vendorId);
			// 	const isMatched = product && vendor;
			// 	return isMatched ? (
			// 		<CheckCircleOutlined style={{ color: "#52c41a", fontSize: 18 }} />
			// 	) : (
			// 		<CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: 18 }} />
			// 	);
			// },
		},
		{
			title: "导入结果",
			key: "success",
			fixed: "right",
			width: 100,
			render: (_, record) => {
				if (record.success === undefined) return null;
				return record.success ? (
					<CheckCircleOutlined style={{ color: "#52c41a", fontSize: 18 }} />
				) : (
					<CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: 18 }} />
				);
			},
		},
	];

	const stockOperationUploadModalRef = useRef<StockOperationUploadModalRefProps>(null);
	const [productName, setProductName] = useState<string>(queryParams.productName || "");
	const [vendorName, setVendorName] = useState<string>(queryParams.vendorName || "");
	const [page, setPage] = useState(queryParams.page);
	const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
	const [completedDateRange, setCompletedDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(
		null
	);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

	// 确认导入（串行调用 createStockIn，避免并发过多）
	const handleConfirm = async (groupedRecords: StockInRecord[][]) => {
		const tasks = groupedRecords.map((recordSet, recordSetIndex) => () => {
			return (
				createStockIn({
					productJoinStockIn: recordSet,
				})
					// 处理成功与失败情况的导入结果展示
					.then(res => {
						stockOperationUploadModalRef.current?.onItemFinish(recordSetIndex, true);
						return res;
					})
					.catch(e => {
						stockOperationUploadModalRef.current?.onItemFinish(recordSetIndex, false);
						return Promise.reject(e);
					})
			);
		});
		try {
			await composePromise(...tasks);
		} finally {
			return Promise.resolve();
		}
	};
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
		setQueryParams(params);
	};
	const [moreVisible, setMoreVisible] = useState(false);
	const toolBar = (
		<div className="flex flex-col gap-2">
			<section className="flex justify-end gap-5">
				<Button
					icon={<PlusCircleOutlined />}
					onClick={() => {
						navigate("/stockin/create");
					}}
				>
					新增
				</Button>
				<Button
					onClick={() => {
						setFileUploadModalOpen(true);
					}}
				>
					通过文件批量导入
				</Button>
			</section>
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
	return (
		<div className="py-2 px-3">
			{toolBar}

			{error && <div>Error loading products.</div>}
			<Table<IStockIn>
				size="small"
				columns={columns}
				dataSource={stockIns?.list}
				rowKey={"id"}
				loading={isLoading}
				rowSelection={{
					selectedRowKeys,
					getCheckboxProps: record => {
						return {
							disabled: record.status === "COMPLETED" || record.deletedAt !== null,
						};
					},
					onChange: values => {
						setSelectedRowKeys(values);
					},
				}}
				pagination={false}
				onRow={record => ({
					onClick: () => {
						console.log("row clicked", record);
					},
				})}
			/>
			<br />
			<section className="flex justify-between">
				<Button
					danger
					size="small"
					onClick={async () => {
						try {
							await batchDeleteStockIn(selectedRowKeys as number[]);
							setSelectedRowKeys([]);
						} finally {
							mutate();
						}
					}}
				>
					删除选中 ({selectedRowKeys.length})
				</Button>
				<Pagination
					size="small"
					total={stockIns?.total}
					showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
					defaultPageSize={20}
					defaultCurrent={page}
					onChange={page => {
						setPage(page);
						setQueryParams({
							...queryParams,
							page,
						});
					}}
				/>
			</section>
			<StockOperationUploadModal<StockInRecord>
				columns={batchOperationColumns}
				requiredFields={["productId", "vendorId", "count", "cost"]}
				ref={stockOperationUploadModalRef}
				operationType="stockIn"
				open={fileUploadModalOpen}
				onCancel={() => setFileUploadModalOpen(false)}
				onSuccess={() => {
					mutate();
					setFileUploadModalOpen(false);
				}}
				onConfirm={handleConfirm}
			/>
		</div>
	);
};

export default StockIns;
