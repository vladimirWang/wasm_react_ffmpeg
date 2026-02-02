import React, { forwardRef, useState, useImperativeHandle } from "react";
import { Button, message, Modal, Table, Upload, Steps, Select, Tooltip, Divider } from "antd";
import { InboxOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import type { TableProps, UploadProps } from "antd";
import { getProducts, IProduct } from "../api/product";
import { getVendors, IVendor } from "../api/vendor";
// import { StockInRecord } from "../api/stockIn";
import * as XLSX from "xlsx";
import { dateToMsSince1900, excelSerialToDate } from "../utils/common";
import dayjs from "dayjs";
import { StockOperationRecord } from "../api/commonDef";

const { Dragger } = Upload;

interface StockOperationUploadModalProps<T> {
	columns: TableProps<T>["columns"];
	open: boolean;
	onCancel: () => void;
	onSuccess: () => void;
	operationType: "stockIn" | "stockOut";
	onConfirm: (records: { group: T[][]; flat: T[] }) => Promise<void>;
	requiredFields: (keyof T)[];
}

/**
 * 多批次导入的索引和打平后的索引映射
 * 0:       按createdAt分组的索引索引
 * [1, 3]:  0对应打拼后的数据的第0到第3条数据
 *  {
 * 	   0: [1, 3],
 * 	   1: [3, 6],
 * 	}
 */
interface ImportedRecordBatch {
	[idx: number]: number[];
}

export interface StockOperationUploadModalRefProps {
	onItemFinish: (idx: number, success: boolean) => void;
}

const StockOperationUploadModal = <T extends StockOperationRecord>(
	{
		open,
		onCancel,
		onSuccess,
		onConfirm,
		requiredFields,
		columns,
	}: StockOperationUploadModalProps<T>,
	ref: React.Ref<StockOperationUploadModalRefProps>
) => {
	const [uploading, setUploading] = useState(false);
	const [currentStep, setCurrentStep] = useState(0); // Steps 当前步骤
	const [confirmBtnVisible, setConfirmBtnVisible] = useState(true);
	const [parsedRecords, setParsedRecords] = useState<T[]>([]); // 打平后的数据
	const [groupedRecords, setGroupedRecords] = useState<T[][]>([]); // 打平后的数据
	const [importedRecordBatch, setImportedRecordBatch] = useState<ImportedRecordBatch>({});
	const [uploadedFile, setUploadedFile] = useState<File | null>(null); // 上传的文件
	const [products, setProducts] = useState<IProduct[]>([]); // 产品列表
	const [vendors, setVendors] = useState<IVendor[]>([]); // 供应商列表
	const [loadingData, setLoadingData] = useState(false); // 加载产品和供应商数据的状态
	const [filterStatus, setFilterStatus] = useState<"all" | "success" | "failed">("all"); // 筛选状态
	// const [, setSelectedRowKeys] = useState<React.Key[]>([]); // 选中的行 key

	// 批量导入成功次数
	const [createStockInSuccessCount, setCreateStockInSuccessCount] = useState(0);
	useImperativeHandle(ref, () => {
		return {
			onItemFinish(idx, success) {
				console.log("onItemFinish: ", idx, success);
				if (success) {
					setCreateStockInSuccessCount(prev => prev + 1);
				}
				// 这一批次是哪条到那条的
				const [start, end] = importedRecordBatch[idx];
				setParsedRecords(prev =>
					prev.map((item, index) => {
						return index >= start && index < end ? { ...item, success } : item;
					})
				);
			},
		};
	});

	// 解析 Excel 文件 - 第二行作为字段 key
	const parseExcelFile = async (file: File): Promise<{ group: T[][]; flat: T[] }> => {
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
					const fieldMap: Partial<Record<keyof T, number>> = {};
					headerRow.forEach((header: any, index: number) => {
						if (header) {
							const headerStr = String(header).trim();
							fieldMap[headerStr as keyof T] = index;
						}
					});

					// 验证必需的字段是否存在
					const missingFields = requiredFields.filter(field => fieldMap[field] === undefined);
					if (missingFields.length > 0) {
						reject(new Error(`Excel 文件缺少必需字段：${missingFields.join(", ")}`));
						return;
					}

					// 从第三行开始解析数据（索引从 2 开始）
					// 注意：Excel 行号从 1 开始，数组索引从 0 开始
					// 第一行（索引 0）被忽略，第二行（索引 1）是表头，第三行（索引 2）开始是数据
					// 所以 Excel 行号 = 数组索引 + 1，数据行的 Excel 行号 = i + 1
					const createdAtMap: Record<string, T[]> = {};
					const flatRecords: T[] = [];
					for (let i = 2; i < jsonData.length; i++) {
						const row = jsonData[i];
						if (!row || row.length === 0) continue; // 跳过空行

						// 必填字段的对象
						const requiredValues: T = {} as unknown as T;
						for (const field of requiredFields) {
							const value = Number(row[fieldMap[field] as number]);
							if (isNaN(value)) {
								reject(
									new Error(`Excel 文件格式不正确：第 ${i + 1} 行 ${field as string} 字段值不合法`)
								);
								return;
							}
							requiredValues[field] = value as T[keyof T];
						}
						const createdAtSerial =
							row[fieldMap["createdAt"] as number] || dateToMsSince1900(new Date());
						const createdAt = excelSerialToDate(createdAtSerial);
						const formatCreatedAt = dayjs(createdAt).format("YYYY-MM-DD");

						if (!createdAtMap[formatCreatedAt]) {
							createdAtMap[formatCreatedAt] = [];
						}
						requiredValues.createdAt = formatCreatedAt;
						requiredValues.rowIndex = i + 1;
						flatRecords.push(requiredValues);
						createdAtMap[formatCreatedAt].push(requiredValues);
					}

					const groupRecords = Object.values(createdAtMap);
					if (groupRecords.length === 0) {
						reject(new Error("Excel 文件中没有有效数据"));
						return;
					}

					resolve({
						group: groupRecords,
						flat: flatRecords,
					});
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

			// // 前端解析 Excel 文件
			const records: { group: T[][]; flat: T[] } = await parseExcelFile(file as File);
			const importedRecordBatchTmp: ImportedRecordBatch = {};
			records.group.forEach((record, index) => {
				const previous = records.group.slice(0, index);
				const previousLength = previous.reduce((a, c) => {
					return a + c.length;
				}, 0);
				importedRecordBatchTmp[index] = [previousLength, previousLength + record.length];
			});
			setImportedRecordBatch(importedRecordBatchTmp);
			setGroupedRecords(records.group as unknown as T[][]);
			// 加载产品和供应商数据
			await loadProductsAndVendors();

			// 保存解析结果和文件，切换到第二步（解析实现为 StockInRecord，使用时 T=StockInRecord）
			setParsedRecords(records.flat as unknown as (T & { success?: boolean })[]);
			setUploadedFile(file as File);
			setCurrentStep(1);
			onUploadSuccess?.(records.flat, file);
			message.success(`成功解析 ${records.flat.length} 条记录`);
		} catch (error: any) {
			message.error(error.message);
			onError?.(error);
		} finally {
			setUploading(false);
			setConfirmBtnVisible(true);
		}
	};

	// 重置 Modal 状态
	const handleModalCancel = () => {
		if (createStockInSuccessCount > 0) {
			onSuccess?.();
		}
		setCurrentStep(0);
		setParsedRecords([]);
		setUploadedFile(null);
		setFilterStatus("all");
		onCancel();
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

	const handleOk = async () => {
		try {
			setUploading(true);
			await onConfirm({ group: groupedRecords, flat: parsedRecords });
		} finally {
			setUploading(false);
			setConfirmBtnVisible(false);
		}
	};

	const publicColumns: TableProps<T>["columns"] = [
		{
			title: "行号",
			key: "rowIndex",
			width: 60,
			render: (_, record) => record.rowIndex || "-",
		},
		{
			title: "供应商名称",
			key: "vendorName",
			width: 90,
			render: (_, record) => {
				const vendor = vendors.find(v => v.id === record.vendorId);
				return vendor ? vendor.name : "-";
			},
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
			title: "创建日期",
			dataIndex: "createdAt",
			key: "createdAt",
			width: 100,
		},
		{
			title: "数量",
			dataIndex: "count",
			key: "count",
			width: 80,
		},
	];
	const resultColumns: TableProps<T>["columns"] = [
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

	return (
		<Modal
			open={open}
			title="批量导入结果"
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
						content: "选择 Excel 文件并上传",
					},
					{
						title: "数据预览",
						content: "确认解析后的数据",
					},
				]}
				className="mb-6"
			/>

			<Divider />

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
								<Table<T>
									size="small"
									bordered
									loading={loadingData}
									columns={publicColumns.concat(columns ?? []).concat(resultColumns)}
									dataSource={filteredRecords}
									rowKey={(record, index) => `record-${record.rowIndex ?? index}`}
									pagination={{
										pageSize: 10,
										showSizeChanger: false,
									}}
									scroll={{ y: 300, x: 800 }}
								/>
								<div className="mt-4 flex justify-end items-center">
									<div className="flex gap-2">
										<Button onClick={() => setCurrentStep(0)}>上一步</Button>
										{confirmBtnVisible && (
											<Button
												type="primary"
												onClick={handleOk}
												loading={uploading}
												disabled={filteredRecords.length === 0}
											>
												确认导入
											</Button>
										)}
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

type StockOperationUploadModalForwardRef = <T extends StockOperationRecord>(
	props: StockOperationUploadModalProps<T> & React.RefAttributes<StockOperationUploadModalRefProps>
) => React.ReactElement | null;

export default forwardRef(
	StockOperationUploadModal
) as unknown as StockOperationUploadModalForwardRef;
