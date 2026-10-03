import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/collections.$handle';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
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
} from '~/lib/collection';

export const meta: Route.MetaFunction = ({data}) => {
  return [
    {
      title: `HAMZA KING | ${data?.collection.seo?.title || data?.collection.title || ''}`,
    },
    {
      name: 'description',
      content:
        data?.collection.seo?.description || data?.collection.description || '',
    },
    {property: 'og:image', content: data?.collection.image?.url ?? ''},
  ];
};

export async function loader({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;
  if (!handle) throw redirect('/collections');

  const url = new URL(request.url);
  const sort = getSort(url.searchParams);
  const filters = getFilters(url.searchParams);
  const paginationVariables = getPaginationVariables(request, {pageBy: 24});

  const {collection} = await storefront.query(COLLECTION_QUERY, {
    variables: {
      handle,
      filters,
      ...collectionSortVars(sort),
      ...paginationVariables,
    },
  });

  if (!collection) {
    throw new Response(`Collection ${handle} introuvable`, {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle, data: collection});

  return {collection, sort};
}

export default function Collection() {
  const {collection, sort} = useLoaderData<typeof loader>();

  return (
    <>
      <CollectionView
        title={collection.title}
        description={collection.description}
        products={{
          nodes: collection.products.nodes as CardProduct[],
          pageInfo: collection.products.pageInfo,
        }}
        filters={collection.products.filters as Filter[]}
        sort={sort}
        handle={collection.handle}
        image={collection.image ?? COLLECTION_IMAGES[collection.handle]}
      />
      <Analytics.CollectionView
        data={{collection: {id: collection.id, handle: collection.handle}}}
      />
    </>
  );
}

const COLLECTION_QUERY = `#graphql
  ${PRODUCT_CARD_FRAGMENT}
  ${FILTERS_SELECTION}
  query Collection(
    $handle: String!
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
    collection(handle: $handle) {
      id
      handle
      title
      description
      image {
        url
        altText
        width
        height
      }
      seo {
        title
        description
      }
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
          endCursor
          startCursor
        }
      }
    }
  }
` as const;
