import { format, formatDistanceToNow, parseISO } from "date-fns";

// ── Pul formatlash (UZS) ──────────────────────────────────
export function formatCurrency(
  amount: number | string | null | undefined,
): string {
  if (amount == null) return "—";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "—";
  return (
    new Intl.NumberFormat("uz-UZ", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num) + " so'm"
  );
}

// ── Sana formatlash ──────────────────────────────────────
export function formatDate(
  date: string | Date | null | undefined,
  fmt = "dd.MM.yyyy",
): string {
  if (!date) return "—";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, fmt);
  } catch {
    return "—";
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, "dd.MM.yyyy HH:mm");
}

export function formatRelativeTime(
  date: string | Date | null | undefined,
): string {
  if (!date) return "—";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "—";
  }
}

// ── Telefon formatlash (+998 XX XXX-XX-XX) ───────────────
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("998")) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10)}`;
  }
  return phone;
}

// ── Ism qisqartirish (Avatar uchun) ─────────────────────
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// ── Sahifalash hisob ─────────────────────────────────────
export function getPaginationInfo(page: number, limit: number, total: number) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return { from, to, totalPages: Math.ceil(total / limit) };
}

// ── Status badge rang ────────────────────────────────────
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-gray-100 text-gray-600",
    pending: "bg-amber-100 text-amber-700",
    overdue: "bg-red-100 text-red-700",
    paid: "bg-emerald-100 text-emerald-700",
    partial: "bg-amber-100 text-amber-700",
    cancelled: "bg-red-100 text-red-700",
    completed: "bg-blue-100 text-blue-700",
    recruiting: "bg-violet-100 text-violet-700",
  };
  return map[status.toLowerCase()] ?? "bg-gray-100 text-gray-600";
}

// ── Raqamni qisqartirish (1200 → 1.2K) ──────────────────
export function formatCompact(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return String(num);
}
