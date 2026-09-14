import { Line, Bar } from "@ant-design/charts";
import { useEffect, useState } from "react";
import { Card, Col, DatePicker, Row, Statistic, message } from "antd";
import dayjs, { Dayjs } from "dayjs";
import {
	getAnalyticsDailyTrend,
	getAnalyticsOverview,
	getAnalyticsTopPaths,
	type DailyTrendItem,
	type Overview,
	type TopPathItem,
} from "../../../api/analytics";

const { RangePicker } = DatePicker;

const Analytics = () => {
	const [range, setRange] = useState<[Dayjs, Dayjs]>([
		dayjs().subtract(7, "day"),
		dayjs(),
	]);
	const [overview, setOverview] = useState<Overview | null>(null);
	const [trend, setTrend] = useState<DailyTrendItem[]>([]);
	const [topPaths, setTopPaths] = useState<TopPathItem[]>([]);

	const load = async () => {
		try {
			const params = {
				startDate: range[0].toDate(),
				endDate: range[1].endOf("day").toDate(),
			};
			const [ov, tr, tp] = await Promise.all([
				getAnalyticsOverview(params),
				getAnalyticsDailyTrend(params),
				getAnalyticsTopPaths(params),
			]);
			setOverview(ov);
			setTrend(tr);
			setTopPaths(tp);
		} catch (e) {
			message.error((e as Error).message);
		}
	};

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [range[0].format("YYYY-MM-DD"), range[1].format("YYYY-MM-DD")]);

	const trendConfig = {
		data: trend.flatMap((r) => [
			{ day: r.day, type: "PV", value: r.pv },
			{ day: r.day, type: "UV", value: r.uv },
		]),
		xField: "day",
		yField: "value",
		seriesField: "type",
		autoFit: true,
		title: { title: "访问趋势 (PV / UV)" },
	};

	const topPathsConfig = {
		data: topPaths,
		xField: "pv",
		yField: "path",
		autoFit: true,
		title: { title: "Top 路径" },
		label: { text: "pv", position: "right" },
	};

	return (
		<div style={{ padding: 24 }}>
			<div style={{ marginBottom: 16 }}>
				<RangePicker
					value={range}
					onChange={(v) => v && setRange([v[0]!, v[1]!])}
				/>
			</div>

			<Row gutter={16}>
				<Col span={8}>
					<Card>
						<Statistic
							title="PV (页面浏览)"
							value={overview?.pv ?? 0}
						/>
					</Card>
				</Col>
				<Col span={8}>
					<Card>
						<Statistic
							title="UV (独立访客)"
							value={overview?.uv ?? 0}
						/>
					</Card>
				</Col>
				<Col span={8}>
					<Card>
						<Statistic
							title="平均 PV / UV"
							value={
								overview && overview.uv > 0
									? (overview.pv / overview.uv).toFixed(2)
									: 0
							}
						/>
					</Card>
				</Col>
			</Row>

			<Row gutter={16} style={{ marginTop: 16 }}>
				<Col span={24}>
					<Card title="访问趋势">
						<Line {...trendConfig} />
					</Card>
				</Col>
			</Row>

			<Row gutter={16} style={{ marginTop: 16 }}>
				<Col span={24}>
					<Card title="Top 10 访问路径">
						<Bar {...topPathsConfig} />
					</Card>
				</Col>
			</Row>
		</div>
	);
};

export default Analytics;
