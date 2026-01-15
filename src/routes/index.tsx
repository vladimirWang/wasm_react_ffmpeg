import { createBrowserRouter, Outlet } from "react-router-dom";
import Home from "../pages/Home";
import About from "../pages/About";
import NotFound from "../pages/NotFound";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Products from "../pages/Products";
import Vendors from "../pages/Vendors";
import ProductDetail from "../pages/ProductDetail";
import Landing from "../pages/Landing";
import { LayoutComponent } from "../layout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LayoutComponent,
    children: [
      {
        index: true,
        Component: Home,
      },
      { path: "product", Component: Products },
      { path: "product/:id", Component: ProductDetail },
      { path: "vendor", Component: Vendors },
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
    path: "/about",
    Component: About
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
