import type { ExportOptions, SqlDialect, World } from "./types";

type ColType = "text" | "int" | "real" | "time";
interface Col { name: string; type: ColType; image?: boolean; pk?: boolean; ref?: string; get: (row: any) => unknown }
interface Table { name: string; cols: Col[]; rows: (w: any) => any[] }

const c = (name: string, type: ColType, get: (row: any) => unknown, extra: Partial<Col> = {}): Col => ({ name, type, get, ...extra });
const field = (key: string, type: ColType, extra: Partial<Col> = {}): Col => c(key.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase()), type, (r) => r[key], extra);

/** Table layout per industry, in insert order (parents before children). */
function tables(world: World): Table[] {
  if (world.industry === "ecommerce") {
    return [
      { name: "business", rows: (w) => [w.business], cols: [
        c("id", "int", () => 1, { pk: true }), field("name", "text"), field("tagline", "text"), field("domain", "text"), field("vertical", "text"),
        field("foundedAt", "time"), field("logoUrl", "text", { image: true }), field("logoMarkUrl", "text", { image: true }),
      ] },
      { name: "customers", rows: (w) => w.customers, cols: [
        field("id", "text", { pk: true }), field("firstName", "text"), field("lastName", "text"), field("name", "text"), field("email", "text"),
        field("phone", "text"), c("address_line1", "text", (r) => r.address.line1), field("city", "text"), c("region", "text", (r) => r.address.region),
        c("postal_code", "text", (r) => r.address.postalCode), c("country", "text", (r) => r.address.country), field("signedUpAt", "time"),
        field("avatarUrl", "text", { image: true }),
      ] },
      { name: "products", rows: (w) => w.products, cols: [
        field("id", "text", { pk: true }), field("sku", "text"), field("name", "text"), field("category", "text"), field("description", "text"),
        field("price", "int"), field("compareAtPrice", "int"), field("stock", "int"), field("rating", "real"), field("reviewCount", "int"),
        field("createdAt", "time"), field("imageUrl", "text", { image: true }),
      ] },
      { name: "orders", rows: (w) => w.orders, cols: [
        field("id", "text", { pk: true }), field("number", "text"), field("customerId", "text", { ref: "customers" }), field("status", "text"),
        field("subtotal", "int"), field("tax", "int"), field("shipping", "int"), field("total", "int"), field("createdAt", "time"),
        field("shippedAt", "time"), field("deliveredAt", "time"), field("cancelledAt", "time"), field("refundedAt", "time"),
      ] },
      { name: "order_items", rows: (w) => w.orders.flatMap((o: any) => o.items.map((it: any, n: number) => ({ ...it, orderId: o.id, line: n + 1 }))), cols: [
        field("orderId", "text", { ref: "orders" }), field("line", "int"), field("productId", "text", { ref: "products" }), field("qty", "int"), field("unitPrice", "int"),
      ] },
      { name: "reviews", rows: (w) => w.reviews, cols: [
        field("id", "text", { pk: true }), field("productId", "text", { ref: "products" }), field("customerId", "text", { ref: "customers" }),
        field("orderId", "text", { ref: "orders" }), field("rating", "int"), field("title", "text"), field("body", "text"), field("createdAt", "time"),
      ] },
    ];
  }
  throw new Error("placeholderkit/data: export for this industry is not available yet.");
}

const visible = (t: Table, includeImages: boolean) => t.cols.filter((col) => includeImages || !col.image);

/** Data only (helper methods are not included). Image URLs are kept unless includeImages is false. */
export function toJSON(world: World, options: ExportOptions = {}): Record<string, unknown> {
  const data = JSON.parse(JSON.stringify(world)) as Record<string, unknown>;
  if (options.includeImages === false) {
    const strip = (v: unknown): unknown => {
      if (Array.isArray(v)) return v.map(strip);
      if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).filter(([k]) => !/Url$/.test(k)).map(([k, x]) => [k, strip(x)]));
      return v;
    };
    return strip(data) as Record<string, unknown>;
  }
  return data;
}

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** One CSV per table, e.g. { customers: "id,first_name,...", orders: "...", order_items: "..." }. Images are left out unless includeImages is true. */
export function toCSV(world: World, options: ExportOptions = {}): Record<string, string> {
  const out: Record<string, string> = {};
  for (const t of tables(world)) {
    const cols = visible(t, options.includeImages === true);
    const lines = [cols.map((col) => col.name).join(",")];
    for (const row of t.rows(world)) lines.push(cols.map((col) => csvCell(col.get(row))).join(","));
    out[t.name] = lines.join("\n") + "\n";
  }
  return out;
}

const TYPES: Record<SqlDialect, Record<ColType, string> & { key: string }> = {
  postgres: { text: "TEXT", key: "VARCHAR(32)", int: "INTEGER", real: "REAL", time: "TIMESTAMPTZ" },
  mysql: { text: "TEXT", key: "VARCHAR(32)", int: "INT", real: "DOUBLE", time: "DATETIME(3)" },
  sqlite: { text: "TEXT", key: "TEXT", int: "INTEGER", real: "REAL", time: "TEXT" },
};

/** CREATE TABLE (with primary and foreign keys) plus INSERT statements. Images are left out unless includeImages is true. */
export function toSQL(world: World, options: ExportOptions & { dialect: SqlDialect }): string {
  const { dialect } = options;
  if (!TYPES[dialect]) throw new Error(`placeholderkit/data: unknown SQL dialect ${JSON.stringify(dialect)}; use postgres, mysql or sqlite.`);
  const q = (id: string) => (dialect === "mysql" ? `\`${id}\`` : `"${id}"`);
  const lit = (v: unknown, type: ColType): string => {
    if (v === null || v === undefined) return "NULL";
    if (type === "int" || type === "real") return String(v);
    let s = String(v);
    if (type === "time" && dialect === "mysql") s = s.replace("T", " ").replace("Z", "");
    return `'${s.replace(/'/g, "''")}'`;
  };
  const T = TYPES[dialect];
  const parts: string[] = [`-- Generated by placeholderkit/data (seed ${JSON.stringify(world.options.seed)}, ${world.options.size}, ${dialect})`];
  const all = tables(world);
  for (const t of [...all].reverse()) parts.push(`DROP TABLE IF EXISTS ${q(t.name)};`);
  for (const t of all) {
    const cols = visible(t, options.includeImages === true);
    const defs = cols.map((col) => `  ${q(col.name)} ${(col.pk || col.ref) && col.type === "text" ? T.key : T[col.type]}${col.pk ? " PRIMARY KEY" : ""}`);
    for (const col of cols) if (col.ref) defs.push(`  FOREIGN KEY (${q(col.name)}) REFERENCES ${q(col.ref)} (${q("id")})`);
    parts.push(`CREATE TABLE ${q(t.name)} (\n${defs.join(",\n")}\n);`);
  }
  for (const t of all) {
    const cols = visible(t, options.includeImages === true);
    const rows = t.rows(world);
    for (let i = 0; i < rows.length; i += 500) {
      const values = rows.slice(i, i + 500).map((row) => `(${cols.map((col) => lit(col.get(row), col.type)).join(", ")})`);
      parts.push(`INSERT INTO ${q(t.name)} (${cols.map((col) => q(col.name)).join(", ")}) VALUES\n${values.join(",\n")};`);
    }
  }
  return parts.join("\n\n") + "\n";
}
