import { useState, useEffect } from "react";
import {
  Banknote,
  Calendar,
  AlertCircle,
  Loader2,
  Gem,
  TrendingUp,
  Award,
  BookOpenCheck,
  ChevronRight,
  Gift
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { useUiStore } from "@/store/ui.store";

// Mock Data Interfaces
interface ChildProfile {
  id: number;
  name: string;
  course: string;
  level: number;
  xp: number;
  diamonds: number;
  attendance: number; // percentage
  status: 'excellent' | 'good' | 'needs_attention';
  nextGoal: string;
  goalCost: number;
  homeworkRate: number;
}

export default function ParentPortal() {
  const [loading, setLoading] = useState(true);
  const [activeChildIdx, setActiveChildIdx] = useState(0);
  const { addToast } = useUiStore();

  // Mock Data for "WOW" UI presentation
  const mockChildren: ChildProfile[] = [
    {
      id: 1,
      name: "Aliyev Vali",
      course: "Frontend Dasturlash (ReactJS)",
      level: 4,
      xp: 450,
      diamonds: 1800,
      attendance: 98,
      status: 'excellent',
      nextGoal: "Clean Code kitobi",
      goalCost: 2000,
      homeworkRate: 95
    },
    {
      id: 2,
      name: "Aliyeva Malika",
      course: "Grafik Dizayn (Adobe)",
      level: 2,
      xp: 120,
      diamonds: 480,
      attendance: 85,
      status: 'needs_attention',
      nextGoal: "Maxsus SketchPad",
      goalCost: 800,
      homeworkRate: 70
    }
  ];

  const [childrenData] = useState<ChildProfile[]>(mockChildren);
  const [totalDebt] = useState(0); // Mocking 0 debt for success state

  useEffect(() => {
    // Simulating API load
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
      </div>
    );
  }

  const activeChild = childrenData[activeChildIdx];
  const diamondsNeeded = Math.max(0, activeChild.goalCost - activeChild.diamonds);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* 💥 MULTI-CHILD SELECTOR 💥 */}
      <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4 bg-white/60 dark:bg-slate-900/40 p-3 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md shadow-sm w-full md:w-max mx-auto md:mx-0 overflow-x-auto">
        {childrenData.map((child, idx) => (
          <button
            key={child.id}
            onClick={() => setActiveChildIdx(idx)}
            className={`flex items-center gap-3 px-5 py-2.5 sm:px-6 sm:py-3 rounded-[1.5rem] font-bold transition-all duration-300 w-full sm:w-auto ${activeChildIdx === idx
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_8px_20px_rgba(99,102,241,0.3)] scale-100 sm:scale-105'
              : 'bg-white/50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
          >
            <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center ${activeChildIdx === idx ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400'}`}>
              👨‍🎓
            </div>
            <span className="truncate">{child.name.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* 🚀 COMMAND CENTER HERO 🚀 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Main Child Stats Card (Glassmorphism) */}
        <div className="lg:col-span-8 relative group overflow-hidden rounded-[2.5rem] p-[2px]">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 via-purple-500 to-fuchsia-600 rounded-[2.5rem] opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] animate-[shimmer_3s_infinite] pointer-events-none"></div>

          <div className="relative h-full bg-[#080b14]/95 backdrop-blur-3xl rounded-[2.4rem] p-8 md:p-10 shadow-2xl overflow-hidden flex flex-col justify-between">

            <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-400/30 transition-colors duration-700 mix-blend-screen"></div>
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-fuchsia-500/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-fuchsia-400/30 transition-colors duration-700 mix-blend-screen"></div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
              <div className="break-words w-full">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 tracking-tight leading-tight">
                  {activeChild.name}
                </h2>
                <p className="text-indigo-400 font-semibold tracking-wide flex items-center gap-2 text-sm md:text-base">
                  <BookOpenCheck className="w-5 h-5 flex-shrink-0" /> <span className="truncate whitespace-normal">{activeChild.course}</span>
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex items-center gap-4 self-start w-full md:w-auto">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-[1rem] flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] rotate-3 flex-shrink-0">
                  <Gem className="w-6 h-6 md:w-8 md:h-8 text-white drop-shadow-sm animate-pulse" />
                </div>
                <div>
                  <p className="text-white/60 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1">To'plangan Kumush</p>
                  <p className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-200">{activeChild.diamonds}</p>
                </div>
              </div>
            </div>

            {/* Child KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
              {/* KPI 1 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="text-white/70 font-bold text-xs md:text-sm truncate">O'zlashtirish</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-black text-white">{activeChild.homeworkRate}%</span>
                  <span className={`text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-md truncate ${activeChild.homeworkRate > 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {activeChild.status === 'excellent' ? "A'lo" : "E'tibor talab"}
                  </span>
                </div>
              </div>

              {/* KPI 2 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <span className="text-white/70 font-bold text-xs md:text-sm truncate">Davomat</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-black text-white">{activeChild.attendance}%</span>
                  <span className="text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 truncate">
                    Yaxshi
                  </span>
                </div>
              </div>

              {/* KPI 3 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  <span className="text-white/70 font-bold text-xs md:text-sm truncate">Bosqich (Level)</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-black text-white">{activeChild.level}</span>
                  <span className="text-xs md:text-sm font-bold text-indigo-400 truncate">/ {activeChild.xp} XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 🎯 GAMIFICATION SYNERGY (DO'KON MAQSADI) 🎯 */}
        <div className="lg:col-span-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-[2.5rem] p-8 shadow-[0_15px_35px_rgba(0,0,0,0.05)] flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-fuchsia-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-12 h-12 bg-fuchsia-100 dark:bg-fuchsia-900/30 rounded-[1.2rem] flex items-center justify-center">
              <Gift className="w-6 h-6 text-fuchsia-600 dark:text-fuchsia-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Kutilayotgan xarid</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-0.5">Bolaning maqsadi</p>
            </div>
          </div>

          <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50 relative z-10 flex flex-col justify-center items-center text-center">
            <h4 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">"{activeChild.nextGoal}"</h4>

            <div className="flex items-center gap-2 mb-6">
              <Gem className="w-4 h-4 text-cyan-500" />
              <span className="font-extrabold text-slate-800 dark:text-white text-xl">{activeChild.goalCost}</span>
            </div>

            {diamondsNeeded > 0 ? (
              <>
                <p className="text-sm text-slate-500 font-medium mb-4">
                  Kerakli miqdorga yana <strong className="text-cyan-600 dark:text-cyan-400">{diamondsNeeded} ta kumush</strong> yetishmayapti.
                </p>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-6 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-1000 relative"
                    style={{ width: `${(activeChild.diamonds / activeChild.goalCost) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
                  </div>
                </div>
                <button
                  onClick={() => addToast({ title: "To'lov ustuni", description: "Farzandingiz hisobini to'ldirish bo'limi tayyorlanmoqda.", type: "info" })}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
                >
                  Yordam berish (Balansni to'ldirish)
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </>
            ) : (
              <div className="w-full p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl border border-emerald-200 dark:border-emerald-800 flex flex-col items-center">
                <div className="text-3xl mb-2">🎉</div>
                <p className="text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                  Tabriklaymiz! Kumushlar miqdori yetarli.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 💳 FINANCE AND ATTRIBUTE ROW 💳 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Financial Status */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 flex-shrink-0 rounded-[1rem] flex items-center justify-center shadow-inner ${totalDebt > 0 ? 'bg-rose-100 dark:bg-rose-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
              <Banknote className={`w-6 h-6 ${totalDebt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-0.5">Joriy to'lov holati</h3>
              <p className="text-xs text-slate-500 font-medium">
                {totalDebt > 0 ? "Oylik to'lovni amalga oshirish kerak" : "Barcha to'lovlar qilingan. Rahmat!"}
              </p>
            </div>
          </div>
          <div className="text-left md:text-right w-full md:w-auto mt-2 md:mt-0 p-4 md:p-0 bg-slate-50 md:bg-transparent rounded-xl md:rounded-none">
            <p className={`text-xl md:text-2xl font-black ${totalDebt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {totalDebt > 0 ? formatCurrency(totalDebt) : "Qarz yo'q"}
            </p>
          </div>
        </div>

        {/* Immediate Actions / Alerts */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-[2.5rem] p-6 md:p-8 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 group">
          <div className="flex items-center gap-4 w-full">
            <div className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shadow-inner">
              <AlertCircle className="w-6 h-6 md:w-7 md:h-7 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white mb-1">E'tibor qiling</h3>
              <p className="text-slate-500 font-medium text-xs md:text-sm max-w-sm">
                Bugun soat 15:00 da ochiq dars bo'lib o'tadi.
              </p>
            </div>
            <button
              onClick={() => addToast({ title: "Batafsil ma'lumot", description: "Ushbu ma'lumotning batafsil qismi yuklanmoqda...", type: "info" })}
              className="hidden sm:flex flex-shrink-0 w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => addToast({ title: "Batafsil ma'lumot", description: "Ushbu ma'lumotning batafsil qismi yuklanmoqda...", type: "info" })}
            className="sm:hidden w-full h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
          >
            <span className="text-sm font-bold opacity-80 mr-2">Batafsil ko'rish</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* 📅 TIMELINE: UY VAZIFALARI VA DAVOMAT 📅 */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-[2.5rem] p-6 md:p-8 shadow-[0_15px_35px_rgba(0,0,0,0.04)] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 bg-emerald-100 dark:bg-emerald-900/30 rounded-[1rem] md:rounded-[1.2rem] flex items-center justify-center">
              <BookOpenCheck className="w-5 h-5 md:w-6 md:h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tight">So'nggi 7 kundagi natijalar</h3>
              <p className="text-slate-500 font-medium text-xs md:text-sm mt-0.5">Davomat va Uy vazifalarining topshirilishi</p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4 text-[10px] md:text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 p-3 md:px-4 md:py-2 rounded-xl flex-wrap">
            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Bajarilgan</span>
            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div> Bajarilmagan/Kelmadi</span>
          </div>
        </div>

        <div className="relative">
          {/* Base timeline line */}
          <div className="absolute top-[40px] md:top-1/2 md:-translate-y-1/2 left-6 md:left-0 w-1 md:w-full md:h-1 h-[calc(100%-80px)] md:h-auto bg-slate-200 dark:bg-slate-700/50 rounded-full z-0"></div>

          <div className="flex flex-col md:grid md:grid-cols-7 gap-6 md:gap-4 relative z-10 pl-2 md:pl-0">
            {[
              { day: "Dush", status: "success", type: "Dars & Vazifa" },
              { day: "Sesh", status: "none", type: "Dars yo'q" },
              { day: "Chor", status: "success", type: "Dars & Vazifa" },
              { day: "Pay", status: "none", type: "Dars yo'q" },
              { day: "Jum", status: "fail", type: "Vazifa qilmadi" },
              { day: "Shan", status: "none", type: "Dars yo'q" },
              { day: "Yak", status: "success", type: "Dars & Vazifa" }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-row md:flex-col items-center gap-4 md:gap-3 w-full group cursor-default">

                {/* On Mobile the day sits left, circle right next to it, then text. On desktop it's day-circle-text vertical. */}
                <div className="w-10 text-right md:w-auto md:text-center flex-shrink-0">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{item.day}</span>
                </div>

                <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center md:transition-transform md:group-hover:-translate-y-1 shadow-sm relative z-10 bg-white dark:bg-[#0f172a]
                        ${item.status === 'success' ? 'border-emerald-500 text-emerald-500'
                    : item.status === 'fail' ? 'border-rose-500 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                      : 'border-slate-200 dark:border-slate-700 text-transparent'}
                     `}>
                  {item.status === 'success' && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>}
                  {item.status === 'fail' && <div className="w-2 h-2 bg-rose-500 rounded-full"></div>}
                </div>

                <div className="flex-1 md:absolute md:top-full md:mt-2 w-max max-w-[120px] md:text-center md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  {item.status !== 'none' ? (
                    <span className={`text-[10px] md:text-[10px] font-bold px-2 py-1 rounded-md ${item.status === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                      {item.type}
                    </span>
                  ) : (
                    <span className="md:hidden text-[10px] text-slate-400 font-medium">Buxgalteriya</span> // or empty spacer
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
