import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import {
  getProductDetailById,
  IProductUpdateParams,
  updateVendorDetailById,
} from "../../api/product";
import { Button, Form, Input, InputNumber, Spin, Upload } from "antd";
import { RcFile } from "antd/es/upload";
import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";

export default function ProductForm({
  initialValues,
  onFinishCallback,
}: {
  initialValues: IProductUpdateParams;
  onFinishCallback?: (values: IProductUpdateParams) => Promise<void>;
}) {
  const [form] = Form.useForm();

  const [imageUrl, setImageUrl] = useState<string>();
  const [loading, setLoading] = useState(false);

  //   const onFinish = async (values: IProductUpdateParams) => {
  //     try {
  //       const res = await updateVendorDetailById(Number(id), values);
  //       if (res.code === 200) {
  //         alert("更新成功");
  //       } else {
  //         alert(res.message);
  //       }
  //     } catch (error) {
  //       console.error("<delete>  ");
  //     }
  //   };

  const beforeUpload = (file: RcFile) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      alert("You can only upload JPG/PNG file!");
    }
    return isJpgOrPng;
  };
  const handleChange = () => {};

  const uploadButton = (
    <button style={{ border: 0, background: "none" }} type="button">
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </button>
  );

  return (
    <div>
      <Form
        form={form}
        name="basic"
        initialValues={initialValues}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        // style={{ maxWidth: 600 }}
        onFinish={onFinishCallback}
        autoComplete="off"
      >
        <div className="flex gap-6 justify-between w-full">
          <section className="flex-1">
            <Form.Item<IProductUpdateParams>
              label="名称"
              name="name"
              rules={[{ required: true, message: "请输入名称" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item<IProductUpdateParams>
              label="价格"
              name="price"
              rules={[{ required: true, message: "请输入价格" }]}
            >
              <InputNumber min={0} precision={0} />
            </Form.Item>
            <Form.Item<IProductUpdateParams>
              label="成本"
              name="cost"
              rules={[{ required: true, message: "请输入成本!" }]}
            >
              <InputNumber min={0} precision={0} />
            </Form.Item>
            <Form.Item<IProductUpdateParams>
              label="备注"
              name="remark"
              rules={[
                { required: true, message: "Please input your password!" },
              ]}
            >
              <Input.TextArea />
            </Form.Item>
          </section>
          <section className="flex-1">
            <Form.Item<IProductUpdateParams>
              label=""
              name="name"
              rules={[{ required: true, message: "请输入名称" }]}
            >
              <Upload
                name="avatar"
                listType="picture-card"
                className="avatar-uploader"
                showUploadList={false}
                action="https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload"
                beforeUpload={beforeUpload}
                onChange={handleChange}
              >
                {imageUrl ? (
                  <img
                    draggable={false}
                    src={imageUrl}
                    alt="avatar"
                    style={{ width: "100%" }}
                  />
                ) : (
                  uploadButton
                )}
              </Upload>
            </Form.Item>
          </section>
        </div>
        <Form.Item label={null}>
          <Button type="primary" htmlType="submit">
            提交
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
