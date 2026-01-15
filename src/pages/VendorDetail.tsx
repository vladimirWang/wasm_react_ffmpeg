import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import {
  getVendorDetailById,
  IVendor,
  IVendorUpdateParams,
  updateVendorDetailById,
} from "../api/vendor";
import { Button, Form, Input, Spin } from "antd";

export default function VendorDetail() {
  const [form] = Form.useForm();
  const { id } = useParams();

  const [initialValues, setInitialValues] = useState<IVendorUpdateParams>({
    name: "",
    remark: "",
  });

  const fetcher = async (id: string) => {
    const res = await getVendorDetailById(Number(id));
    console.log("---res---: ", res);
    if (res.code === 200) {
      return res.data;
    } else {
      return null;
    }
  };
  const { data, error, isLoading } = useSWR(
    id, // SWR的key：参数变化则重新请求
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const [completed, setCompleted] = useState(false);

  const onFinish = async (values: IVendorUpdateParams) => {
    try {
      const res = await updateVendorDetailById(Number(id), values);
      if (res.code === 200) {
        alert("更新成功");
      } else {
        alert(res.message);
      }
    } catch (error) {
      console.error("<delete>  ");
    }
  };

  useEffect(() => {
    if (data) {
      // 当数据加载完成后，设置表单值
      // form.setFieldsValue(data);
      setInitialValues(data);
      setCompleted(true);
    }
  }, [data, form]);
  return (
    <div>
      {error && <div>Error loading vendor details.</div>}
      <Spin spinning={isLoading}>
        {completed && (
          <Form
            form={form}
            name="basic"
            initialValues={initialValues}
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            style={{ maxWidth: 600 }}
            onFinish={onFinish}
            autoComplete="off"
          >
            <Form.Item<IVendorUpdateParams>
              label="名称"
              name="name"
              rules={[
                { required: true, message: "Please input your username!" },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item<IVendorUpdateParams>
              label="备注"
              name="remark"
              rules={[
                { required: true, message: "Please input your password!" },
              ]}
            >
              <Input.TextArea />
            </Form.Item>
            <Form.Item label={null}>
              <Button type="primary" htmlType="submit">
                提交
              </Button>
            </Form.Item>
          </Form>
        )}
      </Spin>
    </div>
  );
}
