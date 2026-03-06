import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    Users,
    Search,
    ChevronRight,
    Loader2,
    Calendar,
    GraduationCap,
    Award,
    Phone,
    MapPin,
    ArrowUpRight
} from "lucide-react";
import { academicService, type Group } from "@/services/academic.service";
import { useUiStore } from "@/store/ui.store";

export default function TeacherGroups() {
    const [loading, setLoading] = useState(true);
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const { addToast } = useUiStore();

    // Mock students data for the selected group
    const mockStudents = [
        { id: 1, name: "Aliyev Vali", phone: "+998 90 123 45 67", xp: 1450, level: 12, attendance: 95 },
        { id: 2, name: "Karimov Sardor", phone: "+998 93 456 78 90", xp: 850, level: 8, attendance: 82 },
        { id: 3, name: "Rustamov Jasur", phone: "+998 99 987 65 43", xp: 2100, level: 18, attendance: 100 },
        { id: 4, name: "Murodova Komila", phone: "+998 91 111 22 33", xp: 1100, level: 10, attendance: 90 },
        { id: 5, name: "Azimov Dilyor", phone: "+998 97 777 88 99", xp: 600, level: 5, attendance: 75 },
    ];

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                // In a real app, we'd filter by the current teacher's ID.
                const res = await academicService.getGroups();
                // Just mocking the first 4 groups for the UI simulation
                setGroups(res.data.slice(0, 4));
            } catch (error) {
                console.error("Guruhlarni yuklashda xatolik:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGroups();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                            <Users className="w-5 h-5" />
                        </div>
                        Mening Guruhlarim
                    </h1>
                    <p className="text-slate-400 text-sm font-medium">Barcha guruhlaringiz ro'yxati va o'quvchilar tahlili</p>
                </div>

                <div className="bg-black/20 border border-white/5 rounded-full px-4 py-2 flex items-center gap-3 w-full md:w-72 focus-within:border-emerald-500/50 transition-colors">
                    <Search className="text-slate-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Guruh izlash..."
                        className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-slate-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {groups.map((group) => (
                    <div
                        key={group.id}
                        onClick={() => setSelectedGroup(group)}
                        className={`group cursor-pointer relative overflow-hidden bg-[#131b2f]/80 backdrop-blur-xl border rounded-[1.5rem] p-6 transition-all duration-300 hover:-translate-y-1 shadow-xl
                        ${selectedGroup?.id === group.id ? 'border-emerald-500/50 shadow-[0_10px_30px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50' : 'border-white/5 hover:border-white/10'}`}
                    >
                        {selectedGroup?.id === group.id && (
                            <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
                        )}

                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-600/20 border border-emerald-500/30 flex items-center justify-center">
                                <GraduationCap className="w-6 h-6 text-emerald-400" />
                            </div>
                            <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 uppercase tracking-widest border border-emerald-500/20">
                                {group.status}
                            </span>
                        </div>

                        <h3 className="text-xl font-black text-white mb-2">{group.name}</h3>

                        <div className="space-y-2 mt-4">
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <Calendar className="w-4 h-4 text-emerald-400/70" /> {group.startTime} - {group.endTime} (Dush, Chosh, Juma)
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <MapPin className="w-4 h-4 text-rose-400/70" /> {group.roomName || "Noma'lum xona"}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <Users className="w-4 h-4 text-blue-400/70" /> {group.currentStudents || (Math.floor(Math.random() * 10) + 12)} ta o'quvchi
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Roster View */}
            {selectedGroup && (
                <div className="bg-[#131b2f]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 md:p-8 shadow-xl animate-in slide-in-from-top-4 duration-500">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                {selectedGroup.name} <span className="text-emerald-400">O'quvchilari</span>
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">O'quvchilar ro'yxati va ularning joriy darajasi</p>
                        </div>
                        <div className="flex gap-3">
                            <Link to={`/teacher-portal/attendance?group=${selectedGroup.id}`} className="px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                                Davomat <ArrowUpRight className="w-4 h-4" />
                            </Link>
                            <Link to={`/teacher-portal/homework?group=${selectedGroup.id}`} className="px-5 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                                Vazifa <ArrowUpRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-slate-400 text-xs uppercase tracking-widest">
                                    <th className="px-4 py-4 font-bold">F.I.O</th>
                                    <th className="px-4 py-4 font-bold">Telefon</th>
                                    <th className="px-4 py-4 font-bold text-center">Bosqich (Level)</th>
                                    <th className="px-4 py-4 font-bold text-center">Davomat</th>
                                    <th className="px-4 py-4 font-bold text-right">Amallar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {mockStudents.map(student => (
                                    <tr key={student.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-4 py-4 font-medium text-white flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300">
                                                {student.name.charAt(0)}
                                            </div>
                                            {student.name}
                                        </td>
                                        <td className="px-4 py-4 text-slate-400">
                                            <a href={`tel:${student.phone.replace(/\s+/g, '')}`} className="flex items-center gap-2 hover:text-emerald-400 transition-colors">
                                                <Phone className="w-3.5 h-3.5" />
                                                {student.phone}
                                            </a>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <Award className="w-4 h-4 text-amber-400" />
                                                <span className="font-black text-amber-400">{student.level}</span>
                                                <span className="text-[10px] text-slate-500">({student.xp} XP)</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${student.attendance >= 90 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                student.attendance >= 75 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                    'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                }`}>
                                                {student.attendance}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <button
                                                onClick={() => {
                                                    addToast({
                                                        title: "Tez orada",
                                                        description: "O'quvchi profiliga o'tish hozircha ishlab chiqarilmoqda.",
                                                        type: "info"
                                                    });
                                                }}
                                                className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg transition-colors group-hover:scale-105"
                                                title="Profilini ko'rish"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
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
