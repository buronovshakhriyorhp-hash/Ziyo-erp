import { useState, useEffect } from "react";
import { lmsService, GroupTask } from "../../services/lms.service";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useUiStore } from "../../store/ui.store";
import { CheckCircle, Clock, UploadCloud, Link as LinkIcon } from "lucide-react";

export default function StudentHomeworks() {
    const { addToast } = useUiStore();
    const [tasks, setTasks] = useState<GroupTask[]>([]);
    const [selectedTask, setSelectedTask] = useState<GroupTask | null>(null);
    const [submissionUrl, setSubmissionUrl] = useState("");
    const [, setLoading] = useState(true);

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        setLoading(true);
        try {
            const data = await lmsService.getStudentTasks();
            setTasks(data);
        } catch {
            addToast({ title: "Xatolik", description: "Vazifalarni yuklab bo'lmadi", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTask || !submissionUrl) return;

        try {
            await lmsService.submitGroupTask(selectedTask.id, submissionUrl);
            addToast({ title: "Muvaffaqiyatli", description: "Vazifa yuborildi", type: "success" });
            setSubmissionUrl("");
            setSelectedTask(null);
            loadTasks();
        } catch {
            addToast({ title: "Xatolik ro'y berdi", type: "error" });
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">Mening Vazifalarim</h1>
                <p className="text-slate-500 text-sm">Uy vazifalari va Maxsus XP topshiriqlari bu yerda jamlangan.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 border-b pb-2">Barcha vazifalar ({tasks.length})</h2>
                    {tasks.length === 0 ? (
                        <div className="p-10 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                            Hozirgi vaqtda sizga biriktirilgan vazifalar yo'q.
                        </div>
                    ) : (
                        tasks.map(t => (
                            <Card
                                key={t.id}
                                className={`p-5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg ${selectedTask?.id === t.id ? 'ring-2 ring-blue-500' : ''}`}
                                onClick={() => setSelectedTask(t)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        {t.title}
                                        {t.taskType === 'gamified' && <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Extra XP</span>}
                                    </h3>
                                    <div className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${t.submission_status === 'graded' ? 'bg-green-100 text-green-700' :
                                            t.submission_status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {t.submission_status === 'graded' ? 'Tekshirilgan' : t.submission_status === 'pending' ? 'Kutilmoqda' : 'Yuborilmagan'}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                                    <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Muddat: {new Date(t.deadline).toLocaleDateString()}</div>
                                    <div className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                                        {t.xpReward} XP / {t.maxScore} Ball
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                <div className="space-y-4">
                    {selectedTask ? (
                        <Card className="p-6 border-none shadow-premium bg-white sticky top-24">
                            <h2 className="text-xl font-black text-slate-800 mb-2">{selectedTask.title}</h2>
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6 text-sm text-slate-700 leading-relaxed font-medium">
                                {selectedTask.description}
                            </div>

                            {selectedTask.submission_status === 'graded' ? (
                                <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center space-y-2">
                                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                                    <h4 className="font-bold text-green-800 text-lg">Topshiriq tekshirilgan!</h4>
                                    <p className="text-sm font-semibold text-green-700/80">Siz {selectedTask.earned_xp || 0} XP oldingiz!</p>
                                    {selectedTask.ai_feedback && (
                                        <div className="mt-4 p-4 bg-white rounded-xl text-sm italic text-slate-600 shadow-sm border text-left">
                                            " {selectedTask.ai_feedback} "
                                        </div>
                                    )}
                                </div>
                            ) : selectedTask.submission_status === 'pending' ? (
                                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex items-center justify-center flex-col text-center space-y-2">
                                    <Clock className="w-12 h-12 text-amber-500 mx-auto animate-pulse" />
                                    <h4 className="font-bold text-amber-800 text-lg">Javobingiz tekshirilmoqda...</h4>
                                    <p className="text-sm font-semibold text-amber-700/80">O'qituvchi tez orada baholaydi.</p>
                                    <div className="mt-4 text-xs text-slate-500 break-all bg-white p-2 rounded border max-w-full overflow-hidden">
                                        Yuborilgan havola: {selectedTask.submitted_url}
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                                            <LinkIcon className="w-4 h-4 text-blue-500" /> Natija havolasi (Link)
                                        </label>
                                        <p className="text-xs text-slate-500 mb-3">Google Drive, Github yoki boshqa manzil orqali faylni yuboring.</p>
                                        <input
                                            type="url"
                                            required
                                            value={submissionUrl}
                                            onChange={e => setSubmissionUrl(e.target.value)}
                                            className="w-full h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <Button type="submit" className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 gap-2">
                                        <UploadCloud className="w-5 h-5" /> Yuborish
                                    </Button>
                                </form>
                            )}
                        </Card>
                    ) : (
                        <div className="hidden lg:flex flex-col items-center justify-center py-40 text-slate-400 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200/50">
                            <CheckCircle className="w-16 h-16 opacity-20 mb-4" />
                            <p className="font-medium text-lg text-slate-500">Batafsil ko'rish uchun vazifani tanlang</p>
                            <p className="text-sm mt-1 opacity-70">Siz doim bu yerda javoblarni yuborishingiz mumkin.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
