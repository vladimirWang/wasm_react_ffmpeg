import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const handleLogin = () => {
    navigate("/products");
  };
  return (
    <div>
      Login
      <button onClick={handleLogin}>Login</button>
      <Link to="/register">to register</Link>
    </div>
  );
}
