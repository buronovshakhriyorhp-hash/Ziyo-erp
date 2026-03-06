import { useState, useEffect } from "react";
import {
    Gem,
    TrendingUp,
    Globe,
    Loader2,
    ListChecks,
    BookOpenCheck,
    Award,
    Star
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { lmsService, GamificationProfile } from "@/services/lms.service";

export default function StudentIndicators() {
    const { user } = useAuthStore();
    const [profile, setProfile] = useState<GamificationProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (!user?.id) return;
            setLoading(true);
            try {
                const profData = await lmsService.getProfile().catch(() => null);
                if (profData) setProfile(profData);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user?.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-brand-500 drop-shadow-[0_0_15px_rgba(14,165,233,0.5)]" />
            </div>
        );
    }

    // Stats Calcs
    const xp = profile?.xp || 159;
    const diamonds = xp * 4 || 636; // Mock logic 1 XP = 4 Diamonds
    const level = profile?.level || 0;
    const nextLevelXp = Math.max(100, Math.pow((level + 1) * 10, 2) || 200);
    const progressPercent = Math.min(100, (xp / nextLevelXp) * 100);

    // Mock Monitoring Data
    const monitoringData = [
        {
            id: 1,
            title: "Darsga ishtirok bo'yicha",
            xp: 45,
            diamonds: 180,
            icon: <ListChecks className="w-6 h-6 text-emerald-400" />
        },
        {
            id: 2,
            title: "Uyga vazifa bo'yicha",
            xp: 114,
            diamonds: 456,
            icon: <BookOpenCheck className="w-6 h-6 text-blue-400" />
        }
    ];

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 h-full overflow-y-auto custom-scrollbar">

            {/* 🔥 PREMIUM HEADER 🔥 */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
                <div className="relative z-10">
                    <div className="w-16 h-2 bg-gradient-to-r from-brand-400 to-cyan-400 rounded-full mb-4"></div>
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500 dark:from-white dark:to-slate-400 tracking-tight drop-shadow-sm">
                        Mening natijalarim
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">O'qish davomida yig'ilgan shaxsiy yutuqlar portfoliosi</p>
                </div>

                <div className="relative group cursor-default">
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative flex items-center gap-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl px-8 py-5 rounded-[2rem] border border-slate-200/80 dark:border-slate-800/80 shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                        <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform duration-500 rotate-6">
                            <Gem className="w-7 h-7 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400 dark:text-slate-500">Jami Kumushlar</span>
                            <span className="font-black text-3xl text-slate-800 dark:text-white drop-shadow-sm">{diamonds}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                {/* 💥 EPIC PROGRESS CARD 💥 */}
                <div className="xl:col-span-5 relative group overflow-hidden rounded-[2.5rem] p-[2px]">
                    {/* Animated Gradient Border */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-[2.5rem] opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] animate-[shimmer_3s_infinite] pointer-events-none"></div>

                    <div className="relative h-full bg-[#0a0f23]/95 backdrop-blur-3xl rounded-[2.4rem] p-8 md:p-10 shadow-2xl overflow-hidden flex flex-col justify-between">
                        {/* Background Orbs */}
                        <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-500/20 rounded-full blur-[80px] mix-blend-screen transition-colors duration-700 group-hover:bg-emerald-400/30 pointer-events-none"></div>
                        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-cyan-500/20 rounded-full blur-[80px] mix-blend-screen transition-colors duration-700 group-hover:bg-cyan-400/30 pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col items-center text-center justify-center gap-6 mb-12 flex-1">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full border-4 border-emerald-500/30 border-dashed flex items-center justify-center animate-[spin_10s_linear_infinite]"></div>
                                <div className="absolute inset-0 m-auto w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(52,211,153,0.4)] z-10">
                                    <span className="text-4xl font-black text-white">{level}</span>
                                </div>
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 border border-emerald-500/50 px-4 py-1 rounded-full z-20 whitespace-nowrap">
                                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest text-[10px]">Bosqich</span>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                            <div className="flex items-end justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-emerald-400" />
                                    <span className="font-bold text-white tracking-wide">Joriy XP</span>
                                </div>
                                <span className="text-2xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.6)]">
                                    {xp} <span className="text-xs font-semibold text-emerald-600">/ {nextLevelXp}</span>
                                </span>
                            </div>

                            {/* High-End Progress Bar */}
                            <div className="h-5 w-full bg-black/50 rounded-full overflow-hidden mb-3 relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] border border-white/5">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 rounded-full relative shadow-[0_0_20px_rgba(52,211,153,0.8)] transition-all duration-1000 bg-[length:200%_auto] animate-[gradient_2s_linear_infinite]"
                                    style={{ width: `${progressPercent}%` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                                    <div className="absolute right-0 top-0 bottom-0 w-3 bg-white rounded-full blur-[3px]"></div>
                                </div>
                            </div>
                            <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-widest mt-4">
                                <TrendingUp className="w-3.5 h-3.5 inline-block mr-1 text-emerald-500" />
                                Keyingi darajagacha {nextLevelXp - xp} XP
                            </p>
                        </div>
                    </div>
                </div>

                {/* 📊 MONITORING SECTION 📊 */}
                <div className="xl:col-span-7 flex flex-col gap-6">
                    <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-[2.5rem] p-8 shadow-xl flex-1 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                        <div className="flex items-center gap-4 mb-8 relative z-10 border-b border-slate-200/50 dark:border-slate-800/50 pb-6">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
                                <Award className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Yig'ilgan natijalar monitoringi</h3>
                                <p className="text-slate-500 font-medium text-sm mt-1">Sizning faolligingiz yuzasidan batafsil hisobot</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 relative z-10 flex-1">
                            {monitoringData.map((item, idx) => (
                                <div key={item.id} className="group relative bg-white/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50 rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-brand-500/10 hover:-translate-y-1">
                                    <div className={`absolute left-0 top-0 bottom-0 w-2 rounded-l-3xl transition-all duration-300 group-hover:w-3 ${idx === 0 ? 'bg-emerald-400' : 'bg-blue-400'}`}></div>

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pl-4">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-[1.2rem] bg-white dark:bg-slate-900 shadow-inner flex items-center justify-center border border-slate-100 dark:border-slate-800">
                                                {item.icon}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 dark:text-white text-lg mb-1">{item.title} xulosasi</h4>
                                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Jami qatnashishlar bo'yicha</span>
                                            </div>
                                        </div>

                                        <div className="flex sm:flex-col items-center sm:items-end gap-4 sm:gap-2 bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-2">
                                                <Globe className="w-4 h-4 text-emerald-500" />
                                                <span className="text-slate-500 dark:text-slate-400 font-semibold text-sm">XP:</span>
                                                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{item.xp}</span>
                                            </div>
                                            <div className="hidden sm:block w-full h-[1px] bg-slate-200 dark:bg-slate-700/50"></div>
                                            <div className="flex items-center gap-2">
                                                <Gem className="w-4 h-4 text-cyan-500" />
                                                <span className="text-slate-500 dark:text-slate-400 font-semibold text-sm">Kumush:</span>
                                                <span className="text-lg font-black text-cyan-600 dark:text-cyan-400">{item.diamonds}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Total Summary Footer */}
                        <div className="mt-8 bg-slate-800 dark:bg-slate-950 rounded-3xl p-6 relative z-10 overflow-hidden border border-slate-700 dark:border-slate-900 shadow-xl">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-500/10 to-transparent translate-x-[-100%] animate-[shimmer_4s_infinite]"></div>
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <Star className="w-6 h-6 text-yellow-500 fill-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                                    <span className="font-bold text-white tracking-widest uppercase">Jami yig'ilgan statistika</span>
                                </div>
                                <div className="flex bg-slate-900/80 rounded-2xl border border-slate-700 divide-x divide-slate-700 overflow-hidden">
                                    <div className="px-6 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors cursor-default">
                                        <Globe className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]" />
                                        <span className="font-extrabold text-white text-xl">{xp}</span>
                                    </div>
                                    <div className="px-6 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors cursor-default">
                                        <Gem className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]" />
                                        <span className="font-extrabold text-white text-xl">{diamonds}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
