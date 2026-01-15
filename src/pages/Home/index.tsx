import React from "react";
import { Link } from "react-router-dom";
import { Line } from '@ant-design/charts';
import LineDemo from "./LineDemo";
import TreeMapDemo from "./TreeMapDemo";
import ColumnDemo from "./ColumnDemo";
import DemoScatter from "./ScatterDemo";
import RadarDemo from "./RadaDemo";

export default function Home() {

  return <div>
  <div>
    <Link to="/vendor">vendors</Link>
  </div>
    <div className="grid grid-cols-2 gap-4">
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
  ;
}
