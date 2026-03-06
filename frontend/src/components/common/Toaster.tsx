import { useUiStore } from "@/store/ui.store";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, removeToast } = useUiStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full mx-4 sm:mx-0">
      {toasts.map((toast) => {
        const Icon =
          toast.type === "success"
            ? CheckCircle2
            : toast.type === "error"
              ? XCircle
              : toast.type === "warning"
                ? AlertTriangle
                : Info;

        return (
          <div
            key={toast.id}
            className={cn(
              "flex items-start gap-3 p-4 rounded-xl shadow-lg border animate-in slide-in-from-bottom-5 fade-in duration-300",
              toast.type === "success" &&
                "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-800",
              toast.type === "error" &&
                "bg-red-50 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-100 dark:border-red-800",
              toast.type === "warning" &&
                "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-800",
              (!toast.type || toast.type === "info") &&
                "bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-800",
            )}
          >
            <Icon
              className={cn(
                "w-5 h-5 shrink-0",
                toast.type === "success" &&
                  "text-emerald-500 dark:text-emerald-400",
                toast.type === "error" && "text-red-500 dark:text-red-400",
                toast.type === "warning" &&
                  "text-amber-500 dark:text-amber-400",
                (!toast.type || toast.type === "info") &&
                  "text-blue-500 dark:text-blue-400",
              )}
            />

            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-semibold">{toast.title}</h4>
              {toast.description && (
                <p className="text-sm opacity-90">{toast.description}</p>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
