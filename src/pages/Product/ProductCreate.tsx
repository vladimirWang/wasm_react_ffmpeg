import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import {
	createProduct,
	getProductDetailById,
	IProductCreateParams,
	IProductUpdateParams,
} from "../../api/product";
import { Button, Form, Input, InputNumber, message, Spin, Upload } from "antd";
import ProductForm from "./ProductForm";

export default function ProductCreate() {
	const [loading, setLoading] = useState(false);

	const onFinish = async (values: IProductUpdateParams) => {
		try {
			setLoading(true);
			// values.vendorId = 2;
			await createProduct(values);
		} finally {
			setLoading(false);
			return Promise.resolve();
		}
	};

	return (
		<div>
			<Spin spinning={loading}>
				<ProductForm
					onFinishCallback={onFinish}
					pageOperation="create"
					// initialValues={{
					// 	vendorId: 2,
					// 	name: "puma 裤子",
					// 	shelfPrice: 100,
					// }}
				/>
			</Spin>
		</div>
	);
}
