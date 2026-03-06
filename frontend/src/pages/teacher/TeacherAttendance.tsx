import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
    CheckCircle2,
    XCircle,
    Clock,
    Save,
    ChevronLeft,
    Search,
    Loader2,
    AlertCircle
} from "lucide-react";
import { academicService, type Group } from "@/services/academic.service";

interface AttendanceRecord {
    studentId: number;
    name: string;
    status: 'present' | 'absent' | 'late' | 'none';
}

export default function TeacherAttendance() {
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [group, setGroup] = useState<Group | null>(null);

    // Mock students for the checklist
    const [students, setStudents] = useState<AttendanceRecord[]>([
        { studentId: 1, name: "Aliyev Vali", status: 'none' },
        { studentId: 2, name: "Karimov Sardor", status: 'none' },
        { studentId: 3, name: "Rustamov Jasur", status: 'none' },
        { studentId: 4, name: "Murodova Komila", status: 'none' },
        { studentId: 5, name: "Azimov Dilyor", status: 'none' },
    ]);

    const groupId = searchParams.get('group');

    useEffect(() => {
        const load = async () => {
            try {
                // If groupId exists, we would fetch that specific group's students.
                // For now we just mock a valid response.
                const res = await academicService.getGroups();
                setGroup(res.data[0]); // mock selected group
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [groupId]);

    const handleStatusUpdate = (id: number, status: 'present' | 'absent' | 'late') => {
        setStudents(prev => prev.map(s => s.studentId === id ? { ...s, status } : s));
    };

    const markAllPresent = () => {
        setStudents(prev => prev.map(s => ({ ...s, status: 'present' })));
    };

    const handleSave = () => {
        setSaving(true);
        // Simulate API call to save attendance
        setTimeout(() => {
            setSaving(false);
            // Show toast/success in a real app
            window.history.back(); // Or navigate to groups
        }, 1000);
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        </div>
    );

    const stats = {
        total: students.length,
        present: students.filter(s => s.status === 'present').length,
        absent: students.filter(s => s.status === 'absent').length,
        late: students.filter(s => s.status === 'late').length,
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header & Breadcrumb */}
            <div className="flex items-center justify-between bg-[#131b2f]/80 backdrop-blur-xl border border-white/5 rounded-[1.5rem] p-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => window.history.back()} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-white">{group?.name || "Frontend (G-12)"}</h1>
                        <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mt-0.5">Davomat nazorati</p>
                    </div>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-white">Bugun: {new Date().toLocaleDateString('uz-UZ')}</p>
                    <p className="text-[10px] text-slate-400 font-medium">14:00 - 16:00, Xona 4</p>
                </div>
            </div>

            {/* Quick Stats & Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black/20 border border-white/5 rounded-[1.2rem] p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-white">{stats.total}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Jami</span>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[1.2rem] p-4 flex flex-col items-center justify-center text-center shadow-[inset_0_0_15px_rgba(16,185,129,0.05)]">
                    <span className="text-2xl font-black text-emerald-400">{stats.present}</span>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Keldi</span>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-[1.2rem] p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-rose-400">{stats.absent}</span>
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Kelmadi</span>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-[1.2rem] p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-amber-400">{stats.late}</span>
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Kechikdi</span>
                </div>
            </div>

            {/* Checklist Editor */}
            <div className="bg-[#131b2f]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] pointer-events-none rounded-full" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
                    <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 w-full sm:w-64 max-w-sm">
                        <Search className="w-5 h-5 text-slate-500 ml-2 mt-2" />
                        <input type="text" placeholder="O'quvchini izlash..." className="bg-transparent border-none outline-none text-sm text-white px-3 w-full py-2 placeholder-slate-500" />
                    </div>

                    <button
                        onClick={markAllPresent}
                        className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 className="w-4 h-4" /> Barchasini "Keldi" qilish
                    </button>
                </div>

                <div className="space-y-3 relative z-10">
                    {students.map((student) => (
                        <div key={student.studentId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-bold text-slate-300">
                                    {student.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{student.name}</p>
                                    <p className="text-[10px] text-slate-500 font-medium tracking-wide">ID: {student.studentId.toString().padStart(4, '0')}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto p-1 bg-black/40 rounded-xl border border-white/5">
                                <button
                                    onClick={() => handleStatusUpdate(student.studentId, 'present')}
                                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all
                                    ${student.status === 'present' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'}`}
                                >
                                    <CheckCircle2 className="w-4 h-4" /> Keldi
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate(student.studentId, 'absent')}
                                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all
                                    ${student.status === 'absent' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.1)]' : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'}`}
                                >
                                    <XCircle className="w-4 h-4" /> Kelmadi
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate(student.studentId, 'late')}
                                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all
                                    ${student.status === 'late' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]' : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'}`}
                                >
                                    <Clock className="w-4 h-4" /> Kechikdi
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/5 relative z-10">
                    <p className="text-xs text-slate-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-emerald-500" />
                        Davomat saqlangandan so'ng, ota-onalarga avtomatik SMS yuboriladi.
                    </p>
                    <button
                        onClick={handleSave}
                        disabled={saving || students.some(s => s.status === 'none')}
                        className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all
                        ${saving || students.some(s => s.status === 'none')
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-emerald-500/20 hover:scale-[1.02]'}`}
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {saving ? "Saqlanmoqda..." : "Saqlash va Tasdiqlash"}
                    </button>
                </div>
            </div>
        </div>
    );
}
