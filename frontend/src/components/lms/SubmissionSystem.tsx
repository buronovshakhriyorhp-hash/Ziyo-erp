import { useState } from "react";
import {
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Terminal,
  Sparkles,
  MessageSquareDot,
} from "lucide-react";
import { lmsService } from "@/services/lms.service";
import { useUiStore } from "@/store/ui.store";

interface SubmissionSystemProps {
  materialId: number;
}

export function SubmissionSystem({ materialId }: SubmissionSystemProps) {
  const [contentUrl, setContentUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [botLogs, setBotLogs] = useState<string[]>([]);
  const { addToast } = useUiStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentUrl.trim()) return;

    setSubmitting(true);
    setResult(null);
    setBotLogs([]);

    try {
      const data = await lmsService.submitAssignment(materialId, contentUrl);
      setSubmitting(false);
      setGrading(true);

      // Terminal log animatsiya
      const logs = [
        "ZiyoBot: Tizimga ulanish...",
        "ZiyoBot: Faylni tahlil qilish (GPT-4 logic)...",
        "ZiyoBot: Kodlash standartlarini tekshirish...",
        "ZiyoBot: Mantiqiy xatolarni qidirish...",
        "ZiyoBot: Yakuniy natija tayyorlanmoqda...",
      ];

      for (let i = 0; i < logs.length; i++) {
        setBotLogs((prev) => [...prev, logs[i]]);
        await new Promise((r) => setTimeout(r, 600));
      }

      setResult(data.data);
      if (data.data.status === "graded") {
        addToast({ title: "Vazifa qabul qilindi! 🎉", type: "success" });
      }
    } catch (_err) {
      addToast({
        title: "Vazifani yuborishda muammo yuz berdi.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
      setGrading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <MessageSquareDot className="w-4 h-4" />
              Vazifa natijasi (Link yoki matn)
            </label>
            <textarea
              value={contentUrl}
              onChange={(e) => setContentUrl(e.target.value)}
              placeholder="Masalan: https://github.com/profile/repo yoki yozma javob..."
              className="w-full min-h-[120px] p-4 bg-secondary/30 border border-border rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none"
              disabled={submitting || grading}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || grading || !contentUrl.trim()}
            className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-500/20"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                Vazifani topshirish
              </>
            )}
          </button>
        </form>
      ) : null}

      {/* ZiyoBot Logs / Feedback Section */}
      {(grading || result) && (
        <div className="space-y-4 animate-in zoom-in-95 duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 via-purple-500 to-amber-500 animate-pulse"></div>

            <div className="flex items-center gap-2 text-slate-400 mb-4 border-b border-slate-800 pb-2">
              <Terminal className="w-4 h-4" />
              <span className="text-xs font-mono uppercase tracking-widest">
                ZiyoBot AI Terminal v2.0
              </span>
            </div>

            <div className="space-y-2 font-mono text-sm">
              {botLogs.map((log, i) => (
                <div key={i} className="text-slate-300 flex items-start gap-2">
                  <span className="text-brand-500">{">"}</span>
                  {log}
                </div>
              ))}

              {grading && (
                <div className="text-slate-300 flex items-center gap-2">
                  <span className="text-brand-500 animate-pulse">{">"}</span>
                  <span className="w-2 h-4 bg-brand-500 animate-caret"></span>
                </div>
              )}

              {result && (
                <div
                  className={`mt-6 p-4 rounded-xl border-l-4 ${
                    result.status === "graded"
                      ? "bg-emerald-900/20 border-emerald-500 text-emerald-400"
                      : "bg-rose-900/20 border-rose-500 text-rose-400"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {result.status === "graded" ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                    <span className="font-bold">Tekshiruv yakunlandi!</span>
                  </div>
                  <p className="text-sm leading-relaxed opacity-90">
                    {result.aiFeedback}
                  </p>

                  {result.earnedXp > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-amber-400 font-bold">
                      <Sparkles className="w-4 h-4" />
                      Bonus: +{result.earnedXp} XP Awarded!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {result && (
            <button
              onClick={() => {
                setResult(null);
                setBotLogs([]);
                setContentUrl("");
              }}
              className="w-full py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Qayta topshirish
            </button>
          )}
        </div>
      )}
    </div>
  );
}
