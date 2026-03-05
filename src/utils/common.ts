import _ from "lodash";
import dayjs from "dayjs";
import type { DatePickerProps } from "antd";
import SparkMD5 from "spark-md5";

/**
 * 将 Excel 日期序列号转为 JS Date（情况 A：解析得到的是数字）。
 * - Excel 以 1900-01-01 为第 1 天；序列号 = 从该日起的天数。
 * - Excel 误把 1900 当作闰年，序列号 >= 60 时需减 1 天以对齐真实日历。
 * @param serial Excel 日期序列号（有效范围 1 ~ 2958465，约到公元 9999 年）
 * @returns 对应的 Date
 * @throws 当 serial 非数字、非有限、或超出 [1, 2958465] 时抛出 Error
 */
export function excelSerialToDate(serial: number): Date {
	// 2958465 约 8100 天对应的年数，超过视为非法序列号
	if (typeof serial !== "number" || !Number.isFinite(serial) || serial < 1 || serial > 2958465) {
		throw new Error(`excelSerialToDate: 无效的 Excel 日期序列号 ${serial}，有效范围为 1 ~ 2958465`);
	}
	let s = Math.floor(serial);
	if (s >= 60) s -= 1; // Excel 1900 闰年 bug
	const base = new Date(1900, 0, 1);
	const oneDay = 86400000;
	return new Date(base.getTime() + (s - 1) * oneDay);
}

/** 1900-01-01 00:00:00（本地时区）的时间戳（毫秒） */
const MS_EPOCH_1900 = new Date(1900, 0, 1).getTime();

/** 一天的毫秒数 */
const ONE_DAY_MS = 86400000;

/**
 * 将正常日期转为“自 1900-01-01 以来的第几天”（与 excelSerialToDate 互为逆运算）。
 * - 第 1 天 = 1900-01-01，第 2 天 = 1900-01-02，依此类推。
 * - 采用与 Excel 一致的 1900 闰年约定：1900-02-28 视作第 60 天。
 * @param date 日期对象
 * @returns 第几天（正整数），早于 1900-01-01 时可能 ≤ 0
 */
export function dateToMsSince1900(date: Date): number {
	const dayCount = Math.floor((date.getTime() - MS_EPOCH_1900) / ONE_DAY_MS);

	// Excel 错误地把 1900 当成闰年，多算了一个不存在的 1900-02-29
	// 与 excelSerialToDate 逆运算：第 58 天（1900-02-28）对应 Excel 序列 60
	return dayCount >= 58 ? dayCount + 2 : dayCount + 1;
}

export function sleep(ms: number = 2000) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

interface changedFields<T> {
	created: Array<keyof T>;
	updated: Array<keyof T>;
	deleted: Array<keyof T>;
	same: Array<keyof T>;
}
// TODO: 支持深层比较
export function pickIncrementalFields<T extends {}>(newData: T, oldData: T): changedFields<T> {
	const newKeys = Object.keys(newData) as Array<keyof T>,
		oldKeys = Object.keys(oldData) as Array<keyof T>;
	const created: Array<keyof T> = _.difference(newKeys, oldKeys);
	const deleted = _.difference(oldKeys, newKeys);

	const updated: Array<keyof T> = [];
	const same: Array<keyof T> = [];

	const commonKeys = _.intersection(newKeys, oldKeys);

	// 4. 遍历公共字段，判断值是否变化，分类收集
	commonKeys.forEach(key => {
		const newValue = newData[key];
		const oldValue = oldData[key];

		// 用 _.isEqual 深比较（支持嵌套对象/数组），判断值是否相等
		if (_.isEqual(newValue, oldValue)) {
			// 值相等：放入未变字段 same
			same.push(key);
		} else {
			// 值不相等：放入更新字段 updated
			updated.push(key);
		}
	});

	return {
		created,
		updated,
		deleted,
		same,
	};
}

/**
 * 对「返回 Promise 的任务」做串行执行，上一个 resolve 后再执行下一个。
 * @param tasks 无参且返回 Promise 的函数数组
 * @returns 按顺序收集每个任务结果的 Promise
 */
export function composePromise<T = any>(...tasks: Array<() => Promise<T>>): Promise<T[]> {
	if (tasks.length === 0) return Promise.resolve([]);
	return tasks.reduce(
		(acc, task) => acc.then(results => task().then(r => [...results, r])),
		Promise.resolve([] as T[])
	);
}

// 定义任务执行结果的类型，清晰区分成功/失败
type TaskResult<T = any> = {
	/** 任务是否执行成功 */
	success: boolean;
	/** 成功时的返回值（仅success=true时有值） */
	data?: T;
	/** 失败时的错误信息（仅success=false时有值） */
	error?: Error;
};

/**
 * 串行执行异步任务列表
 * 特性：前一个任务失败（reject），仍会执行下一个任务；全程串行，按顺序执行
 * @param tasks 异步任务列表（每个元素是返回Promise的函数）
 * @returns 所有任务的执行结果（按执行顺序排列，包含成功/失败状态）
 */
export function composePromise2<T = any>(
	...tasks: Array<() => Promise<T>>
): Promise<TaskResult<T>[]> {
	// 空任务直接返回空数组
	if (tasks.length === 0) return Promise.resolve([]);

	// 用async/await实现串行执行，每个任务单独捕获错误
	return (async () => {
		const results: TaskResult<T>[] = [];

		// 遍历所有任务，逐个执行
		for (const task of tasks) {
			try {
				// 执行当前任务，等待完成（串行核心）
				const data = await task();
				// 收集成功结果
				results.push({ success: true, data });
			} catch (err) {
				// 捕获当前任务的错误，不中断循环，继续执行下一个
				const error = err instanceof Error ? err : new Error(String(err));
				results.push({ success: false, error });
			}
		}

		// 返回所有任务的结果（无论成功/失败）
		return results;
	})();
}

// 参数对象转SearchParams对象
export function paramsToSearchParams(
	params: Record<string, string | number | boolean | undefined | Date>
) {
	// return new URLSearchParams(params).toString();
	const searchParams = new URLSearchParams();

	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value.toString() !== "") {
			searchParams.set(key, encodeURIComponent(value.toString()));
		}
	}
	return searchParams;
}

export function getTrueType(obj: any): string {
	return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
}

// 禁用未来日期
export function disabledFuture(current: Dayjs): boolean {
	return current && current > dayjs().endOf("day");
}

/**
 * 计算数组的位掩码（标记数组中出现的数字）
 * @param {number[]} arr - 数字数组
 * @returns {number} 位掩码（若数组自身有重复，返回 -1）
 */
export function getBitMask<T>(arr: T[], extractor: (item: T) => number): number {
	let mask = 0;
	for (const item of arr) {
		const num = extractor(item);
		// 先检查当前数字是否已在数组内重复（比如 [1,1,2] 这种情况）
		if (mask & (1 << num)) {
			return -1; // 自身有重复，标记为无效
		}
		mask |= 1 << num; // 标记该数字的位为 1
	}
	return mask;
}

/**
 * 按「无重复元素」规则分组二维数组（位运算优化）
 * @param {number[][]} source - 原始二维数组
 * @returns {number[][][]} 分组后的三维数组
 */
interface IUniqueGroup<T> {
	mask: number;
	items: T[];
}
export function groupByUniqueElements<T>(source: T[][], extractor: (item: T) => number): T[][][] {
	// 存储分组：每个元素是 { mask: 分组总掩码, items: 分组内的子数组 }
	const groups: IUniqueGroup<T>[] = [];

	for (const subArr of source) {
		// 1. 计算当前子数组的位掩码（先排除自身有重复的子数组）
		const subMask = getBitMask<T>(subArr, extractor);
		console.log("----subMask----: ", subArr, subMask);
		if (subMask === -1) {
			console.warn(`子数组 [${subArr}] 自身包含重复元素，跳过`);
			continue;
		}

		// 2. 找第一个能加入的分组（分组总掩码和子数组掩码无交集）
		let foundGroup = false;
		for (const group of groups) {
			if ((group.mask & subMask) === 0) {
				// 无重复，加入该分组并更新分组总掩码
				group.items.push(subArr);
				console.log("----group.mask before----: ", group.mask, subMask);
				// group.mask |= subMask;
				group.mask = (group.mask !== undefined ? group.mask : 0) | subMask;
				console.log("----group.mask after----: ", group.mask);
				foundGroup = true;
				break;
			}
		}

		// 3. 没有可加入的分组，新建分组
		if (!foundGroup) {
			groups.push({
				mask: subMask,
				items: [subArr],
			});
		}
	}

	// 4. 提取分组的 items 作为最终结果（去掉 mask 字段）
	return groups.map(group => group.items);
}

function createHash(chunks: Blob[]): string {
	return new Promise(resolve => {
		const spark = new SparkMD5();
		function _read(index: number) {
			if (index >= chunks.length) {
				resolve(spark.end());
				return;
			}
			const chunk = chunks[index];
			const reader = new FileReader();
			reader.readAsArrayBuffer(chunk);
			reader.onload = () => {
				const bytes = reader.result as ArrayBuffer;
				spark.append(bytes);
				_read(index + 1);
			};
		}
		_read(0);
	});
}
