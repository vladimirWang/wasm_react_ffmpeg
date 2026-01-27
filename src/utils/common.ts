import _ from "lodash";

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

export function composePromise<T = any>(...fns: Promise<T>[]) {
	const last = fns.shift();
	// console.log(last);
	return (...args) => {
		return fns.reduce(
			(a, c) => {
				return a.then(result => {
					// console.log(result, c);
					return c(result);
				});
			},
			Promise.resolve(last(...args))
		);
	};
}
