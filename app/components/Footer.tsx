import {Link} from 'react-router';
import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';
import {BRAND, SHIPPING} from '~/lib/config';
import {FOOTER_COLUMNS} from '~/lib/navigation';
import {IconCash, IconReturn, IconShield, IconTruck} from './Icons';
import {BrandLogo} from './BrandLogo';

interface FooterProps {
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
}

export function ServiceStrip() {
  const items = [
    {
      icon: <IconCash />,
      title: 'Paiement à la livraison',
      copy: 'Payez en espèces à la réception.',
    },
    {
      icon: <IconTruck />,
      title: 'Livraison rapide',
      copy: `${SHIPPING.deliveryCasablanca} Casablanca · ${SHIPPING.deliveryMorocco} Maroc`,
    },
    {
      icon: <IconReturn />,
      title: `Échange sous ${SHIPPING.returnDays} jours`,
      copy: 'Pas la bonne taille ? On échange.',
    },
    {
      icon: <IconShield />,
      title: '100% authentique',
      copy: 'Chaque paire est vérifiée.',
    },
  ];
  return (
    <section className="services" aria-label="Nos engagements">
      {items.map((s) => (
        <div key={s.title} className="service">
          <span className="service-icon">{s.icon}</span>
          <div>
            <p className="service-title">{s.title}</p>
            <p className="service-copy">{s.copy}</p>
          </div>
        </div>
      ))}
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
          <span className="pay-chip">Cash à la livraison</span>
          <span className="pay-chip">Visa</span>
          <span className="pay-chip">Mastercard</span>
          <span className="pay-chip">CMI</span>
        </div>
        <div className="footer-social">
          <a href={BRAND.instagram} target="_blank" rel="noreferrer">
            Instagram
          </a>
          <a href={BRAND.tiktok} target="_blank" rel="noreferrer">
            TikTok
          </a>
        </div>
      </div>
    </footer>
  );
}
