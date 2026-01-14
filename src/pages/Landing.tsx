import React from "react";
import { Outlet } from "react-router-dom";

export default function Landing() {
  return (
    <div className="flex justify-center items-center h-screen w-full">
      <Outlet />
    </div>
  );
}
