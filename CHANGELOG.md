# @placeholderkit/core

## 0.4.0

### Minor Changes

- 01409dd: More image content and a new `artStyle` option.
  
  - 10 new animals: lion, tiger, raccoon, pig, monkey, sheep, hamster, otter, deer and chick (19 in total).
  - 3 new hairstyles (ponytail, afro, waves) and 3 new accessories (scarf, flower, cap).
  - 6 new placeholder categories: `real-estate`, `finance`, `health`, `education`, `restaurant-menu`, `social-post`.
  - `artStyle: "soft" | "flat" | "outlined"` for `avatarUrl`, `animalUrl`, `<Avatar>` and `<AnimalAvatar>` (`soft` is the default and the existing look). It is called `artStyle` because `style` is React's CSS prop.
  - The script-tag build now reads `data-art-style`, `data-hairstyle`, `data-expression` and `data-accessory`.
  
  Because the new animals, hairstyles, accessories and categories join the random picks, many seeds now draw a different image than in 0.3.x. To keep an image exactly as it was, set the choices that gained options: `hairstyle` for person avatars, `animal` and `accessory` for animal avatars, and `category` for placeholders. Logos are unchanged.

## 0.3.0

### Minor Changes

- e94b7c0: New `@placeholderkit/core/data` module: `createWorld()` returns a complete, internally consistent fake business for prototypes, with images already attached. Ecommerce worlds have customers, products, orders and reviews across eight store types; SaaS worlds have accounts, users, plans, subscriptions, invoices, an activity feed and support tickets. Includes en-US, en-GB and en-IN locales, monthly metrics for charts, `toJSON`/`toCSV`/`toSQL` exports (Postgres, MySQL, SQLite) and a CLI: `npx @placeholderkit/core data`.

## 0.2.0

### Minor Changes

- fd65139: Node.js 22 or newer is now required on the server and in build tools (`engines.node` is `>=22`); Node 18 and 20 have reached end of life. Browser support is unchanged. `@placeholderkit/core/package.json` can now be imported, for tools that read package metadata.

## 0.1.1

### Patch Changes

- 8ea396d: Releases are now published from GitHub Actions with npm provenance, so each version on npm links to the commit and workflow that built it.

## 0.1.0

### Minor Changes

- First release: person avatars, animal avatars, placeholder images for 20 content categories and fake company logos, all generated locally as SVG. React components (`<Avatar>`, `<AnimalAvatar>`, `<Placeholder>`, `<Logo>`), an `<Icon>` wrapper for Lucide, and a script-tag build that fills `data-placeholderkit` images.
