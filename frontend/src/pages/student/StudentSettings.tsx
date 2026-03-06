import { useState } from "react";
import {
    User,
    Phone,
    CalendarDays,
    Hash,
    Fingerprint,
    KeyRound,
    Bell,
    FileText,
    PencilLine,
    ChevronRight,
    ShieldCheck
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useEffect } from "react";
import { financeService, PaymentDebt } from "@/services/finance.service";
import { settingsService } from "@/services/settings.service";

export default function StudentSettings() {
    const user = useAuthStore((s) => s.user);
    const [debts, setDebts] = useState<PaymentDebt[]>([]);
    const [loadingDebts, setLoadingDebts] = useState(true);
    const [paymentConfig, setPaymentConfig] = useState({
        payme_merchant_id: "",
        click_service_id: "",
        click_merchant_user_id: "",
    });

    useEffect(() => {
        if (!user) return;

        const fetchBillingInfo = async () => {
            setLoadingDebts(true);
            try {
                const [debtsRes, configRes] = await Promise.all([
                    financeService.getDebts({ studentId: user.id }),
                    settingsService.getPaymentConfig()
                ]);

                // Faqat qarzi bor (pending/partial/overdue) guruhlarni ajratamiz yoki hammasini ko'rsatamiz
                // Yaxshisi pending|partial larni filter qilamiz:
                const activeDebts = (debtsRes.data || []).filter((d: PaymentDebt) =>
                    d.status === "pending" || d.status === "partial" || d.status === "overdue"
                );

                setDebts(activeDebts);
                setPaymentConfig(configRes);
            } catch (error) {
                console.error("Billing fetch error:", error);
            } finally {
                setLoadingDebts(false);
            }
        };

        void fetchBillingInfo();
    }, [user]);

    const generatePaymeUrl = (amount: number, enrollmentId: number) => {
        const m = paymentConfig.payme_merchant_id;
        if (!m) return "#";
        const amountTiyin = amount * 100;
        // Data format: m=MERCHANT_ID;ac.enrollment_id=ENROLLMENT_ID;a=AMOUNT
        const dataStr = `m=${m};ac.enrollment_id=${enrollmentId};a=${amountTiyin}`;
        const encoded = btoa(dataStr);
        return `https://checkout.paycom.uz/${encoded}`;
    };

    const generateClickUrl = (amount: number, enrollmentId: number) => {
        const sid = paymentConfig.click_service_id;
        const mid = paymentConfig.click_merchant_user_id;
        if (!sid || !mid) return "#";
        return `https://my.click.uz/services/pay?service_id=${sid}&merchant_user_id=${mid}&amount=${amount}&transaction_param=${enrollmentId}`;
    };

    // Mock student details
    const student = {
        firstName: user?.firstName || "Shaxriyor",
        lastName: user?.lastName || "Bo'ronov",
        phone: user?.phone || "(+998) 91 100 91 22",
        birthDate: "14 Yan, 2007",
        gender: "Erkak",
        studentId: user?.id || "40832"
    };

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 h-full overflow-y-auto">

            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                    Sozlamalar
                </h1>
                <p className="text-slate-500 mt-2">Shaxsiy profilingizni va xavfsizlik sozlamalarini boshqaring.</p>
            </div>

            {/* Shaxsiy ma'lumotlar Card */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <User className="w-5 h-5 text-brand-500" /> Shaxsiy ma'lumotlar
                </h2>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Avatar Section - Optional Photo */}
                    <div className="shrink-0 flex flex-col items-center gap-3">
                        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 overflow-hidden relative group cursor-pointer">
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <PencilLine className="w-6 h-6 text-white" />
                            </div>
                            <User className="w-12 h-12 mb-2 text-slate-300 dark:text-slate-600" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rasm yuklash</span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium text-center w-32 leading-tight">Maksimal 2MB, JPEG/PNG.</p>
                    </div>

                    {/* Info Details */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                        <InfoItem icon={<User className="w-4 h-4" />} label="Ism" value={student.firstName} />
                        <InfoItem icon={<User className="w-4 h-4" />} label="Familiya" value={student.lastName} />
                        <InfoItem icon={<Phone className="w-4 h-4" />} label="Telefon raqam" value={student.phone} />
                        <InfoItem icon={<CalendarDays className="w-4 h-4" />} label="Tug'ilgan sana" value={student.birthDate} />
                        <InfoItem icon={<User className="w-4 h-4" />} label="Jinsi" value={student.gender} />
                        <InfoItem icon={<Hash className="w-4 h-4" />} label="O'quvchi ID" value={student.studentId.toString()} highlight />
                    </div>
                </div>
            </div>

            {/* Security and Notifications Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Login Details */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-[1.5rem] p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Fingerprint className="w-4 h-4 text-emerald-500" /> Kirish (Login)
                        </h3>
                        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-widest">{student.studentId}</p>
                        <p className="text-xs text-slate-500 mt-2">Tizimga kirish uchun ID raqamingizdan foydalanasiz.</p>
                    </div>
                </div>

                {/* Password */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-[1.5rem] p-6 shadow-sm flex flex-col justify-between group cursor-pointer hover:border-brand-300 dark:hover:border-brand-700 transition-colors">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <KeyRound className="w-4 h-4 text-rose-500" /> Tizim paroli
                            </h3>
                            <PencilLine className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transition-colors" />
                        </div>
                        <div className="flex items-center gap-1.5 mt-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="w-2.5 h-2.5 rounded-full bg-slate-800 dark:bg-white"></div>
                            ))}
                        </div>
                    </div>
                    <p className="text-xs text-rose-500/80 font-medium mt-4 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Xavfsiz parol o'rnatilgan
                    </p>
                </div>

                {/* Notifications */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-[1.5rem] p-6 shadow-sm flex flex-col justify-between group cursor-pointer hover:border-brand-300 dark:hover:border-brand-700 transition-colors">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Bell className="w-4 h-4 text-amber-500" /> Bildirishnomalar
                            </h3>
                            <PencilLine className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transition-colors" />
                        </div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            SMS va Telegram xabarlarni sozlash
                        </p>
                    </div>
                </div>

            </div>

            {/* Contracts & Billing */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-[2rem] p-6 md:p-8 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" /> Shartnomalar va To'lovlar
                </h2>

                {loadingDebts ? (
                    <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-900/50 animate-pulse">
                        <div className="w-8 h-8 rounded-full border-t-2 border-brand-500 animate-spin mb-3"></div>
                        <p className="text-slate-500 font-medium text-sm">To'lov ma'lumotlari yuklanmoqda...</p>
                    </div>
                ) : debts.length === 0 ? (
                    <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-900/50">
                        <ShieldCheck className="w-10 h-10 text-emerald-300 dark:text-emerald-600 mb-3" />
                        <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">
                            Hozircha o'quv qarzdorliklar yoki faol shartnomalar mavjud emas.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 mt-6">
                        {debts.map((debt) => {
                            const remaining = debt.amountDue - debt.amountPaid;
                            return (
                                <div key={debt.id} className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
                                    <div className="w-full md:w-auto">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-black text-slate-800 dark:text-white">{debt.groupName}</span>
                                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500">{debt.courseName}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-2">To'lov oyi: <span className="font-semibold text-slate-700 dark:text-slate-300">{debt.dueMonth}</span></p>
                                        <p className="text-xs text-rose-500 font-bold flex items-center gap-1">
                                            Qoldiq qarz: {remaining.toLocaleString()} UZS
                                        </p>
                                    </div>

                                    <div className="flex w-full md:w-auto gap-2 items-center shrink-0">
                                        <a
                                            href={generatePaymeUrl(remaining, debt.enrollmentId)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-[#14E59C]/10 text-[#00A97E] hover:bg-[#14E59C]/20 border border-[#14E59C]/20 rounded-xl font-bold text-sm transition-colors flex items-center justify-center flex-1 md:flex-none"
                                            onClick={(e) => {
                                                if (!paymentConfig.payme_merchant_id) {
                                                    e.preventDefault();
                                                    alert("To'lov tizimi admin tomonidan sozlanmagan.");
                                                }
                                            }}
                                        >
                                            PAYME
                                        </a>
                                        <a
                                            href={generateClickUrl(remaining, debt.enrollmentId)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-[#00AEEF]/10 text-[#00AEEF] hover:bg-[#00AEEF]/20 border border-[#00AEEF]/20 rounded-xl font-bold text-sm transition-colors flex items-center justify-center flex-1 md:flex-none"
                                            onClick={(e) => {
                                                if (!paymentConfig.click_service_id) {
                                                    e.preventDefault();
                                                    alert("To'lov tizimi admin tomonidan sozlanmagan.");
                                                }
                                            }}
                                        >
                                            CLICK
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

        </div>
    );
}

function InfoItem({ icon, label, value, highlight }: { icon: React.ReactNode, label: string, value: string, highlight?: boolean }) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                {icon} {label}
            </div>
            <div className={`text-base font-bold ${highlight ? 'text-brand-600 dark:text-brand-400 text-lg' : 'text-slate-800 dark:text-slate-200'}`}>
                {value}
            </div>
        </div>
    );
}
