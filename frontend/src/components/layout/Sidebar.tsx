import { useState } from "react";
import { type LucideIcon } from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UsersRound,
  GraduationCap,
  BookOpen,
  CreditCard,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  Phone,
  CheckSquare,
  Calendar,
  FileJson,
  LogOut,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { useAuth } from "@/hooks/useAuth";

// ── Nav items ──────────────────────────────────────────────
interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
  children?: { label: string; href: string; roles?: string[] }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "manager", "teacher"],
  },
  {
    label: "Mening portalim",
    href: "/student-portal",
    icon: GraduationCap,
    roles: ["student"],
  },
  {
    label: "Mening farzandlarim",
    href: "/parent-portal",
    icon: UsersRound,
    roles: ["parent"],
  },
  {
    label: "CRM",
    href: "/crm",
    icon: Phone,
    roles: ["admin", "manager"],
    children: [
      { label: "Lidlar", href: "/crm/leads" },
      { label: "Qo'ng'iroqlar", href: "/crm/calls" },
      { label: "Vazifalar", href: "/crm/tasks" },
    ],
  },
  {
    label: "Akademik",
    href: "/academic",
    icon: BookOpen,
    children: [
      {
        label: "Kurslar",
        href: "/academic/courses",
        roles: ["admin", "manager"],
      },
      {
        label: "Guruhlar",
        href: "/academic/groups",
        roles: ["admin", "manager"],
      },
      { label: "Darslar", href: "/academic/lessons" },
    ],
  },
  {
    label: "Talabalar",
    href: "/students",
    icon: GraduationCap,
    roles: ["admin", "manager", "teacher"],
  },
  {
    label: "O'qituvchilar",
    href: "/teachers",
    icon: UsersRound,
    roles: ["admin", "manager", "teacher"],
    children: [
      {
        label: "O'qituvchilar",
        href: "/teachers",
        roles: ["admin", "manager"],
      },
      { label: "Mening kabinetim", href: "/my-salary", roles: ["teacher"] },
      { label: "Vazifalar (LMS)", href: "/my-homeworks", roles: ["teacher", "admin", "manager"] },
    ],
  },
  {
    label: "Davomat",
    href: "/attendance",
    icon: CheckSquare,
    roles: ["admin", "manager", "teacher"],
  },
  {
    label: "Jadval",
    href: "/schedule",
    icon: Calendar,
    roles: ["admin", "manager", "teacher"],
  },
  {
    label: "Moliya",
    href: "/finance",
    icon: CreditCard,
    roles: ["admin", "manager"],
    children: [
      { label: "To'lovlar", href: "/finance/payments" },
      { label: "Qarzlar", href: "/finance/debts" },
      { label: "Xarajatlar", href: "/finance/expenses" },
      { label: "Oyliklar", href: "/finance/salaries" },
    ],
  },
  {
    label: "Hisobotlar",
    href: "/analytics",
    icon: BarChart3,
    roles: ["admin", "manager"],
  },
  {
    label: "Foydalanuvchilar",
    href: "/users",
    icon: Users,
    roles: ["admin"],
  },
  {
    label: "Tizim Auditi",
    href: "/audit",
    icon: FileJson,
    roles: ["admin"],
  },
  {
    label: "Sozlamalar",
    href: "/settings",
    icon: Settings,
    roles: ["admin"],
  },
];

// ── Sidebar component ─────────────────────────────────────
export function Sidebar() {
  const [showPanelMenu, setShowPanelMenu] = useState(false);
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);
  const user = useAuthStore((s) => s.user);
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const visibleItems = NAV_ITEMS.filter((item) => {
    const role = user?.roleName || (user as any)?.role;
    return !item.roles || (user && item.roles.includes(role));
  }).map((item) => {
    const newItem = { ...item };
    if (newItem.children) {
      newItem.children = newItem.children.filter((child) => {
        const role = user?.roleName || (user as any)?.role;
        return !child.roles || (user && child.roles.includes(role));
      });
    }
    return newItem;
  });

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-slate-950 border-r border-white/5",
        "transition-all duration-300 ease-in-out flex-shrink-0 relative overflow-hidden",
        collapsed ? "w-20" : "w-[280px]",
      )}
    >
      {/* Background pattern */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/10 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />

      {/* ── Logo ─────────────────── */}
      <div
        className={cn(
          "flex items-center gap-4 px-6 h-20 md:h-24 mb-2 flex-shrink-0 cursor-pointer group border-b border-white/[0.02]",
          collapsed && "justify-center px-0",
        )}
        onClick={() => navigate("/dashboard")}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center shadow-lg shadow-brand-500/20 transition-transform group-hover:scale-105 group-hover:rotate-3 border border-white/10">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <p className="text-white font-black text-xl tracking-tight leading-none">
              ZIYO
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-brand-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                ERP System
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation ───────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-4 space-y-2 custom-scrollbar">
        {visibleItems.map((item) => (
          <SidebarItem
            key={item.href}
            item={item}
            collapsed={collapsed}
            currentPath={location.pathname}
          />
        ))}
      </nav>

      {/* ── User & Logout ─────────── */}
      <div className="p-4 space-y-2 mt-auto relative">
        {showPanelMenu && !collapsed && (
          <div className="absolute bottom-[calc(100%+8px)] left-4 w-60 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 z-50 py-2">
            <div className="px-4 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 mb-2">
              Panellarga o'tish
            </div>
            <button onClick={() => { navigate('/dashboard'); setShowPanelMenu(false); }} className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors">
              <span className="text-brand-400">🛡️</span> <span className="text-sm font-bold text-gray-300">Boshqaruv (Admin)</span>
            </button>
            <button onClick={() => { navigate('/student-portal'); setShowPanelMenu(false); }} className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors">
              <span className="text-blue-400">🎓</span> <span className="text-sm font-bold text-gray-300">O'quvchi Portali</span>
            </button>
            <button onClick={() => { navigate('/parent-portal'); setShowPanelMenu(false); }} className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors">
              <span className="text-purple-400">👥</span> <span className="text-sm font-bold text-gray-300">Ota-ona Portali</span>
            </button>
          </div>
        )}
        {!collapsed && (
          <div
            onClick={() => setShowPanelMenu(!showPanelMenu)}
            className="p-4 rounded-[2rem] bg-white/[0.03] hover:bg-white/[0.06] transition-colors cursor-pointer border border-white/5 mb-4"
          >
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
              Foydalanuvchi
            </p>
            <p className="text-sm font-bold text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] font-bold text-brand-400 uppercase tracking-tighter mt-0.5">
              {user?.roleName}
            </p>
          </div>
        )}

        <button
          onClick={signOut}
          className={cn(
            "w-full h-12 flex items-center gap-3 px-4 rounded-2xl transition-all duration-200",
            "text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 group",
            collapsed && "justify-center",
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0 group-hover:-translate-x-1 transition-transform" />
          {!collapsed && (
            <span className="text-sm font-bold uppercase tracking-widest">
              Chiqish
            </span>
          )}
        </button>

        {/* ── Collapse toggle ───────── */}
        <button
          onClick={toggle}
          className={cn(
            "w-full h-12 flex items-center gap-3 px-4 rounded-2xl",
            "text-gray-500 hover:text-white hover:bg-white/[0.05]",
            "transition-all duration-200",
            collapsed && "justify-center",
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Yig'ish
              </span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

// ── Single nav item ───────────────────────────────────────
function SidebarItem({
  item,
  collapsed,
  currentPath,
}: {
  item: NavItem;
  collapsed: boolean;
  currentPath: string;
}) {
  const hasChildren = item.children && item.children.length > 0;
  const isActive = currentPath.startsWith(item.href);

  if (hasChildren && !collapsed) {
    return (
      <div className="space-y-1 mb-4">
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <item.icon
            className={cn(
              "w-4 h-4 flex-shrink-0",
              isActive ? "text-brand-400" : "text-gray-600",
            )}
          />
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
            {item.label}
          </span>
        </div>
        <div className="space-y-1 pl-4 border-l border-white/[0.03] ml-6">
          {item.children!.map((child) => (
            <NavLink
              key={child.href}
              to={child.href}
              className={({ isActive }) =>
                cn(
                  "flex h-10 items-center px-4 rounded-xl text-[13px] font-medium transition-all duration-200",
                  isActive
                    ? "text-brand-400 bg-brand-500/10 shadow-[inset_2px_0_0_0_rgba(16,185,129,1)]"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]",
                )
              }
            >
              <span className="truncate">{child.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    );
  }

  return (
    <NavLink
      to={item.href}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          "flex h-[44px] items-center gap-3.5 px-4 rounded-xl transition-all duration-300 group relative",
          isActive
            ? "bg-gradient-to-r from-brand-600 to-brand-500/80 text-white shadow-md shadow-brand-500/20"
            : "text-gray-400 hover:text-white hover:bg-white/[0.04]",
          collapsed && "justify-center px-0 h-12 rounded-2xl",
        )
      }
    >
      <item.icon
        className={cn(
          "w-[18px] h-[18px] flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
          collapsed && "w-6 h-6",
        )}
      />
      {!collapsed && (
        <span className="text-[14px] font-medium tracking-wide">
          {item.label}
        </span>
      )}
      {isActive && !collapsed && (
        <Sparkles className="absolute right-4 w-3.5 h-3.5 text-white/50 animate-pulse" />
      )}
    </NavLink>
  );
}
