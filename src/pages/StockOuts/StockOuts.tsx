import React, { useRef, useState } from "react";
import { Button, Input, Pagination, Space, Table, Tooltip } from "antd";
import { CheckCircleOutlined, PlusCircleOutlined, SearchOutlined } from "@ant-design/icons";
import type { TableProps } from "antd";
import { IProductQueryParams } from "../../api/product";
import {
	getStockOuts,
	IStockOut,
	confirmStockOutCompleted,
	createStockOut,
} from "../../api/stockOut";
import useSWR from "swr";
import { Link, useNavigate } from "react-router-dom";
import { StockOutRecord } from "../../api/stockOut";
import dayjs from "dayjs";
import StockOperationUploadModal, {
	StockOperationUploadModalRefProps,
} from "../../components/StockOperationUploadModal";
import { composePromise } from "../../utils/common";

const StockOuts: React.FC = () => {
	const [fileUploadModalOpen, setFileUploadModalOpen] = useState(false);

	const stockOperationUploadModalRef = useRef<StockOperationUploadModalRefProps>(null);
	const navigate = useNavigate();
	const [queryParams, setQueryParams] = useState<IProductQueryParams>({
		page: 1,
		limit: 20,
		productName: "",
	});
	// 2. 定义SWR的fetcher函数：接收参数，调用getStockIns
	const fetcher = async (_params: IProductQueryParams) => {
		const res = await getStockOuts();
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

	const columns: TableProps<IStockOut>["columns"] = [
		// {
		// 	title: "name",
		// 	dataIndex: "name",
		// 	key: "name",
		// },
		{
			title: "出货单id",
			dataIndex: "id",
			key: "id",
		},
		{
			title: "出货单总金额",
			dataIndex: "totalPrice",
			key: "totalPrice",
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
			title: "更新时间",
			dataIndex: "updatedAt",
			key: "updatedAt",
			render: (_, record) => {
				return record.updatedAt ? dayjs(record.updatedAt).format("YYYY-MM-DD HH:mm:ss") : null;
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
					{record.status === "COMPLETED" && <Link to={`/stockout/${record.id}`}>查看</Link>}
					{record.status === "PENDING" && record.deletedAt === null && (
						<>
							<Link to={`/stockout/update/${record.id}`}>编辑</Link>
							<Tooltip title="确认进货完成">
								<Button
									onClick={async () => {
										await confirmStockOutCompleted(record.id);
										mutate();
									}}
									icon={<CheckCircleOutlined style={{ color: "#52c41a", fontSize: 18 }} />}
								></Button>
							</Tooltip>
						</>
					)}

					{/* <Link to={`/stockin/${record.id}`}>查看</Link> */}
				</Space>
			),
		},
	];

	const handleConfirm = async (groupedRecords: StockOutRecord[][]) => {
		const tasks = groupedRecords.map((recordSet, recordSetIndex) => () => {
			return (
				createStockOut({
					productJoinStockOut: recordSet,
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

	const [keyword, setKeyword] = useState<string>(queryParams.productName || "");
	const [page, setPage] = useState(queryParams.page);

	return (
		<div className="py-2 px-3">
			<section className="flex gap-5">
				<Input
					placeholder="Basic usage"
					value={keyword}
					onInput={e => setKeyword(e.currentTarget.value)}
					allowClear
				/>
				<Button
					icon={<SearchOutlined />}
					onClick={() => {
						setQueryParams({
							productName: keyword,
							page: 1,
							limit: 20,
						});
					}}
				></Button>
				<Button
					icon={<PlusCircleOutlined />}
					onClick={() => {
						navigate("/stockout/create");
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
			{error && <div>Error loading products.</div>}
			<Table<IStockOut>
				size="small"
				columns={columns}
				dataSource={stockIns?.list}
				rowKey={"id"}
				loading={isLoading}
				pagination={false}
				onRow={record => ({
					onClick: () => {
						console.log("row clicked", record);
					},
				})}
			/>
			<br />
			<section className="flex justify-end">
				<Pagination
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
			<StockOperationUploadModal<StockOutRecord>
				ref={stockOperationUploadModalRef}
				operationType="stockOut"
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

export default StockOuts;
