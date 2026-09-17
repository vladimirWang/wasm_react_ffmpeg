import { Card, Col, Row } from "antd";
import KpiCards from "./KpiCards";
import StoreVisitsTrend from "./StoreVisitsTrend";
import TopVisitedProducts from "./TopVisitedProducts";
import TopReturnedProducts from "./TopReturnedProducts";
import TopRepairedProducts from "./TopRepairedProducts";
import HotSales from "./HotSales";
import TopProductsByVolume from "./TopProductsByVolume";

const cardStyle = { borderRadius: 8, height: "100%" };

export default function Home() {
	return (
		<div>
			<div style={{ marginBottom: 16 }}>
				<KpiCards />
			</div>

			<div style={{ marginBottom: 16 }}>
				<Card style={cardStyle}>
					<StoreVisitsTrend />
				</Card>
			</div>

			<Row gutter={16}>
				<Col span={8}>
					<Card style={cardStyle}>
						<TopVisitedProducts />
					</Card>
				</Col>
				<Col span={8}>
					<Card style={cardStyle}>
						<TopReturnedProducts />
					</Card>
				</Col>
				<Col span={8}>
					<Card style={cardStyle}>
						<TopRepairedProducts />
					</Card>
				</Col>
			</Row>

			<Row gutter={16} style={{ marginTop: 16 }}>
				<Col span={12}>
					<Card style={cardStyle}>
						<HotSales />
					</Card>
				</Col>
				<Col span={12}>
					<Card style={cardStyle}>
						<TopProductsByVolume />
					</Card>
				</Col>
			</Row>
		</div>
	);
}
