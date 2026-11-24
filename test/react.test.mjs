import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Avatar, Placeholder, Logo } from "../dist/react.js";
import { Icon } from "../dist/icons.js";

test("components server-render to img tags with alt text", () => {
  const html = renderToStaticMarkup(h("div", null,
    h(Avatar, { seed: "ana" }),
    h(Avatar, { seed: "u7", animal: "fox", size: 64 }),
    h(Placeholder, { seed: "dish", category: "food", ratio: "4/3", label: "Pasta" }),
    h(Logo, { seed: "acme", name: "Acme" }),
  ));
  assert.equal((html.match(/<img /g) || []).length, 4);
  assert.match(html, /alt="fox avatar"/);
  assert.match(html, /alt="Pasta"/);
  assert.match(html, /alt="Acme logo"/);
  assert.match(html, /aspect-ratio:1\.3333/);
});

test("Icon resolves kebab-case names and falls back on unknown names", () => {
  const ok = renderToStaticMarkup(h(Icon, { name: "shopping-cart" }));
  const bad = renderToStaticMarkup(h(Icon, { name: "definitely-not-an-icon" }));
  assert.match(ok, /<svg/);
  assert.match(bad, /<svg/);
  assert.notEqual(ok, bad);
});
