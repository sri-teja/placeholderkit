// Builds the website into _site/ for GitHub Pages.
// Run `npm run site` (builds the package first). Preview: `npx serve _site`.
import { mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { build } from "esbuild";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { animalSvg, personSvg, placeholderSvg, logoSvg, avatarUrl, placeholderUrl, logoUrl, fakeCompanyName } from "../dist/index.js";
import { createWorld } from "../dist/data.js";
import { storeHtml, recordJson } from "../site/mock-data-view.js";

const OUT = "_site";
const SITE_URL = (process.env.SITE_URL || "https://sri-teja.github.io/placeholderkit/").replace(/\/?$/, "/");
const { version } = JSON.parse(readFileSync("package.json", "utf8"));

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const REPO_URL = "https://github.com/sri-teja/placeholderkit";
/** Guide pages, one per developer search. Each is site/<slug>.html, served at /<slug>/ (built further down). */
const GUIDES = [
  { slug: "react-avatar-from-user-id", nav: "Avatars from a user ID", title: "Default avatars from a user ID or email, in React",
    blurb: "Give every user without a profile picture a stable, unique avatar.", og: { lines: ["Default avatars", "from a user ID or", "email, in React"], images: "avatars" } },
  { slug: "nextjs-placeholder-images", nav: "Placeholder images in Next.js", title: "Placeholder images in Next.js, without external URLs",
    blurb: "Product, food and hero images that render in Server Components with no image config.", og: { lines: ["Placeholder images", "in Next.js, without", "external URLs"], images: "photos" } },
  { slug: "fake-company-logo-generator", nav: "Fake company logos", title: "Fake company logos and names for mockups",
    blurb: "Believable logos and company names for customer lists and logo strips.", og: { lines: ["Fake company logos", "and names for", "mockups"], images: "logos" } },
  { slug: "mock-ecommerce-data", nav: "Mock ecommerce data", title: "Mock ecommerce data: customers, products and orders",
    blurb: "A whole store as JSON, CSV or SQL, where every number adds up.", og: { lines: ["Mock ecommerce", "data: customers,", "products, orders"], images: "store" },
    prerender: (html) => {
      const w = createWorld({ seed: "demo", industry: "ecommerce" });
      return html.replace("<!--store-->", storeHtml(w)).replace("<!--record-->", esc(recordJson(w.products[0])));
    } },
];
const GUIDE_LINKS = (root) => GUIDES.map((g) => `<li><a href="${root}${g.slug}/">${g.nav}</a></li>`).join("");

const partials = { header: readFileSync("site/partials/header.html", "utf8"), footer: readFileSync("site/partials/footer.html", "utf8") };
/** Fill shared header/footer and placeholders. `root` is the path back to the site root from the page. */
function page(file, { root, home, current = "" }, extra = {}) {
  let html = readFileSync(file, "utf8").replace(/<!--#include (\w+)-->/g, (_, name) => partials[name]);
  const vars = {
    VERSION: version, SITE_URL, ROOT: root, HOME: home, CHANGELOG_CURRENT: current, REPO_URL,
    GUIDE_LINKS: GUIDE_LINKS(root), REQUEST_URL: `${REPO_URL}/issues/new?template=request.yml`, LICENSE_URL: `${REPO_URL}/blob/main/LICENSE`, ...extra,
  };
  return html.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m))
    // Cache-busting: GitHub Pages lets browsers keep files for 10 minutes, so a new page could load an old stylesheet.
    .replace(/(?<="(?:\.\.?\/)?)(site\.css|common\.js|placeholderkit\.global\.js|data\.js|mock-data-view\.js)"/g, (_, f) => `${f}?v=${ASSET_HASH[f]}"`);
}
/** Short content hash per local asset, appended as ?v= to every reference to it. */
const ASSET_SOURCES = { "site.css": "site/site.css", "common.js": "site/common.js", "placeholderkit.global.js": "dist/placeholderkit.global.js", "data.js": "dist/data.js", "mock-data-view.js": "site/mock-data-view.js" };
const ASSET_HASH = Object.fromEntries(Object.entries(ASSET_SOURCES).map(([f, src]) => [f, createHash("sha256").update(readFileSync(src)).digest("hex").slice(0, 10)]));
writeFileSync(`${OUT}/index.html`, page("site/index.html", { root: "", home: "#top" }));
copyFileSync("site/site.css", `${OUT}/site.css`);
copyFileSync("site/common.js", `${OUT}/common.js`);
copyFileSync("site/mock-data-view.js", `${OUT}/mock-data-view.js`);
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

function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
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

/* ---------------- guide pages ---------------- */

// Each guide targets one developer search and is served at /<slug>/ from site/<slug>.html.
// Tokens drawn at build time so the HTML already shows the example (search engines and no-JS visitors see it):
//   {{AVATAR:seed}}  {{PH:seed|category|ratio}}  {{LOGO:seed|variant}}  {{COMPANY:seed}}  {{RELATED}}  {{JSONLD}}
const drawTokens = (html) => html
  .replace(/\{\{AVATAR:([^}]+)\}\}/g, (_, seed) => avatarUrl({ seed }))
  .replace(/\{\{PH:([^|}]+)\|([^|}]+)\|([^}]+)\}\}/g, (_, seed, category, ratio) => placeholderUrl({ seed, category, ratio }))
  .replace(/\{\{LOGO:([^|}]+)\|([^}]+)\}\}/g, (_, seed, variant) => logoUrl({ seed, variant }))
  .replace(/\{\{COMPANY:([^}]+)\}\}/g, (_, seed) => esc(fakeCompanyName(seed)));

function relatedHtml(slug) {
  const cards = GUIDES.filter((g) => g.slug !== slug).map((g) =>
    `<a class="ua-guide" href="../${g.slug}/"><b>${esc(g.title)}</b><span>${esc(g.blurb)}</span></a>`).join("");
  return `<section class="ua-section" aria-labelledby="h-more"><h2 id="h-more">More guides</h2><div class="ua-guides">${cards}</div></section>`;
}
function jsonLd(g) {
  const data = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "placeholderkit", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: g.title, item: `${SITE_URL}${g.slug}/` },
    ],
  };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

// Social preview per guide: the guide's title on the left, its kind of image on the right.
function guideOg(g) {
  const pics = [];
  for (let i = 0; i < 6; i++) {
    const x = 700 + (i % 2) * 230, y = 70 + Math.floor(i / 2) * 170;
    if (g.og.images === "avatars") pics.push(cell(personSvg({ seed: `og-${g.slug}-${i}` }), x + 40, y, 140, 140));
    else if (g.og.images === "logos") pics.push(`<rect x="${x}" y="${y + 20}" width="210" height="110" rx="18" fill="#FFFFFF" stroke="#E7E3DB"/>` + cell(logoSvg({ seed: `og-logo-${i}`, variant: "mark" }), x + 65, y + 35, 80, 80));
    else {
      const category = g.og.images === "store" ? ["product", "food", "product", "fashion", "product", "home"][i] : ["food", "travel", "product", "real-estate", "tech", "nature"][i];
      pics.push(`<clipPath id="og-g${i}"><rect x="${x}" y="${y}" width="210" height="150" rx="16"/></clipPath><g clip-path="url(#og-g${i})">${cell(placeholderSvg({ seed: `og-${g.slug}-${i}`, category, ratio: "7/5" }), x, y, 210, 150)}</g>`);
    }
  }
  const font = "'Helvetica Neue', Arial, 'DejaVu Sans', sans-serif";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#FBFAF7"/>
<text x="64" y="110" font-family="Menlo, 'DejaVu Sans Mono', monospace" font-size="24" fill="#646A76">placeholderkit · guide</text>
${g.og.lines.map((l, i) => `<text x="64" y="${200 + i * 72}" font-family="${font}" font-weight="700" font-size="60" fill="#15171C" letter-spacing="-2">${esc(l)}</text>`).join("\n")}
<rect x="64" y="470" width="400" height="56" rx="14" fill="#15171C"/>
<text x="88" y="506" font-family="Menlo, 'DejaVu Sans Mono', monospace" font-size="22" fill="#FBFAF7">npm i @placeholderkit/core</text>
${pics.join("\n")}
</svg>`;
  return new Resvg(svg, { font: { loadSystemFonts: true }, fitTo: { mode: "width", value: 1200 } }).render().asPng();
}

for (const g of GUIDES) {
  mkdirSync(`${OUT}/${g.slug}`, { recursive: true });
  let html = page(`site/${g.slug}.html`, { root: "../", home: "../" }, { RELATED: relatedHtml(g.slug), JSONLD: jsonLd(g) });
  html = drawTokens(g.prerender ? g.prerender(html) : html);
  writeFileSync(`${OUT}/${g.slug}/index.html`, html);
  writeFileSync(`${OUT}/${g.slug}/og.png`, guideOg(g));
}

// Sitemap for Search Console, with each page's last commit date. (robots.txt only counts at the host root,
// which a project site doesn't own.)
const lastmod = (files) => { try { return execSync(`git log -1 --format=%cs -- ${files.join(" ")}`, { encoding: "utf8" }).trim(); } catch { return ""; } };
const pages = [
  ["", ["site/index.html"]],
  ["changelog/", ["CHANGELOG.md", "site/changelog.html"]],
  ...GUIDES.map((g) => [`${g.slug}/`, [`site/${g.slug}.html`]]),
];
writeFileSync(`${OUT}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(([u, files]) => { const d = lastmod(files); return `  <url><loc>${SITE_URL}${u}</loc>${d ? `<lastmod>${d}</lastmod>` : ""}</url>`; }).join("\n")}
</urlset>
`);
console.log(`Guide pages and sitemap written (${GUIDES.length} guides)`);

// Written last: it uses the helpers above.
mkdirSync(`${OUT}/changelog`, { recursive: true });
writeFileSync(`${OUT}/changelog/index.html`, page("site/changelog.html", { root: "../", home: "../", current: ' aria-current="page"' }).replace("<!--changelog-->", await changelogHtml()));
console.log("Changelog page written");
