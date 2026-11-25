import { Avatar, AnimalAvatar, Placeholder, Logo } from "@placeholderkit/core/react";
import { Icon } from "@placeholderkit/core/icons";

const products = [
  { id: "p1", name: "Trail runner", price: "$120" },
  { id: "p2", name: "Canvas tote", price: "$45" },
  { id: "p3", name: "Desk lamp", price: "$80" },
];

export default function Shop() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Logo seed="shop" name="Northworks" height={28} />
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Icon name="shopping-cart" size={20} />
          <Avatar seed="current-user@example.com" size={32} />
        </div>
      </header>

      <Placeholder seed="hero" category="fashion" ratio="21/9" label="Spring collection" style={{ borderRadius: 12, margin: "24px 0" }} />

      <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {products.map((p) => (
          <article key={p.id}>
            <Placeholder seed={p.id} category="product" ratio="1/1" style={{ borderRadius: 8 }} />
            <h3>{p.name}</h3>
            <p>{p.price}</p>
          </article>
        ))}
      </section>

      <h2>Reviews</h2>
      {["r1", "r2", "r3"].map((id) => (
        <div key={id} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <AnimalAvatar seed={id} animal="panda" size={40} />
          <p>Great quality, fast shipping.</p>
        </div>
      ))}
    </main>
  );
}
