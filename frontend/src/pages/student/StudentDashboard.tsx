import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Gem,
  TrendingUp,
  Globe,
  ChevronLeft,
  ChevronRight,
  Clock,
  BookOpen,
  Loader2,
  Zap,
  Target,
  Trophy
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { lmsService, GamificationProfile } from "@/services/lms.service";


// Types

export default function StudentDashboard() {
  const user = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const [profData] = await Promise.all([
          lmsService.getProfile().catch(() => null),
        ]);
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
  const xp = profile?.xp || 0;
  const diamonds = xp * 4 || 636; // Mock logic
  const level = profile?.level || 0;
  const nextLevelXp = Math.max(100, Math.pow((level + 1) * 10, 2) || 200);
  const progressPercent = Math.min(100, ((xp || 159) / nextLevelXp) * 100);

  // Calendar Logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthNames = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Mock schedule data based on requested UI
  const upcomingLessons = [
    { title: "NodeJS & Express Asoslari", time: "11:30 - 12:30", type: "exam", icon: <Zap className="w-5 h-5 text-amber-500" /> },
    { title: "React Router & State", time: "08:30 - 11:30", type: "lesson", icon: <Target className="w-5 h-5 text-blue-500" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* 💥 HERO WIDGETS SECTION 💥 */}
      <div className="flex flex-col lg:flex-row gap-8 items-stretch">

        {/* 🔥 PREMIUM KUMUSHLAR CARD 🔥 */}
        <div className="flex-1 relative group overflow-hidden rounded-[2.5rem] p-1">
          {/* Animated Gradient Border */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-[2.5rem] opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] animate-[shimmer_3s_infinite] pointer-events-none"></div>

          <div className="relative h-full bg-[#0a0f23]/90 dark:bg-[#0a0f23]/95 backdrop-blur-3xl rounded-[2.4rem] p-8 md:p-10 shadow-2xl overflow-hidden flex flex-col justify-between">

            {/* Background Glow Orbs */}
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-[80px] group-hover:bg-cyan-400/30 transition-colors duration-700 mix-blend-screen pointer-events-none"></div>
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-500/20 rounded-full blur-[80px] group-hover:bg-purple-400/30 transition-colors duration-700 mix-blend-screen pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div className="text-center md:text-left">
                <h3 className="text-cyan-400 font-bold tracking-widest uppercase text-xs mb-2 flex flex-col md:flex-row items-center md:justify-start justify-center gap-2">
                  <Trophy className="w-4 h-4" /> Yig'ilgan boylik
                </h3>
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 drop-shadow-sm tracking-tighter">
                    {diamonds}
                  </h2>
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.4)] group-hover:scale-110 transition-transform duration-500 rotate-3 group-hover:rotate-6">
                    <Gem className="w-6 h-6 md:w-8 md:h-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] animate-pulse" />
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md self-center md:self-auto w-full md:w-max flex flex-col items-center md:items-start text-center md:text-left">
                <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center justify-center md:justify-start gap-1.5"><Globe className="w-3.5 h-3.5 text-emerald-400" /> Joriy XP</p>
                <p className="text-xl font-bold text-white shadow-sm">{xp || 159} <span className="text-white/40 text-sm font-medium">XP</span></p>
              </div>
            </div>

            {/* Progress Section */}
            <div className="relative z-10 bg-white/5 border border-white/10 rounded-[2rem] p-5 md:p-6 lg:p-8 backdrop-blur-xl group-hover:bg-white/10 transition-colors duration-500">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-0 mb-4 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white/60 text-[10px] md:text-[11px] font-bold uppercase tracking-wider">Bosqich (Level)</p>
                    <p className="text-xl md:text-2xl font-black text-white">{level}</p>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                    {xp || 159} / {nextLevelXp}
                  </span>
                </div>
              </div>

              {/* Progress Bar Extreme */}
              <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden mb-6 flex shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-300 rounded-full relative shadow-[0_0_20px_rgba(52,211,153,0.6)] transition-all duration-1000 bg-[length:200%_auto] animate-[gradient_2s_linear_infinite]"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                  <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full blur-[2px]"></div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-3 text-[11px] md:text-sm font-medium text-white/70 bg-black/20 rounded-xl p-3 border border-white/5">
                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 flex-shrink-0">🏅</span>
                Sizning umumiy reytingdagi o'rningiz: <span className="text-white font-bold md:ml-auto">{user?.roleName === 'student' ? '7616' : '1'} - o'rin</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📅 DARS JADVALI V2 📅 */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
            <div className="w-2 h-5 sm:h-6 rounded-full bg-gradient-to-b from-brand-400 to-brand-600"></div>
            Dars jadvali
          </h3>
          <Link to="/student-portal/groups" className="text-sm font-bold text-brand-600 dark:text-brand-400 hover:underline">
            Barchasini ko'rish →
          </Link>
        </div>

        <div className="flex flex-col xl:flex-row gap-8 items-start w-full">

          {/* Glass Calendar Widget */}
          <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-[2.5rem] p-6 md:p-8 shadow-[0_20px_40px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.2)] backdrop-blur-2xl w-full xl:min-w-[400px] xl:w-auto relative overflow-hidden">
            {/* Soft decorative glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 md:mb-10 relative z-10 text-center sm:text-left">
              <h4 className="font-black text-slate-800 dark:text-white capitalize text-lg md:text-xl tracking-tight">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h4>
              <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                <button onClick={prevMonth} className="px-3 py-2 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-all shadow-sm">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={nextMonth} className="px-3 py-2 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-all shadow-sm">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-y-8 gap-x-2 text-center text-sm relative z-10">
              {['D', 'S', 'C', 'P', 'J', 'S', 'Y'].map((day, i) => (
                <div key={day} className={`font-black uppercase text-xs tracking-wider ${i > 4 ? 'text-rose-400' : 'text-slate-400/80 dark:text-slate-500'}`}>
                  {day}
                </div>
              ))}

              {Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const date = i + 1;
                // Mock dots for specific dates
                const hasDot = [5, 12, 19, 26].includes(date);
                const isActive = date === 5; // e.g. Selected day

                return (
                  <div key={date} className="relative flex justify-center items-center h-8 md:h-10 mt-1">
                    <button className={`w-9 h-9 md:w-11 md:h-11 flex items-center justify-center font-bold text-xs md:text-sm transition-all duration-300
                      ${isActive
                        ? 'bg-gradient-to-br from-brand-500 to-blue-600 text-white rounded-xl md:rounded-2xl shadow-[0_8px_20px_rgba(59,130,246,0.3)] scale-110'
                        : 'text-slate-700 dark:text-slate-300 rounded-xl md:rounded-2xl hover:bg-slate-100 hover:scale-110 dark:hover:bg-slate-800'
                      }
                    `}>
                      {date}
                    </button>
                    {hasDot && !isActive && (
                      <div className="absolute -bottom-1 md:-bottom-2 w-1.5 h-1.5 bg-brand-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Epic Lessons List Widget */}
          <div className="flex flex-col gap-4 md:gap-5 w-full xl:w-[450px]">
            {upcomingLessons.map((lesson, idx) => (
              <div
                key={idx}
                className="group relative bg-white/60 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-brand-500/10 hover:-translate-y-1 overflow-hidden backdrop-blur-xl flex gap-3 md:gap-5 items-center"
              >
                {/* Dynamic Type Gradient Line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-2.5 duration-300
                  ${idx === 0 ? 'bg-gradient-to-b from-amber-400 to-orange-500' : 'bg-gradient-to-b from-blue-400 to-cyan-500'}
                `}></div>

                <div className={`hidden sm:flex flex-col flex-shrink-0 relative ${idx === 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner">
                    {lesson.icon}
                  </div>
                  {idx === 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-ping"></span>
                  )}
                </div>

                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="font-bold text-slate-800 dark:text-white mb-1.5 truncate text-[15px] md:text-[17px]">
                    {lesson.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 md:gap-2.5 text-slate-500 dark:text-slate-400 text-xs md:text-sm font-semibold">
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-md md:rounded-lg mb-1 md:mb-0">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {lesson.time}
                    </div>
                    <span className="hidden md:inline">•</span>
                    <span className={`uppercase tracking-wider text-[9px] md:text-[11px] font-black px-2 py-0.5 rounded-md mb-1 md:mb-0 ${idx === 0 ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'}`}>
                      {idx === 0 ? 'MTI / EXAM' : 'DARS'}
                    </span>
                  </div>
                </div>

                <button className="w-8 h-8 md:w-10 md:h-10 flex shrink-0 items-center justify-center rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 group-hover:bg-slate-800 group-hover:text-white group-hover:border-slate-800 dark:group-hover:bg-white dark:group-hover:text-slate-900 transition-colors">
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            ))}

            {upcomingLessons.length === 0 && (
              <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-900/30">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-5 rotate-3">
                  <BookOpen className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <h4 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">Darslar mavjud emas</h4>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                  Ushbu sanada dars yoki imtihonlar belgilanganicha yo'q
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
