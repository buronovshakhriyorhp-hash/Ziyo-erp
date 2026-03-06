import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import {
    Users,
    CheckSquare,
    BookOpenCheck,
    CalendarDays,
    Clock,
    TrendingUp,
    Zap
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function TeacherDashboard() {
    const user = useAuthStore(s => s.user);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Mock KPI Data
    const stats = [
        {
            label: "Jami O'quvchilarim",
            value: "142",
            icon: Users,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20"
        },
        {
            label: "O'rtacha Davomat",
            value: "94%",
            icon: TrendingUp,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20"
        },
        {
            label: "Tekshirilmagan Vazifalar",
            value: "28",
            icon: BookOpenCheck,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20"
        },
        {
            label: "Bugungi Darslar",
            value: "3",
            icon: CalendarDays,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20"
        }
    ];

    // Mock Schedule
    const todaySchedule = [
        { id: 1, time: "14:00 - 16:00", group: "Frontend React (G-12)", room: "Xona 4", students: 18, status: "pending" },
        { id: 2, time: "16:30 - 18:30", group: "JavaScript Asoslari (G-09)", room: "Xona 2", students: 24, status: "pending" },
        { id: 3, time: "19:00 - 21:00", group: "Advanced Node.js (G-15)", room: "Xona 5", students: 15, status: "pending" }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* HERO SECTION */}
            <div className="relative overflow-hidden rounded-[2rem] bg-[#0d1321]/90 backdrop-blur-3xl p-8 md:p-10 shadow-2xl border border-white/10 group">
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none transition-transform group-hover:scale-110 duration-700 mix-blend-screen" />
                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-teal-500/20 blur-[100px] rounded-full pointer-events-none mix-blend-screen" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                            <Zap className="w-3.5 h-3.5 fill-current animate-pulse" />
                            To'liq quvvat bilan ishlamoqda
                        </div>

                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter mix-blend-plus-lighter">
                            Xush kelibsiz, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{user?.firstName}</span> ustoz!
                        </h1>
                        <p className="text-slate-400 font-medium max-w-lg text-sm">
                            Sizning o'quvchilaringiz bugungi darslarni intiqlik bilan kutishmoqda.
                            Barcha guruhlar paneli va topshiriqlar nazorati shu yerda.
                        </p>
                    </div>

                    <div className="flex bg-black/40 border border-white/5 p-4 rounded-3xl backdrop-blur-md shadow-inner w-full md:w-auto items-center gap-4">
                        <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                            <Clock className="w-7 h-7 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-white tracking-widest">
                                {currentTime.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">
                                {currentTime.toLocaleDateString('uz-UZ', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI WIDGETS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-[#131b2f]/80 backdrop-blur-xl border border-white/5 rounded-[1.5rem] p-5 shadow-lg hover:border-white/10 transition-colors group">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.border} border group-hover:scale-110 transition-transform`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-white mb-1">{stat.value}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* SCHEDULE AND QUICK ACTIONS */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* SCHEDULE */}
                <div className="xl:col-span-2 bg-[#131b2f]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                            <div className="w-2 h-6 rounded-full bg-emerald-500"></div>
                            Bugungi dars jadvali
                        </h2>
                        <Link to="/teacher-portal/groups" className="text-xs font-bold text-emerald-400 hover:text-emerald-300">
                            Barcha guruhlar →
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {todaySchedule.map(lesson => (
                            <div key={lesson.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 text-center shrink-0">
                                        <div className="text-xs font-black text-emerald-400">{lesson.time.split(' - ')[0]}</div>
                                        <div className="text-[10px] font-bold text-slate-500">{lesson.time.split(' - ')[1]}</div>
                                    </div>
                                    <div className="w-px h-10 bg-white/10 hidden sm:block"></div>
                                    <div>
                                        <p className="text-sm font-bold text-white leading-tight mb-1">{lesson.group}</p>
                                        <p className="text-[10px] font-medium text-slate-400 flex items-center gap-2">
                                            <span>🏠 {lesson.room}</span>
                                            <span>👥 {lesson.students} o'quvchi</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                    <Link to={`/teacher-portal/attendance?group=${lesson.id}`} className="flex-1 sm:flex-none text-center px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/30 rounded-xl text-xs font-bold transition-all">
                                        Davomat
                                    </Link>
                                    <Link to={`/teacher-portal/homework?group=${lesson.id}`} className="flex-1 sm:flex-none text-center px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/30 rounded-xl text-xs font-bold transition-all">
                                        Vazifa
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* QUICK ACTIONS */}
                <div className="bg-[#131b2f]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 shadow-xl flex flex-col">
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3 mb-6">
                        <div className="w-2 h-6 rounded-full bg-indigo-500"></div>
                        Tezkor harakatlar
                    </h2>

                    <div className="space-y-3 flex-1">
                        <Link to="/teacher-portal/homework" className="flex items-center gap-4 p-4 rounded-2xl bg-black/20 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/30 transition-all group">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors">
                                <BookOpenCheck className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white mb-0.5">Yangi vazifa berish</p>
                                <p className="text-[10px] text-slate-400 font-medium">Guruhga yangi topshiriq yuklash</p>
                            </div>
                        </Link>

                        <Link to="/teacher-portal/attendance" className="flex items-center gap-4 p-4 rounded-2xl bg-black/20 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 transition-all group">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/30 transition-colors">
                                <CheckSquare className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white mb-0.5">Davomatni tekshirish</p>
                                <p className="text-[10px] text-slate-400 font-medium">Yo'qlama va kechikkanlar</p>
                            </div>
                        </Link>

                        <button className="w-full flex items-center gap-4 p-4 rounded-2xl bg-black/20 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 transition-all group text-left">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                                <Users className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white mb-0.5">O'quvchini taqdirlash</p>
                                <p className="text-[10px] text-slate-400 font-medium">Bitta o'quvchiga "Kumush" yuborish</p>
                            </div>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
