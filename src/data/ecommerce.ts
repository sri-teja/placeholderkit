import { avatarUrl, logoUrl, placeholderUrl } from "../core/index";
import { createRng } from "../core/util";
import type { Currency, Customer, EcommerceMetrics, EcommerceWorld, Order, OrderItem, OrderStatus, Product, ResolvedOptions, Review, StoreVertical, WorldSize } from "./types";
import { STORE_VERTICALS, VERTICALS, type CategorySpec } from "./lists/ecommerce";
import { RATING_WEIGHTS } from "./lists/reviews";
import { LOCALE_INFO, person } from "./locale";
import { productDescription, productName, reviewText } from "./text";
import { DAY, HOUR, groupBy, growthTime, indexBy, iso, makeId, moneyFormatter, monthKey, monthsBetween, nicePrice, slug } from "./world";

const COUNTS: Record<WorldSize, { customers: number; products: number }> = {
  small: { customers: 25, products: 24 },
  medium: { customers: 500, products: 120 },
  large: { customers: 5000, products: 400 },
};

/** Relative order volume by calendar month (Jan..Dec): a holiday peak in November and December. */
const SEASON = [0.85, 0.8, 0.9, 0.92, 0.95, 0.9, 0.9, 0.95, 0.97, 1.05, 1.5, 1.7];
const SEASON_MAX = 1.7;

const SHIPPING_FEE: Record<Currency, number> = { USD: 695, EUR: 595, GBP: 495, INR: 9900 };
const FREE_SHIPPING_FROM: Record<Currency, number> = { USD: 7500, EUR: 7000, GBP: 6000, INR: 499900 };

type Resolved = ResolvedOptions & { nowMs: number };
interface ProductInternal { product: Product; createdMs: number; weight: number; cat: CategorySpec; item: string; usd: number }

export function createEcommerce(o: Resolved, verticalOpt?: StoreVertical): EcommerceWorld {
  const { seed, nowMs, currency, locale } = o;
  const counts = COUNTS[o.size];
  const info = LOCALE_INFO[locale];

  /* ---------- business ---------- */
  const rb = createRng(seed, "business");
  const vertical = verticalOpt ?? rb.pick(STORE_VERTICALS);
  if (!VERTICALS[vertical]) throw new Error(`placeholderkit/data: unknown vertical ${JSON.stringify(vertical)}; use one of ${STORE_VERTICALS.join(", ")}.`);
  const spec = VERTICALS[vertical];
  const foundedMs = Math.floor((nowMs - rb.int(730, 1825) * DAY) / DAY) * DAY + 9 * HOUR;
  const a = rb.pick(spec.nameA);
  const name = `${a} ${rb.pick(spec.nameB)}`;
  const domain = slug(name.replace(/\s*&\s*Co\.?$/, "")) + info.tld;
  const logoSeed = `business:${seed}`;
  const business = {
    name, tagline: rb.pick(spec.taglines), domain, vertical,
    logoUrl: logoUrl({ seed: logoSeed, name }), logoMarkUrl: logoUrl({ seed: logoSeed, name, variant: "mark" }),
    foundedAt: iso(foundedMs),
  };
  const skuPrefix = name.replace(/[^A-Za-z ]/g, "").split(" ").filter(Boolean).map((s) => s[0]).join("").slice(0, 2).toUpperCase().padEnd(2, "X");

  /* ---------- products (stable per index across sizes) ---------- */
  const used = new Set<string>();
  const internals: ProductInternal[] = [];
  for (let i = 0; i < counts.products; i++) {
    const r = createRng(seed, `product:${i}`);
    const cat = spec.categories[i % spec.categories.length];
    let words = productName(r, cat);
    for (let t = 0; t < 8 && used.has(words.name); t++) words = productName(r, cat);
    if (used.has(words.name)) words = { ...words, name: `${words.name} ${["II", "Mini", "Large", "Plus"][i % 4]}` };
    used.add(words.name);
    const id = makeId("prd", seed, i);
    const usd = r.int(words.price[0], words.price[1]) * 100;
    const onSale = r.next() < 0.15;
    const price = nicePrice(usd, currency);
    const compareAt = onSale ? nicePrice(Math.round(usd * 1.3), currency) : null;
    const createdMs = r.next() < 0.4
      ? foundedMs + r.int(0, 20) * DAY
      : growthTime(r.next(), foundedMs, nowMs - 21 * DAY);
    const product: Product = {
      id, sku: `${skuPrefix}-${1001 + i}`, name: words.name, category: cat.name,
      description: productDescription(r, words, cat), price,
      compareAtPrice: compareAt !== null && compareAt > price ? compareAt : null,
      stock: r.next() < 0.08 ? 0 : r.int(3, 240), rating: null, reviewCount: 0,
      imageUrl: placeholderUrl({ seed: id, category: cat.image, ratio: "1/1", title: words.name }),
      createdAt: iso(createdMs),
    };
    internals.push({ product, createdMs, weight: Math.pow(r.next(), 2.5) * 10 + 0.2, cat, item: words.item, usd });
  }
  const products = internals.map((p) => p.product);
  // Products available at a given time, by launch date, with cumulative popularity for weighted picks.
  const byLaunch = [...internals].sort((x, y) => x.createdMs - y.createdMs);
  const cumulative: number[] = [];
  byLaunch.reduce((sum, p, k) => (cumulative[k] = sum + p.weight), 0);
  const launchedBy = (t: number): number => {
    let lo = 0, hi = byLaunch.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (byLaunch[mid].createdMs <= t) lo = mid + 1; else hi = mid; }
    return Math.max(1, lo);
  };
  const pickProduct = (r: () => number, available: number): ProductInternal => {
    const target = r() * cumulative[available - 1];
    let lo = 0, hi = available - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (cumulative[mid] < target) lo = mid + 1; else hi = mid; }
    return byLaunch[lo];
  };

  /* ---------- customers (stable per index across sizes) ---------- */
  const customers: Customer[] = [];
  const signupMs: number[] = [];
  for (let i = 0; i < counts.customers; i++) {
    const r = createRng(seed, `customer:${i}`);
    const p = person(r, locale);
    const id = makeId("cus", seed, i);
    const t = growthTime(r.next(), foundedMs + 3 * DAY, nowMs - HOUR);
    signupMs.push(t);
    customers.push({
      id, firstName: p.firstName, lastName: p.lastName, name: p.name, email: p.email, phone: p.phone,
      avatarUrl: avatarUrl({ seed: id, title: p.name }), city: p.address.city, address: p.address, signedUpAt: iso(t),
    });
  }

  /* ---------- orders ---------- */
  const shippingFee = SHIPPING_FEE[currency], freeFrom = FREE_SHIPPING_FROM[currency];
  const internalById = new Map(internals.map((p) => [p.product.id, p]));
  const orders: Order[] = [];
  const orderMeta = new Map<string, { deliveredMs: number | null; refunded: boolean }>();
  for (let i = 0; i < customers.length; i++) {
    const r = createRng(seed, `orders:${i}`);
    const start = signupMs[i];
    const n = r.next() < 0.1 ? 0 : Math.min(60, 1 + Math.floor(Math.pow(-Math.log(1 - r.next()), 1.7) * 2));
    const times: number[] = [];
    for (let k = 0; k < n; k++) {
      let t = start + r.next() * (nowMs - start);
      if (k === 0 && r.next() < 0.6) t = start + r.int(10, 2880) * 60_000;
      else for (let tries = 0; tries < 12 && r.next() > SEASON[new Date(t).getUTCMonth()] / SEASON_MAX; tries++) t = start + r.next() * (nowMs - start);
      times.push(Math.round(Math.min(t, nowMs - r.int(5, 600) * 60_000)));
    }
    times.sort((x, y) => x - y);
    times.forEach((t, k) => {
      const available = launchedBy(t);
      const lines = Math.min(available, r.weighted([[1, 60], [2, 28], [3, 12]] as const));
      const items: OrderItem[] = [];
      const seen = new Set<string>();
      for (let li = 0; li < lines * 3 && items.length < lines; li++) {
        const p = pickProduct(r.next, available);
        if (seen.has(p.product.id)) continue;
        seen.add(p.product.id);
        // Consumables are often bought two or three at a time; expensive items almost never.
        const qty = p.usd > 6000 ? r.weighted([[1, 96], [2, 4]] as const)
          : spec.bulky ? r.weighted([[1, 60], [2, 28], [3, 12]] as const) : r.weighted([[1, 85], [2, 12], [3, 3]] as const);
        const unitPrice = p.product.compareAtPrice !== null && t < nowMs - 45 * DAY ? p.product.compareAtPrice : p.product.price;
        items.push({ productId: p.product.id, qty, unitPrice });
      }
      const subtotal = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
      const tax = Math.round(subtotal * info.taxRate);
      const shipping = subtotal >= freeFrom ? 0 : shippingFee;
      const age = nowMs - t;
      let status: OrderStatus;
      let shippedMs: number | null = null, deliveredMs: number | null = null, cancelledMs: number | null = null, refundedMs: number | null = null;
      if (age > 30 * HOUR && r.next() < 0.02) {
        status = "cancelled"; cancelledMs = t + r.int(1, 30) * HOUR;
      } else if (age < 2 * DAY) {
        status = "processing";
      } else if (age < 7 * DAY) {
        status = "shipped"; shippedMs = t + r.int(12, 47) * HOUR;
      } else {
        status = "delivered"; shippedMs = t + r.int(12, 47) * HOUR; deliveredMs = shippedMs + r.int(1, 5) * DAY;
        if (age > 20 * DAY && r.next() < 0.03) { status = "refunded"; refundedMs = deliveredMs + r.int(2, 10) * DAY; }
      }
      const id = makeId("ord", seed, i * 64 + k);
      orderMeta.set(id, { deliveredMs, refunded: status === "refunded" });
      orders.push({
        id, number: "", customerId: customers[i].id, items, subtotal, tax, shipping, total: subtotal + tax + shipping, status,
        createdAt: iso(t), shippedAt: shippedMs === null ? null : iso(shippedMs), deliveredAt: deliveredMs === null ? null : iso(deliveredMs),
        cancelledAt: cancelledMs === null ? null : iso(cancelledMs), refundedAt: refundedMs === null ? null : iso(refundedMs),
      });
    });
  }
  orders.sort((x, y) => (x.createdAt < y.createdAt ? -1 : x.createdAt > y.createdAt ? 1 : x.id < y.id ? -1 : 1));
  orders.forEach((ord, k) => { ord.number = `#${1001 + k}`; });

  /* ---------- reviews: only from customers whose order was delivered ---------- */
  const reviews: Review[] = [];
  for (const ord of orders) {
    const meta = orderMeta.get(ord.id)!;
    if (meta.deliveredMs === null) continue;
    for (const it of ord.items) {
      const r = createRng(seed, `review:${ord.id}:${it.productId}`);
      if (r.next() > (meta.refunded ? 0.5 : 0.2)) continue;
      const createdMs = meta.deliveredMs + r.int(1, 21) * DAY + r.int(0, 23) * HOUR;
      if (createdMs > nowMs) continue;
      const rating = meta.refunded ? r.weighted([[1, 6], [2, 3], [3, 1]] as const) : r.weighted(RATING_WEIGHTS);
      const p = internalById.get(it.productId)!;
      const text = reviewText(r, rating, p.cat, p.item);
      reviews.push({ id: makeId("rev", seed, reviews.length), productId: it.productId, customerId: ord.customerId, orderId: ord.id, rating, title: text.title, body: text.body, createdAt: iso(createdMs) });
    }
  }
  reviews.sort((x, y) => (x.createdAt < y.createdAt ? -1 : 1));
  const reviewsByProduct = groupBy(reviews, "productId");
  for (const p of products) {
    const list = reviewsByProduct.get(p.id) ?? [];
    p.reviewCount = list.length;
    p.rating = list.length ? Math.round((list.reduce((s, rv) => s + rv.rating, 0) / list.length) * 10) / 10 : null;
  }

  /* ---------- metrics ---------- */
  const months = monthsBetween(foundedMs, nowMs);
  const revenue = new Map(months.map((m) => [m, 0])), orderCount = new Map(months.map((m) => [m, 0])), newCustomers = new Map(months.map((m) => [m, 0]));
  const productRevenue = new Map<string, { units: number; revenue: number }>();
  const ordersPerCustomer = new Map<string, number>();
  let totalRevenue = 0, totalOrders = 0;
  for (const ord of orders) {
    if (ord.status === "cancelled" || ord.status === "refunded") continue;
    const m = ord.createdAt.slice(0, 7);
    revenue.set(m, (revenue.get(m) ?? 0) + ord.total);
    orderCount.set(m, (orderCount.get(m) ?? 0) + 1);
    totalRevenue += ord.total; totalOrders++;
    ordersPerCustomer.set(ord.customerId, (ordersPerCustomer.get(ord.customerId) ?? 0) + 1);
    for (const it of ord.items) {
      const pr = productRevenue.get(it.productId) ?? { units: 0, revenue: 0 };
      pr.units += it.qty; pr.revenue += it.qty * it.unitPrice;
      productRevenue.set(it.productId, pr);
    }
  }
  signupMs.forEach((t) => { const m = monthKey(t); newCustomers.set(m, (newCustomers.get(m) ?? 0) + 1); });
  const series = (m: Map<string, number>) => months.map((month) => ({ month, value: m.get(month) ?? 0 }));
  const buyers = [...ordersPerCustomer.values()];
  const metrics: EcommerceMetrics = {
    revenueByMonth: series(revenue), ordersByMonth: series(orderCount), newCustomersByMonth: series(newCustomers),
    topProducts: [...productRevenue.entries()].map(([productId, v]) => ({ productId, unitsSold: v.units, revenue: v.revenue }))
      .sort((x, y) => y.revenue - x.revenue || (x.productId < y.productId ? -1 : 1)).slice(0, 10),
    totalRevenue, totalOrders, averageOrderValue: totalOrders ? Math.round(totalRevenue / totalOrders) : 0,
    repeatCustomerRate: buyers.length ? Math.round((buyers.filter((n) => n >= 2).length / buyers.length) * 1000) / 1000 : 0,
  };

  /* ---------- world with non-enumerable helpers (data stays plain) ---------- */
  const { nowMs: _drop, ...options } = o;
  const world = { industry: "ecommerce" as const, options, business, customers, products, orders, reviews, metrics };
  const cIndex = indexBy(customers, "id"), pIndex = indexBy(products, "id"), oIndex = indexBy(orders, "id");
  const oByCustomer = groupBy(orders, "customerId");
  const format = moneyFormatter(currency, locale);
  return Object.defineProperties(world, {
    customer: { value: (id: string) => cIndex.get(id) },
    product: { value: (id: string) => pIndex.get(id) },
    order: { value: (id: string) => oIndex.get(id) },
    ordersFor: { value: (customerId: string) => oByCustomer.get(customerId) ?? [] },
    reviewsFor: { value: (productId: string) => reviewsByProduct.get(productId) ?? [] },
    formatMoney: { value: format },
  }) as EcommerceWorld;
}
