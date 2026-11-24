import { animalSvg, type AnimalOptions } from "./animals";
import { logoSvg, type LogoOptions } from "./logo";
import { personSvg, type PersonOptions } from "./person";
import { placeholderSvg, type PlaceholderOptions } from "./placeholder";
import { toDataUri } from "./util";

export { animalSvg, ANIMALS, EXPRESSIONS, ACCESSORIES } from "./animals";
export type { Animal, Expression, Accessory, AnimalOptions } from "./animals";
export { personSvg } from "./person";
export type { PersonOptions, Hairstyle } from "./person";
export { placeholderSvg, CATEGORIES, parseRatio } from "./placeholder";
export type { Category, PlaceholderOptions } from "./placeholder";
export { logoSvg, fakeCompanyName } from "./logo";
export type { LogoOptions } from "./logo";
export { toDataUri, hash } from "./util";
export type { Shape } from "./util";

export type AvatarOptions =
  | ({ kind?: "person" } & PersonOptions)
  | ({ kind: "animal" } & AnimalOptions);

/** One entry point for avatars: people by default, animals with kind: "animal". */
export function avatarSvg(opts: AvatarOptions): string {
  return opts.kind === "animal" ? animalSvg(opts) : personSvg(opts);
}

/** Ready-to-use URLs for <img src>, CSS background-image, Markdown, etc. */
export const avatarUrl = (o: AvatarOptions) => toDataUri(avatarSvg(o));
export const placeholderUrl = (o: PlaceholderOptions) => toDataUri(placeholderSvg(o));
export const logoUrl = (o: LogoOptions) => toDataUri(logoSvg(o));
