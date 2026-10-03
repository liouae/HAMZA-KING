import type {Route} from './+types/api.products';
import {PRODUCT_CARD_FRAGMENT} from '~/components/ProductItem';

/**
 * GET /api/products?handles=a,b,c
 * Returns product cards for the given handles (used by "Récemment vus" and the wishlist).
 */
export async function loader({request, context}: Route.LoaderArgs) {
  const url = new URL(request.url);
  const handles = (url.searchParams.get('handles') ?? '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean)
    .slice(0, 12);
  if (!handles.length) return {products: []};
  const query = handles.map((h) => `handle:${h}`).join(' OR ');
  const {products} = await context.storefront.query(PRODUCTS_BY_HANDLE_QUERY, {
    variables: {query, first: handles.length},
    cache: context.storefront.CacheShort(),
  });
  // keep requested order
  const byHandle = new Map(products.nodes.map((p) => [p.handle, p]));
  return {products: handles.map((h) => byHandle.get(h)).filter(Boolean)};
}

const PRODUCTS_BY_HANDLE_QUERY = `#graphql
  ${PRODUCT_CARD_FRAGMENT}
  query ProductsByHandle($query: String!, $first: Int!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    products(first: $first, query: $query) {
      nodes {
        ...ProductCard
      }
    }
  }
` as const;
