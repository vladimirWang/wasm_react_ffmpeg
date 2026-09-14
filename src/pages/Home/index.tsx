import React from "react";
import LineDemo from "./LineDemo";
import ColumnDemo from "./ColumnDemo";
import DemoScatter from "./ScatterDemo";
import RadarDemo from "./RadaDemo";
import HotSales from "./HotSales";
import TopProductsByVolume from "./TopProductsByVolume";

export default function Home() {
	return (
		<div>
			<div className="grid grid-cols-2 gap-4">
				<div>
					<HotSales />
				</div>
				<div>
					<TopProductsByVolume />
				</div>
				<div>
					<LineDemo />
				</div>
				<div>
					<ColumnDemo />
				</div>
				<div>
					<DemoScatter />
				</div>
				<div>
					<RadarDemo />
				</div>
			</div>
		</div>
	);
}
