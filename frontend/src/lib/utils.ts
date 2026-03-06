import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind class birlashtiruvchi (Shadcn standart yordamchi) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
