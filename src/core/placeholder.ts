import { createRng, escapeXml, svgDoc, uid } from "./util";

/** Glyphs drawn in a 100x100 box with stroke="currentColor"-style styling applied by the caller. */
const GLYPHS = {
  photo: `<rect x="14" y="22" width="72" height="56" rx="8"/><path d="M14 66L36 46L52 60L64 50L86 68"/><circle cx="66" cy="38" r="6"/>`,
  food: `<path d="M16 50H84C84 68 69 80 50 80S16 68 16 50Z"/><path d="M38 40C34 34 42 30 38 22M52 40C48 34 56 30 52 22M66 40C62 34 70 30 66 22"/>`,
  product: `<path d="M50 16L82 32V68L50 84L18 68V32Z"/><path d="M18 32L50 48L82 32M50 48V84"/>`,
  travel: `<path d="M10 80L38 40L54 62L66 48L90 80Z"/><circle cx="72" cy="26" r="7"/>`,
  nature: `<path d="M50 86C20 72 20 30 80 16C84 60 70 80 50 86Z"/><path d="M50 86C54 64 60 48 70 32"/>`,
  people: `<circle cx="50" cy="36" r="14"/><path d="M22 84C22 66 34 58 50 58S78 66 78 84"/>`,
  tech: `<rect x="20" y="24" width="60" height="40" rx="5"/><path d="M12 76H88L82 68H18Z"/>`,
  fashion: `<path d="M50 32A8 8 0 1 1 58 24"/><path d="M50 32V38L14 66H86L50 38"/>`,
  home: `<path d="M14 50L50 20L86 50"/><path d="M26 42V82H74V42"/><path d="M43 82V62H57V82"/>`,
  sports: `<circle cx="50" cy="50" r="32"/><path d="M50 18C38 32 38 68 50 82M50 18C62 32 62 68 50 82M18 50H82"/>`,
  music: `<path d="M40 70V26L78 18V62"/><circle cx="32" cy="70" r="9"/><circle cx="70" cy="62" r="9"/>`,
  book: `<path d="M50 28C40 20 22 20 14 24V78C22 74 40 74 50 82C60 74 78 74 86 78V24C78 20 60 20 50 28Z"/><path d="M50 28V82"/>`,
  car: `<path d="M14 62V52L24 36H72L86 52V62Z"/><circle cx="30" cy="66" r="8"/><circle cx="70" cy="66" r="8"/><path d="M28 50H72"/>`,
  pet: `<ellipse cx="50" cy="64" rx="16" ry="13"/><circle cx="28" cy="44" r="7"/><circle cx="41" cy="30" r="7"/><circle cx="59" cy="30" r="7"/><circle cx="72" cy="44" r="7"/>`,
  building: `<path d="M16 84V40H38V84M38 84V18H64V84M64 84V50H84V84M10 84H90"/><path d="M46 30H56M46 42H56M46 54H56"/>`,
  map: `<path d="M12 24L36 16L64 26L88 18V76L64 84L36 74L12 82Z"/><path d="M36 16V74M64 26V84"/>`,
  chart: `<path d="M16 16V84H86"/><path d="M28 64L44 46L58 56L80 28"/>`,
  document: `<path d="M26 12H60L76 28V88H26Z"/><path d="M60 12V28H76M36 46H66M36 58H66M36 70H56"/>`,
  video: `<rect x="12" y="24" width="76" height="52" rx="8"/><path d="M42 38L62 50L42 62Z"/>`,
  event: `<rect x="16" y="22" width="68" height="62" rx="6"/><path d="M16 38H84M34 14V28M66 14V28"/>`,
} as const;

export type Category = keyof typeof GLYPHS;
export const CATEGORIES = /* @__PURE__ */ Object.keys(GLYPHS) as Category[];

/** Two-tone palettes per category so each kind of content has a recognizable mood. */
const PALETTES: Record<Category, [string, string][]> = {
  photo: [["#8EA6C8", "#C9D6E8"], ["#9AA88E", "#D6DEC9"], ["#B49BC4", "#E3D7EB"]],
  food: [["#E7894F", "#F7C99E"], ["#D9583F", "#F4B08A"], ["#C99A3A", "#F2DDA2"]],
  product: [["#6C7A93", "#C5CCD9"], ["#8E7B6A", "#DCCFC2"], ["#5E8A86", "#BFD9D5"]],
  travel: [["#3E8FC7", "#A6D3EF"], ["#E0844E", "#F6CDA3"], ["#4AA39A", "#B6E1D9"]],
  nature: [["#4F8F4A", "#B5D7A2"], ["#7AA34A", "#D5E8B0"], ["#3D7F6B", "#A9D5C3"]],
  people: [["#C77B8B", "#F0CCD3"], ["#8B79C4", "#D7CFEE"], ["#C4925F", "#EED6BA"]],
  tech: [["#4B5BD6", "#B5BEF2"], ["#2E8C9E", "#A6D9E2"], ["#5F5A73", "#C9C6D6"]],
  fashion: [["#C25B86", "#F0C1D5"], ["#9A6AC2", "#DCC8EE"], ["#B68B52", "#EBD8BB"]],
  home: [["#B5805A", "#EAD3BE"], ["#7F9A78", "#D3E0CE"], ["#C69B6D", "#F0DFC9"]],
  sports: [["#E0563F", "#F6B9A8"], ["#2F7FCF", "#A9CCF0"], ["#3A9E5A", "#B1DFBE"]],
  music: [["#7B4FC9", "#CDB8F0"], ["#D24E7F", "#F3BBD0"], ["#3B6FD1", "#B2C9F2"]],
  book: [["#8A5A3C", "#E2C7AE"], ["#5B6C8F", "#C7CFE0"], ["#7A8A4E", "#D6DDB8"]],
  car: [["#C0392B", "#EFB3AA"], ["#34495E", "#B9C3CE"], ["#2C82C9", "#AFD0EF"]],
  pet: [["#D08B4C", "#F3D3AF"], ["#8C9A5B", "#D6DDB5"], ["#B67A9C", "#EBCDDD"]],
  building: [["#5D6D7E", "#C6CED6"], ["#8E8270", "#DCD5C8"], ["#4E7A8F", "#B7D0DC"]],
  map: [["#4E9A8A", "#BFE0D6"], ["#9A8A4E", "#E2DAB5"], ["#5A7FB5", "#C1D3EC"]],
  chart: [["#2F7D6D", "#ADD8CC"], ["#3B5BA9", "#B6C6EA"], ["#8A5CC2", "#D4C3EE"]],
  document: [["#6B7C93", "#D0D7E2"], ["#7D6B93", "#DAD0E6"], ["#93836B", "#E3DACB"]],
  video: [["#2D2D3A", "#7A7A94"], ["#4B2E5A", "#A786B8"], ["#1F4E5F", "#7FB0C0"]],
  event: [["#D9534F", "#F3BCB9"], ["#E09A2D", "#F5D7A3"], ["#5B6BD9", "#C2C9F3"]],
};

export interface PlaceholderOptions {
  seed: string;
  category?: Category;
  /** Width / height, e.g. 16/9 or "4/3". Default 16/9. */
  ratio?: number | string;
  /** Optional text drawn on the image, e.g. "Hero image". */
  label?: string;
  /** Hide the category glyph for a purely abstract image. */
  glyph?: boolean;
  title?: string;
}

export function parseRatio(ratio: number | string | undefined): number {
  if (ratio === undefined) return 16 / 9;
  if (typeof ratio === "number") return ratio > 0 ? ratio : 16 / 9;
  const [w, h] = ratio.split(/[/:x]/).map(Number);
  return w > 0 && h > 0 ? w / h : Number(ratio) > 0 ? Number(ratio) : 16 / 9;
}

export function placeholderSvg(opts: PlaceholderOptions): string {
  const { seed, label, glyph = true } = opts;
  const r = createRng(seed, "ph");
  const category = opts.category ?? r.pick(CATEGORIES);
  const [deep, light] = r.pick(PALETTES[category]);
  const ratio = parseRatio(opts.ratio);
  const W = 400, H = Math.round(W / ratio);
  const m = Math.min(W, H);
  const id = uid(seed + category + H, "ph");
  const angle = r.int(0, 359);

  const blobs = Array.from({ length: 4 }, () => {
    const cx = r.int(0, W), cy = r.int(0, H), rad = Math.round(m * (0.25 + r.next() * 0.45));
    const fill = r.next() > 0.5 ? "#ffffff" : deep;
    return `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${fill}" opacity="${(0.1 + r.next() * 0.16).toFixed(2)}"/>`;
  }).join("");

  const gs = m * 0.34;
  const gx = (W - gs) / 2, gy = (H - gs) / 2 - (label ? m * 0.06 : 0);
  const glyphSvg = glyph
    ? `<g transform="translate(${gx.toFixed(1)} ${gy.toFixed(1)}) scale(${(gs / 100).toFixed(3)})" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".92">${GLYPHS[category]}</g>`
    : "";
  const fs = Math.max(12, Math.round(m * 0.075));
  const labelSvg = label
    ? `<text x="${W / 2}" y="${(gy + gs + fs * 1.6).toFixed(1)}" text-anchor="middle" font-family="ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="${fs}" font-weight="600" fill="#ffffff">${escapeXml(label)}</text>`
    : "";

  const body = `
<defs><linearGradient id="${id}" gradientTransform="rotate(${angle} .5 .5)"><stop offset="0" stop-color="${deep}"/><stop offset="1" stop-color="${light}"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#${id})"/>
${blobs}
${glyphSvg}
${labelSvg}`;
  return svgDoc(W, H, body, opts.title ?? label ?? `${category} placeholder`);
}
