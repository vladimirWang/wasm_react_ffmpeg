import React from "react";
import VendorForm from "./VendorForm";
import { createVendor, IVendorCreateParams, IVendorUpdateParams } from "../../api/vendor";

export default function VendorCreate() {
	const onFinishCallback = async (data: IVendorUpdateParams) => {
		const res = await createVendor(data);

		return Promise.resolve();
	};
	return (
		<div>
			<VendorForm onFinishCallback={onFinishCallback} />
		</div>
	);
}
