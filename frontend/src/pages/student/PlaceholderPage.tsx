import { Clock } from "lucide-react";

export default function PlaceholderPage({ title, description }: { title: string, description: string }) {
    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex items-center justify-center">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-[2rem] p-12 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] max-w-lg w-full">
                <div className="w-20 h-20 bg-brand-50 dark:bg-brand-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-10 h-10 text-brand-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">{title}</h2>
                <p className="text-slate-500">{description}</p>
                <div className="mt-8 px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-sm font-semibold inline-block text-brand-600 dark:text-brand-400">
                    Tez orada...
                </div>
            </div>
        </div>
    );
}
