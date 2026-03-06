import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Building2,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  User,
  Users,
  Settings,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getApiError } from "@/services/api";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  phone: z.string().min(9, "Telefon raqam noto'g'ri"),
  password: z.string().min(6, "Parol kamida 6 xonali bo'lishi kerak"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [demoLoadingTarget, setDemoLoadingTarget] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      const activeRole = user.roleName || (user as any).role;
      redirectBasedOnRole(activeRole);
    }
  }, [isAuthenticated, user, navigate]);

  const redirectBasedOnRole = (role: string) => {
    switch (role) {
      case "student":
        navigate("/student-portal", { replace: true });
        break;
      case "parent":
        navigate("/parent-portal", { replace: true });
        break;
      default:
        navigate("/dashboard", { replace: true });
        break;
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "+998",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setApiError("");
    setLoading(true);
    try {
      await login(values.phone.trim(), values.password);
    } catch (_err) {
      setApiError(getApiError(_err));
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = async (role: "admin" | "teacher" | "student" | "parent") => {
    let demoPhone = "";
    const demoPassword = "123456";

    switch (role) {
      case "admin": demoPhone = "+998900000000"; break;
      case "teacher": demoPhone = "+998904444444"; break;
      case "student": demoPhone = "+998901111111"; break;
      case "parent": demoPhone = "+998902222222"; break;
    }

    setDemoLoadingTarget(role);
    setValue("phone", demoPhone, { shouldValidate: true });
    setValue("password", demoPassword, { shouldValidate: true });

    // Avtomatik formni yuborish
    try {
      await login(demoPhone, demoPassword);
    } catch (_err) {
      setApiError(getApiError(_err));
    } finally {
      setDemoLoadingTarget(null);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0f172a] selection:bg-brand-500/30">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      {/* ── Chap — Brend panel ─────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[540px] p-16 relative bg-white/[0.02] border-r border-white/10 backdrop-blur-sm shadow-2xl">
        {/* Logo Section */}
        <div className="relative z-10 flex items-center gap-4 group cursor-default">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-blue-600 p-[1px]">
            <div className="w-full h-full rounded-2xl bg-[#0f172a] flex items-center justify-center transition-transform group-hover:scale-105 duration-300">
              <Building2 className="w-7 h-7 text-brand-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Ziyo Chashmasi
            </h1>
            <p className="text-brand-400/80 font-medium text-sm">
              O'quv Markazi ERP
            </p>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold animate-bounce-subtle">
            <Sparkles className="w-3 h-3" />
            <span>Yangi avlod ko'rgazma rejimi</span>
          </div>

          <h2 className="text-5xl font-extrabold text-white leading-[1.15] tracking-tight">
            Ta'lim jarayonini <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-blue-400">
              yaqindan o'rganing
            </span>
          </h2>

          <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
            Hoziroq demo orqali o'quvchi va ota-ona rejimlariga baho bering.
            Ilovani to'liq sinab ko'ring.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-white">Xavfsiz</p>
              <p className="text-xs text-gray-500">Kriptografik himoya bilan</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-sm font-semibold text-white">Tezkor</p>
              <p className="text-xs text-gray-500">Role-based marshrutlash</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-gray-500 text-sm">
          <p>© 2025 Ziyo Chashmasi</p>
          <div className="flex gap-4">
            <span className="hover:text-white cursor-pointer transition-colors">
              Yordam
            </span>
            <span className="hover:text-white cursor-pointer transition-colors">
              Maxfiylik
            </span>
          </div>
        </div>
      </div>

      {/* ── O'ng — Login forma ────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 relative z-10 overflow-y-auto">
        <div className="w-full max-w-[440px] space-y-8">
          {/* Header */}
          <div className="space-y-3">
            <h2 className="text-4xl font-bold text-white tracking-tight">
              Tizimga kirish!
            </h2>
            <p className="text-gray-400 text-lg">
              Tizimga kirish uchun telefon raqamingizni kiriting
            </p>
          </div>

          {/* Card Container */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-[32px] p-8 sm:p-10 shadow-3xl relative overflow-hidden group">
            {/* Inner shadow/glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6 relative z-10"
            >
              {/* Telefon input */}
              <div className="space-y-2">
                <label
                  className="text-sm font-semibold text-gray-300 ml-1"
                  htmlFor="phone"
                >
                  Telefon raqami
                </label>
                <div className="relative group/input">
                  <input
                    id="phone"
                    type="tel"
                    {...register("phone")}
                    placeholder="+998 90 123 45 67"
                    disabled={loading}
                    className={cn(
                      "w-full h-13 px-5 rounded-2xl border bg-[#1e293b]/50 text-white text-base",
                      "placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50",
                      "border-white/10 hover:border-white/20 transition-all duration-300",
                      errors.phone
                        ? "border-rose-500/50 focus:ring-rose-500/30"
                        : "focus:border-brand-500",
                      loading && "opacity-50 cursor-not-allowed",
                    )}
                  />
                </div>
              </div>

              {/* Parol input */}
              <div className="space-y-2 mt-6">
                <div className="flex justify-between items-center ml-1">
                  <label
                    className="text-sm font-semibold text-gray-300"
                    htmlFor="password"
                  >
                    Maxfiy parol
                  </label>
                </div>
                <div className="relative group/input">
                  <input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    {...register("password")}
                    placeholder="••••••••"
                    disabled={loading}
                    className={cn(
                      "w-full h-13 px-5 pr-14 rounded-2xl border bg-[#1e293b]/50 text-white text-base",
                      "placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/50",
                      "border-white/10 hover:border-white/20 transition-all duration-300",
                      errors.password
                        ? "border-rose-500/50 focus:ring-rose-500/30"
                        : "focus:border-brand-500",
                      loading && "opacity-50 cursor-not-allowed",
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-2"
                  >
                    {showPwd ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Xato xabari */}
              {(apiError || errors.phone || errors.password) && (
                <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in zoom-in duration-300">
                  <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                    !
                  </div>
                  <p className="text-sm text-rose-200 font-medium">
                    {apiError ||
                      errors.phone?.message ||
                      errors.password?.message}
                  </p>
                </div>
              )}

              {/* Submit */}
              <div className="pt-4 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "w-full h-14 relative overflow-hidden rounded-2xl font-bold text-white text-base",
                    "bg-gradient-to-r from-brand-600 to-blue-600 shadow-xl shadow-brand-500/20",
                    "hover:shadow-2xl hover:shadow-brand-500/40 hover:-translate-y-0.5 transition-all duration-300",
                    "disabled:opacity-70 disabled:translate-y-0 disabled:shadow-none",
                    "flex items-center justify-center gap-3",
                  )}
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  Tizimga kirish <ArrowRight className="w-5 h-5" />
                </button>

                <div className="relative opacity-80 my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-[#1b2639] text-gray-400">
                      Yoki
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials("admin")}
                    disabled={loading || demoLoadingTarget !== null}
                    className={cn(
                      "relative overflow-hidden rounded-xl font-bold text-[10px] md:text-xs py-2 md:py-3",
                      "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-sm",
                      "hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all duration-300 flex items-center justify-center gap-1.5"
                    )}
                  >
                    {demoLoadingTarget === "admin" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Settings className="w-3 h-3" />}
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials("teacher")}
                    disabled={loading || demoLoadingTarget !== null}
                    className={cn(
                      "relative overflow-hidden rounded-xl font-bold text-[10px] md:text-xs py-2 md:py-3",
                      "bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-sm",
                      "hover:bg-amber-500/20 hover:border-amber-500/30 transition-all duration-300 flex items-center justify-center gap-1.5"
                    )}
                  >
                    {demoLoadingTarget === "teacher" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Building2 className="w-3 h-3" />}
                    Ustoz
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials("student")}
                    disabled={loading || demoLoadingTarget !== null}
                    className={cn(
                      "relative overflow-hidden rounded-xl font-bold text-[10px] md:text-xs py-2 md:py-3",
                      "bg-brand-500/10 border border-brand-500/20 text-brand-400 shadow-sm",
                      "hover:bg-brand-500/20 hover:border-brand-500/30 transition-all duration-300 flex items-center justify-center gap-1.5"
                    )}
                  >
                    {demoLoadingTarget === "student" ? <Loader2 className="w-3 h-3 animate-spin" /> : <User className="w-3 h-3" />}
                    O'quvchi
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials("parent")}
                    disabled={loading || demoLoadingTarget !== null}
                    className={cn(
                      "relative overflow-hidden rounded-xl font-bold text-[10px] md:text-xs py-2 md:py-3",
                      "bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-sm",
                      "hover:bg-purple-500/20 hover:border-purple-500/30 transition-all duration-300 flex items-center justify-center gap-1.5"
                    )}
                  >
                    {demoLoadingTarget === "parent" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Users className="w-3 h-3" />}
                    Ota-ona
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
