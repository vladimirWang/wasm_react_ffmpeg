import { type ReactNode, useState } from "react";
import { Button, Divider, Input, Select, Space, Tooltip, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";

export interface MultiCreateOption {
	value: number;
	label: string;
	// SKU 场景下记录所属分类，供外部联动使用
	skuCategoryId?: number;
	[key: string]: unknown;
}

interface MultiCreateSelectProps {
	value?: number[];
	onChange?: (value: number[]) => void;
	options: MultiCreateOption[];
	placeholder?: string;
	disabled?: boolean;
	addPlaceholder?: string;
	addButtonText?: string;
	/** 新增行内、名称输入框之前的前置内容（如 SKU 的「所属分类」下拉） */
	addBefore?: ReactNode;
	/** 禁止新增（如尚未选择 SKU 分类） */
	addDisabled?: boolean;
	addDisabledTip?: string;
	/** 执行新增，成功后自动选中新项并清空输入框 */
	onAdd: (name: string) => Promise<MultiCreateOption>;
}

/**
 * 图一（multiple：标签 + 下拉勾选）与图二（dropdown 底部输入框 + Add item）结合的多选控件
 */
export default function MultiCreateSelect({
	value,
	onChange,
	options,
	placeholder,
	disabled,
	addPlaceholder = "请输入名称",
	addButtonText = "新增",
	addBefore,
	addDisabled = false,
	addDisabledTip,
	onAdd,
}: MultiCreateSelectProps) {
	const [inputValue, setInputValue] = useState("");
	const [adding, setAdding] = useState(false);

	const name = inputValue.trim();
	const canAdd = name.length > 0 && !adding && !addDisabled && !disabled;

	const handleAdd = async () => {
		if (!canAdd) return;
		if (options.some(o => o.label === name)) {
			message.warning("选项已存在");
			return;
		}
		setAdding(true);
		try {
			const option = await onAdd(name);
			onChange?.(Array.from(new Set([...(value ?? []), option.value])));
			setInputValue("");
		} finally {
			setAdding(false);
		}
	};

	return (
		<Select
			mode="multiple"
			value={value}
			onChange={onChange}
			placeholder={placeholder}
			options={options}
			showSearch
			optionFilterProp="label"
			disabled={disabled}
			style={{ width: "100%" }}
			popupRender={menu => (
				<>
					{menu}
					<Divider style={{ margin: "8px 0" }} />
					{/* 注意：这里不能在 mousedown 上 preventDefault，否则内部 Input 无法聚焦输入；
					    弹层内点击不关闭下拉已由 rc-select 自身保证（onRootMouseDown → triggerOpen） */}
					<div style={{ padding: "0 8px 4px" }}>
						<Space.Compact style={{ width: "100%" }}>
							{addBefore}
							<Input
								placeholder={addPlaceholder}
								value={inputValue}
								disabled={disabled || addDisabled}
								onChange={e => setInputValue(e.target.value)}
								onKeyDown={e => e.stopPropagation()}
								onPressEnter={handleAdd}
							/>
							<Tooltip title={addDisabled ? addDisabledTip : undefined}>
								<Button
									type="text"
									icon={<PlusOutlined />}
									loading={adding}
									disabled={!canAdd}
									onClick={handleAdd}
								>
									{addButtonText}
								</Button>
							</Tooltip>
						</Space.Compact>
					</div>
				</>
			)}
		/>
	);
}
