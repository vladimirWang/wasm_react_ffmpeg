import React, { useMemo, useRef, useState } from "react";
import { Button, DatePicker, Input, message, Pagination, Space, Table, Tooltip } from "antd";
import {
	ArrowDownOutlined,
	CheckCircleOutlined,
	CloseCircleOutlined,
	PlusCircleOutlined,
} from "@ant-design/icons";
import type { TableProps } from "antd";
import { getProducts, IProductQueryParams } from "../../api/product";
import {
	getStockIns,
	IStockIn,
	confirmStockInCompleted,
	batchDeleteStockIn,
	StockInRecord,
	createStockIn,
	IStockInCreateParams,
	IStockInWithProducts,
	restoreDeletedStockIn,
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
	groupByUniqueElements,
	groupByUniqueElements2,
	paramsToSearchParams,
} from "../../utils/common";
import SearchBox from "../../components/SearchBox";
import { useSelectedRowsAreDeleted } from "../../hooks/useSelectedRowsAreDeleted";
import { ExcelColumnType, generateExcel3 } from "../../api/util";
import { getVendors } from "../../api/vendor";

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
		isDeleted: searchParams.get("isDeleted") === "1" ? "1" : "0",
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
				queryParams.isDeleted,
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
			queryParams.isDeleted,
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
		isDeleted,
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
			isDeleted: 0 as const,
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
			title: "进货单号",
			dataIndex: "serviceCode",
			key: "serviceCode",
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
			dataIndex: "submittedAt",
			key: "submittedAt",
			render: (_, record) => {
				return dayjs(record.submittedAt).format("YYYY-MM-DD HH:mm:ss");
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
					<Link to={`/stockin/${record.id}`}>查看</Link>
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
		// {
		// 	title: "推荐零售价",
		// 	dataIndex: "shelfPrice",
		// 	key: "shelfPrice",
		// 	width: 100,
		// },
	];

	const stockOperationUploadModalRef = useRef<StockOperationUploadModalRefProps>(null);
	const [page, setPage] = useState(queryParams.page);

	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

	const selectedRowIsDeleted = useSelectedRowsAreDeleted<IStockInWithProducts>(
		selectedRowKeys,
		stockIns
	);

	const [results, setResults] = useState<number[]>([]);
	const handleConfirm = async () => {
		const serialTasks = uniqueGroups.map((group, groupIndex) => {
			console.log("----group----: ", group, groupIndex);
			return async () => {
				// 并发执行的多个任务，每个任务创建一个进货单
				const concurrentTasks = group.map(recordSet => {
					const params = {
						submittedAt: recordSet[0].submittedAt,
						productJoinStockIn: recordSet,
					};
					const recordIndexes =
						createdAtVendorIdAndIndexMap[`${recordSet[0].submittedAt}-${recordSet[0].vendorId}`];
					return createStockIn(params as IStockInCreateParams, {
						showSuccessMessage: false,
					})
						.then(res => {
							recordIndexes?.forEach(recordIndex => {
								stockOperationUploadModalRef.current?.onItemFinish(recordIndex, res.serviceCode);
							});
							return res;
						})
						.catch(err => {
							recordIndexes?.forEach(recordIndex => {
								stockOperationUploadModalRef.current?.onItemFinish(recordIndex, err.message);
							});
							console.log("----createStockIn error err----: ", err);
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
					onClick={async () => {
						const products = await getProducts({ pagination: 0 });
						const vendors = await getVendors({ pagination: 0 });
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
								// type: "select" as ExcelColumnType,
								// options: [
								// 	{
								// 		label: "产品名称",
								// 		value: "productId",
								// 	},
								// 	{
								// 		label: "产品名称2",
								// 		value: "productId2",
								// 	},
								// ],
							},
							{ header: "数量", key: "count", type: "number" as ExcelColumnType },
							{ header: "价格", key: "cost", type: "number" as ExcelColumnType },
							{ header: "创建日期", key: "submittedAt", type: "date" as ExcelColumnType },
						];
						try {
							await generateExcel3(columns);
							message.success("下载模板成功12300");
						} catch (error) {
							console.log("----generateExcel3 error----: ", error);
							message.error((error as Error).message);
						}
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
	const [groupedRecords, setGroupedRecords] = useState<StockInRecord[][]>([]);
	const [uniqueGroups, setUniqueGroups] = useState<StockInRecord[][][]>([]);

	// 同一个创建日期和供应商的进货单，记录索引
	const [createdAtVendorIdAndIndexMap, setCreatedAtVendorIdAndIndexMap] = useState<
		Record<string, number[]>
	>({});
	const handleParseExcelFile = async (data: StockInRecord[]) => {
		// 分组处理, 同一个平台订单号分一组
		const createdAtAndVendorIdMap: Record<string, StockInRecord[]> = {};
		data.forEach((record, recordIndex) => {
			const createdAtAndVendorId = `${record.submittedAt}-${record.vendorId}`;

			// 同一个创建日期和供应商的进货单，分到一组
			if (!createdAtAndVendorIdMap[createdAtAndVendorId]) {
				createdAtAndVendorIdMap[createdAtAndVendorId] = [];
			}
			createdAtAndVendorIdMap[createdAtAndVendorId].push(record);

			// 同一个创建日期和供应商的进货单，记录索引
			setCreatedAtVendorIdAndIndexMap(prev => {
				const newMap = { ...prev };
				if (!newMap[createdAtAndVendorId]) {
					newMap[createdAtAndVendorId] = [];
				}
				newMap[createdAtAndVendorId].push(recordIndex);
				return newMap;
			});
		});
		const groupRecords = Object.values(createdAtAndVendorIdMap);
		const uniqueGroupsResult = groupByUniqueElements2<StockInRecord>(groupRecords, data => {
			return data.productId;
		});
		console.log("----groupRecords----: ", groupRecords);
		console.log("----uniqueGroupsResult----: ", uniqueGroupsResult);
		setGroupedRecords(groupRecords);
		setUniqueGroups(uniqueGroupsResult);
	};

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
					disabled={selectedRowKeys.length === 0}
					danger
					size="small"
					onClick={async () => {
						try {
							if (selectedRowIsDeleted) {
								await restoreDeletedStockIn(selectedRowKeys as number[]);
							} else {
								await batchDeleteStockIn(selectedRowKeys as number[]);
							}
							setSelectedRowKeys([]);
						} finally {
							mutate();
						}
					}}
				>
					{selectedRowIsDeleted ? "恢复" : "删除"}选中 ({selectedRowKeys.length})
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
				requiredFields={["productId", "vendorId", "count", "cost", "submittedAt"]}
				dateFields={["submittedAt"]}
				ref={stockOperationUploadModalRef}
				operationType="stockIn"
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

export default StockIns;
