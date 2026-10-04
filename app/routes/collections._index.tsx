import {useLoaderData, Link} from 'react-router';
import {seoMeta} from '~/lib/seo';

export const meta: Route.MetaFunction = ({matches, location}) =>
  seoMeta({
    matches,
    location,
    path: '/collections',
    title: 'Collections sneakers au Maroc',
    description:
      'Toutes nos collections : running, lifestyle, basket, outdoor, homme, femme, enfant. Livraison gratuite au Maroc, paiement à la livraison.',
  });
import type {Route} from './+types/collections._index';
import {getPaginationVariables} from '@shopify/hydrogen';
import {SmartImage} from '~/components/SmartImage';
import {COLLECTION_IMAGES} from '~/lib/content';
import type {CollectionFragment} from 'storefrontapi.generated';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 4,
  });

  const [{collections}] = await Promise.all([
    context.storefront.query(COLLECTIONS_QUERY, {
      variables: paginationVariables,
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {collections};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Collections() {
  const {collections} = useLoaderData<typeof loader>();

  return (
    <div className="collections container">
      <header className="page-head page-head--tight">
        <p className="eyebrow">Explorer</p>
        <h1 className="display-l">Toutes les collections.</h1>
      </header>
      <PaginatedResourceSection<CollectionFragment>
        connection={collections}
        resourcesClassName="collections-grid"
      >
        {({node: collection, index}) => (
          <CollectionItem
            key={collection.id}
            collection={collection}
            index={index}
          />
        )}
      </PaginatedResourceSection>
    </div>
  );
}

function CollectionItem({
  collection,
  index,
}: {
  collection: CollectionFragment;
  index: number;
}) {
  return (
    <Link
      className="collection-item"
      key={collection.id}
      to={`/collections/${collection.handle}`}
      prefetch="intent"
    >
      {collection?.image || COLLECTION_IMAGES[collection.handle] ? (
        <SmartImage
          alt={collection.image?.altText || collection.title}
          aspectRatio="1/1"
          data={collection.image ?? COLLECTION_IMAGES[collection.handle]}
          loading={index < 3 ? 'eager' : undefined}
          sizes="(min-width: 45em) 400px, 100vw"
        />
      ) : (
        <span className="collection-item-empty" />
      )}
      <span className="collection-item-title">{collection.title}</span>
    </Link>
  );
}

const COLLECTIONS_QUERY = `#graphql
  fragment Collection on Collection {
    id
    title
    handle
    image {
      id
      url
      altText
      width
      height
    }
  }
  query StoreCollections(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    collections(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      nodes {
        ...Collection
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
` as const;
