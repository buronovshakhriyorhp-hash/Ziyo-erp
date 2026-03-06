import { useState, useEffect } from "react";
import {
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  Loader2,
} from "lucide-react";
import {
  analyticsService,
  type FinancialSummary,
  type MonthlyTrend,
} from "@/services/analytics.service";
import { useUiStore } from "@/store/ui.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from "recharts";

export default function ReportsPage() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const { addToast } = useUiStore();

  useEffect(() => {
    void fetchData();
  }, [month]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([
        analyticsService.getFinancialSummary(month),
        analyticsService.getMonthlyTrends(6),
      ]);
      setSummary(s);
      setTrends(t);
    } catch {
      addToast({
        title: "Xatolik",
        description: "Hisobotlarni yuklashda xato yuz berdi",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportMonthly = async () => {
    try {
      await analyticsService.exportMonthlyReport(month);
      addToast({
        title: "Muvaffaqiyatli",
        description: "Hisobot yuklab olindi",
        type: "success",
      });
    } catch {
      addToast({
        title: "Xatolik",
        description: "Eksport qilishda xato yuz berdi",
        type: "error",
      });
    }
  };

  const handleExportDebtors = async (format: "excel" | "pdf") => {
    try {
      await analyticsService.exportDebtors(format);
      addToast({
        title: "Muvaffaqiyatli",
        description: "Debitorlar ro'yxati yuklab olindi",
        type: "success",
      });
    } catch {
      addToast({
        title: "Xatolik",
        description: "Eksport qilishda xato yuz berdi",
        type: "error",
      });
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hisobotlar va Tahlil
          </h1>
          <p className="text-gray-500">
            Markazning moliyaviy va akademik ko'rsatkichlari
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            className="p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExportMonthly}
          >
            <Download className="w-4 h-4" />
            Oylik hisobot (Excel)
          </Button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-brand-500 to-brand-600 text-white">
          <CardContent className="pt-6">
            <p className="text-brand-100 text-sm font-medium">Umumiy Tushum</p>
            <h3 className="text-2xl font-bold mt-1 line-clamp-1">
              {summary?.totalRevenue.toLocaleString()}{" "}
              <span className="text-sm font-normal text-brand-100">UZS</span>
            </h3>
            <div className="mt-4 flex items-center gap-1 text-sm text-brand-100">
              <TrendingUp className="w-4 h-4" />
              <span>+{summary?.collectionRate}% yig'uv</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="pt-6">
            <p className="text-gray-500 text-sm font-medium">Xarajatlar</p>
            <h3 className="text-2xl font-bold mt-1 text-gray-900">
              {summary?.totalExpenses.toLocaleString()}
            </h3>
            <div className="mt-4 flex items-center gap-1 text-sm text-rose-500">
              <TrendingDown className="w-4 h-4" />
              <span>Ish haqi va ijara</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="pt-6">
            <p className="text-gray-500 text-sm font-medium">Sof Foyda</p>
            <h3 className="text-2xl font-bold mt-1 text-emerald-600">
              {summary?.netProfit.toLocaleString()}
            </h3>
            <div className="mt-4 flex items-center gap-1 text-sm text-emerald-600">
              <TrendingUp className="w-4 h-4" />
              <span>{summary?.profitMargin}% marja</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-rose-500">
          <CardContent className="pt-6 font-medium">
            <p className="text-gray-500 text-sm">Debitorlik Qarzi</p>
            <h3 className="text-2xl font-bold mt-1 text-rose-600">
              {summary?.pendingDebt.toLocaleString()}
            </h3>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => handleExportDebtors("excel")}
                className="text-xs text-blue-600 hover:underline"
              >
                Excel
              </button>
              <button
                onClick={() => handleExportDebtors("pdf")}
                className="text-xs text-rose-600 hover:underline"
              >
                PDF
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-500" />
              Daromad va Foyda Trendi
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8884d8"
                  fillOpacity={1}
                  fill="url(#colorRev)"
                  name="Daromad"
                />
                <Area
                  type="monotone"
                  dataKey="netProfit"
                  stroke="#10b981"
                  fillOpacity={0}
                  name="Sof Foyda"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              O'quvchilar Dinamikasi
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="activeStudents"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  name="Faol"
                />
                <Bar
                  dataKey="newStudents"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  name="Yangi"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Daromad Manbalari
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 font-medium text-gray-500">Kurs nomi</th>
                  <th className="p-4 font-medium text-gray-500">Guruhlar</th>
                  <th className="p-4 font-medium text-gray-500">O'quvchilar</th>
                  <th className="p-4 font-medium text-gray-500 text-right">
                    Summa
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summary?.revenueBreakdown.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">
                      {item.courseName}
                    </td>
                    <td className="p-4 text-gray-600">{item.groupCount}</td>
                    <td className="p-4 text-gray-600">{item.studentCount}</td>
                    <td className="p-4 text-right font-semibold text-brand-600">
                      {item.totalRevenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Xarajatlar Tuzilmasi
            </CardTitle>
          </CardHeader>
          <div className="p-4 space-y-4">
            {summary?.expenseBreakdown.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.category}</span>
                  <span className="font-semibold">
                    {item.totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-brand-500 h-full rounded-full"
                    style={{
                      width: `${(item.totalAmount / summary.totalExpenses) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
