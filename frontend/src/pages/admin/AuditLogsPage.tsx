import { useState, useEffect } from "react";
import {
  Search,
  X,
  RefreshCw,
  Calendar as CalendarIcon,
  FileJson,
} from "lucide-react";
import { formatDateTime } from "@/utils/formatters";
import {
  auditService,
  type AuditLog,
  type PaginatedResponse,
} from "@/services/audit.service";
import { useApi } from "@/hooks/useApi";

// ── Helpers ───────────────────────────────────────────────
const ACTION_COLORS = {
  insert: "bg-emerald-100 text-emerald-700 border-emerald-200",
  update: "bg-blue-100 text-blue-700 border-blue-200",
  delete: "bg-red-100 text-red-700 border-red-200",
  login: "bg-violet-100 text-violet-700 border-violet-200",
};

const ACTION_LABELS = {
  insert: "Qo'shildi",
  update: "Tahrirlandi",
  delete: "O'chirildi",
  login: "Tizimga kirdi",
};

export default function AuditLogsPage() {
  // ── States ──────────────────────────────────────────────
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  });

  // Filters
  const [tableFilter, setTableFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [dateFilter, setDateFilter] = useState(""); // yyyy-mm-dd format

  // Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // API Call
  const { execute, loading } = useApi<PaginatedResponse<AuditLog>>();

  // ── Fetch Logic ─────────────────────────────────────────
  const fetchLogs = async (page = 1) => {
    const res = await execute(() =>
      auditService.getLogs({
        page,
        limit: 15,
        tableName: tableFilter || undefined,
        action: actionFilter || undefined,
        fromDate: dateFilter ? `${dateFilter}T00:00:00.000Z` : undefined,
        toDate: dateFilter ? `${dateFilter}T23:59:59.999Z` : undefined,
      }),
    );
    if (res) {
      setLogs(res.data);
      setMeta(res.meta);
    }
  };

  // Sahifa birinchi yuklanganda va filter/page o'zgarganda
  useEffect(() => {
    fetchLogs(meta.page);
  }, [meta.page, tableFilter, actionFilter, dateFilter]);

  // ── Handlers ────────────────────────────────────────────
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= meta.totalPages) {
      setMeta((p) => ({ ...p, page: newPage }));
    }
  };

  // ── Render ──────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Sahifa sarlavhasi */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tizim Audit Jurnali</h1>
          <p className="text-muted-foreground mt-1">
            Barcha ma'lumotlar o'zgarishi va tizimdagi harakatlar tarixi
          </p>
        </div>
        <button
          onClick={() => fetchLogs(meta.page)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg hover:bg-secondary transition-colors text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Yangilash
        </button>
      </div>

      {/* Filtrlash bloki */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
            Jadval nomi
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Jadval bo'yicha qidiruv (users, leads...)"
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-shadow"
              value={tableFilter}
              onChange={(e) => {
                setTableFilter(e.target.value);
                setMeta((p) => ({ ...p, page: 1 }));
              }}
            />
          </div>
        </div>

        <div className="w-full sm:w-[200px]">
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
            Harakat
          </label>
          <select
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setMeta((p) => ({ ...p, page: 1 }));
            }}
          >
            <option value="">Barchasi</option>
            <option value="insert">Qo'shildi</option>
            <option value="update">Tahrirlandi</option>
            <option value="delete">O'chirildi</option>
            <option value="login">Tizimga kirdi</option>
          </select>
        </div>

        <div className="w-full sm:w-[200px]">
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
            Sana
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setMeta((p) => ({ ...p, page: 1 }));
            }}
          />
        </div>
      </div>

      {/* Jadval qismi */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="px-5 py-3.5 font-medium border-b border-border">
                  Sana
                </th>
                <th className="px-5 py-3.5 font-medium border-b border-border">
                  Foydalanuvchi
                </th>
                <th className="px-5 py-3.5 font-medium border-b border-border">
                  Harakat
                </th>
                <th className="px-5 py-3.5 font-medium border-b border-border">
                  Jadval
                </th>
                <th className="px-5 py-3.5 font-medium border-b border-border text-right">
                  Batafsil
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading && logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-muted-foreground"
                  >
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Ma'lumotlar yuklanmoqda...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-muted-foreground"
                  >
                    Hozircha hech qanday log topilmadi
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-border" />
                        {formatDateTime(log.createdAt)}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-foreground">
                      {log.userFirstName} {log.userLastName}
                      <span className="text-xs text-muted-foreground font-normal ml-2 hidden sm:inline-block">
                        (ID: {log.userId})
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${ACTION_COLORS[log.action]}`}
                      >
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-secondary text-foreground px-2 py-1 rounded">
                          {log.tableName}
                        </span>
                        {log.recordId && (
                          <span className="text-muted-foreground text-xs">
                            #{log.recordId}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        <FileJson className="w-4 h-4" />
                        Ko'rish
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination qismi */}
        {meta.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-secondary/30">
            <span className="text-sm text-muted-foreground">
              Jami: <strong className="text-foreground">{meta.total}</strong> ta
              log (Sahifa {meta.page} / {meta.totalPages})
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(meta.page - 1)}
                disabled={meta.page === 1}
                className="px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed bg-card"
              >
                Oldingi
              </button>
              <button
                onClick={() => handlePageChange(meta.page + 1)}
                disabled={meta.page === meta.totalPages}
                className="px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed bg-card"
              >
                Keyingi
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── JSON Taqqoslash Modali ─────────────────────────────── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedLog(null)}
          />
          <div className="relative bg-card w-full max-w-5xl rounded-2xl shadow-modal flex flex-col max-h-full border border-border animate-fade-in-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${ACTION_COLORS[selectedLog.action]}`}
                  >
                    {ACTION_LABELS[selectedLog.action]}
                  </span>
                  Log Tafsilotlari
                </h3>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                  <span className="font-mono bg-secondary px-1.5 py-0.5 rounded text-xs">
                    {selectedLog.tableName}
                  </span>
                  tomonidan{" "}
                  <strong>
                    {selectedLog.userFirstName} {selectedLog.userLastName}
                  </strong>
                  • {formatDateTime(selectedLog.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable JSON View) */}
            <div className="overflow-y-auto p-6 flex-1 min-h-[300px]">
              {/* O'zgartirish (Update) yoki O'chirish (Delete) / Qo'shish (Insert) logika */}
              {selectedLog.action === "update" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Eski ma'lumot */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-red-600 mb-2 bg-red-50/50 p-2 border border-red-100 rounded-lg">
                      O'zgarishdan oldingi holat (Old Data)
                    </div>
                    <div className="bg-[#1e1e1e] rounded-xl p-4 overflow-x-auto shadow-inner text-xs sm:text-sm custom-scrollbar">
                      <pre className="text-red-400 font-mono leading-relaxed">
                        {JSON.stringify(selectedLog.oldData, null, 2) || "{}"}
                      </pre>
                    </div>
                  </div>
                  {/* Yangi ma'lumot */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 mb-2 bg-emerald-50/50 p-2 border border-emerald-100 rounded-lg">
                      Yangi holat (New Data)
                    </div>
                    <div className="bg-[#1e1e1e] rounded-xl p-4 overflow-x-auto shadow-inner text-xs sm:text-sm custom-scrollbar">
                      <pre className="text-emerald-400 font-mono leading-relaxed">
                        {JSON.stringify(selectedLog.newData, null, 2) || "{}"}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                /* Insert / Delete / Login uchun bitta oyna */
                <div className="max-w-3xl mx-auto space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 mb-2 bg-blue-50/50 p-2 border border-blue-100 rounded-lg">
                    Qayd ishi ma'lumotlari (Payload)
                  </div>
                  <div className="bg-[#1e1e1e] rounded-xl p-4 overflow-x-auto shadow-inner text-xs sm:text-sm custom-scrollbar">
                    <pre className="text-blue-400 font-mono leading-relaxed">
                      {JSON.stringify(
                        selectedLog.newData || selectedLog.oldData,
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                </div>
              )}

              {/* Qo'shimcha ma'lumot (IP/Agent) */}
              <div className="mt-8 border-t border-border pt-6 flex flex-wrap gap-4 text-xs text-muted-foreground bg-secondary/20 p-4 rounded-xl">
                <div className="flex-1 min-w-[200px]">
                  <strong className="block text-foreground mb-1 uppercase tracking-wider text-[10px]">
                    Record ID
                  </strong>
                  <span className="font-mono bg-white px-2 py-1 rounded shadow-sm border border-border">
                    #{selectedLog.recordId}
                  </span>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <strong className="block text-foreground mb-1 uppercase tracking-wider text-[10px]">
                    IP Manzil
                  </strong>
                  <span className="font-mono">
                    {selectedLog.ipAddress || "—"}
                  </span>
                </div>
                <div className="flex-2 min-w-[300px]">
                  <strong className="block text-foreground mb-1 uppercase tracking-wider text-[10px]">
                    User Agent
                  </strong>
                  <span className="break-all">
                    {selectedLog.userAgent || "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
