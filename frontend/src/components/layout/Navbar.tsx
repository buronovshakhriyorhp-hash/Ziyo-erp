import {
  LogOut,
  Menu,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { useUiStore } from "@/store/ui.store";
import { authService } from "@/services/auth.service";
import { getInitials } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { GlobalSearch } from "./GlobalSearch";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  manager: "Menejer",
  teacher: "O'qituvchi",
  student: "Talaba",
  parent: "Ota-ona",
};

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const toggleMobile = useUiStore((s) => s.toggleMobileSidebar);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await authService.logout();
    logout();
    navigate("/login", { replace: true });
  };

  const fullName = user ? `${user.firstName} ${user.lastName}` : "—";
  const initials = getInitials(fullName);
  const roleLabel = user ? (ROLE_LABELS[user.roleName] ?? user.roleName) : "";

  return (
    <header
      className={cn(
        "h-16 flex items-center justify-between px-4 lg:px-6",
        "bg-white border-b border-border flex-shrink-0",
        "sticky top-0 z-30",
      )}
    >
      {/* ── Sol — Mobile hamburger ───────────────────── */}
      <button
        onClick={toggleMobile}
        className="lg:hidden p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Menyuni ochish"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ── Markaz — Qidiruv ─────────── */}
      <div className="flex-1 lg:flex-none flex justify-end lg:justify-center">
        <button
          onClick={() =>
            document.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", ctrlKey: true }),
            )
          }
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-secondary/50 border border-border rounded-lg hover:bg-secondary hover:text-foreground transition-colors mr-2 lg:mr-0 min-w-[200px]"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-left">Izlash...</span>
          <span className="flex items-center gap-1 text-[10px] font-semibold">
            <kbd className="px-1.5 py-0.5 rounded-md bg-background border border-border font-sans">
              Ctrl
            </kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 rounded-md bg-background border border-border font-sans">
              K
            </kbd>
          </span>
        </button>
        <button
          onClick={() =>
            document.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", ctrlKey: true }),
            )
          }
          className="sm:hidden p-2 mr-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* ── O'ng — Amallar va profil ─────────────────── */}
      <div className="flex items-center gap-1">
        <GlobalSearch />

        {/* Bildirishnomalar */}
        <button className="relative p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500" />
        </button>

        {/* Dark / Light toggle */}
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Rangni o'zgartirish"
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </button>

        {/* Vertikal ajratuvchi */}
        <div className="w-px h-6 bg-border mx-1" />

        {/* Profil dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              "flex items-center gap-2.5 pl-1 pr-2 py-1.5 rounded-lg",
              "hover:bg-secondary transition-colors",
              menuOpen && "bg-secondary",
            )}
          >
            {/* Avatar */}
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={fullName}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center ring-2 ring-brand-200">
                <span className="text-white text-xs font-semibold">
                  {initials}
                </span>
              </div>
            )}
            {/* Ism */}
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-foreground leading-tight truncate max-w-[120px]">
                {fullName}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                {roleLabel}
              </p>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                menuOpen && "rotate-180",
              )}
            />
          </button>

          {/* Dropdown menyu */}
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div
                className={cn(
                  "absolute right-0 top-full mt-1 w-52 z-50",
                  "bg-white rounded-xl border border-border shadow-card-md",
                  "animate-fade-in overflow-hidden",
                )}
              >
                {/* Profil sarlavhasi */}
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {fullName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.phone}
                  </p>
                </div>

                {/* Panellarga O'tish (Faqat Admin/Manager uchun) */}
                {(user?.roleName === 'admin' || user?.roleName === 'manager') && (
                  <div className="p-1 border-b border-border">
                    <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Panellarga o'tish
                    </div>
                    <button onClick={() => { navigate('/dashboard'); setMenuOpen(false); }} className="w-full text-left px-3 py-2 flex items-center gap-2.5 rounded-lg hover:bg-secondary transition-colors">
                      <span className="text-emerald-500">🛡️</span> <span className="text-sm font-medium text-foreground">Boshqaruv (Admin)</span>
                    </button>
                    <button onClick={() => { navigate('/student-portal'); setMenuOpen(false); }} className="w-full text-left px-3 py-2 flex items-center gap-2.5 rounded-lg hover:bg-secondary transition-colors">
                      <span className="text-cyan-500">🎓</span> <span className="text-sm font-medium text-foreground">O'quvchi Portali</span>
                    </button>
                    <button onClick={() => { navigate('/parent-portal'); setMenuOpen(false); }} className="w-full text-left px-3 py-2 flex items-center gap-2.5 rounded-lg hover:bg-secondary transition-colors">
                      <span className="text-indigo-500">👥</span> <span className="text-sm font-medium text-foreground">Ota-ona Portali</span>
                    </button>
                  </div>
                )}
                {/* Amallar */}
                <div className="p-1">
                  <button
                    onClick={handleLogout}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm",
                      "text-destructive hover:bg-destructive/10 transition-colors",
                    )}
                  >
                    <LogOut className="w-4 h-4" />
                    Chiqish
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
