import React from "react";
import { Link } from "react-router-dom";

export default function Products() {
  const ids = [1, 2, 3];
  return (
    <div>
      Products
      {ids.map((item) => {
        return (
          <div>
            <Link to={`/product/${item}`}>Product {item}</Link>
          </div>
        );
      })}
    </div>
  );
}
