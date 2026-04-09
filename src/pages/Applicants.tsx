import React, { useEffect, useMemo, useState } from "react";
import {
	Alert,
	Button,
	Flex,
	Input,
	message,
	Modal,
	Pagination,
	Space,
	Table,
	Tag,
	Tooltip,
} from "antd";
import { PlusCircleOutlined, SearchOutlined } from "@ant-design/icons";
import type { TableProps } from "antd";
import { IProduct, IProductQueryParams, getProducts } from "../api/product";
import useSWR from "swr";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import mockBarcode from "../assets/barcode.jpg";
import { GlobalModal } from "../components/GlobalModal";
import dayjs from "dayjs";
import { paramsToSearchParams } from "../utils/common";
import { approveApplication, getApplicants, IApplicant } from "../api/applicant";
import { IPagination } from "../api/commonDef";

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
	const [approveLoadingMap, setApproveLoadingMap] = useState<Record<number, boolean>>({});
	const columns: TableProps<IApplicant>["columns"] = [
		{
			title: "id",
			dataIndex: "id",
			key: "id",
			width: 50,
		},
		{
			title: "邮箱",
			dataIndex: "email",
			key: "email",
			width: 100,
		},
		{
			title: "状态",
			key: "status",
			dataIndex: "status",
		},
		{
			title: "更新时间",
			dataIndex: "updatedAt",
			key: "updatedAt",
			render: (_, record) => {
				return record.updatedAt ? dayjs(record.updatedAt).format("YYYY-MM-DD HH:mm:ss") : null;
			},
		},
		{
			title: "操作",
			key: "action",
			dataIndex: "action",
			render: (_, record) => (
				<Space size="middle">
					{true && (
						<>
							<Button
								loading={approveLoadingMap[record.id]}
								size="small"
								type="primary"
								onClick={async () => {
									try {
										setApproveLoadingMap(prev => ({ ...prev, [record.id]: true }));
										await approveApplication({ id: record.id });
										mutate();
										message.success("激活链接发送到对应邮箱");
									} finally {
										setApproveLoadingMap(prev => ({ ...prev, [record.id]: false }));
									}
								}}
							>
								审核通过
							</Button>
							{/* <Button loading={approveLoading} size="small" danger onClick={() => {}}>
								审核驳回
							</Button> */}
						</>
					)}

					<Link to={`/product/${record.id}`}>查看</Link>
				</Space>
			),
		},
	];
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();

	const [queryParams, setQueryParams] = useState<IPagination>({
		page: Number(searchParams.get("page")) || 1,
		limit: Number(searchParams.get("limit")) || 20,
	});
	const swrKey = useMemo(
		() => ["products", queryParams.page, queryParams.limit] as const,
		[queryParams.page, queryParams.limit]
	);

	// 2. 定义SWR的fetcher函数：接收参数，调用getProducts
	const fetcher = async ([_tag, page, limit]: typeof swrKey) => {
		const res = await getApplicants({
			page,
			limit,
		});
		return res; // 若你的getProducts返回的是响应体（如res.data），则这里取res.data
	};

	const {
		data: applicants, // 接口返回的产品列表数据
		error, // 请求错误信息
		isLoading, // 加载状态
		mutate,
	} = useSWR(
		swrKey, // SWR的key：参数变化则重新请求
		fetcher,
		{
			// 可选配置：比如页面聚焦时重新验证、禁用自动重试等
			revalidateOnFocus: false,
			// 路由快速切换时，避免 2s dedupe 导致“偶发不刷新”
			dedupingInterval: 0,
		}
	);

	const location = useLocation();
	useEffect(() => {
		// 每次进入该路由都强制重新校验一次数据，避免命中 dedupe/缓存导致不刷新
		mutate();
	}, [location.key, mutate]);

	// const [keyword, setKeyword] = useState<string>(queryParams.productName || "");
	// const [page, setPage] = useState(queryParams.page);

	return (
		<div className="py-2 px-3">
			{/* <section className="flex gap-5">
				<Input
					placeholder="产品名称"
					value={keyword}
					onChange={e => setKeyword(e.currentTarget.value)}
					allowClear
				/>
				<Button
					icon={<SearchOutlined />}
					onClick={() => {
						const params = {
							productName: keyword,
							page: 1,
							limit: 20,
						};
						setQueryParams(params);
						setSearchParams(paramsToSearchParams(params));
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
			</section> */}
			{error && <div>Error loading products.</div>}
			<Table<IApplicant>
				size="small"
				columns={columns}
				dataSource={applicants?.list}
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
			{/* <section className="flex justify-end">
				<Pagination
					total={products?.total}
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
			</section> */}
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
