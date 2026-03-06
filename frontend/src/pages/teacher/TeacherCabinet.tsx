import { useMemo, useState, useEffect } from "react";
import { TrendingUp, Award } from "lucide-react";
import {
  financeService,
  type TeacherSalary,
} from "../../services/finance.service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useUiStore } from "../../store/ui.store";
import { format } from "date-fns";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

export default function TeacherCabinet() {
  const [salaries, setSalaries] = useState<TeacherSalary[]>([]);
  const [, setLoading] = useState(true);
  const { addToast } = useUiStore();

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async (): Promise<void> => {
    setLoading(true);
    try {
      const result = await financeService.getMySalaries();
      setSalaries(result.data);
    } catch {
      addToast({ title: "Ma'lumotlarni yuklashda xato", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(
    () =>
      salaries
        .slice(0, 6)
        .reverse()
        .map((s) => ({
          month: format(new Date(s.periodMonth), "MMM"),
          salary: Number(s.totalSalary),
          attendance: Number(s.attendanceRate),
        })),
    [salaries],
  );

  const lastSalary = useMemo(
    () => (salaries.length > 0 ? salaries[0] : undefined),
    [salaries],
  );

  const averageAttendance = useMemo(
    () =>
      salaries.length > 0
        ? salaries.reduce((acc, s) => acc + Number(s.attendanceRate), 0) /
          salaries.length
        : 0,
    [salaries],
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shaxsiy Kabinet</h1>
          <p className="text-gray-500">Oylik maosh va ish samaradorligingiz</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
          <Award className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-blue-800">
            KPI: {averageAttendance.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider">
              So'nggi oylik
            </CardDescription>
            <CardTitle className="text-xl">
              {lastSalary
                ? Number(lastSalary.totalSalary).toLocaleString()
                : "0"}{" "}
              so'm
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider">
              Darslar (Shu oy)
            </CardDescription>
            <CardTitle className="text-xl">
              {lastSalary
                ? `${lastSalary.totalLessonsConducted} / ${lastSalary.totalLessonsPlanned}`
                : "0 / 0"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider">
              O'rtacha Davomat
            </CardDescription>
            <CardTitle className="text-xl text-green-600">
              {averageAttendance.toFixed(1)}%
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider">
              Status
            </CardDescription>
            <CardTitle
              className={`text-xl ${lastSalary?.status === "paid" ? "text-green-500" : "text-amber-500"}`}
            >
              {lastSalary?.status === "paid" ? "To'langan" : "Kutilmoqda"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KPI Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Samaradorlik Grafigi (Oxirgi 6 oy)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="colorSalary"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="salary"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSalary)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 italic">
                Ma'lumotlar mavjud emas
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Oylik hisob-kitob</CardTitle>
            <CardDescription>
              {lastSalary
                ? format(new Date(lastSalary.periodMonth), "MMMM yyyy")
                : "Ma'lumot yo'q"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-dashed">
              <span className="text-gray-500">Asosiy oylik</span>
              <span className="font-semibold">
                {lastSalary
                  ? Number(lastSalary.baseSalary).toLocaleString()
                  : 0}{" "}
                so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-dashed">
              <span className="text-gray-500 flex items-center gap-1">
                KPI Bonus
                <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded">
                  +{lastSalary?.attendanceRate}%
                </span>
              </span>
              <span className="font-semibold text-green-600">
                +{lastSalary ? Number(lastSalary.kpiBonus).toLocaleString() : 0}{" "}
                so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-dashed text-red-600">
              <span className="text-red-400">Ushlanmalar</span>
              <span className="font-semibold">
                -
                {lastSalary
                  ? Number(lastSalary.deductions).toLocaleString()
                  : 0}{" "}
                so'm
              </span>
            </div>
            <div className="flex justify-between items-center py-4 text-lg font-bold">
              <span>Jami</span>
              <span className="text-blue-600">
                {lastSalary
                  ? Number(lastSalary.totalSalary).toLocaleString()
                  : 0}{" "}
                so'm
              </span>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
              <Download className="w-4 h-4" />
              PDF Yuklash (Slip)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Oyliklar tarixi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-gray-500 text-sm">
                  <th className="py-3 px-4">Davr</th>
                  <th className="py-3 px-4">Darslar</th>
                  <th className="py-3 px-4">Davomat</th>
                  <th className="py-3 px-4 text-right">Summa</th>
                  <th className="py-3 px-4 text-center">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {salaries.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">
                      {format(new Date(s.periodMonth), "MMMM yyyy")}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {s.totalLessonsConducted} ta
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-bold ${Number(s.attendanceRate) > 85 ? "text-green-600" : "text-amber-600"}`}
                      >
                        {s.attendanceRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">
                      {Number(s.totalSalary).toLocaleString()} so'm
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          s.status === "paid"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {s.status === "paid" ? "To'langan" : "Kutilmoqda"}
                      </span>
                    </td>
                  </tr>
                ))}
                {salaries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-gray-400">
                      Tarix mavjud emas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Download({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}
