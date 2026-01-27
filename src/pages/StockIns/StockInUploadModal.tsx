import React, { useState } from "react";
import { Button, message, Modal, Table, Upload, Steps, Select, Tooltip } from "antd";
import { InboxOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import type { TableProps, UploadProps } from "antd";
import { getProducts, IProduct } from "../../api/product";
import { getVendors, IVendor } from "../../api/vendor";
import { createStockIn, StockInRecord } from "../../api/stockIn";
import * as XLSX from "xlsx";

const { Dragger } = Upload;

interface StockInUploadModalProps {
	open: boolean;
	onCancel: () => void;
	onSuccess: () => void;
}

const StockInUploadModal: React.FC<StockInUploadModalProps> = ({ open, onCancel, onSuccess }) => {
	const [uploading, setUploading] = useState(false);
	const [currentStep, setCurrentStep] = useState(0); // Steps 当前步骤
	const [parsedRecords, setParsedRecords] = useState<StockInRecord[]>([]); // 解析后的数据
	const [uploadedFile, setUploadedFile] = useState<File | null>(null); // 上传的文件
	const [products, setProducts] = useState<IProduct[]>([]); // 产品列表
	const [vendors, setVendors] = useState<IVendor[]>([]); // 供应商列表
	const [loadingData, setLoadingData] = useState(false); // 加载产品和供应商数据的状态
	const [filterStatus, setFilterStatus] = useState<"all" | "success" | "failed">("all"); // 筛选状态
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]); // 选中的行 key

	const columns: TableProps<StockInRecord>["columns"] = [
		{
			title: "行号",
			key: "rowIndex",
			width: 60,
			render: (_, record) => record.rowIndex || "-",
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
			render: (_, record) => {
				const product = products.find(p => p.id === record.productId);
				const productName = product ? product.name : "-";
				return (
					<Tooltip placement="topLeft" title={productName}>
						<span className="block overflow-hidden text-ellipsis whitespace-nowrap">
							{productName}
						</span>
					</Tooltip>
				);
			},
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
			render: (_, record) => {
				const vendor = vendors.find(v => v.id === record.vendorId);
				return vendor ? vendor.name : "-";
			},
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
			render: (_, record) => {
				const product = products.find(p => p.id === record.productId);
				const vendor = vendors.find(v => v.id === record.vendorId);
				const isMatched = product && vendor;
				return isMatched ? (
					<CheckCircleOutlined style={{ color: "#52c41a", fontSize: 18 }} />
				) : (
					<CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: 18 }} />
				);
			},
		},
	];

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
						reject(
							new Error(
								"Excel 文件格式不正确：至少需要 3 行数据（第一行忽略，第二行表头，第三行开始为数据）"
							)
						);
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
							if (
								headerStr.includes("productid") ||
								headerStr.includes("商品id") ||
								headerStr.includes("产品id")
							) {
								fieldMap["productId"] = index;
							} else if (
								headerStr.includes("vendorid") ||
								headerStr.includes("供应商id") ||
								headerStr.includes("厂商id")
							) {
								fieldMap["vendorId"] = index;
							} else if (headerStr.includes("count") || headerStr.includes("数量")) {
								fieldMap["count"] = index;
							} else if (
								headerStr.includes("cost") ||
								headerStr.includes("价格") ||
								headerStr.includes("成本")
							) {
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
					// 注意：Excel 行号从 1 开始，数组索引从 0 开始
					// 第一行（索引 0）被忽略，第二行（索引 1）是表头，第三行（索引 2）开始是数据
					// 所以 Excel 行号 = 数组索引 + 1，数据行的 Excel 行号 = i + 1
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
								rowIndex: i + 1, // Excel 中的行号（从 1 开始）
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

	// 加载产品和供应商数据
	const loadProductsAndVendors = async () => {
		try {
			setLoadingData(true);
			const [productsRes, vendorsRes] = await Promise.all([
				getProducts({ pagination: false }),
				getVendors({ pagination: false }),
			]);

			setProducts(productsRes.list);
			setVendors(vendorsRes.list);
		} finally {
			setLoadingData(false);
		}
	};

	// 自定义上传方法 - 改为前端解析
	const customRequest = async (options: any) => {
		const { file, onSuccess: onUploadSuccess, onError } = options;

		try {
			setUploading(true);

			// 前端解析 Excel 文件
			const records: StockInRecord[] = await parseExcelFile(file as File);

			// 加载产品和供应商数据
			await loadProductsAndVendors();

			// 保存解析结果和文件，切换到第二步
			setParsedRecords(records);
			setUploadedFile(file as File);
			setCurrentStep(1);
			onUploadSuccess?.(records, file);
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
			await createStockIn({
				productJoinStockIn,
			});
			// 上传成功后刷新列表
			onSuccess();
			// 重置状态并关闭弹窗
			handleModalCancel();
		} finally {
			setUploading(false);
		}
	};

	// 重置 Modal 状态
	const handleModalCancel = () => {
		setCurrentStep(0);
		setParsedRecords([]);
		setUploadedFile(null);
		setSelectedRowKeys([]);
		setFilterStatus("all");
		onCancel();
	};

	// 删除选中的记录
	const handleDeleteSelected = () => {
		if (selectedRowKeys.length === 0) {
			message.warning("请先选择要删除的记录");
			return;
		}

		// 根据选中的 rowKey 删除记录
		// rowKey 格式为 `record-${record.rowIndex || index}`
		const keysToDelete = new Set(selectedRowKeys.map(key => String(key)));
		const newRecords = parsedRecords.filter((record, index) => {
			const rowKey = `record-${record.rowIndex ?? index}`;
			return !keysToDelete.has(rowKey);
		});

		setParsedRecords(newRecords);
		setSelectedRowKeys([]);
		message.success(`已删除 ${selectedRowKeys.length} 条记录`);
	};

	const props: UploadProps = {
		name: "file",
		multiple: false,
		customRequest,
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
		},
	};

	return (
		<Modal
			open={open}
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
				className="mb-6"
			/>

			{currentStep === 0 && (
				<Dragger {...props} disabled={uploading}>
					<p className="ant-upload-drag-icon">
						<InboxOutlined />
					</p>
					<p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
					<p className="ant-upload-hint">
						支持 Excel 文件 (.xlsx, .xls)
						<br />
						注意：第一行将被忽略，第二行应为字段名称（productId, vendorId, count,
						cost），第三行开始为数据
					</p>
				</Dragger>
			)}

			{currentStep === 1 && (
				<div>
					{(() => {
						// 计算成功和失败的记录数
						const successCount = parsedRecords.filter(record => {
							const product = products.find(p => p.id === record.productId);
							const vendor = vendors.find(v => v.id === record.vendorId);
							return product && vendor;
						}).length;
						const failedCount = parsedRecords.length - successCount;

						// 根据筛选条件过滤数据
						const filteredRecords = parsedRecords.filter(record => {
							const product = products.find(p => p.id === record.productId);
							const vendor = vendors.find(v => v.id === record.vendorId);
							const isMatched = product && vendor;

							if (filterStatus === "all") return true;
							if (filterStatus === "success") return isMatched;
							if (filterStatus === "failed") return !isMatched;
							return true;
						});

						return (
							<>
								<div className="mb-4">
									<div className="flex justify-between items-center">
										<div>
											<p>
												<strong>文件：</strong>
												{uploadedFile?.name}
											</p>
											<p>
												<strong>解析结果：</strong>
												成功 {successCount} 条，失败 {failedCount} 条
											</p>
										</div>
										<Select
											value={filterStatus}
											onChange={setFilterStatus}
											className="w-[120px]"
											options={[
												{ label: "全部", value: "all" },
												{ label: "成功", value: "success" },
												{ label: "失败", value: "failed" },
											]}
										/>
									</div>
								</div>
								<Table<StockInRecord>
									size="small"
									bordered
									loading={loadingData}
									rowSelection={{
										selectedRowKeys,
										onChange: selectedKeys => {
											setSelectedRowKeys(selectedKeys);
										},
									}}
									columns={columns}
									dataSource={filteredRecords.sort((a, b) => (a.rowIndex || 0) - (b.rowIndex || 0))}
									rowKey={(record, index) => `record-${record.rowIndex ?? index}`}
									pagination={{
										pageSize: 10,
										showSizeChanger: false,
									}}
									scroll={{ y: 300, x: 800 }}
								/>
								<div className="mt-4 flex justify-between items-center">
									<Button
										danger
										onClick={handleDeleteSelected}
										disabled={selectedRowKeys.length === 0}
									>
										删除选中 ({selectedRowKeys.length})
									</Button>
									<div className="flex gap-2">
										<Button onClick={() => setCurrentStep(0)}>返回</Button>
										<Button type="primary" onClick={handleConfirmImport} loading={uploading}>
											确认导入
										</Button>
									</div>
								</div>
							</>
						);
					})()}
				</div>
			)}
		</Modal>
	);
};

export default StockInUploadModal;
