import React from "react";
import VendorForm from "./VendorForm";
import { createVendor, IVendorCreateParams, IVendorUpdateParams } from "../../api/vendor";
import { GlobalModal } from "../../components/GlobalModal";

export default function VendorCreate() {
	const onFinishCallback = async (data: IVendorUpdateParams) => {
		const res = await createVendor(data);
		return res;
	};
	return (
		<div>
			<VendorForm onFinishCallback={onFinishCallback} />
		</div>
	);
}
