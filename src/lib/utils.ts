import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely (resolves conflicts) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Generate a short random ID (not cryptographic — use for UI keys/clause IDs) */
export function shortId(prefix = ""): string {
  return `${prefix}${Math.random().toString(36).slice(2, 8)}`;
}

/** Clause ID formatter: C1, C2, … */
export function clauseId(n: number): string {
  return `C${n}`;
}

/** Format file size for display */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Truncate text to n chars with ellipsis */
export function truncate(text: string, n: number): string {
  return text.length <= n ? text : `${text.slice(0, n - 1)}…`;
}
