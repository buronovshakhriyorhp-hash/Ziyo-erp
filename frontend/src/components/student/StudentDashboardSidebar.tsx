import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import {
  Home,
  CreditCard,
  Users,
  TrendingUp,
  Star,
  ShoppingBag,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  GraduationCap
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: string;
  emoji?: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'home',
    label: "Bosh sahifa",
    icon: <Home size={22} />,
    path: '/student-portal',
    emoji: '🏠',
  },
  {
    id: 'payments',
    label: "To'lovlarim",
    icon: <CreditCard size={22} />,
    path: '/student-portal/payments',
    emoji: '💳',
  },
  {
    id: 'groups',
    label: "Guruhlarim",
    icon: <Users size={22} />,
    path: '/student-portal/groups',
    emoji: '👥',
  },
  {
    id: 'analytics',
    label: "Ko'rsatkichlarim",
    icon: <TrendingUp size={22} />,
    path: '/student-portal/analytics',
    emoji: '📊',
  },
  {
    id: 'rating',
    label: 'Reyting',
    icon: <Star size={22} />,
    path: '/student-portal/rating',
    emoji: '⭐',
  },
  {
    id: 'homeworks',
    label: "Vazifalarim",
    icon: <BookOpen size={22} />,
    path: '/student-portal/homeworks',
    emoji: '📝',
    badge: 'NEW',
  },
  {
    id: 'store',
    label: "Do'kon",
    icon: <ShoppingBag size={22} />,
    path: '/student-portal/shop',
    emoji: '🛍️',
    badge: 'NEW',
  },
  {
    id: 'extra-lessons',
    label: "Qo'shimcha darslar",
    icon: <BookOpen size={22} />,
    path: '/student-portal/extra-lessons',
    emoji: '📚',
    badge: 'Beta',
  },
  {
    id: 'settings',
    label: 'Sozlamalar',
    icon: <Settings size={22} />,
    path: '/student-portal/settings',
    emoji: '⚙️',
  },
];

interface Props {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const StudentDashboardSidebar: React.FC<Props> = ({ isMobileOpen, onMobileClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showPanelMenu, setShowPanelMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const isAdmin = user?.roleName === 'admin' || user?.roleName === 'manager';

  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed md:relative top-0 left-0 h-screen overflow-hidden border-r border-white/10 bg-gradient-to-b from-slate-900 via-[#18231c] to-slate-900 backdrop-blur-lg transition-all duration-500 ease-in-out z-50 flex flex-col w-72 md:w-auto
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'md:w-24' : 'md:w-72'}
        `}
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(6, 78, 59, 0.85) 50%, rgba(15, 23, 42, 0.95) 100%)',
        }}
      >
        {/* Glassmorphism Border Glow */}
        <div className="absolute inset-0 rounded-r-3xl bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Header */}
        <div
          className={`flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-6 backdrop-blur-md transition-all duration-500 ${isCollapsed ? 'flex-col gap-4' : ''}`}
        >
          <div className="flex items-center gap-3 relative z-10">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur-md opacity-60 animate-pulse" />
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl border border-white/20">
                <GraduationCap className="w-5 h-5 text-white drop-shadow-sm" />
              </div>
            </div>

            <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
              <p className="text-sm font-bold text-white whitespace-nowrap">O'quvchi</p>
              <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest whitespace-nowrap">O'quvchi Portali</p>
            </div>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="relative p-2 rounded-xl transition-all duration-300 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-emerald-400 hover:text-emerald-300 hover:scale-105 active:scale-95 z-10"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-6 space-y-2 relative z-10 custom-scrollbar">
          {menuItems.map((item) => {
            const active = isActive(item.path);

            return (
              <div key={item.id} className="relative group">
                {/* Glassmorphism Active Background */}
                <div
                  className={`absolute inset-0 rounded-xl transition-all duration-300 ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  style={{
                    background: active
                      ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                />

                <button
                  onClick={() => {
                    handleNavigation(item.path);
                    if (onMobileClose) onMobileClose();
                  }}
                  className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 z-10
                  ${active ? 'text-white translate-x-1' : 'text-white/70 hover:text-white hover:translate-x-1'}`}
                >
                  {/* Active Indicator Line */}
                  <div
                    className={`absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full transition-all duration-300 bg-gradient-to-b from-brand-400 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]
                    ${active ? 'h-6 w-1' : 'h-0 w-0'}`}
                  />

                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 group-hover:rotate-6 group-hover:scale-110
                    ${active ? 'text-cyan-300 bg-cyan-500/20 shadow-sm' : 'text-white/60 group-hover:text-cyan-400'}`}
                  >
                    {item.icon}
                  </div>

                  {/* Label & Badge */}
                  <div className={`flex items-center justify-between overflow-hidden transition-all duration-300 flex-1 whitespace-nowrap ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'}`}>
                    <span className="truncate text-[14px]">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full ml-2 shadow-sm
                        ${item.badge === 'Beta' || item.badge === 'NEW'
                            ? 'bg-gradient-to-r from-brand-500/30 to-blue-500/30 text-brand-300 border border-brand-500/50'
                            : 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-300 border border-amber-500/50'}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-[80px] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-xl border border-white/10 flex items-center gap-2">
                    {item.icon} {item.label}
                    <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-800 border-l border-b border-white/10 rotate-45"></div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={`relative border-t border-white/5 bg-white/5 p-4 backdrop-blur-md transition-all duration-300 overflow-visible whitespace-nowrap ${isCollapsed ? 'opacity-0 h-0 p-0' : 'opacity-100'}`}>

          {showPanelMenu && !isCollapsed && isAdmin && (
            <div className="absolute bottom-[calc(100%+8px)] left-4 w-60 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 z-50 py-2">
              <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 mb-2">
                Panellarga o'tish
              </div>
              <button onClick={() => { navigate('/dashboard'); setShowPanelMenu(false); }} className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-white/10 transition-colors">
                <span className="text-emerald-400">🛡️</span> <span className="text-sm font-bold text-slate-300">Boshqaruv (Admin)</span>
              </button>
              <button onClick={() => { navigate('/student-portal'); setShowPanelMenu(false); }} className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-white/10 transition-colors">
                <span className="text-cyan-400">🎓</span> <span className="text-sm font-bold text-slate-300">O'quvchi Portali</span>
              </button>
              <button onClick={() => { navigate('/teacher-portal'); setShowPanelMenu(false); }} className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-white/10 transition-colors">
                <span className="text-amber-400">👨‍🏫</span> <span className="text-sm font-bold text-slate-300">Ustoz Portali</span>
              </button>
              <button onClick={() => { navigate('/parent-portal'); setShowPanelMenu(false); }} className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-white/10 transition-colors">
                <span className="text-indigo-400">👥</span> <span className="text-sm font-bold text-slate-300">Ota-ona Portali</span>
              </button>
            </div>
          )}

          <div onClick={() => isAdmin && setShowPanelMenu(!showPanelMenu)} className={`flex items-center gap-3 ${isAdmin ? 'cursor-pointer hover:bg-white/10 rounded-xl p-2 -m-2 transition-colors' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs">🎓</div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white/90">Ziyo Chashmasi</span>
              <span className="text-[10px] font-semibold text-brand-400">Student Portal v2.0</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default StudentDashboardSidebar;
