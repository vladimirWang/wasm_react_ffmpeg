import React from "react";
import ClientForm from "./ClientForm";
import { createVendor, IVendorCreateParams, IVendorUpdateParams } from "../../api/vendor";
import { GlobalModal } from "../../components/GlobalModal";

export default function VendorCreate() {
	const onFinishCallback = async (data: IVendorUpdateParams) => {
		const res = await createVendor(data);
		return res;
	};
	return (
		<div>
			<ClientForm onFinishCallback={onFinishCallback} pageOperation="create" />
		</div>
	);
}
