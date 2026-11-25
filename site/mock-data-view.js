// Renders an ecommerce world from createWorld() as HTML for the /mock-ecommerce-data/ guide.
// Used twice: by scripts/build-site.mjs (so the page's HTML already shows real data) and in the browser by the demo.
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function storeHtml(w) {
  const f = w.formatMoney, m = w.metrics, b = w.business;
  const kpi = (label, value, hint) => `<div class="kpi"><small>${esc(label)}</small><b>${esc(value)}</b>${hint ? `<i>${esc(hint)}</i>` : ""}</div>`;
  const products = w.products.slice(0, 5).map((p) =>
    `<tr><td><img src="${p.imageUrl}" alt="" width="40" height="40"></td><td><b>${esc(p.name)}</b><span>${esc(p.sku)} · ${p.stock} in stock</span></td><td>${p.rating ? esc(p.rating + "★") : "–"}</td><td class="num">${esc(f(p.price))}</td></tr>`).join("");
  const orders = w.orders.slice(-5).reverse().map((o) => {
    const c = w.customer(o.customerId);
    return `<tr><td><img src="${c.avatarUrl}" alt="" width="32" height="32"></td><td><b>${esc(c.name)}</b><span>${esc(o.number)} · ${o.items.length} item${o.items.length > 1 ? "s" : ""} · ${esc(o.createdAt.slice(0, 10))}</span></td><td><span class="tag">${esc(o.status)}</span></td><td class="num">${esc(f(o.total))}</td></tr>`;
  }).join("");
  return `<div class="md-biz"><img src="${b.logoUrl}" alt="${esc(b.name)} logo" height="30"><span>${esc(b.tagline)}</span></div>
<div class="kpis">${kpi("Revenue", f(m.totalRevenue), "paid orders")}${kpi("Paid orders", m.totalOrders.toLocaleString("en-US"), `${w.orders.length} placed`)}${kpi("Customers", String(w.customers.length), "size: small")}${kpi("Average order", f(m.averageOrderValue), "incl. tax and shipping")}</div>
<div class="md-tables">
<table class="md-table"><caption>store.products</caption><tbody>${products}</tbody></table>
<table class="md-table"><caption>store.orders (latest)</caption><tbody>${orders}</tbody></table>
</div>`;
}

/** One record as pretty JSON, with long data URLs shortened so it stays readable. */
export function recordJson(record) {
  return JSON.stringify(record, (k, v) => (typeof v === "string" && v.startsWith("data:") ? "data:image/svg+xml,…" : v), 2);
}
