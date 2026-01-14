import React, { useState } from "react";
import type { CascaderProps, FormItemProps, FormProps } from "antd";
import {
  AutoComplete,
  Button,
  Cascader,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
} from "antd";
import {
  userRegister,
  type RegisterParams,
  type RegisterResponse,
} from "../api/user";
import { Link, useNavigate } from "react-router-dom";

const formItemLayout: FormProps = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 8 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 },
  },
};

const tailFormItemLayout: FormItemProps = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0,
    },
    sm: {
      span: 16,
      offset: 8,
    },
  },
};

const registerFormInitialValues = {
  email: "",
  password: "123456",
  confirm: "123456",
  agreement: true,
};

const Register: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const onFinish = async (values: RegisterParams) => {
    console.log("Received values of form: ", values);
    try {
      const { email, password } = values;
      const res: RegisterResponse = await userRegister({ email, password });
      console.log("res: ", res);
      if (res.code === 200) {
        navigate("/login");
      } else {
      }
      // 现在 res 有正确的类型提示
      if (res.message) {
        console.log("注册成功:", res.message);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error("Unknown error: ", error);
      }
    }
  };

  return (
    <div>
      <Form
        {...formItemLayout}
        form={form}
        name="register"
        onFinish={onFinish}
        initialValues={{
          ...registerFormInitialValues,
        }}
        style={{ width: 500 }}
        scrollToFirstError
      >
        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            {
              type: "email",
              message: "The input is not valid E-mail!",
            },
            {
              required: true,
              message: "Please input your E-mail!",
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="password"
          label="密码"
          rules={[
            {
              required: true,
              message: "Please input your password!",
            },
          ]}
          hasFeedback
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          name="confirm"
          label="确认密码"
          dependencies={["password"]}
          hasFeedback
          rules={[
            {
              required: true,
              message: "Please confirm your password!",
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error("The new password that you entered do not match!")
                );
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          name="agreement"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value
                  ? Promise.resolve()
                  : Promise.reject(new Error("Should accept agreement")),
            },
          ]}
          {...tailFormItemLayout}
        >
          <Checkbox>
            I have read the <a href="">agreement</a>
          </Checkbox>
        </Form.Item>
        <Form.Item {...tailFormItemLayout}>
          <Button type="primary" htmlType="submit">
            注册
          </Button>
          or <Link to="/landing/login">Login now!</Link>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Register;
