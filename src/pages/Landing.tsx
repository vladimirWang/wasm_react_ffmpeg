import { Outlet } from "react-router-dom";
import "./Landing.css";

export default function Landing() {
  return (
    <div className="landing-bg">
      <div className="landing-content">
        <Outlet />
      </div>
    </div>
  );
}
