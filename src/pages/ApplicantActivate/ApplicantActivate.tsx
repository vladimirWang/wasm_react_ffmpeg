import React from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import UserInfo from "./RegisterForm";

export default function ApplicantActivate() {
	const [searchParams] = useSearchParams();
	const token = searchParams.get("token");
	if (!token) {
		return <div>Token is required</div>;
	}
	return (
		<div>
			<UserInfo token={token} />
		</div>
	);
}
