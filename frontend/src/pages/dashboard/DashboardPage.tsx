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
      <div className="relative overflow-hidden rounded-2xl bg-card p-6 md:p-8 shadow-sm border border-border group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Tizim Faol: 100% Online</span>
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
              Xush kelibsiz, <br className="hidden sm:block" />
              <span className="text-brand-600 dark:text-brand-400">
                {user?.firstName ?? "Admin"}
              </span>
              ! 👋
            </h1>

            <p className="text-muted-foreground text-sm max-w-lg mx-auto md:mx-0">
              ERP Tizimi to'liq nazoratingiz ostida. Barcha ko'rsatkichlar real vaqt rejimida yangilanmoqda.
            </p>
          </div>

          <div className="flex bg-muted/50 border border-border p-3 rounded-2xl self-center md:self-auto w-full md:w-auto mt-4 md:mt-0">
            <div className="flex flex-col items-center justify-center p-4 bg-background rounded-xl border border-border w-full md:min-w-[120px] shadow-sm">
              <Calendar className="w-5 h-5 text-brand-500 mb-2" />
              <span className="text-foreground font-bold text-2xl">{new Date().getDate()}</span>
              <span className="text-muted-foreground uppercase text-xs font-semibold tracking-wider mt-1">
                {new Date().toLocaleDateString("uz-UZ", { month: "short" })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 KPI METRICS 📊 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((s, idx) => (
          <div
            key={s.label}
            className="group relative overflow-hidden bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="flex flex-col h-full justify-between gap-4">
              <div className="flex items-start justify-between">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center bg-muted border border-border transition-colors", s.color.replace('text-', 'bg-').replace('400', '50').replace('500', '50'))}>
                  <s.icon className={cn("w-6 h-6", s.color.replace('400', '600').replace('text-white', 'text-gray-900'))} />
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md">
                  <Activity className="w-3 h-3" /> Jonli
                </div>
              </div>

              <div>
                <p className="text-2xl font-bold text-foreground tracking-tight mb-1 truncate">
                  {s.value}
                </p>
                <p className="text-sm font-medium text-muted-foreground">
                  {s.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── SPLIT VIEW ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* ⚡ RECENT ACTIVITY ⚡ */}
        <div className="xl:col-span-7 bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">So'nggi faoliyat</h2>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">Tizimdagi jarayonlar tarixi</p>
              </div>
            </div>
          </div>

          <div className="p-4 flex-1">
            {RECENT_ACTIVITIES.map((a, i) => (
              <div key={i} className="px-5 py-4 rounded-xl flex items-center gap-4 hover:bg-muted/50 transition-colors group cursor-default mb-2 border border-transparent">
                <div className={cn("w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center",
                  a.status === "success" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" :
                    a.status === "warning" ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" :
                      "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400")}>
                  <Activity className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-snug">
                    {a.text}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {a.time}
                  </p>
                </div>

                <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-brand-50 hover:text-brand-600 transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 🎯 PENDING TASKS 🎯 */}
        {isAdminOrManager && (
          <div className="xl:col-span-5 bg-card rounded-2xl shadow-sm border border-border flex flex-col">
            <div className="px-6 py-5 border-b border-border bg-muted/30">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
                    <CheckSquare className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Kechikkan Vazifalar</h2>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">Tezkor e'tibor talablari</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-bold flex items-center justify-center">
                  <span>{tasks.length}</span>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-2 relative h-[400px] overflow-y-auto custom-scrollbar">
              {tasks.length === 0 && !tasksLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
                    <CheckSquare className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="text-lg font-bold text-foreground mb-1">Engil nafas oling!</p>
                  <p className="text-sm text-muted-foreground max-w-[250px]">
                    Sizda hozircha aktiv yoki muddati o'tgan vazifalar yo'q.
                  </p>
                </div>
              ) : (
                tasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl bg-background border border-border hover:border-brand-200 transition-all cursor-pointer group flex gap-4 shadow-sm"
                  >
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105",
                      t.isOverdue ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400")}>
                      {t.isOverdue ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                      <p className="text-sm font-semibold text-foreground leading-tight truncate">
                        {t.title}
                      </p>
                      <div className="mt-1.5 text-xs text-muted-foreground font-medium flex items-center gap-2">
                        <span>
                          {t.dueDate ? new Date(t.dueDate).toLocaleDateString("uz-UZ") : "Muddatsiz"}
                        </span>
                        {t.isOverdue && <span className="text-rose-600 dark:text-rose-400 font-semibold">• Kechikmoqda</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {tasksLoading && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-20">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
