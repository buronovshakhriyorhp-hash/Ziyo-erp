import api from "./api";
import type { AuthUser } from "@/store/auth.store";

export interface LoginDto {
  phone: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  // refreshToken yuborilmaydi (HttpOnly Cookie ishlatiladi)
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface RegisterDto {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  roleId: number;
}

export const authService = {
  /** Tizimga kirish */
  login: async (dto: LoginDto): Promise<LoginResponse> => {
    const { data } = await api.post<{ data: any }>("/auth/login", dto);
    const responseData = data.data;
    if (
      responseData.user &&
      responseData.user.role &&
      !responseData.user.roleName
    ) {
      responseData.user.roleName = responseData.user.role;
    }
    return responseData as LoginResponse;
  },

  /** Tizimdan chiqish */
  logout: async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* ignore */
    }
  },

  /** Joriy foydalanuvchi ma'lumotlari */
  me: async (): Promise<AuthUser> => {
    const { data } = await api.get<{ data: any }>("/auth/me");
    const user = data.data;
    if (user && user.role && !user.roleName) {
      user.roleName = user.role;
    }
    return user as AuthUser;
  },

  /** Parolni o'zgartirish */
  changePassword: async (dto: ChangePasswordDto): Promise<void> => {
    await api.patch("/auth/change-password", dto);
  },

  /** Token yangilash */
  refresh: async (): Promise<{ accessToken: string }> => {
    const { data } = await api.post<{ data: { accessToken: string } }>(
      "/auth/refresh",
    );
    return data.data;
  },

  /** Yangi foydalanuvchi yaratish */
  register: async (dto: RegisterDto): Promise<AuthUser> => {
    const { data } = await api.post<{ data: { user: AuthUser } }>(
      "/auth/register",
      dto,
    );
    return data.data.user;
  },
};
