import React, { useEffect, useMemo, useState } from "react";
import { Button, Input, Modal, Pagination, Space, Table } from "antd";
import { PlusCircleOutlined, SearchOutlined } from "@ant-design/icons";
import type { TableProps } from "antd";
import useSWR from "swr";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { batchDeleteVendor, getVendors, IVendor, IVendorQueryParams } from "../api/vendor";
import { GlobalModal } from "../components/GlobalModal";
import DateQuery, { DateQueryValue } from "../components/DateQuery";
import dayjs from "dayjs";

const columns: TableProps<IVendor>["columns"] = [
	{},
	{
		title: "名称",
		dataIndex: "name",
		key: "name",
	},
	// {
	//   title: 'cost',
	//   dataIndex: 'cost',
	//   key: 'cost',
	// },
	// {
	//   title: 'balance',
	//   dataIndex: 'balance',
	//   key: 'balance',
	// },
	// {
	//   title: 'price',
	//   key: 'price',
	//   dataIndex: 'price',
	// },
	{
		title: "操作",
		key: "action",
		dataIndex: "action",
		render: (_, record) => (
			<Space size="middle">
				<Link to={`/vendor/${record.id}`}>编辑</Link>
				{/* <Link to={`/product/${record.id}`}>查看</Link> */}
			</Space>
		),
	},
];

const Vendors: React.FC = () => {
	const navigate = useNavigate();
	const [deletedAtQuery, setDeletedAtQuery] = useState<DateQueryValue>({
		enabled: false,
		date: null,
	});
	const [queryParams, setQueryParams] = useState<IVendorQueryParams>({
		page: 1,
		limit: 20,
		name: "",
		deletedAt: false,
	});

	const swrKey = useMemo(
		() =>
			[
				"vendors",
				queryParams.page,
				queryParams.limit,
				queryParams.name ?? "",
				queryParams.deletedAt,
			] as const,
		[queryParams.page, queryParams.limit, queryParams.name, queryParams.deletedAt]
	);

	// 2. 定义SWR的fetcher函数：接收参数，调用getProducts
	const fetcher = async ([_tag, page, limit, name, deletedAt]: typeof swrKey) => {
		const res = await getVendors({
			page,
			limit,
			name: name === "" ? undefined : name,
			deletedAt: deletedAt,
		});
		return res; // 若你的getProducts返回的是响应体（如res.data），则这里取res.data
	};

	const {
		data: products, // 接口返回的产品列表数据
		error, // 请求错误信息
		isLoading, // 加载状态
		mutate,
	} = useSWR(
		swrKey, // SWR的key：参数变化则重新请求
		fetcher,
		{
			// 可选配置：比如页面聚焦时重新验证、禁用自动重试等
			revalidateOnFocus: false,
			dedupingInterval: 0,
		}
	);

	const location = useLocation();
	useEffect(() => {
		mutate();
	}, [location.key, mutate]);

	// const [products, setProducts] = React.useState<IProduct[]>(data);

	// const loadProducts = async () => {
	//   // const res = await fetch('/api/product?limit=10&page=1&name=');
	//   // const json = await res.json();
	//   // setProducts(json.data.list);
	//   const res = await getProducts({ limit: 10, page: 1, name: '' });
	//   setProducts(res.data.list);
	// }
	// useEffect(() => {
	//   // loadProducts()
	// }, [])
	const [keyword, setKeyword] = useState<string>(queryParams.name || "");
	const [page, setPage] = useState(queryParams.page);

	const [selectedIds, setSelectedIds] = useState<number[]>([]);

	const rowSelection: TableProps<IVendor>["rowSelection"] = {
		onChange: (selectedRowKeys: React.Key[], _selectedRows: IVendor[]) => {
			setSelectedIds(selectedRowKeys as number[]);
		},
		getCheckboxProps: (record: IVendor) => ({
			disabled: record.name === "Disabled User", // Column configuration not to be checked
			name: record.name,
		}),
	};
	const [modal, contextHolder] = Modal.useModal();
	const config = {
		title: "警告!",
		content: <>确认要删除供应商吗?</>,
	};
	const handleBatchDelete = async () => {
		const confirmed = await modal.confirm(config);
		console.log("confirmed: ", confirmed);
		if (!confirmed) return;
		try {
			const res = await batchDeleteVendor({ id: selectedIds });
			mutate();
			GlobalModal.open({
				type: "success",
				title: res.message,
			});
		} catch (e) {
			GlobalModal.open({
				type: "error",
				title: (e as Error).message,
			});
		}
	};

	return (
		<div className="py-2 px-3">
			<section className="flex gap-5 mb-5">
				<Input
					placeholder="Basic usage"
					value={keyword}
					onInput={e => setKeyword(e.currentTarget.value)}
					allowClear
				/>
				{/* <Switch checkedChildren="不查已删除" unCheckedChildren="查已删除"></Switch> */}
				{/* <Select
					style={{ width: 100 }}
					value={includeDeleted}
					onChange={val => {
						setIncludeDeleted(val);
					}}
					options={[
						{ value: 1, label: "是" },
						{ value: 0, label: "否" },
					]}
				></Select> */}
				<DateQuery value={deletedAtQuery} onChange={setDeletedAtQuery} />
				<Button
					icon={<SearchOutlined />}
					onClick={() => {
						let deletedAt: boolean | Date = false;
						if (deletedAtQuery.enabled) {
							if (deletedAtQuery.date) {
								deletedAt = deletedAtQuery.date.toDate();
							} else {
								deletedAt = true;
							}
						}
						setQueryParams({
							name: keyword,
							page: 1,
							limit: 20,
							deletedAt,
						});
					}}
				></Button>
				<Button
					onClick={() => {
						navigate("/vendor/create");
					}}
					icon={<PlusCircleOutlined />}
				></Button>
			</section>
			{error && <div>Error loading products.</div>}
			<Table<IVendor>
				size="small"
				rowSelection={{ type: "checkbox", ...rowSelection }}
				columns={columns}
				dataSource={products?.data.list}
				rowKey={"id"}
				loading={isLoading}
				pagination={false}
				onRow={record => ({
					onClick: () => {
						console.log("row clicked", record);
					},
				})}
			/>
			<br />
			<section>
				<Button size="small" onClick={handleBatchDelete} disabled={selectedIds.length === 0}>
					删除
				</Button>
			</section>
			<section className="flex justify-end">
				<Pagination
					total={products?.data.total}
					showTotal={(total, range) => `${range[0]}-${range[1]} / ${total} 条`}
					defaultPageSize={20}
					defaultCurrent={page}
					onChange={page => {
						setPage(page);
						setQueryParams({
							...queryParams,
							page,
						});
					}}
				/>
			</section>
			{contextHolder}
		</div>
	);
};

export default Vendors;
