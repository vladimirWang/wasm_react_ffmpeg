import React, { useEffect, useMemo, useState } from "react";
import { Button, Flex, Input, Pagination, Space, Table, Tag } from "antd";
import { PlusCircleFilled, PlusCircleOutlined, SearchOutlined } from "@ant-design/icons";
import type { TableProps } from "antd";
import { IProduct, IProductQueryParams, getProducts } from "../api/product";
import useSWR from "swr";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getVendors, IVendor, IVendorQueryParams } from "../api/vendor";

const columns: TableProps<IVendor>["columns"] = [
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
	const [queryParams, setQueryParams] = useState<IVendorQueryParams>({
		page: 1,
		limit: 20,
		name: "",
	});

	const swrKey = useMemo(
		() => ["vendors", queryParams.page, queryParams.limit, queryParams.name ?? ""] as const,
		[queryParams.page, queryParams.limit, queryParams.name]
	);

	// 2. 定义SWR的fetcher函数：接收参数，调用getProducts
	const fetcher = async ([_tag, page, limit, name]: typeof swrKey) => {
		const res = await getVendors({
			page,
			limit,
			name: name === "" ? undefined : name,
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

	return (
		<div className="py-2 px-3">
			<section className="flex gap-5">
				<Input
					placeholder="Basic usage"
					value={keyword}
					onInput={e => setKeyword(e.currentTarget.value)}
					allowClear
				/>
				<Button
					icon={<SearchOutlined />}
					onClick={() => {
						setQueryParams({
							name: keyword,
							page: 1,
							limit: 20,
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
			<section className="flex justify-end">
				<Pagination
					total={products?.data.total}
					showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
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
		</div>
	);
};

export default Vendors;
