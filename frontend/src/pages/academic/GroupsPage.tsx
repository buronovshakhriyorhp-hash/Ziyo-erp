import { useState, useEffect } from "react";
import {
  BookOpen,
  Users,
  Plus,
  Search,
  Edit3,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  academicService,
  type Group,
  type PaginatedResponse,
} from "@/services/academic.service";
import { useApi } from "@/hooks/useApi";
import { GroupModal } from "./GroupModal";

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
  });
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const { execute, loading } = useApi<PaginatedResponse<Group>>();

  const fetchGroups = async (page = 1) => {
    const res = await execute(() =>
      academicService.getGroups({
        page,
        limit: 12,
        search: search || undefined,
      }),
    );
    if (res) {
      setGroups(res.data || []);
      setMeta(res.pagination || { total: 0, page: 1, limit: 12, totalPages: 1 });
    }
  };

  useEffect(() => {
    fetchGroups(meta.page);
  }, [meta.page, search]); // eslint-disable-line

  const handleCreate = () => {
    setSelectedGroup(null);
    setIsModalOpen(true);
  };

  const handleEdit = (group: Group) => {
    if (!group) return;
    setSelectedGroup(group);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    fetchGroups(meta.page);
    setIsModalOpen(false);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return {
          label: "Faol",
          icon: CheckCircle2,
          color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
          glow: "group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
        };
      case "recruiting":
        return {
          label: "Qabul",
          icon: Users,
          color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
          glow: "group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
        };
      case "completed":
        return {
          label: "Tugagan",
          icon: BookOpen,
          color: "text-slate-400 bg-slate-500/10 border-slate-500/20",
          glow: ""
        };
      default:
        return {
          label: status,
          icon: AlertCircle,
          color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
          glow: ""
        };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 p-4 md:p-8">

      {/* 🚀 HEADER & STATS BAR 🚀 */}
      <div className="flex flex-col xl:flex-row gap-6 justify-between border border-white/10 bg-[#0d1321] p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-center">
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-2">Guruhlar <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Boshqaruvi</span></h1>
          <p className="text-slate-400 text-lg font-medium">Barcha o'quv guruhlarini bir joydan nazorat qiling</p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-4 items-center">
          <div className="bg-black/40 border border-white/5 rounded-2xl px-6 py-4 flex flex-col">
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Jami Guruhlar</span>
            <span className="text-3xl font-black text-white">{meta.total}</span>
          </div>

          <button
            onClick={handleCreate}
            className="h-[84px] px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-3 active:scale-95 group border border-white/10"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            Noldan Qo'shish
          </button>
        </div>
      </div>

      {/* 🔍 FILTERS & SEARCH 🔍 */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Guruh nomi yoki o'qituvchini izlash..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setMeta((p) => ({ ...p, page: 1 }));
            }}
            className="w-full pl-12 pr-4 py-4 rounded-full border border-white/10 bg-[#131b2f] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex items-center gap-2 px-6 py-4 rounded-full bg-[#131b2f] border border-white/10 text-slate-300 hover:text-white transition-colors font-medium">
            <Filter className="w-4 h-4" />
            Filtrlar
          </button>
        </div>
      </div>

      {/* 💎 PREMIUM GRID 💎 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading && groups.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-slate-400 font-medium">Guruhlar yuklanmoqda...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              <BookOpen className="w-10 h-10 text-slate-600" />
            </div>
            <p className="text-xl font-black text-white tracking-tight mb-2">Guruhlar topilmadi</p>
            <p className="text-sm text-slate-500 font-medium max-w-sm">Qidiruv bo'yicha yoki tizimda umuman guruhlar yo'q. Yangi guruh qo'shing.</p>
          </div>
        ) : (
          groups.map((g) => {
            const fill = Math.round(((g.currentStudents || 0) / (g.maxStudents || 1)) * 100);
            const statusConfig = getStatusConfig(g.status || "active");
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={g.id}
                className={cn("group flex flex-col relative bg-[#131b2f]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 hover:-translate-y-2 transition-all duration-500", statusConfig.glow)}
              >
                {/* Status & Options */}
                <div className="flex items-start justify-between mb-6">
                  <div className={cn("px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border flex items-center gap-2", statusConfig.color)}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusConfig.label}
                  </div>
                  <button
                    onClick={() => handleEdit(g)}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                {/* Main Info */}
                <div className="mb-6 flex-1">
                  <h3 className="text-xl font-black text-white mb-2 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-indigo-400 transition-all">
                    {g.name || "Nomsiz Guruh"}
                  </h3>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2 text-sm font-medium text-slate-400">
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      {g.courseName || "Kurs biriktirilmagan"}
                    </p>
                    <p className="flex items-center gap-2 text-sm font-medium text-slate-400">
                      <Users className="w-4 h-4 text-emerald-400" />
                      {g.teacherName || "O'qituvchi yo'q"}
                    </p>
                    <p className="flex items-center gap-2 text-sm font-medium text-slate-400">
                      <Clock className="w-4 h-4 text-amber-400" />
                      {g.startTime} - {g.endTime}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div className="w-full bg-black/40 rounded-2xl p-4 border border-white/5">
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-slate-500 uppercase tracking-widest">Bandlik</span>
                    <span className="text-white">
                      {g.currentStudents || 0} / {g.maxStudents || 0}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden relative">
                    <div
                      className={cn(
                        "absolute top-0 left-0 h-full rounded-full transition-all duration-1000",
                        fill >= 100 ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" :
                          fill >= 80 ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      )}
                      style={{ width: `${Math.min(fill, 100)}% ` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 🧭 PAGINATION 🧭 */}
      {meta.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-4">
          <button
            onClick={() => setMeta((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
            disabled={meta.page === 1}
            className="px-6 py-3 rounded-full border border-white/10 bg-[#131b2f] hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold text-white transition-colors"
          >
            Orqaga
          </button>
          <div className="px-6 py-3 rounded-full bg-black/40 border border-white/5 text-sm font-black text-white tracking-widest">
            {meta.page} <span className="text-slate-600 mx-1">/</span> {meta.totalPages}
          </div>
          <button
            onClick={() => setMeta((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
            disabled={meta.page >= meta.totalPages}
            className="px-6 py-3 rounded-full border border-white/10 bg-[#131b2f] hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold text-white transition-colors"
          >
            Oldinga
          </button>
        </div>
      )}

      {/* MODAL / DRAWER FALLBACK */}
      {isModalOpen && (
        <GroupModal
          group={selectedGroup}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
