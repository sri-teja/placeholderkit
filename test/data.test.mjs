import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { createWorld, toCSV, toJSON, toSQL, STORE_VERTICALS, SAAS_PRODUCTS, LOCALES, DEFAULT_NOW } from "../dist/data.js";

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

/* ------------------------------ SaaS ------------------------------ */

const saas = createWorld({ industry: "saas", seed: "test" });
const saasMedium = createWorld({ industry: "saas", seed: "test", size: "medium" });

test("saas: deterministic, and account i with its users is the same at every size", () => {
  assert.deepStrictEqual(createWorld({ industry: "saas", seed: "test", size: "medium" }), saasMedium);
  const large = createWorld({ industry: "saas", seed: "test", size: "large" });
  assert.deepStrictEqual(large.plans, saas.plans);
  assert.deepStrictEqual(large.team, saas.team);
  for (let i = 0; i < saas.accounts.length; i++) {
    assert.deepStrictEqual(large.accounts[i], saas.accounts[i]);
    assert.deepStrictEqual(large.subscriptions[i], saas.subscriptions[i]);
    assert.deepStrictEqual(large.usersFor(saas.accounts[i].id), saas.usersFor(saas.accounts[i].id));
  }
});

test("saas: referential integrity", () => {
  for (const w of [saas, saasMedium]) {
    for (const a of w.accounts) {
      const owner = w.user(a.ownerId);
      assert.ok(owner && owner.accountId === a.id && owner.role === "owner");
      assert.ok(w.plan(a.planId));
      const sub = w.subscriptionFor(a.id);
      assert.ok(sub && sub.planId === a.planId && sub.status === a.status);
      for (const u of w.usersFor(a.id)) assert.ok(u.email.endsWith("@" + a.domain), u.email);
    }
    assert.equal(w.subscriptions.length, w.accounts.length);
    for (const u of w.users) assert.ok(w.account(u.accountId));
    for (const inv of w.invoices) assert.ok(w.account(inv.accountId) && w.subscriptions.some((s) => s.id === inv.subscriptionId && s.accountId === inv.accountId));
    for (const e of w.activity) {
      assert.ok(w.account(e.accountId));
      if (e.userId !== null) assert.equal(w.user(e.userId).accountId, e.accountId);
    }
    for (const t of w.tickets) {
      assert.equal(w.user(t.requesterId).accountId, t.accountId);
      if (t.assigneeId !== null) assert.ok(w.team.some((m) => m.id === t.assigneeId));
    }
  }
});

test("saas: invoices match plan prices; MRR adds up", () => {
  for (const w of [saasMedium, createWorld({ industry: "saas", seed: "test", size: "medium", locale: "en-GB" }), createWorld({ industry: "saas", seed: "flat", product: "analytics", size: "medium", locale: "en-IN" })]) {
    const [free, ...paid] = w.plans;
    assert.equal(free.monthlyPrice, 0);
    for (const p of w.plans) assert.equal(p.annualPrice, p.monthlyPrice * 10);
    for (let k = 1; k < w.plans.length; k++) assert.ok(w.plans[k].monthlyPrice > w.plans[k - 1].monthlyPrice);
    for (const inv of w.invoices) {
      const sub = w.subscriptions.find((s) => s.id === inv.subscriptionId);
      const prices = paid.map((p) => (sub.interval === "year" ? p.annualPrice : p.monthlyPrice));
      assert.ok(prices.some((pr) => (paid[0].perSeat ? inv.subtotal % pr === 0 && inv.subtotal > 0 : inv.subtotal === pr)), `invoice ${inv.number} ${inv.subtotal} matches a plan price`);
      assert.equal(inv.total, inv.subtotal + inv.tax);
    }
    for (const s of w.subscriptions) {
      const live = s.status === "active" || s.status === "past_due";
      const invs = w.invoicesFor(s.accountId);
      if (live && invs.length) {
        assert.equal(s.amount, invs.at(-1).subtotal);
        assert.equal(s.mrr, s.interval === "year" ? Math.round(s.amount / 12) : s.amount);
        if (paid[0].perSeat) assert.equal(s.amount, (s.interval === "year" ? w.plan(s.planId).annualPrice : w.plan(s.planId).monthlyPrice) * s.seats);
      } else assert.equal(s.mrr, 0);
      assert.equal(w.account(s.accountId).mrr, s.mrr);
    }
    assert.equal(w.metrics.mrr, w.subscriptions.reduce((a, s) => a + s.mrr, 0));
    assert.equal(w.metrics.arr, w.metrics.mrr * 12);
    assert.equal(w.metrics.mrrByMonth.at(-1).value, w.metrics.mrr);
    assert.equal(w.metrics.newAccountsByMonth.reduce((a, m) => a + m.value, 0), w.accounts.length);
  }
});

test("saas: time ordering and status rules", () => {
  for (const w of [saas, saasMedium]) {
    const now = ms(w.options.now), founded = ms(w.business.foundedAt);
    for (const s of w.subscriptions) {
      const started = ms(s.startedAt);
      assert.ok(started > founded && started <= now);
      if (s.trialEndsAt) assert.equal(ms(s.trialEndsAt) - started, 14 * DAY);
      if (s.status === "trialing") assert.ok(ms(s.trialEndsAt) > now);
      if (s.canceledAt) assert.ok(ms(s.canceledAt) > started && ms(s.canceledAt) <= now, "canceled after start");
      assert.equal(s.status === "canceled", s.canceledAt !== null);
      const invs = w.invoicesFor(s.accountId);
      invs.forEach((inv, k) => {
        assert.ok(ms(inv.issuedAt) >= ms(s.trialEndsAt) && ms(inv.issuedAt) <= now, "billed after the trial");
        if (k > 0) assert.equal(inv.periodStart, invs[k - 1].periodEnd, "periods are contiguous");
        if (inv.paidAt) assert.ok(ms(inv.paidAt) >= ms(inv.issuedAt) && ms(inv.paidAt) <= now);
        if (inv.status === "past_due") assert.equal(s.status, "past_due");
      });
    }
    for (const u of w.users) {
      const acc = w.account(u.accountId);
      assert.ok(ms(u.createdAt) >= ms(acc.createdAt) && ms(u.createdAt) <= now);
      if (u.lastActiveAt) assert.ok(ms(u.lastActiveAt) >= ms(u.createdAt) && ms(u.lastActiveAt) <= now);
    }
    for (let k = 0; k < w.activity.length; k++) {
      const t = ms(w.activity[k].createdAt);
      assert.ok(t <= now && t >= now - 90 * DAY, "activity in the last 90 days");
      if (k) assert.ok(t <= ms(w.activity[k - 1].createdAt), "newest first");
      assert.ok(t >= ms(w.account(w.activity[k].accountId).createdAt) - 2 * DAY);
    }
    for (const t of w.tickets) {
      assert.ok(ms(t.createdAt) <= now && ms(t.updatedAt) >= ms(t.createdAt) && ms(t.updatedAt) <= now);
      assert.equal(t.solvedAt !== null, t.status === "solved" || t.status === "closed");
      if (t.solvedAt) assert.ok(ms(t.solvedAt) > ms(t.createdAt));
    }
  }
  const statuses = new Set(saasMedium.accounts.map((a) => a.status));
  for (const s of ["trialing", "active", "past_due", "canceled"]) assert.ok(statuses.has(s), `has ${s} accounts`);
});

test("saas: monthly churn is 2-5% and MRR grows", () => {
  for (const [seed, product] of [["churn-a", "crm"], ["churn-b", "analytics"], ["churn-c", "hr"]]) {
    const w = createWorld({ industry: "saas", seed, product, size: "large" });
    assert.ok(w.metrics.churnRate >= 0.02 && w.metrics.churnRate <= 0.05, `${product} churn ${(w.metrics.churnRate * 100).toFixed(2)}%`);
    const series = w.metrics.mrrByMonth;
    assert.ok(series.at(-1).value > series.at(-13).value, "MRR higher than a year ago");
    assert.equal(w.metrics.churnedAccountsByMonth.reduce((a, m) => a + m.value, 0), w.subscriptions.filter((s) => s.canceledAt && w.invoicesFor(s.accountId).length).length);
  }
});

test("saas: coherent text for every product", () => {
  for (const product of SAAS_PRODUCTS) {
    const w = createWorld({ industry: "saas", seed: "text", product, size: "medium" });
    assert.equal(w.business.product, product);
    for (const e of w.activity) assert.doesNotMatch(e.message, /\{|\}|undefined|  /);
    for (const t of w.tickets) assert.doesNotMatch(`${t.subject} ${t.body}`, /\{|\}|undefined/);
    for (const p of w.plans) assert.ok(p.features.length >= 2);
    assert.ok(w.plans[3].features.length > w.plans[1].features.length, "higher plans list more features");
  }
});

test("saas: ids and numbers are unique", () => {
  for (const [list, prefix] of [[saasMedium.accounts, "acc"], [saasMedium.users, "usr"], [saasMedium.invoices, "inv"], [saasMedium.activity, "evt"], [saasMedium.tickets, "tkt"], [saasMedium.subscriptions, "sub"]]) {
    assert.equal(new Set(list.map((x) => x.id)).size, list.length, `${prefix} unique`);
    for (const x of list) assert.match(x.id, new RegExp(`^${prefix}_[0-9a-z]{6}$`));
  }
  assert.equal(new Set(saasMedium.invoices.map((i) => i.number)).size, saasMedium.invoices.length);
  for (const i of saasMedium.invoices) assert.match(i.number, /^INV-\d{4}-\d{4}$/);
  assert.equal(new Set(saasMedium.accounts.map((a) => a.name)).size, saasMedium.accounts.length, "company names unique");
});

test("saas: exports load into SQLite with foreign keys enforced", () => {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(toSQL(saasMedium, { dialect: "sqlite" }));
  for (const [t, n] of [["accounts", saasMedium.accounts.length], ["users", saasMedium.users.length], ["invoices", saasMedium.invoices.length], ["activity", saasMedium.activity.length], ["tickets", saasMedium.tickets.length]]) {
    assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n, n, t);
  }
  assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  assert.equal(db.prepare("SELECT SUM(mrr) AS m FROM accounts").get().m, saasMedium.metrics.mrr);
  db.close();
  assert.deepEqual(Object.keys(toCSV(saas)), ["business", "team", "plans", "accounts", "users", "subscriptions", "invoices", "activity", "tickets"]);
  assert.doesNotMatch(JSON.stringify(toJSON(saas, { includeImages: false })), /data:image/);
});

test("saas: medium world generates in reasonable time", () => {
  const t = performance.now();
  createWorld({ industry: "saas", seed: "perf", size: "medium" });
  const elapsed = performance.now() - t;
  assert.ok(elapsed < 300, `saas medium took ${elapsed.toFixed(1)} ms`);
});
