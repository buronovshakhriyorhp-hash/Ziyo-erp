import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ParentDashboardSidebar } from './ParentDashboardSidebar';
import { useAuthStore } from '@/store/auth.store';
import { Bell, Menu, Search, UserCircle, LogOut, Settings } from 'lucide-react';
import { useState } from 'react';

export const ParentDashboardLayout: React.FC = () => {
    const user = useAuthStore(s => s.user);
    const logout = useAuthStore(s => s.logout);
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

    // Route-to-Title mapping for the header
    const getHeaderInfo = () => {
        switch (location.pathname) {
            case '/parent-portal':
                return 'Ota-ona Boshqaruvi';
            case '/parent-portal/children':
                return 'Farzandlarim';
            case '/parent-portal/finances':
                return "To'lovlar tarixi";
            case '/parent-portal/market':
                return "Do'kon va Yutuqlar";
            case '/parent-portal/settings':
                return 'Sozlamalar';
            default:
                return 'Portal';
        }
    };

    return (
        <div className="flex bg-[#0f172a] min-h-screen font-sans text-slate-300 overflow-hidden font-inter selection:bg-emerald-500/30">
            {/* Background elements */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-900/10 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-900/10 blur-[100px]" />
                <div className="absolute top-[40%] right-[20%] w-[20%] h-[20%] rounded-full bg-blue-900/10 blur-[80px]" />
            </div>

            <ParentDashboardSidebar isMobileOpen={isMobileMenuOpen} onMobileClose={() => setIsMobileMenuOpen(false)} />

            <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
                {/* Header */}
                <header className="h-16 md:h-20 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 md:px-8 transition-all duration-300 z-30 sticky top-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-2 -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <Menu size={24} />
                        </button>
                        <h1 className="text-lg md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
                            {getHeaderInfo()}
                        </h1>
                    </div>

                    <div className="flex items-center gap-2 md:gap-5">
                        <div className="hidden lg:flex items-center bg-black/20 border border-white/5 rounded-full px-4 py-2 drop-shadow-sm group hover:border-white/10 transition-colors w-64 focus-within:w-80 focus-within:border-emerald-500/50">
                            <Search className="text-slate-500 group-focus-within:text-emerald-400 transition-colors w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Qidirish..."
                                className="bg-transparent border-none outline-none text-sm text-white px-3 w-full placeholder-slate-600 transition-all"
                            />
                        </div>

                        <button className="relative p-2 md:p-2.5 rounded-full bg-black/20 hover:bg-white/5 border border-white/5 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-400 transition-all group">
                            <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <Bell className="w-5 h-5 relative z-10" />
                            <span className="absolute top-1 md:top-1.5 right-1 md:right-1.5 w-2 h-2 md:w-2.5 md:h-2.5 bg-rose-500 border-2 border-[#0f172a] rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)] z-20"></span>
                        </button>

                        <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block"></div>

                        {/* User Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                className="flex items-center gap-3 p-1.5 md:p-2 rounded-full hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-white leading-none">{user?.firstName}</p>
                                    <p className="text-[10px] font-medium text-emerald-400 uppercase tracking-widest mt-1">Ota-Ona</p>
                                </div>
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center p-[2px] shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                    <div className="w-full h-full bg-[#0f172a] rounded-full flex items-center justify-center border border-emerald-500/50">
                                        <UserCircle className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
                                    </div>
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileDropdownOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsProfileDropdownOpen(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-48 bg-[#1e293b] rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                                        <div className="p-4 border-b border-white/5 sm:hidden">
                                            <p className="text-sm font-bold text-white">{user?.firstName} {user?.lastName}</p>
                                            <p className="text-[10px] font-medium text-emerald-400 uppercase tracking-widest mt-1">Ota-Ona</p>
                                        </div>
                                        <div className="p-2">
                                            <button
                                                onClick={() => {
                                                    setIsProfileDropdownOpen(false);
                                                    navigate('/parent-portal/settings');
                                                }}
                                                className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors flex items-center gap-2"
                                            >
                                                <Settings className="w-4 h-4" /> Sozlamalar
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsProfileDropdownOpen(false);
                                                    logout();
                                                    navigate('/login');
                                                }}
                                                className="w-full text-left px-3 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors flex items-center gap-2 mt-1"
                                            >
                                                <LogOut className="w-4 h-4" /> Tizimdan chiqish
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-transparent px-4 md:px-8 pb-8 custom-scrollbar">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default ParentDashboardLayout;
