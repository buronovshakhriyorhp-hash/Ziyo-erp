import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Loader2 } from "lucide-react";
import { academicService, type Course } from "@/services/academic.service";
import { useApi } from "@/hooks/useApi";

// ── Zod Schema ───────────────────────────────────────────
const courseSchema = z.object({
  subjectId: z.number().min(1, "Fan tanlanishi shart"),
  name: z.string().min(3, "Kurs nomi kamida 3 ta harf bo'lishi kerak"),
  description: z.string().optional(),
  durationMonths: z.number().min(1, "Davomiyligi kamida 1 oy bo'lishi kerak"),
  lessonsPerWeek: z
    .number()
    .min(1, "Haftalik darslar soni kamida 1 bo'lishi kerak"),
  lessonDurationMin: z
    .number()
    .min(30, "Dars davomiyligi kamida 30 daqiqa bo'lishi kerak"),
  pricePerMonth: z.number().min(0, "Narx manfiy bo'lishi mumkin emas"),
  level: z.string().min(1, "Daraja tanlanishi shart"),
});

type CourseFormValues = z.infer<typeof courseSchema>;

interface CourseModalProps {
  course: Course | null;
  onClose: () => void;
  onSave: () => void;
}

export function CourseModal({ course, onClose, onSave }: CourseModalProps) {
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const { execute: fetchSubjects } = useApi<{ id: number; name: string }[]>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!course;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      subjectId: 0,
      name: "",
      description: "",
      durationMonths: 1,
      lessonsPerWeek: 3,
      lessonDurationMin: 90,
      pricePerMonth: 0,
      level: "",
    },
  });

  // Fayl yuklanganda fanlar ro'yxatini yuklash va default qiymatlarni o'rnatish
  useEffect(() => {
    const loadSubjects = async () => {
      const res = await fetchSubjects(() => academicService.getSubjects());
      if (res) setSubjects(res);
    };
    loadSubjects();

    if (course) {
      reset({
        subjectId: course.subjectId,
        name: course.name,
        description: course.description || "",
        durationMonths: course.durationMonths,
        lessonsPerWeek: course.lessonsPerWeek,
        lessonDurationMin: course.lessonDurationMin,
        pricePerMonth: course.pricePerMonth,
        level: course.level,
      });
    }
  }, [course, reset]); // eslint-disable-line

  const onSubmit = async (values: CourseFormValues) => {
    try {
      setIsSubmitting(true);
      if (isEdit) {
        await academicService.updateGroup(course.id, values as any); // TODO: backend updateCourse metodini service-ga qo'shish kerak
      } else {
        await academicService.createCourse(values);
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
      <div className="relative bg-card w-full max-w-2xl rounded-2xl shadow-modal flex flex-col max-h-full border border-border animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-xl font-bold text-foreground">
            {isEdit ? "Kursni Tahrirlash" : "Yangi Kurs Qo'shish"}
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
            id="course-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Fan */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Fan <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("subjectId", { valueAsNumber: true })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  <option value={0}>Fanni tanlang</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {errors.subjectId && (
                  <p className="text-xs text-red-500">
                    {errors.subjectId.message}
                  </p>
                )}
              </div>

              {/* Kurs nomi */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Kurs nomi <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("name")}
                  type="text"
                  placeholder="Masalan: IELTS Intensive"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>
            </div>

            {/* Daraja va Oylik to'lov */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Darajasi (Level) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("level")}
                  type="text"
                  placeholder="B1, B2, Advanced..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
                {errors.level && (
                  <p className="text-xs text-red-500">{errors.level.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Oylik to'lov (so'm) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("pricePerMonth", { valueAsNumber: true })}
                  type="number"
                  placeholder="400000"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
                {errors.pricePerMonth && (
                  <p className="text-xs text-red-500">
                    {errors.pricePerMonth.message}
                  </p>
                )}
              </div>
            </div>

            {/* Davomiyligi va Darslar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Davomiyligi (oy)
                </label>
                <input
                  {...register("durationMonths", { valueAsNumber: true })}
                  type="number"
                  min={1}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
                {errors.durationMonths && (
                  <p className="text-xs text-red-500">
                    {errors.durationMonths.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Darslar (haftada)
                </label>
                <input
                  {...register("lessonsPerWeek", { valueAsNumber: true })}
                  type="number"
                  min={1}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
                {errors.lessonsPerWeek && (
                  <p className="text-xs text-red-500">
                    {errors.lessonsPerWeek.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Dars vaqti (daq)
                </label>
                <input
                  {...register("lessonDurationMin", { valueAsNumber: true })}
                  type="number"
                  step={15}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
                {errors.lessonDurationMin && (
                  <p className="text-xs text-red-500">
                    {errors.lessonDurationMin.message}
                  </p>
                )}
              </div>
            </div>

            {/* Tavsif */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Qo'shimcha tavsif
              </label>
              <textarea
                {...register("description")}
                rows={3}
                placeholder="Kurs xususiyatlari haqida qisqacha..."
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
              ></textarea>
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
            form="course-form"
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? "Yangilash" : "Saqlash"}
          </button>
        </div>
      </div>
    </div>
  );
}
