import React, { use, useEffect, useState } from "react";
import { Button, Flex, Input, Pagination, Space, Table, Tag } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { TableProps } from "antd";
import { IProduct, IProductQueryParams, getProducts } from "../api/product";
import useSWR from "swr";
import { Link } from "react-router-dom";

const columns: TableProps<IProduct>["columns"] = [
  {
    title: "name",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "cost",
    dataIndex: "cost",
    key: "cost",
  },
  {
    title: "balance",
    dataIndex: "balance",
    key: "balance",
  },
  {
    title: "price",
    key: "price",
    dataIndex: "price",
    // render: (_, { tags }) => (
    //   <Flex gap="small" align="center" wrap>
    //     {tags.map((tag) => {
    //       let color = tag.length > 5 ? 'geekblue' : 'green';
    //       if (tag === 'loser') {
    //         color = 'volcano';
    //       }
    //       return (
    //         <Tag color={color} key={tag}>
    //           {tag.toUpperCase()}
    //         </Tag>
    //       );
    //     })}
    //   </Flex>
    // ),
  },
  {
    title: "Action",
    key: "action",
    dataIndex: "action",
    render: (_, record) => (
      <Space size="middle">
        <Link to={`/product/${record.id}`}>编辑</Link>
        <Link to={`/product/${record.id}`}>查看</Link>
      </Space>
    ),
  },
];

const data: IProduct[] = [
  {
    id: 1,
    name: "John Brown",
    remark: "32",
    price: 123,
    balance: 100,
    img: "",
    vendorId: 1,
    isDel: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    cost: 50,
  },
];

const Products: React.FC = () => {
  const [queryParams, setQueryParams] = useState<IProductQueryParams>({
    page: 1,
    limit: 20,
    name: "",
  });
  // 2. 定义SWR的fetcher函数：接收参数，调用getProducts
  const fetcher = async (params: IProductQueryParams) => {
    const res = await getProducts({
      ...params,
      name: params.name === "" ? undefined : params.name,
    });
    return res; // 若你的getProducts返回的是响应体（如res.data），则这里取res.data
  };

  const {
    data: products, // 接口返回的产品列表数据
    error, // 请求错误信息
    isLoading, // 加载状态
  } = useSWR(
    queryParams, // SWR的key：参数变化则重新请求
    fetcher,
    {
      // 可选配置：比如页面聚焦时重新验证、禁用自动重试等
      revalidateOnFocus: false,
    }
  );

  // const [products, setProducts] = React.useState<IProduct[]>(data);

  // const loadProducts = async () => {
  //   // const res = await fetch('/api/product?limit=10&page=1&name=');
  //   // const json = await res.json();
  //   // setProducts(json.data.list);
  //   const res = await getProducts({ limit: 10, page: 1, name: '' });
  //   setProducts(res.data.list);
  // }
  // useEffect(() => {
  //   // loadProducts()
  // }, [])
  const [keyword, setKeyword] = useState<string>(queryParams.name || "");
  const [page, setPage] = useState(queryParams.page);

  return (
    <div className="py-2 px-3">
      <section className="flex gap-5">
        <Input
          placeholder="Basic usage"
          value={keyword}
          onInput={(e) => setKeyword(e.currentTarget.value)}
          allowClear
        />
        <Button
          icon={<SearchOutlined />}
          onClick={() => {
            setQueryParams({
              name: keyword,
              page: 1,
              limit: 20,
            });
          }}
        ></Button>
        <Link to="/product/create">新增</Link>
      </section>
      {error && <div>Error loading products.</div>}
      <Table<IProduct>
        size="small"
        columns={columns}
        dataSource={products?.data.list}
        loading={isLoading}
        pagination={false}
        onRow={(record) => ({
          onClick: () => {
            console.log("row clicked", record);
          },
        })}
      />
      <br />
      <section className="flex justify-end">
        <Pagination
          total={products?.data.total}
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} of ${total} items`
          }
          defaultPageSize={20}
          defaultCurrent={page}
          onChange={(page) => {
            setPage(page);
            setQueryParams({
              ...queryParams,
              page,
            });
          }}
        />
      </section>
    </div>
  );
};

export default Products;
