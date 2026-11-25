# placeholderkit

[![npm](https://img.shields.io/npm/v/@placeholderkit/core)](https://www.npmjs.com/package/@placeholderkit/core)

**[Website and live playground →](https://sri-teja.github.io/placeholderkit/)**

Placeholder images, avatars, logos, icons and fake business data for React and HTML. Built for prototypes, mockups and AI-built apps.

- **Same seed, same image.** Pass a user id, email or product id and get a stable image every render.
- **No network.** Everything is generated as SVG in the browser or on the server. Works offline, in sandboxes and in CI.
- **One package, any stack.** React components, plain functions that return URLs, or a script tag for plain HTML.

![placeholderkit gallery](https://raw.githubusercontent.com/sri-teja/placeholderkit/main/docs/gallery.png)

## Install

```bash
npm install @placeholderkit/core
```

Works in any modern browser. On the server and in build tools it needs Node.js 22 or newer.

## React

```jsx
import { Avatar, AnimalAvatar, Placeholder, Logo } from "@placeholderkit/core/react";
import { Icon } from "@placeholderkit/core/icons"; // optional, needs lucide-react

<Avatar seed={user.email} />                         // person avatar
<AnimalAvatar seed={user.id} animal="fox" size={64} /> // the same fox, different look per user
<Placeholder seed={dish.id} category="food" ratio="4/3" />
<Placeholder seed="hero" category="travel" ratio="21/9" label="Hero image" />
<Logo seed="acme" name="Acme" height={28} />
<Logo seed={company.id} />                           // believable fake company + logo
<Icon name="shopping-cart" size={20} />
```

The components have no hooks, so they work in Server Components, SSR and the client.

## Plain HTML (no build step)

```html
<script src="https://cdn.jsdelivr.net/npm/@placeholderkit/core/dist/placeholderkit.global.js"></script>

<img data-placeholderkit="avatar" data-seed="ana@acme.com" width="40" height="40">
<img data-placeholderkit="animal" data-seed="user-7" data-animal="owl" width="64" height="64">
<img data-placeholderkit="placeholder" data-seed="dish-3" data-category="food" data-ratio="4/3">
<img data-placeholderkit="logo" data-seed="acme" data-name="Acme" height="28">
```

Images added to the page later (by a framework or your own script) fill in automatically. The global `PlaceholderKit` object exposes every function below.

## Any framework: functions

```js
import { avatarUrl, animalUrl, placeholderUrl, logoUrl, animalSvg } from "@placeholderkit/core";

avatarUrl({ seed: "ana" });                                 // person; data:image/svg+xml,... for <img src> or CSS
animalUrl({ seed: "u7", animal: "panda" });
placeholderUrl({ seed: "p1", category: "product", ratio: "1/1" });
logoUrl({ seed: "acme", variant: "mark" });
animalSvg({ seed: "u7", animal: "cat" });                  // raw SVG string
```

## Fake data: `@placeholderkit/core/data`

A complete, internally consistent fake business in one call, with images already attached. No schema to write, works in the browser, and the same seed always gives the same data.

```js
import { createWorld } from "@placeholderkit/core/data";

const store = createWorld({ seed: "demo", industry: "ecommerce", size: "small" });
store.business;            // { name: "Daybreak Coffee", logoUrl, tagline, ... }
store.customers[0];        // { name, email, phone, address, avatarUrl, signedUpAt, ... }
store.products[0];         // { name: "Kenya Washed Light Roast", price: 1899, imageUrl, rating, ... }
store.ordersFor(store.customers[0].id);
store.metrics.revenueByMonth;  // [{ month: "2025-11", value: 1868557 }, ...]
store.formatMoney(1899);       // "$18.99"

const app = createWorld({ seed: "demo", industry: "saas", size: "medium" });
app.accounts;  app.users;  app.plans;  app.invoices;  app.activity;  app.tickets;
app.metrics;   // { mrr, arr, churnRate, mrrByMonth, newAccountsByMonth, ... }
```

**Ecommerce** worlds have a business, customers, products, orders (with items, tax, shipping and status), reviews and metrics. **SaaS** worlds have the vendor's business and support team, plans, customer accounts with logos, users, subscriptions, invoices, a 90-day activity feed, support tickets and metrics.

What makes it believable:

- Every reference points to a real record, and money adds up exactly (integer cents: `total === subtotal + tax + shipping`).
- Nothing happens before the business was founded or after `now`; order status matches age; reviews come after delivery.
- Revenue grows over time with a November and December peak; a few customers buy far more than most; ratings average about 4.2 with text that matches the rating and the product.
- SaaS accounts start on a 14-day trial, convert, upgrade, add seats and churn at 2 to 5% a month; invoices match plan prices.
- Customer `i` and product `i` stay the same when you change `size`, so a small prototype can grow without its data reshuffling.

| Option | Values | Default |
|---|---|---|
| `seed` | any string | `"placeholderkit"` |
| `industry` | `ecommerce`, `saas` | `ecommerce` |
| `size` | `small` (25 customers or accounts), `medium` (500), `large` (5,000) | `small` |
| `now` | a date like `"2026-01-15"`; the data never reads the real clock | `"2026-01-15"` |
| `locale` | `en-US`, `en-GB`, `en-IN` (names, addresses, phone formats, tax) | `en-US` |
| `currency` | `USD`, `GBP`, `EUR`, `INR` (money is in minor units) | from `locale` |
| `vertical` (ecommerce) | `apparel`, `home`, `outdoor`, `coffee`, `pets`, `tech-accessories`, `books`, `beauty` | from seed |
| `product` (saas) | `analytics`, `project-management`, `crm`, `support-desk`, `hr`, `dev-tools` | from seed |

Records are plain JSON, so you can pass `world.customers` straight to client components or save it. Helpers live on the world object: `customer(id)`, `product(id)`, `order(id)`, `ordersFor(customerId)`, `reviewsFor(productId)` for stores; `account(id)`, `user(id)`, `plan(id)`, `usersFor`, `subscriptionFor`, `invoicesFor`, `activityFor`, `ticketsFor` (by account id) for SaaS; and `formatMoney(amount)` for both.

### Export to a database

```js
import { createWorld, toJSON, toCSV, toSQL } from "@placeholderkit/core/data";

toSQL(createWorld({ industry: "saas", size: "medium" }), { dialect: "postgres" }); // also "mysql", "sqlite"
toCSV(world);   // { customers: "id,first_name,...", orders: "...", order_items: "..." }
```

Or from the command line:

```bash
npx @placeholderkit/core data --industry saas --size medium --format sql --dialect sqlite > seed.sql
```

See [`examples/dashboard-example.jsx`](examples/dashboard-example.jsx) for a SaaS dashboard built from one `createWorld` call. The data module is about 21 KB gzipped and is only loaded if you import it.

## Options

### Avatar and AnimalAvatar

`<Avatar>` / `avatarUrl` draw people; `<AnimalAvatar>` / `animalUrl` draw animal characters. They're separate so an app that only uses one doesn't download the other's drawings.

| Prop | Values | Default |
|---|---|---|
| `seed` | any string | required |
| `size` | number (px) or CSS length | `40` |
| `shape` | `circle`, `rounded`, `square` | `circle` |
| `background` | any color or `transparent` | picked from seed |
| `hairstyle` (Avatar) | `short`, `long`, `bun`, `curly`, `bob`, `buzz`, `none` | picked from seed |
| `animal` (AnimalAvatar) | `fox`, `cat`, `bear`, `panda`, `rabbit`, `dog`, `owl`, `penguin`, `koala` | picked from seed |
| `expression` (AnimalAvatar) | `happy`, `joy`, `wink`, `sleepy`, `surprised`, `smirk` | picked from seed |
| `accessory` (AnimalAvatar) | `none`, `glasses`, `party-hat`, `bow`, `headphones`, `crown`, `beanie` | picked from seed |

### Placeholder

| Prop | Values | Default |
|---|---|---|
| `seed` | any string | required |
| `category` | `photo`, `food`, `product`, `travel`, `nature`, `people`, `tech`, `fashion`, `home`, `sports`, `music`, `book`, `car`, `pet`, `building`, `map`, `chart`, `document`, `video`, `event` | picked from seed |
| `ratio` | `"16/9"`, `"4:3"`, `1`, ... | `"16/9"` |
| `label` | text drawn on the image | none |
| `glyph` | `false` hides the category symbol | `true` |
| `width` | number (px) or CSS length | fills container |

### Logo

| Prop | Values | Default |
|---|---|---|
| `seed` | any string | required |
| `name` | company name | generated from seed |
| `variant` | `full`, `mark` | `full` |
| `color` | any color | picked from seed |
| `height` | number (px) or CSS length | `32` |

### Icon

`name` takes any [Lucide](https://lucide.dev/icons) icon name in kebab-case or PascalCase. Unknown names show a fallback icon instead of breaking the page. `Icon` loads the full Lucide set, which is fine for prototypes; in production, import icons from `lucide-react` directly.

## For AI website builders

This package ships an [`llms.txt`](llms.txt) describing the full API in a compact form. Point your agent at `https://cdn.jsdelivr.net/npm/@placeholderkit/core/llms.txt`.

## Roadmap

- Photo-style packs (food, products, interiors, people) served from the CDN, same seed API
- More characters and styles
- Vue, Svelte and Solid components
- Figma plugin

## License

MIT for code and all generated images. Lucide icons are ISC licensed.
