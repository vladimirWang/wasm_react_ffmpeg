import { DataValidation, Workbook, Worksheet } from "exceljs";
import type { IProduct } from "./product";
import { goRequest, nodejsRequest } from "../request";
import { IResponse } from "./commonDef";
import { ParamEmail } from "./user";
import { message } from "antd";
import dayjs from "dayjs";

const prefix = "/util";

interface IUploadFileParams {
	file: File;
}
interface IUploadFileResponse {
	filePath: string;
	baseUrl: string;
	hash: string;
}
export const uploadFile = async (formData: FormData): Promise<IUploadFileResponse> => {
	// return goRequest.post<IUploadFileResponse>("/user/upload", formData);
	console.log("---uploadFile---: ", formData);
	return nodejsRequest.post<IUploadFileResponse>("/user/upload", formData);
};

interface IFileExisted {
	// existed: boolean;
	filePath: string;
	baseUrl: string;
}

export const checkFileExistedByHash = (
	hash: string,
	config?: { showSuccessMessage?: boolean }
): Promise<IFileExisted> => {
	// return goRequest.get<IFileExisted>("/user/checkFileExisted/" + hash, {
	// 	showSuccessMessage: config?.showSuccessMessage,
	// });
	return nodejsRequest.get<IFileExisted>("/user/checkFileExisted/" + hash, {
		showSuccessMessage: config?.showSuccessMessage,
	});
};

// 检查文件是否存在，不存在则上传
export const checkAndUploadFile = async (
	hash: string,
	file: File
): Promise<IUploadFileResponse> => {
	const existed = await checkFileExistedByHash(hash);
	if (existed.filePath) {
		return { ...existed, hash };
	}
	const formData = new FormData();
	formData.append("hash", hash);
	formData.append("file", file);
	return uploadFile(formData);
};

// 上传分片文件
export const uploadChunkFile = async (formData: FormData): Promise<IUploadFileResponse> => {
	// return goRequest.post<IUploadFileResponse>("/user/uploadChunk", formData);
	return nodejsRequest.post<IUploadFileResponse>("/user/uploadChunk", formData);
};

interface IMergeChunkFilesParams {
	hash: string;
	filename: string;
}
// 上传分片文件
// "c40788c8a7c2198732b2031843a4f893"
export const mergeChunkFiles = async (
	data: IMergeChunkFilesParams
): Promise<IUploadFileResponse> => {
	// return goRequest.post<IUploadFileResponse>("/user/mergeChunks", data);
	return nodejsRequest.post<IUploadFileResponse>("/user/mergeChunks", data);
};

export interface ICaptcha {
	image: string;
	captchaId: string;
}
export const getCaptcha = (): Promise<ICaptcha> => {
	const rnd = Math.random();
	const rndStr = (rnd + "").slice(2);
	return nodejsRequest.get<ICaptcha>(`${prefix}/captcha?q=${rndStr}`);
};

export const getNonce = (): Promise<string> => {
	return nodejsRequest.get<string>(`${prefix}/get-nonce`);
};

// 发送邮箱验证码
export const sendEmailVerificationCode = (email: string): Promise<void> => {
	return nodejsRequest.post<void>(`${prefix}/sendEmailVerificationCode`, { email });
};

export interface ICheckEmailVerificationCodeResponse {
	email: string;
	verified: boolean;
}
// 验证邮箱
export const checkEmailVerificationCode = (data: {
	email: string;
	verifyCode: string;
}): Promise<ICheckEmailVerificationCodeResponse> => {
	return nodejsRequest.post<ICheckEmailVerificationCodeResponse>(
		`${prefix}/checkEmailValidation`,
		data
	);
};

type OptionField = "productId" | "vendorId";
type OptionField2 = "productId" | "vendorId" | "clientId" | "platformId";

/** 1-based 列号转 Excel 列字母（1→A，27→AA） */
function columnIndexToLetter(index: number): string {
	let letter = "";
	let n = index;
	while (n > 0) {
		const r = (n - 1) % 26;
		letter = String.fromCharCode(65 + r) + letter;
		n = Math.floor((n - 1) / 26);
	}
	return letter;
}

const LISTS_SHEET = "Lists";
const DATA_FIRST_ROW = 3;
const DATA_LAST_ROW = 1000;
/** 级联 INDIRECT 失败或父格为空时的占位命名区域（Lists 上单格空值） */
const EMPTY_PRODUCT_LIST_NAME = "EmptyProductList";

export type ExcelColumnType = "text" | "number" | "date" | "select";

/**
 * select：固定 options，对应 Lists 上一列；
 * cascade：依赖父列（须为 select，单元格为「名称-id」）；按 vendorId 在 Lists 上为每个父选项分列写入子项并注册 V_{id}，子列 INDIRECT 引用。
 */

export interface IOptionCascade {
	label: string;
	value: string;
	parentValue: string;
}

export interface IExcelBaseColumn {
	header: string;
	key: string;
}

export type IExcelColumn<T extends ExcelColumnType = ExcelColumnType> = IExcelBaseColumn & {
	type: T;
} & (T extends "select"
		? // 当 type = select 时：必须有 options，且支持普通/联动两种场景
				| {
						// 普通 select：仅 options（IOption[]），无 parentField
						options: IOption[];
						parentField?: never;
				  }
				| {
						// 联动 select：有 parentField + options 必须是 IOptionCascade[]（含 parentValue）
						parentField: string;
						options: IOptionCascade[];
				  }
		: // 非 select 时：禁止出现 options/parentField
			{
				options?: never;
				parentField?: never;
			});

export interface IOption {
	label: string;
	value: string;
}

type Alpha =
	| "A"
	| "B"
	| "C"
	| "D"
	| "E"
	| "F"
	| "G"
	| "H"
	| "I"
	| "J"
	| "K"
	| "L"
	| "M"
	| "N"
	| "O"
	| "P"
	| "Q"
	| "R"
	| "S"
	| "T"
	| "U"
	| "V"
	| "W"
	| "X"
	| "Y"
	| "Z";
interface IPos {
	x: Alpha;
	y: number;
}
const setDataValidations = (
	listsWs: Worksheet,
	targetWs: Worksheet,
	options: IOption[],
	range: [IPos, IPos],
	listColIndex: number = 1
) => {
	const [start, end] = range;
	// Lists!A 列：全部供应商（供「供应商」列下拉）
	options.forEach((v, i) => {
		listsWs.getCell(i + 1, listColIndex).value = `${v.label}-${v.value}`;
	});
	const listColLetter = columnIndexToLetter(listColIndex);
	const listAddr = `'${LISTS_SHEET}'!$${listColLetter}$1:$${listColLetter}$${Math.max(1, options.length)}`;

	const dataValidations = (
		targetWs as typeof targetWs & {
			dataValidations: { add: (addr: string, v: DataValidation) => void };
		}
	).dataValidations;

	// 供应商：固定列表
	const dvVendor: DataValidation = {
		type: "list",
		allowBlank: false,
		formulae: [listAddr],
		showErrorMessage: true,
		errorStyle: "error",
		errorTitle: "输入错误",
		error: "请从下拉列表中选择数据项",
	};
	dataValidations.add(`${start.x}${start.y}:${end.x}${end.y}`, dvVendor);
};

/**
 * 进货模板（级联下拉）：先选供应商列，再选产品列；产品列表随供应商变化。
 * 依赖 INDIRECT + 工作簿名称 V_{vendorId}，供应商显示格式须为「名称-id」（与页面 `${name}-${id}` 一致），以便从单元格解析出 id。
 */
export const generateExcel2 = async (
	products: IProduct[],
	vendors: Array<IOption>,
	titles: Array<{ label: string; field: string }>
) => {
	try {
		const vendorColIdx = titles.findIndex(t => t.field === "vendorId");
		if (vendorColIdx < 0) {
			throw new Error("titles 中需同时包含 productId 与 vendorId 列");
		}

		const wb = new Workbook();
		const ws = wb.addWorksheet("Sheet1");

		titles.forEach((title, index) => {
			const colL = columnIndexToLetter(index + 1);
			ws.getCell(`${colL}1`).value = title.label;
			ws.getCell(`${colL}2`).value = title.field;
		});

		const vendorLetter = columnIndexToLetter(vendorColIdx + 1);

		const listsWs = wb.addWorksheet(LISTS_SHEET, { state: "hidden" });

		setDataValidations(listsWs, ws, vendors, [
			{ x: vendorLetter as Alpha, y: DATA_FIRST_ROW },
			{ x: vendorLetter as Alpha, y: DATA_LAST_ROW },
		]);
		// // 自 B 列起：每个供应商一列产品「名称-id」，并注册名称 V_{id}
		// const byVendor = new Map<number, IProduct[]>();
		// for (const p of products) {
		// 	if (!byVendor.has(p.vendorId)) byVendor.set(p.vendorId, []);
		// 	byVendor.get(p.vendorId)!.push(p);
		// }

		// for (const v of vendors) {
		// 	const plist = byVendor.get(v.id) ?? [];
		// 	const colL = columnIndexToLetter(listCol);
		// 	const rowCount = Math.max(1, plist.length);
		// 	if (plist.length === 0) {
		// 		listsWs.getCell(1, listCol).value = "";
		// 	} else {
		// 		plist.forEach((p, i) => {
		// 			listsWs.getCell(i + 1, listCol).value = `${p.name}-${p.id}`;
		// 		});
		// 	}
		// 	const rangeAddr = `'${LISTS_SHEET}'!$${colL}$1:$${colL}$${rowCount}`;
		// 	wb.definedNames.add(rangeAddr, `V_${v.id}`);
		// 	listCol += 1;
		// }

		// 产品：INDIRECT("V_"&从供应商单元格解析出的 id)；用 ROW() 与 INDIRECT 引用「当前行」的供应商格，避免整列下拉仍指向第 3 行
		// const vendorCellRef = `INDIRECT("${vendorLetter}"&ROW())`;
		// const vendorIdFromCell = `VALUE(TRIM(RIGHT(SUBSTITUTE(${vendorCellRef},"-",REPT(" ",99)),99)))`;
		// const productListFormula = `INDIRECT("V_"&${vendorIdFromCell})`;
		// const dvProduct: DataValidation = {
		// 	type: "list",
		// 	allowBlank: true,
		// 	formulae: [productListFormula],
		// 	showErrorMessage: true,
		// 	errorStyle: "error",
		// 	errorTitle: "输入错误",
		// 	error: "请先选择供应商，再从列表中选择产品",
		// };
		// dataValidations.add(
		// 	`${productLetter}${DATA_FIRST_ROW}:${productLetter}${DATA_LAST_ROW}`,
		// 	dvProduct
		// );

		const buffer = await wb.xlsx.writeBuffer();
		const filename = `进货单模板_${dayjs().format("YYYY-MM-DD")}.xlsx`;
		downloadFileByBuffer(buffer, filename);
		return Promise.resolve();
	} catch (error) {
		// message.error((error as Error).message);
		return Promise.reject(error);
	}
};

function setValidationDataSource(ws: Worksheet, colLetter: string, options: IOption[]) {
	options.forEach((opt, idx) => {
		ws.getCell(`${colLetter}${idx + 2}`).value = `${opt.label}-${opt.value}`; // 从第2行开始写选项
	});
}

function generateIfFormula(
	parentColLetter: string,
	i: number,
	options: Array<{ value: string; addr: string }>
) {
	let formula = "";
	options.forEach((opt, idx) => {
		if (idx === 0) {
			formula += `IF(${parentColLetter}${i}="${opt.value}",${opt.addr}`;
		} else {
			formula += `,IF(${parentColLetter}${i}="${opt.value}",${opt.addr}`;
		}
	});
	formula += ', "")' + ")";
	//  .repeat(options.length);
	return formula;
}

export const generateExcel3 = async (columns: IExcelColumn[]) => {
	try {
		const wb = new Workbook();
		const ws = wb.addWorksheet("数据");
		const hiddenWs = wb.addWorksheet("LISTS", { state: "hidden" });
		console.log("columns", columns);
		// 表头
		ws.columns = columns.map(col => ({ header: col.header, key: col.key, width: 20 }));
		// ws.columns = [
		//   { header: '品牌', key: 'brand', width: 20 },
		//   { header: '产品', key: 'product', width: 20 }
		// ];
		ws.getRow(1).font = { bold: true };

		// 2. 锁定第一、二行（仅这两行不可修改）
		ws.getRow(1).eachCell(cell => (cell.protection = { locked: true }));
		ws.getRow(2).eachCell(cell => (cell.protection = { locked: true }));

		// 3. 从第 3 行开始（以 0 开始计数行索引 >= 2），所有单元格都可编辑
		// 注意：工作表 protect 后，未显式解锁的单元格会默认 locked=true
		for (let row = DATA_FIRST_ROW; row <= DATA_LAST_ROW; row++) {
			for (let col = 1; col <= columns.length; col++) {
				ws.getCell(row, col).protection = { locked: false };
			}
		}

		let hiddenListColIndex = 1; // 从A列开始写数据源
		let colIndex = 1;
		columns.forEach(col => {
			let colLetter = columnIndexToLetter(colIndex);
			ws.getCell(`${colLetter}2`).value = col.key;
			if (col.type === "select" && Array.isArray(col.options) && col.options.length > 0) {
				const hiddenColLetter = columnIndexToLetter(hiddenListColIndex);
				const options = col.options;
				// 如果是下拉类型，且有选项，则写入数据源
				if (col.parentField) {
					const parentColIndex = columns.findIndex(c => c.key === col.parentField);
					if (parentColIndex === -1) {
						return;
					}
					const parentOptions = columns[parentColIndex].options;
					if (!parentOptions || parentOptions.length === 0) {
						return;
					}

					const parentColLetter = columnIndexToLetter(parentColIndex + 1);
					console.log("parentColLetter", parentColLetter);
					// 处理联动关系，先写入所有选项到隐藏表，再通过 IF 公式实现联动
					const map: Record<
						string,
						{ label: string; children: Array<IOption & { parentLabel: string }> }
					> = {};
					(options as IOptionCascade[]).forEach((opt, idx) => {
						if (!map[opt.parentValue]) {
							map[opt.parentValue] = { label: "", children: [] };
						}
						const parentInfo = parentOptions.find(po => po.value === opt.parentValue);
						if (parentInfo) {
							const parent = map[opt.parentValue];
							parent.label = parentInfo.label;
							parent.children.push({
								value: opt.value,
								label: opt.label,
								parentLabel: parentInfo.label,
							});
						}
					});
					const arr = [];
					for (const parentId in map) {
						const parent = map[parentId];
						const opts = parent.children;
						const hiddenColLetter = columnIndexToLetter(hiddenListColIndex);
						setValidationDataSource(hiddenWs, hiddenColLetter, opts);
						arr.push({
							value: `${parent.label}-${parentId}`,
							addr: `LISTS!$${hiddenColLetter}$2:$${hiddenColLetter}$${opts.length + 1}`,
						});
						hiddenListColIndex++;
					}
					console.log("arr", arr);
					for (let i = DATA_FIRST_ROW; i <= DATA_LAST_ROW; i++) {
						// 每一行都必须引用当前行的父列，否则会出现“斜向关联/错位关联”
						const ifFormula = generateIfFormula(parentColLetter, i, arr);
						ws.getCell(`${colLetter}${i}`).dataValidation = {
							type: "list",
							allowBlank: true,
							// formulae: [`=IF(${parentColLetter}${i}="nike",LISTS!$B$2:$B$2,IF(${parentColLetter}${i}="puma",LISTS!$C$2:$C$2,""))`],
							formulae: ["=" + ifFormula],
							// showDropDown: true,
						};
					}
				} else {
					const range = `LISTS!$${hiddenColLetter}$2:$${hiddenColLetter}$${options.length + 2}`;
					setValidationDataSource(hiddenWs, hiddenColLetter, options);
					hiddenListColIndex++;
					// wb.definedNames.add(range, `${col.key}`)
					for (let i = DATA_FIRST_ROW; i <= DATA_LAST_ROW; i++) {
						ws.getCell(`${colLetter}${i}`).dataValidation = {
							type: "list",
							allowBlank: true,
							// formulae: ['LISTS!$A$2:$A$3'], // 直接写死，绝对生效
							formulae: [range],
							// formulae: [wb.definedNames.getNames(col.key)],
							// showDropDown: true,
						};
					}
				}
			}
			colIndex++;
		});

		// 6. 启用工作表保护（锁定第一/二行生效）
		ws.protect("", {
			selectLockedCells: true,
			selectUnlockedCells: true,
		});

		const buffer = await wb.xlsx.writeBuffer();
		const filename = `进货单模板_${dayjs().format("YYYY-MM-DD")}.xlsx`;
		downloadFileByBuffer(buffer, filename);
		return Promise.resolve();
	} catch (error) {
		return Promise.reject(error);
	}
};

function bufferToU8(buffer: Uint8Array | ArrayBuffer): Uint8Array {
	return buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
}

/** 在二进制中查找 ASCII 子串（用于 ZIP 内路径名等） */
function u8IncludesAscii(haystack: Uint8Array, needle: string): boolean {
	const enc = new TextEncoder().encode(needle);
	if (enc.length === 0 || haystack.length < enc.length) return false;
	outer: for (let i = 0; i <= haystack.length - enc.length; i++) {
		for (let j = 0; j < enc.length; j++) {
			if (haystack[i + j] !== enc[j]) continue outer;
		}
		return true;
	}
	return false;
}

/** 根据魔数推断 MIME；OOXML 与纯 ZIP 通过包内路径粗判，无法区分时退回 octet-stream / zip。 */
export function guessMimeFromBuffer(buffer: Uint8Array | ArrayBuffer): string {
	const u8 = bufferToU8(buffer);
	if (u8.length < 4) return "application/octet-stream";

	const b0 = u8[0];
	const b1 = u8[1];
	const b2 = u8[2];
	const b3 = u8[3];

	if (b0 === 0x25 && b1 === 0x50 && b2 === 0x44 && b3 === 0x46) return "application/pdf";
	if (b0 === 0x89 && b1 === 0x50 && b2 === 0x4e && b3 === 0x47) return "image/png";
	if (b0 === 0xff && b1 === 0xd8 && b2 === 0xff) return "image/jpeg";
	if (b0 === 0x47 && b1 === 0x49 && b2 === 0x46 && b3 === 0x38) return "image/gif";
	if (
		u8.length >= 12 &&
		b0 === 0x52 &&
		b1 === 0x49 &&
		b2 === 0x46 &&
		b3 === 0x46 &&
		u8[8] === 0x57 &&
		u8[9] === 0x45 &&
		u8[10] === 0x42 &&
		u8[11] === 0x50
	) {
		return "image/webp";
	}

	// ZIP：Office OOXML 均为 ZIP，用包内路径粗判
	if (b0 === 0x50 && b1 === 0x4b) {
		const head = u8.subarray(0, Math.min(u8.length, 65536));
		if (u8IncludesAscii(head, "xl/workbook")) {
			return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
		}
		if (u8IncludesAscii(head, "word/document")) {
			return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
		}
		if (u8IncludesAscii(head, "ppt/slides")) {
			return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
		}
		return "application/zip";
	}

	return "application/octet-stream";
}

export const downloadFileByBuffer = (
	buffer: Uint8Array | ArrayBuffer,
	filename: string,
	mimeType?: string
) => {
	const type = mimeType ?? guessMimeFromBuffer(buffer);
	const blob = new Blob([buffer as BlobPart], {
		type,
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
};

export const generateExcel = async (
	isStockIn: boolean,
	optionsList: Record<OptionField, string[]>,
	titles: Array<{ label: string; field: string }>
) => {
	try {
		const wb = new Workbook();
		const ws = wb.addWorksheet("Sheet1");
		ws.getCell("A1").value = "";

		let productIndex = -1;
		let vendorIndex = -1;

		titles.forEach((title, index) => {
			if (title.field === "productId") {
				productIndex = index;
			} else if (title.field === "vendorId") {
				vendorIndex = index;
			}
			ws.getCell(String.fromCharCode(65 + index) + "1").value = title.label;
			ws.getCell(String.fromCharCode(65 + index) + "2").value = title.field;
		});
		console.log("----generateExcel 0----: ");
		Object.keys(optionsList).forEach(key => {
			console.log("key: ", key);
			const options = optionsList[key as OptionField];
			console.log("options: ", key, options);
			const dv: DataValidation = {
				type: "list",
				allowBlank: false,
				formulae: [`"${options.join(",")}"`],
				showErrorMessage: true,
				errorStyle: "error",
				errorTitle: "输入错误",
				error: "请从下拉列表中选择",
			};
			let code = "";
			if (key === "productId") {
				// productIndex = index;
				code = String.fromCharCode(65 + productIndex);
				(
					ws as typeof ws & {
						dataValidations: { add: (addr: string, v: DataValidation) => void };
					}
				).dataValidations.add(`${code}3:${code}1000`, dv);
			} else if (key === "vendorId") {
				code = String.fromCharCode(66 + productIndex);
				(
					ws as typeof ws & {
						dataValidations: { add: (addr: string, v: DataValidation) => void };
					}
				).dataValidations.add(`${code}3:${code}1000`, dv);
			}
		});
		// optionsList.forEach((option, index) => {
		// 	if (index === 0) {
		// 		ws.getCell("A3").value = "";

		// 	}
		// });

		// exceljs 运行时存在 dataValidations，但部分版本的 .d.ts 未声明
		// (
		// 	ws as typeof ws & {
		// 		dataValidations: { add: (addr: string, v: DataValidation) => void };
		// 	}
		// ).dataValidations.add("A1:A1", dv);

		const buffer = await wb.xlsx.writeBuffer();
		const blob = new Blob([buffer], {
			type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `进货单模板_${dayjs().format("YYYY-MM-DD")}.xlsx`;
		a.click();
		URL.revokeObjectURL(url);
		message.success("生成模板成功");
	} catch (error) {
		message.error((error as Error).message);
	}
};
