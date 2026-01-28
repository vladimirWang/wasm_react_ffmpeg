import { InputNumber } from "antd";
import type { GetProps } from "antd";

type InputNumberProps = GetProps<typeof InputNumber>;

export function PositiveInputNumber(props: InputNumberProps) {
	return (
		<InputNumber
			min={0}
			max={999}
			controls={false}
			precision={0}
			placeholder="请输入数量"
			{...props}
		/>
	);
}
