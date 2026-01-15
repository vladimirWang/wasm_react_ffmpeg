import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return <div>
    <Link to="/product">products</Link>
    <Link to="/vendor">vendors</Link>
  </div>;
}
