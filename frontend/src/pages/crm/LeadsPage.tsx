import { useState, useEffect } from "react";
import { Phone, Plus, Search, UserCheck, ArrowRight } from "lucide-react";
import { crmService, type Lead } from "@/services/crm.service";
import { formatDate, formatPhone, getStatusColor } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { useUiStore } from "@/store/ui.store";
import { LeadDetailsModal } from "./LeadDetailsModal";
import { useSocket } from "@/hooks/useSocket";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [statuses, setStatuses] = useState<Array<{ id: number; name: string }>>(
    [],
  );
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusId, setStatusId] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);

  // Modal state
  const [detailsModal, setDetailsModal] = useState<{
    isOpen: boolean;
    leadId: number | null;
    leadName: string | null;
  }>({
    isOpen: false,
    leadId: null,
    leadName: null,
  });

  const { user } = useAuthStore();
  const { addToast } = useUiStore();
  const canConvert = user && ["admin", "manager"].includes(user.roleName);

  useEffect(() => {
    const loadStatuses = async (): Promise<void> => {
      try {
        const data = await crmService.getStatuses();
        setStatuses(data);
      } catch (_error) {
        console.error("Lid statuslarini yuklashda xato", _error);
        addToast({
          title: "Xatolik",
          description: "Statuslar roʻyxatini yuklashda xato yuz berdi",
          type: "error",
        });
      }
    };

    void loadStatuses();
  }, [addToast]);

  // Jonli yangilanish (Yangi lid tushganda orqadan qo'shish)
  useSocket("NEW_LEAD", (newLead) => {
    addToast({
      title: "Yangi lid!",
      description: `${newLead.fullName} tomonidan yangi murojaat tushdi.`,
      type: "success",
    });
    if (page === 1) {
      setLeads((prev) => [newLead, ...prev]);
      setTotal((t) => t + 1);
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      const loadLeads = async (): Promise<void> => {
        setLoading(true);
        try {
          const result = await crmService.getLeads({
            search,
            statusId,
            page,
            limit: 20,
          });
          setLeads(result.data);
          setTotal(result.pagination.total);
        } catch (_error) {
          console.error("Lidlar roʻyxatini yuklashda xato", _error);
          addToast({
            title: "Xatolik",
            description: "Lidlar roʻyxatini yuklashda xato yuz berdi",
            type: "error",
          });
        } finally {
          setLoading(false);
        }
      };

      void loadLeads();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, statusId, page, addToast]);

  const handleConvert = async (id: number) => {
    if (!confirm("Lidni talabaga aylantirmoqchimisiz?")) return;
    try {
      const result = await crmService.convertToStudent(id);
      addToast({
        title: "Muvaffaqiyat!",
        description: `Lid talabaga aylantirildi. Vaqtinchalik parol: ${result.tempPassword}`,
        type: "success",
      });
      // Sahifani yangilash
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...result.lead } : l)),
      );
    } catch (err: any) {
      addToast({
        title: "Xatolik",
        description:
          err?.response?.data?.message || "Konversiya paytida xato ro'y berdi",
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Lidlar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Jami {total} ta lid
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Yangi lid
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Ism, telefon yoki kurs..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Status:</span>
          <select
            value={statusId ?? ""}
            onChange={(e) => {
              setStatusId(e.target.value ? Number(e.target.value) : undefined);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-w-[150px]"
            aria-label="Lid statusi bo‘yicha filtrlash"
          >
            <option value="">Barcha statuslar</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Ism va Kurs
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Telefon
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Menejer
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Qo'shilgan
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <Phone className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Lidlar topilmadi
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {lead.fullName}
                        {lead.studentId && (
                          <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                            Talaba
                          </span>
                        )}
                      </div>
                      {lead.courseInterest && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Qiziqishi: {lead.courseInterest}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatPhone(lead.phone)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          getStatusColor(lead.statusName ?? ""),
                        )}
                      >
                        {lead.statusName ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {lead.assignedName ?? "Hali biriktirilmagan"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {!lead.studentId && canConvert && (
                          <button
                            onClick={() => handleConvert(lead.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            title="Talabaga aylantirish"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Aylantirish
                          </button>
                        )}
                        <button
                          onClick={() =>
                            setDetailsModal({
                              isOpen: true,
                              leadId: lead.id,
                              leadName: lead.fullName,
                            })
                          }
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title="Batafsil ma'lumot"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {total} ta natijadan {Math.min(page * 20, total)} ta
              ko'rsatilmoqda
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Oldingi
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 20 >= total}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Keyingi
              </button>
            </div>
          </div>
        )}
      </div>

      <LeadDetailsModal
        isOpen={detailsModal.isOpen}
        onClose={() =>
          setDetailsModal({ isOpen: false, leadId: null, leadName: null })
        }
        leadId={detailsModal.leadId}
        leadName={detailsModal.leadName}
      />
    </div>
  );
}
