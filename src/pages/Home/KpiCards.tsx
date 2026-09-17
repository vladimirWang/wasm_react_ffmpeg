import { Card, Col, Row } from "antd";
import {
	EyeOutlined,
	RedoOutlined,
	ToolOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";

interface KpiCardProps {
	title: string;
	value: number;
	icon: ReactNode;
}

const KpiCard = ({ title, value, icon }: KpiCardProps) => (
	<Card style={{ borderRadius: 8 }}>
		<div
			style={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "flex-start",
			}}
		>
			<div>
				<div style={{ color: "#8c8c8c", fontSize: 14 }}>{title}</div>
				<div
					style={{
						fontSize: 28,
						fontWeight: 700,
						marginTop: 8,
						color: "#262626",
					}}
				>
					{value.toLocaleString()}
				</div>
			</div>
			<div
				style={{
					width: 40,
					height: 40,
					borderRadius: "50%",
					background: "#e6f4ff",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					color: "#1677ff",
					fontSize: 18,
				}}
			>
				{icon}
			</div>
		</div>
	</Card>
);

const KpiCards = () => {
	return (
		<Row gutter={16}>
			<Col span={8}>
				<KpiCard title="总访问量" value={21760} icon={<EyeOutlined />} />
			</Col>
			<Col span={8}>
				<KpiCard title="总退货数" value={223} icon={<RedoOutlined />} />
			</Col>
			<Col span={8}>
				<KpiCard title="总返修数" value={207} icon={<ToolOutlined />} />
			</Col>
		</Row>
	);
};

export default KpiCards;
