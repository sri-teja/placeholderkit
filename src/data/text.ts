import type { Rng } from "../core/util";
import type { CategorySpec } from "./lists/ecommerce";
import { DESCRIPTIONS, DESCRIPTION_CLOSERS } from "./lists/ecommerce";
import { CLOSERS, FACETS, OPENERS, TITLES } from "./lists/reviews";

/** Replace {key} placeholders. Unknown keys are left as-is so mistakes are visible. */
export function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? vars[k] : m));
}

const tidy = (s: string): string => s.replace(/\s+/g, " ").trim();

export interface ProductWords { name: string; adj: string; mat: string; item: string; price: [number, number] }

/**
 * A product name from the category template, e.g. "Waxed Canvas Weekender Bag".
 * Items may carry their own price range in US dollars: "Water Bottle@15-40".
 */
export function productName(r: Rng, cat: CategorySpec): ProductWords {
  const adj = r.pick(cat.adj), mat = r.pick(cat.mat);
  const [item, range] = r.pick(cat.item).split("@");
  const price = range ? (range.split("-").map(Number) as [number, number]) : cat.price;
  return { name: tidy(fill(cat.pattern ?? "{adj} {mat} {item}", { adj, mat, item })), adj, mat, item, price };
}

/** Plural item names ("Shorts", "Chinos", "Treats") can't take "a". */
const isPlural = (item: string): boolean => /[^s]s$/i.test(item) && !/(ss|us|Lens)$/i.test(item);

/** Lowercase ordinary words but keep acronyms and model names ("USB-C", "3-in-1", "Vitamin C" -> "vitamin C"). */
const PROPER = new Set(["French"]);
const lower = (s: string): string => s.split(" ").map((t) => (/^[A-Z0-9-]{2,}$|\d/.test(t) || t.length === 1 || PROPER.has(t) ? t : t.toLowerCase())).join(" ");

export function productDescription(r: Rng, words: ProductWords, cat: CategorySpec): string {
  const iteml = lower(words.item);
  const vars = {
    Name: words.name, item: words.item, iteml, aitem: (/^[aeiou]/i.test(iteml) ? "an " : "a ") + iteml, adj: words.adj, adjl: lower(words.adj),
    mat: words.mat || "carefully chosen materials", matl: lower(words.mat || "carefully chosen materials"), Closer: r.pick(DESCRIPTION_CLOSERS),
  };
  let templates = cat.desc ?? (words.mat ? DESCRIPTIONS : DESCRIPTIONS.filter((t) => !/\{matl?\}/.test(t)));
  if (isPlural(words.item)) templates = templates.filter((t) => !/\bA \{adjl\} \{iteml\}|\{aitem\}/.test(t));
  return tidy(fill(r.pick(templates), vars).replace(/\b([Aa]) ([aeiou])/g, "$1n $2"));
}

/** Review title and body that agree with the star rating and the product's category. */
export function reviewText(r: Rng, rating: number, cat: CategorySpec, item: string): { title: string; body: string } {
  const band = rating - 1;
  const noun = cat.noun ?? item.toLowerCase();
  const facet = FACETS[cat.facet];
  const positive = rating >= 4 || (rating === 3 && r.next() < 0.5);
  const detail = r.pick(positive ? facet.pos : facet.neg);
  const parts = [fill(r.pick(OPENERS[band]), { noun }), detail];
  if (r.next() < 0.6) parts.push(r.pick(CLOSERS[band]));
  return { title: r.pick(TITLES[band]), body: parts.join(" ") };
}
