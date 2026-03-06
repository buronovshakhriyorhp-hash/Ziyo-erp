import { useState } from "react";
import { ChevronLeft, Plus, UploadCloud, Link as LinkIcon, CalendarClock, BookOpenCheck, ChevronRight, Gem } from "lucide-react";
import { useUiStore } from "@/store/ui.store";

export default function TeacherHomework() {
    const [activeTab, setActiveTab] = useState<'create' | 'review'>('create');
    const [rewardActive, setRewardActive] = useState(false);
    const { addToast } = useUiStore();

    const mockSubmissions = [
        { id: 1, name: "Aliyev Vali", status: "submitted", date: "Bugun 14:30" },
        { id: 2, name: "Karimov Sardor", status: "graded", xp: 100, date: "Kecha 18:00" },
        { id: 3, name: "Rustamov Jasur", status: "late", date: "So'ngi muddat o'tgan" },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between bg-[#131b2f]/80 backdrop-blur-xl border border-white/5 rounded-[1.5rem] p-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => window.history.back()} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-white">Uy Vazifalari va Baholash</h1>
                        <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mt-0.5">Frontend (G-12)</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-black/20 p-1.5 rounded-2xl border border-white/5 w-full sm:w-max">
                <button
                    onClick={() => setActiveTab('create')}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'create'
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    Vazifa Berish
                </button>
                <button
                    onClick={() => setActiveTab('review')}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'review'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    Tekshirish va Baholash
                </button>
            </div>

            {/* Content Area */}
            {activeTab === 'create' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-[#131b2f]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 shadow-xl space-y-5">
                        <h2 className="text-lg font-black text-white flex items-center gap-2 mb-4">
                            <Plus className="w-5 h-5 text-indigo-400" /> Yangi vazifa yaratish
                        </h2>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mavzu / Nomi</label>
                            <input type="text" placeholder="Masalan: React Props va State" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">To'liq Tavsif</label>
                            <textarea rows={4} placeholder="Vazifa shartlari va talablarini yozing..." className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors resize-none" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5" /> Muddat (Deadline)</label>
                                <input type="datetime-local" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors [color-scheme:dark]" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Gem className="w-3.5 h-3.5" /> Maksimal XP / Ball</label>
                                <input type="number" placeholder="100" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors" defaultValue={100} />
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Qo'shimcha Materiallar (Ixtiyoriy)</label>
                            <div className="flex gap-3">
                                <button className="flex-1 border border-dashed border-white/20 rounded-xl py-6 flex flex-col items-center justify-center gap-2 hover:bg-white/5 hover:border-indigo-500/50 transition-all text-slate-400 group">
                                    <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <UploadCloud className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <span className="text-xs font-bold">Fayl yuklash</span>
                                </button>
                                <button className="flex-1 border border-dashed border-white/20 rounded-xl py-6 flex flex-col items-center justify-center gap-2 hover:bg-white/5 hover:border-indigo-500/50 transition-all text-slate-400 group">
                                    <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <LinkIcon className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <span className="text-xs font-bold">Havola (Link)</span>
                                </button>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                onClick={() => addToast({ title: "Muvaffaqiyatli", description: "Vazifa yuklandi va o'quvchilarga/ota-onalarga SMS jo'natildi!", type: "success" })}
                                className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all flex items-center gap-2"
                            >
                                <BookOpenCheck className="w-5 h-5" /> Vazifani Yuklash va SMS Jo'natish
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#131b2f]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 shadow-xl h-max">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Gem className="w-4 h-4 text-cyan-400" /> Dars davomida rag'bat
                            </h3>
                            <button
                                onClick={() => setRewardActive(!rewardActive)}
                                className={`w-10 h-6 rounded-full transition-colors relative ${rewardActive ? 'bg-emerald-500' : 'bg-slate-700'}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${rewardActive ? 'left-5' : 'left-1'}`} />
                            </button>
                        </div>

                        {rewardActive ? (
                            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                <p className="text-xs text-slate-400 border-l-2 border-emerald-400 pl-3">Darsda faol qatnashayotgan o'quvchilarga bir marta bosish orqali "Kumush" yuborishingiz mumkin.</p>
                                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                    {mockSubmissions.map(s => (
                                        <div key={s.id} className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl p-3">
                                            <span className="text-sm font-bold text-white">{s.name}</span>
                                            <button
                                                onClick={() => addToast({ title: "Rag'batlantirildi", description: `${s.name}ga 10 Kumush taqdim etildi!`, type: "success" })}
                                                className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                                            >
                                                +10 <Gem className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3">
                                    <Gem className="w-6 h-6 text-slate-600" />
                                </div>
                                <p className="text-xs text-slate-500 font-medium">Jonli rag'batlantirish o'chirilgan. Yoqish ustiga bosing.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-[#131b2f]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 md:p-8 shadow-xl">
                    <h2 className="text-xl font-black text-white flex items-center gap-3 mb-6">
                        <div className="w-2 h-6 rounded-full bg-emerald-500"></div>
                        Topshirilgan vazifalar
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-slate-400 text-xs uppercase tracking-widest">
                                    <th className="px-4 py-4 font-bold">F.I.O</th>
                                    <th className="px-4 py-4 font-bold">Topshirdi</th>
                                    <th className="px-4 py-4 font-bold">Status</th>
                                    <th className="px-4 py-4 font-bold text-right">Amal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {mockSubmissions.map(student => (
                                    <tr key={student.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-4 py-4 font-medium text-white flex items-center gap-3">
                                            {student.name}
                                        </td>
                                        <td className="px-4 py-4 text-slate-400 text-xs">
                                            {student.date}
                                        </td>
                                        <td className="px-4 py-4">
                                            {student.status === 'submitted' && <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">Kutmoqda</span>}
                                            {student.status === 'graded' && <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">{student.xp} XP</span>}
                                            {student.status === 'late' && <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">Kelmadi/Kech</span>}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            {student.status === 'submitted' ? (
                                                <button
                                                    onClick={() => addToast({ title: "Baholash", description: "Baholash oynasi tez kunda qo'shiladi.", type: "info" })}
                                                    className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition-colors"
                                                >
                                                    Baholash
                                                </button>
                                            ) : (
                                                <button className="p-2 text-slate-500 hover:text-white transition-colors">
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
