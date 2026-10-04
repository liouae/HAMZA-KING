import {breadcrumbLd, seoMeta, siteUrl} from '~/lib/seo';
import {useLoaderData} from 'react-router';
import type {Route} from './+types/blogs.$blogHandle.$articleHandle';
import {Image} from '@shopify/hydrogen';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';

export const meta: Route.MetaFunction = ({data, matches, location}) => {
  const a = data?.article;
  if (!a) return [{title: 'Journal'}];
  const base = siteUrl(matches);
  const path = location.pathname;
  return seoMeta({
    matches,
    location,
    path,
    type: 'article',
    title: a.seo?.title || a.title,
    description: a.seo?.description,
    image: a.image?.url,
    jsonLd: base
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: a.title,
            datePublished: a.publishedAt,
            image: a.image?.url,
            author: {'@type': 'Organization', name: 'HAMZA KING'},
            publisher: {'@id': `${base}/#organization`},
            mainEntityOfPage: `${base}${path}`,
            inLanguage: 'fr-MA',
          },
          breadcrumbLd(base, [
            {name: 'Accueil', path: '/'},
            {name: 'Journal', path: '/blogs/journal'},
            {name: a.title},
          ]),
        ]
      : [],
  });
};

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
async function loadCriticalData({context, request, params}: Route.LoaderArgs) {
  const {blogHandle, articleHandle} = params;

  if (!articleHandle || !blogHandle) {
    throw new Response('Not found', {status: 404});
  }

  const [{blog}] = await Promise.all([
    context.storefront.query(ARTICLE_QUERY, {
      variables: {blogHandle, articleHandle},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!blog?.articleByHandle) {
    throw new Response(null, {status: 404});
  }

  redirectIfHandleIsLocalized(
    request,
    {
      handle: articleHandle,
      data: blog.articleByHandle,
    },
    {
      handle: blogHandle,
      data: blog,
    },
  );

  const article = blog.articleByHandle;

  return {article};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Article() {
  const {article} = useLoaderData<typeof loader>();
  const {title, image, contentHtml, author} = article;

  const publishedDate = new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article.publishedAt));

  return (
    <div className="article container">
      <header className="page-head page-head--tight article-head">
        <p className="eyebrow">
          <time dateTime={article.publishedAt}>{publishedDate}</time>
          {author?.name ? <> · {author.name}</> : null}
        </p>
        <h1 className="display-l">{title}</h1>
      </header>
      {image && (
        <div className="article-image">
          <Image
            data={image}
            sizes="(min-width: 64em) 1200px, 100vw"
            loading="eager"
          />
        </div>
      )}
      <div
        dangerouslySetInnerHTML={{__html: contentHtml}}
        className="rte article-body"
      />
    </div>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog#field-blog-articlebyhandle
const ARTICLE_QUERY = `#graphql
  query Article(
    $articleHandle: String!
    $blogHandle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    blog(handle: $blogHandle) {
      handle
      articleByHandle(handle: $articleHandle) {
        handle
        title
        contentHtml
        publishedAt
        author: authorV2 {
          name
        }
        image {
          id
          altText
          url
          width
          height
        }
        seo {
          description
          title
        }
      }
    }
  }
` as const;
