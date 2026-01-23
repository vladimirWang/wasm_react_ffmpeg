import React, { useState } from "react";
import { Button, Input, message, Modal, Pagination, Space, Table, Upload, Steps } from "antd";
import { InboxOutlined, PlusCircleOutlined, SearchOutlined } from "@ant-design/icons";
import type { TableProps, UploadProps } from "antd";
import { IProductQueryParams } from "../api/product";
import { getStockIns, IStockIn, createStockIn, StockInRecord } from "../api/stockIn";
import useSWR from "swr";
import { Link, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

const { Dragger } = Upload;
const columns: TableProps<IStockIn>["columns"] = [
	// {
	// 	title: "name",
	// 	dataIndex: "name",
	// 	key: "name",
	// },
	{
		title: "订单总金额",
		dataIndex: "totalCost",
		key: "totalCost",
	},
	{
		title: "操作",
		key: "action",
		dataIndex: "action",
		render: (_, record) => (
			<Space size="middle">
				<Link to={`/stockin/${record.id}`}>编辑</Link>
				{/* <Link to={`/stockin/${record.id}`}>查看</Link> */}
			</Space>
		),
	},
];

const StockIns: React.FC = () => {
	const [fileUploadModalOpen, setFileUploadModalOpen] = useState(false);
	const navigate = useNavigate();
	const [queryParams, setQueryParams] = useState<IProductQueryParams>({
		page: 1,
		limit: 20,
		name: "",
	});
	// 2. 定义SWR的fetcher函数：接收参数，调用getStockIns
	const fetcher = async (_params: IProductQueryParams) => {
		const res = await getStockIns();
		if (res.code !== 200) {
			return {
				data: {
					list: [],
					total: 0,
				},
			};
		}
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

	// const [products, setProducts] = React.useState<IProduct[]>(data);

	// const loadProducts = async () => {
	//   // const res = await fetch('/api/product?limit=10&page=1&name=');
	//   // const json = await res.json();
	//   // setProducts(json.data.list);
	//   const res = await getProducts({ limit: 10, page: 1, name: '' });
	//   setProducts(res.data.list);
	// }
	// useEffect(() => {
	//   // loadProducts()
	// }, [])
	const [keyword, setKeyword] = useState<string>(queryParams.name || "");
	const [page, setPage] = useState(queryParams.page);
	const [uploading, setUploading] = useState(false);
	const [currentStep, setCurrentStep] = useState(0); // Steps 当前步骤
	const [parsedRecords, setParsedRecords] = useState<StockInRecord[]>([]); // 解析后的数据
	const [uploadedFile, setUploadedFile] = useState<File | null>(null); // 上传的文件

	// 解析 Excel 文件 - 第二行作为字段 key
	const parseExcelFile = async (file: File): Promise<StockInRecord[]> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = e => {
				try {
					const data = new Uint8Array(e.target?.result as ArrayBuffer);
					const workbook = XLSX.read(data, { type: "array" });

					// 读取第一个工作表
					const firstSheetName = workbook.SheetNames[0];
					const worksheet = workbook.Sheets[firstSheetName];

					// 将工作表转换为 JSON 数组
					const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

					if (jsonData.length < 3) {
						reject(new Error("Excel 文件格式不正确：至少需要 3 行数据（第一行忽略，第二行表头，第三行开始为数据）"));
						return;
					}

					// 第二行作为字段 key（表头）
					const headerRow = jsonData[1];
					if (!headerRow || headerRow.length === 0) {
						reject(new Error("Excel 文件格式不正确：第二行必须包含字段名称"));
						return;
					}

					// 创建字段映射：字段名 -> 列索引
					const fieldMap: Record<string, number> = {};
					headerRow.forEach((header: any, index: number) => {
						if (header) {
							const headerStr = String(header).trim().toLowerCase();
							// 支持多种字段名映射
							if (headerStr.includes("productid") || headerStr.includes("商品id") || headerStr.includes("产品id")) {
								fieldMap["productId"] = index;
							} else if (headerStr.includes("vendorid") || headerStr.includes("供应商id") || headerStr.includes("厂商id")) {
								fieldMap["vendorId"] = index;
							} else if (headerStr.includes("count") || headerStr.includes("数量")) {
								fieldMap["count"] = index;
							} else if (headerStr.includes("cost") || headerStr.includes("价格") || headerStr.includes("成本")) {
								fieldMap["cost"] = index;
							}
						}
					});

					// 验证必需的字段是否存在
					const requiredFields = ["productId", "vendorId", "count", "cost"];
					const missingFields = requiredFields.filter(field => fieldMap[field] === undefined);
					if (missingFields.length > 0) {
						reject(new Error(`Excel 文件缺少必需字段：${missingFields.join(", ")}`));
						return;
					}

					// 从第三行开始解析数据（索引从 2 开始）
					const records: StockInRecord[] = [];
					for (let i = 2; i < jsonData.length; i++) {
						const row = jsonData[i];
						if (!row || row.length === 0) continue; // 跳过空行

						const productId = Number(row[fieldMap["productId"]]);
						const vendorId = Number(row[fieldMap["vendorId"]]);
						const count = Number(row[fieldMap["count"]]);
						const cost = Number(row[fieldMap["cost"]]);

						// 验证数据有效性
						if (!isNaN(productId) && !isNaN(vendorId) && !isNaN(count) && !isNaN(cost)) {
							records.push({
								productId,
								vendorId,
								count,
								cost,
							});
						}
					}

					if (records.length === 0) {
						reject(new Error("Excel 文件中没有有效数据"));
						return;
					}

					resolve(records);
				} catch (error) {
					reject(error);
				}
			};
			reader.onerror = () => {
				reject(new Error("文件读取失败"));
			};
			reader.readAsArrayBuffer(file);
		});
	};

	// 自定义上传方法 - 改为前端解析
	const customRequest = async (options: any) => {
		const { file, onSuccess, onError } = options;

		try {
			setUploading(true);

			// 前端解析 Excel 文件
			const records: StockInRecord[] = await parseExcelFile(file as File);

			// 保存解析结果和文件，切换到第二步
			setParsedRecords(records);
			setUploadedFile(file as File);
			setCurrentStep(1);
			onSuccess?.(records, file);
			message.success(`成功解析 ${records.length} 条记录`);
		} catch (error: any) {
			onError?.(error);
			message.error(error?.message || `${file.name} 解析失败`);
		} finally {
			setUploading(false);
		}
	};

	// 确认导入
	const handleConfirmImport = async () => {
		try {
			setUploading(true);

			// 将 StockInRecord[] 转换为 IProductJoinStockIn[] 格式
			const productJoinStockIn = parsedRecords.map(record => ({
				productId: record.productId,
				count: record.count,
				cost: record.cost,
			}));

			// 调用创建进货记录接口
			const res = await createStockIn({
				productJoinStockIn,
			});

			if (res.code === 200) {
				message.success(`成功导入 ${parsedRecords.length} 条进货记录`);
				// 上传成功后刷新列表
				mutate();
				// 重置状态并关闭弹窗
				setCurrentStep(0);
				setParsedRecords([]);
				setUploadedFile(null);
				setFileUploadModalOpen(false);
			} else {
				message.error(res.message || "导入失败");
			}
		} catch (error: any) {
			message.error(error?.message || "导入失败");
		} finally {
			setUploading(false);
		}
	};

	// 重置 Modal 状态
	const handleModalCancel = () => {
		setFileUploadModalOpen(false);
		setCurrentStep(0);
		setParsedRecords([]);
		setUploadedFile(null);
	};

	const props: UploadProps = {
		name: "file",
		multiple: false, // 改为单文件上传，如果需要多文件可以改为 true
		customRequest, // 使用自定义上传方法
		onChange(info) {
			const { status } = info.file;
			if (status === "done") {
				console.log(`${info.file.name} file uploaded successfully.`);
			} else if (status === "error") {
				console.error(`${info.file.name} file upload failed.`);
			}
		},
		onDrop(e) {
			console.log("Dropped files", e.dataTransfer.files);
		},
		beforeUpload: file => {
			console.log("beforeUpload file: ", file);
			return true;
			// // 可以在这里添加文件类型和大小验证
			// const isExcel = file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
			// 	|| file.type === "application/vnd.ms-excel"
			// 	|| file.name.endsWith(".xlsx")
			// 	|| file.name.endsWith(".xls");

			// if (!isExcel) {
			// 	message.error("只能上传 Excel 文件 (.xlsx, .xls)");
			// 	return Upload.LIST_IGNORE;
			// }

			// const isLt10M = file.size / 1024 / 1024 < 10;
			// if (!isLt10M) {
			// 	message.error("文件大小不能超过 10MB");
			// 	return Upload.LIST_IGNORE;
			// }

			// return true;
		},
	};

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
			{error && <div>Error loading products.</div>}
			<Table<IStockIn>
				size="small"
				columns={columns}
				dataSource={stockIns?.data.list}
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
					total={stockIns?.data.total}
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
			<Modal
				open={fileUploadModalOpen}
				title="批量导入进货记录"
				onCancel={handleModalCancel}
				footer={null}
				width={800}
				confirmLoading={uploading}
			>
				<Steps
					current={currentStep}
					items={[
						{
							title: "上传文件",
							description: "选择 Excel 文件并上传",
						},
						{
							title: "数据预览",
							description: "确认解析后的数据",
						},
					]}
					style={{ marginBottom: 24 }}
				/>

				{currentStep === 0 && (
					<Dragger {...props} disabled={uploading}>
						<p className="ant-upload-drag-icon">
							<InboxOutlined />
						</p>
						<p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
						<p className="ant-upload-hint">
							支持 Excel 文件 (.xlsx, .xls)，文件大小不超过 10MB
							<br />
							注意：第一行将被忽略，第二行应为字段名称（productId, vendorId, count, cost），第三行开始为数据
						</p>
					</Dragger>
				)}

				{currentStep === 1 && (
					<div>
						<div style={{ marginBottom: 16 }}>
							<p>
								<strong>文件：</strong>
								{uploadedFile?.name}
							</p>
							<p>
								<strong>解析结果：</strong>
								共 {parsedRecords.length} 条记录
							</p>
						</div>
						<Table<StockInRecord>
							size="small"
							columns={[
								{
									title: "商品ID",
									dataIndex: "productId",
									key: "productId",
								},
								{
									title: "供应商ID",
									dataIndex: "vendorId",
									key: "vendorId",
								},
								{
									title: "数量",
									dataIndex: "count",
									key: "count",
								},
								{
									title: "价格",
									dataIndex: "cost",
									key: "cost",
								},
							]}
							dataSource={parsedRecords}
							rowKey={(_record, index) => `record-${index}`}
							pagination={{
								pageSize: 10,
								showSizeChanger: false,
							}}
							scroll={{ y: 300 }}
						/>
						<div style={{ marginTop: 16, textAlign: "right" }}>
							<Button onClick={() => setCurrentStep(0)} style={{ marginRight: 8 }}>
								返回
							</Button>
							<Button type="primary" onClick={handleConfirmImport} loading={uploading}>
								确认导入
							</Button>
						</div>
					</div>
				)}
			</Modal>
		</div>
	);
};

export default StockIns;
