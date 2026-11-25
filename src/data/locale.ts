import type { Rng } from "../core/util";
import type { Address, Locale } from "./types";
import { FIRST_NAMES, LAST_NAMES } from "./lists/names";
import { CITIES, STREETS } from "./lists/places";
import { slug } from "./world";

export interface LocaleInfo {
  country: string;
  /** Sales tax / VAT / GST applied to order subtotals. */
  taxRate: number;
  tld: string;
  emailDomains: readonly string[];
}

export const LOCALE_INFO: Record<Locale, LocaleInfo> = {
  "en-US": { country: "US", taxRate: 0.08, tld: ".com", emailDomains: ["gmail.com", "outlook.com", "yahoo.com", "icloud.com", "proton.me"] },
  "en-GB": { country: "GB", taxRate: 0.2, tld: ".co.uk", emailDomains: ["gmail.com", "outlook.com", "hotmail.co.uk", "icloud.com", "btinternet.com"] },
  "en-IN": { country: "IN", taxRate: 0.18, tld: ".in", emailDomains: ["gmail.com", "outlook.com", "yahoo.co.in", "rediffmail.com", "icloud.com"] },
};

const digits = (r: Rng, n: number): string => Array.from({ length: n }, () => r.int(0, 9)).join("");
const UK_LETTERS = "ABDEFGHJLNPQRSTUWXYZ";

/**
 * Phone numbers come from ranges reserved for fiction where they exist:
 * US 555-0100..0199 and UK 07700 900000..900999. India has no reserved range, so the
 * format is realistic but the digits are random.
 */
function phone(r: Rng, locale: Locale, areaCode: string | undefined): string {
  if (locale === "en-US") return `(${areaCode ?? "555"}) 555-01${digits(r, 2)}`;
  if (locale === "en-GB") return `07700 900${digits(r, 3)}`;
  return `+91 9${digits(r, 4)} ${digits(r, 5)}`;
}

function postalCode(r: Rng, locale: Locale, prefix: string): string {
  if (locale === "en-US") return prefix + digits(r, 2);
  if (locale === "en-IN") return prefix + digits(r, 3);
  const district = r.int(1, 9) + (r.next() < 0.3 ? String(r.int(0, 9)) : "");
  return `${prefix}${district} ${r.int(1, 9)}${UK_LETTERS[r.int(0, 19)]}${UK_LETTERS[r.int(0, 19)]}`;
}

function line1(r: Rng, locale: Locale): string {
  const s = STREETS[locale];
  const street = `${r.pick(s.names)} ${r.pick(s.types)}`;
  if (locale === "en-US") return `${r.int(12, 9800)} ${street}`;
  if (locale === "en-GB") return `${r.int(1, 220)} ${street}`;
  return r.next() < 0.5 ? `Flat ${r.int(1, 12)}0${r.int(1, 8)}, ${r.int(1, 90)} ${street}` : `${r.int(1, 400)}, ${street}`;
}

export function address(r: Rng, locale: Locale): Address & { areaCode?: string } {
  const [city, region, prefix, areaCode] = r.pick(CITIES[locale]);
  return { line1: line1(r, locale), city, region, postalCode: postalCode(r, locale, prefix), country: LOCALE_INFO[locale].country, areaCode };
}

export interface PersonData {
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  address: Address;
}

/** A person with a matching email and a local address and phone number. */
export function person(r: Rng, locale: Locale, emailDomain?: string): PersonData {
  const firstName = r.pick(FIRST_NAMES[locale]);
  const lastName = r.pick(LAST_NAMES[locale]);
  const f = slug(firstName), l = slug(lastName);
  const local = r.weighted([[`${f}.${l}`, 4], [`${f}${l}`, 2], [`${f[0]}${l}`, 2], [`${f}.${l}${r.int(1, 99)}`, 2], [`${f}${r.int(70, 99)}`, 1]] as const);
  const domain = emailDomain ?? r.pick(LOCALE_INFO[locale].emailDomains);
  const { areaCode, ...addr } = address(r, locale);
  return { firstName, lastName, name: `${firstName} ${lastName}`, email: `${local}@${domain}`, phone: phone(r, locale, areaCode), address: addr };
}
