import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import { getVendorDetailById } from "../api/vendor";
import { Button, Checkbox, Form, Input, Spin } from "antd";

type FieldType = {
  name: string;
  remark?: string;
};

export default function VendorDetail() {
    const [form] = Form.useForm();

    const {setFieldsValue} = form
  const { id } = useParams();

  const fetcher = async (id: number) => {
    const res = await getVendorDetailById(id);
    return res; // 若你的getProducts返回的是响应体（如res.data），则这里取res.data
  };
  const { data, error, isLoading } = useSWR(
    id, // SWR的key：参数变化则重新请求
    fetcher,
    {
      // 可选配置：比如页面聚焦时重新验证、禁用自动重试等
      revalidateOnFocus: false,
    }
  );

  const onFinish = (values: FieldType) => {
    console.log("Success:", values);
  };

  useEffect(() => {
    console.log("---data---: ", data, setFieldsValue)
    setFieldsValue(data)
  }, [data])
  return (
    <div>
      {error && <div>Error loading vendor details.</div>}
        {JSON.stringify(data)}
      <Spin spinning={isLoading}>
        <Form
            form={form}
          name="basic"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 600 }}
          initialValues={{ ...data }}
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item<FieldType>
            label="名称"
            name="name"
            rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldType>
            label="备注"
            name="remark"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item label={null}>
            <Button type="primary" htmlType="submit">
              提交
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </div>
  );
}
