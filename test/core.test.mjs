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
