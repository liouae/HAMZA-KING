import {useMemo} from 'react';
import {useRouteLoaderData} from 'react-router';
import type {Storefront} from '@shopify/hydrogen';
import {BRANDS, HIDE_EMPTY_COLLECTIONS} from './config';
import {
  FOOTER_COLUMNS,
  NAVIGATION,
  type NavColumn,
  type NavItem,
} from './navigation';
import type {RootLoader} from '~/root';

/**
 * "Live" catalogue: brands, menu links and home tiles only appear once their
 * Shopify collection has at least one product. Add a product → its brand,
 * category and gender pages show up everywhere automatically.
 */
export const EMPTY_COLLECTIONS_QUERY = `#graphql
  query EmptyCollections($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collections(first: 250) {
      nodes {
        handle
        products(first: 1) {
          nodes {
            id
          }
        }
      }
    }
  }
` as const;

/** Handles of collections with no product. Never throws (→ nothing hidden). */
export async function loadEmptyCollections(storefront: Storefront) {
  if (!HIDE_EMPTY_COLLECTIONS) return [] as string[];
  try {
    const data = await storefront.query(EMPTY_COLLECTIONS_QUERY, {
      cache: storefront.CacheShort(),
    });
    return data.collections.nodes
      .filter((c) => c.products.nodes.length === 0)
      .map((c) => c.handle);
  } catch (error) {
    console.error(error);
    return [] as string[];
  }
}

/** '/collections/nike?x=1' → 'nike'; anything else → null. */
export function collectionHandle(to: string) {
  const m = /^\/collections\/([^/?#]+)/.exec(to);
  return m ? m[1] : null;
}

export function liveFilter(empty: Set<string>) {
  const isLive = (to: string) => {
    const h = collectionHandle(to);
    return !h || !empty.has(h);
  };
  const columns = (cols?: NavColumn[]) =>
    cols
      ?.map((c) => ({...c, links: c.links.filter((l) => isLive(l.to))}))
      .filter((c) => c.links.length > 0);
  const nav: NavItem[] = NAVIGATION.filter((item) => isLive(item.to)).map(
    (item) => {
      const cols = columns(item.columns);
      return {
        ...item,
        columns: cols?.length ? cols : undefined,
        feature:
          item.feature && isLive(item.feature.to) ? item.feature : undefined,
        feature2:
          item.feature2 && isLive(item.feature2.to) ? item.feature2 : undefined,
      };
    },
  );
  const brands = BRANDS.filter((b) => !empty.has(b.handle));
  return {
    isLive,
    nav,
    brands,
    footer: columns(FOOTER_COLUMNS) ?? FOOTER_COLUMNS,
  };
}

export function useLive() {
  const root = useRouteLoaderData<RootLoader>('root');
  const key = (root?.emptyCollections ?? []).join(',');
  return useMemo(() => liveFilter(new Set(key ? key.split(',') : [])), [key]);
}
