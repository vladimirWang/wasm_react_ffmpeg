import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import {
	getProductDetailById,
	IProduct,
	IProductUpdateParams,
	patchProductById,
} from "../../api/product";
import { Button, Form, Input, InputNumber, Spin, Upload } from "antd";
import { pickIncrementalFields } from "../../utils/common";
import ProductForm from "./ProductForm";
import { pick } from "lodash";

export default function ProductUpdate() {
	const { id } = useParams();

	const [initialValues, setInitialValues] = useState<IProduct>();

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

	const onFinish = async (values: IProductUpdateParams) => {
		try {
			await patchProductById(Number(id), values);
		} catch (error) {
			console.error("<delete>  ");
		} finally {
			return Promise.resolve();
		}
	};

	useEffect(() => {
		if (data && !error) {
			// 当数据加载完成后，设置表单值
			setInitialValues(data);
			setCompleted(true);
		}
	}, [data, error]);

	return (
		<div>
			{error && <div>Error loading vendor details.</div>}
			<Spin spinning={isLoading}>
				{completed && (
					<ProductForm
						initialValues={initialValues}
						onFinishCallback={onFinish}
						pageOperation="update"
					/>
				)}
			</Spin>
		</div>
	);
}
