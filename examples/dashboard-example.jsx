// A SaaS dashboard built from one createWorld call: KPIs, an MRR chart,
// an accounts table with logos and owner avatars, and an activity feed.
// Works as a React Server Component or a client component; no chart library needed.
import { createWorld } from "@placeholderkit/core/data";

const world = createWorld({ seed: "acme-demo", industry: "saas", size: "medium" });
const { metrics, formatMoney } = world;

function Kpi({ label, value, hint }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 13, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, marginTop: 4 }}>{value}</div>
      {hint && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

function MrrChart({ points }) {
  const W = 640, H = 180, pad = 24;
  const max = Math.max(...points.map((p) => p.value)) || 1;
  const bw = (W - pad * 2) / points.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Monthly recurring revenue, last 12 months">
      {points.map((p, i) => {
        const h = ((H - pad * 2) * p.value) / max;
        return (
          <g key={p.month}>
            <rect x={pad + i * bw + 4} y={H - pad - h} width={bw - 8} height={h} rx={4} fill="#4b4be8" opacity={i === points.length - 1 ? 1 : 0.55}>
              <title>{`${p.month}: ${formatMoney(p.value)}`}</title>
            </rect>
            <text x={pad + i * bw + bw / 2} y={H - 6} fontSize="10" textAnchor="middle" fill="#6b7280">{p.month.slice(5)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Dashboard() {
  const topAccounts = [...world.accounts].filter((a) => a.mrr > 0).sort((a, b) => b.mrr - a.mrr).slice(0, 8);
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 1040, margin: "0 auto", padding: 32, display: "grid", gap: 24 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img src={world.business.logoUrl} alt={`${world.business.name} logo`} height={32} />
        <span style={{ color: "#6b7280" }}>{world.business.tagline}</span>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <Kpi label="MRR" value={formatMoney(metrics.mrr)} hint={`ARR ${formatMoney(metrics.arr)}`} />
        <Kpi label="Active accounts" value={metrics.activeAccounts} hint={`${metrics.trialingAccounts} trialing`} />
        <Kpi label="Monthly churn" value={`${(metrics.churnRate * 100).toFixed(1)}%`} hint="average, last 12 months" />
        <Kpi label="ARPA" value={formatMoney(metrics.arpa)} hint="per paying account, monthly" />
      </section>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
        <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>MRR, last 12 months</h2>
        <MrrChart points={metrics.mrrByMonth.slice(-12)} />
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)", gap: 24 }}>
        <section>
          <h2 style={{ fontSize: 16 }}>Top accounts</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr style={{ textAlign: "left", color: "#6b7280" }}><th>Account</th><th>Owner</th><th>Plan</th><th style={{ textAlign: "right" }}>MRR</th></tr></thead>
            <tbody>
              {topAccounts.map((a) => {
                const owner = world.user(a.ownerId);
                return (
                  <tr key={a.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "8px 0" }}><img src={a.logoUrl} alt="" height={20} style={{ verticalAlign: "middle" }} /></td>
                    <td><img src={owner.avatarUrl} alt="" width={24} height={24} style={{ verticalAlign: "middle", marginRight: 8 }} />{owner.name}</td>
                    <td>{world.plan(a.planId).name}</td>
                    <td style={{ textAlign: "right" }}>{formatMoney(a.mrr)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section>
          <h2 style={{ fontSize: 16 }}>Activity</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12, fontSize: 14 }}>
            {world.activity.slice(0, 10).map((e) => {
              const user = e.userId ? world.user(e.userId) : null;
              return (
                <li key={e.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  {user && <img src={user.avatarUrl} alt="" width={28} height={28} />}
                  <div>
                    <div>{e.message}</div>
                    <time style={{ fontSize: 12, color: "#6b7280" }} dateTime={e.createdAt}>{e.createdAt.slice(0, 16).replace("T", " ")}</time>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </main>
  );
}
