// api.ts
import axios, { AxiosInstance } from "axios";

const api: AxiosInstance = axios.create({
  baseURL: "https://reporting.felttouch.com/api", // change to your API URL
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
