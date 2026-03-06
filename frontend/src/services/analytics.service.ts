import api from "./api";

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  collectionRate: number;
  pendingDebt: number;
  revenueBreakdown: any[];
  expenseBreakdown: any[];
}

export interface StudentStats {
  activeCount: number;
  droppedCount: number;
  churnRate: number;
  avgAttendance: number;
  avgDebt: number;
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  expenses: number;
  netProfit: number;
  newStudents: number;
  activeStudents: number;
}

export const analyticsService = {
  /** Moliyaviy xulosa */
  getFinancialSummary: async (month?: string): Promise<FinancialSummary> => {
    const { data } = await api.get<{ data: FinancialSummary }>(
      "/analytics/financial",
      { params: { month } },
    );
    return data.data;
  },

  /** Talabalar statistikasi */
  getStudentStats: async (courseId?: number): Promise<StudentStats> => {
    const { data } = await api.get<{ data: StudentStats }>(
      "/analytics/students",
      { params: { courseId } },
    );
    return data.data;
  },

  /** O'qituvchilar samaradorligi */
  getTeacherPerformance: async (month?: string): Promise<any[]> => {
    const { data } = await api.get<{ data: any[] }>("/analytics/teachers", {
      params: { month },
    });
    return data.data;
  },

  /** Oylik trendlar */
  getMonthlyTrends: async (months: number = 6): Promise<MonthlyTrend[]> => {
    const { data } = await api.get<{ data: MonthlyTrend[] }>(
      "/analytics/trends",
      { params: { months } },
    );
    return data.data;
  },

  /** Debitorlarni export qilish */
  exportDebtors: async (
    format: "excel" | "pdf",
    minDebt: number = 0,
  ): Promise<void> => {
    const response = await api.get("/analytics/export/debtors", {
      params: { format, minDebt },
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `debitorlar_${new Date().toISOString().split("T")[0]}.${format === "excel" ? "xlsx" : "pdf"}`,
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  /** Oylik hisobotni export qilish */
  exportMonthlyReport: async (month: string): Promise<void> => {
    const response = await api.get("/analytics/export/monthly", {
      params: { month },
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `hisobot_${month}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};
