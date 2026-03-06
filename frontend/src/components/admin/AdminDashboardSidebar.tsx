import { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
    Home,
    Users,
    Briefcase,
    Layers,
    ShoppingBag,
    BarChart4,
    Settings,
    ShieldAlert,
    ChevronLeft,
    ChevronRight,
    Fingerprint
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

interface MenuItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    path: string;
    badge?: string;
}

const menuItems: MenuItem[] = [
    { id: 'home', label: "Boshqaruv Markazi", icon: <Home size={22} />, path: '/dashboard' },
    { id: 'groups', label: "Guruhlar", icon: <Layers size={22} />, path: '/academic/groups' },
    { id: 'students', label: "O'quvchilar", icon: <Users size={22} />, path: '/students' },
    { id: 'teachers', label: "O'qituvchilar", icon: <Briefcase size={22} />, path: '/finance/salaries' },
    { id: 'shop', label: "Do'kon Boshqaruvi", icon: <ShoppingBag size={22} />, path: '/admin/shop', badge: 'NEW' },
    { id: 'reports', label: "Hisobotlar", icon: <BarChart4 size={22} />, path: '/analytics' },
    { id: 'audit', label: "Harakatlar jurnali", icon: <ShieldAlert size={22} />, path: '/audit' },
    { id: 'Users', label: "Tizim foydalanuvchilari", icon: <Fingerprint size={22} />, path: '/users' },
    { id: 'settings', label: "Sozlamalar", icon: <Settings size={22} />, path: '/settings' },
];

interface Props {
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
}

export const AdminDashboardSidebar: React.FC<Props> = ({ isMobileOpen, onMobileClose }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showPanelMenu, setShowPanelMenu] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const user = useAuthStore(s => s.user);

    const isActive = (path: string): boolean => {
        if (path === '/dashboard' && location.pathname === '/dashboard') return true;
        if (path !== '/dashboard' && location.pathname.startsWith(path)) return true;
        return false;
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
                                <ShieldAlert className="w-5 h-5 text-white drop-shadow-sm" />
                            </div>
                        </div>

                        <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
                            <p className="text-sm font-bold text-white whitespace-nowrap">Administrator</p>
                            <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest whitespace-nowrap">Admin Portali</p>
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
                <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1.5 relative z-10 custom-scrollbar">
                    {menuItems.map((item) => {
                        const active = isActive(item.path);

                        return (
                            <div key={item.id} className="relative group">
                                <div
                                    className={`absolute inset-0 rounded-[14px] transition-all duration-300 ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                    style={{
                                        background: active
                                            ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.05) 100%)'
                                            : 'rgba(255, 255, 255, 0.03)',
                                        border: active ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                                    }}
                                />

                                <Link
                                    to={item.path}
                                    onClick={onMobileClose}
                                    className={`relative w-full flex items-center gap-3 px-4 py-[14px] rounded-[14px] font-medium transition-all duration-300 z-10
                  ${active ? 'text-white translate-x-1 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'text-slate-400 hover:text-white hover:translate-x-1'}`}
                                >
                                    {/* Active Indicator Line */}
                                    <div
                                        className={`absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full transition-all duration-300 bg-gradient-to-b from-emerald-400 to-cyan-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]
                    ${active ? 'h-6 w-1' : 'h-0 w-0'}`}
                                    />

                                    {/* Icon */}
                                    <div
                                        className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-500 group-hover:rotate-6 group-hover:scale-110
                    ${active ? 'text-emerald-400 bg-emerald-500/10 shadow-inner' : 'text-slate-400 group-hover:text-emerald-400'}`}
                                    >
                                        {item.icon}
                                    </div>

                                    {/* Label & Badge */}
                                    <div className={`flex items-center justify-between overflow-hidden transition-all duration-300 flex-1 whitespace-nowrap ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'}`}>
                                        <span className="truncate text-sm tracking-wide">{item.label}</span>
                                        {item.badge && (
                                            <span
                                                className={`px-2 py-0.5 text-[9px] font-black rounded-full ml-2 uppercase tracking-widest
                        ${item.badge === 'NEW'
                                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                        : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
                                            >
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>
                                </Link>

                                {/* Tooltip */}
                                {isCollapsed && (
                                    <div className="absolute left-[80px] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-xl border border-slate-700 flex items-center gap-2">
                                        {item.icon} {item.label}
                                        <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-800 border-l border-b border-slate-700 rotate-45"></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className={`relative border-t border-white/5 bg-black/20 p-4 transition-all duration-300 overflow-visible whitespace-nowrap ${isCollapsed ? 'opacity-0 h-0 p-0' : 'opacity-100'}`}>
                    {showPanelMenu && !isCollapsed && (
                        <div className="absolute bottom-[calc(100%+8px)] left-4 w-60 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 z-50 py-2">
                            <div className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 mb-2">
                                Panellarga o'tish
                            </div>
                            <button onClick={() => { navigate('/dashboard'); setShowPanelMenu(false); }} className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors">
                                <span className="text-emerald-400">🛡️</span> <span className="text-sm font-bold text-slate-300">Boshqaruv (Admin)</span>
                            </button>
                            <button onClick={() => { navigate('/student-portal'); setShowPanelMenu(false); }} className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors">
                                <span className="text-blue-400">🎓</span> <span className="text-sm font-bold text-slate-300">O'quvchi Portali</span>
                            </button>
                            <button onClick={() => { navigate('/teacher-portal'); setShowPanelMenu(false); }} className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors">
                                <span className="text-amber-400">👨‍🏫</span> <span className="text-sm font-bold text-slate-300">Ustoz Portali</span>
                            </button>
                            <button onClick={() => { navigate('/parent-portal'); setShowPanelMenu(false); }} className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors">
                                <span className="text-purple-400">👥</span> <span className="text-sm font-bold text-slate-300">Ota-ona Portali</span>
                            </button>
                        </div>
                    )}
                    <div
                        onClick={() => setShowPanelMenu(!showPanelMenu)}
                        className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3 cursor-pointer hover:bg-white/10 transition-colors"
                    >
                        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs shadow-inner uppercase font-black text-slate-300">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm font-bold text-white truncate">{user?.firstName} {user?.lastName}</span>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest truncate">{user?.roleName}</span>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default AdminDashboardSidebar;
