import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Bangladeshi Taka, e.g. ৳1,250.00 */
export function formatBDT(value: number | string | null | undefined) {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  if (!Number.isFinite(n)) return "৳0.00";
  return `৳${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(value: string | Date | null | undefined, withTime = false) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function timeAgo(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  const diff = Date.now() - d.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr${h === 1 ? "" : "s"} ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(d);
}

export function shortId(id: string) {
  return id.split("-")[0].toUpperCase();
}

export function truncate(text: string, max = 120) {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

/** Converts an array of colors into a readable label */
export function colorsLabel(colors: string[] | null | undefined) {
  if (!colors || colors.length === 0) return "Not specified";
  return colors.join(", ");
}

/** A small map of common color names to CSS values for swatches */
const NAMED_COLORS: Record<string, string> = {
  black: "#111827",
  white: "#ffffff",
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#eab308",
  orange: "#f97316",
  purple: "#a855f7",
  violet: "#8b5cf6",
  pink: "#ec4899",
  gray: "#6b7280",
  grey: "#6b7280",
  silver: "#cbd5e1",
  gold: "#d4a017",
  brown: "#92400e",
  beige: "#e7d7b1",
  navy: "#1e3a8a",
  teal: "#14b8a6",
  cyan: "#06b6d4",
  maroon: "#7f1d1d",
  olive: "#65a30d",
  cream: "#fef3c7",
  indigo: "#4338ca",
  lime: "#84cc16",
  turquoise: "#2dd4bf",
  rose: "#f43f5e",
  charcoal: "#374151",
  transparent: "#ffffff",
};

export function colorToCss(color: string): string {
  const c = color.trim().toLowerCase();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c)) return c;
  if (NAMED_COLORS[c]) return NAMED_COLORS[c];
  // try first word (e.g. "dark blue" -> blue, "space gray" -> gray)
  const words = c.split(/[\s-]+/);
  for (const w of words.reverse()) if (NAMED_COLORS[w]) return NAMED_COLORS[w];
  return "#94a3b8";
}
