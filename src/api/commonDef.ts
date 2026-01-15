// 待分页结构的泛型接口
export interface IPagination<T> {
  total: number;
  list: T[]
}

export interface IResponse<T> {
  data: T;
  code: number;
  message?: string;
}
