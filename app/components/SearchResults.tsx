import {Link} from 'react-router';
import {ProductItem, type CardProduct} from './ProductItem';
import {Image, Pagination} from '@shopify/hydrogen';
import {urlWithTrackingParams, type RegularSearchReturn} from '~/lib/search';

type SearchItems = RegularSearchReturn['result']['items'];
type PartialSearchResult<ItemType extends keyof SearchItems> = Pick<
  SearchItems,
  ItemType
> &
  Pick<RegularSearchReturn, 'term'>;

type SearchResultsProps = RegularSearchReturn & {
  children: (args: SearchItems & {term: string}) => React.ReactNode;
};

export function SearchResults({
  term,
  result,
  children,
}: Omit<SearchResultsProps, 'error' | 'type'>) {
  if (!result?.total) {
    return null;
  }

  return children({...result.items, term});
}

SearchResults.Articles = SearchResultsArticles;
SearchResults.Pages = SearchResultsPages;
SearchResults.Products = SearchResultsProducts;
SearchResults.Empty = SearchResultsEmpty;

function SearchResultsArticles({
  term,
  articles,
}: PartialSearchResult<'articles'>) {
  if (!articles?.nodes.length) {
    return null;
  }

  return (
    <div className="search-result">
      <h2>Articles</h2>
      <div>
        {articles?.nodes?.map((article) => {
          const articleUrl = urlWithTrackingParams({
            baseUrl: `/blogs/${article.handle}`,
            trackingParams: article.trackingParameters,
            term,
          });

          return (
            <div className="search-results-item" key={article.id}>
              <Link prefetch="intent" to={articleUrl}>
                {article.title}
              </Link>
            </div>
          );
        })}
      </div>
      <br />
    </div>
  );
}

function SearchResultsPages({term, pages}: PartialSearchResult<'pages'>) {
  if (!pages?.nodes.length) {
    return null;
  }

  return (
    <div className="search-result">
      <h2>Pages</h2>
      <div>
        {pages?.nodes?.map((page) => {
          const pageUrl = urlWithTrackingParams({
            baseUrl: `/pages/${page.handle}`,
            trackingParams: page.trackingParameters,
            term,
          });

          return (
            <div className="search-results-item" key={page.id}>
              <Link prefetch="intent" to={pageUrl}>
                {page.title}
              </Link>
            </div>
          );
        })}
      </div>
      <br />
    </div>
  );
}

function SearchResultsProducts({
  term,
  products,
}: PartialSearchResult<'products'>) {
  if (!products?.nodes.length) {
    return null;
  }
  void term;
  return (
    <div className="search-result search-result--products">
      <Pagination connection={products}>
        {({nodes, isLoading, NextLink, PreviousLink}) => (
          <div className="paginated">
            <PreviousLink className="load-more load-more--prev">
              {isLoading ? 'Chargement…' : 'Afficher les précédents'}
            </PreviousLink>
            <div className="grid">
              {nodes.map((product, i) => (
                <ProductItem
                  key={product.id}
                  product={product as unknown as CardProduct}
                  loading={i < 8 ? 'eager' : 'lazy'}
                />
              ))}
            </div>
            <NextLink className="load-more">
              {isLoading ? 'Chargement…' : 'Afficher plus'}
            </NextLink>
          </div>
        )}
      </Pagination>
    </div>
  );
}

function SearchResultsEmpty() {
  return <p>Aucun résultat. Essaie une autre recherche.</p>;
}
