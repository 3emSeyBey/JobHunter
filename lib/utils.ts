import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtDate(s: string | null | undefined) {
  if (!s) return "";
  const d = new Date(s);
  return d.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}
