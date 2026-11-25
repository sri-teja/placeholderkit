import { BACKGROUNDS, Shape, bgRect, clipFor, createRng, svgDoc, uid } from "./util";

export const ANIMALS = [
  "fox", "cat", "bear", "panda", "rabbit", "dog", "owl", "penguin", "koala",
] as const;
export type Animal = (typeof ANIMALS)[number];

export const EXPRESSIONS = ["happy", "joy", "wink", "sleepy", "surprised", "smirk"] as const;
export type Expression = (typeof EXPRESSIONS)[number];

export const ACCESSORIES = ["none", "glasses", "party-hat", "bow", "headphones", "crown", "beanie"] as const;
export type Accessory = (typeof ACCESSORIES)[number];

/*
 * Layout: a big round head (center 50,58, radius 30) on small shoulders, with large
 * glossy eyes set slightly below the middle of the face, a small mouth and rosy cheeks:
 * a soft, friendly character style.
 */
const HEAD_Y = 58;
const HEAD_R = 30;

interface Species {
  head: string;
  /** Eye, nose and line color: a deep warm tone rather than pure black. */
  dark: string;
  /** Drawn behind the head (ears, tufts). */
  back: () => string;
  /** Drawn on the head, under the eyes (muzzles, masks, patches). */
  face: () => string;
  nose: () => string;
  /** Eyes sit on dark patches (panda): closed-eye lines are drawn light. */
  eyesOnDark?: boolean;
  /** Beaked species draw no mouth. */
  noMouth?: boolean;
  /** Shoulder color, if different from the head. */
  shoulders?: string;
  /** Belly patch color. */
  tummy?: string;
  eyeY: number;
  eyeDx: number;
  mouthY: number;
  /** Top of the head, where hats and bows sit. */
  topY: number;
}

const mirror = (d: string) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${+(100 - +x).toFixed(2)} ${y}`);
const pair = (d: string, fill: string) => `<path d="${d}" fill="${fill}"/><path d="${mirror(d)}" fill="${fill}"/>`;

const S: Record<Animal, Species> = {
  fox: {
    head: "#F28A45", dark: "#3B2A22", eyeY: 59, eyeDx: 12, mouthY: 72, topY: 29,
    back: () => pair("M21 48 L23.5 17 Q24.5 11 30 14 L47 31 Z", "#F28A45") + pair("M28.5 37.5 L29.6 24 Q30.2 21.8 32.2 23.4 L38.6 30.2 Z", "#B9562B"),
    face: () => `<path d="M20 60 C27 69 39 71 50 67 C61 71 73 69 80 60 C79 78 66 88 50 88 S21 78 20 60 Z" fill="#FFF6EC"/>`,
    nose: () => `<ellipse cx="50" cy="67" rx="3.6" ry="2.5" fill="#3B2A22"/><ellipse cx="49" cy="66.2" rx="1.1" ry=".6" fill="#fff" opacity=".7"/>`,
  },
  cat: {
    head: "#AEB7C6", dark: "#2E3138", eyeY: 59, eyeDx: 12, mouthY: 71.5, topY: 30,
    back: () => pair("M21 49 L23.5 19 Q24.5 14 29.5 17 L45 31 Z", "#AEB7C6") + pair("M26.5 41 L27.8 23.5 Q28.5 21 31 22.5 L39.5 31 Z", "#F7C1CB"),
    face: () =>
      `<path d="M44 33.5 L45.6 39.5 M50 31.5 V38.5 M56 33.5 L54.4 39.5" stroke="#8F99A8" stroke-width="2.4" stroke-linecap="round"/>
       <ellipse cx="50" cy="70" rx="11.5" ry="7.8" fill="#F4F5F8"/>`,
    nose: () =>
      `<path d="M47 66 Q50 64.6 53 66 Q51.6 68.6 50 68.8 Q48.4 68.6 47 66 Z" fill="#F28FA0"/>
       <path d="M25 67.5 H36 M25.5 72.5 L36 70.5 M75 67.5 H64 M74.5 72.5 L64 70.5" stroke="#6E7684" stroke-width="1" stroke-linecap="round" opacity=".55"/>`,
  },
  bear: {
    head: "#BC8558", dark: "#3A271B", eyeY: 59, eyeDx: 12.5, mouthY: 73, topY: 29,
    back: () =>
      `<circle cx="27" cy="35" r="10.5" fill="#BC8558"/><circle cx="73" cy="35" r="10.5" fill="#BC8558"/>
       <circle cx="27.5" cy="35.5" r="5.8" fill="#E8BE96"/><circle cx="72.5" cy="35.5" r="5.8" fill="#E8BE96"/>`,
    face: () => `<ellipse cx="50" cy="71" rx="12.5" ry="9.5" fill="#F0D7BA"/>`,
    nose: () => `<ellipse cx="50" cy="66.8" rx="4.4" ry="3.1" fill="#3A271B"/><ellipse cx="48.8" cy="65.8" rx="1.4" ry=".7" fill="#fff" opacity=".65"/>`,
  },
  panda: {
    head: "#FBFBF8", dark: "#2B2B2E", eyeY: 59, eyeDx: 12.5, mouthY: 72, topY: 29, eyesOnDark: true, shoulders: "#2B2B2E",
    back: () => `<circle cx="27" cy="35" r="10.5" fill="#2B2B2E"/><circle cx="73" cy="35" r="10.5" fill="#2B2B2E"/>`,
    face: () =>
      `<ellipse cx="37.5" cy="59.5" rx="7.6" ry="9.2" fill="#2B2B2E" transform="rotate(28 37.5 59.5)"/>
       <ellipse cx="62.5" cy="59.5" rx="7.6" ry="9.2" fill="#2B2B2E" transform="rotate(-28 62.5 59.5)"/>`,
    nose: () => `<ellipse cx="50" cy="67.5" rx="3.6" ry="2.5" fill="#2B2B2E"/>`,
  },
  rabbit: {
    head: "#F6F0EB", dark: "#3A3030", eyeY: 59, eyeDx: 11.5, mouthY: 72.5, topY: 31,
    back: () =>
      `<ellipse cx="39" cy="24" rx="7.5" ry="17" fill="#F6F0EB" transform="rotate(-10 39 24)"/>
       <ellipse cx="61" cy="24" rx="7.5" ry="17" fill="#F6F0EB" transform="rotate(10 61 24)"/>
       <ellipse cx="39" cy="25" rx="3.6" ry="11.5" fill="#F9C6CF" transform="rotate(-10 39 25)"/>
       <ellipse cx="61" cy="25" rx="3.6" ry="11.5" fill="#F9C6CF" transform="rotate(10 61 25)"/>`,
    face: () => `<circle cx="46" cy="70.5" r="5" fill="#fff"/><circle cx="54" cy="70.5" r="5" fill="#fff"/>`,
    nose: () => `<path d="M47.6 66.2 Q50 65 52.4 66.2 Q51.2 68.4 50 68.5 Q48.8 68.4 47.6 66.2 Z" fill="#F28FA0"/>`,
  },
  dog: {
    head: "#E8B67F", dark: "#33241A", eyeY: 59, eyeDx: 12, mouthY: 74, topY: 29,
    back: () => "",
    face: () =>
      `<ellipse cx="62.5" cy="57.5" rx="7.8" ry="6.8" fill="#D49A5E"/>
       <ellipse cx="22.5" cy="56" rx="8.5" ry="17" fill="#9A6440" transform="rotate(20 22.5 56)"/>
       <ellipse cx="77.5" cy="56" rx="8.5" ry="17" fill="#9A6440" transform="rotate(-20 77.5 56)"/>
       <ellipse cx="50" cy="71.5" rx="13" ry="9.5" fill="#FBEBD7"/>`,
    nose: () => `<ellipse cx="50" cy="66.6" rx="4.9" ry="3.3" fill="#33241A"/><ellipse cx="48.7" cy="65.6" rx="1.5" ry=".75" fill="#fff" opacity=".65"/>`,
  },
  owl: {
    head: "#A8825F", dark: "#2E2219", eyeY: 58.5, eyeDx: 12, mouthY: 72, topY: 30, noMouth: true, tummy: "#EAD5B8",
    back: () => pair("M24 41 L19.5 26 Q19.5 23 22.5 24 L37 33 Z", "#7E5E43"),
    face: () =>
      `<circle cx="38" cy="58.5" r="11.5" fill="#F8ECDA"/><circle cx="62" cy="58.5" r="11.5" fill="#F8ECDA"/>
       <path d="M30 45 Q38 41 46 46 M70 45 Q62 41 54 46" stroke="#7E5E43" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
    nose: () => `<path d="M46.3 65.5 Q50 63.8 53.7 65.5 L50 72 Z" fill="#F4A940"/>`,
  },
  penguin: {
    head: "#3D4659", dark: "#252A36", eyeY: 60, eyeDx: 11.5, mouthY: 72, topY: 29, noMouth: true, tummy: "#FBFBF8",
    back: () => "",
    face: () => `<path d="M50 46 C44 36 27 38 25 55 C24 73 36 86 50 86 S76 73 75 55 C73 38 56 36 50 46 Z" fill="#FBFBF8"/>`,
    nose: () => `<path d="M45.5 67 Q50 65 54.5 67 Q52 71.5 50 71.5 Q48 71.5 45.5 67 Z" fill="#F4A940"/>`,
  },
  koala: {
    head: "#AEB5BD", dark: "#2C3036", eyeY: 57.5, eyeDx: 13, mouthY: 76.5, topY: 30,
    back: () =>
      `<circle cx="22" cy="40" r="14" fill="#AEB5BD"/><circle cx="78" cy="40" r="14" fill="#AEB5BD"/>
       <circle cx="23" cy="41" r="8.5" fill="#F1EDE8"/><circle cx="77" cy="41" r="8.5" fill="#F1EDE8"/>`,
    face: () => "",
    nose: () => `<ellipse cx="50" cy="66" rx="6.2" ry="7.8" fill="#464B53"/><ellipse cx="48" cy="62.5" rx="1.8" ry="1.1" fill="#fff" opacity=".45"/>`,
  },
};

/** A big glossy eye: dark oval with a large and a small highlight. */
function glossy(x: number, y: number, dark: string, s = 1): string {
  return `<ellipse cx="${x}" cy="${y}" rx="${3.7 * s}" ry="${4.3 * s}" fill="${dark}"/>` +
    `<circle cx="${x + 1.4 * s}" cy="${y - 1.7 * s}" r="${1.55 * s}" fill="#fff"/>` +
    `<circle cx="${x - 1.3 * s}" cy="${y + 1.6 * s}" r="${0.75 * s}" fill="#fff" opacity=".85"/>`;
}

function eyes(sp: Species, expr: Expression): string {
  const { eyeY: y, eyeDx: dx, dark } = sp;
  const L = 50 - dx, R = 50 + dx;
  const lineColor = sp.eyesOnDark ? "#fff" : dark;
  const open = (x: number, k = 1) => glossy(x, y, sp.eyesOnDark ? "#121214" : dark, k);
  const arc = (x: number) => `<path d="M${x - 4} ${y + 1.5}Q${x} ${y - 3.5} ${x + 4} ${y + 1.5}" stroke="${lineColor}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  const lid = (x: number) => `<path d="M${x - 4} ${y}Q${x} ${y + 3.4} ${x + 4} ${y}" stroke="${lineColor}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  switch (expr) {
    case "joy": return arc(L) + arc(R);
    case "wink": return open(L) + arc(R);
    case "sleepy": return lid(L) + lid(R);
    case "surprised": return open(L, 1.12) + open(R, 1.12);
    default: return open(L) + open(R);
  }
}

function mouth(sp: Species, expr: Expression): string {
  if (sp.noMouth) return "";
  const y = sp.mouthY, c = sp.dark;
  const w = `<path d="M45.8 ${y}Q48 ${y + 2.8} 50 ${y}Q52 ${y + 2.8} 54.2 ${y}" stroke="${c}" stroke-width="1.7" fill="none" stroke-linecap="round"/>`;
  switch (expr) {
    case "joy":
      return `<path d="M44.5 ${y - 0.5}Q50 ${y + 8.5} 55.5 ${y - 0.5}Z" fill="#7A3432"/><ellipse cx="50" cy="${y + 3.6}" rx="3.2" ry="1.9" fill="#F58E9B"/>`;
    case "surprised":
      return `<ellipse cx="50" cy="${y + 1.2}" rx="2.3" ry="2.9" fill="#7A3432"/>`;
    case "smirk":
      // Cheeky: a "w" smile with the tip of a tongue poking out.
      return `<path d="M51 ${y + 0.8}Q53.4 ${y + 5.6} 55.2 ${y + 1.2}Z" fill="#F58E9B"/>` + w;
    case "sleepy":
      // Little sleep bubble.
      return `<path d="M47.6 ${y + 0.6}Q50 ${y + 2} 52.4 ${y + 0.6}" stroke="${c}" stroke-width="1.6" fill="none" stroke-linecap="round"/>` +
        `<circle cx="${50 + sp.eyeDx * 0.75}" cy="${y - 4.5}" r="3.4" fill="#DDF1FF" stroke="#A9D2EE" stroke-width=".8" opacity=".95"/>`;
    default:
      return w;
  }
}

function accessory(sp: Species, acc: Accessory, hue: string): string {
  const t = sp.topY, y = sp.eyeY, dx = sp.eyeDx;
  switch (acc) {
    case "glasses":
      return `<g stroke="#2C2C34" stroke-width="2" fill="#ffffff26"><circle cx="${50 - dx}" cy="${y}" r="7.6"/><circle cx="${50 + dx}" cy="${y}" r="7.6"/></g>` +
        `<path d="M${50 - dx + 7.6} ${y - 1}Q50 ${y - 3.5} ${50 + dx - 7.6} ${y - 1}" stroke="#2C2C34" stroke-width="2" fill="none"/>`;
    case "party-hat":
      return `<g transform="rotate(-14 50 ${t})"><path d="M40.5 ${t + 3}L50 ${t - 19}L59.5 ${t + 3}Z" fill="${hue}"/>` +
        `<path d="M44 ${t - 5}H56M46.5 ${t - 11}H53.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".75"/>` +
        `<circle cx="50" cy="${t - 20}" r="3.4" fill="#FFD447"/></g>`;
    case "bow":
      return `<g transform="translate(66 ${t + 4}) rotate(18)"><path d="M0 0C-4 -7 -11 -7 -11 0S-4 7 0 0ZM0 0C4 -7 11 -7 11 0S4 7 0 0Z" fill="${hue}"/>` +
        `<circle r="3" fill="${hue}"/><circle r="3" fill="#000" opacity=".12"/></g>`;
    case "headphones":
      return `<path d="M${50 - HEAD_R} ${y}C${50 - HEAD_R} ${t - 16} ${50 + HEAD_R} ${t - 16} ${50 + HEAD_R} ${y}" stroke="#3A3F4F" stroke-width="4.5" fill="none" stroke-linecap="round"/>` +
        `<rect x="${50 - HEAD_R - 6}" y="${y - 7}" width="11" height="17" rx="5.5" fill="${hue}"/><rect x="${50 + HEAD_R - 5}" y="${y - 7}" width="11" height="17" rx="5.5" fill="${hue}"/>`;
    case "crown":
      return `<path d="M39 ${t + 2}L38 ${t - 10}L44.5 ${t - 4}L50 ${t - 13}L55.5 ${t - 4}L62 ${t - 10}L61 ${t + 2}Z" fill="#F7C948" stroke="#D9A21F" stroke-width="1.2" stroke-linejoin="round"/>` +
        `<circle cx="50" cy="${t - 3}" r="1.8" fill="#E2546A"/>`;
    case "beanie":
      return `<path d="M${50 - HEAD_R + 1} ${t + 13}C${50 - HEAD_R + 1} ${t - 19} ${50 + HEAD_R - 1} ${t - 19} ${50 + HEAD_R - 1} ${t + 13}Z" fill="${hue}"/>` +
        `<rect x="${50 - HEAD_R - 1}" y="${t + 7}" width="${HEAD_R * 2 + 2}" height="9" rx="4.5" fill="${hue}"/>` +
        `<rect x="${50 - HEAD_R - 1}" y="${t + 7}" width="${HEAD_R * 2 + 2}" height="9" rx="4.5" fill="#000" opacity=".12"/>` +
        `<circle cx="50" cy="${t - 14}" r="5" fill="#fff" opacity=".92"/>`;
    default:
      return "";
  }
}

const ACCENTS = ["#F2668B", "#4C8DF0", "#2FB59A", "#9A6BEA", "#F79A4A", "#E0559A"] as const;

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
  const expr = opts.expression ?? r.weighted(EXPRESSIONS.map((e) => [e, e === "happy" ? 3 : e === "joy" ? 2 : 1] as const));
  const acc = opts.accessory ?? r.weighted(ACCESSORIES.map((a) => [a, a === "none" ? 3 : 1] as const));
  const hue = r.pick(ACCENTS);
  const bg = opts.background ?? r.pick(BACKGROUNDS);
  const id = uid(seed + kind, "a");
  const bx = sp.eyeDx + 6.5, by = sp.eyeY + 7.5;
  const blush = `<ellipse cx="${50 - bx}" cy="${by}" rx="4.6" ry="2.8" fill="#FF8FA3" opacity=".5"/><ellipse cx="${50 + bx}" cy="${by}" rx="4.6" ry="2.8" fill="#FF8FA3" opacity=".5"/>`;

  const body = `
<defs>${clipFor(id, 100, shape)}<radialGradient id="${id}-g" cx=".36" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
<g clip-path="url(#${id})">
${bgRect(100, bg, shape)}
<ellipse cx="50" cy="107" rx="27" ry="18" fill="${sp.shoulders ?? sp.head}"/>
${sp.tummy ? `<ellipse cx="50" cy="109" rx="15" ry="13" fill="${sp.tummy}"/>` : ""}
${sp.back()}
<circle cx="50" cy="${HEAD_Y}" r="${HEAD_R}" fill="${sp.head}"/>
<circle cx="50" cy="${HEAD_Y}" r="${HEAD_R}" fill="url(#${id}-g)"/>
${sp.face()}
${blush}
${eyes(sp, expr)}
${sp.nose()}
${mouth(sp, expr)}
${accessory(sp, acc, hue)}
</g>`;
  return svgDoc(100, 100, body, opts.title ?? `${kind} avatar`);
}
