import React, { useRef, useState } from "react";
import { Button, DatePicker, Input, message, Pagination, Space, Table, Tooltip } from "antd";
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
import SearchBox from "../../components/SearchBox";

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
			title: "价格",
			dataIndex: "cost",
			key: "cost",
			width: 100,
		},
	];

	const stockOperationUploadModalRef = useRef<StockOperationUploadModalRefProps>(null);
	const [page, setPage] = useState(queryParams.page);

	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

	// 确认导入（串行调用 createStockIn，避免并发过多）
	const handleConfirm = async (data: { group: StockInRecord[][]; flat: StockInRecord[] }) => {
		const tasks = data.group.map((recordSet, recordSetIndex) => () => {
			const params = {
				createdAt: recordSet[0].createdAt,
				productJoinStockIn: recordSet,
			};
			return (
				createStockIn(params, { showSuccessMessage: false })
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
			message.success(`成功导入进货单${data.group.length}笔，包含商品${data.flat.length}件`);
		} finally {
			return Promise.resolve();
		}
	};
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
			<SearchBox queryParams={queryParams} onSetQueryParams={setQueryParams} />
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
