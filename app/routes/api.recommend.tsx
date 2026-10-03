import type {Route} from './+types/api.recommend';
import {PRODUCT_CARD_FRAGMENT} from '~/components/ProductItem';

/** GET /api/recommend?handle=x — product recommendations for the cart upsell. */
export async function loader({request, context}: Route.LoaderArgs) {
  const handle = new URL(request.url).searchParams.get('handle');
  if (!handle) return {products: []};
  const data = await context.storefront
    .query(RECOMMEND_QUERY, {
      variables: {handle},
      cache: context.storefront.CacheShort(),
    })
    .catch(() => ({productRecommendations: []}));
  return {products: (data.productRecommendations ?? []).slice(0, 6)};
}

const RECOMMEND_QUERY = `#graphql
  ${PRODUCT_CARD_FRAGMENT}
  query CartRecommend($handle: String!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    productRecommendations(productHandle: $handle) {
      ...ProductCard
    }
  }
` as const;
