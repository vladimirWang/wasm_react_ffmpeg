import React, { useMemo, useRef, useState } from "react";
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
	IStockInCreateParams,
	IStockInWithProducts,
} from "../../api/stockIn";
import useSWR from "swr";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import StockOperationUploadModal, {
	// StockOperationRecordWithComplete,
	StockOperationUploadModalRefProps,
} from "../../components/StockOperationUploadModal";
import dayjs, { Dayjs } from "dayjs";
import {
	composePromise,
	composePromise2,
	getBitMask,
	paramsToSearchParams,
} from "../../utils/common";
import SearchBox from "../../components/SearchBox";

const StockIns: React.FC = () => {
	const [fileUploadModalOpen, setFileUploadModalOpen] = useState(false);
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const [queryParams, setQueryParams] = useState<IProductQueryParams>({
		page: Number(searchParams.get("page")) || 1,
		limit: Number(searchParams.get("limit")) || 20,
		productName: searchParams.get("productName") || "",
		deletedStart: searchParams.get("deletedStart") || undefined,
		deletedEnd: searchParams.get("deletedEnd") || undefined,
		vendorName: searchParams.get("vendorName") || undefined,
		completedStart: searchParams.get("completedStart") || undefined,
		completedEnd: searchParams.get("completedEnd") || undefined,
	});

	const swrKey = useMemo(
		() =>
			[
				"stockins",
				queryParams.page,
				queryParams.limit,
				queryParams.productName,
				queryParams.deletedStart,
				queryParams.deletedEnd,
				queryParams.vendorName,
				queryParams.completedStart,
				queryParams.completedEnd,
			] as const,
		[
			queryParams.page,
			queryParams.limit,
			queryParams.productName,
			queryParams.deletedStart,
			queryParams.deletedEnd,
			queryParams.vendorName,
			queryParams.completedStart,
			queryParams.completedEnd,
		]
	);

	// 2. 定义SWR的fetcher函数：接收参数，调用getStockIns
	const fetcher = async ([
		_tag,
		page,
		limit,
		productName,
		deletedStart,
		deletedEnd,
		vendorName,
		completedStart,
		completedEnd,
	]: typeof swrKey) => {
		const res = await getStockIns({
			page,
			limit,
			productName: productName ? productName : undefined,
			deletedStart: deletedStart ? dayjs(deletedStart).format("YYYY-MM-DD") : undefined,
			deletedEnd: deletedEnd ? dayjs(deletedEnd).format("YYYY-MM-DD") : undefined,
			vendorName: vendorName ? vendorName : undefined,
			completedStart: completedStart ? dayjs(completedStart).format("YYYY-MM-DD") : undefined,
			completedEnd: completedEnd ? dayjs(completedEnd).format("YYYY-MM-DD") : undefined,
		});
		return res; // 若你的getProducts返回的是响应体（如res.data），则这里取res.data
	};

	const {
		data: stockIns, // 接口返回的产品列表数据
		error, // 请求错误信息
		isLoading, // 加载状态
		mutate, // 用于手动刷新数据
	} = useSWR(
		swrKey, // SWR的key：参数变化则重新请求
		// queryParams,
		fetcher,
		{
			// 可选配置：比如页面聚焦时重新验证、禁用自动重试等
			revalidateOnFocus: false,
		}
	);

	const columns: TableProps<IStockInWithProducts>["columns"] = [
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
			title: "产品名称",
			key: "productNames",
			render: (_, record) => {
				const len = record.products.length;
				if (len === 0) {
					return "-";
				}

				const productNames = record.products.map(p => p.productName);
				return (
					<Tooltip title={productNames.join(",")}>
						<span>
							{len > 1
								? `${productNames.slice(0, 5).join(",")}...`
								: record.products[0].productName}
						</span>
					</Tooltip>
				);
			},
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
		{
			title: "推荐零售价",
			dataIndex: "shelfPrice",
			key: "shelfPrice",
			width: 100,
		},
	];

	const stockOperationUploadModalRef = useRef<StockOperationUploadModalRefProps>(null);
	const [page, setPage] = useState(queryParams.page);

	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

	const [results, setResults] = useState<number[]>([]);

	// 确认导入（串行调用 createStockIn，避免并发过多）
	const handleConfirm = async (data: {
		group: StockInRecord[][];
		flat: StockInRecord[];
		uniqueGroups: StockInRecord[][][];
	}) => {
		// 逻辑为并发执行产品id不同的产品进货单
		// 一组并发执行完毕后，执行下一个分组
		setResults(Array.from({ length: data.group.length }, () => -1));
		// 把productId与所在group的index映射起来
		const maskToGroupIndexMap: Map<number, number> = data.group.reduce((a, c, i) => {
			const mask = getBitMask<StockInRecord>(c, r => r.productId);
			a.set(mask, i);
			return a;
		}, new Map());
		// 串行执行的任务
		const tasks = data.uniqueGroups.map((uniqueGroup, uniqueGroupIndex) => () => {
			// const params = {
			// 	createdAt: uniqueGroup[0].createdAt,
			// 	productJoinStockIn: uniqueGroup,
			// };
			// return createStockIn(params as IStockInCreateParams, { showSuccessMessage: false });
			// 并发执行的任务
			const concurrentTasks = uniqueGroup.map((recordSet, recordSetIndex) => {
				const params = {
					createdAt: recordSet[0].createdAt,
					productJoinStockIn: recordSet,
				};
				return createStockIn(params as IStockInCreateParams, { showSuccessMessage: false })
					.then(res => {
						const mask = getBitMask<StockInRecord>(recordSet, r => r.productId);
						const groupIndex = maskToGroupIndexMap.get(mask);
						if (groupIndex !== undefined) {
							setResults(prev => {
								return prev.map((item, index) => (index === groupIndex ? res.id : item));
							});
						}
						stockOperationUploadModalRef.current?.onItemFinish(recordSetIndex, true);
						return res;
					})
					.catch(err => {
						stockOperationUploadModalRef.current?.onItemFinish(recordSetIndex, false);
						return Promise.reject(err);
					});
			});
			return Promise.all(concurrentTasks);
		});
		try {
			await composePromise2(...tasks);
			message.success(`成功导入进货单${data.uniqueGroups.length}笔，包含商品${data.flat.length}件`);
		} catch (error) {
			console.error(error);
		} finally {
			return Promise.resolve();
		}

		// 没有并发的处理方式
		// const tasks = data.group.map((recordSet, recordSetIndex) => () => {
		// 	const params = {
		// 		createdAt: recordSet[0].createdAt,
		// 		productJoinStockIn: recordSet,
		// 	};
		// 	return (
		// 		createStockIn(params as IStockInCreateParams, { showSuccessMessage: false })
		// 			// 处理成功与失败情况的导入结果展示
		// 			.then(res => {
		// 				setResults(prev => [...prev, res.id]);
		// 				stockOperationUploadModalRef.current?.onItemFinish(recordSetIndex, true);
		// 				return res;
		// 			})
		// 			.catch(e => {
		// 				stockOperationUploadModalRef.current?.onItemFinish(recordSetIndex, false);
		// 				return Promise.reject(e);
		// 			})
		// 	);
		// });
		// try {
		// 	await composePromise(...tasks);
		// 	message.success(`成功导入进货单${data.group.length}笔，包含商品${data.flat.length}件`);
		// } finally {
		// 	return Promise.resolve();
		// }
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
			<SearchBox
				queryParams={queryParams}
				onSetQueryParams={val => {
					setQueryParams(val);
					const sp = paramsToSearchParams(val as any);
					setSearchParams(sp);
				}}
			/>
		</div>
	);
	return (
		<div className="py-2 px-3">
			{toolBar}

			{error && <div>Error loading products.</div>}
			<Table<IStockInWithProducts>
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
				results={results}
				columns={batchOperationColumns}
				requiredFields={["productId", "vendorId", "count", "cost", "shelfPrice"]}
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
