import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { EmscriptenModule } from "../../types/wasm";
import { ModuleContext } from "../../context/moduleContext";
import { getTrueType, pickIncrementalFields } from "../../utils/common";
import ExampleWorker from "../../workers/example.worker?worker";
import type { WorkerResult } from "../../workers/example.worker";
import { pick } from "lodash";
import ImageUpload from "../../components/ImageUpload";
import MultiCreateSelect, { type MultiCreateOption } from "../../components/MultiCreateSelect";
import { createSku, createSkuCategory, getSkuCategories, getSkus, type ISku } from "../../api/sku";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { AutoLinkPlugin } from "@lexical/react/LexicalAutoLinkPlugin";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { $getRoot, $createParagraphNode, $createTextNode, EditorState } from "lexical";
import { htmlToLexicalJson, lexicalDescToHtml } from "../../utils/lexicalHtml";

function SyncValuePlugin({ value }: { value?: string }) {
	const [editor] = useLexicalComposerContext();
	const lastAppliedRef = useRef<string | null>(null);
	useEffect(() => {
		const raw = (value ?? "").trim();
		if (!raw) return;
		if (lastAppliedRef.current === raw) return;
		// 注意：不要在 editor.update() 内调用 editor.setEditorState()，否则容易被忽略/嵌套更新失效。
		// 这里按内容类型分别处理。
		try {
			// HTML
			if (raw.startsWith("<") && raw.endsWith(">")) {
				const json = htmlToLexicalJson(raw);
				editor.setEditorState(editor.parseEditorState(json));
				lastAppliedRef.current = raw;
				return;
			}

			// Lexical JSON
			if (raw.startsWith("{") && raw.endsWith("}")) {
				editor.setEditorState(editor.parseEditorState(raw));
				lastAppliedRef.current = raw;
				return;
			}
		} catch (e) {
			console.warn("SyncValuePlugin apply failed, fallback to plain text:", e);
		}

		// 纯文本
		editor.update(() => {
			const root = $getRoot();
			root.clear();
			const p = $createParagraphNode();
			p.append($createTextNode(raw));
			root.append(p);
		});
		lastAppliedRef.current = raw;
	}, [editor, value]);
	return null;
}

function createChunks(file: File, chunkSize: number) {
	const chunks = [];
	for (let i = 0; i < file.size; i += chunkSize) {
		const chunk = file.slice(i, i + chunkSize);
		chunks.push(chunk);
	}
	return chunks;
}

function ProductDescEditor({
	value,
	onChange,
	disabled,
}: {
	value?: string;
	onChange: (next: string) => void;
	disabled?: boolean;
}) {
	const initialConfig = useMemo(() => {
		const theme = {
			paragraph: "m-0",
		};

		const config = {
			namespace: "product-desc",
			theme,
			editable: !disabled,
			nodes: [ListNode, ListItemNode, LinkNode, AutoLinkNode, CodeNode, CodeHighlightNode],
			onError(error: Error) {
				console.error("Lexical error:", error);
			},
		} as const;

		return config;
		// 初始值不要依赖 editorState（只执行一次），统一交给 SyncValuePlugin 处理异步回显
	}, [disabled]);

	const placeholder = (
		<div style={{ position: "absolute", top: 10, left: 12, color: "#999", pointerEvents: "none" }}>
			请输入产品描述…
		</div>
	);

	return (
		<div
			style={{
				border: "1px solid #d9d9d9",
				borderRadius: 8,
				padding: 12,
				minHeight: 140,
				position: "relative",
				background: disabled ? "#fafafa" : "#fff",
			}}
		>
			<LexicalComposer initialConfig={initialConfig}>
				<SyncValuePlugin value={value} />
				<RichTextPlugin
					contentEditable={
						<ContentEditable
							style={{
								outline: "none",
								minHeight: 116,
								whiteSpace: "pre-wrap",
								wordBreak: "break-word",
							}}
						/>
					}
					placeholder={placeholder}
					ErrorBoundary={({ children }) => <>{children}</>}
				/>
				<HistoryPlugin />
				<ListPlugin />
				<LinkPlugin />
				<AutoLinkPlugin matchers={[]} />
				<OnChangePlugin
					onChange={(editorState: EditorState) => {
						onChange(JSON.stringify(editorState.toJSON()));
					}}
				/>
			</LexicalComposer>
		</div>
	);
}

export default function ProductForm({
	initialValues,
	onFinishCallback,
	pageOperation,
	redirect,
}: {
	redirect?: string;
	initialValues?: IProductUpdateParams & { productJoinSkus?: { sku: ISku }[] };
	onFinishCallback?: (values: IProductUpdateParams) => Promise<void>;
	pageOperation: PageOperation;
}) {
	const module = useContext(ModuleContext);
	const [form] = Form.useForm();
	const { id } = useParams();

	const [submitting, setSubmitting] = useState(false);
	const [costDrawerOpen, setCostDrawerOpen] = useState(false);
	const [hash, setHash] = useState<string>();
	const [filename, setFilename] = useState<string>();
	const [workerLoading, setWorkerLoading] = useState(false);
	const [workerResult, setWorkerResult] = useState<string>();
	const workerFileInputRef = useRef<HTMLInputElement>(null);

	function isEmptyLexicalJson(maybeJson: string): boolean {
		const s = (maybeJson ?? "").trim();
		if (!(s.startsWith("{") && s.endsWith("}"))) return false;
		try {
			const obj = JSON.parse(s);
			const children = obj?.root?.children;
			return Array.isArray(children) && children.length === 0;
		} catch {
			return false;
		}
	}

	// 接口返回的 desc 为 HTML：转成 Lexical JSON 写回表单字段，确保编辑器能在异步场景下渲染详情
	useEffect(() => {
		const rawHtml = (initialValues?.desc ?? "").toString().trim();
		if (!rawHtml) return;
		if (!(rawHtml.startsWith("<") && rawHtml.endsWith(">"))) return;

		const current = (form.getFieldValue("desc") ?? "").toString().trim();

		// 如果用户已经编辑过（当前是非空、非“空 editorState”的 JSON），不要覆盖
		if (
			current &&
			current.startsWith("{") &&
			current.endsWith("}") &&
			!isEmptyLexicalJson(current)
		) {
			return;
		}

		// 其余情况（空值/空 editorState/仍是 HTML）都用接口 HTML 覆盖成 JSON
		const json = htmlToLexicalJson(rawHtml);
		form.setFieldsValue({ desc: json });
	}, [form, initialValues?.desc]);

	// const [vendors, setVendors] = useState<IVendor[]>([]);

	const vendorsFetch = async () => {
		const res = await getVendors({ pagination: 0 });
		return res.list.map(item => ({ value: item.id, label: item.name }));
	};

	const { data: vendors } = useSWR("https://api.example.com/data", vendorsFetch, {
		revalidateOnFocus: true,
	});

	// ===== SKU 分类 / SKU =====
	// 表单内新建、但列表接口尚未重新加载的 SKU（保证选中态立即可见）
	const [extraSkus, setExtraSkus] = useState<ISku[]>([]);
	// SKU 新增行内「所属分类」下拉的当前值
	const [newSkuCategoryId, setNewSkuCategoryId] = useState<number | undefined>(undefined);

	const { data: skuCategories, mutate: mutateSkuCategories } = useSWR(
		"sku-categories",
		async () => (await getSkuCategories()).list,
		{ revalidateOnFocus: false }
	);

	// SKU 分类仅作表单内筛选，不随产品提交
	const selectedCategoryIds: number[] = Form.useWatch("skuCategoryIds", form) ?? [];

	const { data: skuList } = useSWR(
		selectedCategoryIds.length > 0
			? (["skus-by-categories", selectedCategoryIds.join(",")] as const)
			: null,
		async ([, ids]) => (await getSkus({ categoryIds: ids })).list,
		{ revalidateOnFocus: false }
	);

	const categoryOptions: MultiCreateOption[] = useMemo(
		() => (skuCategories ?? []).map(c => ({ value: c.id, label: c.name })),
		[skuCategories]
	);

	const skuOptions: MultiCreateOption[] = useMemo(() => {
		const map = new Map<number, MultiCreateOption>();
		for (const s of [...(skuList ?? []), ...extraSkus]) {
			map.set(s.id, { value: s.id, label: s.name, skuCategoryId: s.skuCategoryId });
		}
		return Array.from(map.values());
	}, [skuList, extraSkus]);

	// 分类选择变化时：收敛新增行的「所属分类」
	useEffect(() => {
		if (selectedCategoryIds.length === 1) {
			setNewSkuCategoryId(selectedCategoryIds[0]);
		} else if (newSkuCategoryId !== undefined && !selectedCategoryIds.includes(newSkuCategoryId)) {
			setNewSkuCategoryId(undefined);
		}
	}, [selectedCategoryIds, newSkuCategoryId]);

	// 取消勾选分类时，移除其下已选 SKU（选项尚未加载的保守保留）
	const pruneSkuIdsByCategories = (ids: number[]) => {
		const current: number[] = form.getFieldValue("skuIds") ?? [];
		const optionMap = new Map(skuOptions.map(o => [o.value, o]));
		const next = current.filter(skuId => {
			const opt = optionMap.get(skuId);
			if (!opt || opt.skuCategoryId === undefined) return true;
			return ids.includes(opt.skuCategoryId);
		});
		if (next.length !== current.length) form.setFieldValue("skuIds", next);
	};

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

	// 产品详情中的 SKU 关联 → 表单初值：skuIds + 由 SKU 反推出的已选分类
	const formInitialValues = useMemo(
		() => ({
			...initialValues,
			img: initialValues?.img ? [initialValues.img] : undefined,
			skuIds: initialValues?.productJoinSkus?.map(item => item.sku.id),
			skuCategoryIds: Array.from(
				new Set((initialValues?.productJoinSkus ?? []).map(item => item.sku.skuCategoryId))
			),
		}),
		[initialValues]
	);

	const navigate = useNavigate();
	const descValue = Form.useWatch("desc", form);
	console.log("---descValue---: ", descValue);
	const [descHtml, setDescHtml] = useState<string>();
	const genHtml = async () => {
		const values = form.getFieldsValue();
		const { created, updated } = pickIncrementalFields<IProductUpdateParams>(
			values,
			initialValues as IProductUpdateParams
		);
		if (created.length === 0) {
			message.error("没有变化");
			return;
		}
		const descValue = values[created[0]];
		console.log("---descValue---: ", descValue);
		const descHtmlTxt = await lexicalDescToHtml(descValue);
		setDescHtml(descHtmlTxt);
		// console.log("---values---: ", pick(values, [...(created as any), ...(updated as any)]));
		// console.log("---created---: ", created);
		// console.log("---updated---: ", updated);
		// setDescHtml(await lexicalDescToHtml(descValue));
	};
	const genJson = () => {
		// const str = "<p>123</p>";
		const str = '<p><span style="white-space: pre-wrap;">12312300099</span></p>';
		const json = htmlToLexicalJson(str);
		console.log("---json---: ", json);
	};
	const json = {
		root: {
			children: [
				{
					children: [
						{
							detail: 0,
							format: 0,
							mode: "normal",
							style: "",
							text: "12",
							type: "text",
							version: 1,
						},
					],
					direction: null,
					format: "",
					indent: 0,
					type: "paragraph",
					version: 1,
					textFormat: 0,
					textStyle: "",
				},
			],
			direction: null,
			format: "",
			indent: 0,
			type: "root",
			version: 1,
		},
	};
	return (
		<div className="p-6">
			<Form
				disabled={pageOperation === "view"}
				form={form}
				name="basic"
				initialValues={formInitialValues}
				labelCol={{ span: 6 }}
				wrapperCol={{ span: 18 }}
				onFinish={async values => {
					if (!onFinishCallback) return;
					setSubmitting(true);
					try {
						// 提交时：把 desc（Lexical JSON/纯文本/HTML）统一转成 HTML
						// 注意：initialValues 是 Partial，可能没有 desc 这个 key；
						// 此时 desc 会落在 created，而不是 updated，所以需要合并 created+updated。
						const { created, updated } = pickIncrementalFields<IProductUpdateParams>(
							values,
							initialValues as IProductUpdateParams
						);
						console.log("---created---: ", created);
						console.log("---updated---: ", updated);
						const changedKeys = Array.from(new Set([...(created as any), ...(updated as any)]));
						const incrementalValues = pick(values, changedKeys);
						// SKU 分类仅用于表单内过滤 SKU 选项，不提交后端
						delete incrementalValues.skuCategoryIds;
						console.log("---incrementalValues 1---: ", values.desc, incrementalValues);
						if (incrementalValues.desc) {
							const descHtml = await lexicalDescToHtml(incrementalValues.desc);
							incrementalValues.desc = descHtml;
						}
						await onFinishCallback({
							...incrementalValues,
							img: incrementalValues.img ? incrementalValues.img[0] : undefined,
							salePrice: incrementalValues.salePrice
								? Number(incrementalValues.salePrice)
								: undefined,
						});
					} catch (e) {
						// message.error("提交失败: " + (e as Error).message);
						console.error("---submit error---: ", e);
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
							rules={[{ required: true, message: "请选择供应商" }]}
						>
							<div className="flex items-center gap-2">
								<Form.Item name="vendorId" noStyle>
									<Select style={{ width: "100%" }} placeholder="请选择供应商" options={vendors} />
								</Form.Item>
								<Button
									type="primary"
									onClick={() => {
										navigate("/vendor/create?redirect=" + (redirect ?? ""));
									}}
								>
									<PlusOutlined />
								</Button>
							</div>
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
							rules={
								[
									// { required: true, message: "请输入上架价格" },
									// { max: 9999, message: "价格不能超过9999元" },
								]
							}
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
						<Form.Item<IProductUpdateParams>
							label="SKU分类"
							name="skuCategoryIds"
							extra="可从已有分类中多选，也可在下拉框底部直接新增分类"
						>
							<MultiCreateSelect
								placeholder="请选择或新增SKU分类（可多选）"
								options={categoryOptions}
								disabled={pageOperation === "view"}
								onChange={pruneSkuIdsByCategories}
								onAdd={async name => {
									const created = await createSkuCategory({ name });
									await mutateSkuCategories(list => [...(list ?? []), created], {
										revalidate: false,
									});
									return { value: created.id, label: created.name };
								}}
							/>
						</Form.Item>
						<Form.Item<IProductUpdateParams>
							label="SKU"
							name="skuIds"
							extra="展示所选分类下的已有 SKU，可多选；新增时请先选择所属分类"
						>
							<MultiCreateSelect
								placeholder={
									selectedCategoryIds.length ? "请选择或新增SKU（可多选）" : "请先选择SKU分类"
								}
								options={skuOptions}
								disabled={pageOperation === "view"}
								addDisabled={selectedCategoryIds.length === 0 || !newSkuCategoryId}
								addDisabledTip={
									selectedCategoryIds.length === 0 ? "请先选择SKU分类" : "请选择所属分类"
								}
								addBefore={
									<Select
										style={{ width: 120 }}
										placeholder="所属分类"
										value={newSkuCategoryId}
										onChange={setNewSkuCategoryId}
										options={categoryOptions.filter(c => selectedCategoryIds.includes(c.value))}
										disabled={pageOperation === "view" || selectedCategoryIds.length === 0}
										// 浮层挂在节点内部，点选项时不脱离外层 SKU 下拉，避免外层被关闭
										getPopupContainer={triggerNode => triggerNode.parentElement ?? document.body}
									/>
								}
								onAdd={async name => {
									const created = await createSku({
										name,
										skuCategoryId: newSkuCategoryId as number,
									});
									setExtraSkus(prev => [...prev, created]);
									return {
										value: created.id,
										label: created.name,
										skuCategoryId: created.skuCategoryId,
									};
								}}
							/>
						</Form.Item>
					</section>
					<section className="flex-1 space-y-4">
						{/* 用 Lexical 作为描述编辑器；desc 字段仍保存为 string（Lexical JSON 或旧纯文本） */}
						<Form.Item<IProductUpdateParams> name="desc" hidden>
							<Input />
						</Form.Item>
						<Form.Item label="描述">
							<ProductDescEditor
								disabled={pageOperation === "view"}
								value={descValue}
								// value={json}
								onChange={next => form.setFieldValue("desc", next)}
							/>
						</Form.Item>
						<Form.Item<IProductUpdateParams> label="产品图片" name="img">
							<ImageUpload maxCount={1} showStandardize={pageOperation !== "view"} />
							{/* <Upload
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
							</Upload> */}
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
