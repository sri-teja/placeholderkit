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

/**
 * Ready-to-use URLs for <img src>, CSS background-image, Markdown, etc.
 * Person and animal avatars are separate functions so an app that uses only one
 * doesn't bundle the other's drawings.
 */
export const avatarUrl = (o: PersonOptions) => toDataUri(personSvg(o));
export const animalUrl = (o: AnimalOptions) => toDataUri(animalSvg(o));
export const placeholderUrl = (o: PlaceholderOptions) => toDataUri(placeholderSvg(o));
export const logoUrl = (o: LogoOptions) => toDataUri(logoSvg(o));
