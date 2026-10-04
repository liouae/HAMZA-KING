# HAMZAKINGSTORE

Premium sneaker storefront for Morocco, built with **Shopify Hydrogen** (React + React Router) and deployed on **Oxygen**.

Warm monochrome design, French copy, prices in DH, cash-on-delivery messaging, WhatsApp ordering and Meta Pixel tracking built in.

---

## How the store works

- **Payment:** cash on delivery only. In Shopify: Settings → Payments → _Manual payment methods_ → **Cash on Delivery (COD)** on, every other provider off.
- **Delivery:** free for every order in Morocco (shipping rate "Livraison gratuite partout au Maroc", 0 DH).
- **Storefront:** this Hydrogen app is the site. The Online Store channel runs the tiny redirect theme in `theme/redirect`, which forwards every visit of the store's address to the Hydrogen site. When the domain changes: Online Store → Themes → Customize → Theme settings → _Adresse du site Hydrogen_.
- Every push to `main` deploys automatically.

## Adding a product (everything else is automatic)

| Field in Shopify | What to put                                                                                                                                                                                       | Effect on the site                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Vendor**       | Brand, spelled exactly: `Nike`, `Jordan`, `Adidas`, `New Balance`, `Asics`, `Puma`, `On`, `Hoka`, `Converse`, `Vans`, `Reebok`, `Lacoste`, `The North Face`, `Dior`, `Louis Vuitton`, `Off-White` | Brand page, Marques menu, brand filter                                |
| **Product type** | `Running`, `Lifestyle`, `Basketball` or `Outdoor`                                                                                                                                                 | Category page and home tiles                                          |
| **Tags**         | `homme` / `femme` / `enfant` (+ `bebe`, `junior`)                                                                                                                                                 | Homme / Femme / Enfant and the combined pages (Homme Running…)        |
| Tags (optional)  | `running`, `lifestyle`… (same as type), `plateforme`, `limited`, `restock`, `luxe`, `icone`, `originals`                                                                                          | Extra pages; `icone` = "Les icônes" on the home page                  |
| **Options**      | `Couleur` and `Pointure` (EU sizes)                                                                                                                                                               | Colour photo tiles + size grid                                        |
| **Photos**       | Give each variant its photo, or write the colour name in each photo's alt text                                                                                                                    | Colour tiles show the shoe; the gallery switches to the chosen colour |
| Compare-at price | Old price                                                                                                                                                                                         | "Promo" badge + Promo page                                            |

"Nouveau" badges appear automatically for 30 days after publishing. Dior, Louis Vuitton and Off-White go to **Luxe** automatically.

### Product page extras (Metafields, at the bottom of the product page in Shopify)

| Field                   | Shown as                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| Fit (conseil de taille) | Note under the size grid                                                                           |
| Story (intro)           | Intro line + text of the feature block                                                             |
| Poids / Drop            | Rows of the feature block                                                                          |
| Bénéfices (JSON)        | The 3 captions under the split photo: `[{"icon":"cushion","title":"…","copy":"…"}]`                |
| Caractéristiques (JSON) | Extra rows in "Caractéristiques"                                                                   |
| **Avis clients**        | Customer reviews: _Add entry_ → name, city, rating 1–5, text, size bought, date, verified purchase |

Without metafields the page uses sensible defaults for the product type.

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
