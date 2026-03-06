import { create } from "zustand";
import { persist } from "zustand/middleware";
import { storage } from "@/utils/storage";

// ── Foydalanuvchi tipi ────────────────────────────────────
export interface AuthUser {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  roleName: "admin" | "manager" | "teacher" | "student" | "parent";
  roleId: number;
  isActive: boolean;
  avatarUrl: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (user: AuthUser, accessToken: string) => void;
  setTokens: (accessToken: string) => void;
  logout: () => void;
  updateUser: (partial: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken) => {
        storage.setToken(accessToken);
        storage.setUser(user);
        set({ user, accessToken, isAuthenticated: true });
      },

      setTokens: (accessToken) => {
        storage.setToken(accessToken);
        set({ accessToken });
      },

      logout: () => {
        storage.clear();
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      updateUser: (partial) =>
        set((s) => ({
          user: s.user ? { ...s.user, ...partial } : null,
        })),
    }),
    {
      name: "erp-auth",
      // Faqat foydalanuvchi ma'lumotlarini persist qilish
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        isAuthenticated: s.isAuthenticated,
      }),
    },
  ),
);
