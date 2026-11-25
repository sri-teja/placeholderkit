import { writeFileSync } from "fs";
import { Resvg } from "@resvg/resvg-js";
import * as sp from "../src/core/index";
const cells: string[] = [];
let x = 0, y = 0;
const put = (svg: string, w: number, h: number) => {
  const inner = svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  const vb = svg.match(/viewBox="([^"]+)"/)![1];
  cells.push(`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vb}">${inner}</svg>`);
};
// row 1-2: people
for (let i = 0; i < 16; i++) { x = (i % 8) * 110 + 10; y = Math.floor(i / 8) * 110 + 10; put(sp.personSvg({ seed: "user" + i }), 100, 100); }
// rows: each animal 8 variants
sp.ANIMALS.forEach((a, row) => { for (let i = 0; i < 8; i++) { x = i * 110 + 10; y = 240 + row * 110; put(sp.animalSvg({ seed: a + i, animal: a }), 100, 100); } });
const top = 240 + sp.ANIMALS.length * 110 + 10;
sp.CATEGORIES.forEach((c, i) => { x = (i % 5) * 176 + 10; y = top + Math.floor(i / 5) * 110; put(sp.placeholderSvg({ seed: c, category: c, ratio: "16/10", label: i % 4 === 0 ? c[0].toUpperCase() + c.slice(1) : undefined }), 166, 104); });
const top2 = top + 4 * 110 + 10;
for (let i = 0; i < 9; i++) { x = (i % 3) * 293 + 10; y = top2 + Math.floor(i / 3) * 60; put(sp.logoSvg({ seed: "co" + i }), 280, 50); }
const H = top2 + 3 * 60 + 10;
const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="890" height="${H}"><rect width="100%" height="100%" fill="#fff"/>${cells.join("")}</svg>`;
writeFileSync("docs/gallery.svg", doc);
const png = new Resvg(doc, { font: { loadSystemFonts: true }, fitTo: { mode: "width", value: 1300 } }).render().asPng();
writeFileSync("docs/gallery.png", png);
console.log("ok", H);
