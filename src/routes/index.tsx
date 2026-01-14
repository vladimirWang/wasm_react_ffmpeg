import { createBrowserRouter, Outlet } from "react-router-dom";
import Home from "../pages/Home";
import About from "../pages/About";
import NotFound from "../pages/NotFound";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Products from "../pages/Products";
import ProductDetail from "../pages/ProductDetail";
import Landing from "../pages/Landing";

function Root() {
  return (
    <div>
      <Outlet />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        index: true,
        Component: Home,
      },
      { path: "products", Component: Products },
      { path: "product/:id", Component: ProductDetail },
      { path: "about", Component: About },
    ],
  },
  {
    path: "/landing",
    Component: Landing,
    children: [
      {
        path: "login",
        Component: Login,
      },
      {
        path: "register",
        Component: Register,
      },
    ],
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
