/**
 * HAMZA KING — SEO helpers. One place builds titles, canonicals, robots,
 * Open Graph and JSON-LD so every route follows the same rules:
 *
 * - The site URL is PUBLIC_SITE_URL if set, otherwise SITE.url
 *   (https://hamzaking.com). Every other host (*.myshopify.dev preview) points
 *   its canonicals there and is blocked in robots.txt.
 * - Filtered, sorted, paginated or searched URLs are `noindex, follow` and
 *   canonicalise to the clean path, so Google sees one URL per page.
 * - Titles put the keyword first and the brand last.
 */
import {BRAND, SHIPPING, SOCIALS, WHATSAPP_NUMBER} from './config';
import {SITE} from './content';

type Match = {id: string; data?: unknown} | undefined;

/** Base URL (no trailing slash) from the root loader. */
export function siteUrl(matches: Match[] | undefined) {
  const root = matches?.find((m) => m?.id === 'root')?.data as
    {siteUrl?: string} | undefined;
  return (root?.siteUrl || SITE.url || '').replace(/\/$/, '');
}

/** Resolve the canonical site URL server-side. */
export function resolveSiteUrl(request: Request, env: Env) {
  const fromEnv = (env.PUBLIC_SITE_URL || '').trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (SITE.url) return SITE.url.replace(/\/$/, '');
  const url = new URL(request.url);
  const proto =
    url.hostname === 'localhost' || url.hostname === '127.0.0.1'
      ? url.protocol
      : 'https:';
  return `${proto}//${url.host}`;
}

/** Query params that create duplicate versions of a listing page. */
const DUPLICATE_PARAMS = [
  'filter',
  'sort',
  'cursor',
  'direction',
  'price.min',
  'price.max',
  'page',
  'q',
  'variant',
  'utm_source',
  'fbclid',
];
export function isDuplicateVariant(search: string) {
  const p = new URLSearchParams(search);
  return [...p.keys()].some(
    (k) => DUPLICATE_PARAMS.includes(k) || k.startsWith('filter.'),
  );
}

/** Title with the keyword first and the brand last, kept under ~65 chars. */
export function seoTitle(main: string) {
  const clean = main.replace(/\s*\|\s*HAMZA KING\s*$/i, '').trim();
  const withBrand = `${clean} | ${BRAND.name}`;
  return withBrand.length <= 65 ? withBrand : clean;
}

export function clip(text: string | null | undefined, max = 155) {
  const t = (text ?? '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

type MetaArgs = {
  matches: Match[] | undefined;
  location?: {pathname: string; search: string};
  title: string;
  description?: string | null;
  /** Path of the canonical URL (defaults to location.pathname). */
  path?: string;
  image?: string | null;
  type?: 'website' | 'product' | 'article';
  noindex?: boolean;
  jsonLd?: Record<string, unknown>[];
  /** Keep the brand-last suffix off (title already complete). */
  rawTitle?: boolean;
};

/** Full meta array for a route. */
export function seoMeta(a: MetaArgs) {
  const base = siteUrl(a.matches);
  const path = a.path ?? a.location?.pathname ?? '/';
  const url = `${base}${path === '/' ? '' : path}` || base;
  const title = a.rawTitle ? a.title : seoTitle(a.title);
  const description = clip(a.description ?? BRAND.tagline);
  const duplicate = a.location ? isDuplicateVariant(a.location.search) : false;
  const noindex = a.noindex || duplicate;
  const image = a.image
    ? a.image
    : base
      ? `${base}/brand/og-image.jpg`
      : undefined;

  const tags: Record<string, unknown>[] = [
    {title},
    {name: 'description', content: description},
    {tagName: 'link', rel: 'canonical', href: url || path},
    {property: 'og:site_name', content: BRAND.name},
    {property: 'og:locale', content: SITE.locale},
    {property: 'og:type', content: a.type ?? 'website'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:url', content: url},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: title},
    {name: 'twitter:description', content: description},
  ];
  if (image) {
    tags.push(
      {property: 'og:image', content: image},
      {name: 'twitter:image', content: image},
    );
  }
  if (noindex) tags.push({name: 'robots', content: 'noindex, follow'});
  for (const j of a.jsonLd ?? []) tags.push({'script:ld+json': j});
  return tags;
}

/* ---------------- JSON-LD builders ---------------- */

export const ids = (base: string) => ({
  org: `${base}/#organization`,
  site: `${base}/#website`,
  returns: `${base}/#returns`,
  shipping: `${base}/#shipping`,
});

/** Free delivery anywhere in Morocco, 1–3 business days. */
export function shippingDetails() {
  return {
    '@type': 'OfferShippingDetails',
    shippingRate: {'@type': 'MonetaryAmount', value: 0, currency: 'MAD'},
    shippingDestination: {'@type': 'DefinedRegion', addressCountry: 'MA'},
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: {
        '@type': 'QuantitativeValue',
        minValue: 0,
        maxValue: 1,
        unitCode: 'DAY',
      },
      transitTime: {
        '@type': 'QuantitativeValue',
        minValue: 1,
        maxValue: 3,
        unitCode: 'DAY',
      },
    },
  };
}

/** Free size exchange within 7 days (pickup and new pair at our cost). */
export function returnPolicy() {
  return {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'MA',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: SHIPPING.returnDays,
    returnFees: 'https://schema.org/FreeReturn',
    returnMethod: 'https://schema.org/ReturnAtKiosk',
    refundType: 'https://schema.org/ExchangeRefund',
  };
}

export function organizationLd(base: string) {
  const i = ids(base);
  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': i.org,
    name: BRAND.name,
    url: base,
    logo: `${base}/brand/icon-512.png`,
    image: `${base}/brand/og-image.jpg`,
    description: BRAND.tagline,
    email: BRAND.email || undefined,
    telephone: `+${WHATSAPP_NUMBER}`,
    areaServed: {'@type': 'Country', name: 'Maroc'},
    address: {
      '@type': 'PostalAddress',
      addressLocality: SITE.city,
      addressCountry: 'MA',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: `+${WHATSAPP_NUMBER}`,
      availableLanguage: ['French', 'Arabic'],
      areaServed: 'MA',
    },
    sameAs: SOCIALS.filter((s) => s.url).map((s) => s.url),
    hasMerchantReturnPolicy: returnPolicy(),
    paymentAccepted: 'Cash',
    currenciesAccepted: 'MAD',
  };
}

export function websiteLd(base: string) {
  const i = ids(base);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': i.site,
    url: base,
    name: BRAND.name,
    inLanguage: 'fr-MA',
    publisher: {'@id': i.org},
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${base}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbLd(
  base: string,
  items: {name: string; path?: string}[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      ...(it.path ? {item: `${base}${it.path === '/' ? '' : it.path}`} : {}),
    })),
  };
}

export function faqLd(faq: {q: string; a: string}[]) {
  if (!faq.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {'@type': 'Answer', text: f.a},
    })),
  };
}

export function itemListLd(
  base: string,
  name: string,
  path: string,
  products: {handle: string; title: string}[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url: `${base}${path}`,
    isPartOf: {'@id': ids(base).site},
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.slice(0, 30).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${base}/products/${p.handle}`,
        name: p.title,
      })),
    },
  };
}
