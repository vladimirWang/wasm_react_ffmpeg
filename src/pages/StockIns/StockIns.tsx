import React, { useState } from "react";
import { Button, Input, Pagination, Space, Table } from "antd";
import {
	PlusCircleOutlined,
	SearchOutlined,
} from "@ant-design/icons";
import type { TableProps } from "antd";
import { IProductQueryParams } from "../../api/product";
import { getStockIns, IStockIn } from "../../api/stockIn";
import useSWR from "swr";
import { Link, useNavigate } from "react-router-dom";
import StockInUploadModal from "./StockInUploadModal";

const columns: TableProps<IStockIn>["columns"] = [
	// {
	// 	title: "name",
	// 	dataIndex: "name",
	// 	key: "name",
	// },
	{
		title: "订单总金额",
		dataIndex: "totalCost",
		key: "totalCost",
	},
	{
		title: "操作",
		key: "action",
		dataIndex: "action",
		render: (_, record) => (
			<Space size="middle">
				<Link to={`/stockin/${record.id}`}>编辑</Link>
				{/* <Link to={`/stockin/${record.id}`}>查看</Link> */}
			</Space>
		),
	},
];

const StockIns: React.FC = () => {
	const [fileUploadModalOpen, setFileUploadModalOpen] = useState(false);
	const navigate = useNavigate();
	const [queryParams, setQueryParams] = useState<IProductQueryParams>({
		page: 1,
		limit: 20,
		name: "",
	});
	// 2. 定义SWR的fetcher函数：接收参数，调用getStockIns
	const fetcher = async (_params: IProductQueryParams) => {
		const res = await getStockIns();
		if (res.code !== 200) {
			return {
				data: {
					list: [],
					total: 0,
				},
			};
		}
		return res; // 若你的getProducts返回的是响应体（如res.data），则这里取res.data
	};

	const {
		data: stockIns, // 接口返回的产品列表数据
		error, // 请求错误信息
		isLoading, // 加载状态
		mutate, // 用于手动刷新数据
	} = useSWR(
		queryParams, // SWR的key：参数变化则重新请求
		fetcher,
		{
			// 可选配置：比如页面聚焦时重新验证、禁用自动重试等
			revalidateOnFocus: false,
		}
	);

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
					icon={<PlusCircleOutlined />}
					onClick={() => {
						navigate("/stockin/create");
					}}
				>
					新增
				</Button>
				<Button
					onClick={() => {
						setFileUploadModalOpen(true);
					}}
				>
					通过文件批量导入
				</Button>
			</section>
			{error && <div>Error loading products.</div>}
			<Table<IStockIn>
				size="small"
				columns={columns}
				dataSource={stockIns?.data.list}
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
					total={stockIns?.data.total}
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
			<StockInUploadModal
				open={fileUploadModalOpen}
				onCancel={() => setFileUploadModalOpen(false)}
				onSuccess={() => {
					mutate();
					setFileUploadModalOpen(false);
				}}
			/>
		</div>
	);
};

export default StockIns;
