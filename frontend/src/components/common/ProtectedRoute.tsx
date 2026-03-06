import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";

interface ProtectedRouteProps {
  roles?: string[];
}

/**
 * Route'ni himoya qiluvchi komponent (Protected Route)
 * Agar foydalanuvchi tizimga kirmagan bo'lsa -> /login
 * Agar foydalanuvchi roli ruxsat bermasa -> /access-denied
 */
export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  // 1. Agar login qilinmagan bo'lsa, tizimga kirish sahifasiga qaytarish
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Agar sahifaga maxsus rollar talab qilingan bo'lsa va foydalanuvchida ular bo'lmasa -> Access Denied
  const activeRole = user?.roleName || (user as any)?.role;
  if (roles && user && !roles.includes(activeRole)) {
    return <Navigate to="/access-denied" replace />;
  }

  // 3. Ruxsat bor -> Ichki sahifani ko'rsatish
  return <Outlet />;
}
