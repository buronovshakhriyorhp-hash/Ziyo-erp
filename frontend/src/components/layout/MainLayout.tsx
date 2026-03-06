import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { useUiStore } from "@/store/ui.store";
import { cn } from "@/lib/utils";

export function MainLayout() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const mobileOpen = useUiStore((s) => s.sidebarMobileOpen);
  const closeMobile = useUiStore((s) => s.closeMobileSidebar);
  const theme = useUiStore((s) => s.theme);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Tarmoq holatini kuzatish (Offline PWA)
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sahifa yangilanishida saqlangan mavzuni tiklash
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Mobil ekranda scroll bloklanadi
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* ── Offline Banner ─────────────────────────── */}
      {isOffline && (
        <div className="w-full bg-destructive text-destructive-foreground text-center py-1.5 text-xs sm:text-sm z-[100] font-medium shadow-md flex items-center justify-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          Siz offtasiz (Offline). Ma'lumotlar keshdan olinmoqda...
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* ── Mobile backdrop ───────────────────────── */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-sm animate-fade-in"
            onClick={closeMobile}
          />
        )}

        {/* ── Sidebar — desktop (static) ─────────────── */}
        <div className="hidden lg:flex">
          <Sidebar />
        </div>

        {/* ── Sidebar — mobile (overlay/drawer) ─────── */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 lg:hidden",
            "transform transition-transform duration-300 ease-in-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <Sidebar />
        </aside>

        {/* ── Main area ─────────────────────────────── */}
        <div
          className={cn(
            "flex flex-col flex-1 min-w-0 overflow-hidden",
            "transition-all duration-300 ease-in-out",
            !collapsed ? "lg:ml-0" : "lg:ml-0",
          )}
        >
          {/* ── Fixed navbar ───────────────────────── */}
          <Navbar />

          {/* ── Page content ───────────────────────── */}
          <main className="flex-1 overflow-y-auto">
            <div className="container-page animate-fade-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
