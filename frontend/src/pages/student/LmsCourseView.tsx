import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ChevronLeft,
  PlayCircle,
  FileText,
  Send,
  AlertCircle,
  GraduationCap,
  Lock,
  Loader2,
} from "lucide-react";
import { lmsService, CourseMaterial } from "@/services/lms.service";
import { SubmissionSystem } from "@/components/lms/SubmissionSystem";

export default function LmsCourseView() {
  const { courseId } = useParams<{ courseId: string }>();
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [activeMaterial, setActiveMaterial] = useState<CourseMaterial | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!courseId) return;
      try {
        setLoading(true);
        const data = await lmsService.getCourseMaterials(parseInt(courseId));
        setMaterials(data);
        if (data.length > 0) setActiveMaterial(data[0]);
      } catch (err: any) {
        if (err.response?.status === 403) {
          setError("Sizga bu kurs materiallariga kirish ruxsati berilmagan.");
        } else {
          setError("Materiallarni yuklashda xatolik yuz berdi.");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
        <p className="text-muted-foreground animate-pulse">
          Materiallar tayyorlanmoqda...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center space-y-4 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-border">
        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Ruxsat yo'q</h2>
        <p className="text-muted-foreground">{error}</p>
        <Link
          to="/student-portal"
          className="inline-block px-6 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors"
        >
          Dashboardga qaytish
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] gap-6 animate-in fade-in duration-500">
      {/* Sidebar: Materiallar ro'yxati */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        <Link
          to="/student-portal"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Orqaga qaytish
        </Link>

        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 border border-border rounded-2xl p-4 space-y-2 thin-scrollbar">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-brand-600" />
            Dars materiallari
          </h3>

          {materials.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMaterial(m)}
              className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${
                activeMaterial?.id === m.id
                  ? "bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border-l-4 border-brand-600"
                  : "hover:bg-secondary/50 text-muted-foreground"
              }`}
            >
              {m.type === "video" && (
                <PlayCircle className="w-5 h-5 flex-shrink-0" />
              )}
              {m.type === "pdf" && (
                <FileText className="w-5 h-5 flex-shrink-0" />
              )}
              {m.type === "assignment" && (
                <Send className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium line-clamp-2">
                {m.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Player / Viewer */}
      <div className="flex-1 bg-white dark:bg-slate-900 border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col">
        {activeMaterial ? (
          <>
            {/* Material Header */}
            <div className="p-6 border-b border-border bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-2xl font-bold text-foreground">
                {activeMaterial.title}
              </h2>
              {activeMaterial.description && (
                <p className="text-muted-foreground mt-2">
                  {activeMaterial.description}
                </p>
              )}
            </div>

            {/* Viewer */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 thin-scrollbar">
              {activeMaterial.type === "video" && (
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl">
                  <iframe
                    src={activeMaterial.contentUrl.replace(
                      "watch?v=",
                      "embed/",
                    )}
                    className="w-full h-full"
                    allowFullScreen
                    title={activeMaterial.title}
                  ></iframe>
                </div>
              )}

              {activeMaterial.type === "pdf" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="font-semibold">O'quv qo'llanma (PDF)</p>
                        <p className="text-xs text-muted-foreground">
                          Faylni ko'rish va yuklab olish uchun bosing
                        </p>
                      </div>
                    </div>
                    <a
                      href={activeMaterial.contentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Ochish
                    </a>
                  </div>
                  <div className="h-[600px] w-full rounded-xl border border-border overflow-hidden">
                    <iframe
                      src={activeMaterial.contentUrl}
                      className="w-full h-full"
                    ></iframe>
                  </div>
                </div>
              )}

              {activeMaterial.type === "assignment" && (
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-3xl">
                    <h4 className="font-bold text-lg text-amber-900 dark:text-amber-400 flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5" />
                      Vazifa talablari
                    </h4>
                    <p className="text-amber-800 dark:text-amber-300/80 leading-relaxed">
                      Ushbu dars bo'yicha olgan bilimlaringizni amalda qo'llang.
                      Tayyor bo'lganingizdan so'ng, natijani link yoki fayl
                      ko'rinishida quyida topshiring. ZiyoBot uni avtomatik
                      tekshiradi va sizga XP taqdim etadi!
                    </p>
                  </div>

                  <SubmissionSystem materialId={activeMaterial.id} />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <BookOpen className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold">Darsni tanlang</h3>
            <p className="text-muted-foreground mt-2 max-w-xs">
              Chap tarafdagi ro'yxatdan darsni tanlab, o'rganishni boshlashingiz
              mumkin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function BookOpen(props: any) {
  return <GraduationCap {...props} />;
}
