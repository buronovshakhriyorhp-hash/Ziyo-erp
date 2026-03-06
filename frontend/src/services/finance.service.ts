import api from "./api";
import type { PaginatedResponse } from "./crm.service";

export interface Payment {
  id: number;
  enrollmentId: number;
  studentId: number;
  studentName: string;
  groupName: string;
  courseName: string;
  paymentMethodId: number;
  paymentMethod: string;
  receivedBy: number;
  receivedByName: string;
  amount: number;
  paymentDate: string;
  paymentMonth: string;
  description: string | null;
  receiptNumber: string | null;
  createdAt: string;
  isOptimistic?: boolean;
}

export interface PaymentDebt {
  id: number;
  enrollmentId: number;
  studentId: number;
  studentName: string;
  phone: string;
  courseName: string;
  groupName: string;
  dueMonth: string;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  status: "pending" | "partial" | "paid" | "overdue" | "cancelled";
}

export interface Expense {
  id: number;
  categoryId: number;
  categoryName: string;
  paymentMethodId: number | null;
  paymentMethod: string | null;
  paidByName: string | null;
  amount: number;
  expenseDate: string;
  description: string | null;
  createdAt: string;
}

export interface TeacherSalary {
  id: number;
  teacherId: number;
  teacherName: string;
  periodMonth: string;
  totalLessonsPlanned: number;
  totalLessonsConducted: number;
  attendanceRate: number;
  baseSalary: number;
  kpiBonus: number;
  deductions: number;
  totalSalary: number;
  status: "calculated" | "approved" | "paid";
  notes: string | null;
  createdAt: string;
}

export interface SalarySettings {
  teacherId: number;
  salaryMode: "fixed" | "per_lesson" | "percentage" | "calculated";
  amount: number;
  kpiRate: number;
}

export const financeService = {
  // ── Payments ──────────────────────────────────────────────
  getPayments: (params?: {
    studentId?: number;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) =>
    api
      .get<{
        data: PaginatedResponse<Payment>;
      }>("/finance/payments", { params })
      .then((r) => r.data.data),

  makePayment: (dto: {
    enrollmentId: number;
    studentId: number;
    paymentMethodId: number;
    amount: number;
    paymentDate?: string;
    paymentMonth: string;
    description?: string;
  }) =>
    api
      .post<{
        data: {
          payment: Payment;
          balanceAfter: {
            balance: number;
            totalPaid: number;
            totalDebt: number;
          };
        };
      }>("/finance/payments", dto)
      .then((r) => r.data.data),

  // ── Debts ─────────────────────────────────────────────────
  getDebts: (params?: {
    status?: string;
    studentId?: number;
    page?: number;
    limit?: number;
  }) =>
    api
      .get<{
        data: PaginatedResponse<PaymentDebt>;
      }>("/finance/debts", { params })
      .then((r) => r.data.data),

  // ── Expenses ──────────────────────────────────────────────
  getExpenses: (params?: {
    categoryId?: number;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) =>
    api
      .get<{
        data: PaginatedResponse<Expense>;
      }>("/finance/expenses", { params })
      .then((r) => r.data.data),

  createExpense: (dto: Partial<Expense>) =>
    api
      .post<{ data: Expense }>("/finance/expenses", dto)
      .then((r) => r.data.data),

  // ── Summary ───────────────────────────────────────────────
  getMonthlySummary: (params?: { from?: string; to?: string }) =>
    api
      .get<{
        data: { month: string; income: number; expense: number; net: number }[];
      }>("/finance/summary/monthly", { params })
      .then((r) => r.data.data),

  getStudentBalance: (studentId: number) =>
    api
      .get<{
        data: { balance: number; totalPaid: number; totalDebt: number };
      }>(`/finance/students/${studentId}/balance`)
      .then((r) => r.data.data),

  // ── Salaries ──────────────────────────────────────────────
  getSalaries: (params?: {
    teacherId?: number;
    status?: string;
    year?: number;
    month?: number;
    page?: number;
    limit?: number;
  }) =>
    api
      .get<{
        data: PaginatedResponse<TeacherSalary>;
      }>("/finance/salaries", { params })
      .then((r) => r.data.data),

  calculateSalary: (dto: {
    teacherId: number;
    periodMonth: string;
    deductions?: number;
    notes?: string;
  }) =>
    api
      .post<{ data: TeacherSalary }>("/finance/salaries/calculate", dto)
      .then((r) => r.data.data),

  approveSalary: (id: number) =>
    api
      .patch<{ data: TeacherSalary }>(`/finance/salaries/${id}/approve`)
      .then((r) => r.data.data),

  markSalaryPaid: (id: number, paymentMethodId?: number) =>
    api
      .patch<{
        data: TeacherSalary;
      }>(`/finance/salaries/${id}/mark-paid`, { paymentMethodId })
      .then((r) => r.data.data),

  getSalarySettings: (teacherId: number) =>
    api
      .get<{ data: SalarySettings }>(`/finance/salaries/settings/${teacherId}`)
      .then((r) => r.data.data),

  updateSalarySettings: (dto: SalarySettings) =>
    api
      .post<{ data: SalarySettings }>("/finance/salaries/settings", dto)
      .then((r) => r.data.data),

  getMySalaries: () =>
    api
      .get<{ data: PaginatedResponse<TeacherSalary> }>("/finance/my-salaries")
      .then((r) => r.data.data),

  // ── Payment Methods lookup ────────────────────────────────
  getPaymentMethods: () =>
    api
      .get<{ data: { id: number; name: string }[] }>("/finance/payment-methods")
      .then((r) => r.data.data),
};
