// Renders docs/gallery.png (and docs/gallery.svg): a showcase of everything the package draws.
import { writeFileSync } from "fs";
import { Resvg } from "@resvg/resvg-js";
import * as sp from "../src/core/index";

const W = 890;
const cells: string[] = [];
let y = 10;
const put = (svg: string, x: number, top: number, w: number, h: number) => {
  const inner = svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  const vb = svg.match(/viewBox="([^"]+)"/)![1];
  cells.push(`<svg x="${x}" y="${top}" width="${w}" height="${h}" viewBox="${vb}">${inner}</svg>`);
};
/** Lay out a list of SVGs in rows of `per`, each w x h, and advance y. */
const rows = (svgs: string[], per: number, w: number, h: number, gap = 10) => {
  svgs.forEach((svg, i) => put(svg, 10 + (i % per) * (w + gap), y + Math.floor(i / per) * (h + gap), w, h));
  y += Math.ceil(svgs.length / per) * (h + gap) + 10;
};

// People
rows(Array.from({ length: 16 }, (_, i) => sp.personSvg({ seed: "user" + i })), 8, 100, 100);
// Art styles: soft, flat, outlined for a person and an animal
rows(sp.ART_STYLES.flatMap((artStyle, k) => [sp.personSvg({ seed: "style-" + k, artStyle }), sp.animalSvg({ seed: "style", animal: "fox", accessory: "none", expression: "happy", artStyle })]).concat(
  [sp.animalSvg({ seed: "style2", animal: "panda", artStyle: "outlined", accessory: "cap", expression: "joy" }), sp.animalSvg({ seed: "style3", animal: "lion", artStyle: "flat", accessory: "none" })]), 8, 100, 100);
// Every animal once, then a few more variations to fill the last row
const animals = [...sp.ANIMALS, ...sp.ANIMALS.slice(0, 5)];
rows(animals.map((a, i) => sp.animalSvg({ seed: a + "-" + i, animal: a })), 8, 100, 100);
// Accessories
rows(sp.ACCESSORIES.filter((a) => a !== "none").slice(0, 8).map((accessory, i) => sp.animalSvg({ seed: "acc" + i, animal: sp.ANIMALS[(i * 3) % sp.ANIMALS.length], accessory, expression: "happy" })), 8, 100, 100);
// Placeholders: 24 categories in rows of 6
const cats = sp.CATEGORIES.filter((c) => c !== "map" && c !== "document");
rows(cats.map((c, i) => sp.placeholderSvg({ seed: c, category: c, ratio: "16/10", label: i % 5 === 0 ? c[0].toUpperCase() + c.slice(1).replace("-", " ") : undefined })), 6, 136, 85);
// Logos
rows(Array.from({ length: 9 }, (_, i) => sp.logoSvg({ seed: "co" + i })), 3, 280, 50);

const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${y}"><rect width="100%" height="100%" fill="#fff"/>${cells.join("")}</svg>`;
writeFileSync("docs/gallery.svg", doc);
writeFileSync("docs/gallery.png", new Resvg(doc, { font: { loadSystemFonts: true }, fitTo: { mode: "width", value: 1300 } }).render().asPng());
console.log("ok", y);
