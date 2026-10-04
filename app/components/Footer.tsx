import {Link} from 'react-router';
import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';
import {BRAND, SHIPPING, SOCIALS} from '~/lib/config';
import {FOOTER_COLUMNS} from '~/lib/navigation';
import {
  IconCash,
  IconFacebook,
  IconInstagram,
  IconReturn,
  IconTikTok,
  IconTruck,
  IconWhatsApp,
} from './Icons';

export const SOCIAL_ICONS = {
  instagram: IconInstagram,
  tiktok: IconTikTok,
  facebook: IconFacebook,
};
import {BrandLogo} from './BrandLogo';

interface FooterProps {
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
}

export function ServiceStrip() {
  const items = [
    {
      icon: <IconCash width={22} height={22} />,
      title: 'Paiement à la livraison',
      copy: 'Tu reçois ta paire, tu la vérifies, puis tu payes en espèces. Aucune carte demandée.',
    },
    {
      icon: <IconTruck width={22} height={22} />,
      title: 'Livraison gratuite',
      copy: `Partout au Maroc, sans minimum. ${SHIPPING.deliveryCasablanca} à Casablanca, ${SHIPPING.deliveryMorocco} ailleurs.`,
    },
    {
      icon: <IconReturn width={22} height={22} />,
      title: `Échange sous ${SHIPPING.returnDays} jours`,
      copy: 'Pas la bonne pointure ? On vient la récupérer et on t’envoie la bonne.',
    },
    {
      icon: <IconWhatsApp width={22} height={22} />,
      title: 'Conseil sur WhatsApp',
      copy: 'Une question de pointure ou de coloris ? On te répond rapidement, 7j/7.',
    },
  ];
  return (
    <section className="promise" aria-labelledby="promise-title">
      <div className="promise-inner">
        <header className="promise-head">
          <p className="eyebrow">Nos engagements</p>
          <h2 id="promise-title" className="promise-heading">
            Commander,
            <br />
            sans aucun risque.
          </h2>
        </header>
        <ol className="promise-list">
          {items.map((s, i) => (
            <li key={s.title} className="promise-item">
              <div className="promise-top">
                <span className="promise-icon" aria-hidden>
                  {s.icon}
                </span>
                <span className="promise-n" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="promise-title">{s.title}</h3>
              <p className="promise-copy">{s.copy}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Footer(_props: FooterProps) {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-news">
          <p className="eyebrow eyebrow--light footer-club">
            <BrandLogo variant="crown" tone="white" height={12} decorative /> Le
            club
          </p>
          <h2 className="footer-news-title">Les drops avant tout le monde.</h2>
          <form
            className="news-form"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              form.dataset.done = 'true';
            }}
          >
            <label htmlFor="news-email" className="sr-only">
              Adresse e-mail
            </label>
            <input
              id="news-email"
              type="email"
              required
              placeholder="ton@email.com"
              autoComplete="email"
            />
            <button type="submit">S’inscrire</button>
            <p className="news-done">Merci ! Tu es inscrit·e.</p>
          </form>
        </div>
        <div className="footer-cols">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="footer-col">
              <p className="footer-col-title">{col.title}</p>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} prefetch="intent">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="footer-giant" aria-hidden>
        <BrandLogo variant="wordmark" tone="white" height={320} decorative />
      </div>

      <div className="footer-bottom">
        <div className="footer-brand">
          <BrandLogo variant="hk" tone="white" height={20} decorative />
          <span>
            © {year} {BRAND.legalName} — Casablanca, Maroc
          </span>
        </div>
        <div className="footer-pay">
          <span className="pay-chip">Paiement à la livraison</span>
          <span className="pay-chip">Livraison gratuite</span>
        </div>
        <div className="footer-social">
          {SOCIALS.map((s) => {
            const Icon = SOCIAL_ICONS[s.network];
            return (
              <a
                key={s.network}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`${BRAND.name} sur ${s.name}`}
                title={`${s.name} ${s.handle}`}
              >
                <Icon width={18} height={18} />
              </a>
            );
          })}
        </div>
      </div>
    </footer>
  );
}
