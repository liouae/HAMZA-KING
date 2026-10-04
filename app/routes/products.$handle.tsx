import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/products.$handle';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {Suspense, useEffect, useRef, useState} from 'react';
import {Await, Link} from 'react-router';
import {Price, formatMoney} from '~/components/Price';
import {ProductForm} from '~/components/ProductForm';
import {ProductGallery} from '~/components/ProductGallery';
import {ProductRail} from '~/components/ProductRail';
import {RecentlyViewed} from '~/components/RecentlyViewed';
import {ProductShowcase} from '~/components/ProductShowcase';
import {
  ProductReviews,
  Stars,
  parseReviews,
  reviewStats,
} from '~/components/ProductReviews';
import {WishlistButton} from '~/components/WishlistButton';
import {
  PRODUCT_CARD_FRAGMENT,
  productSubtitle,
  type CardProduct,
} from '~/components/ProductItem';
import {
  IconCash,
  IconChevron,
  IconReturn,
  IconShare,
  IconShield,
  IconTruck,
} from '~/components/Icons';
import {BRAND, SHIPPING, isColorOption, whatsappLink} from '~/lib/config';
import {
  BENEFITS_BY_TAG,
  DELIVERY_ROWS,
  SITE,
  type Benefit,
} from '~/lib/content';
import {pushRecentlyViewed} from '~/lib/ui';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';

export const meta: Route.MetaFunction = ({data}) => {
  const p = data?.product;
  if (!p) return [{title: BRAND.name}];
  const title = `${p.seo?.title || p.title} | ${BRAND.name}`;
  const description = p.seo?.description || p.description?.slice(0, 155) || '';
  const image = p.images?.nodes?.[0]?.url ?? '';
  const variant = p.selectedOrFirstAvailableVariant;
  const stats = reviewStats(
    parseReviews(p.reviews?.references?.nodes as never),
  );
  return [
    {title},
    {name: 'description', content: description},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:image', content: image},
    {property: 'og:type', content: 'product'},
    {property: 'product:price:amount', content: variant?.price.amount ?? ''},
    {
      property: 'product:price:currency',
      content: variant?.price.currencyCode ?? 'MAD',
    },
    {
      tagName: 'link',
      rel: 'canonical',
      href: `${SITE.url}/products/${p.handle}`,
    },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: p.title,
        brand: {'@type': 'Brand', name: p.vendor},
        description: p.description,
        image: p.images?.nodes?.map((i) => i.url) ?? [],
        sku: variant?.sku ?? undefined,
        url: `${SITE.url}/products/${p.handle}`,
        ...(stats.count
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: stats.average.toFixed(1),
                reviewCount: stats.count,
              },
            }
          : {}),
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: p.priceRange?.minVariantPrice?.currencyCode ?? 'MAD',
          lowPrice: p.priceRange?.minVariantPrice?.amount,
          highPrice: p.priceRange?.maxVariantPrice?.amount,
          availability: variant?.availableForSale
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          url: `${SITE.url}/products/${p.handle}`,
          seller: {'@type': 'Organization', name: BRAND.name},
        },
      },
    },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {'@type': 'ListItem', position: 1, name: 'Accueil', item: SITE.url},
          {
            '@type': 'ListItem',
            position: 2,
            name: p.vendor,
            item: `${SITE.url}/collections/${vendorHandle(p.vendor)}`,
          },
          {'@type': 'ListItem', position: 3, name: p.title},
        ],
      },
    },
  ];
};

/** First ~3 sentences of the plain-text description. */
function plainIntro(text?: string | null) {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= 420) return clean;
  const cut = clean.slice(0, 420);
  return cut.slice(0, cut.lastIndexOf('.') + 1 || cut.lastIndexOf(' ')) + '';
}

/**
 * A photo belongs to a colour when its alt text is the colour name, or ends
 * with it after a separator ("Nike Vomero Plus — Noir"). "Noir" therefore
 * does not match "… — Noir/Blanc".
 */
function altMatchesColor(alt: string | null | undefined, color: string) {
  const a = (alt ?? '').toLowerCase().trim();
  const c = color.toLowerCase().trim();
  if (!a || !c) return false;
  if (a === c) return true;
  return [' — ', ' – ', ' - ', ': ', ' | '].some((sep) =>
    a.endsWith(`${sep}${c}`),
  );
}

function vendorHandle(vendor: string) {
  return vendor.toLowerCase().replace(/\s+/g, '-');
}

export async function loader(args: Route.LoaderArgs) {
  const criticalData = await loadCriticalData(args);
  const deferredData = loadDeferredData(args, criticalData.product);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;
  if (!handle) throw new Error('Expected product handle to be defined');

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
  ]);
  if (!product?.id) throw new Response(null, {status: 404});
  redirectIfHandleIsLocalized(request, {handle, data: product});
  return {product};
}

function loadDeferredData(
  {context, params}: Route.LoaderArgs,
  product: {id: string; vendor: string; productType: string},
) {
  const {storefront} = context;
  // Shopify's own recommendations first; when the catalogue is still small
  // they can be empty, so fall back to the same type, then the same brand.
  const recommended = storefront
    .query(RECOMMENDATIONS_QUERY, {variables: {handle: params.handle!}})
    .then(async (r) => {
      const recs = (r.productRecommendations ?? []) as CardProduct[];
      if (recs.length >= 4) return recs;
      const terms = [
        product.productType ? `product_type:'${product.productType}'` : '',
        product.vendor ? `vendor:'${product.vendor}'` : '',
      ].filter(Boolean);
      const more = terms.length
        ? await storefront
            .query(SIMILAR_PRODUCTS_QUERY, {
              variables: {query: terms.join(' OR ')},
            })
            .then((x) => x.products.nodes as CardProduct[])
        : [];
      const seen = new Set([product.id, ...recs.map((p) => p.id)]);
      return [...recs, ...more.filter((p) => !seen.has(p.id))].slice(0, 12);
    })
    .catch((error: Error) => {
      console.error(error);
      return [] as CardProduct[];
    });
  return {recommended};
}

/* ---------- metafield helpers ---------- */
type Metafield = {key: string; value: string} | null;
function mf(fields: Metafield[], key: string) {
  return fields.find((f) => f?.key === key)?.value ?? '';
}
function mfJson<T>(fields: Metafield[], key: string, fallback: T): T {
  const raw = mf(fields, key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function Product() {
  const {product, recommended} = useLoaderData<typeof loader>();

  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const {title, descriptionHtml, vendor} = product;
  const fields = (product.metafields ?? []) as Metafield[];
  const subtitle = productSubtitle(product as unknown as CardProduct);
  const tags = (product.tags ?? []).map((t) => t.toLowerCase());
  const categoryTag = ['running', 'lifestyle', 'basketball', 'outdoor'].find(
    (t) => tags.includes(t),
  );
  const benefits = mfJson<Benefit[]>(
    fields,
    'benefits',
    BENEFITS_BY_TAG[categoryTag ?? 'default'],
  );
  const fit =
    mf(fields, 'fit') || 'Taille normalement. Garde ta pointure habituelle.';
  const specsExtra = mfJson<{label: string; value: string}[]>(
    fields,
    'specs',
    [],
  );
  const story = mf(fields, 'story');

  const colorValue = selectedVariant?.selectedOptions.find((o) =>
    ['couleur', 'color', 'colour', 'coloris'].includes(o.name.toLowerCase()),
  )?.value;

  const specs = [
    {
      label: 'Référence',
      value: selectedVariant?.sku || product.handle.toUpperCase(),
    },
    {label: 'Marque', value: vendor},
    {label: 'Catégorie', value: subtitle},
    ...(colorValue ? [{label: 'Coloris', value: colorValue}] : []),
    ...(mf(fields, 'weight')
      ? [{label: 'Poids', value: mf(fields, 'weight')}]
      : []),
    ...(mf(fields, 'drop') ? [{label: 'Drop', value: mf(fields, 'drop')}] : []),
    ...specsExtra,
  ];

  const showcaseSpecs = [
    ...(mf(fields, 'drop')
      ? [{label: 'Valeur de drop', value: mf(fields, 'drop')}]
      : []),
    ...(mf(fields, 'weight')
      ? [{label: 'Poids unitaire', value: mf(fields, 'weight')}]
      : []),
    ...(colorValue ? [{label: 'Coloris', value: colorValue}] : []),
    {label: 'Marque', value: vendor},
  ].slice(0, 4);

  // Gallery: when photos are tagged with the colour name in their alt text,
  // show only the selected colour's photos; selected variant image first.
  const images = (() => {
    const all = product.images.nodes;
    const forColor = colorValue
      ? all.filter((i) => altMatchesColor(i.altText, colorValue))
      : [];
    const pool = forColor.length ? forColor : all;
    const v = selectedVariant?.image;
    if (!v) return pool;
    return [v, ...pool.filter((i) => i.url !== v.url)];
  })();

  // Colour swatch photos: the variant's own image, else a product photo whose
  // alt text names the colour.
  const colorImages: Record<string, string> = {};
  for (const option of product.options) {
    if (!isColorOption(option.name)) continue;
    for (const v of option.optionValues) {
      const byAlt = product.images.nodes.find((i) =>
        altMatchesColor(i.altText, v.name),
      );
      const url =
        v.swatch?.image?.previewImage?.url ||
        v.firstSelectableVariant?.image?.url ||
        byAlt?.url;
      if (url) colorImages[v.name] = url;
    }
  }

  const reviews = parseReviews(product.reviews?.references?.nodes as never);
  const rating = reviewStats(reviews);

  const qty = selectedVariant?.quantityAvailable ?? null;
  const lowStock = qty !== null && qty > 0 && qty <= 5;

  const buyRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  useEffect(() => {
    const el = buyRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) =>
      setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0),
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    pushRecentlyViewed(product.handle);
  }, [product.handle]);

  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({title, url});
        return;
      } catch {
        /* cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareState('copied');
      setTimeout(() => setShareState('idle'), 1800);
    } catch {
      window.open(whatsappLink(`${title} — ${url}`), '_blank');
    }
  };

  const wishItem = {
    handle: product.handle,
    title,
    vendor,
    image: images[0]?.url,
    price: selectedVariant?.price,
  };

  return (
    <div className="pdp">
      <nav className="crumbs container" aria-label="Fil d’Ariane">
        <Link to="/">Accueil</Link>
        <span>/</span>
        {vendor ? (
          <>
            <Link to={`/collections/${vendorHandle(vendor)}`}>{vendor}</Link>
            <span>/</span>
          </>
        ) : null}
        <span aria-current="page">{title}</span>
      </nav>

      <div className="pdp-grid container">
        <ProductGallery images={images} title={title} />

        <div className="pdp-panel">
          <div className="pdp-panel-inner" ref={buyRef}>
            <div className="pdp-head">
              <div className="pdp-head-row">
                {vendor ? (
                  <Link
                    to={`/collections/${vendorHandle(vendor)}`}
                    className="pdp-vendor"
                  >
                    {vendor}
                  </Link>
                ) : null}
                <div className="pdp-head-actions">
                  <button
                    className="icon-btn"
                    onClick={() => void share()}
                    aria-label="Partager"
                  >
                    <IconShare />
                    {shareState === 'copied' ? (
                      <span className="pdp-copied">Lien copié</span>
                    ) : null}
                  </button>
                  <WishlistButton item={wishItem} className="icon-btn" />
                </div>
              </div>
              <h1 className="pdp-title">{title}</h1>
              <p className="pdp-sub">{subtitle}</p>
              <div className="pdp-price-row">
                <Price
                  price={selectedVariant?.price}
                  compareAtPrice={selectedVariant?.compareAtPrice}
                  className="pdp-price"
                />
                <a
                  href="#avis"
                  className="pdp-rating"
                  aria-label="Voir les avis"
                >
                  <Stars value={rating.average} />
                  <span>
                    {rating.count
                      ? `${rating.average.toFixed(1).replace('.', ',')} · ${rating.count} avis`
                      : 'Aucun avis pour le moment'}
                  </span>
                </a>
              </div>
              <p className="pdp-cod">
                <IconCash width={16} height={16} /> Paiement à la livraison ·
                Livraison gratuite
              </p>
            </div>

            <ProductForm
              productOptions={productOptions}
              selectedVariant={selectedVariant}
              productTitle={title}
              fitNote={fit}
              colorImages={colorImages}
              stockMessage={
                !selectedVariant?.availableForSale
                  ? 'Cette pointure est épuisée. Choisis-en une autre ou écris-nous : on te prévient dès le retour en stock.'
                  : lowStock
                    ? `Plus que ${qty} en stock dans cette pointure.`
                    : ''
              }
            />

            <ul className="pdp-perks">
              <li>
                <IconTruck />
                <span>
                  <strong>Livraison gratuite partout au Maroc</strong>
                  {SHIPPING.deliveryCasablanca} Casablanca ·{' '}
                  {SHIPPING.deliveryMorocco} autres villes
                </span>
              </li>
              <li>
                <IconReturn />
                <span>
                  <strong>Échange sous {SHIPPING.returnDays} jours</strong>
                  Pas la bonne pointure ? On l’échange, on vient la chercher.
                </span>
              </li>
              <li>
                <IconCash />
                <span>
                  <strong>Paiement à la livraison</strong>
                  Tu reçois ta paire, tu la vérifies, puis tu payes en espèces.
                </span>
              </li>
            </ul>

            <div className="accordions">
              <Accordion title="Description" defaultOpen>
                {story ? <p className="pdp-story">{story}</p> : null}
                <div
                  className="rte"
                  dangerouslySetInnerHTML={{__html: descriptionHtml}}
                />
              </Accordion>
              <Accordion title="Caractéristiques">
                <dl className="specs">
                  {specs.map((s) => (
                    <div key={s.label}>
                      <dt>{s.label}</dt>
                      <dd>{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </Accordion>
              <Accordion title="Livraison & paiement">
                <table className="delivery">
                  <thead>
                    <tr>
                      <th>Zone</th>
                      <th>Délai</th>
                      <th>Frais</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DELIVERY_ROWS.map((r) => (
                      <tr key={r.zone}>
                        <td>{r.zone}</td>
                        <td>{r.delay}</td>
                        <td>
                          {r.price}
                          <small> · {r.note}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p>
                  Commande avant 14h : expédiée le jour même. Livraison
                  gratuite, paiement uniquement en espèces à la livraison : tu
                  vérifies ta paire, puis tu payes.
                </p>
              </Accordion>
              <Accordion title="Échanges & retours">
                <p>
                  Tu as {SHIPPING.returnDays} jours après réception pour
                  échanger ta paire, non portée et dans sa boîte d’origine.
                  Contacte-nous sur WhatsApp, on organise la récupération.
                </p>
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      <ProductShowcase
        title={title}
        intro={story || plainIntro(product.description)}
        reference={selectedVariant?.sku || undefined}
        specs={showcaseSpecs}
        benefits={benefits}
        image={images[0]}
      />

      <ProductReviews reviews={reviews} productTitle={title} />

      <Suspense fallback={null}>
        <Await resolve={recommended}>
          {(products) =>
            products.length ? (
              <ProductRail
                eyebrow="Recommandations"
                title="Tu vas aimer aussi"
                products={products}
              />
            ) : null
          }
        </Await>
      </Suspense>

      <RecentlyViewed exclude={product.handle} />

      <div
        className={`sticky-buy ${showSticky ? 'is-visible' : ''}`}
        aria-hidden={!showSticky}
      >
        <div className="sticky-buy-info">
          <span className="sticky-buy-title">{title}</span>
          <span className="sticky-buy-price">
            {formatMoney(selectedVariant?.price)}
          </span>
        </div>
        <button
          className="btn"
          tabIndex={showSticky ? 0 : -1}
          onClick={() =>
            buyRef.current?.scrollIntoView({behavior: 'smooth', block: 'start'})
          }
        >
          Choisir ma pointure
        </button>
      </div>

      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </div>
  );
}

function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="accordion" open={defaultOpen}>
      <summary>
        {title}
        <IconChevron width={18} height={18} />
      </summary>
      <div className="accordion-body">{children}</div>
    </details>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    quantityAvailable
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    productType
    tags
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    images(first: 12) {
      nodes {
        __typename
        id
        url
        altText
        width
        height
      }
    }
    metafields(identifiers: [
      {namespace: "custom", key: "fit"},
      {namespace: "custom", key: "benefits"},
      {namespace: "custom", key: "specs"},
      {namespace: "custom", key: "story"},
      {namespace: "custom", key: "weight"},
      {namespace: "custom", key: "drop"}
    ]) {
      key
      value
    }
    reviews: metafield(namespace: "custom", key: "reviews") {
      references(first: 100) {
        nodes {
          ... on Metaobject {
            id
            fields {
              key
              value
            }
          }
        }
      }
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;

const RECOMMENDATIONS_QUERY = `#graphql
  ${PRODUCT_CARD_FRAGMENT}
  query ProductRecommendations(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
  ) @inContext(country: $country, language: $language) {
    productRecommendations(productHandle: $handle) {
      ...ProductCard
    }
  }
` as const;

const SIMILAR_PRODUCTS_QUERY = `#graphql
  ${PRODUCT_CARD_FRAGMENT}
  query SimilarProducts(
    $country: CountryCode
    $language: LanguageCode
    $query: String!
  ) @inContext(country: $country, language: $language) {
    products(first: 12, query: $query, sortKey: BEST_SELLING) {
      nodes {
        ...ProductCard
      }
    }
  }
` as const;
