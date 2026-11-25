/**
 * Public types for `placeholderkit/data`.
 *
 * Conventions (apply to every record):
 * - Records are plain JSON-serializable objects: no classes, getters or Date objects.
 *   Safe to pass from React Server Components to client components, to structuredClone,
 *   and to JSON.stringify.
 * - Timestamps are ISO 8601 UTC strings ("2026-03-14T09:26:53.000Z").
 *   Calendar months are "YYYY-MM".
 * - Money is an integer number of minor units (cents, pence, paise) in `world.currency`.
 * - Image fields are ready-to-use data: URIs built with the core generators
 *   (avatarUrl / placeholderUrl / logoUrl), seeded by the record id.
 * - IDs are prefixed and seed-stable ("cus_3k9x2a", "prd_…", "ord_…").
 */

/* ------------------------------------------------------------------ */
/* Options                                                             */
/* ------------------------------------------------------------------ */

export type Industry = "ecommerce" | "saas";
export type WorldSize = "small" | "medium" | "large";
export type Locale = "en-US" | "en-GB" | "en-IN";
export type Currency = "USD" | "GBP" | "EUR" | "INR";

/** Store type for ecommerce worlds. Drives product categories, names, copy and images. */
export type StoreVertical =
  | "apparel"
  | "home"
  | "outdoor"
  | "coffee"
  | "pets"
  | "tech-accessories"
  | "books"
  | "beauty";

/** What the SaaS business sells. Drives plan features, activity events and ticket topics. */
export type SaasProduct =
  | "analytics"
  | "project-management"
  | "crm"
  | "support-desk"
  | "hr"
  | "dev-tools";

interface BaseWorldOptions {
  /** Same seed = identical world. Default "placeholderkit". */
  seed?: string;
  /** small ≈ 25, medium ≈ 500, large ≈ 5,000 customers (ecommerce) or accounts (saas). Default "small". */
  size?: WorldSize;
  /**
   * Reference "today". Nothing in the world happens after it. Never read from the clock.
   * Date ("2026-11-01") or full ISO timestamp. Default DEFAULT_NOW.
   */
  now?: string;
  /** Default: from locale (en-US → USD, en-GB → GBP, en-IN → INR). */
  currency?: Currency;
  /** Names, addresses, phone formats, email domains, tax rate. Default "en-US". */
  locale?: Locale;
}

export interface EcommerceWorldOptions extends BaseWorldOptions {
  industry?: "ecommerce";
  /** Default: picked from the seed. */
  vertical?: StoreVertical;
}

export interface SaasWorldOptions extends BaseWorldOptions {
  industry: "saas";
  /** Default: picked from the seed. */
  product?: SaasProduct;
}

export type WorldOptions = EcommerceWorldOptions | SaasWorldOptions;

/** The options actually used, with every default filled in. */
export interface ResolvedOptions {
  seed: string;
  industry: Industry;
  size: WorldSize;
  now: string;
  currency: Currency;
  locale: Locale;
}

/* ------------------------------------------------------------------ */
/* Shared building blocks                                              */
/* ------------------------------------------------------------------ */

export interface Address {
  line1: string;
  city: string;
  /** State, county or state/UT, depending on locale. */
  region: string;
  /** ZIP, postcode or PIN code in the locale's format. */
  postalCode: string;
  /** ISO 3166-1 alpha-2, e.g. "US". */
  country: string;
}

export interface MonthPoint {
  /** "YYYY-MM" */
  month: string;
  value: number;
}

export interface Business {
  name: string;
  /** Short marketing line that matches the vertical / product. */
  tagline: string;
  /** e.g. "pinethread.com" */
  domain: string;
  logoUrl: string;
  /** Mark-only variant, for favicons and small spaces. */
  logoMarkUrl: string;
  /** ISO timestamp. Everything in the world happens on or after this. */
  foundedAt: string;
}

/* ------------------------------------------------------------------ */
/* Ecommerce                                                           */
/* ------------------------------------------------------------------ */

export interface EcommerceBusiness extends Business {
  vertical: StoreVertical;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  /** "First Last" */
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  /** Same as address.city; kept at top level for tables. */
  city: string;
  address: Address;
  signedUpAt: string;
}

export interface Product {
  id: string;
  /** e.g. "PT-1042" */
  sku: string;
  /** From per-category templates, e.g. "Waxed Canvas Weekender Bag". */
  name: string;
  /** Vertical-specific, e.g. "Bags" for apparel. See PRODUCT_CATEGORIES. */
  category: string;
  description: string;
  price: number;
  /** Set when the product is on sale; always greater than price. */
  compareAtPrice: number | null;
  stock: number;
  /** Mean of this product's reviews to one decimal; null when it has none. */
  rating: number | null;
  reviewCount: number;
  imageUrl: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  qty: number;
  /** Price paid per unit at order time (may differ from the current product price). */
  unitPrice: number;
}

export type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

export interface Order {
  id: string;
  /** Human-facing order number, e.g. "#1042", increasing with createdAt. */
  number: string;
  customerId: string;
  items: OrderItem[];
  /** sum(qty × unitPrice) */
  subtotal: number;
  tax: number;
  shipping: number;
  /** subtotal + tax + shipping, exactly. */
  total: number;
  status: OrderStatus;
  createdAt: string;
  /** Set for shipped, delivered and refunded orders. */
  shippedAt: string | null;
  /** Set for delivered and refunded orders. */
  deliveredAt: string | null;
  cancelledAt: string | null;
  refundedAt: string | null;
}

export interface Review {
  id: string;
  productId: string;
  /** Always a customer with a delivered order containing this product. */
  customerId: string;
  orderId: string;
  /** 1–5 */
  rating: number;
  title: string;
  body: string;
  /** After the order was delivered. */
  createdAt: string;
}

export interface TopProduct {
  productId: string;
  unitsSold: number;
  revenue: number;
}

export interface EcommerceMetrics {
  /** Every month from founding to `now`: sum of order totals (incl. tax and shipping). Excludes cancelled and refunded orders. */
  revenueByMonth: MonthPoint[];
  ordersByMonth: MonthPoint[];
  newCustomersByMonth: MonthPoint[];
  /** Top 10 by revenue. */
  topProducts: TopProduct[];
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  /** Share of customers who ordered at all that placed 2+ orders, 0–1. */
  repeatCustomerRate: number;
}

export interface EcommerceWorld {
  industry: "ecommerce";
  /** The options used, with defaults filled in (seed, size, now, currency, locale). */
  options: ResolvedOptions;
  business: EcommerceBusiness;
  customers: Customer[];
  products: Product[];
  /** Sorted by createdAt, oldest first. */
  orders: Order[];
  reviews: Review[];
  metrics: EcommerceMetrics;

  customer(id: string): Customer | undefined;
  product(id: string): Product | undefined;
  order(id: string): Order | undefined;
  ordersFor(customerId: string): Order[];
  reviewsFor(productId: string): Review[];
  /** Formats minor units for the world's currency and locale, e.g. 129900 → "$1,299.00". */
  formatMoney(amount: number): string;
}

/* ------------------------------------------------------------------ */
/* SaaS                                                                */
/* ------------------------------------------------------------------ */

export interface SaasBusiness extends Business {
  product: SaasProduct;
}

export interface Plan {
  id: string;
  /** "Free" | "Starter" | "Pro" | "Business" */
  name: string;
  /** Per seat per month when perSeat, otherwise flat per month. 0 for Free. */
  monthlyPrice: number;
  /** Per seat (or flat) per year, ~2 months free vs monthly. */
  annualPrice: number;
  perSeat: boolean;
  /** Features shown on a pricing page, matching the SaaS product. */
  features: string[];
}

export type AccountStatus = "trialing" | "active" | "past_due" | "canceled";

export interface Account {
  id: string;
  /** Customer company, e.g. "Harborline Logistics". */
  name: string;
  domain: string;
  logoUrl: string;
  /** e.g. "Healthcare", "Logistics". */
  industry: string;
  /** Employee band: "1-10" | "11-50" | "51-200" | "201-1000" | "1000+" */
  employees: string;
  country: string;
  createdAt: string;
  ownerId: string;
  planId: string;
  status: AccountStatus;
  /** Current monthly recurring revenue from this account; 0 when canceled or trialing. */
  mrr: number;
}

export type UserRole = "owner" | "admin" | "member" | "viewer";

export interface User {
  id: string;
  accountId: string;
  firstName: string;
  lastName: string;
  name: string;
  /** At the account's domain. */
  email: string;
  avatarUrl: string;
  role: UserRole;
  /** Job title, e.g. "Operations Manager". */
  title: string;
  createdAt: string;
  /** null if the user never logged in (invited only). */
  lastActiveAt: string | null;
}

export type SubscriptionStatus = AccountStatus;

export interface Subscription {
  id: string;
  accountId: string;
  planId: string;
  status: SubscriptionStatus;
  interval: "month" | "year";
  seats: number;
  /** Price per interval: plan price × seats (when perSeat) for the interval. */
  amount: number;
  /** Monthly-normalized amount (annual / 12). */
  mrr: number;
  startedAt: string;
  trialEndsAt: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  /** After startedAt. */
  canceledAt: string | null;
}

export type InvoiceStatus = "paid" | "open" | "past_due" | "void";

export interface Invoice {
  id: string;
  /** e.g. "INV-2026-0042" */
  number: string;
  accountId: string;
  subscriptionId: string;
  periodStart: string;
  periodEnd: string;
  issuedAt: string;
  /** Equals the subscription amount for the period. */
  subtotal: number;
  tax: number;
  /** subtotal + tax, exactly. */
  total: number;
  status: InvoiceStatus;
  paidAt: string | null;
}

/** Feed event types; which ones appear depends on the SaaS product. */
export type ActivityType =
  | "account.created"
  | "user.invited"
  | "user.joined"
  | "plan.upgraded"
  | "plan.downgraded"
  | "subscription.canceled"
  | "invoice.paid"
  | "item.created"
  | "item.updated"
  | "item.completed"
  | "report.exported"
  | "integration.connected"
  | "comment.added";

export interface ActivityEvent {
  id: string;
  accountId: string;
  /** null for system events (e.g. invoice.paid). */
  userId: string | null;
  type: ActivityType;
  /** Ready-to-show text, e.g. "Priya Shah created the dashboard “Q3 Pipeline”". */
  message: string;
  createdAt: string;
}

export type TicketStatus = "open" | "pending" | "solved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  /** e.g. "Support Engineer" */
  title: string;
}

export interface Ticket {
  id: string;
  /** e.g. "#4821" */
  number: string;
  accountId: string;
  requesterId: string;
  /** A member of world.team. */
  assigneeId: string | null;
  subject: string;
  body: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  /** Set when solved or closed. */
  solvedAt: string | null;
}

export interface SaasMetrics {
  /** Current MRR, sum of active and past_due subscriptions. */
  mrr: number;
  arr: number;
  /** Mean monthly logo churn over the last 12 months, 0–1 (typically 0.02–0.05). */
  churnRate: number;
  activeAccounts: number;
  trialingAccounts: number;
  /** Average revenue per active account (monthly). */
  arpa: number;
  mrrByMonth: MonthPoint[];
  newAccountsByMonth: MonthPoint[];
  churnedAccountsByMonth: MonthPoint[];
}

export interface SaasWorld {
  industry: "saas";
  /** The options used, with defaults filled in (seed, size, now, currency, locale). */
  options: ResolvedOptions;
  business: SaasBusiness;
  /** The SaaS company's own staff (support agents for tickets). */
  team: TeamMember[];
  plans: Plan[];
  accounts: Account[];
  users: User[];
  subscriptions: Subscription[];
  /** Sorted by issuedAt, oldest first. */
  invoices: Invoice[];
  /** Last 90 days before `now`, newest first. */
  activity: ActivityEvent[];
  tickets: Ticket[];
  metrics: SaasMetrics;

  account(id: string): Account | undefined;
  user(id: string): User | undefined;
  plan(id: string): Plan | undefined;
  usersFor(accountId: string): User[];
  subscriptionFor(accountId: string): Subscription | undefined;
  invoicesFor(accountId: string): Invoice[];
  activityFor(accountId: string): ActivityEvent[];
  ticketsFor(accountId: string): Ticket[];
  formatMoney(amount: number): string;
}

export type World = EcommerceWorld | SaasWorld;

/* ------------------------------------------------------------------ */
/* Entry points and export (signatures only)                           */
/* ------------------------------------------------------------------ */

export interface CreateWorld {
  (options: SaasWorldOptions): SaasWorld;
  (options?: EcommerceWorldOptions): EcommerceWorld;
  (options?: WorldOptions): World;
}

export interface ExportOptions {
  /** Include data: URI image columns. Default true for JSON, false for CSV and SQL. */
  includeImages?: boolean;
}

export type SqlDialect = "postgres" | "mysql" | "sqlite";

export interface ExportFunctions {
  /** Data only (no helper methods). Arrays keep their order; order items stay nested. */
  toJSON(world: World, options?: ExportOptions): Record<string, unknown>;
  /** One CSV per table; order items become an `order_items` table. */
  toCSV(world: World, options?: ExportOptions): Record<string, string>;
  /** CREATE TABLE (with primary and foreign keys) + INSERT statements. */
  toSQL(world: World, options: ExportOptions & { dialect: SqlDialect }): string;
}
