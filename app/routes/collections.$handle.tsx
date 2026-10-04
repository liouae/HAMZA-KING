import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/collections.$handle';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {
  PRODUCT_CARD_FRAGMENT,
  type CardProduct,
} from '~/components/ProductItem';
import {COLLECTION_IMAGES} from '~/lib/content';
import {BRAND, BRANDS} from '~/lib/config';
import {breadcrumbLd, faqLd, itemListLd, seoMeta, siteUrl} from '~/lib/seo';
import {CollectionView, type Filter} from '~/components/CollectionView';
import {
  FILTERS_SELECTION,
  collectionSortVars,
  getFilters,
  getSort,
} from '~/lib/collection';

export const meta: Route.MetaFunction = ({data, matches, location}) => {
  const c = data?.collection;
  if (!c) return [{title: BRAND.name}];
  const base = siteUrl(matches);
  const path = `/collections/${c.handle}`;
  const nodes = c.products.nodes as CardProduct[];
  const prices = nodes
    .map((n) => Number(n.priceRange.minVariantPrice.amount))
    .filter(Boolean);
  const from = prices.length ? Math.round(Math.min(...prices)) : 0;
  const isBrand = BRANDS.some((b) => b.handle === c.handle);
  const faq = data.faq ?? [];
  const ld: Record<string, unknown>[] = [];
  if (base && nodes.length) {
    ld.push(
      itemListLd(base, c.title, path, nodes),
      breadcrumbLd(base, [
        {name: 'Accueil', path: '/'},
        ...(isBrand ? [{name: 'Marques', path: '/marques'}] : []),
        {name: c.title},
      ]),
    );
    const f = faqLd(faq);
    if (f) ld.push(f);
  }
  return seoMeta({
    matches,
    location,
    path,
    title: c.seo?.title || `${c.title} au Maroc`,
    description:
      c.seo?.description ||
      c.description ||
      `${c.title} au Maroc${from ? ` à partir de ${from} DH` : ''}. Livraison gratuite, paiement à la livraison.`,
    image: c.image?.url ?? nodes[0]?.featuredImage?.url,
    // Empty selections stay out of Google until they have stock.
    noindex: nodes.length === 0 && !location.search,
    jsonLd: ld,
  });
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

  let faq: {q: string; a: string}[] = [];
  try {
    const parsed = JSON.parse(collection.faq?.value ?? '[]') as unknown;
    if (Array.isArray(parsed)) {
      faq = parsed.filter(
        (f): f is {q: string; a: string} =>
          typeof (f as {q?: unknown})?.q === 'string' &&
          typeof (f as {a?: unknown})?.a === 'string',
      );
    }
  } catch {
    /* ignore malformed FAQ */
  }

  return {collection, sort, faq};
}

export default function Collection() {
  const {collection, sort, faq} = useLoaderData<typeof loader>();

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
        seoBody={collection.seoBody?.value}
        faq={faq}
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
      seoBody: metafield(namespace: "custom", key: "seo_body") {
        value
      }
      faq: metafield(namespace: "custom", key: "faq") {
        value
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
