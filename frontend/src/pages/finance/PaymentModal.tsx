import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/common/Modal";
import { financeService } from "@/services/finance.service";
import { useUiStore } from "@/store/ui.store";
import { formatCurrency } from "@/utils/formatters";
import { CreditCard, Banknote, Landmark, Wallet } from "lucide-react";

// Backend DTO
// { enrollmentId, studentId, paymentMethodId, amount, paymentMonth, paymentDate?, description? }

const paymentSchema = z.object({
  enrollmentId: z.coerce.number().min(1, "Guruhni tanlang"),
  paymentMethodId: z.coerce.number().min(1, "To'lov usulini tanlang"),
  amount: z.coerce.number().min(100, "Summani to'g'ri kiriting"),
  paymentMonth: z.string().min(1, "Oy ni tanlang"),
  description: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (optimisticData?: any) => void;
  onErrorAction?: (optimisticId: number) => void;
  studentId: number | null;
}

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  onErrorAction,
  studentId,
}: PaymentModalProps) {
  const [loading] = useState(false);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [balance, setBalance] = useState<{
    totalPaid: number;
    totalDebt: number;
    balance: number;
  } | null>(null);
  const { addToast } = useUiStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema) as any,
    defaultValues: {
      amount: 0,
      paymentMonth: new Date().toISOString().substring(0, 7) + "-01",
      enrollmentId: 0,
      paymentMethodId: 0,
      description: "",
    },
  });

  useEffect(() => {
    if (isOpen && studentId) {
      // Load student balance
      financeService
        .getStudentBalance(studentId)
        .then(setBalance)
        .catch(() => {});
      // Load enrollments for this student (mocking API for now if needed, or implement it)
      // Temporarily mock unless you have the endpoint:
      setEnrollments([
        {
          id: 1,
          groupName: "Ingliz tili - Boshlangich",
          courseName: "Kids English",
        },
        {
          id: 2,
          groupName: "Matematika - Abituriyent",
          courseName: "Matematika",
        },
      ]);
      // If only one enrollment, auto select it
      setValue("enrollmentId", 1);
    } else {
      reset();
      setBalance(null);
    }
  }, [isOpen, studentId, reset, setValue]);

  const onSubmit = async (data: PaymentFormValues) => {
    if (!studentId) return;

    // ── OPTIMISTIC UI: Dastlabki soxta ma'lumotni tayyorlaymiz va UI ni yangilaymiz ──
    const selectedGroup = enrollments.find(
      (e) => e.id === Number(data.enrollmentId),
    );
    const optimisticId = Date.now();
    const optimisticPayment = {
      id: optimisticId,
      studentName: "Siz (Tasdiqlanmoqda...)",
      groupName: selectedGroup?.groupName || "Guruh",
      courseName: selectedGroup?.courseName || "Kurs",
      amount: data.amount,
      paymentMethod:
        data.paymentMethodId == 1
          ? "Naqd"
          : data.paymentMethodId == 2
            ? "Karta"
            : "Bank",
      paymentMonth: data.paymentMonth,
      paymentDate: new Date().toISOString(),
      receivedByName: "Kutish...",
      isOptimistic: true, // UI da xira/spinner ko'rsatish uchun flag
    };

    // Modalni darhol yopamiz va ota komponentdagi jadvalga soxta to'lovni qo'shamiz
    onClose();
    onSuccess(optimisticPayment);

    try {
      await financeService.makePayment({
        studentId,
        enrollmentId: data.enrollmentId,
        paymentMethodId: data.paymentMethodId,
        amount: data.amount,
        paymentMonth: data.paymentMonth,
        description: data.description,
      });

      addToast({
        title: "Muvaffaqiyat!",
        description: "To'lov muvaffaqiyatli qabul qilindi",
        type: "success",
      });
      // API tugagach rostdan fetch qilish uchun yuboramiz (optimisticId siriysiz)
      onSuccess();
    } catch (error: any) {
      addToast({
        title: "Xatolik ro'y berdi",
        description:
          error?.response?.data?.message ||
          "Qandaydir xato ro'y berdi. To'lov bekor qilindi.",
        type: "error",
      });
      // Agar API xato qilsa, soxta to'lovni o'chirib tashlaymiz
      if (onErrorAction) onErrorAction(optimisticId);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="To'lov qabul qilish">
      <div className="space-y-6">
        {balance && (
          <div className="bg-muted/50 p-4 rounded-xl border flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Joriy qarzdorlik
              </p>
              <p
                className={`text-xl font-bold ${balance.balance < 0 ? "text-red-600" : "text-emerald-600"}`}
              >
                {formatCurrency(Math.abs(balance.balance))}{" "}
                {balance.balance < 0 ? " qarz" : " xaqdor"}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-background border flex items-center justify-center">
              <Wallet className="w-6 h-6 text-brand-600" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">
              Guruhni tanlang *
            </label>
            <select
              {...register("enrollmentId")}
              className={`w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${errors.enrollmentId ? "border-red-500" : "border-input"}`}
            >
              <option value="">Tanlang...</option>
              {enrollments.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.groupName}
                </option>
              ))}
            </select>
            {errors.enrollmentId && (
              <p className="text-xs text-red-500 mt-1">
                {errors.enrollmentId.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">
                Summa (so'm) *
              </label>
              <input
                type="number"
                {...register("amount")}
                className={`w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${errors.amount ? "border-red-500" : "border-input"}`}
              />
              {errors.amount && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.amount.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">
                Qaysi oy uchun? *
              </label>
              <input
                type="date"
                {...register("paymentMonth")}
                className={`w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${errors.paymentMonth ? "border-red-500" : "border-input"}`}
              />
              {errors.paymentMonth && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.paymentMonth.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              To'lov usuli *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 1, name: "Naqd", icon: Banknote },
                { id: 2, name: "Karta", icon: CreditCard },
                { id: 3, name: "Bank", icon: Landmark },
              ].map((method) => (
                <label key={method.id} className="relative cursor-pointer">
                  <input
                    type="radio"
                    value={method.id}
                    {...register("paymentMethodId")}
                    className="peer sr-only"
                  />
                  <div className="p-3 border rounded-xl flex flex-col items-center gap-2 hover:bg-muted transition-colors peer-checked:border-brand-600 peer-checked:bg-brand-50 peer-checked:text-brand-700">
                    <method.icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{method.name}</span>
                  </div>
                </label>
              ))}
            </div>
            {errors.paymentMethodId && (
              <p className="text-xs text-red-500 mt-1">
                {errors.paymentMethodId.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">
              Izoh (ixtiyoriy)
            </label>
            <input
              type="text"
              {...register("description")}
              placeholder="To'lov haqida qo'shimcha ma'lumot..."
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading || !studentId}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Bazaga saqlanmoqda..." : "Tasdiqlash"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
