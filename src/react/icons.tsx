import * as React from "react";
import { icons, type LucideProps } from "lucide-react";

export type IconName = string;

const toPascal = (name: string) =>
  name.replace(/(^|[-_\s]+)([a-z0-9])/gi, (_, __, c: string) => c.toUpperCase());

export interface IconProps extends LucideProps {
  /** Any Lucide icon name in kebab-case or PascalCase, e.g. "shopping-cart" or "ShoppingCart". */
  name: IconName;
}

/**
 * Icon by name, so generated code never has to know import paths.
 * Unknown names render a neutral fallback instead of crashing the page.
 * Note: this imports the full Lucide set. For production, import icons from lucide-react directly.
 */
export function Icon({ name, ...props }: IconProps) {
  const Cmp = (icons as Record<string, React.ComponentType<LucideProps>>)[toPascal(name)] ?? icons.CircleHelp ?? icons.Circle;
  return <Cmp aria-hidden={props["aria-label"] ? undefined : true} {...props} />;
}
