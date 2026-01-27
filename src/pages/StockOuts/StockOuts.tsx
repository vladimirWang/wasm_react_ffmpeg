import React, { useState } from "react";
import { Button, Input, message, Pagination, Space, Table, Tooltip } from "antd";
import { CheckCircleOutlined, PlusCircleOutlined, SearchOutlined } from "@ant-design/icons";
import type { TableProps } from "antd";
import { IProductQueryParams } from "../../api/product";
import { getStockOuts, IStockOut, confirmStockOutCompleted } from "../../api/stockOut";
import useSWR from "swr";
import { Link, useNavigate } from "react-router-dom";
import StockOutUploadModal from "./StockOutUploadModal";
import dayjs from "dayjs";

const StockOuts: React.FC = () => {
	const [fileUploadModalOpen, setFileUploadModalOpen] = useState(false);
	const navigate = useNavigate();
	const [queryParams, setQueryParams] = useState<IProductQueryParams>({
		page: 1,
		limit: 20,
		name: "",
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
			title: "操作",
			key: "action",
			dataIndex: "action",
			fixed: "right",
			width: 150,
			render: (_, record) => (
				<Space size="middle">
					{record.status === "COMPLETED" && <Link to={`/stockout/${record.id}`}>查看</Link>}
					{record.status === "PENDING" && (
						<>
							<Link to={`/stockout/update/${record.id}`}>编辑</Link>
							<Tooltip title="确认进货完成">
								<Button
									onClick={async () => {
										try {
											const res = await confirmStockOutCompleted(record.id);
											message.success(res.message);
											mutate();
										} catch (e) {
											message.error((e as Error).message);
										}
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

	const [keyword, setKeyword] = useState<string>(queryParams.name || "");
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
							name: keyword,
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
			<StockOutUploadModal
				open={fileUploadModalOpen}
				onCancel={() => setFileUploadModalOpen(false)}
				onSuccess={() => {
					mutate();
					setFileUploadModalOpen(false);
				}}
			/>
		</div>
	);
};

export default StockOuts;
