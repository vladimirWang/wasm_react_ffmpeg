import { DatePicker, Switch } from "antd";
import React, { useState } from "react";

export default function DateQuery() {
	const [pickerAvailable, setPickerAvailable] = useState(false);
	return (
		<section className="w-[300px] flex gap-4  items-center">
			<Switch value={pickerAvailable} onChange={setPickerAvailable}></Switch>
			<DatePicker disabled={!pickerAvailable}></DatePicker>
		</section>
	);
}
