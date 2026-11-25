# placeholderkit

## What this is
An open-source npm package for **realistic placeholder content in prototypes**: avatars, animal characters, content images, fake company logos, icons by name, and (next) connected fake business data. Aimed at developers building prototypes and mockups, and especially at AI website builders (v0, Lovable, Bolt, Cursor, Claude Code), which constantly need images and data the user hasn't provided yet.

Everything is generated locally: no network, works offline and in sandboxes, and the same seed always gives the same output.

## Brand and packaging decisions
- Name: **placeholderkit**; published on npm as **`@placeholderkit/core`** (npm blocks the unscoped `placeholderkit` as too similar to the existing `placeholder-kit`). The `@placeholderkit` npm org owns the scope.
- One brand for the whole suite of prototype content: images, avatars, logos, icons, fake data, and later maps and demo charts. Anything that is not prototype content does not belong here.
- Now: a single package with subpath exports. Later, if modules get large or need their own dependencies, move to a monorepo with `@placeholderkit/*` scoped packages while keeping `@placeholderkit/core` as the all-in-one package that re-exports them, so existing imports keep working.
- Distribution: GitHub, npm, jsDelivr (automatic from npm), and `llms.txt` so AI coding tools learn the API. Package description and keywords are chosen for search ("placeholder", "placeholder-image", "placeholder-avatar", "dummy-image", "mock-data", "prototype").

## Current state (v0.1.0, published to npm as @placeholderkit/core on 2026-11-25)
- `@placeholderkit/core`: core functions: personSvg, animalSvg, placeholderSvg, logoSvg, avatarUrl (person), animalUrl, placeholderUrl, logoUrl, fakeCompanyName, toDataUri, parseRatio, plus ANIMALS, EXPRESSIONS, ACCESSORIES, CATEGORIES.
- `@placeholderkit/core/react`: `<Avatar>` (person), `<AnimalAvatar>`, `<Placeholder>`, `<Logo>`. Hook-free, so they work in React Server Components, SSR and the client.
- `@placeholderkit/core/icons`: `<Icon name="shopping-cart" />`, wrapping lucide-react (optional peer dependency) with a fallback for unknown names.
- `dist/placeholderkit.global.js`: script-tag build exposing `window.PlaceholderKit`; fills `<img data-placeholderkit="avatar|animal|placeholder|logo" data-seed=...>`, including images added later (MutationObserver).
- Content: person avatars (6 skin tones, 7 hairstyles, expressions, glasses); 9 animals × 6 expressions × 7 accessories; 20 placeholder categories with palettes and glyphs; logos with 9 mark styles and generated names.
- Source: `src/core/{util,person,animals,placeholder,logo,index,global}.ts`, `src/react/{index,icons}.tsx`.
- Build: tsup (ESM, CJS, d.ts) plus esbuild for the IIFE global build. Scripts: `build`, `typecheck`, `test`, `gallery`.
- Tests (`test/`, node:test): determinism, every animal/expression/accessory combination, ratio parsing, XML escaping, React server rendering, icon fallback, script-tag build in jsdom. All pass.
- Docs: README.md, llms.txt, docs/gallery.png (`npm run gallery`), examples/plain.html, examples/react-example.jsx. Website: `site/index.html`, built into `_site/` by `npm run site` (scripts/build-site.mjs: stamps version, copies the global build and llms.txt, generates favicon and og.png) and deployed to https://sri-teja.github.io/placeholderkit/ by `.github/workflows/pages.yml`.
- GitHub: `sri-teja/placeholderkit` (set in package.json repository/homepage/bugs).
- Repo: `main` on GitHub. CI in `.github/workflows/ci.yml` (typecheck, build, test, pack dry-run on Node 22/24/26; `engines.node` is `>=22`). Releases via Changesets (`npm run changeset`); `.github/workflows/release.yml` opens a "Version Packages" PR and publishes on merge via npm Trusted Publishing (switch: repo variable `RELEASE_ENABLED`). See `docs/RELEASING.md`.

## Rules
1. **Deterministic.** Same inputs → identical output. All randomness goes through `createRng(seed, salt)` in `src/core/util.ts`. Never use `Math.random()` or read the real clock (`Date.now()`, `new Date()` without an argument) in library code.
2. **No network** and no runtime dependencies in core.
3. React components stay hook-free and SSR-safe.
4. Avatars use a 100×100 viewBox; placeholders are 400 wide with height from the ratio. Escape all user-provided text with `escapeXml`.
5. Every image gets sensible default alt text.
6. Any public API change updates **README.md, llms.txt and tests in the same change**.
7. Before calling anything done: `npm run typecheck && npm test`. After any visual change, run `npm run gallery` and look at `docs/gallery.png`.
8. Keep subpaths independent so importing one doesn't pull in the others' code. Report gzip sizes when adding modules.
9. Ask before publishing to npm, pushing to a remote, or adding a runtime dependency.
