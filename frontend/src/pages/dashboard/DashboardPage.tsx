import { useState, useEffect } from "react";
import {
  GraduationCap,
  CreditCard,
  Phone,
  TrendingUp,
  CheckSquare,
  Clock,
  AlertTriangle,
  Loader2,
  Calendar,
  ArrowUpRight,
  Zap,
  Activity,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useApi } from "@/hooks/useApi";
import { useSocket } from "@/hooks/useSocket";
import {
  crmService,
  type Task,
  type PaginatedResponse,
} from "@/services/crm.service";
import {
  analyticsService,
  type FinancialSummary,
  type StudentStats,
} from "@/services/analytics.service";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatters";

const RECENT_ACTIVITIES = [
  { text: "Sarvar Toshmatov talabaga aylantirildi", time: "5 daqiqa oldin", status: "success" },
  { text: "Dastur yangilandi: ERP v2.0 reliz qilindi", time: "Kecha", status: "info" },
  { text: "Yangi lid qo'shildi: Malika Aliyeva", time: "2 soat oldin", status: "warning" },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const activeRole = user?.roleName || (user as any)?.role;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const { execute: fetchTasks, loading: tasksLoading } = useApi<PaginatedResponse<Task>>();
  const isAdminOrManager = activeRole === "admin" || activeRole === "manager";

  useEffect(() => {
    const loadDashboard = async () => {
      if (isAdminOrManager) {
        const res = await fetchTasks(() => crmService.getTasks({ limit: 10, isCompleted: false }));
        if (res) setTasks(res.data);
      }
    };
    loadDashboard();
  }, [activeRole]);

  useEffect(() => {
    const loadStats = async () => {
      if (!isAdminOrManager) {
        setStatsLoading(false);
        return;
      }
      setStatsLoading(true);
      try {
        const [fin, stu] = await Promise.all([
          analyticsService.getFinancialSummary(),
          analyticsService.getStudentStats(),
        ]);
        setSummary(fin);
        setStudentStats(stu);
      } catch { } finally {
        setStatsLoading(false);
      }
    };
    loadStats();
  }, [isAdminOrManager]);

  useSocket("PAYMENT_RECEIVED", () => {
    if (isAdminOrManager) analyticsService.getFinancialSummary().then(setSummary).catch(() => { });
  });

  const stats = isAdminOrManager
    ? [
      {
        id: "students",
        label: "Faol talabalar",
        icon: GraduationCap,
        color: "text-emerald-400",
        glow: "shadow-emerald-500/20",
        value: statsLoading ? "..." : (studentStats?.activeCount?.toString() ?? "—"),
      },
      {
        id: "revenue",
        label: "Bu oy daromad",
        icon: CreditCard,
        color: "text-purple-400",
        glow: "shadow-purple-500/20",
        value: statsLoading ? "..." : summary ? formatCurrency(summary.totalRevenue) : "—",
      },
      {
        id: "dept",
        label: "Debitorlik",
        icon: Phone,
        color: "text-rose-400",
        glow: "shadow-rose-500/20",
        value: statsLoading ? "..." : summary ? formatCurrency(summary.pendingDebt) : "—",
      },
      {
        id: "margin",
        label: "Foyda marjasi",
        icon: TrendingUp,
        color: "text-blue-400",
        glow: "shadow-blue-500/20",
        value: statsLoading ? "..." : summary ? `${summary.profitMargin}%` : "—",
      },
    ]
    : [
      {
        id: "students",
        label: "Faol talabalar",
        icon: GraduationCap,
        color: "text-emerald-400",
        glow: "shadow-emerald-500/20",
        value: statsLoading ? "..." : (studentStats?.activeCount?.toString() ?? "—"),
      },
    ];

  return (
    <div className="space-y-8 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-5 duration-700">

      {/* 🚀 COMMAND CENTER HERO 🚀 */}
      <div className="relative overflow-hidden rounded-[2rem] bg-[#0d1321]/90 backdrop-blur-3xl p-6 md:p-8 shadow-2xl border border-white/10 group">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none transition-transform group-hover:scale-110 duration-700 mix-blend-screen" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-cyan-500/20 blur-[100px] rounded-full pointer-events-none mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4 md:space-y-5 text-center md:text-left">
            <div className="inline-flex items-center justify-center md:justify-start gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] md:text-[11px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Zap className="w-3.5 h-3.5 fill-current animate-pulse" />
              <span>Tizim Faol: 100% Online</span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-lg">
              Xush kelibsiz, <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
                {user?.firstName ?? "Admin"}
              </span>
              ! 👋
            </h1>

            <p className="text-slate-400 text-xs md:text-sm max-w-lg font-medium tracking-wide mx-auto md:mx-0">
              ERP Tizimi to'liq nazoratingiz ostida. Barcha muhim ko'rsatkichlar jonli efirda yangilanmoqda.
            </p>
          </div>

          <div className="flex bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-md shadow-inner self-center md:self-auto w-full md:w-auto mt-4 md:mt-0">
            <div className="flex flex-col items-center justify-center p-3 bg-black/40 rounded-xl border border-white/5 w-full md:min-w-[100px]">
              <Calendar className="w-5 h-5 text-emerald-400 mb-1.5" />
              <span className="text-white font-black text-lg">{new Date().getDate()}</span>
              <span className="text-slate-500 uppercase text-[9px] font-bold tracking-widest text-center mt-1">
                {new Date().toLocaleDateString("uz-UZ", { month: "long" })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 GLOWING KPI METRICS 📊 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, idx) => (
          <div
            key={s.label}
            className="group relative overflow-hidden bg-[#131b2f]/80 backdrop-blur-xl border border-white/10 rounded-[1.2rem] p-4 transition-all duration-500 hover:-translate-y-1 hover:border-white/20 shadow-xl"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none", s.glow)} />

            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-start justify-between mb-6">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center bg-black/40 border border-white/5 shadow-inner transition-transform duration-500 group-hover:scale-105", s.glow)}>
                  <s.icon className={cn("w-6 h-6 drop-shadow-md", s.color)} />
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  <Activity className="w-3 h-3" /> Jonli
                </div>
              </div>

              <div>
                <p className="text-xl md:text-2xl font-black text-white tracking-tighter drop-shadow-md mb-0.5 truncate">
                  {s.value}
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {s.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── SPLIT VIEW ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* ⚡ RECENT ACTIVITY ⚡ */}
        <div className="xl:col-span-7 bg-[#131b2f]/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-black/20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">So'nggi faoliyat</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Tizimdagi so'nggi jarayonlar</p>
              </div>
            </div>
          </div>

          <div className="p-4 flex-1">
            {RECENT_ACTIVITIES.map((a, i) => (
              <div key={i} className="px-6 py-5 rounded-3xl flex items-center gap-6 hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group cursor-default mb-2">
                <div className={cn("w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center relative bg-black/40 border border-white/5",
                  a.status === "success" ? "text-emerald-400" : a.status === "warning" ? "text-amber-400" : "text-blue-400")}>
                  <div className={cn("absolute inset-0 rounded-2xl blur-md opacity-30 group-hover:animate-pulse",
                    a.status === "success" ? "bg-emerald-500" : a.status === "warning" ? "bg-amber-500" : "bg-blue-500")} />
                  <Activity className="w-5 h-5 relative z-10" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-white leading-snug tracking-tight group-hover:text-indigo-300 transition-colors">
                    {a.text}
                  </p>
                  <p className="text-[10px] font-black text-slate-500 mt-1.5 uppercase tracking-widest">
                    <Clock className="w-3 h-3 inline mr-1 text-slate-600" /> {a.time}
                  </p>
                </div>

                <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-all border border-transparent group-hover:border-indigo-500/30">
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 🎯 PENDING TASKS 🎯 */}
        {isAdminOrManager && (
          <div className="xl:col-span-5 bg-[#0a0f18]/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] pointer-events-none -mr-20 -mt-20"></div>

            <div className="px-8 py-6 border-b border-white/5 bg-black/40 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-[0.8rem] md:rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
                    <CheckSquare className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-black text-white tracking-tight">Kechikkan Vazifalar</h2>
                    <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Tezkor e'tibor talablari</p>
                  </div>
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center self-start sm:self-auto">
                  <span className="text-orange-400 font-black text-sm md:text-base">{tasks.length}</span>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3 relative z-10 h-[400px] overflow-y-auto custom-scrollbar">
              {tasks.length === 0 && !tasksLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                    <CheckSquare className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                  </div>
                  <p className="text-xl font-black text-white tracking-tight mb-2">Hamma ishlar bajarilgan!</p>
                  <p className="text-sm text-slate-500 font-medium max-w-[250px]">
                    Sizda hozircha aktiv yoki muddati o'tgan vazifalar yo'q.
                  </p>
                </div>
              ) : (
                tasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-[1.2rem] bg-black/40 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer group flex gap-3"
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 shadow-inner",
                      t.isOverdue ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20")}>
                      {t.isOverdue ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                      <p className="text-sm font-bold text-white leading-tight truncate group-hover:text-rose-400 transition-colors">
                        {t.title}
                      </p>
                      <div className="mt-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <span className={cn("px-2.5 py-1 rounded-md border",
                          t.isOverdue ? "border-rose-500/30 text-rose-400 bg-rose-500/10" : "border-white/10 text-slate-400 bg-black/50")}>
                          {t.dueDate ? new Date(t.dueDate).toLocaleDateString("uz-UZ") : "Muddatsiz"}
                        </span>
                        {t.isOverdue && <span className="text-rose-500 animate-pulse">Kechikmoqda!</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {tasksLoading && (
                <div className="absolute inset-0 bg-[#0a0f18]/80 backdrop-blur-sm flex items-center justify-center z-20">
                  <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
