/** FNV-1a 32-bit hash: same string always gives the same number. */
export function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Small deterministic PRNG (mulberry32). */
export function createRng(seed: string, salt = "") {
  let a = hash(`${salt}:${seed}`) || 1;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
    weighted: <T>(items: readonly (readonly [T, number])[]): T => {
      const total = items.reduce((s, [, w]) => s + w, 0);
      let r = next() * total;
      for (const [item, w] of items) {
        if ((r -= w) <= 0) return item;
      }
      return items[items.length - 1][0];
    },
  };
}
export type Rng = ReturnType<typeof createRng>;

export const BACKGROUNDS = [
  "#FDE2D0", "#FCEFC7", "#DDF1D8", "#D3ECEC", "#D8E4F8",
  "#E6DDF7", "#F7DCE7", "#EFE6DA", "#E3EBD3", "#D9E8F1",
] as const;

export type Shape = "circle" | "rounded" | "square";

export function bgRect(size: number, fill: string, shape: Shape): string {
  if (fill === "transparent") return "";
  const rx = shape === "circle" ? size / 2 : shape === "rounded" ? size * 0.18 : 0;
  return `<rect width="${size}" height="${size}" rx="${rx}" fill="${fill}"/>`;
}

export function clipFor(id: string, size: number, shape: Shape): string {
  const rx = shape === "circle" ? size / 2 : shape === "rounded" ? size * 0.18 : 0;
  return `<clipPath id="${id}"><rect width="${size}" height="${size}" rx="${rx}"/></clipPath>`;
}

export function escapeXml(text: string): string {
  return text.replace(/[<>&"']/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!,
  );
}

/** Turn an SVG string into a URL usable in <img src>, CSS, or anywhere a URL works. */
export function toDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Unique-ish id so several inline SVGs on one page don't share clip ids. */
export function uid(seed: string, kind: string): string {
  return `sp-${kind}-${hash(seed).toString(36)}`;
}

export function svgDoc(width: number, height: number, body: string, title?: string): string {
  const t = title ? `<title>${escapeXml(title)}</title>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">${t}${body}</svg>`;
}
