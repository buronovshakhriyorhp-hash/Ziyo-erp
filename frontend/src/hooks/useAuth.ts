import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);
  const updateUser = useAuthStore((s) => s.updateUser);

  const login = async (phone: string, password: string) => {
    const result = await authService.login({ phone, password });
    setAuth(result.user, result.accessToken);
    return result;
  };

  const signOut = async () => {
    await authService.logout();
    logout();
  };

  const hasRole = (...roles: string[]) =>
    user ? roles.includes(user.roleName) : false;

  const isAdmin = () => hasRole("admin");
  const isManager = () => hasRole("admin", "manager");

  return {
    user,
    isAuthenticated,
    login,
    signOut,
    logout,
    updateUser,
    hasRole,
    isAdmin,
    isManager,
  };
}
