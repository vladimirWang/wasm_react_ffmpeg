import { TreeSelect } from "antd";
import type { TreeDataNode } from "antd";
import React, { useEffect, useState } from "react";
import { getVendors } from "../api/vendor";
import { getProductsByVendorId } from "../api/product";

const mockTreeData = [
	{
		value: "parent 1",
		title: "parent 1",
		children: [
			{
				value: "parent 1-0",
				title: "parent 1-0",
				children: [
					{
						value: "leaf1",
						title: "leaf1",
					},
					{
						value: "leaf2",
						title: "leaf2",
					},
				],
			},
			{
				value: "parent 1-1",
				title: "parent 1-1",
				children: [
					{
						value: "leaf11",
						title: <b style={{ color: "#08c" }}>leaf11</b>,
					},
				],
			},
		],
	},
];

interface VendorProductProps {
	onChange: (vendorId: number, productId: number) => void;
}
export default function VendorProductTree(props: VendorProductProps) {
	const [treeData, setTreeData] = useState<any[]>([]);
	const [value, setValue] = useState();

	const loadVendors = async () => {
		try {
			// setTreeData(mockTreeData);
			const result = await getVendors({ pagination: false });
			const vendors: any[] = result.list.map(item => ({
				value: item.id,
				title: item.name,
				// children: [],
			}));
			for (const vendor of vendors) {
				const mockChild = {
					value: vendor.name + "-child",
					title: vendor.name + "-child",
				};
				vendor.children = [mockChild];
				// const productsRes = await getProductsByVendorId(vendor.value as number);
				// if (productsRes.code === 200) {
				// 	vendor.children = productsRes.data.list.map(item2 => ({
				// 		value: item2.id,
				// 		title: item2.name,
				// 	}));
				// }
				// vendor.children = products.map(item => ({}))
			}
			setTreeData(vendors);
		} catch (e) {
			// alert("VendorProductTree加载异常: " + (e as Error).message);
		}
	};
	useEffect(() => {
		loadVendors();
	}, []);
	return (
		<div>
			<TreeSelect
				showSearch
				style={{ width: "100%" }}
				value={value}
				styles={{
					popup: {
						root: { maxHeight: 400, overflow: "auto" },
					},
				}}
				placeholder="Please select"
				allowClear
				treeDefaultExpandAll
				onChange={value => {
					console.log("on change: ", value);
					props.onChange(1, 2);
				}}
				treeData={treeData}
			/>
		</div>
	);
}
