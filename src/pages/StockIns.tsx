import React, { use, useEffect, useState } from "react";
import { Button, Flex, Input, message, Modal, Pagination, Space, Table, Tag, Upload } from "antd";
import { InboxOutlined, PlusCircleOutlined, SearchOutlined } from "@ant-design/icons";
import type { TableProps, UploadProps } from "antd";
import { IProduct, IProductQueryParams, getProducts } from "../api/product";
import { getStockIns, IStockIn, uploadStockInFile } from "../api/stockIn";
import useSWR from "swr";
import { Link, useNavigate } from "react-router-dom";
import type { RcFile } from "antd/es/upload";

const { Dragger } = Upload;
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
	// 2. 定义SWR的fetcher函数：接收参数，调用getProducts
	const fetcher = async (params: IProductQueryParams) => {
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
	const [uploading, setUploading] = useState(false);

	// 自定义上传方法
	const customRequest = async (options: any) => {
		const { file, onSuccess, onError, onProgress } = options;

		try {
			setUploading(true);
			const res = await uploadStockInFile(file as File);

			if (res.code === 200) {
				onSuccess?.(res, file);
				message.success(`${file.name} 上传成功`);
				// 上传成功后刷新列表
				mutate();
				// 关闭弹窗
				setFileUploadModalOpen(false);
			} else {
				onError?.(new Error(res.message || "上传失败"));
				message.error(res.message || `${file.name} 上传失败`);
			}
		} catch (error: any) {
			onError?.(error);
			message.error(error?.message || `${file.name} 上传失败`);
		} finally {
			setUploading(false);
		}
	};

	const props: UploadProps = {
		name: "file",
		multiple: false, // 改为单文件上传，如果需要多文件可以改为 true
		customRequest, // 使用自定义上传方法
		onChange(info) {
			const { status } = info.file;
			if (status === "done") {
				console.log(`${info.file.name} file uploaded successfully.`);
			} else if (status === "error") {
				console.error(`${info.file.name} file upload failed.`);
			}
		},
		onDrop(e) {
			console.log("Dropped files", e.dataTransfer.files);
		},
		beforeUpload: (file) => {
			console.log("beforeUpload file: ", file);
			return true;
			// // 可以在这里添加文件类型和大小验证
			// const isExcel = file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
			// 	|| file.type === "application/vnd.ms-excel"
			// 	|| file.name.endsWith(".xlsx")
			// 	|| file.name.endsWith(".xls");

			// if (!isExcel) {
			// 	message.error("只能上传 Excel 文件 (.xlsx, .xls)");
			// 	return Upload.LIST_IGNORE;
			// }

			// const isLt10M = file.size / 1024 / 1024 < 10;
			// if (!isLt10M) {
			// 	message.error("文件大小不能超过 10MB");
			// 	return Upload.LIST_IGNORE;
			// }

			// return true;
		},
	};

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
			<Modal
				open={fileUploadModalOpen}
				title="批量导入进货记录"
				onCancel={() => setFileUploadModalOpen(false)}
				footer={null}
				confirmLoading={uploading}
			>
				<Dragger {...props} disabled={uploading}>
					<p className="ant-upload-drag-icon">
						<InboxOutlined />
					</p>
					<p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
					<p className="ant-upload-hint">
						支持 Excel 文件 (.xlsx, .xls)，文件大小不超过 10MB
					</p>
				</Dragger>
			</Modal>
		</div>
	);
};

export default StockIns;
