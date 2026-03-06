import { useEffect, useState } from "react";
import { Search, Plus, FileDown } from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { financeService, type Payment } from "@/services/finance.service";
import { documentService } from "@/services/document.service";
import { PaymentModal } from "./PaymentModal";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page] = useState(1);

  // Modal State
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);

  // Auth & RBAC — faqat admin va menejer to'lov qabul qila oladi
  const { user } = useAuthStore();
  const activeRole = user?.roleName || (user as any)?.role;
  const canAcceptPayment =
    activeRole && ["admin", "manager"].includes(activeRole);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await financeService.getPayments({ page, limit: 20 });
      setPayments(data.data);
    } catch (_error) {
      // Error is handled by API interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">To'lovlar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Moliyaviy tranzaksiyalar tarixi
          </p>
        </div>
        {canAcceptPayment && (
          <button
            onClick={() => setPaymentModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            To'lov qabul qilish
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Talaba nomi..."
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Talaba
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Summa
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Usul
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Oy
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Sana
                </th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                  Hujjat
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground border border-dashed rounded-xl"
                  >
                    To'lovlar mavjud emas
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr
                    key={p.id}
                    className={cn(
                      "hover:bg-muted/30 transition-colors",
                      p.isOptimistic &&
                        "opacity-60 animate-pulse bg-brand-50/30",
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground flex items-center gap-2">
                        {p.studentName}
                        {p.isOptimistic && (
                          <span
                            className="w-2 h-2 rounded-full bg-amber-500"
                            title="Progressda..."
                          ></span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {p.groupName} ({p.courseName})
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-xs font-medium",
                          p.paymentMethod === "Naqd"
                            ? "bg-gray-100 text-gray-700"
                            : p.paymentMethod === "Karta"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-violet-100 text-violet-700",
                        )}
                      >
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs font-medium">
                      {new Date(p.paymentMonth).toLocaleDateString("uz-UZ", {
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-[150px]">
                      {formatDate(p.paymentDate)}
                      <div className="text-[10px] text-muted-foreground/60 mt-0.5 flex items-center gap-1">
                        Kassir: {p.receivedByName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() =>
                          documentService.downloadPaymentReceipt(p.id)
                        }
                        className="p-2 h-8 w-8 rounded-lg hover:bg-brand-50 text-brand-600 transition-colors flex items-center justify-center mx-auto"
                        title="Kvitansiyani yuklab olish"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={(optimisticData) => {
          if (optimisticData) {
            setPayments((prev) => [optimisticData, ...prev]);
          } else {
            fetchPayments();
          }
        }}
        onErrorAction={(optimisticId) => {
          setPayments((prev) => prev.filter((p) => p.id !== optimisticId));
        }}
        studentId={null}
      />
    </div>
  );
}
