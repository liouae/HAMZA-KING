import {Link} from 'react-router';
import type {Route} from './+types/livraison._index';
import {
  IconCash,
  IconReturn,
  IconTruck,
  IconWhatsApp,
} from '~/components/Icons';
import {SHIPPING} from '~/lib/config';
import {DELIVERY_ROWS} from '~/lib/content';
import {CITIES} from '~/lib/cities';
import {breadcrumbLd, faqLd, seoMeta, siteUrl} from '~/lib/seo';
import {useWhatsAppLink} from '~/lib/whatsapp';

export const SHIPPING_FAQ = [
  {
    q: 'La livraison est-elle vraiment gratuite ?',
    a: 'Oui. La livraison est offerte sur toutes les commandes, sans minimum d’achat, dans toutes les villes du Maroc. Le prix affiché est le prix que tu payes au livreur.',
  },
  {
    q: 'Comment fonctionne le paiement à la livraison ?',
    a: 'Tu commandes sur le site ou sur WhatsApp, sans carte bancaire. On t’appelle pour confirmer la pointure et l’adresse, puis le livreur t’apporte la paire : tu l’ouvres, tu la vérifies, et tu payes en espèces.',
  },
  {
    q: 'Puis-je vérifier la paire avant de payer ?',
    a: 'Oui, et on te le conseille. Si la paire ne correspond pas à ta commande (modèle, couleur ou pointure), tu peux la refuser sans rien payer et on t’envoie la bonne.',
  },
  {
    q: 'Combien de temps prend la livraison ?',
    a: `${SHIPPING.deliveryCasablanca} à Casablanca, 48h dans les grandes villes (Rabat, Marrakech, Tanger, Agadir) et ${SHIPPING.deliveryMorocco} dans le reste du Maroc, après l’appel de confirmation.`,
  },
  {
    q: 'Et si la pointure ne va pas ?',
    a: `L’échange est gratuit sous ${SHIPPING.returnDays} jours : on récupère la paire chez toi et on t’envoie la bonne pointure, à nos frais. La paire doit être non portée, dans sa boîte.`,
  },
  {
    q: 'Comment suivre ma commande ?',
    a: 'Sur la page « Suivre ma commande » avec ton numéro de commande et ton téléphone, ou directement sur WhatsApp.',
  },
];

export const meta: Route.MetaFunction = ({matches, location}) => {
  const base = siteUrl(matches);
  const faq = faqLd(SHIPPING_FAQ);
  return seoMeta({
    matches,
    location,
    path: '/livraison',
    title: 'Livraison gratuite et paiement à la livraison au Maroc',
    description: `Sneakers livrées gratuitement partout au Maroc : ${SHIPPING.deliveryCasablanca} à Casablanca, 48h grandes villes. Paiement en espèces à la livraison, échange de pointure gratuit.`,
    jsonLd: base
      ? [
          breadcrumbLd(base, [
            {name: 'Accueil', path: '/'},
            {name: 'Livraison'},
          ]),
          ...(faq ? [faq] : []),
        ]
      : [],
  });
};

export default function ShippingHub() {
  const wa = useWhatsAppLink();
  return (
    <div className="ship">
      <header className="container page-head">
        <p className="eyebrow">Livraison & paiement</p>
        <h1 className="display-l">
          Livraison gratuite.
          <br />
          Tu payes à la réception.
        </h1>
        <p className="ship-intro">
          Partout au Maroc, sans minimum d’achat. Pas de carte bancaire : tu
          vérifies ta paire devant le livreur, puis tu payes en espèces.
        </p>
      </header>

      <section className="container ship-steps" aria-label="Comment ça marche">
        <ol>
          <li>
            <strong>1. Tu commandes</strong>
            <span>Sur le site ou sur WhatsApp, en deux minutes.</span>
          </li>
          <li>
            <strong>2. On t’appelle</strong>
            <span>Pour confirmer la pointure, la couleur et l’adresse.</span>
          </li>
          <li>
            <strong>3. On livre gratuitement</strong>
            <span>
              {SHIPPING.deliveryCasablanca} à Casablanca,{' '}
              {SHIPPING.deliveryMorocco} ailleurs.
            </span>
          </li>
          <li>
            <strong>4. Tu vérifies, tu payes</strong>
            <span>En espèces, au livreur, une fois la paire vérifiée.</span>
          </li>
        </ol>
      </section>

      <section className="container ship-grid">
        <div className="ship-card">
          <IconTruck width={22} height={22} />
          <h2>Délais de livraison</h2>
          <table className="delivery">
            <tbody>
              {DELIVERY_ROWS.map((r) => (
                <tr key={r.zone}>
                  <td>{r.zone}</td>
                  <td>{r.delay}</td>
                  <td>{r.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="small muted">
            Délais indicatifs après l’appel de confirmation, hors jours fériés.
          </p>
        </div>
        <div className="ship-card">
          <IconCash width={22} height={22} />
          <h2>Paiement à la livraison</h2>
          <p>
            Aucun paiement en ligne. Tu ouvres le colis, tu vérifies le modèle,
            la couleur et la pointure, puis tu payes le livreur en espèces. Si
            ce n’est pas la bonne paire, tu la refuses sans rien payer.
          </p>
        </div>
        <div className="ship-card">
          <IconReturn width={22} height={22} />
          <h2>Échange gratuit sous {SHIPPING.returnDays} jours</h2>
          <p>
            Pas la bonne pointure ? On vient récupérer la paire chez toi et on
            t’envoie la bonne, à nos frais.{' '}
            <Link to="/policies/refund-policy">Conditions d’échange</Link>
          </p>
        </div>
      </section>

      <section className="container ship-cities" aria-labelledby="villes-title">
        <h2 id="villes-title" className="display-s">
          Livraison dans ta ville
        </h2>
        <ul>
          {CITIES.map((c) => (
            <li key={c.handle}>
              <Link to={`/livraison/${c.handle}`}>
                <strong>{c.name}</strong>
                <span>{c.delay}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="small muted">
          Ta ville n’est pas dans la liste ? On livre partout au Maroc, dans les
          mêmes conditions.
        </p>
      </section>

      <section className="container plp-faq" aria-labelledby="ship-faq">
        <h2 id="ship-faq" className="display-s">
          Questions fréquentes
        </h2>
        <div className="plp-faq-list">
          {SHIPPING_FAQ.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
        <div className="ship-cta">
          <a className="btn btn--wa" {...wa} target="_blank" rel="noreferrer">
            <IconWhatsApp /> Une question ? WhatsApp
          </a>
          <Link className="btn btn--ghost" to="/suivi">
            Suivre ma commande
          </Link>
        </div>
      </section>
    </div>
  );
}
