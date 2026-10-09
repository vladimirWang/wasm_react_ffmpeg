import { useMemo, useState } from "react";
import { AutoComplete, Button, Card, Space, Tag, message } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { v4 as uuidv4 } from "uuid";

export type AttrSpecValue = {
	// 已存在的属性 id;新建的规格值无 id,提交时再落库
	id?: number;
	name: string;
};

export type AttrSpecGroup = {
	// 本地分组 key,仅用于 React 渲染
	key: string;
	// 已有分类 id;新分类无 id,提交时再落库
	categoryId?: number;
	categoryName: string;
	values: AttrSpecValue[];
};

export type AttrSpecEditorProps = {
	value?: AttrSpecGroup[];
	onChange?: (next: AttrSpecGroup[]) => void;
	disabled?: boolean;
	// 已有分类候选(用于选择/输入已有分类时自动关联 id)
	categoryOptions: { value: number; label: string }[];
	// 已有属性池(用于添加规格值时按分类+名称自动关联 id,避免重复创建)
	attrPool: { id: number; name: string; attrCategoryId: number }[];
};

export default function AttrSpecEditor({
	value,
	onChange,
	disabled,
	categoryOptions,
	attrPool,
}: AttrSpecEditorProps) {
	const groups = value ?? [];
	// 每组内新增规格值的临时输入
	const [valueInputs, setValueInputs] = useState<Record<string, string>>({});

	const categoryNameToId = useMemo(
		() => new Map(categoryOptions.map(c => [c.label, c.value])),
		[categoryOptions]
	);

	const usedCategoryIds = useMemo(
		() =>
			new Set(
				groups
					.map(g => g.categoryId)
					.filter((id): id is number => id !== undefined)
			),
		[groups]
	);

	const hasAvailableCategory = useMemo(
		() => {
			return true;
			// if (categoryOptions.length === 0) return true
			// console.log("categoryOptions: ", categoryOptions)
			// console.log("usedCategoryIds: ", usedCategoryIds)
			// return categoryOptions.some(c => !usedCategoryIds.has(c.value))
		},
		[categoryOptions, usedCategoryIds]
	);

	const emit = (next: AttrSpecGroup[]) => onChange?.(next);

	const handleAddGroup = () => {
		emit([...groups, { key: uuidv4(), categoryName: "", values: [] }]);
	};

	const handleRemoveGroup = (key: string) => {
		emit(groups.filter(g => g.key !== key));
		setValueInputs(prev => {
			const next = { ...prev };
			delete next[key];
			return next;
		});
	};

	// 规格分类:支持从已有中选择,也可输入新分类名
	const handleChangeCategory = (key: string, name: string) => {
		emit(
			groups.map(g => {
				if (g.key !== key) return g;
				const existingId = categoryNameToId.get(name);
				return { ...g, categoryName: name, categoryId: existingId };
			})
		);
	};

	const handleAddValue = (key: string, explicitVal?: string) => {
		const inputVal = (explicitVal ?? valueInputs[key])?.trim();
		if (!inputVal) return;

		const group = groups.find(g => g.key === key);
		if (!group) return;
		// 未填写规格分类时不允许添加规格值
		if (!group.categoryName.trim()) {
			message.warning("请先填写规格分类");
			return;
		}
		if (group.values.some(v => v.name === inputVal)) {
			message.warning("规格值不能重复");
			return;
		}

		// 若当前分类下已存在同名属性,自动关联其 id,避免提交时重复创建
		const existing = group.categoryId
			? attrPool.find(s => s.attrCategoryId === group.categoryId && s.name === inputVal)
			: undefined;

		emit(
			groups.map(g =>
				g.key === key
					? { ...g, values: [...g.values, { id: existing?.id, name: inputVal }] }
					: g
			)
		);
		setValueInputs(prev => ({ ...prev, [key]: "" }));
	};

	const handleRemoveValue = (key: string, name: string) => {
		emit(
			groups.map(g =>
				g.key === key ? { ...g, values: g.values.filter(v => v.name !== name) } : g
			)
		);
	};

	return (
		<div>
			<div className="flex justify-end pb-2">
				{!disabled && (
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={handleAddGroup}
						disabled={!hasAvailableCategory}
					>
						添加规格组
					</Button>
				)}
			</div>

			{groups.map(group => (
				<Card
					size="small"
					key={group.key}
					style={{ marginBottom: 16, border: "#dcdcdc solid 1px" }}
					extra={
						!disabled && (
							<Button
								danger
								size="small"
								icon={<DeleteOutlined />}
								onClick={() => handleRemoveGroup(group.key)}
							>
								删除本组
							</Button>
						)
					}
				>
					<Space direction="vertical" style={{ width: "100%" }}>
						<div style={{ display: "flex", gap: 12, alignItems: "center" }}>
							<span style={{ whiteSpace: "nowrap" }}>规格分类:</span>
							<AutoComplete
								style={{ flex: 1 }}
								placeholder="选择或输入规格分类,如 color、size"
								value={group.categoryName || undefined}
								options={categoryOptions
									.filter(
										c =>
											!groups.some(
												g =>
													g.key !== group.key &&
													(g.categoryId === c.value || g.categoryName === c.label)
											)
									)
									.map(c => ({ value: c.label }))}
								onChange={v => handleChangeCategory(group.key, v)}
								disabled={disabled}
								allowClear
								filterOption={(input, option) =>
									(option?.value ?? "").toLowerCase().includes(input.toLowerCase())
								}
							/>
						</div>

						<div>
							<div style={{ marginBottom: 8 }}>规格值:</div>
							<Space wrap>
								{group.values.map(v => (
									<Tag
										key={v.name}
										closable={!disabled}
										onClose={() => handleRemoveValue(group.key, v.name)}
									>
										{v.name}
									</Tag>
								))}
								{group.values.length === 0 && (
									<span style={{ color: "#999" }}>暂无规格值</span>
								)}
							</Space>
						</div>
						{!disabled && (
						<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
							{(() => {
								// 新分类仅有名称（无 id）也合法;只要分类名为空就禁止填规格值
								const hasCategory = group.categoryName.trim().length > 0;
								return (
									<>
										<AutoComplete
											style={{ flex: 1 }}
											disabled={!hasCategory}
											placeholder={
												!hasCategory
													? "请先填写规格分类"
													: group.categoryId
														? "选择已有规格值,或输入新名称"
														: "输入规格值,如 red、S"
											}
											value={valueInputs[group.key] ?? ""}
											options={
												group.categoryId
													? attrPool
															.filter(s => s.attrCategoryId === group.categoryId)
															.filter(s => !group.values.some(v => v.name === s.name))
															.map(s => ({ value: s.name }))
													: []
											}
											onChange={v =>
												setValueInputs(prev => ({ ...prev, [group.key]: v }))
											}
											onSelect={v => handleAddValue(group.key, v)}
											onKeyDown={e => {
												if (e.key === "Enter" && hasCategory) handleAddValue(group.key);
											}}
											filterOption={(input, option) =>
												(option?.value ?? "").toLowerCase().includes(input.toLowerCase())
											}
										/>
										<Button
											icon={<PlusOutlined />}
											disabled={!hasCategory}
											onClick={() => handleAddValue(group.key)}
										>
											添加规格值
										</Button>
									</>
								);
							})()}
						</div>
					)}
					</Space>
				</Card>
			))}

			{groups.length === 0 && (
				<div
					style={{
						padding: 24,
						textAlign: "center",
						background: "#f7f7f7",
						marginBottom: 16,
					}}
				>
					暂无规格组{!disabled && ",请点击上方【添加规格组】按钮"}
				</div>
			)}
		</div>
	);
}
