import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

test("script-tag build fills data-placeholderkit images, including ones added later", async () => {
  const dom = new JSDOM(`<body>
    <img id="a" data-placeholderkit="avatar" data-seed="ana">
    <img id="b" data-placeholderkit="animal" data-seed="u7" data-animal="owl">
    <img id="c" data-placeholderkit="placeholder" data-seed="d" data-category="food" data-label="Soup">
  </body>`, { runScripts: "outside-only" });
  dom.window.eval(readFileSync(new URL("../dist/placeholderkit.global.js", import.meta.url), "utf8"));
  const $ = (id) => dom.window.document.getElementById(id);
  assert.ok($("a").src.startsWith("data:image/svg+xml"));
  assert.equal($("b").alt, "owl avatar");
  assert.equal($("c").alt, "Soup");
  const late = dom.window.document.createElement("img");
  late.dataset.placeholderkit = "logo"; late.dataset.seed = "acme"; late.id = "d";
  dom.window.document.body.appendChild(late);
  await new Promise((r) => setTimeout(r, 0));
  assert.ok($("d").src.startsWith("data:image/svg+xml"));
  assert.equal(typeof dom.window.PlaceholderKit.avatarUrl, "function");
});

test("script tag reads art style, hairstyle, expression and accessory attributes", () => {
  const dom = new JSDOM(`<body>
    <img id="p" data-placeholderkit="avatar" data-seed="ana" data-hairstyle="afro" data-art-style="outlined">
    <img id="a" data-placeholderkit="animal" data-seed="u7" data-animal="lion" data-expression="joy" data-accessory="cap" data-art-style="flat">
  </body>`, { runScripts: "outside-only" });
  dom.window.eval(readFileSync(new URL("../dist/placeholderkit.global.js", import.meta.url), "utf8"));
  const K = dom.window.PlaceholderKit;
  const decode = (el) => decodeURIComponent(el.src.replace(/^data:image\/svg\+xml;charset=utf-8,/, ""));
  const $ = (id) => dom.window.document.getElementById(id);
  assert.equal(decode($("p")), K.personSvg({ seed: "ana", hairstyle: "afro", artStyle: "outlined" }));
  assert.equal(decode($("a")), K.animalSvg({ seed: "u7", animal: "lion", expression: "joy", accessory: "cap", artStyle: "flat" }));
  assert.equal($("a").alt, "lion avatar");
});
