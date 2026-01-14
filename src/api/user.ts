import request from "../request";

export const userLogin = (data: { username: string; password: string }) => {
  return request.post("/api/user/login", data);
};

export const userRegister = (data: { username: string; password: string }) => {
  return request.post("/api/user/register", data);
};
