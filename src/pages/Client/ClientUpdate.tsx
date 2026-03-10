import React, { useEffect, useState } from "react";
import ClientForm from "./ClientForm";
import {
	patchClient,
	IClient,
	IClientBody,
	getClientDetailById,
	IClientUpdateParams,
} from "../../api/client";
import { GlobalModal } from "../../components/GlobalModal";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { sleep } from "../../utils/common";

export default function CLientUpdate() {
	const { id } = useParams();
	const handleSubmit = async (data: IClientUpdateParams) => {
		const res = await patchClient(Number(id), data);
		return res;
	};
	const [ready, setReady] = useState(false);
	const [clientDetail, setClientDetail] = useState<IClient>();
	const loadClientDetail = async () => {
		const res = await getClientDetailById(Number(id));
		setReady(true);
		setClientDetail(res);
	};

	useEffect(() => {
		loadClientDetail();
	}, []);
	return (
		<div>
			{ready && (
				<ClientForm<IClientUpdateParams>
					onSubmit={handleSubmit}
					pageOperation="update"
					initialValues={clientDetail}
				/>
			)}
		</div>
	);
}
