import API from "./api";

export const loginUser = (data) => API.post("/api/auth/login", data);
export const registerUser = (data) => API.post("/api/auth/register", data);