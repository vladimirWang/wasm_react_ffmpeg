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
import ProductForm from "./ProductForm";

export default function ProductDetail() {
  const { id } = useParams();

  const [initialValues, setInitialValues] = useState<IProductUpdateParams>({
    name: "",
    remark: "",
  });

  const fetcher = async (id: string) => {
    const res = await getProductDetailById(Number(id));
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

  const onFinish = async (values: IProductUpdateParams) => {
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
    console.log("---data---: ", data);
    if (data) {
      // 当数据加载完成后，设置表单值
      // form.setFieldsValue(data);
      setInitialValues(data);
      setCompleted(true);
    }
  }, [data]);

  return (
    <div>
      {error && <div>Error loading vendor details.</div>}
      <Spin spinning={isLoading}>
        {completed && (
          <ProductForm
            initialValues={initialValues}
            onFinishCallback={onFinish}
          />
        )}
      </Spin>
    </div>
  );
}
