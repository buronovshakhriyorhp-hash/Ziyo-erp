import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
};

export function Button({
  variant = "primary",
  className = "",
  ...rest
}: Props) {
  const base =
    "rounded-lg px-4 py-2 font-semibold inline-flex items-center gap-2";
  const styles: Record<string, string> = {
    primary:
      "bg-gradient-to-r from-indigo-600 to-teal-400 text-white shadow-md hover:from-indigo-700",
    ghost: "bg-white/6 text-foreground border border-white/6",
    outline: "bg-transparent border border-slate-200 text-foreground",
  };
  return (
    <button
      className={`${base} ${styles[variant]} ${className}`.trim()}
      {...rest}
    />
  );
}

export default Button;
