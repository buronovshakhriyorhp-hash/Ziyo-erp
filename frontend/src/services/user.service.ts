import api from "./api";
import type { AuthUser } from "@/store/auth.store";

export interface UserListResponse {
  data: AuthUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UserFilters {
  roleId?: number;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export const userService = {
  /** Barcha xodimlarni olish */
  list: async (filters: UserFilters = {}): Promise<UserListResponse> => {
    const { data } = await api.get<{ data: UserListResponse }>("/users", {
      params: filters,
    });
    return data.data;
  },

  /** Batafsil ma'lumot */
  getById: async (id: number): Promise<AuthUser> => {
    const { data } = await api.get<{ data: AuthUser }>(`/users/${id}`);
    return data.data;
  },

  /** Ma'lumotlarni yangilash (parol kabi qo'shimcha maydonlar uchun any ishlatiladi) */
  update: async (id: number, dto: Partial<AuthUser> | Record<string, any>): Promise<AuthUser> => {
    const { data } = await api.patch<{ data: AuthUser }>(`/users/${id}`, dto);
    return data.data;
  },

  /** Bloklash */
  deactivate: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  /** Faollashtirish */
  activate: async (id: number): Promise<void> => {
    await api.post(`/users/${id}/activate`);
  },
};
