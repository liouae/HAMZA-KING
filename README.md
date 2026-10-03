# HAMZAKINGSTORE

Premium sneaker storefront for Morocco, built with **Shopify Hydrogen** (React + React Router) and deployed on **Oxygen**.

Warm monochrome design, French copy, prices in DH, cash-on-delivery messaging, WhatsApp ordering and Meta Pixel tracking built in.

---

## Taking over this storefront with a new Shopify store

This repo is the complete storefront: code, design, logos and photos. It contains **no secrets and no store data**. Products, collections and settings live in Shopify, so a new owner connects the code to their own store in about 30 minutes.

### 1. Get the code

```bash
git clone <this repo>
cd HAMZAKINGSTORE
npm install
```

### 2. Prepare the Shopify store

In the Shopify admin of the **new** store:

1. **Settings → Markets**: add Morocco, currency MAD.
2. **Settings → Payments → Manual payment methods**: enable _Cash on Delivery_.
3. **Apps**: install **Hydrogen** (sales channel) and **Search & Discovery**.
4. **Settings → Apps and sales channels → Develop apps → Create an app**, name it "Setup", give it the Admin API scopes `write_products`, `read_products`, `write_publications`, `read_publications`, `write_metafields`, install it and copy the Admin API access token.

### 3. Create the collections and metafields (one command)

```bash
SHOPIFY_STORE=your-store.myshopify.com SHOPIFY_ADMIN_TOKEN=shpat_xxx node scripts/setup-store.mjs
```

This creates the 40-odd smart collections the menus link to (Homme, Femme, Running, every brand, Homme Running, Promo, Limited, Luxe…), publishes them to your sales channels, and adds the optional product metafields. It skips anything that already exists, so you can re-run it. You can then delete the "Setup" app.

### 4. Add products

- One option named `Pointure` (or `Size`) with EU sizes; a `Couleur` option if you sell several colours.
- **Vendor** = brand name, spelled exactly as in `app/lib/config.ts` (`Nike`, `New Balance`, `The North Face`…). That alone puts the product on its brand page.
- **Tags** sort the product into the rest of the menus:

| Tag                                                | Puts the product in                                         |
| -------------------------------------------------- | ----------------------------------------------------------- |
| `homme` / `femme` / `enfant` / `bebe` / `junior`   | Homme, Femme, Enfant, Bébé, Junior                          |
| `running` / `lifestyle` / `basketball` / `outdoor` | the category (and e.g. `homme` + `running` → Homme Running) |
| `plateforme` (with `femme`)                        | Femme Plateformes                                           |
| `new`                                              | "Nouveau" badge                                             |
| `icone`                                            | "Les icônes" rail on the home page                          |
| `restock` / `limited` / `luxe`                     | Retour en stock / Éditions limitées / Luxe                  |

A "compare-at" price puts it in **Promo** automatically.

In **Search & Discovery**, enable the filters Availability, Price, Vendor, `Pointure` and `Couleur`.

### 5. Deploy

In the **Hydrogen** channel: _Create storefront → Connect GitHub repository_ and pick this repo. Shopify adds its own deployment workflow and token for your store; from then on **every push to `main` deploys**. The existing `.github/workflows/oxygen-deployment-*.yml` belongs to the previous store: delete it once yours is in place.

Environment variables (store domain, Storefront API token, session secret) are filled in by the Hydrogen channel. Add `PUBLIC_META_PIXEL_ID` yourself under _Storefront settings → Environment variables_.

### 6. Make it yours

Everything below is plain text in two files, no React knowledge needed:

- `app/lib/config.ts`: store name, **WhatsApp number**, Instagram/TikTok links, e-mail, free-delivery threshold, delivery times, announcement bar, the brand list and logos, the four home-page tiles.
- `app/lib/content.ts`: hero text, the two story blocks, the authenticity band, FAQ, delivery table, the à-propos / authenticité / contact / size-guide pages, and `PHOTOS` / `COLLECTION_IMAGES` (which photo goes where).

Swap a photo by replacing the file in `public/home/` (full size + `-800` version, keep the names). Brand logos are black-on-transparent PNGs in `public/brands/`. Your own logos go in `public/brand/` (see `app/components/BrandLogo.tsx` for the variants).

---

## Pages

- **Home**: campaign hero, brand ticker, "Nouveautés" and "Best-sellers" carousels, 4 category tiles, two story blocks, authenticity band, promos, brand index, service strip.
- **Collection**: photo banner, sticky toolbar, sort, filter sidebar (size grid, brand, colour, availability, price) driven by Search & Discovery, quick-add sizes on hover, density toggle, mobile filter drawer.
- **Product**: editorial gallery with zoom, EU size grid with sold-out sizes crossed out, size guide, benefits and specs, add to cart, "Commander sur WhatsApp", delivery/returns/authenticity info, recommendations, sticky mobile buy bar.
- **Marques**: brand directory with logos, photos and search. Mega-menu with a visual brand panel.
- **Cart drawer**: free-delivery progress bar, quantity steppers, promo codes, COD reassurance.
- Wishlist, recently viewed, predictive search, cookie consent (gates the Meta Pixel), floating WhatsApp button, JSON-LD, FR account pages.

## Where to edit things

| What                                                                                                                            | File                           |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Brand name, WhatsApp number, shipping rules, announcement bar, brands & logos, category tiles                                   | `app/lib/config.ts`            |
| Hero, story blocks, editorial band, icon models, guides, popular categories, delivery table, FAQ, built-in pages, photo mapping | `app/lib/content.ts`           |
| Mega-menu and footer links                                                                                                      | `app/lib/navigation.ts`        |
| Colours, fonts, spacing (design tokens at the top)                                                                              | `app/styles/app.css`           |
| Size chart                                                                                                                      | `app/components/SizeGuide.tsx` |
| Store setup script (collections, metafields)                                                                                    | `scripts/setup-store.mjs`      |

## Product page extras (optional metafields, namespace `custom`)

| Metafield key    | Type                                               | Shown as                                                                |
| ---------------- | -------------------------------------------------- | ----------------------------------------------------------------------- |
| `fit`            | text                                               | Fit note under the size grid ("Taille un peu petit…")                   |
| `story`          | text                                               | Bold intro line in the description                                      |
| `weight`, `drop` | text                                               | Rows in "Caractéristiques"                                              |
| `benefits`       | JSON `[{"icon":"cushion","title":"…","copy":"…"}]` | The 3 benefit cards (icons: cushion, grip, feather, drop, bolt, shield) |
| `specs`          | JSON `[{"label":"…","value":"…"}]`                 | Extra rows in "Caractéristiques"                                        |

Without metafields the page falls back to sensible defaults based on the category tag.

## Images

- A collection image set in Shopify admin always wins; otherwise the photo mapped in `COLLECTION_IMAGES`; otherwise the first product photo.
- Home-page slots (`CAMPAIGN.image`, `CATEGORIES[].image`, `STORIES[].image`, `EDITORIAL.image`) point to files in `public/home/`. Leave one empty to fall back to Shopify images.

## Local development

```bash
npm install
npx shopify hydrogen link   # connect to your store
npm run dev
```

`npm run typecheck` and `npm run build` before pushing.
