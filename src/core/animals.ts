import { BACKGROUNDS, Shape, bgRect, clipFor, createRng, svgDoc, uid } from "./util";

export const ANIMALS = [
  "fox", "cat", "bear", "panda", "rabbit", "dog", "owl", "frog", "penguin", "koala",
] as const;
export type Animal = (typeof ANIMALS)[number];

export const EXPRESSIONS = ["happy", "joy", "wink", "sleepy", "surprised", "smirk"] as const;
export type Expression = (typeof EXPRESSIONS)[number];

export const ACCESSORIES = ["none", "glasses", "party-hat", "bow", "headphones", "crown", "beanie"] as const;
export type Accessory = (typeof ACCESSORIES)[number];

interface Species {
  /** Drawn behind the head (ears, tufts). */
  back: (c: Colors) => string;
  /** Head fill. */
  head: string;
  /** Drawn on top of the head, under the eyes (masks, muzzles). */
  face: (c: Colors) => string;
  /** Nose + base mouth anchor. */
  nose: (c: Colors) => string;
  /** Owls, frogs and penguins draw their own eye whites. */
  eyeWhites?: boolean;
  eyeY: number;
  eyeDx: number;
  mouthY: number;
  /** Where hats and bows sit. */
  topY: number;
  dark: string;
}
type Colors = { head: string };

const S: Record<Animal, Species> = {
  fox: {
    head: "#E8823A", dark: "#2B1A12", eyeY: 54, eyeDx: 10, mouthY: 67, topY: 30,
    back: () =>
      `<path d="M24 46L26 14L46 33Z" fill="#E8823A"/><path d="M76 46L74 14L54 33Z" fill="#E8823A"/>
       <path d="M28 38L29 21L40 32Z" fill="#3A2418"/><path d="M72 38L71 21L60 32Z" fill="#3A2418"/>`,
    face: () => `<path d="M24 58C30 64 40 66 50 64C60 66 70 64 76 58C72 76 62 84 50 84S28 76 24 58Z" fill="#FFF4E6"/>`,
    nose: () => `<ellipse cx="50" cy="63" rx="3.6" ry="2.6" fill="#2B1A12"/>`,
  },
  cat: {
    head: "#9AA3AE", dark: "#262A30", eyeY: 54, eyeDx: 10, mouthY: 66, topY: 31,
    back: () =>
      `<path d="M25 44L28 18L45 34Z" fill="#9AA3AE"/><path d="M75 44L72 18L55 34Z" fill="#9AA3AE"/>
       <path d="M29 38L31 25L39 33Z" fill="#F2B8C1"/><path d="M71 38L69 25L61 33Z" fill="#F2B8C1"/>`,
    face: () =>
      `<path d="M41 30L44 38M50 29V38M59 30L56 38" stroke="#7D8590" stroke-width="2.4" stroke-linecap="round"/>
       <ellipse cx="50" cy="66" rx="12" ry="8" fill="#E9ECEF"/>`,
    nose: () =>
      `<path d="M47 61H53L50 64.5Z" fill="#E58A9A"/>
       <path d="M30 63H40M30 68L40 66.5M70 63H60M70 68L60 66.5" stroke="#5B636D" stroke-width="1" stroke-linecap="round"/>`,
  },
  bear: {
    head: "#9B6A43", dark: "#24170F", eyeY: 53, eyeDx: 10, mouthY: 68, topY: 30,
    back: () =>
      `<circle cx="29" cy="33" r="10" fill="#9B6A43"/><circle cx="71" cy="33" r="10" fill="#9B6A43"/>
       <circle cx="29" cy="33" r="5.5" fill="#C99B72"/><circle cx="71" cy="33" r="5.5" fill="#C99B72"/>`,
    face: () => `<ellipse cx="50" cy="65" rx="12.5" ry="9.5" fill="#D9B48E"/>`,
    nose: () => `<ellipse cx="50" cy="61" rx="4.2" ry="3" fill="#24170F"/>`,
  },
  panda: {
    head: "#F7F7F5", dark: "#1C1C1C", eyeY: 54, eyeDx: 10.5, mouthY: 67, topY: 30,
    back: () => `<circle cx="29" cy="33" r="10" fill="#1F1F1F"/><circle cx="71" cy="33" r="10" fill="#1F1F1F"/>`,
    face: () =>
      `<ellipse cx="39.5" cy="54" rx="7" ry="8.5" fill="#1F1F1F" transform="rotate(25 39.5 54)"/>
       <ellipse cx="60.5" cy="54" rx="7" ry="8.5" fill="#1F1F1F" transform="rotate(-25 60.5 54)"/>`,
    nose: () => `<ellipse cx="50" cy="62" rx="3.6" ry="2.6" fill="#1F1F1F"/>`,
  },
  rabbit: {
    head: "#ECE6E1", dark: "#2A2522", eyeY: 55, eyeDx: 10, mouthY: 67, topY: 32,
    back: () =>
      `<ellipse cx="39" cy="22" rx="7" ry="20" fill="#ECE6E1" transform="rotate(-8 39 22)"/>
       <ellipse cx="61" cy="22" rx="7" ry="20" fill="#ECE6E1" transform="rotate(8 61 22)"/>
       <ellipse cx="39" cy="23" rx="3.2" ry="14" fill="#F2B8C1" transform="rotate(-8 39 23)"/>
       <ellipse cx="61" cy="23" rx="3.2" ry="14" fill="#F2B8C1" transform="rotate(8 61 23)"/>`,
    face: () => `<ellipse cx="50" cy="66" rx="10" ry="7" fill="#FFFFFF"/>`,
    nose: () => `<path d="M47.5 62H52.5L50 65Z" fill="#E58A9A"/>`,
  },
  dog: {
    head: "#D8A26A", dark: "#2B1C10", eyeY: 52, eyeDx: 10, mouthY: 68, topY: 30,
    back: () => "",
    face: () =>
      `<ellipse cx="25" cy="50" rx="7.5" ry="16" fill="#8C5A33" transform="rotate(18 25 50)"/>
       <ellipse cx="75" cy="50" rx="7.5" ry="16" fill="#8C5A33" transform="rotate(-18 75 50)"/>
       <ellipse cx="59" cy="49" rx="7" ry="6" fill="#B9844F"/>
       <ellipse cx="50" cy="66" rx="13" ry="9.5" fill="#F3DFC6"/>`,
    nose: () => `<ellipse cx="50" cy="61" rx="4.6" ry="3.2" fill="#2B1C10"/>`,
  },
  owl: {
    head: "#8E6B4E", dark: "#22170F", eyeY: 52, eyeDx: 11, mouthY: 67, topY: 30, eyeWhites: true,
    back: () => `<path d="M27 40L24 20L40 31Z" fill="#6E5139"/><path d="M73 40L76 20L60 31Z" fill="#6E5139"/>`,
    face: () =>
      `<circle cx="39" cy="52" r="10.5" fill="#F5E6CF"/><circle cx="61" cy="52" r="10.5" fill="#F5E6CF"/>
       <path d="M38 72Q44 76 50 72Q56 76 62 72" stroke="#6E5139" stroke-width="1.6" fill="none"/>`,
    nose: () => `<path d="M46.5 59H53.5L50 66Z" fill="#F0A73A"/>`,
  },
  frog: {
    head: "#6DBA5E", dark: "#1D2A17", eyeY: 39, eyeDx: 14, mouthY: 66, topY: 22, eyeWhites: true,
    back: () =>
      `<circle cx="36" cy="38" r="11" fill="#6DBA5E"/><circle cx="64" cy="38" r="11" fill="#6DBA5E"/>
       <circle cx="36" cy="39" r="7.5" fill="#FFFFFF"/><circle cx="64" cy="39" r="7.5" fill="#FFFFFF"/>`,
    face: () => `<circle cx="34" cy="62" r="3.5" fill="#F08A8A" opacity=".35"/><circle cx="66" cy="62" r="3.5" fill="#F08A8A" opacity=".35"/>`,
    nose: () => `<circle cx="47" cy="57" r=".9" fill="#1D2A17"/><circle cx="53" cy="57" r=".9" fill="#1D2A17"/>`,
  },
  penguin: {
    head: "#2B2F36", dark: "#14161A", eyeY: 54, eyeDx: 9, mouthY: 70, topY: 30, eyeWhites: true,
    back: () => "",
    face: () => `<path d="M50 44C44 36 30 38 28 52C27 68 38 80 50 80S73 68 72 52C70 38 56 36 50 44Z" fill="#FAFAF7"/>`,
    nose: () => `<path d="M45 61H55L50 67Z" fill="#F0A73A"/>`,
  },
  koala: {
    head: "#A3A8AE", dark: "#22252A", eyeY: 52, eyeDx: 11, mouthY: 70, topY: 31,
    back: () =>
      `<circle cx="24" cy="38" r="13" fill="#A3A8AE"/><circle cx="76" cy="38" r="13" fill="#A3A8AE"/>
       <circle cx="25" cy="39" r="7.5" fill="#E6E2DC"/><circle cx="75" cy="39" r="7.5" fill="#E6E2DC"/>`,
    face: () => "",
    nose: () => `<ellipse cx="50" cy="61" rx="6" ry="8" fill="#3A3E45"/>`,
  },
};

function eyes(sp: Species, expr: Expression): string {
  const { eyeY: y, eyeDx: dx, dark } = sp;
  const L = 50 - dx, R = 50 + dx;
  const white = sp.eyeWhites ? `<circle cx="${L}" cy="${y}" r="6" fill="#fff"/><circle cx="${R}" cy="${y}" r="6" fill="#fff"/>` : "";
  const dot = (x: number, r = 3) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${dark}"/><circle cx="${x + 1}" cy="${y - 1.2}" r="${r * 0.33}" fill="#fff"/>`;
  const arc = (x: number) => `<path d="M${x - 3.5} ${y + 1}Q${x} ${y - 3.5} ${x + 3.5} ${y + 1}" stroke="${dark}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  const lid = (x: number) => `<path d="M${x - 3.5} ${y}Q${x} ${y + 3} ${x + 3.5} ${y}" stroke="${dark}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  switch (expr) {
    case "joy": return white + arc(L) + arc(R);
    case "wink": return white + dot(L) + arc(R);
    case "sleepy": return white + lid(L) + lid(R);
    case "surprised": return white + dot(L, 3.8) + dot(R, 3.8);
    default: return white + dot(L) + dot(R);
  }
}

function mouth(sp: Species, expr: Expression): string {
  const y = sp.mouthY, c = sp.dark;
  switch (expr) {
    case "joy": return `<path d="M44 ${y - 1}Q50 ${y + 7} 56 ${y - 1}Z" fill="#8A3A33"/><path d="M47 ${y + 2.5}Q50 ${y + 5.5} 53 ${y + 2.5}" fill="#F08A8A"/>`;
    case "surprised": return `<ellipse cx="50" cy="${y + 1}" rx="2.6" ry="3.2" fill="#8A3A33"/>`;
    case "smirk": return `<path d="M45 ${y}Q51 ${y + 3} 56 ${y - 2}" stroke="${c}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
    case "sleepy": return `<path d="M47 ${y + 1}H53" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`;
    default: return `<path d="M44.5 ${y - 1}Q47.5 ${y + 2.5} 50 ${y - 1}Q52.5 ${y + 2.5} 55.5 ${y - 1}" stroke="${c}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  }
}

function accessory(sp: Species, acc: Accessory, hue: string): string {
  const t = sp.topY, y = sp.eyeY, dx = sp.eyeDx;
  switch (acc) {
    case "glasses":
      return `<g stroke="#1E1E24" stroke-width="2" fill="#ffffff22"><circle cx="${50 - dx}" cy="${y}" r="7"/><circle cx="${50 + dx}" cy="${y}" r="7"/></g><path d="M${50 - dx + 7} ${y}H${50 + dx - 7}" stroke="#1E1E24" stroke-width="2"/>`;
    case "party-hat":
      return `<path d="M41 ${t + 2}L50 ${t - 20}L59 ${t + 2}Z" fill="${hue}"/><path d="M44.5 ${t - 6}L55.5 ${t - 6}" stroke="#fff" stroke-width="2" opacity=".7"/><circle cx="50" cy="${t - 21}" r="3" fill="#FFD447"/>`;
    case "bow":
      return `<g transform="translate(${50 + 13} ${t + 1})"><path d="M0 0L-9 -6V6ZM0 0L9 -6V6Z" fill="${hue}"/><circle r="2.8" fill="${hue}"/></g>`;
    case "headphones":
      return `<path d="M24 ${y + 2}C24 ${t - 12} 76 ${t - 12} 76 ${y + 2}" stroke="#2F3340" stroke-width="4" fill="none"/><rect x="19" y="${y - 4}" width="9" height="15" rx="4" fill="${hue}"/><rect x="72" y="${y - 4}" width="9" height="15" rx="4" fill="${hue}"/>`;
    case "crown":
      return `<path d="M39 ${t + 1}L39 ${t - 11}L44.5 ${t - 5}L50 ${t - 14}L55.5 ${t - 5}L61 ${t - 11}L61 ${t + 1}Z" fill="#F5C443" stroke="#C9971D" stroke-width="1"/>`;
    case "beanie":
      return `<path d="M29 ${t + 8}C29 ${t - 16} 71 ${t - 16} 71 ${t + 8}Z" fill="${hue}"/><rect x="27" y="${t + 3}" width="46" height="8" rx="4" fill="${hue}"/><rect x="27" y="${t + 3}" width="46" height="8" rx="4" fill="#000" opacity=".12"/><circle cx="50" cy="${t - 11}" r="4.5" fill="#fff" opacity=".9"/>`;
    default:
      return "";
  }
}

const ACCENTS = ["#E2546A", "#3D7DD8", "#2FA58C", "#8C5BD6", "#F08A3C", "#D6457F"] as const;

export interface AnimalOptions {
  seed: string;
  /** Fix the species to get the same character in different variations. Random by seed if omitted. */
  animal?: Animal;
  expression?: Expression;
  accessory?: Accessory;
  shape?: Shape;
  background?: string;
  title?: string;
}

export function animalSvg(opts: AnimalOptions): string {
  const { seed, shape = "circle" } = opts;
  const r = createRng(seed, "animal");
  const kind = opts.animal ?? r.pick(ANIMALS);
  const sp = S[kind];
  const expr = opts.expression ?? r.pick(EXPRESSIONS);
  const acc = opts.accessory ?? r.weighted(ACCESSORIES.map((a) => [a, a === "none" ? 3 : 1] as const));
  const hue = r.pick(ACCENTS);
  const bg = opts.background ?? r.pick(BACKGROUNDS);
  const id = uid(seed + kind, "a");
  const c = { head: sp.head };
  const blush = sp.eyeWhites ? "" : `<circle cx="${50 - sp.eyeDx - 4}" cy="${sp.eyeY + 8}" r="3.4" fill="#F08A8A" opacity=".35"/><circle cx="${50 + sp.eyeDx + 4}" cy="${sp.eyeY + 8}" r="3.4" fill="#F08A8A" opacity=".35"/>`;

  const body = `
<defs>${clipFor(id, 100, shape)}</defs>
<g clip-path="url(#${id})">
${bgRect(100, bg, shape)}
<ellipse cx="50" cy="104" rx="30" ry="18" fill="${sp.head}"/>
${sp.back(c)}
<circle cx="50" cy="57" r="27" fill="${sp.head}"/>
${sp.face(c)}
${blush}
${eyes(sp, expr)}
${sp.nose(c)}
${kind === "frog" ? `<path d="M38 64Q50 ${expr === "joy" ? 76 : 71} 62 64" stroke="${sp.dark}" stroke-width="2" fill="none" stroke-linecap="round"/>` : mouth(sp, expr)}
${accessory(sp, acc, hue)}
</g>`;
  return svgDoc(100, 100, body, opts.title ?? `${kind} avatar`);
}
