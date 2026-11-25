// Builds the website into _site/ for GitHub Pages.
// Run `npm run site` (builds the package first). Preview: `npx serve _site`.
import { mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { animalSvg, personSvg, placeholderSvg } from "../dist/index.js";

const OUT = "_site";
const SITE_URL = (process.env.SITE_URL || "https://sri-teja.github.io/placeholderkit/").replace(/\/?$/, "/");
const { version } = JSON.parse(readFileSync("package.json", "utf8"));

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const html = readFileSync("site/index.html", "utf8")
  .replaceAll("{{VERSION}}", version)
  .replaceAll("{{SITE_URL}}", SITE_URL);
writeFileSync(`${OUT}/index.html`, html);
copyFileSync("dist/placeholderkit.global.js", `${OUT}/placeholderkit.global.js`);
copyFileSync("llms.txt", `${OUT}/llms.txt`);
writeFileSync(`${OUT}/.nojekyll`, "");

// Favicon: the fox character.
writeFileSync(`${OUT}/favicon.svg`, animalSvg({ seed: "placeholderkit", animal: "fox", expression: "happy", accessory: "none", background: "#F7DCE7", title: "placeholderkit" }));

// Social preview (1200x630): a mosaic of generated images with the name.
const inner = (svg) => svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
const cell = (svg, x, y, w, h) => {
  const vb = svg.match(/viewBox="([^"]+)"/)[1];
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vb}">${inner(svg)}</svg>`;
};
const cells = [];
const people = ["ana", "kai", "mira", "leo", "sam", "noor"];
const animals = ["fox", "panda", "bear", "rabbit", "owl", "koala"];
for (let r = 0; r < 4; r++) {
  for (let c = 0; c < 4; c++) {
    const i = r * 4 + c, x = 640 + c * 128, y = 58 + r * 128;
    const svg = (r + c) % 2 === 0
      ? personSvg({ seed: people[i % people.length] + i })
      : animalSvg({ seed: "og" + i, animal: animals[i % animals.length], accessory: "none" });
    cells.push(cell(svg, x, y, 112, 112));
  }
}
["food", "travel", "product"].forEach((category, i) => {
  cells.push(`<clipPath id="og-c${i}"><rect x="${64 + i * 176}" y="410" width="160" height="120" rx="16"/></clipPath>`);
  cells.push(`<g clip-path="url(#og-c${i})">${cell(placeholderSvg({ seed: "og-" + category, category, ratio: "4/3" }), 64 + i * 176, 410, 160, 120)}</g>`);
});
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#FBFAF7"/>
<text x="64" y="150" font-family="Georgia, 'DejaVu Serif', serif" font-size="84" fill="#15171C" letter-spacing="-2">placeholderkit</text>
<text x="66" y="214" font-family="'Helvetica Neue', Arial, 'DejaVu Sans', sans-serif" font-size="30" fill="#646A76">Placeholder avatars, images and logos</text>
<text x="66" y="256" font-family="'Helvetica Neue', Arial, 'DejaVu Sans', sans-serif" font-size="30" fill="#646A76">for prototypes. Generated as SVG.</text>
<rect x="64" y="300" width="400" height="56" rx="14" fill="#15171C"/>
<text x="88" y="336" font-family="Menlo, 'DejaVu Sans Mono', monospace" font-size="22" fill="#FBFAF7">npm i @placeholderkit/core</text>
${cells.join("\n")}
</svg>`;
writeFileSync(`${OUT}/og.png`, new Resvg(og, { font: { loadSystemFonts: true }, fitTo: { mode: "width", value: 1200 } }).render().asPng());

console.log(`Site built in ${OUT}/ (v${version}, ${SITE_URL})`);
