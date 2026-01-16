import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import {
  getVendorDetailById,
  IVendor,
  IVendorUpdateParams,
  updateVendorDetailById,
} from "../../api/vendor";
import { Button, Form, Input, Spin } from "antd";
import VendorForm from "./VendorForm";

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
					<VendorForm />
        )}
      </Spin>
    </div>
  );
}
