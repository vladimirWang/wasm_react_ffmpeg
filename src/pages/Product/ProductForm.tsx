import { useContext, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import debounce from "lodash/debounce";
import { IProductUpdateParams, checkProductNameExistedInVendor } from "../../api/product";
import {
	Button,
	Card,
	Empty,
	Flex,
	Form,
	Input,
	InputNumber,
	message,
	Select,
	Space,
	Upload,
} from "antd";
import { RcFile } from "antd/es/upload";
import { LoadingOutlined, PlusOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { getVendors } from "../../api/vendor";
import { CostHistoryDrawer } from "./CostHistoryDrawer";
import { PageOperation } from "../../enum";
import { PositiveInputNumber } from "../../components/PositiveInputNumber";
import {
	checkAndUploadFile,
	checkFileExistedByHash,
	mergeChunkFiles,
	uploadChunkFile,
	uploadFile,
} from "../../api/util";
import { chunkFileWithWasm, md5File } from "../../utils/file";
import { EmscriptenModule } from "../../types/wasm";
import { ModuleContext } from "../../context/moduleContext";
import { getTrueType } from "../../utils/common";
import ExampleWorker from "../../workers/example.worker?worker";
import type { WorkerResult } from "../../workers/example.worker";

function createChunks(file: File, chunkSize: number) {
	const chunks = [];
	for (let i = 0; i < file.size; i += chunkSize) {
		const chunk = file.slice(i, i + chunkSize);
		chunks.push(chunk);
	}
	return chunks;
}

export default function ProductForm({
	initialValues,
	onFinishCallback,
	pageOperation,
}: {
	initialValues?: IProductUpdateParams;
	onFinishCallback?: (values: IProductUpdateParams) => Promise<void>;
	pageOperation: PageOperation;
}) {
	const module = useContext(ModuleContext);
	const [form] = Form.useForm();
	const { id } = useParams();

	const [imageUrl, setImageUrl] = useState<string | undefined>(initialValues?.img);
	const [uploading, setUploading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [costDrawerOpen, setCostDrawerOpen] = useState(false);
	const [hash, setHash] = useState<string>();
	const [filename, setFilename] = useState<string>();
	const [workerLoading, setWorkerLoading] = useState(false);
	const [workerResult, setWorkerResult] = useState<string>();
	const workerFileInputRef = useRef<HTMLInputElement>(null);

	const beforeUpload = (file: RcFile) => {
		return true;
		// const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
		// if (!isJpgOrPng) {
		// 	message.error("You can only upload JPG/PNG file!");
		// }
		// return isJpgOrPng;
	};
	const handleChange = (info: any) => {
		const status = info?.file?.status as string | undefined;
		setUploading(status === "uploading");
		const fileObj = info?.file?.originFileObj as RcFile | undefined;
		if (fileObj) {
			setImageUrl(URL.createObjectURL(fileObj));
		}
	};

	const uploadButton = (
		<button style={{ border: 0, background: "none" }} type="button">
			{uploading ? <LoadingOutlined /> : <PlusOutlined />}
			<div style={{ marginTop: 8 }}>Upload</div>
		</button>
	);

	// const [vendors, setVendors] = useState<IVendor[]>([]);

	const vendorsFetch = async () => {
		const res = await getVendors({ pagination: false });
		return res.list.map(item => ({ value: item.id, label: item.name }));
	};

	const { data: vendors } = useSWR("https://api.example.com/data", vendorsFetch, {
		revalidateOnFocus: true,
	});

	const productId = id ? Number(id) : undefined;

	// 防抖：停止输入 500ms 后再请求，仅用于输入过程中的即时反馈（失焦/提交时校验器会直接请求）
	const debouncedCheckName = useMemo(
		() =>
			debounce((vendorId: number, productName: string) => {
				if (pageOperation !== "update" || initialValues?.name !== productName) {
					checkProductNameExistedInVendor(vendorId, { productName }).then(existed =>
						form.setFields([{ name: "name", errors: existed ? ["商品名称已存在"] : [] }])
					);
				}
			}, 500),
		[form]
	);

	const testUploadFile = async (options: any) => {
		try {
			const { file } = options;
			const blob = file.slice(0, file.size);
			const trueType = getTrueType(blob);
			console.log("---trueType: ", trueType);
			const fileType = getTrueType(file);
			console.log("---fileType: ", fileType);
			const md5 = await md5File(file);
			const res = await checkAndUploadFile(md5, file);
			const formData = new FormData();
			formData.append("file", file);

			formData.append("hash", md5);
			// const res = await uploadFile(formData);
			console.log("---res---: ", res);
			form.setFieldsValue({
				img: `${res.filePath}`,
			});
		} catch (e) {
			message.error("上传失败: " + (e as Error).message);
		}
	};
	const testUploadChunk = async (file: File) => {
		// 分片上传
		try {
			if (!module) return;
			const hash = await md5File(file);
			const chunks = await chunkFileWithWasm(file, module);
			console.log("chunks length: ", chunks.length);
			const tasks = chunks.map(async (chunk, index) => {
				const formData = new FormData();
				const arrayBuffer = chunk.buffer.slice(
					chunk.byteOffset,
					chunk.byteOffset + chunk.byteLength
				) as ArrayBuffer;
				const blob = new Blob([arrayBuffer]);
				formData.append("file", blob, `${hash}-${index}.chunk`);
				// formData.append("file", file);
				formData.append("hash", hash);
				formData.append("index", String(index));
				const chunkHash = await md5File(blob);
				formData.append("chunkHash", chunkHash);
				// return uploadChunkFile(formData);
				return uploadFile(formData);
			});
			await Promise.all(tasks);
			message.success("上传成功");
		} catch (e) {
			message.error("上传失败: " + (e as Error).message);
		}
	};

	const handleUpload = async (options: any) => {
		const { file } = options;
		try {
			console.log("module: ", module);
			if (!module) return;
			const chunks = await chunkFileWithWasm(file, module);
			console.log(`共 ${chunks.length} 个分片`);
			chunks.forEach((chunk, i) => {
				console.log(`分片 ${i}: ${chunk.length} 字节`);
			});
		} catch (e) {
			message.error("上传失败: " + (e as Error).message);
		}

		// // 测试分片上传
		// testUploadChunk(file);

		// // 文件上传
		// // testUploadFile(file);
		// const chunks = createChunks(file, 10 * 1024 * 1024);
		// const hash = await createHash(chunks);
		// console.log("---hash: ", hash);

		// // 调用bun_api
		// const chunks = createChunks(file, 10 * 1024 * 1024);
		// console.log("chunks.length: ", chunks.length);

		// const hash = await md5File(file);
		// setHash(hash);
		// setFilename(file.name);

		// async function uploadRecursion(chunks: Blob[], index: number) {
		// 	// const reader = new FileReader();
		// 	// reader.readAsArrayBuffer(file);
		// 	// reader.onload = () => {
		// 	//   const arrayBuffer = reader.result;
		// 	//   const chunk = arrayBuffer.slice(
		// 	//     index * chunkSize,
		// 	//     (index + 1) * chunkSize,
		// 	//   );
		// 	// };
		// 	if (index >= chunks.length) {
		// 		console.log("上传完成");
		// 		return;
		// 	}
		// 	const formData = new FormData();
		// 	formData.append("file", chunks[index]);
		// 	formData.append("hash", hash);
		// 	formData.append("index", index + "");
		// 	uploadChunkFile(formData).then(() => {
		// 		uploadRecursion(chunks, index + 1);
		// 	});
		// 	// fetch("/bun_api/uploadChunk", {
		// 	// 	method: "POST",
		// 	// 	body: formData,
		// 	// }).then(() => {
		// 	// 	uploadRecursion(chunks, index + 1);
		// 	// });
		// }

		// uploadRecursion(chunks, 0);
	};

	const handleMergeChunks = async () => {
		if (!hash || !filename) {
			message.error("hash 或 filename 不能为空");
			return;
		}
		const params = {
			hash,
			filename,
		};

		mergeChunkFiles(params).then(() => {
			message.success("合并成功");
		});
	};

	/** Web Worker 范例：传入 File，在后台线程计算 MD5 hash */
	const handleWebWorkerDemo = (file: File) => {
		setWorkerLoading(true);
		setWorkerResult(undefined);
		const worker = new ExampleWorker();
		worker.postMessage({ type: "compute", payload: { file } });
		worker.onmessage = (e: MessageEvent<WorkerResult>) => {
			const res = e.data;
			if (res.type === "computed") {
				setHash(res.payload.hash);
				console.log("---hash---in handleWebWorkerDemo res.payload.hash: ", res.payload.hash);
				setFilename(file.name);
				setWorkerResult(
					`MD5: ${res.payload.hash.slice(0, 16)}...，耗时 ${res.payload.duration.toFixed(0)}ms`
				);
				message.success("Web Worker 计算完成");
			} else if (res.type === "error") {
				message.error("Worker 错误: " + res.payload.message);
			}
			setWorkerLoading(false);
			worker.terminate();
		};
		worker.onerror = () => {
			message.error("Web Worker 执行出错");
			setWorkerLoading(false);
			worker.terminate();
		};
	};

	const handleUploadBigFile = async (options: any) => {
		try {
			const { file } = options;
			handleWebWorkerDemo(file);
		} catch (e) {
			message.error("上传失败: " + (e as Error).message);
		}
	};

	return (
		<div className="p-6">
			{/* <strong>{typeof theme.ccall}</strong> */}
			<Form
				disabled={pageOperation === "view"}
				form={form}
				name="basic"
				initialValues={initialValues}
				labelCol={{ span: 6 }}
				wrapperCol={{ span: 18 }}
				onFinish={async values => {
					if (!onFinishCallback) return;
					setSubmitting(true);
					try {
						await onFinishCallback({
							...values,
							salePrice: values.salePrice ? Number(values.salePrice) : undefined,
						});
					} finally {
						setSubmitting(false);
					}
				}}
				autoComplete="off"
			>
				<div className="flex gap-8 justify-between w-full">
					<section className="flex-1 space-y-4">
						<Form.Item<IProductUpdateParams>
							label="供应商"
							name="vendorId"
							rules={[{ required: true, message: "请选择供应商" }]}
						>
							<Select style={{ width: "100%" }} placeholder="请选择供应商" options={vendors} />
						</Form.Item>
						<Form.Item<IProductUpdateParams>
							label="名称"
							name="name"
							validateTrigger={["onBlur", "onSubmit"]}
							rules={[
								{ required: true, message: "请输入名称" },
								{
									validator: async (_, value) => {
										if (pageOperation === "update" && initialValues?.name === value) {
											return Promise.resolve();
										}
										const vendorId = form.getFieldValue("vendorId");
										if (!vendorId) return Promise.resolve();
										const existed = await checkProductNameExistedInVendor(vendorId, {
											productName: value,
										});
										return existed
											? Promise.reject(new Error("商品名称已存在"))
											: Promise.resolve();
									},
								},
							]}
						>
							<Input
								placeholder="请输入产品名称"
								onChange={e => {
									const vendorId = form.getFieldValue("vendorId");
									const value = e.target.value?.trim();
									if (vendorId && value) debouncedCheckName(vendorId, value);
								}}
							/>
						</Form.Item>
						<Form.Item<IProductUpdateParams>
							label="售价"
							name="salePrice"
							rules={[
								// { required: true, message: "请输入上架价格" },
								{ max: 9999, message: "价格不能超过9999元" },
							]}
						>
							<div className="flex items-center gap-2">
								<PositiveInputNumber
									min={0}
									precision={0}
									placeholder="请输入价格"
									style={{ width: "100%" }}
									value={initialValues?.salePrice}
								/>
								<QuestionCircleOutlined
									style={{ color: "red" }}
									onClick={() => {
										setCostDrawerOpen(true);
									}}
								/>
							</div>
						</Form.Item>
						<Form.Item<IProductUpdateParams> label="备注" name="remark">
							<Input.TextArea showCount maxLength={190} rows={4} placeholder="请输入备注信息" />
						</Form.Item>
					</section>
					<section className="flex-1 space-y-4">
						<Form.Item<IProductUpdateParams> label="产品图片" name="img">
							<Upload
								accept={".jpg,.jpeg,.png,.gif,.bmp,.webp"}
								name="file"
								listType="picture-card"
								className="avatar-uploader"
								showUploadList={false}
								customRequest={testUploadFile}
								beforeUpload={beforeUpload}
								onChange={handleChange}
							>
								{imageUrl ? (
									<div className="w-[100px] h-[100px] overflow-hidden flex justify-center items-center">
										<img
											draggable={false}
											src={imageUrl}
											alt="avatar"
											style={{ width: "100%", objectFit: "cover" }}
										/>
									</div>
								) : (
									uploadButton
								)}
							</Upload>
						</Form.Item>
					</section>
				</div>
				<Form.Item label={null} className="mt-6">
					<Space>
						<Button type="primary" htmlType="submit" loading={submitting} size="large">
							提交
						</Button>
						<Button htmlType="reset" size="large" onClick={() => form.resetFields()}>
							重置
						</Button>
						{/*
						<Button onClick={handleMergeChunks}>merge</Button>
						<Button
							onClick={() => workerFileInputRef.current?.click()}
							loading={workerLoading}
							size="large"
						>
							Web Worker 演示
						</Button>
						<input
							ref={workerFileInputRef}
							type="file"
							className="hidden"
							onChange={e => {
								const file = e.target.files?.[0];
								if (file) handleWebWorkerDemo(file);
								e.target.value = "";
							}}
						/>
						{workerResult && <span className="text-gray-500">{workerResult}</span>}
*/}
					</Space>
				</Form.Item>
			</Form>
			<CostHistoryDrawer
				open={costDrawerOpen}
				onClose={() => setCostDrawerOpen(false)}
				productId={productId}
			/>
		</div>
	);
}
