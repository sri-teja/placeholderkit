import { createEcommerce } from "./ecommerce";
import { createSaas } from "./saas";
import type { EcommerceWorld, EcommerceWorldOptions, SaasWorld, SaasWorldOptions, World, WorldOptions } from "./types";
import { resolveOptions } from "./world";

/**
 * A complete, internally consistent fake business for UI prototypes.
 * Same options always give the same world. Never reads the clock: set `now` to move "today".
 *
 *   const world = createWorld({ seed: "demo", industry: "ecommerce", size: "small" });
 *   world.customers[0].avatarUrl; world.metrics.revenueByMonth; world.ordersFor(id);
 */
export function createWorld(options: SaasWorldOptions): SaasWorld;
export function createWorld(options?: EcommerceWorldOptions): EcommerceWorld;
export function createWorld(options?: WorldOptions): World;
export function createWorld(options: WorldOptions = {}): World {
  const resolved = resolveOptions(options);
  if (resolved.industry === "saas") return createSaas(resolved, (options as SaasWorldOptions).product);
  return createEcommerce(resolved, (options as EcommerceWorldOptions).vertical);
}

export { toJSON, toCSV, toSQL } from "./export";
export { DEFAULT_NOW, INDUSTRIES, SIZES, LOCALES, CURRENCIES } from "./world";
export { STORE_VERTICALS } from "./lists/ecommerce";
export { SAAS_PRODUCTS } from "./lists/saas";
export type * from "./types";
