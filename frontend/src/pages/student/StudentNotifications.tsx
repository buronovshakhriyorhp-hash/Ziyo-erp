import { useState } from "react";
import { Bell, Trash2, CheckCircle2 } from "lucide-react";

interface AppNotification {
    id: number;
    text: string;
    date: string;
    unread: boolean;
    type: "warning" | "success" | "info";
}

export default function StudentNotifications() {
    const [filter, setFilter] = useState("Barchasi");

    const [notifications, setNotifications] = useState<AppNotification[]>([
        {
            id: 1,
            text: "Imtihon vazifasi muddati tugashiga juda oz vaqt qoldi. Shoshiling!",
            date: "05 Mart, 2026 16:10",
            unread: false,
            type: "warning"
        },
        {
            id: 2,
            text: "Darsda qatnashgani uchun bonuslar taqdim qilindi 😍",
            date: "05 Mart, 2026 11:32",
            unread: true,
            type: "success"
        },
        {
            id: 3,
            text: "Sizga imtihon vazifasi berildi. Marhamat tanishib chiqing.",
            date: "05 Mart, 2026 11:31",
            unread: false,
            type: "info"
        },
        {
            id: 4,
            text: "Darsda qatnashgani uchun bonuslar taqdim qilindi 😍",
            date: "05 Mart, 2026 08:51",
            unread: true,
            type: "success"
        },
        {
            id: 5,
            text: "Darsda qatnashgani uchun bonuslar taqdim qilindi 😍",
            date: "03 Mart, 2026 11:23",
            unread: true,
            type: "success"
        },
        {
            id: 6,
            text: "Sizga uy vazifa berildi. Marhamat tanishib chiqing.",
            date: "03 Mart, 2026 10:15",
            unread: false,
            type: "info"
        }
    ]);

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    const filteredNav = notifications.filter(n => {
        if (filter === "O'qilmagan") return n.unread;
        return true;
    });

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 h-full overflow-y-auto">

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)]">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 sm:mb-0 flex items-center gap-2">
                        <Bell className="w-6 h-6 text-brand-500" /> Xabarnomalar
                    </h1>

                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all cursor-pointer"
                        >
                            <option value="Barchasi">Barchasi</option>
                            <option value="O'qilmagan">O'qilmagan</option>
                        </select>

                        <button
                            onClick={markAllRead}
                            title="Barchasini o'qilgan deb belgilash"
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-500 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 transition-colors"
                        >
                            <CheckCircle2 className="w-5 h-5" />
                        </button>

                        <button
                            onClick={clearAll}
                            title="Tozalash"
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-500 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="space-y-4">
                    {filteredNav.map(n => (
                        <div
                            key={n.id}
                            className={`relative p-5 rounded-2xl border transition-all duration-300
                 ${n.unread
                                    ? 'bg-brand-50/50 dark:bg-brand-900/10 border-brand-200 dark:border-brand-800/50 shadow-sm'
                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                                }
               `}
                        >
                            <h3 className={`text-base pr-8 mb-2 ${n.unread ? 'font-bold text-slate-800 dark:text-white' : 'font-semibold text-slate-600 dark:text-slate-300'}`}>
                                {n.text}
                            </h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-500 flex items-center gap-1.5">
                                {n.date}
                            </p>

                            {n.unread && (
                                <div className="absolute top-6 right-6 w-2.5 h-2.5 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse"></div>
                            )}
                        </div>
                    ))}

                    {filteredNav.length === 0 && (
                        <div className="py-20 text-center flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                            <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
                            <h3 className="text-lg font-bold text-slate-500 dark:text-slate-400">Hozircha xabarnomalar yo'q</h3>
                        </div>
                    )}
                </div>

            </div>

        </div>
    );
}
