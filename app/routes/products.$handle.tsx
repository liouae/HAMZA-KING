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
import {WishlistButton} from '~/components/WishlistButton';
import {
  PRODUCT_CARD_FRAGMENT,
  productSubtitle,
  type CardProduct,
} from '~/components/ProductItem';
import {
  IconBolt,
  IconCash,
  IconChevron,
  IconCushion,
  IconDrop,
  IconFeather,
  IconGrip,
  IconReturn,
  IconShare,
  IconShield,
  IconStar,
  IconTruck,
  IconWhatsApp,
} from '~/components/Icons';
import {BRAND, SHIPPING, whatsappLink} from '~/lib/config';
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

function vendorHandle(vendor: string) {
  return vendor.toLowerCase().replace(/\s+/g, '-');
}

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
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

function loadDeferredData({context, params}: Route.LoaderArgs) {
  const recommended = context.storefront
    .query(RECOMMENDATIONS_QUERY, {variables: {handle: params.handle!}})
    .then((r) => (r.productRecommendations ?? []) as CardProduct[])
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

const BENEFIT_ICONS = {
  cushion: IconCushion,
  grip: IconGrip,
  feather: IconFeather,
  drop: IconDrop,
  bolt: IconBolt,
  shield: IconShield,
};

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

  // Selected variant image first, then the rest.
  const images = (() => {
    const all = product.images.nodes;
    const v = selectedVariant?.image;
    if (!v) return all;
    return [v, ...all.filter((i) => i.url !== v.url)];
  })();

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
                  <span className="stars" aria-hidden>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <IconStar key={i} width={14} height={14} filled={false} />
                    ))}
                  </span>
                  <span>Aucun avis pour le moment</span>
                </a>
              </div>
              <p className="pdp-cod">
                <IconCash width={16} height={16} /> Payable à la livraison ·{' '}
                {SHIPPING.deliveryCasablanca} à Casablanca
              </p>
            </div>

            <ProductForm
              productOptions={productOptions}
              selectedVariant={selectedVariant}
              productTitle={title}
              fitNote={fit}
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
                  <strong>Livraison partout au Maroc</strong>
                  {SHIPPING.deliveryCasablanca} Casablanca ·{' '}
                  {SHIPPING.deliveryMorocco} autres villes · offerte dès{' '}
                  {SHIPPING.freeShippingThreshold} DH
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
                <IconShield />
                <span>
                  <strong>Authenticité garantie</strong>
                  Contrôle en 12 points avant expédition, ou remboursée.
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
                  Commande avant 14h : expédiée le jour même. Paiement en
                  espèces à la livraison ou par carte bancaire en ligne.
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

      {/* Benefits */}
      <section
        className="benefits container"
        aria-label="Bénéfices produit"
        data-reveal
      >
        <div className="benefits-head">
          <p className="eyebrow">Bénéfices</p>
          <h2 className="display-s">Pourquoi cette paire.</h2>
        </div>
        <ul className="benefits-list">
          {benefits.map((b) => {
            const Icon = BENEFIT_ICONS[b.icon] ?? IconShield;
            return (
              <li key={b.title}>
                <span className="benefit-icon">
                  <Icon width={24} height={24} />
                </span>
                <h3>{b.title}</h3>
                <p>{b.copy}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Reviews */}
      <section
        className="reviews container"
        id="avis"
        aria-labelledby="reviews-title"
        data-reveal
      >
        <div className="reviews-head">
          <div>
            <p className="eyebrow">Avis</p>
            <h2 id="reviews-title" className="display-s">
              Ce qu’en disent les clients.
            </h2>
          </div>
          <a
            className="btn btn--ghost"
            href={whatsappLink(
              `Salam ! Je veux laisser un avis sur : ${title}`,
            )}
            target="_blank"
            rel="noreferrer"
          >
            <IconWhatsApp /> Donner mon avis
          </a>
        </div>
        <div className="reviews-empty">
          <p>
            Pas encore d’avis sur ce modèle. Sois le premier à partager ton
            expérience.
          </p>
        </div>
      </section>

      <Suspense fallback={null}>
        <Await resolve={recommended}>
          {(products) =>
            products.length ? (
              <ProductRail
                eyebrow="Tu vas aimer"
                title="Dans le même esprit"
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
