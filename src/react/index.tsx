import * as React from "react";
import {
  animalSvg, personSvg, placeholderSvg, logoSvg, toDataUri, parseRatio, fakeCompanyName,
  type Animal, type Expression, type Accessory, type Category, type Shape, type Hairstyle, type ArtStyle,
} from "../core/index";

type ImgProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height">;

/** No hooks or browser APIs: these components work in React Server Components, SSR and the client. */
const svgUrl = (svg: string): string => toDataUri(svg);

const px = (v: number | string) => (typeof v === "number" ? `${v}px` : v);

interface SquareImageProps extends ImgProps {
  /** Anything stable per user: id, email, name. Same seed = same avatar. */
  seed: string;
  /** Pixels or any CSS length. Default 40. */
  size?: number | string;
  shape?: Shape;
  /** Background color, or "transparent". Picked from the seed by default. */
  background?: string;
}

function squareImg(src: string, alt: string, size: number | string, style: React.CSSProperties | undefined, rest: ImgProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={typeof size === "number" ? size : undefined}
      height={typeof size === "number" ? size : undefined}
      draggable={false}
      style={{ width: px(size), height: px(size), display: "inline-block", flexShrink: 0, ...style }}
      {...rest}
    />
  );
}

export interface AvatarProps extends SquareImageProps {
  hairstyle?: Hairstyle;
  /** "soft" (default), "flat" or "outlined". Named artStyle because `style` is the CSS prop. */
  artStyle?: ArtStyle;
}

/** Person avatar. For animal characters use <AnimalAvatar>. */
export function Avatar({ seed, hairstyle, artStyle, size = 40, shape = "circle", background, alt, style, ...rest }: AvatarProps) {
  const src = svgUrl(personSvg({ seed, hairstyle, artStyle, shape, background }));
  return squareImg(src, alt ?? "Avatar", size, style, rest);
}

export interface AnimalAvatarProps extends SquareImageProps {
  /** Pin the species to get one character in many variations. Picked from the seed if omitted. */
  animal?: Animal;
  expression?: Expression;
  accessory?: Accessory;
  /** "soft" (default), "flat" or "outlined". Named artStyle because `style` is the CSS prop. */
  artStyle?: ArtStyle;
}

/** Animal character avatar (fox, cat, panda...). */
export function AnimalAvatar({
  seed, animal, expression, accessory, artStyle, size = 40, shape = "circle", background, alt, style, ...rest
}: AnimalAvatarProps) {
  const src = svgUrl(animalSvg({ seed, animal, expression, accessory, artStyle, shape, background }));
  return squareImg(src, alt ?? `${animal ?? "Animal"} avatar`, size, style, rest);
}

export interface PlaceholderProps extends ImgProps {
  seed: string;
  /** What the slot will hold: food, product, travel, people, tech... Picked from the seed if omitted. */
  category?: Category;
  /** Width / height, e.g. "16/9", "1/1", 4/3. Default "16/9". */
  ratio?: number | string;
  /** Optional caption drawn on the image. */
  label?: string;
  /** Hide the category symbol. */
  glyph?: boolean;
  /** Fixed width (px or CSS). By default the image fills its container's width. */
  width?: number | string;
}

export function Placeholder({ seed, category, ratio = "16/9", label, glyph, width, alt, style, ...rest }: PlaceholderProps) {
  const r = parseRatio(ratio);
  const src = svgUrl(placeholderSvg({ seed, category, ratio: r, label, glyph }));
  return (
    <img
      src={src}
      alt={alt ?? label ?? `${category ?? "Placeholder"} image`}
      draggable={false}
      style={{
        width: width === undefined ? "100%" : px(width),
        aspectRatio: String(r), height: "auto", display: "block", objectFit: "cover", ...style,
      }}
      {...rest}
    />
  );
}

export interface LogoProps extends ImgProps {
  seed: string;
  /** Company name in the wordmark. A believable fake name is generated if omitted. */
  name?: string;
  variant?: "full" | "mark";
  color?: string;
  /** Height in px or CSS. Width follows. Default 32. */
  height?: number | string;
}

export function Logo({ seed, name, variant = "full", color, height = 32, alt, style, ...rest }: LogoProps) {
  const src = svgUrl(logoSvg({ seed, name, variant, color }));
  return (
    <img
      src={src}
      alt={alt ?? `${name ?? fakeCompanyName(seed)} logo`}
      draggable={false}
      style={{ height: px(height), width: "auto", display: "inline-block", ...style }}
      {...rest}
    />
  );
}

export * from "../core/index";
