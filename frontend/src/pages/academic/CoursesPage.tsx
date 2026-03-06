import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  BookOpen,
  Clock,
  Users,
  Edit,
  Trash2,
} from "lucide-react";
import {
  academicService,
  type Course,
  type PaginatedResponse,
} from "@/services/academic.service";
import { useApi } from "@/hooks/useApi";
import { formatCurrency } from "@/utils/formatters";
import { CourseModal } from "./CourseModal";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
  });
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const { execute, loading } = useApi<PaginatedResponse<Course>>();

  const fetchCourses = async (page = 1) => {
    const res = await execute(() =>
      academicService.getCourses({
        page,
        limit: 12,
        search: search || undefined,
      }),
    );
    if (res) {
      setCourses(res.data);
      setMeta(res.pagination);
    }
  };

  useEffect(() => {
    fetchCourses(meta.page);
  }, [meta.page, search]);

  const handleCreate = () => {
    setSelectedCourse(null);
    setIsModalOpen(true);
  };

  const handleEdit = (course: Course) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    fetchCourses(meta.page);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Sahifa sarlavhasi */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Kurslar</h1>
          <p className="text-muted-foreground mt-1">
            Barcha ta'lim yo'nalishlari va ularning tariflari
          </p>
        </div>
        <button onClick={handleCreate} className="btn-primary">
          <Plus className="w-5 h-5 mr-2" />
          Yangi Kurs
        </button>
      </div>

      {/* Qidiruv */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Kurs nomi bo'yicha qidiruv..."
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-shadow"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setMeta((p) => ({ ...p, page: 1 }));
            }}
          />
        </div>
      </div>

      {/* Kartochkalar (Card View) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading && courses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            Yuklanmoqda...
          </div>
        ) : courses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            Sizning qidiruvingiz bo'yicha kurslar topilmadi.
          </div>
        ) : (
          courses.map((course) => (
            <div
              key={course.id}
              className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow flex flex-col group overflow-hidden"
            >
              <div className="p-5 border-b border-border">
                <div className="flex justify-between items-start mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
                    {course.subjectName}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(course)}
                      className="p-1.5 text-muted-foreground hover:text-brand-600 rounded hover:bg-brand-50 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {/* Delete stub */}
                    <button className="p-1.5 text-muted-foreground hover:text-red-600 rounded hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-brand-600 transition-colors">
                  {course.name}
                </h3>
                <p className="text-sm border-l-2 border-brand-300 pl-2 text-muted-foreground line-clamp-2 min-h-[40px]">
                  {course.description || "Tavsif kiritilmagan"}
                </p>
              </div>

              <div className="p-5 bg-secondary/20 flex-1 flex flex-col justify-between">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground mr-2.5" />
                    <span className="text-muted-foreground">
                      Davomiyligi:{" "}
                      <strong className="text-foreground">
                        {course.durationMonths} oy
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <BookOpen className="w-4 h-4 text-muted-foreground mr-2.5" />
                    <span className="text-muted-foreground">
                      Darslar:{" "}
                      <strong className="text-foreground">
                        {course.lessonsPerWeek} marta/hafta
                      </strong>{" "}
                      ({course.lessonDurationMin} daq)
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Users className="w-4 h-4 text-muted-foreground mr-2.5" />
                    <span className="text-muted-foreground">
                      Faol guruhlar:{" "}
                      <strong className="text-foreground">
                        {course.activeGroups || 0} ta
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border mt-auto flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                      Oylik to'lov
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {formatCurrency(course.pricePerMonth)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                      Daraja
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {course.level}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <CourseModal
          course={selectedCourse}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
