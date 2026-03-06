import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import { storage } from "@/utils/storage";

// ── Axios instance ────────────────────────────────────────
export const api = axios.create({
  baseURL: "/api",
  timeout: 15_000,
  withCredentials: true, // HttpOnly cookie orqali refreshToken yuborilishi uchun minnatdor
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: Bearer token qo'shish ───────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: 401 da refresh token ───────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (v: string) => void;
  reject: (e: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token!),
  );
  failedQueue = [];
}

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 401 — Token muddati tugagan
    if (error.response?.status === 401 && !original._retry) {
      // Agar mana shu original request /auth/refresh ni o'zi bo'lsa
      if (original.url?.includes("/auth/refresh")) {
        storage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Navbatga qo'shish
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        // withCredentials: true orqali cookie avtomat ravishda serverga ketadi
        const { data } = await api.post("/auth/refresh");
        const newToken = data.data.accessToken;

        storage.setToken(newToken);

        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);

        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        storage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ── API xato xabari oluvchi yordamchi ────────────────────
export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as { message?: string })?.message ??
      error.message ??
      "Noma'lum xato"
    );
  }
  if (error instanceof Error) return error.message;
  return "Noma'lum xato";
}

export default api;
