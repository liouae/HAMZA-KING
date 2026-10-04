import type {Route} from './+types/[sitemap.xml]';
import {CITIES} from '~/lib/cities';
import {resolveSiteUrl} from '~/lib/seo';

/**
 * One clean sitemap: only real, indexable URLs on the canonical domain.
 * - collections with at least one product (empty ones are noindex)
 * - every published product, with its images
 * - static pages, delivery + city pages, journal articles
 * No fake locales, no filtered/sorted variants, no policies or private pages.
 */
const STATIC_PATHS = [
  '/',
  '/collections/all',
  '/marques',
  '/livraison',
  '/avis',
  '/pages/faq',
  '/pages/guide-des-tailles',
  '/pages/contact',
  '/pages/a-propos',
  '/blogs/journal',
];

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export async function loader({request, context}: Route.LoaderArgs) {
  const base = resolveSiteUrl(request, context.env);
  const {storefront} = context;

  type Product = {
    handle: string;
    title: string;
    updatedAt: string;
    images: {nodes: {url: string; altText: string | null}[]};
  };
  const products: Product[] = [];
  let after: string | null = null;
  for (let i = 0; i < 10; i++) {
    const res = (await storefront.query(SITEMAP_PRODUCTS_QUERY, {
      variables: {after},
      cache: storefront.CacheShort(),
    })) as {
      products: {
        nodes: Product[];
        pageInfo: {hasNextPage: boolean; endCursor: string | null};
      };
    };
    products.push(...res.products.nodes);
    if (!res.products.pageInfo.hasNextPage) break;
    after = res.products.pageInfo.endCursor;
  }

  const rest = await storefront.query(SITEMAP_REST_QUERY, {
    cache: storefront.CacheShort(),
  });

  const urls: string[] = [];
  const add = (path: string, lastmod?: string, extra = '') =>
    urls.push(
      `<url><loc>${esc(base + (path === '/' ? '' : path))}</loc>${
        lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''
      }${extra}</url>`,
    );

  STATIC_PATHS.forEach((p) => add(p));
  CITIES.forEach((c) => add(`/livraison/${c.handle}`));

  for (const c of rest.collections.nodes) {
    if (c.handle === 'all' || !c.products.nodes.length) continue;
    add(`/collections/${c.handle}`, c.updatedAt);
  }
  for (const p of products) {
    const imgs = p.images.nodes
      .slice(0, 10)
      .map(
        (im) =>
          `<image:image><image:loc>${esc(im.url)}</image:loc><image:title>${esc(
            im.altText || p.title,
          )}</image:title></image:image>`,
      )
      .join('');
    add(`/products/${p.handle}`, p.updatedAt, imgs);
  }
  for (const a of rest.articles.nodes) {
    add(`/blogs/${a.blog.handle}/${a.handle}`, a.publishedAt);
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `public, max-age=${60 * 60 * 6}`,
    },
  });
}

const SITEMAP_PRODUCTS_QUERY = `#graphql
  query SitemapProducts(
    $after: String
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: 250, after: $after) {
      nodes {
        handle
        title
        updatedAt
        images(first: 10) {
          nodes {
            url
            altText
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
` as const;

const SITEMAP_REST_QUERY = `#graphql
  query SitemapRest($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collections(first: 250) {
      nodes {
        handle
        updatedAt
        products(first: 1) {
          nodes {
            id
          }
        }
      }
    }
    articles(first: 250, sortKey: PUBLISHED_AT, reverse: true) {
      nodes {
        handle
        publishedAt
        blog {
          handle
        }
      }
    }
  }
` as const;
