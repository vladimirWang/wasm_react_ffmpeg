import React, { useEffect, useState } from "react";
import VendorForm from "./VendorForm";
import {
	updateVendorDetailById,
	IVendorCreateParams,
	getVendorDetailById,
	IVendorUpdateParams,
	IVendor,
} from "../../api/vendor";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import { Spin } from "antd";

export default function VendorView() {
	const { id } = useParams();
	const fetcher = async (id: string) => {
		const res = await getVendorDetailById(Number(id));
		// return res.code === 200 ? res.data : null;
		return res;
	};

	const { data, error, isLoading } = useSWR(id, fetcher, {
		revalidateOnFocus: true,
	});
	const [completed, setCompleted] = useState(false);

	const [initialValues, setInitialValues] = useState<IVendor>();

	useEffect(() => {
		setCompleted(false);
	}, []);

	useEffect(() => {
		if (!error && data) {
			setInitialValues(data);
			setCompleted(true);
		}
	}, [data, error]);

	return (
		<div>
			{error && <p>fetch vendor failed: {error.message}</p>}
			<Spin spinning={isLoading}>
				{completed && <VendorForm initialValues={initialValues} pageOperation="view" />}
			</Spin>
		</div>
	);
}
