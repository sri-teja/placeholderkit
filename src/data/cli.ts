// `npx @placeholderkit/core data ...`: generate a fake business from the command line.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
// Imports the published entry so the CLI doesn't carry a second copy of the generator.
import { createWorld, toCSV, toJSON, toSQL } from "@placeholderkit/core/data";
import type { SqlDialect, WorldOptions } from "@placeholderkit/core/data";

const HELP = `Usage: placeholderkit data [options]

Generate a fake business (customers, products, orders, reviews) for prototypes.

Options:
  --industry   ecommerce (default; saas coming soon)
  --size       small | medium | large            (default: small)
  --seed       any text; same seed = same data   (default: placeholderkit)
  --locale     en-US | en-GB | en-IN             (default: en-US)
  --currency   USD | GBP | EUR | INR             (default: from locale)
  --now        reference date, e.g. 2026-01-15   (default: 2026-01-15)
  --vertical   apparel | home | outdoor | coffee | pets | tech-accessories | books | beauty
  --format     json | csv | sql                  (default: json)
  --dialect    postgres | mysql | sqlite         (sql only, default: postgres)
  --images     include data: URI image columns in csv/sql
  --out        directory for csv files (one file per table)

Examples:
  npx @placeholderkit/core data --size medium --seed demo > world.json
  npx @placeholderkit/core data --format sql --dialect sqlite > seed.sql
  npx @placeholderkit/core data --format csv --out ./seed
`;

function parse(argv: string[]): Record<string, string | true> {
  const out: Record<string, string | true> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const [k, inline] = a.slice(2).split("=", 2);
    if (inline !== undefined) out[k] = inline;
    else if (argv[i + 1] && !argv[i + 1].startsWith("--")) out[k] = argv[++i];
    else out[k] = true;
  }
  return out;
}

export function run(argv: string[]): number {
  const [command, ...rest] = argv;
  const flags = parse(rest);
  if (command !== "data" || flags.help) {
    (command === "data" || command === "--help" || command === "help" ? process.stdout : process.stderr).write(HELP);
    return command === "data" || command === "--help" || command === "help" ? 0 : 1;
  }
  const str = (k: string) => (typeof flags[k] === "string" ? (flags[k] as string) : undefined);
  try {
    const world = createWorld({
      industry: str("industry"), size: str("size"), seed: str("seed"), locale: str("locale"),
      currency: str("currency"), now: str("now"), vertical: str("vertical"),
    } as WorldOptions);
    const format = str("format") ?? "json";
    const includeImages = flags.images === true;
    if (format === "json") process.stdout.write(JSON.stringify(toJSON(world, { includeImages: flags.images === undefined ? false : includeImages }), null, 2) + "\n");
    else if (format === "sql") process.stdout.write(toSQL(world, { dialect: (str("dialect") ?? "postgres") as SqlDialect, includeImages }));
    else if (format === "csv") {
      const tables = toCSV(world, { includeImages });
      const dir = str("out");
      if (!dir) { process.stderr.write("CSV writes one file per table: add --out <directory>.\n"); return 1; }
      mkdirSync(dir, { recursive: true });
      for (const [name, csv] of Object.entries(tables)) writeFileSync(join(dir, `${name}.csv`), csv);
      process.stderr.write(`Wrote ${Object.keys(tables).length} files to ${dir}\n`);
    } else { process.stderr.write(`Unknown --format ${format}; use json, csv or sql.\n`); return 1; }
    return 0;
  } catch (e) {
    process.stderr.write(`${(e as Error).message}\n`);
    return 1;
  }
}

// Exit quietly when output is piped into something that closes early (e.g. `| head`).
process.stdout.on("error", (e: NodeJS.ErrnoException) => { if (e.code === "EPIPE") process.exit(0); throw e; });
process.exitCode = run(process.argv.slice(2));
