import {seoMeta} from '~/lib/seo';
import type {Route} from './+types/collections.all';
import {useLoaderData} from 'react-router';
import {getPaginationVariables} from '@shopify/hydrogen';
import {
  PRODUCT_CARD_FRAGMENT,
  type CardProduct,
} from '~/components/ProductItem';
import {COLLECTION_IMAGES} from '~/lib/content';
import {CollectionView, type Filter} from '~/components/CollectionView';
import {
  FILTERS_SELECTION,
  collectionSortVars,
  getFilters,
  getSort,
  productSortVars,
} from '~/lib/collection';

export const meta: Route.MetaFunction = ({matches, location}) =>
  seoMeta({
    matches,
    location,
    path: '/collections/all',
    title: 'Toutes les sneakers au Maroc',
    description:
      'Toutes les sneakers HAMZA KING : running, lifestyle, basket, outdoor. Livraison gratuite partout au Maroc, paiement à la livraison, échange gratuit sous 7 jours.',
  });

/**
 * If a collection with handle "all" exists in Shopify (recommended: an automated
 * collection containing every product), it is used so filters work here too.
 * Otherwise we fall back to the full catalog without filters.
 */
export async function loader({context, request}: Route.LoaderArgs) {
  const {storefront} = context;
  const url = new URL(request.url);
  const sort = getSort(url.searchParams);
  const paginationVariables = getPaginationVariables(request, {pageBy: 24});

  const {collection} = await storefront.query(ALL_COLLECTION_QUERY, {
    variables: {
      filters: getFilters(url.searchParams),
      ...collectionSortVars(sort),
      ...paginationVariables,
    },
  });

  if (collection) {
    return {
      products: collection.products,
      filters: collection.products.filters as Filter[],
      sort,
    };
  }

  const {products} = await storefront.query(CATALOG_QUERY, {
    variables: {...productSortVars(sort), ...paginationVariables},
  });
  return {products, filters: [] as Filter[], sort};
}

export default function AllProducts() {
  const {products, filters, sort} = useLoaderData<typeof loader>();
  return (
    <CollectionView
      eyebrow="Catalogue"
      title="Toutes les sneakers"
      description="Toutes les paires disponibles, prêtes à partir. Livraison gratuite partout au Maroc."
      products={{
        nodes: products.nodes as CardProduct[],
        pageInfo: products.pageInfo,
      }}
      filters={filters}
      sort={sort}
      handle="all"
      image={COLLECTION_IMAGES.all}
    />
  );
}

const ALL_COLLECTION_QUERY = `#graphql
  ${PRODUCT_CARD_FRAGMENT}
  ${FILTERS_SELECTION}
  query AllCollection(
    $country: CountryCode
    $language: LanguageCode
    $filters: [ProductFilter!]
    $sortKey: ProductCollectionSortKeys!
    $reverse: Boolean
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: "all") {
      id
      products(
        first: $first
        last: $last
        before: $startCursor
        after: $endCursor
        filters: $filters
        sortKey: $sortKey
        reverse: $reverse
      ) {
        filters {
          ...CollectionFilters
        }
        nodes {
          ...ProductCard
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          startCursor
          endCursor
        }
      }
    }
  }
` as const;

const CATALOG_QUERY = `#graphql
  ${PRODUCT_CARD_FRAGMENT}
  query Catalog(
    $country: CountryCode
    $language: LanguageCode
    $sortKey: ProductSortKeys!
    $reverse: Boolean
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    products(
      first: $first
      last: $last
      before: $startCursor
      after: $endCursor
      sortKey: $sortKey
      reverse: $reverse
    ) {
      nodes {
        ...ProductCard
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
` as const;
