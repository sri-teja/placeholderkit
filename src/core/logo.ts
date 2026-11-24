import { createRng, escapeXml, svgDoc, type Rng } from "./util";

const PREFIX = ["Nova", "Lumen", "Arc", "Kite", "Orbit", "Pine", "Atlas", "Halo", "Ember", "Tidal", "Quill", "Vela", "Cobalt", "Juniper", "Bright", "North", "Stack", "Mosaic", "Ripple", "Sable"] as const;
const SUFFIX = ["", "ly", "labs", "works", "hq", "io", "ify", " Co", "base", "wave"] as const;
const COLORS = ["#3B5BDB", "#0CA678", "#E8590C", "#7048E8", "#D6336C", "#1098AD", "#F59F00", "#2B2F36", "#C2255C", "#5C940D"] as const;

/** A believable, seed-stable fake company name like "Orbitlabs" or "Pine Co". */
export function fakeCompanyName(seed: string): string {
  const r = createRng(seed, "name");
  const name = r.pick(PREFIX) + r.pick(SUFFIX);
  return name;
}

const MARKS: ((c: string, r: Rng) => string)[] = [
  (c) => `<circle cx="38" cy="50" r="22" fill="${c}"/><circle cx="62" cy="50" r="22" fill="${c}" opacity=".55"/>`,
  (c) => `<path d="M50 18L82 78H18Z" fill="${c}"/><path d="M50 44L64 70H36Z" fill="#fff" opacity=".9"/>`,
  (c) => `<path d="M50 14L81 32V68L50 86L19 68V32Z" fill="${c}"/><circle cx="50" cy="50" r="12" fill="#fff"/>`,
  (c) => `<rect x="20" y="20" width="16" height="60" rx="6" fill="${c}"/><rect x="42" y="34" width="16" height="46" rx="6" fill="${c}" opacity=".75"/><rect x="64" y="48" width="16" height="32" rx="6" fill="${c}" opacity=".5"/>`,
  (c) => `<circle cx="50" cy="50" r="32" fill="none" stroke="${c}" stroke-width="12"/><circle cx="50" cy="50" r="10" fill="${c}"/>`,
  (c) => `<rect x="24" y="24" width="52" height="52" rx="10" fill="${c}" transform="rotate(45 50 50)"/><rect x="38" y="38" width="24" height="24" rx="4" fill="#fff" transform="rotate(45 50 50)"/>`,
  (c) => `<path d="M18 82V50A32 32 0 0 1 50 18H82V50A32 32 0 0 1 50 82Z" fill="${c}"/>`,
  (c) => `<path d="M50 12L58 42L88 50L58 58L50 88L42 58L12 50L42 42Z" fill="${c}"/>`,
  (c, r) => {
    const letter = "ABCDEFGHJKMNPRSTVWXZ"[r.int(0, 19)];
    return `<rect x="14" y="14" width="72" height="72" rx="18" fill="${c}"/><text x="50" y="66" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="44" font-weight="800" fill="#fff">${letter}</text>`;
  },
];

export interface LogoOptions {
  seed: string;
  /** Company name shown in the wordmark. Generated from the seed if omitted. */
  name?: string;
  /** "full" = mark + name, "mark" = symbol only. */
  variant?: "full" | "mark";
  color?: string;
  title?: string;
}

export function logoSvg(opts: LogoOptions): string {
  const { seed, variant = "full" } = opts;
  const r = createRng(seed, "logo");
  const color = opts.color ?? r.pick(COLORS);
  const mark = r.pick(MARKS)(color, r);
  const name = opts.name ?? fakeCompanyName(seed);
  if (variant === "mark") return svgDoc(100, 100, mark, opts.title ?? `${name} logo`);

  const fs = 48;
  const textW = Math.round(name.length * fs * 0.6);
  const W = 100 + 20 + textW + 10;
  const body = `${mark}<text x="120" y="67" font-family="ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="${fs}" font-weight="700" letter-spacing="-1" fill="#1F2329">${escapeXml(name)}</text>`;
  return svgDoc(W, 100, body, opts.title ?? `${name} logo`);
}
