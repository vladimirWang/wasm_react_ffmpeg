import _ from "lodash";

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
