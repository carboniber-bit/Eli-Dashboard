import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatBRL = (v: number | string | null | undefined) => brl.format(Number(v ?? 0));

/** Aceita "1.234,56", "1234,56" ou "1234.56" e devolve número. */
export function parseBRL(input: string | number | null | undefined): number {
  if (typeof input === "number") return input;
  if (!input) return 0;
  const s = input.replace(/[^\d,.-]/g, "");
  if (s.includes(",")) return Number(s.replace(/\./g, "").replace(",", ".")) || 0;
  return Number(s) || 0;
}

export function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  const [y, m, day] = d.slice(0, 10).split("-");
  return `${day}/${m}/${y}`;
}

// Data de hoje no horário de Brasília (evita virar o dia às 21h por causa do UTC)
export const todayISO = () => new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

/** Soma/subtrai meses de "YYYY-MM". */
export function addMonths(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
}

export function monthLabel(ym: string, short = false) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("pt-BR", {
    month: short ? "short" : "long",
    ...(short ? {} : { year: "numeric" as const }),
    timeZone: "UTC",
  });
}

const brlCurto = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const formatBRLCurto = (v: number) => brlCurto.format(v);

export function daysUntil(d: string) {
  const a = new Date(todayISO() + "T00:00:00");
  const b = new Date(d.slice(0, 10) + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
