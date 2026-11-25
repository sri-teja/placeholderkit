import { BACKGROUNDS, Shape, bgRect, clipFor, createRng, svgDoc, uid } from "./util";

const SKIN = ["#FBDCC4", "#F1C09A", "#DA9A6B", "#B9703F", "#935332", "#663A22"] as const;
const HAIR = ["#2F2019", "#4E3123", "#7D4F2E", "#B7814A", "#E0BC74", "#9A9AA2", "#C9553A", "#262B3A"] as const;
const SHIRT = ["#4C6FD1", "#2F9C85", "#E0704D", "#8063C9", "#E8A93A", "#3E4350", "#D65C8A", "#5FA048"] as const;

/** Minimum color distance between the face and the background, so the face never blends in. */
const MIN_BG_DISTANCE = 60;

/** Cheap perceptual color distance ("redmean"), for #RRGGBB colors. */
function colorDistance(a: string, b: string): number {
  const [r1, g1, b1] = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const [r2, g2, b2] = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const rm = (r1 + r2) / 2, dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
  return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db);
}

const HAIRSTYLES = ["short", "long", "bun", "curly", "bob", "buzz", "none"] as const;
export type Hairstyle = (typeof HAIRSTYLES)[number];

export interface PersonOptions {
  seed: string;
  shape?: Shape;
  background?: string;
  hairstyle?: Hairstyle;
  title?: string;
}

const INK = "#2E211B";
const EYE_Y = 52;
const EYE_DX = 8.6;

/** Glossy eye: dark oval with a large and a small highlight. */
const eye = (x: number) =>
  `<ellipse cx="${x}" cy="${EYE_Y}" rx="2.8" ry="3.3" fill="${INK}"/>` +
  `<circle cx="${x + 1}" cy="${EYE_Y - 1.3}" r="1.1" fill="#fff"/><circle cx="${x - 0.9}" cy="${EYE_Y + 1.2}" r=".5" fill="#fff" opacity=".85"/>`;

/** Backgrounds far enough from each face color; computed once per color (there are only six). */
const BG_FOR_SKIN = /* @__PURE__ */ new Map<string, readonly string[]>();
function backgroundsFor(skin: string): readonly string[] {
  let list = BG_FOR_SKIN.get(skin);
  if (!list) BG_FOR_SKIN.set(skin, (list = BACKGROUNDS.filter((c) => colorDistance(skin, c) >= MIN_BG_DISTANCE)));
  return list;
}

export function personSvg(opts: PersonOptions): string {
  const { seed, shape = "circle" } = opts;
  const r = createRng(seed, "person");
  const skin = r.pick(SKIN);
  const hair = r.pick(HAIR);
  const shirt = r.pick(SHIRT);
  const bgChoices = backgroundsFor(skin);
  const bg = opts.background ?? r.pick(bgChoices.length ? bgChoices : BACKGROUNDS);
  const style = opts.hairstyle ?? r.weighted(HAIRSTYLES.map((h) => [h, h === "none" ? 0.5 : 1] as const));
  const eyes = r.weighted([["dot", 3], ["happy", 1.5], ["glasses", 1.2]] as const);
  const mouth = r.weighted([["smile", 3], ["grin", 1.5], ["flat", 1]] as const);
  const id = uid(seed, "p");

  const back: Record<Hairstyle, string> = {
    long: `<path d="M27 50C25 27 38 20 50 20S75 27 73 50L76 84Q50 91 24 84Z" fill="${hair}"/>`,
    bob: `<path d="M27 50C25 27 38 20 50 20S75 27 73 50L74 61Q74 72 63 72H37Q26 72 26 61Z" fill="${hair}"/>`,
    bun: `<circle cx="50" cy="21" r="9.5" fill="${hair}"/>`,
    curly: [[29, 58], [71, 58], [27, 49], [73, 49]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${hair}"/>`).join(""),
    short: "", buzz: "", none: "",
  };
  const front: Record<Hairstyle, string> = {
    short: `<path d="M28 52C26 30 38 23 50 23C64 23 75 31 72 52C70 44 66 39 60 37C55 41 46 42 38 39C33 42 30 46 28 52Z" fill="${hair}"/>`,
    long: `<path d="M28 54C26 30 38 22 50 22S74 30 72 54C70 42 63 35 52 33C51 38 47 42 42 43C36 45 31 49 28 54Z" fill="${hair}"/>`,
    bob: `<path d="M28 50C26 29 38 22 50 22S74 29 72 50C71 45 69 42 66 41H34C31 42 29 45 28 50Z" fill="${hair}"/>`,
    bun: `<path d="M28 48C27 29 38 24 50 24S73 29 72 48C67 39 59 35 50 35S33 39 28 48Z" fill="${hair}"/>`,
    curly: `<path d="M29 48C28 31 39 25 50 25S72 31 71 48C66 40 58 37 50 37S34 40 29 48Z" fill="${hair}"/>` +
      [[30, 45], [31.5, 37], [36.5, 30.5], [43.5, 26.5], [51, 25], [58.5, 26.5], [64.5, 30.5], [68.5, 37], [70, 45]]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${hair}"/>`).join(""),
    buzz: `<path d="M30 45C30 30 39 25 50 25S70 30 70 45C65 37 58 34 50 34S35 37 30 45Z" fill="${hair}" opacity=".85"/>`,
    none: "",
  };
  const shine = style === "none" || style === "buzz"
    ? ""
    : `<path d="M40.5 29Q46 26 52.5 27" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".28"/>`;

  const L = 50 - EYE_DX, R = 50 + EYE_DX;
  const eyeSvg =
    eyes === "happy"
      ? `<path d="M${L - 3.4} ${EYE_Y + 1.2}Q${L} ${EYE_Y - 3} ${L + 3.4} ${EYE_Y + 1.2}M${R - 3.4} ${EYE_Y + 1.2}Q${R} ${EYE_Y - 3} ${R + 3.4} ${EYE_Y + 1.2}" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
      : eye(L) + eye(R) +
        (eyes === "glasses"
          ? `<g stroke="${INK}" stroke-width="1.5" fill="#ffffff22"><circle cx="${L}" cy="${EYE_Y}" r="6"/><circle cx="${R}" cy="${EYE_Y}" r="6"/></g><path d="M${L + 6} ${EYE_Y - 0.5}Q50 ${EYE_Y - 2.5} ${R - 6} ${EYE_Y - 0.5}" stroke="${INK}" stroke-width="1.5" fill="none"/>`
          : "");
  const brows = style === "none" || style === "buzz"
    ? ""
    : `<path d="M${L - 3} ${EYE_Y - 6.5}Q${L} ${EYE_Y - 8} ${L + 3} ${EYE_Y - 6.8}M${R - 3} ${EYE_Y - 6.8}Q${R} ${EYE_Y - 8} ${R + 3} ${EYE_Y - 6.5}" stroke="${hair}" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".85"/>`;
  const mouthSvg =
    mouth === "grin"
      ? `<path d="M45.6 60.6Q50 67 54.4 60.6Z" fill="#7A2E24"/><ellipse cx="50" cy="63.6" rx="2.4" ry="1.3" fill="#F58E9B"/>`
      : mouth === "flat"
        ? `<path d="M47.6 61.6Q50 63 52.4 61.6" stroke="#7A2E24" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
        : `<path d="M46.5 61Q50 64.4 53.5 61" stroke="#7A2E24" stroke-width="1.7" fill="none" stroke-linecap="round"/>`;

  const body = `
<defs>${clipFor(id, 100, shape)}<radialGradient id="${id}-g" cx=".36" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
<g clip-path="url(#${id})">
${bgRect(100, bg, shape)}
${back[style]}
<path d="M18 104C18 86 32 78 50 78S82 86 82 104Z" fill="${shirt}"/>
<rect x="44" y="64" width="12" height="15" rx="5" fill="${skin}"/>
<path d="M44 70H56V74Q50 77 44 74Z" fill="#000" opacity=".08"/>
<path d="M43 78.5Q50 85 57 78.5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".3"/>
<circle cx="29" cy="52" r="4.5" fill="${skin}"/><circle cx="71" cy="52" r="4.5" fill="${skin}"/>
<ellipse cx="50" cy="49" rx="21" ry="22" fill="${skin}"/>
<ellipse cx="50" cy="49" rx="21" ry="22" fill="url(#${id}-g)"/>
${front[style]}
${shine}
${brows}
${eyeSvg}
<ellipse cx="38.5" cy="58.5" rx="3.8" ry="2.4" fill="#FF8FA3" opacity=".45"/><ellipse cx="61.5" cy="58.5" rx="3.8" ry="2.4" fill="#FF8FA3" opacity=".45"/>
<path d="M49 56.6Q50 57.8 51 56.6" stroke="#000" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".18"/>
${mouthSvg}
</g>`;
  return svgDoc(100, 100, body, opts.title);
}
