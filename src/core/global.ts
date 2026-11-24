/**
 * Script-tag build for plain HTML. Usage:
 *   <script src="https://cdn.jsdelivr.net/npm/placeholderkit/dist/placeholderkit.global.js"></script>
 *   <img data-placeholderkit="avatar" data-seed="ana@acme.com">
 *   <img data-placeholderkit="animal" data-seed="user-7" data-animal="fox">
 *   <img data-placeholderkit="placeholder" data-seed="dish-3" data-category="food" data-ratio="4/3">
 *   <img data-placeholderkit="logo" data-seed="acme" data-name="Acme">
 * Images fill in automatically, including ones added to the page later.
 */
import * as core from "./index";
import type { Animal, Category, Shape } from "./index";

function render(el: HTMLImageElement): void {
  const d = el.dataset;
  const seed = d.seed ?? el.alt ?? "placeholderkit";
  const shape = d.shape as Shape | undefined;
  let svg: string;
  let alt: string;
  switch (d.placeholderkit) {
    case "animal":
      svg = core.animalSvg({ seed, shape, animal: d.animal as Animal | undefined });
      alt = `${d.animal ?? "Animal"} avatar`;
      break;
    case "placeholder":
      svg = core.placeholderSvg({ seed, category: d.category as Category | undefined, ratio: d.ratio, label: d.label });
      alt = d.label ?? `${d.category ?? "Placeholder"} image`;
      break;
    case "logo":
      svg = core.logoSvg({ seed, name: d.name, variant: d.variant === "mark" ? "mark" : "full" });
      alt = `${d.name ?? core.fakeCompanyName(seed)} logo`;
      break;
    default:
      svg = core.personSvg({ seed, shape });
      alt = "Avatar";
  }
  const url = core.toDataUri(svg);
  if (el.getAttribute("src") !== url) el.src = url;
  if (!el.hasAttribute("alt")) el.alt = alt;
}

export function hydrate(root: ParentNode = document): void {
  root.querySelectorAll<HTMLImageElement>("img[data-placeholderkit]").forEach(render);
}

if (typeof document !== "undefined") {
  const start = () => {
    hydrate();
    new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === "attributes" && m.target instanceof HTMLImageElement) render(m.target);
        m.addedNodes.forEach((n) => {
          if (n instanceof HTMLImageElement && n.dataset.placeholderkit) render(n);
          else if (n instanceof Element) hydrate(n);
        });
      }
    }).observe(document.documentElement, {
      childList: true, subtree: true,
      attributeFilter: ["data-seed", "data-animal", "data-category", "data-ratio", "data-label", "data-name", "data-shape", "data-placeholderkit"],
    });
  };
  // Fill what exists now, watch for more (including the rest of the page while it parses),
  // and sweep once more when parsing finishes.
  start();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => hydrate());
}

export * from "./index";

// Expose a stable global for inline scripts: PlaceholderKit.avatarUrl({ seed: "ana" }), PlaceholderKit.hydrate(), etc.
if (typeof globalThis !== "undefined") {
  (globalThis as unknown as { PlaceholderKit: unknown }).PlaceholderKit = { ...core, hydrate };
}
