import { BACKGROUNDS, Shape, bgRect, clipFor, createRng, svgDoc, uid } from "./util";

const SKIN = ["#F6D3B3", "#EDB98A", "#D08B5B", "#AE5D29", "#8D4A2B", "#5C3317"] as const;
const HAIR = ["#2C1B12", "#4A2E1E", "#7A4B2A", "#B5793F", "#D9B26A", "#8C8C8C", "#C4452F", "#1F2633"] as const;
const SHIRT = ["#3B5BA9", "#2F7D6D", "#C25A3C", "#6B4FA0", "#D29A2E", "#33363D", "#B8466E", "#4C8C3A"] as const;

const HAIRSTYLES = ["short", "long", "bun", "curly", "bob", "buzz", "none"] as const;
export type Hairstyle = (typeof HAIRSTYLES)[number];

export interface PersonOptions {
  seed: string;
  shape?: Shape;
  background?: string;
  hairstyle?: Hairstyle;
  title?: string;
}

export function personSvg(opts: PersonOptions): string {
  const { seed, shape = "circle" } = opts;
  const r = createRng(seed, "person");
  const skin = r.pick(SKIN);
  const hair = r.pick(HAIR);
  const shirt = r.pick(SHIRT);
  const bg = opts.background ?? r.pick(BACKGROUNDS);
  const style = opts.hairstyle ?? r.weighted(HAIRSTYLES.map((h) => [h, h === "none" ? 0.5 : 1] as const));
  const eyes = r.weighted([["dot", 3], ["happy", 1.5], ["glasses", 1.2]] as const);
  const mouth = r.weighted([["smile", 3], ["grin", 1.5], ["flat", 1]] as const);
  const id = uid(seed, "p");

  const back: Record<Hairstyle, string> = {
    long: `<path d="M29 46C27 24 40 17 50 17S73 24 71 46L74 82H26Z" fill="${hair}"/>`,
    bob: `<path d="M29 47C27 25 40 18 50 18S73 25 71 47L72 64H28Z" fill="${hair}"/>`,
    bun: `<circle cx="50" cy="20" r="9" fill="${hair}"/>`,
    short: "", curly: "", buzz: "", none: "",
  };
  const front: Record<Hairstyle, string> = {
    short: `<path d="M31 45C29 26 41 20 51 21C63 22 72 30 69 45C66 36 59 31 50 31C42 31 35 36 31 45Z" fill="${hair}"/>`,
    long: `<path d="M31 46C30 27 41 21 50 21S70 27 69 46C63 34 54 31 50 31C44 34 37 38 31 46Z" fill="${hair}"/>`,
    bob: `<path d="M31 46C30 27 41 21 50 21S70 27 69 46C62 38 50 37 41 31C38 36 34 40 31 46Z" fill="${hair}"/>`,
    bun: `<path d="M31 44C30 27 41 22 50 22S70 27 69 44C64 35 57 31 50 31S36 35 31 44Z" fill="${hair}"/>`,
    curly: [[34, 36], [40, 28], [49, 25], [58, 27], [65, 34], [68, 42], [32, 44]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="${hair}"/>`).join(""),
    buzz: `<path d="M32 42C32 28 41 23 50 23S68 28 68 42C63 35 57 32 50 32S37 35 32 42Z" fill="${hair}" opacity=".7"/>`,
    none: "",
  };

  const eyeSvg =
    eyes === "happy"
      ? `<path d="M40 48Q43 45 46 48M54 48Q57 45 60 48" stroke="#2A1D17" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
      : `<circle cx="43" cy="48" r="2.3" fill="#2A1D17"/><circle cx="57" cy="48" r="2.3" fill="#2A1D17"/>` +
        (eyes === "glasses"
          ? `<g stroke="#2A1D17" stroke-width="1.6" fill="none"><circle cx="43" cy="48" r="5.5"/><circle cx="57" cy="48" r="5.5"/><path d="M48.5 48H51.5"/></g>`
          : "");
  const mouthSvg =
    mouth === "grin"
      ? `<path d="M44 56Q50 63 56 56Z" fill="#7A2E24"/>`
      : mouth === "flat"
        ? `<path d="M46 58H54" stroke="#7A2E24" stroke-width="2" stroke-linecap="round"/>`
        : `<path d="M44 56Q50 61 56 56" stroke="#7A2E24" stroke-width="2" fill="none" stroke-linecap="round"/>`;

  const body = `
<defs>${clipFor(id, 100, shape)}</defs>
<g clip-path="url(#${id})">
${bgRect(100, bg, shape)}
${back[style]}
<path d="M16 102C16 80 32 71 50 71S84 80 84 102Z" fill="${shirt}"/>
<rect x="44" y="58" width="12" height="15" rx="4" fill="${skin}"/>
<rect x="44" y="64" width="12" height="5" fill="#000" opacity=".08"/>
<circle cx="31.5" cy="49" r="4" fill="${skin}"/><circle cx="68.5" cy="49" r="4" fill="${skin}"/>
<ellipse cx="50" cy="46" rx="18.5" ry="20.5" fill="${skin}"/>
${front[style]}
${eyeSvg}
<circle cx="39" cy="54" r="3" fill="#F08A8A" opacity=".3"/><circle cx="61" cy="54" r="3" fill="#F08A8A" opacity=".3"/>
${mouthSvg}
</g>`;
  return svgDoc(100, 100, body, opts.title);
}
