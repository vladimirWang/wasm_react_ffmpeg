import React from "react";
import { CalendarTwoTone } from "@ant-design/icons";
import { Breadcrumb, Layout, theme } from "antd";
import { Outlet } from "react-router-dom";
import Drop from "./Drop";
import SideBar from "./Sidebar";

const { Header, Content } = Layout;

const LayoutComponent: React.FC = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <SideBar />
      <Layout>
        <Header
          style={{ background: colorBgContainer }}
          className="flex justify-end gap-3"
        >
          <CalendarTwoTone
            twoToneColor="#ec6765"
            className="text-2xl"
            onClick={() => {}}
          />
          <Drop />
        </Header>
        <Content style={{ margin: "0 16px" }}>
          <Breadcrumb
            style={{ margin: "16px 0" }}
            items={[{ title: "User" }, { title: "Bill" }]}
          />
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export { LayoutComponent };
