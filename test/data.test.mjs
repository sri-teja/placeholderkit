import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { createWorld, toCSV, toJSON, toSQL, STORE_VERTICALS, LOCALES, DEFAULT_NOW } from "../dist/data.js";

const small = createWorld({ seed: "test" });
const medium = createWorld({ seed: "test", size: "medium" });
const DAY = 86_400_000;
const ms = (s) => Date.parse(s);

test("same options give an identical world", () => {
  assert.deepStrictEqual(createWorld({ seed: "test" }), small);
  assert.deepStrictEqual(createWorld({ seed: "test", size: "medium" }), medium);
  assert.notDeepStrictEqual(createWorld({ seed: "other" }).customers, small.customers);
});

test("records are stable across sizes: customer i and product i never change", () => {
  const large = createWorld({ seed: "test", size: "large" });
  assert.deepStrictEqual(medium.business, small.business);
  assert.deepStrictEqual(large.business, small.business);
  for (let i = 0; i < small.customers.length; i++) {
    assert.deepStrictEqual(medium.customers[i], small.customers[i]);
    assert.deepStrictEqual(large.customers[i], small.customers[i]);
  }
  for (let i = 0; i < small.products.length; i++) {
    const { rating, reviewCount, ...a } = small.products[i];
    const { rating: _r, reviewCount: _c, ...b } = large.products[i];
    assert.deepStrictEqual(b, a);
  }
});

test("defaults: ecommerce, small, en-US, USD, fixed now", () => {
  const w = createWorld();
  assert.equal(w.industry, "ecommerce");
  assert.deepEqual(w.options, { seed: "placeholderkit", industry: "ecommerce", size: "small", now: DEFAULT_NOW, currency: "USD", locale: "en-US" });
  assert.equal(createWorld({ locale: "en-IN" }).options.currency, "INR");
  assert.equal(createWorld({ now: "2025-06-30" }).options.now, "2025-06-30T12:00:00.000Z");
});

test("ids are unique and well formed", () => {
  for (const [list, prefix] of [[medium.customers, "cus"], [medium.products, "prd"], [medium.orders, "ord"], [medium.reviews, "rev"]]) {
    assert.equal(new Set(list.map((x) => x.id)).size, list.length, `${prefix} ids unique`);
    for (const x of list) assert.match(x.id, new RegExp(`^${prefix}_[0-9a-z]{6}$`));
  }
  assert.equal(new Set(medium.orders.map((o) => o.number)).size, medium.orders.length);
  assert.equal(new Set(medium.products.map((p) => p.name)).size, medium.products.length, "product names unique");
});

test("referential integrity: every foreign key points to an existing record", () => {
  for (const w of [small, medium]) {
    for (const o of w.orders) {
      assert.ok(w.customer(o.customerId), "order customer");
      assert.ok(o.items.length >= 1);
      for (const it of o.items) assert.ok(w.product(it.productId), "order item product");
    }
    for (const r of w.reviews) {
      const order = w.order(r.orderId);
      assert.ok(order && w.product(r.productId) && w.customer(r.customerId));
      assert.equal(order.customerId, r.customerId, "reviewer placed the order");
      assert.ok(order.items.some((it) => it.productId === r.productId), "reviewed product was in the order");
      assert.ok(order.status === "delivered" || order.status === "refunded", "reviewed after delivery");
    }
    for (const t of w.metrics.topProducts) assert.ok(w.product(t.productId));
  }
});

test("arithmetic is exact, in integer minor units", () => {
  for (const w of [small, medium, createWorld({ seed: "test", locale: "en-IN", size: "medium" }), createWorld({ seed: "test", locale: "en-GB" })]) {
    for (const o of w.orders) {
      const sum = o.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
      assert.equal(o.subtotal, sum);
      assert.equal(o.total, o.subtotal + o.tax + o.shipping);
      for (const v of [o.subtotal, o.tax, o.shipping, o.total, ...o.items.map((i) => i.unitPrice)]) assert.ok(Number.isInteger(v) && v >= 0);
    }
    for (const p of w.products) {
      assert.ok(Number.isInteger(p.price) && p.price > 0);
      if (p.compareAtPrice !== null) assert.ok(p.compareAtPrice > p.price);
    }
    const valid = w.orders.filter((o) => o.status !== "cancelled" && o.status !== "refunded");
    assert.equal(w.metrics.totalOrders, valid.length);
    assert.equal(w.metrics.totalRevenue, valid.reduce((s, o) => s + o.total, 0));
    assert.equal(w.metrics.revenueByMonth.reduce((s, m) => s + m.value, 0), w.metrics.totalRevenue);
    assert.equal(w.metrics.newCustomersByMonth.reduce((s, m) => s + m.value, 0), w.customers.length);
  }
});

test("time: nothing before founding or after now; orders follow signup; status matches age", () => {
  for (const w of [small, medium, createWorld({ seed: "t2", now: "2025-03-01", size: "medium" })]) {
    const now = ms(w.options.now), founded = ms(w.business.foundedAt);
    assert.ok(founded < now);
    for (const p of w.products) assert.ok(ms(p.createdAt) >= founded && ms(p.createdAt) <= now);
    for (const c of w.customers) assert.ok(ms(c.signedUpAt) > founded && ms(c.signedUpAt) <= now);
    for (const o of w.orders) {
      const t = ms(o.createdAt), age = now - t;
      assert.ok(t >= ms(w.customer(o.customerId).signedUpAt) && t <= now, "order after signup, before now");
      for (const it of o.items) assert.ok(ms(w.product(it.productId).createdAt) <= t, "product existed when ordered");
      for (const k of ["shippedAt", "deliveredAt", "cancelledAt", "refundedAt"]) if (o[k]) assert.ok(ms(o[k]) > t && ms(o[k]) <= now, `${k} in range`);
      if (o.status === "processing") assert.ok(age < 2 * DAY && !o.shippedAt);
      if (o.status === "shipped") assert.ok(age >= 2 * DAY && age < 7 * DAY && o.shippedAt && !o.deliveredAt);
      if (o.status === "delivered") assert.ok(age >= 7 * DAY && ms(o.deliveredAt) > ms(o.shippedAt));
      if (o.status === "refunded") assert.ok(ms(o.refundedAt) > ms(o.deliveredAt));
      if (o.status === "cancelled") assert.ok(o.cancelledAt && !o.shippedAt);
    }
    for (const r of w.reviews) assert.ok(ms(r.createdAt) > ms(w.order(r.orderId).deliveredAt) && ms(r.createdAt) <= now);
    assert.equal(w.metrics.revenueByMonth.at(-1).month, w.options.now.slice(0, 7));
    assert.equal(w.metrics.revenueByMonth[0].month, w.business.foundedAt.slice(0, 7));
  }
  const statuses = new Set(medium.orders.map((o) => o.status));
  for (const s of ["processing", "shipped", "delivered", "cancelled", "refunded"]) assert.ok(statuses.has(s), `has ${s} orders`);
});

test("shape: growth, holiday peak, a few heavy buyers, ratings skew positive", () => {
  const w = createWorld({ seed: "shape", size: "large" });
  const byMonth = w.metrics.revenueByMonth;
  const lastYear = byMonth.filter((m) => m.month >= "2025-01" && m.month <= "2025-12");
  const peak = lastYear.filter((m) => m.month.endsWith("-11") || m.month.endsWith("-12"));
  const rest = lastYear.filter((m) => !peak.includes(m));
  const avg = (xs) => xs.reduce((s, m) => s + m.value, 0) / xs.length;
  assert.ok(avg(peak) > 1.3 * avg(rest), "Nov/Dec revenue well above the rest of the year");
  assert.ok(avg(byMonth.slice(-13, -1)) > 1.5 * avg(byMonth.slice(1, 13)), "grows over time");

  const counts = [...new Set(w.orders.map((o) => o.customerId))].map((id) => w.ordersFor(id).length).sort((a, b) => b - a);
  const top = counts.slice(0, Math.ceil(counts.length / 10)).reduce((s, n) => s + n, 0);
  assert.ok(top / w.orders.length > 0.25, "top 10% of buyers place over a quarter of orders");

  const mean = w.reviews.reduce((s, r) => s + r.rating, 0) / w.reviews.length;
  assert.ok(mean >= 3.9 && mean <= 4.5, `average rating ${mean.toFixed(2)}`);
  for (const p of w.products) {
    const rs = w.reviewsFor(p.id);
    assert.equal(p.reviewCount, rs.length);
    assert.equal(p.rating, rs.length ? Math.round((rs.reduce((s, r) => s + r.rating, 0) / rs.length) * 10) / 10 : null);
  }
});

test("coherent text: names, descriptions and reviews fill every template", () => {
  for (const vertical of STORE_VERTICALS) {
    const w = createWorld({ seed: "text", vertical, size: "medium" });
    assert.equal(w.business.vertical, vertical);
    for (const p of w.products) assert.doesNotMatch(`${p.name} ${p.description}`, /\{|\}|undefined|\s{2}|\b[Aa] [aeiou]/);
    for (const r of w.reviews) {
      assert.doesNotMatch(`${r.title} ${r.body}`, /\{|\}|undefined|lorem/i);
      if (r.rating === 5) assert.doesNotMatch(r.title, /Disappointed|Not for me/);
      if (r.rating === 1) assert.doesNotMatch(r.title, /Love it|Perfect/);
    }
  }
});

test("every locale produces valid emails, phone numbers and postal codes", () => {
  const phone = { "en-US": /^\(\d{3}\) 555-01\d{2}$/, "en-GB": /^07700 900\d{3}$/, "en-IN": /^\+91 9\d{4} \d{5}$/ };
  const postal = { "en-US": /^\d{5}$/, "en-GB": /^[A-Z]{1,2}\d{1,2} \d[A-Z]{2}$/, "en-IN": /^\d{6}$/ };
  const country = { "en-US": "US", "en-GB": "GB", "en-IN": "IN" };
  for (const locale of LOCALES) {
    const w = createWorld({ seed: "loc", locale, size: "medium" });
    for (const c of w.customers) {
      assert.match(c.email, /^[a-z0-9.+_-]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/, c.email);
      assert.match(c.phone, phone[locale], c.phone);
      assert.match(c.address.postalCode, postal[locale], c.address.postalCode);
      assert.equal(c.address.country, country[locale]);
      assert.equal(c.city, c.address.city);
      assert.ok(c.avatarUrl.startsWith("data:image/svg+xml"));
    }
    assert.match(w.formatMoney(123456), locale === "en-IN" ? /₹/ : locale === "en-GB" ? /£/ : /\$/);
  }
});

test("bad options fail with a helpful message", () => {
  assert.throws(() => createWorld({ size: "huge" }), /unknown size "huge"; use one of small, medium, large/);
  assert.throws(() => createWorld({ locale: "fr-FR" }), /unknown locale/);
  assert.throws(() => createWorld({ now: "not a date" }), /invalid "now"/);
  assert.throws(() => createWorld({ vertical: "cars" }), /unknown vertical/);
});

test("medium world generates quickly", () => {
  const t = performance.now();
  createWorld({ seed: "perf", size: "medium" });
  const elapsed = performance.now() - t;
  assert.ok(elapsed < 200, `medium took ${elapsed.toFixed(1)} ms`); // target < 50 ms; generous for CI
});

test("toJSON is plain data and can drop images", () => {
  const data = toJSON(small);
  assert.deepEqual(Object.keys(data), ["industry", "options", "business", "customers", "products", "orders", "reviews", "metrics"]);
  assert.equal(JSON.stringify(data), JSON.stringify(small));
  const noImages = JSON.stringify(toJSON(small, { includeImages: false }));
  assert.doesNotMatch(noImages, /data:image|Url"/);
});

test("toCSV writes one table per record type with matching row counts", () => {
  const csv = toCSV(medium);
  assert.deepEqual(Object.keys(csv), ["business", "customers", "products", "orders", "order_items", "reviews"]);
  const rows = (s) => s.trim().split("\n").length - 1;
  assert.equal(rows(csv.customers), medium.customers.length);
  assert.equal(rows(csv.orders), medium.orders.length);
  assert.equal(rows(csv.order_items), medium.orders.reduce((s, o) => s + o.items.length, 0));
  assert.doesNotMatch(csv.customers, /data:image/);
  assert.match(toCSV(small, { includeImages: true }).customers.split("\n")[0], /avatar_url/);
});

test("toSQL loads into SQLite with foreign keys enforced", () => {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(toSQL(medium, { dialect: "sqlite" }));
  const count = (t) => db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
  assert.equal(count("customers"), medium.customers.length);
  assert.equal(count("products"), medium.products.length);
  assert.equal(count("orders"), medium.orders.length);
  assert.equal(count("reviews"), medium.reviews.length);
  assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  const { total } = db.prepare("SELECT SUM(total) AS total FROM orders WHERE status NOT IN ('cancelled','refunded')").get();
  assert.equal(total, medium.metrics.totalRevenue);
  db.close();
  for (const dialect of ["postgres", "mysql"]) {
    const sql = toSQL(small, { dialect });
    assert.match(sql, /CREATE TABLE/);
    assert.match(sql, dialect === "mysql" ? /`orders`/ : /"orders"/);
    if (dialect === "mysql") assert.doesNotMatch(sql, /'\d{4}-\d{2}-\d{2}T/, "MySQL datetimes have no T/Z");
  }
});

test("CLI writes JSON and SQL", () => {
  const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
  const json = JSON.parse(execFileSync(process.execPath, [cli, "data", "--seed", "test", "--size", "small"], { encoding: "utf8" }));
  assert.equal(json.customers.length, small.customers.length);
  assert.equal(json.customers[0].id, small.customers[0].id);
  const sql = execFileSync(process.execPath, [cli, "data", "--seed", "test", "--format", "sql", "--dialect", "sqlite"], { encoding: "utf8" });
  const db = new DatabaseSync(":memory:");
  db.exec(sql);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM orders").get().n, small.orders.length);
  assert.throws(() => execFileSync(process.execPath, [cli, "data", "--size", "huge"], { stdio: "pipe" }), /unknown size/);
});
