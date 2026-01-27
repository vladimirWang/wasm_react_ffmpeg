import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import { getProductDetailById, IProductUpdateParams } from "../../api/product";
import { Button, Form, Input, InputNumber, Spin, Upload } from "antd";
import { RcFile } from "antd/es/upload";
import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import ProductForm from "./ProductForm";

export default function ProductDetail() {
	const { id } = useParams();

	const [initialValues, setInitialValues] = useState<IProductUpdateParams>({
		name: "",
		remark: "",
	});

	const fetcher = async (id: string) => {
		const res = await getProductDetailById(Number(id));
		return res;
	};
	const { data, error, isLoading } = useSWR(
		id, // SWR的key：参数变化则重新请求
		fetcher,
		{
			revalidateOnFocus: false,
		}
	);

	const [completed, setCompleted] = useState(false);

	useEffect(() => {
		console.log("---data---: ", data);
		if (data && !error) {
			// 当数据加载完成后，设置表单值
			// form.setFieldsValue(data);
			setInitialValues(data);
			setCompleted(true);
		}
	}, [data, error]);

	return (
		<div>
			{error && <div>Error loading vendor details.</div>}
			<Spin spinning={isLoading}>
				{completed && <ProductForm initialValues={initialValues} pageOperation="view" />}
			</Spin>
		</div>
	);
}
