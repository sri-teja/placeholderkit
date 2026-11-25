// Builds the website into _site/ for GitHub Pages.
// Run `npm run site` (builds the package first). Preview: `npx serve _site`.
import { mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { build } from "esbuild";
import { execSync } from "node:child_process";
import { animalSvg, personSvg, placeholderSvg } from "../dist/index.js";

const OUT = "_site";
const SITE_URL = (process.env.SITE_URL || "https://sri-teja.github.io/placeholderkit/").replace(/\/?$/, "/");
const { version } = JSON.parse(readFileSync("package.json", "utf8"));

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const REPO_URL = "https://github.com/sri-teja/placeholderkit";
const partials = { header: readFileSync("site/partials/header.html", "utf8"), footer: readFileSync("site/partials/footer.html", "utf8") };
/** Fill shared header/footer and placeholders. `root` is the path back to the site root from the page. */
function page(file, { root, home, current = "" }, extra = {}) {
  let html = readFileSync(file, "utf8").replace(/<!--#include (\w+)-->/g, (_, name) => partials[name]);
  const vars = {
    VERSION: version, SITE_URL, ROOT: root, HOME: home, CHANGELOG_CURRENT: current, REPO_URL,
    REQUEST_URL: `${REPO_URL}/issues/new?template=request.yml`, LICENSE_URL: `${REPO_URL}/blob/main/LICENSE`, ...extra,
  };
  return html.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));
}
writeFileSync(`${OUT}/index.html`, page("site/index.html", { root: "", home: "#top" }));
copyFileSync("site/site.css", `${OUT}/site.css`);
copyFileSync("site/common.js", `${OUT}/common.js`);
copyFileSync("dist/placeholderkit.global.js", `${OUT}/placeholderkit.global.js`);
// The fake-data module as one ES module, loaded on demand by the "Fake data" section.
await build({ entryPoints: ["dist/data.js"], bundle: true, minify: true, format: "esm", outfile: `${OUT}/data.js`, logLevel: "error" });
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
<text x="64" y="148" font-family="'Helvetica Neue', Arial, 'DejaVu Sans', sans-serif" font-weight="700" font-size="76" fill="#15171C" letter-spacing="-3">placeholderkit</text>
<text x="66" y="214" font-family="'Helvetica Neue', Arial, 'DejaVu Sans', sans-serif" font-size="30" fill="#646A76">Placeholder avatars, images and logos</text>
<text x="66" y="256" font-family="'Helvetica Neue', Arial, 'DejaVu Sans', sans-serif" font-size="30" fill="#646A76">for prototypes. Generated as SVG.</text>
<rect x="64" y="300" width="400" height="56" rx="14" fill="#15171C"/>
<text x="88" y="336" font-family="Menlo, 'DejaVu Sans Mono', monospace" font-size="22" fill="#FBFAF7">npm i @placeholderkit/core</text>
${cells.join("\n")}
</svg>`;
writeFileSync(`${OUT}/og.png`, new Resvg(og, { font: { loadSystemFonts: true }, fitTo: { mode: "width", value: 1200 } }).render().asPng());

console.log(`Site built in ${OUT}/ (v${version}, ${SITE_URL})`);

/* ---------------- changelog page ---------------- */

/** Live previews (drawn in the browser by the script-tag build) for releases that added images. */
function previews(v) {
  const img = (attrs, cls = "") => `<img ${cls ? `class="${cls}" ` : ""}data-placeholderkit=${attrs} alt="">`;
  const animal = (a) => img(`"animal" data-seed="cl-${a}" data-animal="${a}" data-accessory="none" data-expression="happy"`);
  const P = {
    "0.4.0": () => ["lion", "tiger", "raccoon", "pig", "monkey", "sheep", "hamster", "otter", "deer", "chick"].map(animal).join("") +
      ["soft", "flat", "outlined"].map((st) => img(`"animal" data-seed="cl-style" data-animal="fox" data-accessory="none" data-expression="happy" data-art-style="${st}"`)).join("") +
      ["real-estate", "finance", "health", "education", "restaurant-menu", "social-post"].map((c) => img(`"placeholder" data-seed="cl-${c}" data-category="${c}" data-ratio="16/10"`, "wide")).join("") +
      "<small>New animals, the three art styles (soft, flat, outlined) and the new placeholder categories.</small>",
    "0.3.0": () => [0, 1, 2, 3].map((i) => img(`"avatar" data-seed="cl-cust-${i}"`)).join("") +
      [0, 1, 2].map((i) => img(`"placeholder" data-seed="cl-prod-${i}" data-category="product" data-ratio="1/1"`)).join("") +
      [0, 1].map((i) => img(`"logo" data-seed="cl-acc-${i}" data-variant="mark"`)).join("") +
      "<small>Customers, products and accounts from <code>createWorld()</code>, with images built in.</small>",
    "0.1.0": () => [0, 1, 2, 3].map((i) => img(`"avatar" data-seed="cl-first-${i}"`)).join("") +
      ["fox", "panda", "bear"].map(animal).join("") +
      ["food", "travel"].map((c) => img(`"placeholder" data-seed="cl-first-${c}" data-category="${c}" data-ratio="16/10"`, "wide")).join("") +
      "<small>The first release: person and animal avatars, placeholder images, logos and icons.</small>",
  };
  return P[v] ? `<div class="rel-preview">${P[v]()}</div>` : "";
}

const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function inline(t) {
  return esc(t)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>');
}
/** Minimal Markdown for changeset entries: paragraphs and (nested) bullet lists with inline code, bold and links. */
function markdown(lines) {
  let html = "", para = [];
  const stack = [];
  const flush = () => { if (para.length) { html += `<p>${inline(para.join(" "))}</p>`; para = []; } };
  for (const raw of lines) {
    const m = raw.match(/^(\s*)- (.*)$/);
    if (m) {
      flush();
      const depth = Math.floor(m[1].length / 2);
      while (stack.length > depth + 1) html += "</li></ul>", stack.pop();
      if (stack.length === depth + 1) html += "</li>";
      else html += "<ul>", stack.push(depth);
      html += `<li>${inline(m[2])}`;
    } else if (!raw.trim()) flush();
    else if (stack.length) {
      // An indented line belongs to the list item at that indentation: close deeper lists, then add a paragraph.
      const owner = Math.max(0, Math.floor(raw.match(/^\s*/)[0].length / 2) - 1);
      while (stack.length > owner + 1) html += "</li></ul>", stack.pop();
      html += `<p>${inline(raw.trim())}</p>`;
    }
    else para.push(raw.trim());
  }
  flush();
  while (stack.length) html += "</li></ul>", stack.pop();
  return html;
}

async function changelogHtml() {
  const md = readFileSync("CHANGELOG.md", "utf8");
  const releases = md.split(/^## /m).slice(1).map((block) => {
    const [head, ...rest] = block.split("\n");
    const sections = rest.join("\n").split(/^### /m);
    const intro = sections.shift();
    return { version: head.trim(), intro, sections: sections.map((sec) => { const [title, ...body] = sec.split("\n"); return { title: title.trim(), body }; }) };
  });
  let dates = {};
  try {
    const res = await fetch("https://registry.npmjs.org/@placeholderkit%2Fcore", { signal: AbortSignal.timeout(8000) });
    if (res.ok) dates = (await res.json()).time ?? {};
  } catch {}
  // The site can build seconds after a release, before npm records its publish time: use the commit date then.
  if (!dates[version]) {
    try { dates[version] = execSync("git log -1 --format=%cI", { encoding: "utf8" }).trim() || undefined; } catch {}
  }
  const fmt = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const LABELS = { "Major Changes": ["Breaking changes", "breaking"], "Minor Changes": ["New", ""], "Patch Changes": ["Fixes and improvements", "fix"] };
  return releases.map((r, i) => {
    const kind = r.sections.some((s) => s.title === "Major Changes") ? "Major" : r.sections.some((s) => s.title === "Minor Changes") ? "Minor" : r.sections.length ? "Patch" : "";
    const body = r.sections.map((s) => {
      const [label, cls] = LABELS[s.title] ?? [s.title, ""];
      const lines = s.body.map((l) => l.replace(/^- [0-9a-f]{7}: /, "- "));
      return `<h3${cls ? ` class="${cls}"` : ""}>${esc(label)}</h3>${markdown(lines)}`;
    }).join("") || markdown(r.intro.split("\n"));
    const date = dates[r.version] ? `<time datetime="${dates[r.version]}">${fmt(dates[r.version])}</time>` : "";
    return `<article class="rel" id="v${r.version}">
  <div class="rel-meta">${i === 0 ? '<span class="badge">Latest</span>' : ""}<a class="rel-ver" href="#v${r.version}">v${esc(r.version)}</a>${date}${kind ? `<span class="kind">${kind}</span>` : ""}<a class="gh" href="${REPO_URL}/releases/tag/v${r.version}" target="_blank" rel="noopener">GitHub ↗</a></div>
  <div class="rel-line" aria-hidden="true"></div>
  <div class="rel-card">${previews(r.version)}${body}</div>
</article>`;
  }).join("\n");
}

// Written last: it uses the helpers above.
mkdirSync(`${OUT}/changelog`, { recursive: true });
writeFileSync(`${OUT}/changelog/index.html`, page("site/changelog.html", { root: "../", home: "../", current: ' aria-current="page"' }).replace("<!--changelog-->", await changelogHtml()));
console.log("Changelog page written");
