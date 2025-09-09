import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const api = axios.create({
  baseURL: "https://reporting.felttouch.com",
  headers: { 
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
  timeout: 15000,
});

// Attach token if saved
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Optional: Add basic error logging for production
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (__DEV__) {
      console.error('API Error:', {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data
      });
    }
    return Promise.reject(error);
  }
);

// --- AUTH ---
export async function login(user_name: string, password: string) {
  const res = await api.post("/api/Auth/login", { user_name, password });
  if (res.data?.token) {
    await AsyncStorage.setItem("token", res.data.token);
  }
  return res.data;
}

export async function register(
  user_name: string,
  password: string,
  full_name: string,
  user_role: string
) {
  const res = await api.post("/api/Auth/register", {
    user_name,
    password,
    full_name,
    user_role,
  });
  return res.data;
}

// --- REPORTS ---
export async function getMyReports() {
  const res = await api.get("/api/Report/my-reports");
  return res.data;
}

export async function syncReports(marketerId: string, reports: any[]) {
  const res = await api.post("/api/Report/sync", { marketerId, reports });
  return res.data;
}
export async function updateReport(reportId: string, reportData: any) {
  const res = await api.put(`/api/Report/${reportId}`, reportData);
  return res.data;
}

export async function deleteReport(reportId: string) {
  const res = await api.delete(`/api/Report/${reportId}`);
  return res.data;
}
export async function createReport(reportData: any) {
  const res = await api.post("/api/Report", reportData);
  return res.data;
}
export async function updateUserProfile(profileData: any) {
  const res = await api.put("/api/User/profile", profileData);
  return res.data;
}

export async function getUserProfile() {
  const res = await api.get("/api/User/profile");
  return res.data;
}