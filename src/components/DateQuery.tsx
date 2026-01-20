import { DatePicker, Switch } from "antd";
import type { Dayjs } from "dayjs";
import { useCallback, useMemo, useState } from "react";

export type DateQueryValue = {
	enabled: boolean;
	date: Dayjs | null;
};

export type DateQueryProps = {
	/** antd Form 受控值 */
	value?: DateQueryValue;
	/** 独立使用的默认值 */
	defaultValue?: DateQueryValue;
	onChange?: (next: DateQueryValue) => void;
	disabled?: boolean;
	className?: string;
};

const DEFAULT_VALUE: DateQueryValue = { enabled: false, date: null };

export default function DateQuery(props: DateQueryProps) {
	const { value, defaultValue, onChange, disabled, className } = props;

	const isControlled = value !== undefined;
	const [innerValue, setInnerValue] = useState<DateQueryValue>(defaultValue ?? DEFAULT_VALUE);
	const mergedValue = useMemo(() => (isControlled ? value! : innerValue), [innerValue, isControlled, value]);

	const emitChange = useCallback(
		(next: DateQueryValue) => {
			if (!isControlled) setInnerValue(next);
			onChange?.(next);
		},
		[isControlled, onChange]
	);

	const handleEnabledChange = useCallback(
		(nextEnabled: boolean) => {
			emitChange({
				enabled: nextEnabled,
				// 关闭时顺便清空日期，避免出现“未开启但仍有 date”的脏状态
				date: nextEnabled ? mergedValue.date : null,
			});
		},
		[emitChange, mergedValue.date]
	);

	const handleDateChange = useCallback(
		(nextDate: Dayjs | null) => {
			emitChange({ enabled: mergedValue.enabled, date: nextDate });
		},
		[emitChange, mergedValue.enabled]
	);

	return (
		<section className={["w-[300px] flex gap-4 items-center", className].filter(Boolean).join(" ")}>
			<Switch checked={mergedValue.enabled} onChange={handleEnabledChange} disabled={disabled} />
			<DatePicker
				disabled={disabled || !mergedValue.enabled}
				value={mergedValue.date}
				onChange={handleDateChange}
				allowClear
			/>
		</section>
	);
}
