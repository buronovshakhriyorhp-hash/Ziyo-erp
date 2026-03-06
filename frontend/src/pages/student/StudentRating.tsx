import { useState } from "react";
import {
    Trophy,
    Medal,
    Award,
    Star,
    Users,
    Building2,
    Globe2,
    CalendarDays,
    CalendarRange,
    Calendar,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

type FilterScope = "group" | "branch" | "all";
type FilterTime = "weekly" | "monthly" | "3months";

export default function StudentRating() {
    const user = useAuthStore((s) => s.user);
    const [scope, setScope] = useState<FilterScope>("branch");
    const [time, setTime] = useState<FilterTime>("monthly");

    const getScopeTitle = () => {
        switch (scope) {
            case "group": return "Guruh bo'yicha yetakchilar";
            case "branch": return "Filial bo'yicha yetakchilar";
            case "all": return "Barcha filiallar bo'yicha yetakchilar";
        }
    };

    // Mock Data mimicking screenshot
    const leaderboard = [
        { id: 1, name: "Xusanboy Abdurahmonov Ilhomjon o'g'li", courses: ["1. Backend Python Django (Standard)", "2. Bootcamp Full Stack NodeJS+VueJS", "3. Bootcamp Foundation uch yarim oylik"], xp: 104 },
        { id: 2, name: "Behzodbek Turdaliyev", courses: ["1. Backend Python Django (Standard)"], xp: 63 },
        { id: 3, name: "Sanjarbek Razzoqov", courses: ["1. English for IT", "2. Bootcamp Foundation", "3. OLD Foundations of Programming"], xp: 60 },
        { id: 4, name: "Shohzafar Abduqahhorov", courses: ["1. Frontend ReactJS (Standard)", "2. Backend Python Django (Standard)"], xp: 60 },
        { id: 5, name: "Yusufbek Rahimov", courses: ["1. Backend Python Django (Standard)", "2. Bootcamp Foundation uch yarim oylik"], xp: 60 },
        { id: 6, name: "Shahzodbek Davronov", courses: ["1. Bootcamp Foundation uch yarim oylik", "2. Bootcamp Foundation"], xp: 52 },
    ];

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 h-full overflow-y-auto">

            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Trophy className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                    {getScopeTitle()}
                </h1>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">

                {/* Sidebar Filters */}
                <div className="w-full lg:w-[280px] shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
                    <div className="space-y-6">

                        {/* Scope Filter */}
                        <div className="space-y-2">
                            <FilterButton
                                active={scope === "group"}
                                onClick={() => setScope("group")}
                                icon={<Users className="w-4 h-4" />}
                                label="Guruhim bo'yicha"
                            />
                            <FilterButton
                                active={scope === "branch"}
                                onClick={() => setScope("branch")}
                                icon={<Building2 className="w-4 h-4" />}
                                label="Filial bo'yicha"
                            />
                            <FilterButton
                                active={scope === "all"}
                                onClick={() => setScope("all")}
                                icon={<Globe2 className="w-4 h-4" />}
                                label="Barcha filiallar bo'yicha"
                            />
                        </div>

                        <div className="h-px bg-slate-200 dark:bg-slate-800 w-full"></div>

                        {/* Time Filter */}
                        <div className="space-y-2">
                            <FilterButton
                                active={time === "weekly"}
                                onClick={() => setTime("weekly")}
                                icon={<CalendarDays className="w-4 h-4" />}
                                label="Haftalik"
                            />
                            <FilterButton
                                active={time === "monthly"}
                                onClick={() => setTime("monthly")}
                                icon={<Calendar className="w-4 h-4" />}
                                label="Oylik"
                            />
                            <FilterButton
                                active={time === "3months"}
                                onClick={() => setTime("3months")}
                                icon={<CalendarRange className="w-4 h-4" />}
                                label="3 oy"
                            />
                        </div>
                    </div>
                </div>

                {/* Leaderboard Table */}
                <div className="flex-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)]">

                    <div className="grid grid-cols-[80px_1fr_1fr_100px] gap-4 p-6 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-500 uppercase tracking-wider">
                        <div className="text-center">Reyting</div>
                        <div>Ism-familiya</div>
                        <div>Kurs</div>
                        <div className="text-center">XP</div>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {leaderboard.map((student, idx) => {
                            const rank = idx + 1;
                            const isCurrentUser = user?.firstName && student.name.includes(user.firstName);

                            const rankDisplay = () => {
                                if (rank === 1) return <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto shadow-sm ring-1 ring-amber-500/30"><Trophy className="w-4 h-4" /></div>;
                                if (rank === 2) return <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 flex items-center justify-center mx-auto shadow-sm ring-1 ring-slate-400/30"><Medal className="w-4 h-4" /></div>;
                                if (rank === 3) return <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center mx-auto shadow-sm ring-1 ring-orange-600/30"><Award className="w-4 h-4" /></div>;
                                return <span className="text-lg font-bold text-slate-400 dark:text-slate-500 w-8 text-center inline-block">{rank}</span>;
                            };

                            return (
                                <div
                                    key={student.id}
                                    className={`grid grid-cols-[80px_1fr_1fr_100px] gap-4 p-6 items-center transition-colors
                    ${isCurrentUser
                                            ? 'bg-brand-50/50 dark:bg-brand-900/10 hover:bg-brand-50 dark:hover:bg-brand-900/20'
                                            : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                                        }
                  `}
                                >
                                    <div className="text-center">
                                        {rankDisplay()}
                                    </div>
                                    <div className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                                        {student.name}
                                        {isCurrentUser && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                                    </div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                        {student.courses.map((course, i) => (
                                            <div key={i} className="truncate" title={course}>{course}</div>
                                        ))}
                                    </div>
                                    <div className="text-center font-black text-emerald-600 dark:text-emerald-400 text-lg">
                                        {student.xp}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>

            </div>

        </div>
    );
}

function FilterButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon?: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-semibold transition-all duration-300 pointer-events-auto
        ${active
                    ? 'bg-gradient-to-r from-brand-500 to-blue-600 text-white shadow-md shadow-brand-500/20 scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }
      `}
        >
            {icon && <span className={`${active ? 'text-white/90' : 'text-slate-400'}`}>{icon}</span>}
            <span>{label}</span>
        </button>
    );
}
