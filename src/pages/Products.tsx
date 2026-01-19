import React, { use, useEffect, useState } from "react";
import { Alert, Button, Flex, Input, Modal, Pagination, Space, Table, Tag } from "antd";
import { PlusCircleOutlined, SearchOutlined } from "@ant-design/icons";
import type { TableProps } from "antd";
import { IProduct, IProductQueryParams, getProducts } from "../api/product";
import useSWR from "swr";
import { Link, useNavigate } from "react-router-dom";
import mockBarcode from "../assets/barcode.jpg";
import { GlobalModal } from "../components/GlobalModal";

const Products: React.FC = () => {
	const [isModalOpen, setIsModalOpen] = useState(false);

	const showModal = () => {
		setIsModalOpen(true);
	};

	const handleOk = () => {
		setIsModalOpen(false);
	};

	const handleCancel = () => {
		setIsModalOpen(false);
	};
	const columns: TableProps<IProduct>["columns"] = [
		{
			title: "名称",
			dataIndex: "name",
			key: "name",
		},
		{
			title: "最新售价",
			key: "latestPrice",
			dataIndex: "latestPrice",
		},
		{
			title: "最新成本价",
			dataIndex: "latestCost",
			key: "latestCost",
		},
		{
			title: "库存数",
			dataIndex: "balance",
			key: "balance",
		},
		{
			title: "产品编码",
			dataIndex: "productCode",
			key: "productCode",
			onCell: (record, rowIndex) => {
				return {
					onClick() {
						console.log("click： ", record, rowIndex);
						showModal();
					},
				};
			},
		},
		{
			title: "操作",
			key: "action",
			dataIndex: "action",
			render: (_, record) => (
				<Space size="middle">
					<Link to={`/product/${record.id}`}>编辑</Link>
					<Link to={`/product/${record.id}`}>查看</Link>
				</Space>
			),
		},
	];
	const navigate = useNavigate();
	const [queryParams, setQueryParams] = useState<IProductQueryParams>({
		page: 1,
		limit: 20,
		name: "",
	});
	// 2. 定义SWR的fetcher函数：接收参数，调用getProducts
	const fetcher = async (params: IProductQueryParams) => {
		const res = await getProducts({
			...params,
			name: params.name === "" ? undefined : params.name,
		});
		return res; // 若你的getProducts返回的是响应体（如res.data），则这里取res.data
	};

	const {
		data: products, // 接口返回的产品列表数据
		error, // 请求错误信息
		isLoading, // 加载状态
	} = useSWR(
		queryParams, // SWR的key：参数变化则重新请求
		fetcher,
		{
			// 可选配置：比如页面聚焦时重新验证、禁用自动重试等
			revalidateOnFocus: false,
		}
	);

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
						navigate("/product/create");
					}}
				>
					新增
				</Button>
			</section>
			{error && <div>Error loading products.</div>}
			<Table<IProduct>
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
			<Modal
				title="产品编码"
				closable={{ "aria-label": "Custom Close Button" }}
				open={isModalOpen}
				onOk={handleOk}
				onCancel={handleCancel}
				footer={null}
			>
				<p>Some contents...</p>
				<img src={mockBarcode} width={300} />
			</Modal>
		</div>
	);
};

export default Products;
