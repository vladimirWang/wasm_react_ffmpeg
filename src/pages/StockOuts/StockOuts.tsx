import React, { useEffect, useRef, useState } from "react";
import { Button, Input, message, Pagination, Space, Table, Tooltip } from "antd";
import {
	CheckCircleOutlined,
	CloseCircleOutlined,
	PlusCircleOutlined,
	SearchOutlined,
} from "@ant-design/icons";
import type { TableProps } from "antd";
import { getProducts, IProductQueryParams } from "../../api/product";
import {
	getStockOuts,
	IStockOut,
	confirmStockOutCompleted,
	createStockOut,
	batchDeleteStockOut,
	IStockOutCreateParams,
	restoreDeletedStockOut,
} from "../../api/stockOut";
import useSWR from "swr";
import { Link, useNavigate } from "react-router-dom";
import { StockOutRecord } from "../../api/stockOut";
import dayjs from "dayjs";
import StockOperationUploadModal, {
	StockOperationUploadModalRefProps,
} from "../../components/StockOperationUploadModal";
import {
	composePromise,
	composePromise2,
	groupByUniqueElements,
	groupByUniqueElements2,
} from "../../utils/common";
import SearchBox from "../../components/SearchBox";
import { getClients, IClient } from "../../api/client";
import { getPlatforms, IPlatform } from "../../api/platform";
import { useSelectedRowsAreDeleted } from "../../hooks/useSelectedRowsAreDeleted";
import { getVendors } from "../../api/vendor";
import { downloadFileByBuffer, ExcelColumnType, generateExcel3 } from "../../api/util";

const StockOuts: React.FC = () => {
	const [fileUploadModalOpen, setFileUploadModalOpen] = useState(false);

	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const stockOperationUploadModalRef = useRef<StockOperationUploadModalRefProps>(null);
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
		isDeleted: "0" as const,
	});
	// 2. 定义SWR的fetcher函数：接收参数，调用getStockIns
	const fetcher = async (params: IProductQueryParams) => {
		const res = await getStockOuts(params);
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

	const selectedRowIsDeleted = useSelectedRowsAreDeleted<IStockOut>(selectedRowKeys, stockIns);

	const columns: TableProps<IStockOut>["columns"] = [
		// {
		// 	title: "name",
		// 	dataIndex: "name",
		// 	key: "name",
		// },
		{
			title: "出货单号",
			dataIndex: "stockOutCode",
			key: "stockOutCode",
		},
		{
			title: "出货单总金额",
			dataIndex: "totalPrice",
			key: "totalPrice",
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
			title: "平台订单号",
			dataIndex: "platformOrderNo",
			key: "platformOrderNo",
		},
		{
			title: "平台",
			dataIndex: "platform",
			key: "platform",
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
							<Tooltip title="确认出货完成">
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
	const [results, setResults] = useState<number[]>([]);
	const [platforms, setPlatforms] = useState<IPlatform[]>([]);
	const [clients, setClients] = useState<IClient[]>([]);

	const loadPlatforms = async () => {
		const res = await getPlatforms();
		setPlatforms(res);
	};
	const loadClients = async () => {
		const res = await getClients({ pagination: 0 });
		setClients(res.list);
	};
	useEffect(() => {
		loadPlatforms();
		loadClients();
	}, []);

	const batchOperationColumns: TableProps<StockOutRecord>["columns"] = [
		{
			title: "价格",
			dataIndex: "price",
			key: "price",
			width: 80,
		},
		{
			title: "平台",
			dataIndex: "platform",
			key: "platform",
			width: 50,
			render: (_, record) => {
				const matched = platforms.find(platform => platform.id === record.platformId)?.name;
				if (!matched) {
					return "--";
				}
				return <Tooltip title={matched}>{matched}</Tooltip>;
			},
		},
		{
			title: "平台订单号",
			dataIndex: "platformOrderNo",
			key: "platformOrderNo",
			width: 100,
		},
		{
			title: "客户",
			dataIndex: "clientId",
			key: "clientId",
			width: 50,
			render: (_, record) => {
				const matched = clients.find(client => client.id === record.clientId)?.name;
				if (!matched) {
					return "--";
				}
				return (
					<Tooltip title={matched}>
						<div className="text-ellipsis overflow-hidden whitespace-nowrap">{matched}</div>
					</Tooltip>
				);
			},
		},
	];

	const handleConfirm = async () => {
		const serialTasks = uniqueGroups.map((group, groupIndex) => {
			return async () => {
				const concurrentTasks = group.map(recordSet => {
					const params = {
						createdAt: recordSet[0].submittedAt,
						productJoinStockOut: recordSet,
						platformId: recordSet[0].platformId,
						platformOrderNo: recordSet[0].platformOrderNo,
						clientId: recordSet[0].clientId,
					};
					const recordIndexes = platformOrderNoAndIndexMap[recordSet[0].platformOrderNo];
					return createStockOut(params as IStockOutCreateParams, {
						showSuccessMessage: false,
					})
						.then(res => {
							recordIndexes?.forEach(recordIndex => {
								stockOperationUploadModalRef.current?.onItemFinish(recordIndex, res.stockOutCode);
							});
							console.log("----createStockOut success res----: ", res);
							return res;
						})
						.catch(err => {
							recordIndexes?.forEach(recordIndex => {
								stockOperationUploadModalRef.current?.onItemFinish(recordIndex, err.message);
							});
							console.log("----createStockOut error err----: ", err);
							return Promise.reject(err);
						});
				});
				const result = await Promise.allSettled(concurrentTasks);
				console.log("----并发执行完毕----: ", `groupIndex: ${groupIndex}`, `result: ${result}`);
				return result;
			};
			// return () => Promise.all(concurrentTasks);
		});
		await composePromise2(...serialTasks);
		message.success("success： " + serialTasks.length);
		// const dataItem = data[0][0][0];
		// const params = {
		// 	createdAt: dataItem.createdAt,
		// 	productJoinStockOut: data[0][0],
		// 	platformId: dataItem.platformId,
		// 	platformOrderNo: dataItem.platformOrderNo,
		// 	clientId: dataItem.clientId,
		// };
		// console.log("----params----: ", params);
		// try {
		// 	await createStockOut(params as IStockOutCreateParams, { showSuccessMessage: false });
		// 	message.success("success");
		// } catch (error) {
		// 	console.log("----error----: ", error);
		// 	message.error("error: " + (error as Error).message);
		// } finally {
		// 	message.success("finally");
		// }
	};

	const test = async (data: {
		group: StockOutRecord[][];
		flat: StockOutRecord[];
		uniqueGroups: StockOutRecord[][][];
	}) => {
		console.log("----uniqueGroups----: ", JSON.stringify(uniqueGroups));
		// const serialTasks = data.uniqueGroups.map((uniqueGroup, uniqueGroupIndex) => () => {
		// 	console.log("----uniqueGroup item----: ", uniqueGroup);
		// 	const concurrentTasks = uniqueGroup.map((recordSet, recordSetIndex) => () => {
		// 		console.log("----uniqueGroup recordSet----: ", recordSet);
		// 		const params = {
		// 			createdAt: recordSet[0].createdAt,
		// 			productJoinStockOut: recordSet,
		// 			platform: recordSet[0].platformId,
		// 			platformOrderNo: recordSet[0].platformOrderNo,
		// 			clientId: recordSet[0].clientId,
		// 		};
		// 		console.log("----uniqueGroup params----: ", JSON.stringify(params));
		// 		return createStockOut(params as IStockOutCreateParams, { showSuccessMessage: false });
		// 	});
		// 	return Promise.all(concurrentTasks);
		// });
		// console.log("----serialTasks----: ", serialTasks);
		// await composePromise(...serialTasks);
		// message.success(`成功导入出货单${groupedRecords.length}笔`);
		// const tasks = data.group.map((recordSet, recordSetIndex) => () => {
		// 	const params = {
		// 		createdAt: recordSet[0].createdAt,
		// 		productJoinStockOut: recordSet,
		// 	};
		// 	return (
		// 		createStockOut(params as IStockOutCreateParams, { showSuccessMessage: false })
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
		// 	message.success(`成功导入出货单${data.group.length}笔，包含商品${data.flat.length}件`);
		// } finally {
		// 	return Promise.resolve();
		// }
	};

	const [keyword, setKeyword] = useState<string>(queryParams.productName || "");
	const [page, setPage] = useState(queryParams.page);

	const toolBar = (
		<div className="flex flex-col gap-2">
			<section className="flex justify-end gap-5">
				<Button
					icon={<PlusCircleOutlined />}
					onClick={() => {
						navigate("/stockout/create");
					}}
				>
					新增
				</Button>
				<Button
					onClick={async () => {
						const products = await getProducts({ pagination: 0 });
						const vendors = await getVendors({ pagination: 0 });
						const clients = await getClients({ pagination: 0 });
						const platforms = await getPlatforms();

						const columns = [
							{
								header: "供应商名称",
								key: "vendorId",
								type: "select" as ExcelColumnType,
								options: vendors.list.map(v => ({
									label: v.name,
									value: String(v.id),
								})),
							},
							{
								header: "产品名称",
								key: "productId",
								type: "select" as ExcelColumnType,
								parentField: "vendorId",
								options: products.list.map(item => ({
									label: item.name,
									value: String(item.id),
									parentValue: String(item.vendorId),
								})),
							},
							{ header: "数量", key: "count", type: "number" as ExcelColumnType },
							{ header: "价格", key: "price", type: "number" as ExcelColumnType },
							{
								header: "客户",
								key: "clientId",
								type: "select" as ExcelColumnType,
								options: clients.list.map(client => ({
									label: client.name,
									value: String(client.id),
								})),
							},
							{
								header: "平台",
								key: "platformId",
								type: "select" as ExcelColumnType,
								options: platforms.map(platform => ({
									label: platform.name,
									value: String(platform.id),
								})),
							},
							{ header: "平台订单号", key: "platformOrderNo", type: "text" as ExcelColumnType },
							{ header: "创建日期", key: "submittedAt", type: "date" as ExcelColumnType },
						];
						const buffer = await generateExcel3(columns);
						const filename = `出货单模板_${dayjs().format("YYYY-MM-DD")}.xlsx`;
						downloadFileByBuffer(buffer, filename);
						message.success("下载模板成功");
					}}
				>
					下载模板
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

	const [groupedRecords, setGroupedRecords] = useState<StockOutRecord[][]>([]);
	const [uniqueGroups, setUniqueGroups] = useState<StockOutRecord[][][]>([]);
	const [platformOrderNoAndIndexMap, setPlatformOrderNoAndIndexMap] = useState<
		Record<string, number[]>
	>({});

	const handleParseExcelFile = async (data: StockOutRecord[]): Promise<void> => {
		// 分组处理, 同一个平台订单号分一组
		const platformOrderNoMap: Record<string, StockOutRecord[]> = {};
		data.forEach((record, recordIndex) => {
			// 同一个平台订单号，分到一组
			if (!platformOrderNoMap[record.platformOrderNo]) {
				platformOrderNoMap[record.platformOrderNo] = [];
			}
			platformOrderNoMap[record.platformOrderNo].push(record);

			// 同一个平台订单号，记录索引
			setPlatformOrderNoAndIndexMap(prev => {
				const newMap = { ...prev };
				if (!newMap[record.platformOrderNo]) {
					newMap[record.platformOrderNo] = [];
				}
				newMap[record.platformOrderNo].push(recordIndex);
				return newMap;
			});
		});
		const groupRecords = Object.values(platformOrderNoMap);
		const uniqueGroupsResult = groupByUniqueElements2<StockOutRecord>(groupRecords, data => {
			return data.productId;
		});
		console.log("----uniqueGroupsResult----: ", uniqueGroupsResult);
		setGroupedRecords(groupRecords);
		setUniqueGroups(uniqueGroupsResult);
	};
	return (
		<div className="py-2 px-3">
			{toolBar}
			{error && <div>Error loading products.</div>}
			<Table<IStockOut>
				size="small"
				columns={columns}
				dataSource={stockIns?.list}
				rowKey={"id"}
				loading={isLoading}
				rowSelection={{
					selectedRowKeys,
					getCheckboxProps: record => {
						return {
							disabled: record.status === "COMPLETED",
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
							if (selectedRowIsDeleted) {
								await restoreDeletedStockOut(selectedRowKeys as number[]);
							} else {
								await batchDeleteStockOut(selectedRowKeys as number[]);
							}
							setSelectedRowKeys([]);
						} finally {
							mutate();
						}
					}}
				>
					删除选中 ({selectedRowKeys.length})
				</Button>
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
				results={results}
				columns={batchOperationColumns}
				requiredFields={[
					"productId",
					"count",
					"price",
					"vendorId",
					"clientId",
					"platformId",
					"platformOrderNo",
					"submittedAt",
				]}
				dateFields={["submittedAt"]}
				ref={stockOperationUploadModalRef}
				operationType="stockOut"
				open={fileUploadModalOpen}
				onCancel={() => setFileUploadModalOpen(false)}
				onSuccess={() => {
					mutate();
					setFileUploadModalOpen(false);
				}}
				onConfirm={handleConfirm}
				onParseExcelFile={handleParseExcelFile}
			/>
		</div>
	);
};

export default StockOuts;
