import React from "react";
import { LockOutlined, UserOutlined, MailOutlined } from "@ant-design/icons";
import { Button, Checkbox, Flex, Form, Input } from "antd";
import { userLogin } from "../api/user";
import { Link } from "react-router-dom";

const loginFormInitialValues = {
  email: "123456@qq.com",
  password: "123456",
  remember: true,
};

const Login: React.FC = () => {
  const [form] = Form.useForm();
  const { validateFields } = form;
  const onFinish = async (values: any) => {
    console.log("Received values of form: ", values);
    try {
      const res = await userLogin(values);
      console.log("res: ", res);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error("Unknown error: ", error);
      }
    }
  };

  return (
    <Form
      form={form}
      initialValues={{ ...loginFormInitialValues }}
      style={{ maxWidth: 360 }}
      onFinish={onFinish}
    >
      <Form.Item
        name="email"
        rules={[{ required: true, message: "Please input your email!" }]}
      >
        <Input prefix={<MailOutlined />} placeholder="email" />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: "Please input your Password!" }]}
      >
        <Input
          prefix={<LockOutlined />}
          type="password"
          placeholder="Password"
        />
      </Form.Item>
      <Form.Item>
        <Flex justify="space-between" align="center">
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>Remember me</Checkbox>
          </Form.Item>
          <a href="">Forgot password</a>
        </Flex>
      </Form.Item>

      <Form.Item>
        <Button block type="primary" htmlType="submit">
          Log in
        </Button>
        or <Link to="/register">Register now!</Link>
      </Form.Item>
    </Form>
  );
};

export default Login;
