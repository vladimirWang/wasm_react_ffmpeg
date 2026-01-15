import { DownOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Dropdown, MenuProps, Space } from "antd";
import React from "react";

const items: MenuProps["items"] = [
  {
    label: (
      <a
        href="https://www.antgroup.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        1st menu item
      </a>
    ),
    key: "0",
  },
  {
    label: (
      <a
        href="https://www.aliyun.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        2nd menu item
      </a>
    ),
    key: "1",
  },
  {
    type: "divider",
  },
  {
    label: "3rd menu item",
    key: "3",
  },
];

export default function Drop() {
  const [rotate, setRotate] = React.useState(false);
  return (
    <Dropdown menu={{ items }} trigger={["click"]} onOpenChange={(val) => {
      // console.log("open : ", val)
      setRotate(val)
    }}>
      <a onClick={(e) => {
        
        e.preventDefault()
      }}>
        <Space>
          <section>
            <Avatar icon={<UserOutlined />} />
            <span className="mx-2">Fernando</span>
          </section>
          <DownOutlined className={rotate ? "rotate-180" : ""} />
        </Space>
      </a>
    </Dropdown>
  );
}
