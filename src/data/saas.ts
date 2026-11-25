import { avatarUrl, logoUrl } from "../core/index";
import { createRng, type Rng } from "../core/util";
import type {
  Account, AccountStatus, ActivityEvent, ActivityType, Invoice, Plan, ResolvedOptions, SaasMetrics, SaasProduct, SaasWorld,
  Subscription, TeamMember, Ticket, TicketPriority, TicketStatus, User, UserRole, WorldSize,
} from "./types";
import {
  COMPANY_PREFIXES, EMPLOYEE_BANDS, INDUSTRIES, INTEGRATIONS, JOB_TITLES, OWNER_TITLES, PLAN_NAMES, PLAN_USD, PRODUCTS,
  SAAS_PRODUCTS, TEAM_TITLES, TICKET_TOPICS,
} from "./lists/saas";
import { LOCALE_INFO, person } from "./locale";
import { fill } from "./text";
import { DAY, HOUR, convert, groupBy, growthTime, indexBy, iso, makeId, moneyFormatter, monthKey, monthsBetween, slug } from "./world";

const COUNTS: Record<WorldSize, number> = { small: 25, medium: 500, large: 5000 };
const TRIAL_DAYS = 14;
/** Monthly cancellation risk by plan tier (Free, Starter, Pro, Business). */
const CHURN = [0, 0.045, 0.032, 0.02];
/** Plan tier weights (Starter, Pro, Business) by company size band. */
const TIER_BY_BAND = [[70, 25, 5], [45, 45, 10], [20, 55, 25], [10, 45, 45], [5, 30, 65]];

type Resolved = ResolvedOptions & { nowMs: number };
interface Period { start: number; end: number; tier: number; seats: number; amount: number; mrr: number }
interface Change { at: number; from: number; to: number }
interface AccountSim {
  account: Account; subscription: Subscription; periods: Period[]; changes: Change[];
  canceledMs: number | null; paid: boolean; pastDue: boolean; activeEnd: number;
}

function addMonths(ms: number, n: number): number {
  const d = new Date(ms);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.getTime();
}

export function createSaas(o: Resolved, productOpt?: SaasProduct): SaasWorld {
  const { seed, nowMs, currency, locale } = o;
  const info = LOCALE_INFO[locale];
  const taxRate = locale === "en-US" ? 0 : info.taxRate;
  const quote = (s: string) => `“${s}”`;

  /* ---------- business and plans ---------- */
  const rb = createRng(seed, "business");
  const productKey = productOpt ?? rb.pick(SAAS_PRODUCTS);
  if (!PRODUCTS[productKey]) throw new Error(`placeholderkit/data: unknown product ${JSON.stringify(productKey)}; use one of ${SAAS_PRODUCTS.join(", ")}.`);
  const spec = PRODUCTS[productKey];
  const foundedMs = Math.floor((nowMs - rb.int(730, 1825) * DAY) / DAY) * DAY + 9 * HOUR;
  const name = `${rb.pick(spec.nameA)} ${rb.pick(spec.nameB)}`;
  const domain = slug(name) + rb.pick([".com", ".io", ".app"]);
  const business = {
    name, tagline: rb.pick(spec.taglines), domain, product: productKey,
    logoUrl: logoUrl({ seed: `business:${seed}`, name }), logoMarkUrl: logoUrl({ seed: `business:${seed}`, name, variant: "mark" }),
    foundedAt: iso(foundedMs),
  };
  const usd = spec.perSeat ? PLAN_USD.perSeat : PLAN_USD.flat;
  const monthly = usd.map((u) => {
    if (u === 0) return 0;
    const major = convert(u * 100, currency) / 100;
    return currency === "INR" ? Math.max(99, Math.round(major / 100) * 100 - 1) * 100 : Math.max(1, Math.round(major)) * 100;
  });
  const plans: Plan[] = PLAN_NAMES.map((planName, k) => ({
    id: makeId("plan", seed, k), name: planName, monthlyPrice: monthly[k], annualPrice: monthly[k] * 10, perSeat: spec.perSeat,
    features: spec.features.slice(0, k + 1).flat(),
  }));
  const priceFor = (tier: number, seats: number, year: boolean) => (year ? plans[tier].annualPrice : plans[tier].monthlyPrice) * (spec.perSeat ? seats : 1);

  /* ---------- the vendor's own support team ---------- */
  const team: TeamMember[] = Array.from({ length: 8 }, (_, k) => {
    const r = createRng(seed, `team:${k}`);
    const p = person(r, locale, domain);
    const id = makeId("tm", seed, k);
    return { id, name: p.name, email: `${slug(p.firstName)}@${domain}`, avatarUrl: avatarUrl({ seed: id, title: p.name }), title: r.pick(TEAM_TITLES) };
  });

  /* ---------- accounts: each simulated on its own random stream ---------- */
  const usedNames = new Set<string>();
  const sims: AccountSim[] = [];
  const users: User[] = [];
  for (let i = 0; i < COUNTS[o.size]; i++) {
    const r = createRng(seed, `account:${i}`);
    const id = makeId("acc", seed, i);
    const [industry, suffixes] = r.pick(INDUSTRIES);
    let company = `${r.pick(COMPANY_PREFIXES)} ${r.pick(suffixes)}`;
    for (let t = 0; t < 6 && usedNames.has(company); t++) company = `${r.pick(COMPANY_PREFIXES)} ${r.pick(suffixes)}`;
    if (usedNames.has(company)) company = `${company} ${["Group", "Co.", "Inc.", "Ltd"][i % 4]}`;
    usedNames.add(company);
    const accDomain = slug(company) + (r.next() < 0.7 ? info.tld : ".com");
    const band = r.weighted(EMPLOYEE_BANDS.map((b, k) => [k, b[1]] as const));
    const [employees, , minSeats, maxSeats] = EMPLOYEE_BANDS[band];
    let seats = r.int(minSeats, maxSeats);
    const createdMs = growthTime(r.next(), foundedMs + 7 * DAY, nowMs - HOUR, 1.5);
    const year = r.next() < 0.25;
    const trialEnd = createdMs + TRIAL_DAYS * DAY;
    const startsFree = band <= 1 && r.next() < 0.18;
    let tier = startsFree ? 0 : 1 + r.weighted(TIER_BY_BAND[band].map((wt, k) => [k, wt] as const));

    let status: AccountStatus;
    let canceledMs: number | null = null;
    const periods: Period[] = [];
    const changes: Change[] = [];
    let pastDue = false;
    if (startsFree) status = "active";
    else if (trialEnd > nowMs) status = "trialing";
    else if (r.next() > 0.65) {
      // Trial didn't convert: some stay on Free, the rest leave.
      if (r.next() < 0.4) { status = "active"; changes.push({ at: trialEnd, from: tier, to: 0 }); tier = 0; }
      else { status = "canceled"; canceledMs = trialEnd; }
    } else {
      status = "active";
      let start = trialEnd;
      for (;;) {
        const end = addMonths(start, year ? 12 : 1);
        const amount = priceFor(tier, seats, year);
        periods.push({ start, end, tier, seats, amount, mrr: year ? Math.round(amount / 12) : amount });
        if (end > nowMs) break;
        const risk = year ? 1 - Math.pow(1 - CHURN[tier], 12) : CHURN[tier];
        if (r.next() < risk) { status = "canceled"; canceledMs = Math.max(start + DAY, end - r.int(0, 10) * DAY); break; }
        if (tier < 3 && r.next() < (year ? 0.15 : 0.025)) { changes.push({ at: end, from: tier, to: tier + 1 }); tier++; }
        else if (tier > 1 && r.next() < (year ? 0.05 : 0.008)) { changes.push({ at: end, from: tier, to: tier - 1 }); tier--; }
        if (spec.perSeat && r.next() < (year ? 0.4 : 0.06)) seats += r.int(1, Math.max(1, Math.round(seats * 0.2)));
        start = end;
      }
      if (status === "active" && r.next() < 0.04 && nowMs - periods[periods.length - 1].start > 3 * DAY) { status = "past_due"; pastDue = true; }
    }
    const paid = periods.length > 0;
    const last = periods[periods.length - 1];
    const live = status === "active" || status === "past_due";
    const subMrr = live && paid ? last.mrr : 0;

    /* users, all at the account's domain */
    const userCount = paid ? Math.min(seats, 2 + r.int(0, 10)) : r.int(1, 4);
    const activeEnd = canceledMs ?? nowMs;
    const accUsers: User[] = [];
    for (let j = 0; j < userCount; j++) {
      const ru = createRng(seed, `user:${i}:${j}`);
      const p = person(ru, locale, accDomain);
      const uid = makeId("usr", seed, i * 64 + j);
      const created = j === 0 ? createdMs : growthTime(ru.next(), createdMs + HOUR, activeEnd, 0.4);
      const invitedOnly = j > 0 && ru.next() < 0.08;
      const lastActive = invitedOnly ? null
        : canceledMs !== null ? created + ru.next() * (activeEnd - created)
        : Math.max(created, nowMs - ru.int(0, 21 * 24) * HOUR - ru.int(0, 59) * 60_000);
      const role: UserRole = j === 0 ? "owner" : ru.weighted([["admin", 15], ["member", 70], ["viewer", 15]] as const);
      accUsers.push({
        id: uid, accountId: id, firstName: p.firstName, lastName: p.lastName, name: p.name, email: p.email, avatarUrl: avatarUrl({ seed: uid, title: p.name }),
        role, title: ru.pick(j === 0 ? OWNER_TITLES : JOB_TITLES), createdAt: iso(created), lastActiveAt: lastActive === null ? null : iso(Math.round(lastActive)),
      });
    }
    users.push(...accUsers);

    const account: Account = {
      id, name: company, domain: accDomain, logoUrl: logoUrl({ seed: id, name: company }), industry, employees,
      country: r.next() < 0.85 ? info.country : r.pick(["US", "GB", "IN", "CA", "AU", "DE"]),
      createdAt: iso(createdMs), ownerId: accUsers[0].id, planId: plans[tier].id, status, mrr: subMrr,
    };
    const subscription: Subscription = {
      id: makeId("sub", seed, i), accountId: id, planId: plans[tier].id, status, interval: year && paid ? "year" : "month",
      seats, amount: paid ? last.amount : 0, mrr: subMrr, startedAt: iso(createdMs), trialEndsAt: startsFree ? null : iso(trialEnd),
      currentPeriodStart: iso(paid ? last.start : startsFree ? createdMs : createdMs),
      currentPeriodEnd: iso(paid ? last.end : startsFree ? addMonths(createdMs, 1) : trialEnd),
      canceledAt: canceledMs === null ? null : iso(canceledMs),
    };
    sims.push({ account, subscription, periods, changes, canceledMs, paid, pastDue, activeEnd });
  }
  const accounts = sims.map((s) => s.account);
  const subscriptions = sims.map((s) => s.subscription);
  const usersByAccount = groupBy(users, "accountId");

  /* ---------- invoices: one per paid period, at that period's plan price ---------- */
  const invoices: Invoice[] = [];
  sims.forEach((s, i) => {
    const r = createRng(seed, `invoices:${i}`);
    s.periods.forEach((p, k) => {
      const isLast = k === s.periods.length - 1;
      const tax = Math.round(p.amount * taxRate);
      let status: Invoice["status"] = "paid";
      let paidMs: number | null = p.start + r.int(0, 72) * HOUR;
      if (isLast && s.pastDue) { status = nowMs - p.start > 7 * DAY ? "past_due" : "open"; paidMs = null; }
      else if (paidMs > nowMs) { status = "open"; paidMs = null; }
      invoices.push({
        id: makeId("inv", seed, i * 512 + k), number: "", accountId: s.account.id, subscriptionId: s.subscription.id,
        periodStart: iso(p.start), periodEnd: iso(p.end), issuedAt: iso(p.start), subtotal: p.amount, tax, total: p.amount + tax,
        status, paidAt: paidMs === null ? null : iso(paidMs),
      });
    });
  });
  invoices.sort((a, b) => (a.issuedAt < b.issuedAt ? -1 : a.issuedAt > b.issuedAt ? 1 : a.id < b.id ? -1 : 1));
  const perYear = new Map<string, number>();
  for (const inv of invoices) {
    const y = inv.issuedAt.slice(0, 4);
    const n = (perYear.get(y) ?? 0) + 1;
    perYear.set(y, n);
    inv.number = `INV-${y}-${String(n).padStart(4, "0")}`;
  }
  const invoicesByAccount = groupBy(invoices, "accountId");

  /* ---------- activity: the last 90 days ---------- */
  const windowStart = nowMs - 90 * DAY;
  const raw: Omit<ActivityEvent, "id">[] = [];
  const fmt = moneyFormatter(currency, locale);
  sims.forEach((s, i) => {
    const r = createRng(seed, `activity:${i}`);
    const acc = s.account;
    const list = usersByAccount.get(acc.id) ?? [];
    const owner = list[0];
    const push = (t: number, type: ActivityType, userId: string | null, message: string) => {
      if (t >= windowStart && t <= nowMs) raw.push({ accountId: acc.id, userId, type, message, createdAt: iso(Math.round(t)) });
    };
    push(Date.parse(acc.createdAt), "account.created", owner.id, `${owner.name} created the ${acc.name} workspace`);
    for (const u of list.slice(1)) {
      const joined = Date.parse(u.createdAt);
      push(joined - r.int(1, 48) * HOUR, "user.invited", owner.id, `${owner.name} invited ${u.email}`);
      if (u.lastActiveAt !== null) push(joined, "user.joined", u.id, `${u.name} joined ${acc.name}`);
    }
    for (const c of s.changes) {
      if (c.to === 0) continue;
      push(c.at, c.to > c.from ? "plan.upgraded" : "plan.downgraded", owner.id, `${owner.name} ${c.to > c.from ? "upgraded" : "moved"} to the ${plans[c.to].name} plan`);
    }
    if (s.paid && s.canceledMs !== null) push(s.canceledMs, "subscription.canceled", owner.id, `${owner.name} canceled the ${plans[s.periods[s.periods.length - 1].tier].name} subscription`);
    for (const inv of invoicesByAccount.get(acc.id) ?? []) if (inv.paidAt) push(Date.parse(inv.paidAt), "invoice.paid", null, `Invoice ${inv.number} for ${fmt(inv.total)} was paid`);

    const from = Math.max(Date.parse(acc.createdAt), windowStart), to = Math.min(nowMs, s.activeEnd);
    const actives = list.filter((u) => u.lastActiveAt !== null).map((u) => ({ u, joined: Date.parse(u.createdAt) }));
    if (to <= from || !actives.length) return;
    const n = Math.min(50, Math.round(r.int(0, 4 * actives.length) * ((to - from) / (90 * DAY))));
    for (let k = 0; k < n; k++) {
      const t = from + r.next() * (to - from);
      const avail = actives.filter((x) => x.joined <= t);
      const u = avail.length ? r.pick(avail).u : owner;
      const title = quote(r.pick(spec.titles));
      const type = r.weighted([["item.created", 30], ["item.updated", 25], ["item.completed", 18], ["comment.added", 15], ["report.exported", 6], ["integration.connected", 2]] as const);
      const message = type === "item.created" ? `${u.name} created the ${spec.item} ${title}`
        : type === "item.updated" ? `${u.name} updated the ${spec.item} ${title}`
        : type === "item.completed" ? `${u.name} ${spec.done} the ${spec.item} ${title}`
        : type === "comment.added" ? `${u.name} commented on ${title}`
        : type === "report.exported" ? `${u.name} exported the ${r.pick(spec.reports)} report`
        : `${u.name} connected the ${r.pick(INTEGRATIONS)} integration`;
      push(t, type, u.id, message);
    }
  });
  raw.sort((a, b) => (a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : a.accountId < b.accountId ? -1 : a.accountId > b.accountId ? 1 : a.message < b.message ? -1 : 1));
  const activity: ActivityEvent[] = raw.map((e, k) => ({ id: makeId("evt", seed, k), ...e }));

  /* ---------- support tickets ---------- */
  const rawTickets: Omit<Ticket, "id" | "number">[] = [];
  const PRIORITIES: TicketPriority[] = ["low", "normal", "high", "urgent"];
  const RESOLVE_HOURS: Record<TicketPriority, [number, number]> = { urgent: [2, 8], high: [4, 24], normal: [12, 72], low: [48, 168] };
  sims.forEach((s, i) => {
    const r = createRng(seed, `tickets:${i}`);
    const created = Date.parse(s.account.createdAt);
    const end = Math.min(nowMs, s.activeEnd);
    const months = Math.max(0, (end - created) / (30 * DAY));
    const n = Math.min(12, Math.floor(-Math.log(1 - r.next()) * (s.paid ? months / 7 : months / 14 + 0.2)));
    const list = (usersByAccount.get(s.account.id) ?? []).filter((u) => u.lastActiveAt !== null);
    for (let k = 0; k < n; k++) {
      const t = Math.round(created + DAY + r.next() * Math.max(0, end - created - DAY));
      if (t > nowMs) continue;
      const topics = s.paid ? TICKET_TOPICS : TICKET_TOPICS.filter((x) => x.topic !== "billing");
      const topic = r.pick(topics);
      const avail = list.filter((u) => Date.parse(u.createdAt) <= t);
      const requester = avail.length ? r.pick(avail) : (usersByAccount.get(s.account.id) ?? [])[0];
      const priority = r.weighted(PRIORITIES.map((p, idx) => [p, topic.priority[idx]] as const).filter(([, wt]) => wt > 0));
      const [lo, hi] = RESOLVE_HOURS[priority];
      const solvedMs = t + r.int(lo, hi) * HOUR + r.int(0, 59) * 60_000;
      let status: TicketStatus, solvedAt: number | null = null, updated: number;
      if (solvedMs <= nowMs) { solvedAt = solvedMs; status = nowMs - solvedMs > 7 * DAY ? "closed" : "solved"; updated = solvedMs; }
      else { status = nowMs - t > DAY && r.next() < 0.5 ? "pending" : "open"; updated = Math.min(nowMs, t + r.next() * (nowMs - t)); }
      const [subject, body] = r.pick(topic.tickets);
      rawTickets.push({
        accountId: s.account.id, requesterId: requester.id, assigneeId: status === "open" && r.next() < 0.3 ? null : r.pick(team).id,
        subject, body: fill(body, { product: name }), status, priority,
        createdAt: iso(t), updatedAt: iso(Math.round(updated)), solvedAt: solvedAt === null ? null : iso(solvedAt),
      });
    }
  });
  rawTickets.sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : a.accountId < b.accountId ? -1 : 1));
  const tickets: Ticket[] = rawTickets.map((t, k) => ({ id: makeId("tkt", seed, k), number: `#${4001 + k}`, ...t }));

  /* ---------- metrics ---------- */
  const months = monthsBetween(foundedMs, nowMs);
  const monthEnd = (m: string) => Math.min(nowMs, Date.UTC(+m.slice(0, 4), +m.slice(5, 7), 1) - 1);
  const monthStart = (m: string) => Date.UTC(+m.slice(0, 4), +m.slice(5, 7) - 1, 1);
  const segments = sims.flatMap((s) => s.periods.map((p) => ({ start: p.start, end: Math.min(p.end, s.canceledMs ?? Infinity), mrr: p.mrr })));
  const mrrAt = (t: number) => segments.reduce((sum, g) => (g.start <= t && t < g.end ? sum + g.mrr : sum), 0);
  const payingAt = (t: number) => sims.reduce((n, s) => (s.periods.some((p) => p.start <= t && t < Math.min(p.end, s.canceledMs ?? Infinity)) ? n + 1 : n), 0);
  const count = (keys: string[]) => { const m = new Map<string, number>(); for (const k of keys) m.set(k, (m.get(k) ?? 0) + 1); return m; };
  const newAcc = count(accounts.map((a) => a.createdAt.slice(0, 7)));
  const churned = count(sims.filter((s) => s.paid && s.canceledMs !== null).map((s) => monthKey(s.canceledMs!)));
  const fullMonths = months.slice(-13, -1);
  const rates = fullMonths.map((m) => { const base = payingAt(monthStart(m)); return base ? (churned.get(m) ?? 0) / base : null; }).filter((x): x is number => x !== null);
  const mrr = subscriptions.reduce((s, sub) => s + sub.mrr, 0);
  const paying = subscriptions.filter((sub) => sub.mrr > 0).length;
  const metrics: SaasMetrics = {
    mrr, arr: mrr * 12,
    churnRate: rates.length ? Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 10000) / 10000 : 0,
    activeAccounts: accounts.filter((a) => a.status === "active" || a.status === "past_due").length,
    trialingAccounts: accounts.filter((a) => a.status === "trialing").length,
    arpa: paying ? Math.round(mrr / paying) : 0,
    mrrByMonth: months.map((m) => ({ month: m, value: mrrAt(monthEnd(m)) })),
    newAccountsByMonth: months.map((m) => ({ month: m, value: newAcc.get(m) ?? 0 })),
    churnedAccountsByMonth: months.map((m) => ({ month: m, value: churned.get(m) ?? 0 })),
  };

  /* ---------- world with non-enumerable helpers ---------- */
  const { nowMs: _drop, ...options } = o;
  const world = { industry: "saas" as const, options, business, team, plans, accounts, users, subscriptions, invoices, activity, tickets, metrics };
  const aIndex = indexBy(accounts, "id"), uIndex = indexBy(users, "id"), pIndex = indexBy(plans, "id"), sIndex = indexBy(subscriptions, "accountId");
  const actByAccount = groupBy(activity, "accountId"), tByAccount = groupBy(tickets, "accountId");
  return Object.defineProperties(world, {
    account: { value: (id: string) => aIndex.get(id) },
    user: { value: (id: string) => uIndex.get(id) },
    plan: { value: (id: string) => pIndex.get(id) },
    usersFor: { value: (accountId: string) => usersByAccount.get(accountId) ?? [] },
    subscriptionFor: { value: (accountId: string) => sIndex.get(accountId) },
    invoicesFor: { value: (accountId: string) => invoicesByAccount.get(accountId) ?? [] },
    activityFor: { value: (accountId: string) => actByAccount.get(accountId) ?? [] },
    ticketsFor: { value: (accountId: string) => tByAccount.get(accountId) ?? [] },
    formatMoney: { value: fmt },
  }) as SaasWorld;
}
