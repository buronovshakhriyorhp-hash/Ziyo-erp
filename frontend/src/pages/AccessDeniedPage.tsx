import { ShieldX, ArrowLeft, Home, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { useAuth } from "@/hooks/useAuth";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  manager: "Menejer",
  teacher: "O'qituvchi",
  student: "Talaba",
  parent: "Ota-ona",
};

export default function AccessDeniedPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { signOut } = useAuth();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6">
      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
        <ShieldX className="w-10 h-10 text-red-500" />
      </div>

      {/* Heading */}
      <h1 className="text-3xl font-bold text-foreground mb-2">Ruxsat yo'q</h1>
      <p className="text-muted-foreground text-base max-w-sm mb-2">
        Siz bu sahifaga kirish huquqiga ega emassiz.
      </p>

      {/* Role info */}
      {user && (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-sm text-muted-foreground mb-8">
          Sizning rolingiz:&nbsp;
          <strong className="text-foreground">
            {ROLE_LABELS[user.roleName] ?? user.roleName}
          </strong>
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:bg-secondary text-sm font-medium text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Orqaga
        </button>
        <button
          onClick={() => {
            if (user?.roleName === "student") navigate("/student-portal");
            else if (user?.roleName === "parent") navigate("/parent-portal");
            else navigate("/dashboard");
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors"
        >
          <Home className="w-4 h-4" />
          Asosiy sahifa
        </button>
        <button
          onClick={async () => {
            await signOut();
            navigate("/login");
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium transition-colors ml-2"
        >
          <LogOut className="w-4 h-4" />
          Chiqish
        </button>
      </div>
    </div>
  );
}
