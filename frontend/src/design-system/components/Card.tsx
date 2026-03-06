import React from "react";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white/80 dark:bg-slate-800 p-4 rounded-2xl shadow-sm ${className}`.trim()}
    >
      {children}
    </div>
  );
}

export default Card;
