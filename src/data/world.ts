import { hash } from "../core/util";
import type { Currency, Industry, Locale, ResolvedOptions, WorldOptions, WorldSize } from "./types";

/** The reference "today" when `now` is not given. Fixed so worlds never depend on the real clock. */
export const DEFAULT_NOW = "2026-01-15T12:00:00.000Z";
export const DEFAULT_SEED = "placeholderkit";

export const INDUSTRIES: readonly Industry[] = ["ecommerce", "saas"];
export const SIZES: readonly WorldSize[] = ["small", "medium", "large"];
export const LOCALES: readonly Locale[] = ["en-US", "en-GB", "en-IN"];
export const CURRENCIES: readonly Currency[] = ["USD", "GBP", "EUR", "INR"];

export const DAY = 86_400_000;
export const HOUR = 3_600_000;

const LOCALE_CURRENCY: Record<Locale, Currency> = { "en-US": "USD", "en-GB": "GBP", "en-IN": "INR" };

function parseNow(now: string | undefined): number {
  const value = now ?? DEFAULT_NOW;
  const ms = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00.000Z` : value);
  if (Number.isNaN(ms)) throw new Error(`placeholderkit/data: invalid "now" value ${JSON.stringify(now)}; use a date like "2026-01-15".`);
  return ms;
}

function oneOf<T extends string>(name: string, value: T | undefined, allowed: readonly T[], fallback: T): T {
  if (value === undefined) return fallback;
  if (!allowed.includes(value)) throw new Error(`placeholderkit/data: unknown ${name} ${JSON.stringify(value)}; use one of ${allowed.join(", ")}.`);
  return value;
}

export function resolveOptions(opts: WorldOptions = {}): ResolvedOptions & { nowMs: number } {
  const locale = oneOf("locale", opts.locale, LOCALES, "en-US");
  const nowMs = parseNow(opts.now);
  return {
    seed: opts.seed ?? DEFAULT_SEED,
    industry: oneOf("industry", opts.industry, INDUSTRIES, "ecommerce"),
    size: oneOf("size", opts.size, SIZES, "small"),
    now: new Date(nowMs).toISOString(),
    currency: oneOf("currency", opts.currency, CURRENCIES, LOCALE_CURRENCY[locale]),
    locale,
    nowMs,
  };
}

/* ---------- ids ---------- */

const ID_SPACE = 36 ** 6; // 2,176,782,336 six-character base-36 ids
const ID_MULT = 1_000_003; // coprime with 36, so i -> (i * MULT + key) mod SPACE is a bijection

/**
 * Seed-stable id that looks random but can never collide within a kind:
 * an invertible scramble of the index, keyed by the seed.
 */
export function makeId(prefix: string, seed: string, i: number): string {
  const key = hash(`${seed}|${prefix}`) % ID_SPACE;
  const n = (((i % ID_SPACE) * ID_MULT) % ID_SPACE + key) % ID_SPACE;
  return `${prefix}_${n.toString(36).padStart(6, "0")}`;
}

/* ---------- time ---------- */

export const iso = (ms: number): string => new Date(ms).toISOString();
export const monthKey = (ms: number): string => iso(ms).slice(0, 7);

/** Every "YYYY-MM" from the month of `from` to the month of `to`, inclusive. */
export function monthsBetween(from: number, to: number): string[] {
  const out: string[] = [];
  const d = new Date(from);
  let y = d.getUTCFullYear(), m = d.getUTCMonth();
  const end = monthKey(to);
  for (;;) {
    const key = `${y}-${String(m + 1).padStart(2, "0")}`;
    out.push(key);
    if (key >= end) return out;
    m++; if (m === 12) { m = 0; y++; }
  }
}

/**
 * A time between `from` and `to`, denser toward `to` (exponential growth).
 * Uses only the caller's random number, so it never depends on how many records exist.
 */
export function growthTime(r: number, from: number, to: number, growth = 1.6): number {
  const u = Math.log(1 + r * (Math.exp(growth) - 1)) / growth;
  return Math.round(from + u * (to - from));
}

/* ---------- money ---------- */

/** Fixed conversion from authored USD prices. Deterministic on purpose: not live exchange rates. */
const RATE: Record<Currency, number> = { USD: 1, EUR: 0.92, GBP: 0.79, INR: 83 };

/** Convert a USD amount in cents to a "nice" shop price in minor units: $24.99, £19.99, ₹1,999. */
export function nicePrice(usdCents: number, currency: Currency): number {
  const major = (usdCents / 100) * RATE[currency];
  if (currency === "INR") {
    const step = major < 1000 ? 50 : 100;
    return Math.max(step, Math.round(major / step) * step - 1) * 100;
  }
  return Math.max(1, Math.round(major)) * 100 - 1;
}

/** Convert a USD amount in cents to a plain amount in minor units (fees, thresholds). */
export function convert(usdCents: number, currency: Currency): number {
  return Math.round(usdCents * RATE[currency]);
}

export function moneyFormatter(currency: Currency, locale: Locale): (amount: number) => string {
  const fmt = new Intl.NumberFormat(locale, { style: "currency", currency });
  const whole = new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });
  // Rupee prices are usually shown without paise when they are whole.
  return (amount) => (currency === "INR" && amount % 100 === 0 ? whole : fmt).format(amount / 100);
}

/* ---------- lookups ---------- */

export function indexBy<T, K extends keyof T>(items: readonly T[], key: K): Map<T[K], T> {
  const m = new Map<T[K], T>();
  for (const it of items) m.set(it[key], it);
  return m;
}

export function groupBy<T, K extends keyof T>(items: readonly T[], key: K): Map<T[K], T[]> {
  const m = new Map<T[K], T[]>();
  for (const it of items) {
    const list = m.get(it[key]);
    if (list) list.push(it); else m.set(it[key], [it]);
  }
  return m;
}

export const slug = (s: string): string =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "");
