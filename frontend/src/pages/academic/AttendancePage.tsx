import React, { useState, useEffect } from "react";
import {
  academicService,
  Group,
  Enrollment,
  Lesson,
} from "../../services/academic.service";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Check,
  X,
  Clock,
  Save,
  Calendar as CalendarIcon,
  Filter,
} from "lucide-react";
import { formatDate } from "../../utils/formatters";
import { useUiStore } from "../../store/ui.store";

const AttendancePage: React.FC = () => {
  const { addToast } = useUiStore();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [attendance, setAttendance] = useState<
    Record<number, { status: string; notes?: string; lateMinutes?: number }>
  >({});
  const [, setLoading] = useState(false);
  const [applyBilling, setApplyBilling] = useState(true);

  // Load groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await academicService.getGroups();
        setGroups(data.data);
      } catch (_err) {
        addToast({
          title: "Xatolik",
          description: "Guruhlarni yuklashda xatolik",
          type: "error",
        });
      }
    };
    fetchGroups();
  }, [addToast]);

  // Load enrollments and lessons when group changes
  useEffect(() => {
    if (!selectedGroupId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [enrData, lessonData] = await Promise.all([
          academicService.getGroupEnrollments(selectedGroupId),
          academicService.getGroupLessons(selectedGroupId),
        ]);
        setEnrollments(enrData);
        setLessons(lessonData);

        if (lessonData.length > 0) {
          setSelectedLessonId(lessonData[0].id);
        }
      } catch (_err) {
        addToast({
          title: "Xatolik",
          description: "Ma'lumotlarni yuklashda xatolik",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedGroupId, addToast]);

  const handleStatusChange = (studentId: number, status: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const handleSave = async () => {
    if (!selectedLessonId) return;

    // ── OPTIMISTIC UI: Dars statusini darhol 'completed' ga o'zgartiramiz
    const previousLessons = [...lessons];
    setLessons((prev) =>
      prev.map((l) =>
        l.id === selectedLessonId ? { ...l, status: "completed" } : l,
      ),
    );

    const payload = {
      lessonId: selectedLessonId,
      applyBilling,
      teacherStatus: "present",
      students: enrollments.map((en) => ({
        studentId: en.studentId,
        status: attendance[en.studentId]?.status || "present", // Default to present for speed
        notes: attendance[en.studentId]?.notes || "",
        lateMinutes: attendance[en.studentId]?.lateMinutes || 0,
      })),
    };

    try {
      // Backendga tarmoq so'rovi ketadi, UI esa bloklanmaydi (loader siz)
      await academicService.markAttendance(payload);
      addToast({
        title: "Muvaffaqiyat",
        description: "Davomat muvaffaqiyatli saqlandi",
        type: "success",
      });

      // Orqa fonda eng ohirgi aniq holatni yuklab olsak ham bo'ladi:
      if (selectedGroupId) {
        academicService
          .getGroupLessons(selectedGroupId)
          .then(setLessons)
          .catch(() => { });
      }
    } catch (_err) {
      // Xatolik bo'lsa, UI ni avvalgi holatga qaytaramiz (Rollback)
      setLessons(previousLessons);
      addToast({
        title: "Xatolik",
        description:
          "Davomatni saqlashda xatolik ro'y berdi. O'zgarish bekor qilindi.",
        type: "error",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-slate-800">
        <div>
          <h1 className="text-2xl font-bold">Davomat va Jadval</h1>
          <p className="text-slate-500 text-sm">
            Guruh darslari va talabalar davomatini boshqarish
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-lg border shadow-sm">
          <Filter className="w-4 h-4 text-slate-400 ml-2" />
          <select
            className="bg-transparent border-none focus:ring-0 text-sm font-medium pr-8"
            value={selectedGroupId || ""}
            onChange={(e) => setSelectedGroupId(Number(e.target.value))}
          >
            <option value="">Guruhni tanlang</option>
            {groups.map((g: Group) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedGroupId ? (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left: Lessons List - Calendar style */}
          <Card className="xl:col-span-1 p-5 border-none shadow-premium bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-500" />
                Darslar jadvali
              </h3>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {lessons.map((lesson: Lesson) => (
                <div
                  key={lesson.id}
                  onClick={() => setSelectedLessonId(lesson.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${selectedLessonId === lesson.id
                      ? "bg-blue-50 border-blue-200 shadow-md"
                      : "bg-white border-slate-50 hover:border-slate-200"
                    }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-slate-700">
                      {formatDate(lesson.lessonDate)}
                    </div>
                    <div
                      className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${lesson.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                        }`}
                    >
                      {lesson.status === "completed"
                        ? "Yakunlandi"
                        : "Kutilmoqda"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                      <Clock className="w-3 h-3" />
                      {lesson.startTime} - {lesson.endTime}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Right: Attendance Marking */}
          <Card className="xl:col-span-3 p-8 border-none shadow-premium bg-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">
                  Talabalar ro'yxati
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <p className="text-sm text-slate-500 font-medium">
                    {formatDate(
                      lessons.find((l: Lesson) => l.id === selectedLessonId)
                        ?.lessonDate || "",
                    )}{" "}
                    sanasi uchun davomat
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={applyBilling}
                      onChange={(e) => setApplyBilling(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:bg-blue-500 transition-all"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:left-5"></div>
                  </div>
                  <span className="text-sm font-bold text-slate-600 group-hover:text-blue-600 transition-colors">
                    Dars pulini yechish
                  </span>
                </label>

                <Button
                  onClick={handleSave}
                  className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 gap-2 transition-all hover:translate-y-[-2px]"
                >
                  <Save className="w-4 h-4" />
                  Saqlash
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-100">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="py-4 px-6 font-bold text-xs text-slate-400 uppercase tracking-widest">
                      Talaba Ma'lumotlari
                    </th>
                    <th className="py-4 px-6 font-bold text-xs text-slate-400 uppercase tracking-widest text-center">
                      Davomat Holati
                    </th>
                    <th className="py-4 px-6 font-bold text-xs text-slate-400 uppercase tracking-widest">
                      Qo'shimcha Eslatma
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((en: Enrollment) => (
                    <tr
                      key={en.id}
                      className="border-t border-slate-50 hover:bg-slate-50/30 transition-colors group"
                    >
                      <td className="py-5 px-6">
                        <div className="font-bold text-slate-800 text-base">
                          {en.studentName}
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                          {en.studentPhone}
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex justify-center items-center gap-2">
                          {[
                            {
                              id: "present",
                              icon: Check,
                              color: "bg-green-500",
                              label: "Keldi",
                            },
                            {
                              id: "absent",
                              icon: X,
                              color: "bg-red-500",
                              label: "Kelmadi",
                            },
                            {
                              id: "late",
                              icon: Clock,
                              color: "bg-amber-500",
                              label: "Kechikdi",
                            },
                          ].map((st) => (
                            <button
                              key={st.id}
                              onClick={() =>
                                handleStatusChange(en.studentId, st.id)
                              }
                              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${(attendance[en.studentId]?.status || "present") === st.id
                                  ? `${st.color} text-white shadow-lg transform scale-110`
                                  : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                }`}
                              title={st.label}
                            >
                              <st.icon className="w-5 h-5" />
                            </button>
                          ))}
                        </div>
                        {(attendance[en.studentId]?.status === "late") && (
                          <div className="mt-3 flex items-center justify-center gap-2 animate-in fade-in zoom-in duration-300">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <input
                              type="number"
                              min="1"
                              max="120"
                              placeholder="Minut..."
                              value={attendance[en.studentId]?.lateMinutes || ""}
                              onChange={(e) =>
                                setAttendance((prev: any) => ({
                                  ...prev,
                                  [en.studentId]: {
                                    ...prev[en.studentId],
                                    lateMinutes: parseInt(e.target.value) || 0
                                  }
                                }))
                              }
                              className="w-20 text-center text-sm border-amber-200 bg-amber-50/50 rounded-lg focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all"
                            />
                          </div>
                        )}
                      </td>
                      <td className="py-5 px-6">
                        <input
                          type="text"
                          placeholder="Izoh qoldiring..."
                          className="w-full h-10 text-sm border-slate-100 bg-slate-50/50 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                          value={attendance[en.studentId]?.notes || ""}
                          onChange={(e) =>
                            setAttendance((prev: any) => ({
                              ...prev,
                              [en.studentId]: {
                                ...prev[en.studentId],
                                notes: e.target.value,
                              },
                            }))
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border-2 border-dashed border-slate-100 text-slate-400">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <CalendarIcon className="w-10 h-10 opacity-20" />
          </div>
          <p className="text-lg font-medium">
            Davomat qilish uchun yuqoridan guruhni tanlang
          </p>
          <p className="text-sm opacity-60">
            Tanlangan guruh darslari va talabalar ro'yxati shu yerda chiqadi
          </p>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
