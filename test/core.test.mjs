import { test } from "node:test";
import assert from "node:assert/strict";
import * as sp from "../dist/index.js";

test("same seed gives identical output", () => {
  assert.equal(sp.personSvg({ seed: "ana@acme.com" }), sp.personSvg({ seed: "ana@acme.com" }));
  assert.equal(sp.animalSvg({ seed: "u1", animal: "fox" }), sp.animalSvg({ seed: "u1", animal: "fox" }));
  assert.equal(sp.placeholderSvg({ seed: "p", category: "food" }), sp.placeholderSvg({ seed: "p", category: "food" }));
  assert.equal(sp.logoSvg({ seed: "acme" }), sp.logoSvg({ seed: "acme" }));
});

test("different seeds give different avatars", () => {
  const set = new Set(Array.from({ length: 200 }, (_, i) => sp.personSvg({ seed: `user-${i}` })));
  assert.ok(set.size > 190, `only ${set.size} unique of 200`);
});

test("avatarUrl draws people and animalUrl draws animals", () => {
  const decode = (url) => decodeURIComponent(url.replace(/^data:image\/svg\+xml;charset=utf-8,/, ""));
  assert.equal(decode(sp.avatarUrl({ seed: "ana" })), sp.personSvg({ seed: "ana" }));
  assert.equal(decode(sp.animalUrl({ seed: "u7", animal: "owl" })), sp.animalSvg({ seed: "u7", animal: "owl" }));
  assert.match(decode(sp.animalUrl({ seed: "u7", animal: "owl" })), /owl avatar/);
});

test("pinning an animal keeps the species across seeds", () => {
  for (let i = 0; i < 20; i++) assert.match(sp.animalSvg({ seed: `s${i}`, animal: "panda" }), /panda avatar/);
});

test("every animal, category and logo renders valid-looking svg", () => {
  for (const animal of sp.ANIMALS) for (const expression of sp.EXPRESSIONS) for (const accessory of sp.ACCESSORIES)
    assert.match(sp.animalSvg({ seed: "x", animal, expression, accessory }), /^<svg[\s\S]*<\/svg>$/);
  for (const category of sp.CATEGORIES) assert.match(sp.placeholderSvg({ seed: "x", category, label: "A & B <test>" }), /A &amp; B &lt;test&gt;/);
  assert.ok(sp.logoUrl({ seed: "x" }).startsWith("data:image/svg+xml"));
});

test("ratios parse in common formats", () => {
  assert.equal(sp.parseRatio("16/9"), 16 / 9);
  assert.equal(sp.parseRatio("4:3"), 4 / 3);
  assert.equal(sp.parseRatio(1), 1);
  assert.equal(sp.parseRatio("bad"), 16 / 9);
  assert.match(sp.placeholderSvg({ seed: "x", ratio: "1/1" }), /viewBox="0 0 400 400"/);
});

test("every person avatar's face stands apart from its background", () => {
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const dist = (a, b) => {
    const [r1, g1, b1] = rgb(a), [r2, g2, b2] = rgb(b);
    const rm = (r1 + r2) / 2, dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
    return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db);
  };
  for (let i = 0; i < 500; i++) {
    const svg = sp.personSvg({ seed: `face-${i}` });
    const bg = svg.match(/<rect width="100" height="100" rx="[\d.]+" fill="(#[0-9A-Fa-f]{6})"/)[1];
    const face = svg.match(/<ellipse cx="50" cy="49" rx="21" ry="22" fill="(#[0-9A-Fa-f]{6})"/)[1];
    assert.ok(dist(face, bg) >= 60, `seed face-${i}: ${face} on ${bg}`);
  }
});

test("package.json is importable by tools via the package's exports", async () => {
  const { createRequire } = await import("node:module");
  const pkg = createRequire(import.meta.url)("@placeholderkit/core/package.json");
  assert.equal(pkg.name, "@placeholderkit/core");
  assert.match(pkg.engines.node, />=22/);
});

test("art styles: soft keeps shading, flat drops it, outlined adds a silhouette outline", () => {
  for (const make of [(o) => sp.personSvg({ seed: "art", ...o }), (o) => sp.animalSvg({ seed: "art", animal: "fox", ...o })]) {
    const soft = make({}), flat = make({ artStyle: "flat" }), outlined = make({ artStyle: "outlined" });
    assert.equal(make({ artStyle: "soft" }), soft, "soft is the default");
    assert.doesNotMatch(soft, /class="hl"|<!--outline-->/, "no internal markers leak into output");
    assert.match(soft, /radialGradient/);
    for (const s of [flat, outlined]) assert.doesNotMatch(s, /radialGradient|fill="#fff" opacity=".85"/);
    assert.match(outlined, /stroke="#2E2A33" stroke-width="5"/);
    assert.doesNotMatch(flat, /stroke-width="5"/);
  }
  assert.deepEqual([...sp.ART_STYLES], ["soft", "flat", "outlined"]);
});

test("every hairstyle, animal, accessory and category renders in every art style", () => {
  for (const artStyle of sp.ART_STYLES) {
    for (const hairstyle of sp.HAIRSTYLES) assert.match(sp.personSvg({ seed: "h", hairstyle, artStyle }), /^<svg[\s\S]*<\/svg>$/);
    for (const animal of sp.ANIMALS) for (const accessory of sp.ACCESSORIES) {
      const svg = sp.animalSvg({ seed: "a", animal, accessory, artStyle });
      assert.match(svg, new RegExp(`<title>${animal} avatar</title>`));
      assert.doesNotMatch(svg, /NaN|undefined/);
    }
  }
  assert.equal(sp.ANIMALS.length, 19);
  for (const c of ["real-estate", "finance", "health", "education", "restaurant-menu", "social-post"]) {
    assert.ok(sp.CATEGORIES.includes(c));
    assert.match(sp.placeholderSvg({ seed: "c", category: c }), /^<svg[\s\S]*<\/svg>$/);
  }
});
