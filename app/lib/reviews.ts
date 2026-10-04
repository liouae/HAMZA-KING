import type {Storefront} from '@shopify/hydrogen';
import {
  parseReviews,
  type MetaobjectNode,
  type Review,
} from '~/components/ProductReviews';

/**
 * Every published customer review (store + products). Drafts never reach the
 * storefront: a review only shows once it's set to "Active" in Shopify
 * (Content → Metaobjects → Avis client).
 */
export const STORE_REVIEWS_QUERY = `#graphql
  query StoreReviews($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    metaobjects(type: "hk_review", first: 250, sortKey: "updated_at", reverse: true) {
      nodes {
        id
        fields {
          key
          value
          reference {
            __typename
            ... on Product {
              handle
              title
            }
            ... on MediaImage {
              image {
                url
                altText
                width
                height
              }
            }
          }
        }
      }
    }
  }
` as const;

/** All published reviews, newest first. Never throws. */
export async function loadStoreReviews(storefront: Storefront) {
  try {
    const data = await storefront.query(STORE_REVIEWS_QUERY, {
      cache: storefront.CacheShort(),
    });
    return parseReviews(
      (data.metaobjects?.nodes ?? []) as unknown as MetaobjectNode[],
    );
  } catch (error) {
    console.error(error);
    return [] as Review[];
  }
}

/** Merge lists, dropping duplicates (same metaobject id), newest first. */
export function mergeReviews(...lists: Review[][]) {
  const seen = new Set<string>();
  const out: Review[] = [];
  for (const r of lists.flat()) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
  }
  return out.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}
