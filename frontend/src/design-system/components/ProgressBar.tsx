export function ProgressBar({ value = 0 }: { value?: number }) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
      <div
        className="h-3 bg-gradient-to-r from-emerald-400 to-green-500"
        style={{ width: `${pct}%` }}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

export default ProgressBar;
