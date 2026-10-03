import {Await, useLoaderData, Link, useRouteLoaderData} from 'react-router';
import {SmartImage} from '~/components/SmartImage';
import type {Route} from './+types/_index';
import {Suspense, useEffect, useRef} from 'react';
import {Image} from '@shopify/hydrogen';
import {
  PRODUCT_CARD_FRAGMENT,
  type CardProduct,
} from '~/components/ProductItem';
import {ProductRail} from '~/components/ProductRail';
import {ServiceStrip} from '~/components/Footer';
import {Price} from '~/components/Price';
import {IconArrow} from '~/components/Icons';
import {BRAND, BRANDS, CATEGORIES} from '~/lib/config';
import {
  CAMPAIGN,
  EDITORIAL,
  POPULAR_CATEGORIES,
  SITE,
  STORIES,
  localPhoto,
  type Story,
} from '~/lib/content';
import type {RootLoader} from '~/root';
import type {MenuImages} from '~/components/Header';

export const meta: Route.MetaFunction = () => {
  return [
    {title: `${BRAND.name} | Sneakers authentiques au Maroc`},
    {name: 'description', content: BRAND.tagline},
    {
      property: 'og:title',
      content: `${BRAND.name} | Sneakers authentiques au Maroc`,
    },
    {property: 'og:description', content: BRAND.tagline},
    {property: 'og:url', content: SITE.url},
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: BRAND.name,
        url: SITE.url,
        logo: `${SITE.url}/brand/icon-512.png`,
        sameAs: [BRAND.instagram, BRAND.tiktok].filter(Boolean),
        address: {
          '@type': 'PostalAddress',
          addressLocality: SITE.city,
          addressCountry: 'MA',
        },
      },
    },
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context}: Route.LoaderArgs) {
  const {newest} = await context.storefront.query(HOME_NEWEST_QUERY);
  return {newest: newest.nodes as CardProduct[]};
}

function loadDeferredData({context}: Route.LoaderArgs) {
  const safe = <T,>(p: Promise<T>, fallback: T) =>
    p.catch((error: Error) => {
      console.error(error);
      return fallback;
    });
  return {
    bestSellers: safe(
      context.storefront
        .query(HOME_BEST_QUERY)
        .then((r) => r.best.nodes as CardProduct[]),
      [] as CardProduct[],
    ),
    icons: safe(
      context.storefront
        .query(HOME_ICONS_QUERY)
        .then((r) => r.icons.nodes as CardProduct[]),
      [] as CardProduct[],
    ),
    promos: safe(
      context.storefront
        .query(HOME_PROMO_QUERY)
        .then((r) => (r.collection?.products.nodes ?? []) as CardProduct[]),
      [] as CardProduct[],
    ),
  };
}

export default function Homepage() {
  const {newest, bestSellers, icons, promos} = useLoaderData<typeof loader>();
  const root = useRouteLoaderData<RootLoader>('root');
  const menuImages = root?.menuImages ?? Promise.resolve({} as MenuImages);
  const heroProduct = newest[0];

  return (
    <div className="home">
      <CampaignHero product={heroProduct} />
      <BrandTicker />

      <ProductRail
        eyebrow="Fraîchement arrivées"
        title="Nouveautés"
        to="/collections/all?sort=newest"
        products={newest}
      />

      <section
        className="universes container"
        aria-labelledby="univers-title"
        data-reveal
      >
        <header className="section-head">
          <div>
            <p className="eyebrow">Trouve ta paire</p>
            <h2 id="univers-title" className="display-m">
              Quatre univers.
            </h2>
          </div>
          <Link to="/collections" className="link-arrow hide-sm">
            Toutes les collections <IconArrow width={16} height={16} />
          </Link>
        </header>
        <Suspense fallback={<UniverseGrid images={{}} />}>
          <Await resolve={menuImages}>
            {(imgs) => <UniverseGrid images={imgs} />}
          </Await>
        </Suspense>
      </section>

      <StoryBlock story={STORIES[0]} menuImages={menuImages} />

      <Suspense fallback={null}>
        <Await resolve={bestSellers}>
          {(products) =>
            products.length ? (
              <ProductRail
                eyebrow="Ce que le Maroc porte"
                title="Best-sellers"
                to="/collections/all?sort=best-selling"
                products={products}
              />
            ) : null
          }
        </Await>
      </Suspense>

      <Suspense fallback={null}>
        <Await resolve={icons}>
          {(products) =>
            products.length ? (
              <ProductRail
                eyebrow="Intemporelles"
                title="Les icônes"
                to="/collections/all?sort=best-selling"
                products={products}
              />
            ) : null
          }
        </Await>
      </Suspense>

      <StoryBlock story={STORIES[1]} menuImages={menuImages} />

      <EditorialBand menuImages={menuImages} />

      <Suspense fallback={null}>
        <Await resolve={promos}>
          {(products) =>
            products.length ? (
              <ProductRail
                eyebrow="Dernière chance"
                title="Promos"
                to="/collections/promo"
                products={products}
              />
            ) : null
          }
        </Await>
      </Suspense>

      <BrandIndex />
      <ServiceStrip />
      <PopularCategories />
    </div>
  );
}

/* ---------------- Campaign hero ---------------- */
function CampaignHero({product}: {product?: CardProduct}) {
  const image = product?.featuredImage;
  const c = CAMPAIGN;
  const hasMedia = Boolean(c.video || c.image);
  const stageRef = useRef<HTMLDivElement>(null);

  // Subtle parallax on the media
  useEffect(() => {
    const el = stageRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 900);
        el.style.setProperty('--parallax', `${y * 0.12}px`);
      });
    };
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      className={`hero ${hasMedia ? 'hero--media' : ''} hero--${c.theme ?? 'dark'}`}
      aria-label="À la une"
    >
      <div className="hero-copy">
        <p className="eyebrow">
          <span className="dot" /> {c.eyebrow} — {new Date().getFullYear()}
        </p>
        <h1 className="hero-title">
          {c.title.map((line, i) => (
            <span
              key={line}
              className="hero-line"
              style={{['--i' as string]: i}}
            >
              <span>{line}</span>
            </span>
          ))}
        </h1>
        <p className="hero-lede">{c.copy}</p>
        <div className="hero-ctas">
          <Link to={c.primary.to} className="btn btn--lg">
            {c.primary.label} <IconArrow width={18} height={18} />
          </Link>
          {c.secondary ? (
            <Link to={c.secondary.to} className="btn btn--lg btn--ghost">
              {c.secondary.label}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="hero-stage" ref={stageRef}>
        {c.video ? (
          <video
            className="hero-media"
            src={c.video}
            poster={c.poster}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : c.image ? (
          <SmartImage
            className="hero-media"
            data={localPhoto(c.image)}
            alt="Coureur sur un sentier de l’Atlas au coucher du soleil"
            sizes="(min-width: 64em) 60vw, 100vw"
            priority
          />
        ) : image ? (
          <Image
            className="hero-product"
            data={image}
            alt={image.altText || product?.title || ''}
            sizes="(min-width: 64em) 55vw, 100vw"
            loading="eager"
          />
        ) : null}
        <span className="hero-grid" aria-hidden />
        <span className="hero-index" aria-hidden>
          N°01
        </span>
        {product ? (
          <Link to={`/products/${product.handle}`} className="hero-tag">
            <span className="hero-tag-kicker">
              {product.vendor || 'À la une'}
            </span>
            <span className="hero-tag-title">{product.title}</span>
            <Price price={product.priceRange.minVariantPrice} />
            <span className="hero-tag-cta">
              Voir la paire <IconArrow width={14} height={14} />
            </span>
          </Link>
        ) : null}
        <span className="hero-scroll" aria-hidden>
          <span />
        </span>
      </div>
    </section>
  );
}

/* ---------------- Brand ticker ---------------- */
function BrandTicker() {
  const row = [...BRANDS, ...BRANDS];
  return (
    <div className="ticker" aria-hidden>
      <div className="ticker-track">
        {row.map((b, i) => (
          <Link
            key={`${b.handle}-${i}`}
            to={`/collections/${b.handle}`}
            className="ticker-item"
            tabIndex={-1}
          >
            {b.logo ? (
              <img
                className="ticker-logo"
                src={b.logo}
                alt={b.name}
                loading="lazy"
              />
            ) : (
              b.name
            )}
            <span className="ticker-sep">✦</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Universes ---------------- */
function UniverseGrid({images}: {images: MenuImages}) {
  return (
    <div className="universe-grid">
      {CATEGORIES.map((cat, i) => {
        const img = cat.image ? localPhoto(cat.image) : images[cat.handle];
        return (
          <Link
            key={cat.handle}
            to={`/collections/${cat.handle}`}
            className="universe"
            data-reveal
            style={{['--d' as string]: `${i * 80}ms`}}
          >
            {img ? (
              <SmartImage
                data={img}
                alt=""
                className="universe-img"
                aspectRatio="4/5"
                sizes="(min-width: 64em) 25vw, 50vw"
              />
            ) : (
              <span className="universe-img universe-img--empty" />
            )}
            <span className="universe-kicker">{cat.kicker}</span>
            <span className="universe-body">
              <span className="universe-title">{cat.title}</span>
              <span className="universe-copy">{cat.copy}</span>
            </span>
            <span className="universe-arrow">
              <IconArrow />
            </span>
          </Link>
        );
      })}
    </div>
  );
}

/* ---------------- Story block ---------------- */
function StoryBlock({
  story,
  menuImages,
}: {
  story?: Story;
  menuImages: Promise<MenuImages>;
}) {
  if (!story) return null;
  return (
    <section
      className={`story story--${story.align ?? 'left'} story--${story.theme ?? 'paper'}`}
      aria-label={story.title}
      data-reveal
    >
      <div className="story-media">
        <Suspense fallback={null}>
          <Await resolve={menuImages}>
            {(imgs) => {
              const img = story.image
                ? localPhoto(story.image)
                : imgs[story.handle];
              return img ? (
                <SmartImage
                  data={img}
                  alt=""
                  sizes="(min-width: 64em) 60vw, 100vw"
                  loading="lazy"
                />
              ) : (
                <span className="story-media-empty" />
              );
            }}
          </Await>
        </Suspense>
      </div>
      <div className="story-copy">
        <p className="eyebrow">{story.kicker}</p>
        <h2 className="display-l">{story.title}</h2>
        <p className="story-text">{story.copy}</p>
        <div className="story-ctas">
          {story.ctas.map((c, i) => (
            <Link
              key={c.label}
              to={c.to}
              className={`btn ${i ? 'btn--ghost' : ''}`}
            >
              {c.label} {i === 0 ? <IconArrow width={16} height={16} /> : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Editorial band ---------------- */
function EditorialBand({menuImages}: {menuImages: Promise<MenuImages>}) {
  const steps = [
    {
      n: '01',
      t: 'Sourcing',
      c: 'Uniquement auprès de distributeurs officiels et de revendeurs vérifiés.',
    },
    {
      n: '02',
      t: 'Contrôle',
      c: 'Étiquettes, coutures, semelle, boîte : chaque paire passe un contrôle en 12 points.',
    },
    {
      n: '03',
      t: 'Livraison',
      c: 'Expédiée sous 24h. Tu vérifies, puis tu payes à la livraison.',
    },
  ];
  return (
    <section className="band" aria-labelledby="band-title" data-reveal>
      <div className="band-bg" aria-hidden>
        <Suspense fallback={null}>
          <Await resolve={menuImages}>
            {(imgs) => {
              const img = EDITORIAL.image
                ? localPhoto(EDITORIAL.image)
                : (imgs['outdoor'] ?? imgs['all']);
              return img ? (
                <SmartImage data={img} alt="" sizes="100vw" loading="lazy" />
              ) : null;
            }}
          </Await>
        </Suspense>
      </div>
      <div className="container band-inner">
        <div className="band-head">
          <p className="eyebrow eyebrow--light">{EDITORIAL.kicker}</p>
          <h2 id="band-title" className="display-l">
            Vérifiée à la main.
            <br />
            <span className="outline">Portée sans doute.</span>
          </h2>
          <p className="band-copy">{EDITORIAL.copy}</p>
          <Link to={EDITORIAL.cta.to} className="btn btn--light">
            {EDITORIAL.cta.label} <IconArrow width={16} height={16} />
          </Link>
        </div>
        <ol className="band-steps">
          {steps.map((s) => (
            <li key={s.n}>
              <span className="band-n">{s.n}</span>
              <span className="band-t">{s.t}</span>
              <span className="band-c">{s.c}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------- Brand index ---------------- */
function BrandIndex() {
  return (
    <section
      className="brand-index container"
      aria-labelledby="brands-title"
      data-reveal
    >
      <header className="section-head">
        <div>
          <p className="eyebrow">Index</p>
          <h2 id="brands-title" className="display-m">
            Les marques.
          </h2>
        </div>
        <Link to="/marques" className="link-arrow">
          Toutes les marques <IconArrow width={16} height={16} />
        </Link>
      </header>
      <ul className="brand-list">
        {BRANDS.map((b, i) => (
          <li key={b.handle}>
            <Link to={`/collections/${b.handle}`}>
              <span className="brand-n">{String(i + 1).padStart(2, '0')}</span>
              <span className="brand-name">
                {b.logo ? (
                  <img
                    className="brand-logo"
                    src={b.logo}
                    alt=""
                    loading="lazy"
                  />
                ) : null}
                {b.name}
              </span>
              <IconArrow className="brand-arrow" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------------- Popular categories (SEO) ---------------- */
function PopularCategories() {
  return (
    <section className="popular container" aria-labelledby="popular-title">
      <h2 id="popular-title" className="popular-title">
        Catégories les plus recherchées
      </h2>
      <ul className="popular-list">
        {POPULAR_CATEGORIES.map((c) => (
          <li key={c.to + c.label}>
            <Link to={c.to} prefetch="intent">
              {c.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const HOME_NEWEST_QUERY = `#graphql
  query HomeNewest($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    newest: products(first: 12, sortKey: CREATED_AT, reverse: true) {
      nodes {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;

const HOME_BEST_QUERY = `#graphql
  query HomeBest($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    best: products(first: 12, sortKey: BEST_SELLING) {
      nodes {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;

/** Tag products with `icone` in Shopify to feature them in "Les icônes". */
const HOME_ICONS_QUERY = `#graphql
  query HomeIcons($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    icons: products(first: 12, sortKey: BEST_SELLING, query: "tag:icone") {
      nodes {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;

const HOME_PROMO_QUERY = `#graphql
  query HomePromo($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collection(handle: "promo") {
      products(first: 12) {
        nodes {
          ...ProductCard
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;
