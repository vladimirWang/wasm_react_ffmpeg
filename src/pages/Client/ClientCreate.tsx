import React from "react";
import ClientForm from "./ClientForm";
import { createClient, IClient, IClientBody } from "../../api/client";
import { GlobalModal } from "../../components/GlobalModal";
import { useNavigate, useSearchParams } from "react-router-dom";
import { sleep } from "../../utils/common";

export default function ClientCreate() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const handleSubmit = async (data: IClientBody) => {
		const res = await createClient(data);
		await sleep(250);
		const redirectUrl = searchParams.get("redirect");
		if (redirectUrl) {
			navigate(redirectUrl);
		}
		return res;
	};
	return (
		<div>
			<ClientForm<IClientBody> onSubmit={handleSubmit} pageOperation="create" />
		</div>
	);
}
