import { useMemo, useState, useEffect } from "react";
import {
  Users,
  DollarSign,
  Settings,
  Calculator,
  CheckCircle2,
  Clock,
  Search,
  FileDown,
} from "lucide-react";
import { academicService } from "../../services/academic.service";
import {
  financeService,
  type TeacherSalary,
} from "../../services/finance.service";
import { documentService } from "../../services/document.service";

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  specialization?: string;
}
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

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [salaries, setSalaries] = useState<TeacherSalary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM-01"),
  );
  const [search, setSearch] = useState("");
  const { addToast } = useUiStore();

  useEffect(() => {
    void fetchData();
  }, [selectedMonth]);

  const fetchData = async (): Promise<void> => {
    setLoading(true);
    try {
      const [tData, sData] = await Promise.all([
        academicService.getTeachers(),
        financeService.getSalaries({
          year: new Date(selectedMonth).getFullYear(),
          month: new Date(selectedMonth).getMonth() + 1,
        }),
      ]);
      setTeachers(tData);
      setSalaries(sData.data);
    } catch {
      addToast({ title: "Ma'lumotlarni yuklashda xato", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateAll = async (): Promise<void> => {
    try {
      await Promise.all(
        teachers.map((teacher) =>
          financeService.calculateSalary({
            teacherId: teacher.id,
            periodMonth: selectedMonth,
          }),
        ),
      );
      addToast({
        title: "Barcha o'qituvchilar oyligi hisoblandi",
        type: "success",
      });
      void fetchData();
    } catch {
      addToast({ title: "Hisoblashda xato", type: "error" });
    }
  };

  const handleApprove = async (id: number): Promise<void> => {
    try {
      await financeService.approveSalary(id);
      addToast({ title: "Tasdiqlandi", type: "success" });
      void fetchData();
    } catch {
      addToast({ title: "Xato yuz berdi", type: "error" });
    }
  };

  const handlePay = async (id: number): Promise<void> => {
    try {
      // To'lov usuli sifatida birinchi usulni olamiz (Naqd)
      const methods = await financeService.getPaymentMethods();
      await financeService.markSalaryPaid(id, methods[0]?.id);
      addToast({ title: "To'lov amalga oshirildi", type: "success" });
      void fetchData();
    } catch {
      addToast({ title: "Xato yuz berdi", type: "error" });
    }
  };

  const getSalaryForTeacher = (teacherId: number): TeacherSalary | undefined =>
    salaries.find((s) => s.teacherId === teacherId);

  const filteredTeachers = useMemo(
    () =>
      teachers.filter((teacher) =>
        `${teacher.firstName} ${teacher.lastName}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [teachers, search],
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            O'qituvchilar va HR
          </h1>
          <p className="text-gray-500">
            Oylik hisob-kitoblari va samaradorlik nazorati
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <span>Oy:</span>
            <input
              type="month"
              className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={selectedMonth.substring(0, 7)}
              onChange={(e) => setSelectedMonth(`${e.target.value}-01`)}
              aria-label="Hisoblash oyi"
            />
          </label>
          <Button
            onClick={handleCalculateAll}
            variant="outline"
            className="gap-2"
          >
            <Calculator className="w-4 h-4" />
            Hammasini hisoblash
          </Button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Jami o'qituvchilar
            </CardDescription>
            <CardTitle className="text-2xl">{teachers.length} ta</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              To'langan oyliklar
            </CardDescription>
            <CardTitle className="text-2xl">
              {salaries
                .filter((s) => s.status === "paid")
                .reduce((acc, s) => acc + Number(s.totalSalary), 0)
                .toLocaleString()}{" "}
              so'm
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Tasdiqlanish kutilmoqda
            </CardDescription>
            <CardTitle className="text-2xl">
              {salaries.filter((s) => s.status === "calculated").length} ta
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Teachers List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>O'qituvchilar ro'yxati</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Qidirish..."
                className="pl-10 pr-4 py-2 border rounded-lg w-64 outline-none focus:ring-2 focus:ring-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-gray-500 text-sm">
                  <th className="py-4 px-4 font-medium">O'qituvchi</th>
                  <th className="py-4 px-4 font-medium text-center">
                    Darslar (Reja/Asl)
                  </th>
                  <th className="py-4 px-4 font-medium text-center">
                    Davomat %
                  </th>
                  <th className="py-4 px-4 font-medium text-right">
                    Oylik (Hisoblangan)
                  </th>
                  <th className="py-4 px-4 font-medium text-center">Holat</th>
                  <th className="py-4 px-4 font-medium text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-500">
                      Yuklanmoqda...
                    </td>
                  </tr>
                ) : filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-500">
                      O'qituvchilar topilmadi
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((teacher) => {
                    const sal = getSalaryForTeacher(teacher.id);
                    return (
                      <tr
                        key={teacher.id}
                        className="hover:bg-gray-50 transition-colors group"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                              {teacher.firstName[0]}
                              {teacher.lastName[0]}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {teacher.firstName} {teacher.lastName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {teacher.specialization || "O'qituvchi"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="font-medium text-gray-700">
                            {sal
                              ? `${sal.totalLessonsConducted} / ${sal.totalLessonsPlanned}`
                              : "-"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {sal ? (
                            <div className="flex flex-col items-center gap-1">
                              <span
                                className={`text-sm font-bold ${Number(sal.attendanceRate) > 80 ? "text-green-600" : "text-amber-600"}`}
                              >
                                {sal.attendanceRate}%
                              </span>
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 ${Number(sal.attendanceRate) > 80 ? "bg-green-500" : "bg-amber-500"}`}
                                  style={{ width: `${sal.attendanceRate}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-4 px-4 text-right font-mono font-bold text-gray-900">
                          {sal ? Number(sal.totalSalary).toLocaleString() : "0"}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {sal ? (
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                                sal.status === "paid"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : sal.status === "approved"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {sal.status === "paid"
                                ? "To'langan"
                                : sal.status === "approved"
                                  ? "Tasdiqlangan"
                                  : "Hisoblangan"}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs italic">
                              Hisoblanmagan
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!sal ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={() =>
                                  financeService
                                    .calculateSalary({
                                      teacherId: teacher.id,
                                      periodMonth: selectedMonth,
                                    })
                                    .then(() => {
                                      void fetchData();
                                    })
                                }
                              >
                                Hisoblash
                              </Button>
                            ) : sal.status === "calculated" ? (
                              <Button
                                size="sm"
                                className="h-8 text-xs bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleApprove(sal.id)}
                              >
                                Tasdiqlash
                              </Button>
                            ) : sal.status === "approved" ? (
                              <Button
                                size="sm"
                                className="h-8 text-xs bg-green-600 hover:bg-green-700"
                                onClick={() => handlePay(sal.id)}
                              >
                                To'lash
                              </Button>
                            ) : (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            )}
                            {sal && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-blue-600"
                                onClick={() =>
                                  documentService.downloadSalarySlip(sal.id)
                                }
                                title="Oylik slipini yuklab olish"
                              >
                                <FileDown className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                            >
                              <Settings className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
