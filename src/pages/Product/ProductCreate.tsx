import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import {
	createProduct,
	getProductDetailById,
	IProductCreateParams,
	IProductUpdateParams,
} from "../../api/product";
import { Button, Form, Input, InputNumber, Spin, Upload } from "antd";
import ProductForm from "./ProductForm";

export default function ProductCreate() {
	const [loading, setLoading] = useState(false);

	const onFinish = async (values: IProductUpdateParams) => {
		try {
			setLoading(true);
			// values.vendorId = 2;
			const res = await createProduct(values);
			if (res.code === 200) {
				alert("更新成功");
			} else {
				alert(res.message);
			}
		} catch (error) {
			console.error("<delete>  ");
		} finally {
			setLoading(false);
			return Promise.resolve();
		}
	};

	return (
		<div>
			<Spin spinning={loading}>
				<ProductForm onFinishCallback={onFinish} />
			</Spin>
		</div>
	);
}
