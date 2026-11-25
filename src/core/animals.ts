import { BACKGROUNDS, OUTLINE, Shape, applyArtStyle, bgRect, clipFor, createRng, svgDoc, uid, type ArtStyle } from "./util";

export const ANIMALS = [
  "fox", "cat", "bear", "panda", "rabbit", "dog", "owl", "penguin", "koala",
  "lion", "tiger", "raccoon", "pig", "monkey", "sheep", "hamster", "otter", "deer", "chick",
] as const;
export type Animal = (typeof ANIMALS)[number];

export const EXPRESSIONS = ["happy", "joy", "wink", "sleepy", "surprised", "smirk"] as const;
export type Expression = (typeof EXPRESSIONS)[number];

export const ACCESSORIES = ["none", "glasses", "party-hat", "bow", "headphones", "crown", "beanie", "scarf", "flower", "cap"] as const;
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
    nose: () => `<ellipse cx="50" cy="67" rx="3.6" ry="2.5" fill="#3B2A22"/><ellipse class="hl" cx="49" cy="66.2" rx="1.1" ry=".6" fill="#fff" opacity=".7"/>`,
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
    nose: () => `<ellipse cx="50" cy="66.8" rx="4.4" ry="3.1" fill="#3A271B"/><ellipse class="hl" cx="48.8" cy="65.8" rx="1.4" ry=".7" fill="#fff" opacity=".65"/>`,
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
    nose: () => `<ellipse cx="50" cy="66.6" rx="4.9" ry="3.3" fill="#33241A"/><ellipse class="hl" cx="48.7" cy="65.6" rx="1.5" ry=".75" fill="#fff" opacity=".65"/>`,
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
    nose: () => `<ellipse cx="50" cy="66" rx="6.2" ry="7.8" fill="#464B53"/><ellipse class="hl" cx="48" cy="62.5" rx="1.8" ry="1.1" fill="#fff" opacity=".45"/>`,
  },
  lion: {
    head: "#EDB862", dark: "#3A2414", eyeY: 59, eyeDx: 12, mouthY: 74, topY: 27,
    back: () =>
      Array.from({ length: 14 }, (_, k) => {
        const a = (k / 14) * Math.PI * 2;
        return `<circle cx="${(50 + Math.cos(a) * 31).toFixed(1)}" cy="${(57 + Math.sin(a) * 31).toFixed(1)}" r="11" fill="#B9692C"/>`;
      }).join("") +
      `<circle cx="30" cy="36" r="7" fill="#EDB862"/><circle cx="70" cy="36" r="7" fill="#EDB862"/>
       <circle cx="30" cy="36" r="3.8" fill="#F6D7A3"/><circle cx="70" cy="36" r="3.8" fill="#F6D7A3"/>`,
    face: () => `<ellipse cx="50" cy="71" rx="12" ry="9" fill="#FBE8C8"/>`,
    nose: () => `<path d="M45.5 65.6 Q50 64 54.5 65.6 Q52.5 69.4 50 69.6 Q47.5 69.4 45.5 65.6 Z" fill="#6B3B22"/>`,
  },
  tiger: {
    head: "#F39A4C", dark: "#3A2418", eyeY: 59, eyeDx: 12, mouthY: 73, topY: 29,
    back: () =>
      `<circle cx="27" cy="35" r="9.5" fill="#F39A4C"/><circle cx="73" cy="35" r="9.5" fill="#F39A4C"/>
       <circle cx="27.5" cy="35.5" r="5" fill="#FFE7D2"/><circle cx="72.5" cy="35.5" r="5" fill="#FFE7D2"/>`,
    face: () =>
      `<path d="M44 30.5 L46 39 L48 30 Z M56 30.5 L54 39 L52 30 Z M50 29 L50 37" fill="#3A2418" stroke="#3A2418" stroke-width="1.4" stroke-linejoin="round"/>
       <path d="M20.5 55 Q26 56 30 54 M20.5 62 Q26 62.5 29.5 61 M79.5 55 Q74 56 70 54 M79.5 62 Q74 62.5 70.5 61" stroke="#3A2418" stroke-width="2.4" fill="none" stroke-linecap="round"/>
       <circle cx="45" cy="71" r="6.5" fill="#FFF6EC"/><circle cx="55" cy="71" r="6.5" fill="#FFF6EC"/>`,
    nose: () => `<path d="M46.8 65.4 Q50 64 53.2 65.4 Q51.8 68.2 50 68.4 Q48.2 68.2 46.8 65.4 Z" fill="#D9707A"/>`,
  },
  raccoon: {
    head: "#A9A8B2", dark: "#2B2A30", eyeY: 59, eyeDx: 12, mouthY: 74, topY: 30, eyesOnDark: true,
    back: () => pair("M23 46 L25 22 Q26 18 30 20 L44 32 Z", "#A9A8B2") + pair("M28 39 L29 26 Q29.6 24 31.4 25 L39 32 Z", "#3F3D46"),
    face: () =>
      `<path d="M22 58 C27 50 36 52 41 57 C45 54 55 54 59 57 C64 52 73 50 78 58 C74 66 64 67 59 63 C55 61 45 61 41 63 C36 67 26 66 22 58 Z" fill="#3F3D46"/>
       <path d="M33 47 Q38 45 44 48 M67 47 Q62 45 56 48" stroke="#F4F3F6" stroke-width="3" fill="none" stroke-linecap="round"/>
       <ellipse cx="50" cy="72" rx="11" ry="8" fill="#F4F3F6"/>`,
    nose: () => `<ellipse cx="50" cy="68" rx="3.6" ry="2.5" fill="#2B2A30"/>`,
  },
  pig: {
    head: "#F7B8C4", dark: "#4A2A33", eyeY: 57, eyeDx: 12.5, mouthY: 78, topY: 30,
    back: () => pair("M26 42 Q18 26 27 23 Q35 23 42 33 Z", "#EE9AAC") + pair("M28.5 37 Q24 28 28.5 26.5 Q33 27 37 32.5 Z", "#F7B8C4"),
    face: () => "",
    nose: () =>
      `<ellipse cx="50" cy="69" rx="9" ry="6.6" fill="#F193A7"/>
       <ellipse cx="46.6" cy="69" rx="1.8" ry="2.6" fill="#B9566C"/><ellipse cx="53.4" cy="69" rx="1.8" ry="2.6" fill="#B9566C"/>`,
  },
  monkey: {
    head: "#9E6C4C", dark: "#3A2418", eyeY: 58, eyeDx: 10.5, mouthY: 74, topY: 29,
    back: () =>
      `<circle cx="20" cy="58" r="9.5" fill="#9E6C4C"/><circle cx="80" cy="58" r="9.5" fill="#9E6C4C"/>
       <circle cx="20.5" cy="58" r="5.5" fill="#F2C9A5"/><circle cx="79.5" cy="58" r="5.5" fill="#F2C9A5"/>`,
    face: () => `<path d="M50 49 C46 42 30 42 30 56 C30 64 34 68 36 70 C38 82 44 86 50 86 S62 82 64 70 C66 68 70 64 70 56 C70 42 54 42 50 49 Z" fill="#F2C9A5"/>`,
    nose: () => `<ellipse cx="47.8" cy="67" rx="1.3" ry="1.6" fill="#5A3424"/><ellipse cx="52.2" cy="67" rx="1.3" ry="1.6" fill="#5A3424"/>`,
  },
  sheep: {
    head: "#F2DCC4", dark: "#3A2E28", eyeY: 61, eyeDx: 11, mouthY: 75, topY: 27,
    back: () =>
      `<ellipse cx="20" cy="55" rx="9" ry="5" fill="#E8CBAE" transform="rotate(-20 20 55)"/><ellipse cx="80" cy="55" rx="9" ry="5" fill="#E8CBAE" transform="rotate(20 80 55)"/>` +
      [[50, 30], [37, 33], [63, 33], [28, 42], [72, 42], [25, 52], [75, 52]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11" fill="#FBF8F3"/>`).join(""),
    face: () => [[50, 37], [40, 39], [60, 39], [33, 45], [67, 45]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8.5" fill="#FBF8F3"/>`).join(""),
    nose: () => `<path d="M47 69 Q50 67.6 53 69 Q51.6 71.2 50 71.3 Q48.4 71.2 47 69 Z" fill="#7A5A4A"/>`,
  },
  hamster: {
    head: "#F2C186", dark: "#3A2A1E", eyeY: 57, eyeDx: 12, mouthY: 72, topY: 30,
    back: () =>
      `<circle cx="28" cy="35" r="8" fill="#F2C186"/><circle cx="72" cy="35" r="8" fill="#F2C186"/>
       <circle cx="28.5" cy="35.5" r="4.4" fill="#F8B6BF"/><circle cx="71.5" cy="35.5" r="4.4" fill="#F8B6BF"/>`,
    face: () => `<path d="M20 62 C22 52 34 54 50 60 C66 54 78 52 80 62 C80 78 66 88 50 88 S20 78 20 62 Z" fill="#FFF7EE"/>`,
    nose: () => `<ellipse cx="50" cy="67.6" rx="2.4" ry="1.7" fill="#E9879A"/>`,
  },
  otter: {
    head: "#9C7458", dark: "#2E2219", eyeY: 57, eyeDx: 12, mouthY: 75, topY: 31,
    back: () =>
      `<circle cx="24" cy="44" r="6.5" fill="#9C7458"/><circle cx="76" cy="44" r="6.5" fill="#9C7458"/>
       <circle cx="24.5" cy="44.5" r="3.4" fill="#6F5140"/><circle cx="75.5" cy="44.5" r="3.4" fill="#6F5140"/>`,
    face: () =>
      `<ellipse cx="50" cy="71" rx="17" ry="11" fill="#EAD8C2"/>
       <g fill="#7A5A44"><circle cx="40" cy="70" r=".9"/><circle cx="37" cy="72.5" r=".9"/><circle cx="41" cy="74" r=".9"/><circle cx="60" cy="70" r=".9"/><circle cx="63" cy="72.5" r=".9"/><circle cx="59" cy="74" r=".9"/></g>`,
    nose: () => `<path d="M45.4 65.4 Q50 63.4 54.6 65.4 Q52.6 69 50 69.2 Q47.4 69 45.4 65.4 Z" fill="#2E2219"/>`,
  },
  deer: {
    head: "#C98C59", dark: "#33231A", eyeY: 59, eyeDx: 12, mouthY: 75, topY: 30,
    back: () =>
      `<ellipse cx="20" cy="40" rx="6.5" ry="12" fill="#C98C59" transform="rotate(-50 20 40)"/><ellipse cx="80" cy="40" rx="6.5" ry="12" fill="#C98C59" transform="rotate(50 80 40)"/>
       <ellipse cx="20.5" cy="40.5" rx="3.2" ry="8" fill="#F4DCC4" transform="rotate(-50 20.5 40.5)"/><ellipse cx="79.5" cy="40.5" rx="3.2" ry="8" fill="#F4DCC4" transform="rotate(50 79.5 40.5)"/>`,
    face: () =>
      `<g fill="#F7E6D2"><circle cx="42" cy="38" r="2"/><circle cx="50" cy="35" r="2.3"/><circle cx="58" cy="38" r="2"/><circle cx="46" cy="44" r="1.6"/><circle cx="54" cy="44" r="1.6"/></g>
       <ellipse cx="50" cy="72" rx="11.5" ry="8.5" fill="#F3E0C8"/>`,
    nose: () => `<ellipse cx="50" cy="67.4" rx="4.2" ry="3" fill="#33231A"/><ellipse class="hl" cx="48.9" cy="66.5" rx="1.3" ry=".65" fill="#fff" opacity=".65"/>`,
  },
  chick: {
    head: "#FFD65E", dark: "#3A2C12", eyeY: 59, eyeDx: 11.5, mouthY: 72, topY: 31, noMouth: true,
    back: () => `<path d="M50 30 C46 22 48 16 51 15 C51 20 54 23 50 30 Z M50 30 C52 22 58 19 61 20 C58 24 56 28 50 30 Z M50 30 C46 23 40 21 38 23 C41 25 44 28 50 30 Z" fill="#F7C23E"/>`,
    face: () => "",
    nose: () => `<path d="M45 66 Q50 63.6 55 66 Q50 70.5 45 66 Z" fill="#F58A2E"/><path d="M46 67.4 Q50 72.6 54 67.4 Q50 69.2 46 67.4 Z" fill="#E0701E"/>`,
  },
};

/** A big glossy eye: dark oval with a large and a small highlight. */
function glossy(x: number, y: number, dark: string, s = 1): string {
  return `<ellipse cx="${x}" cy="${y}" rx="${3.7 * s}" ry="${4.3 * s}" fill="${dark}"/>` +
    `<circle class="hl" cx="${x + 1.4 * s}" cy="${y - 1.7 * s}" r="${1.55 * s}" fill="#fff"/>` +
    `<circle class="hl" cx="${x - 1.3 * s}" cy="${y + 1.6 * s}" r="${0.75 * s}" fill="#fff" opacity=".85"/>`;
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
    case "scarf":
      return `<path d="M23 84 Q50 95 77 84 L77 92 Q50 103 23 92 Z" fill="${hue}"/>` +
        `<path d="M58 90 L67 89 L70 104 L60 104 Z" fill="${hue}"/><path d="M58 90 L67 89 L70 104 L60 104 Z" fill="#000" opacity=".12"/>` +
        `<path d="M30 88.5 Q50 97 70 88.5" stroke="#fff" stroke-width="1.6" fill="none" stroke-dasharray="3 3" opacity=".55"/>`;
    case "flower": {
      const cx = 67, cy = t + 5;
      return `<g fill="${hue}">${[0, 72, 144, 216, 288].map((a) => {
        const rad = (a * Math.PI) / 180;
        return `<circle cx="${(cx + Math.cos(rad) * 4.6).toFixed(1)}" cy="${(cy + Math.sin(rad) * 4.6).toFixed(1)}" r="4"/>`;
      }).join("")}</g><circle cx="${cx}" cy="${cy}" r="2.8" fill="#FFD447"/>`;
    }
    case "cap":
      return `<path d="M27 ${t + 12}C27 ${t - 17} 73 ${t - 17} 73 ${t + 12}Z" fill="${hue}"/>` +
        `<path d="M27 ${t + 12}C27 ${t - 17} 73 ${t - 17} 73 ${t + 12}Z" fill="#fff" opacity=".1"/>` +
        `<path d="M24 ${t + 12} Q50 ${t + 6} 80 ${t + 11} Q88 ${t + 13} 81 ${t + 17} Q50 ${t + 12} 24 ${t + 17} Z" fill="${hue}"/>` +
        `<path d="M24 ${t + 12} Q50 ${t + 6} 80 ${t + 11} Q88 ${t + 13} 81 ${t + 17} Q50 ${t + 12} 24 ${t + 17} Z" fill="#000" opacity=".16"/>` +
        `<circle cx="50" cy="${t - 9}" r="2.4" fill="#000" opacity=".2"/>`;
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
  /** "soft" (default), "flat" or "outlined". */
  artStyle?: ArtStyle;
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

  const art = opts.artStyle ?? "soft";
  const shoulders = `<ellipse cx="50" cy="107" rx="27" ry="18" fill="${sp.shoulders ?? sp.head}"/>`;
  const head = `<circle cx="50" cy="${HEAD_Y}" r="${HEAD_R}" fill="${sp.head}"/>`;
  const back = sp.back(), face = sp.face();
  const acc_ = accessory(sp, acc, hue);
  const body = `
<defs>${clipFor(id, 100, shape)}${art === "soft" ? `<radialGradient id="${id}-g" cx=".36" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>` : ""}</defs>
<g clip-path="url(#${id})">
${bgRect(100, bg, shape)}
<!--outline-->
${shoulders}
${sp.tummy ? `<ellipse cx="50" cy="109" rx="15" ry="13" fill="${sp.tummy}"/>` : ""}
${back}
${head}
<circle class="hl" cx="50" cy="${HEAD_Y}" r="${HEAD_R}" fill="url(#${id}-g)"/>
${face}
${blush}
${eyes(sp, expr)}
${sp.nose()}
${mouth(sp, expr)}
${art === "outlined" && acc_ ? `<g stroke="${OUTLINE}" stroke-width="1.6" stroke-linejoin="round">${acc_}</g>` : acc_}
</g>`;
  return svgDoc(100, 100, applyArtStyle(body, art, shoulders + back + head + face).replace("<!--outline-->", ""), opts.title ?? `${kind} avatar`);
}
