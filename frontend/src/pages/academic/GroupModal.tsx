import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Loader2, Plus, Check } from "lucide-react";
import {
  academicService,
  type Group,
  type Course,
  type PaginatedResponse,
} from "@/services/academic.service";
import { useApi } from "@/hooks/useApi";
import api from "@/services/api";
import { useUiStore } from "@/store/ui.store";

// ── Zod Schema ───────────────────────────────────────────
const groupSchema = z.object({
  courseId: z.number().min(1, "Kurs tanlanishi shart"),
  teacherId: z.number().min(1, "O'qituvchi tanlanishi shart"),
  roomId: z.number().optional().nullable(),
  name: z.string().min(3, "Guruh nomi kamida 3 ta harf bo'lishi kerak"),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Vaqt noto'g'ri (soat:daqiqa)"),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Vaqt noto'g'ri (soat:daqiqa)"),
  maxStudents: z.number().min(1, "Maksimal talabalar sonini kiriting"),
  status: z.enum(["recruiting", "active", "completed", "cancelled"]),
});

type GroupFormValues = z.infer<typeof groupSchema>;

interface GroupModalProps {
  group: Group | null;
  onClose: () => void;
  onSave: () => void;
}

export function GroupModal({ group, onClose, onSave }: GroupModalProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<
    { id: number; firstName: string; lastName: string }[]
  >([]);
  const [rooms, setRooms] = useState<
    { id: number; name: string; capacity: number }[]
  >([]);

  const { execute: fetchCourses } = useApi<PaginatedResponse<Course>>();
  const { execute: fetchTeachers } =
    useApi<{ id: number; firstName: string; lastName: string }[]>();
  const { execute: fetchRooms } =
    useApi<{ id: number; name: string; capacity: number }[]>();

  const { addToast } = useUiStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!group;

  // Inline Add States
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [isAddingCourseLoading, setIsAddingCourseLoading] = useState(false);

  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState("");
  const [isAddingTeacherLoading, setIsAddingTeacherLoading] = useState(false);

  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [isAddingRoomLoading, setIsAddingRoomLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      courseId: 0,
      teacherId: 0,
      roomId: null,
      name: "",
      startTime: "14:00",
      endTime: "16:00",
      maxStudents: 15,
      status: "recruiting",
    },
  });

  // Fayl yuklanganda ma'lumotlarni yuklash va default qiymatlarni o'rnatish
  useEffect(() => {
    const loadData = async () => {
      const [cr, tr, rr] = await Promise.all([
        fetchCourses(() => academicService.getCourses({ limit: 100 })), // all active courses ideally
        fetchTeachers(() => academicService.getTeachers()),
        fetchRooms(() => academicService.getRooms()),
      ]);
      if (cr) setCourses(cr.data);
      if (tr) setTeachers(tr);
      if (rr) setRooms(rr);
    };
    loadData();

    if (group) {
      reset({
        courseId: group.courseId,
        teacherId: group.teacherId,
        roomId: group.roomId,
        name: group.name,
        startTime: group.startTime,
        endTime: group.endTime,
        maxStudents: group.maxStudents,
        status: group.status,
      });
    }
  }, [group, reset]); // eslint-disable-line

  const onSubmit = async (values: GroupFormValues) => {
    try {
      setIsSubmitting(true);
      const payload: Partial<Group> = {
        ...values,
        roomId: values.roomId || null, // handle optional 0 correctly
      };
      if (isEdit) {
        await academicService.updateGroup(group.id, payload);
      } else {
        await academicService.createGroup(payload);
      }
      onSave();
    } catch (_error) {
      // Handled globally
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />
      <div className="relative bg-card w-full max-w-3xl rounded-2xl shadow-modal flex flex-col max-h-full border border-border animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-xl font-bold text-foreground">
            {isEdit ? "Guruhni Tahrirlash" : "Yangi Guruh Ochiish"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
          <form
            id="group-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {/* 1-qator: Nomi va Kursi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Guruh nomi <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("name")}
                  type="text"
                  placeholder="Masalan: INGLIZ-B2-01"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    Kurs <span className="text-red-500">*</span>
                  </label>
                  {!isAddingCourse ? (
                    <button type="button" onClick={() => setIsAddingCourse(true)} className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1 font-medium">
                      <Plus className="w-3 h-3" /> Yaratish
                    </button>
                  ) : (
                    <button type="button" onClick={() => setIsAddingCourse(false)} className="text-xs text-muted-foreground hover:text-foreground">Bekor qilish</button>
                  )}
                </div>
                {isAddingCourse ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Yangi kurs nomi..."
                      value={newCourseName}
                      onChange={(e) => setNewCourseName(e.target.value)}
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                    <button
                      type="button"
                      disabled={isAddingCourseLoading || !newCourseName}
                      onClick={async () => {
                        try {
                          setIsAddingCourseLoading(true);
                          const res = await academicService.createCourse({
                            name: newCourseName, subjectId: 1, durationMonths: 1, lessonsPerWeek: 3, lessonDurationMin: 90, pricePerMonth: 0, level: 'Asosiy', isActive: true
                          });
                          setCourses([...courses, res]);
                          reset({ ...getValues(), courseId: res.id });
                          setIsAddingCourse(false); setNewCourseName("");
                          addToast({ title: "Muvaffaqiyatli", description: "Kurs qo'shildi", type: "success" });
                        } catch (e) { addToast({ title: "Xatolik", description: "Kurs yaratishda xato", type: "error" }); }
                        finally { setIsAddingCourseLoading(false); }
                      }}
                      className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {isAddingCourseLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                  </div>
                ) : (
                  <>
                    <select
                      {...register("courseId", { valueAsNumber: true })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    >
                      <option value={0}>Kursni tanlang</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
                      ))}
                    </select>
                    {errors.courseId && <p className="text-xs text-red-500">{errors.courseId.message}</p>}
                  </>
                )}
              </div>
            </div>

            {/* 2-qator: O'qituvchi va Xona */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    O'qituvchi <span className="text-red-500">*</span>
                  </label>
                  {!isAddingTeacher ? (
                    <button type="button" onClick={() => setIsAddingTeacher(true)} className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1 font-medium">
                      <Plus className="w-3 h-3" /> Yaratish
                    </button>
                  ) : (
                    <button type="button" onClick={() => setIsAddingTeacher(false)} className="text-xs text-muted-foreground hover:text-foreground">Bekor qilish</button>
                  )}
                </div>
                {isAddingTeacher ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Ism Familiya..."
                      value={newTeacherName}
                      onChange={(e) => setNewTeacherName(e.target.value)}
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                    <button
                      type="button"
                      disabled={isAddingTeacherLoading || !newTeacherName}
                      onClick={async () => {
                        try {
                          setIsAddingTeacherLoading(true);
                          const parts = newTeacherName.trim().split(" ");
                          await api.post('/auth/register', {
                            roleId: 3, firstName: parts[0] || "O'qituvchi", lastName: parts.slice(1).join(" "), phone: `+998${Math.floor(100000000 + Math.random() * 900000000)}`, password: "Password123!"
                          });
                          const tList = await fetchTeachers(() => academicService.getTeachers());
                          if (tList) {
                            setTeachers(tList);
                            const found = tList.find(t => t.firstName === parts[0]);
                            if (found) reset({ ...getValues(), teacherId: found.id });
                          }
                          setIsAddingTeacher(false); setNewTeacherName("");
                          addToast({ title: "Muvaffaqiyatli", description: "O'qituvchi qo'shildi", type: "success" });
                        } catch (e) { addToast({ title: "Xatolik", description: "O'qituvchi yaratishda xato", type: "error" }); }
                        finally { setIsAddingTeacherLoading(false); }
                      }}
                      className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {isAddingTeacherLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                  </div>
                ) : (
                  <>
                    <select
                      {...register("teacherId", { valueAsNumber: true })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    >
                      <option value={0}>O'qituvchini tanlang</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                      ))}
                    </select>
                    {errors.teacherId && <p className="text-xs text-red-500">{errors.teacherId.message}</p>}
                  </>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Xona (ixtiyoriy)</label>
                  {!isAddingRoom ? (
                    <button type="button" onClick={() => setIsAddingRoom(true)} className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1 font-medium">
                      <Plus className="w-3 h-3" /> Yaratish
                    </button>
                  ) : (
                    <button type="button" onClick={() => setIsAddingRoom(false)} className="text-xs text-muted-foreground hover:text-foreground">Bekor qilish</button>
                  )}
                </div>
                {isAddingRoom ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Xona nomi..."
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                    <button
                      type="button"
                      disabled={isAddingRoomLoading || !newRoomName}
                      onClick={async () => {
                        try {
                          setIsAddingRoomLoading(true);
                          const res = await api.post('/academic/rooms', { name: newRoomName, capacity: 20 });
                          const newR = res.data.data;
                          setRooms([...rooms, newR]);
                          reset({ ...getValues(), roomId: newR.id });
                          setIsAddingRoom(false); setNewRoomName("");
                          addToast({ title: "Muvaffaqiyatli", description: "Xona qo'shildi", type: "success" });
                        } catch (e) { addToast({ title: "Xatolik", description: "Xona yaratishda xato (Backend-da Xona jadvali yo'q bo'lishi mumkin)", type: "warning" }); }
                        finally { setIsAddingRoomLoading(false); }
                      }}
                      className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {isAddingRoomLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                  </div>
                ) : (
                  <>
                    <select
                      {...register("roomId", { valueAsNumber: true })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    >
                      <option value={0}>Belgilanmagan</option>
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>{r.name} ({r.capacity} o'rin)</option>
                      ))}
                    </select>
                    {errors.roomId && <p className="text-xs text-red-500">{errors.roomId.message}</p>}
                  </>
                )}
              </div>
            </div>

            {/* 3-qator: Boshlanish/Tugash vaqti, Max Talaba, Status */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Boshlanish vaqti <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("startTime")}
                  type="time"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
                {errors.startTime && (
                  <p className="text-xs text-red-500">
                    {errors.startTime.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Tugash vaqti <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("endTime")}
                  type="time"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
                {errors.endTime && (
                  <p className="text-xs text-red-500">
                    {errors.endTime.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Max. o'rin <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("maxStudents", { valueAsNumber: true })}
                  type="number"
                  min={1}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
                {errors.maxStudents && (
                  <p className="text-xs text-red-500">
                    {errors.maxStudents.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Status
                </label>
                <select
                  {...register("status")}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  <option value="recruiting">Qabul ochiq</option>
                  <option value="active">Faol darslar</option>
                  <option value="completed">Tugallangan</option>
                  <option value="cancelled">Bekor qilingan</option>
                </select>
                {errors.status && (
                  <p className="text-xs text-red-500">
                    {errors.status.message}
                  </p>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-secondary/30 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground bg-card border border-border rounded-lg hover:bg-secondary transition-colors"
          >
            Bekor qilish
          </button>
          <button
            form="group-form"
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? "Yangilash" : "Yangi ochish"}
          </button>
        </div>
      </div>
    </div>
  );
}
