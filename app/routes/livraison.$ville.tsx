import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/livraison.$ville';
import {
  IconCash,
  IconReturn,
  IconTruck,
  IconWhatsApp,
} from '~/components/Icons';
import {ProductRail} from '~/components/ProductRail';
import {
  PRODUCT_CARD_FRAGMENT,
  type CardProduct,
} from '~/components/ProductItem';
import {BRAND, SHIPPING, whatsappLink} from '~/lib/config';
import {CITIES, cityByHandle, type City} from '~/lib/cities';
import {breadcrumbLd, faqLd, seoMeta, siteUrl} from '~/lib/seo';

function cityFaq(c: City) {
  return [
    {
      q: `Combien de temps pour être livré ${c.at} ?`,
      a: `En général ${c.delay} après l’appel de confirmation${
        c.nearby.length
          ? `, et c’est pareil pour ${c.nearby.slice(0, 3).join(', ')}`
          : ''
      }. Le livreur t’appelle avant de passer.`,
    },
    {
      q: `La livraison ${c.at} est-elle payante ?`,
      a: 'Non, elle est gratuite, sans minimum d’achat. Tu payes uniquement le prix de la paire, en espèces, au livreur.',
    },
    {
      q: `Puis-je échanger ma pointure ${c.at} ?`,
      a: `Oui, gratuitement sous ${SHIPPING.returnDays} jours : on récupère la paire à ton adresse ${c.at} et on t’apporte la bonne pointure, à nos frais.`,
    },
    {
      q: 'Puis-je voir la paire avant de commander ?',
      a: 'Oui : demande-nous des photos ou une vidéo de la paire exacte sur WhatsApp, et on te conseille sur la pointure.',
    },
  ];
}

export async function loader({params, context}: Route.LoaderArgs) {
  const city = cityByHandle(params.ville ?? '');
  if (!city) throw new Response('Ville introuvable', {status: 404});
  const data = await context.storefront
    .query(CITY_PRODUCTS_QUERY, {cache: context.storefront.CacheShort()})
    .catch(() => null);
  return {
    city,
    products: (data?.products?.nodes ?? []) as CardProduct[],
  };
}

export const meta: Route.MetaFunction = ({data, matches, location}) => {
  const c = data?.city;
  if (!c) return [{title: BRAND.name}];
  const base = siteUrl(matches);
  const faq = faqLd(cityFaq(c));
  return seoMeta({
    matches,
    location,
    path: `/livraison/${c.handle}`,
    title: `Sneakers livrées ${c.at} — gratuit, paiement à la livraison`,
    description: `Commande tes sneakers et reçois-les ${c.at} en ${c.delay}. Livraison gratuite, paiement en espèces à la livraison, échange de pointure gratuit.`,
    jsonLd: base
      ? [
          breadcrumbLd(base, [
            {name: 'Accueil', path: '/'},
            {name: 'Livraison', path: '/livraison'},
            {name: c.name},
          ]),
          ...(faq ? [faq] : []),
        ]
      : [],
  });
};

export default function CityPage() {
  const {city: c, products} = useLoaderData<typeof loader>();
  const faq = cityFaq(c);
  const wa = whatsappLink(
    `Salam ${BRAND.name} 👋\nJe suis ${c.at} et je cherche une paire.\nModèle : \nPointure : `,
  );
  const others = CITIES.filter((x) => x.handle !== c.handle);

  return (
    <div className="ship">
      <header className="container page-head">
        <nav className="crumbs" aria-label="Fil d’Ariane">
          <Link to="/">Accueil</Link>
          <span>/</span>
          <Link to="/livraison">Livraison</Link>
          <span>/</span>
          <span aria-current="page">{c.name}</span>
        </nav>
        <p className="eyebrow">Livraison {c.at}</p>
        <h1 className="display-l">
          Tes sneakers livrées {c.at} en {c.delay}.
        </h1>
        <p className="ship-intro">
          Livraison gratuite, paiement en espèces à la réception et échange de
          pointure gratuit. On confirme ta commande par téléphone avant
          d’expédier, puis le livreur t’appelle avant de passer.
        </p>
      </header>

      <section className="container ship-grid">
        <div className="ship-card">
          <IconTruck width={22} height={22} />
          <h2>{c.delay}, gratuitement</h2>
          <p>
            Délai habituel {c.at} après l’appel de confirmation
            {c.nearby.length ? (
              <>, et dans les environs : {c.nearby.join(', ')}</>
            ) : null}
            .
          </p>
        </div>
        <div className="ship-card">
          <IconCash width={22} height={22} />
          <h2>Tu payes à la réception</h2>
          <p>
            Pas de carte bancaire. Tu ouvres le colis, tu vérifies la paire, tu
            payes le livreur en espèces.
          </p>
        </div>
        <div className="ship-card">
          <IconReturn width={22} height={22} />
          <h2>Échange gratuit</h2>
          <p>
            Pas la bonne pointure ? On récupère la paire à ton adresse {c.at} et
            on t’envoie la bonne, à nos frais, sous {SHIPPING.returnDays} jours.
          </p>
        </div>
      </section>

      {c.quartiers.length ? (
        <section className="container ship-zones">
          <h2 className="display-s">On livre dans tous les quartiers</h2>
          <p>
            {c.quartiers.join(' · ')} — et partout ailleurs {c.at} (région{' '}
            {c.region}).
          </p>
        </section>
      ) : null}

      {products.length ? (
        <ProductRail
          eyebrow={`Livrables ${c.at}`}
          title="Les dernières paires"
          to="/collections/all?sort=newest"
          products={products}
        />
      ) : null}

      <section className="container plp-faq" aria-labelledby="city-faq">
        <h2 id="city-faq" className="display-s">
          Questions fréquentes — {c.name}
        </h2>
        <div className="plp-faq-list">
          {faq.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
        <div className="ship-cta">
          <a className="btn btn--wa" href={wa} target="_blank" rel="noreferrer">
            <IconWhatsApp /> Commander sur WhatsApp
          </a>
          <Link className="btn btn--ghost" to="/livraison">
            Livraison & paiement
          </Link>
        </div>
      </section>

      <section className="container ship-cities" aria-label="Autres villes">
        <h2 className="display-s">Aussi livré à</h2>
        <ul>
          {others.map((x) => (
            <li key={x.handle}>
              <Link to={`/livraison/${x.handle}`}>
                <strong>{x.name}</strong>
                <span>{x.delay}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const CITY_PRODUCTS_QUERY = `#graphql
  query CityProducts($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    products(first: 8, sortKey: CREATED_AT, reverse: true) {
      nodes {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;
