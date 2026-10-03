import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/pages.$handle';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {BRAND, SHIPPING, whatsappLink} from '~/lib/config';
import {DELIVERY_ROWS, FAQ, PAGES, SITE} from '~/lib/content';
import {SizeTable} from '~/components/SizeGuide';
import {BrandLogo} from '~/components/BrandLogo';
import {
  IconArrow,
  IconChevron,
  IconClock,
  IconMail,
  IconPin,
  IconWhatsApp,
} from '~/components/Icons';

export const meta: Route.MetaFunction = ({data}) => {
  const title = data?.page?.title ?? data?.builtin?.title ?? '';
  return [
    {title: `${title} | ${BRAND.name}`},
    {
      name: 'description',
      content: data?.page?.seo?.description ?? data?.builtin?.intro ?? '',
    },
  ];
};

export async function loader({context, request, params}: Route.LoaderArgs) {
  const handle = params.handle;
  if (!handle) throw new Error('Missing page handle');

  const {page} = await context.storefront
    .query(PAGE_QUERY, {variables: {handle}})
    .catch(() => ({page: null}));

  if (page) {
    redirectIfHandleIsLocalized(request, {handle, data: page});
    return {page, builtin: null, handle};
  }
  const builtin = PAGES[handle];
  if (!builtin) throw new Response('Not Found', {status: 404});
  return {page: null, builtin, handle};
}

export default function Page() {
  const {page, builtin, handle} = useLoaderData<typeof loader>();
  const title = page?.title ?? builtin?.title ?? '';
  const intro = builtin?.intro;

  return (
    <div className={`page page--${handle}`}>
      <header className="page-head container">
        <nav className="crumbs" aria-label="Fil d’Ariane">
          <Link to="/">Accueil</Link>
          <span>/</span>
          <span aria-current="page">{title}</span>
        </nav>
        {handle === 'a-propos' || handle === 'authenticite' ? (
          <BrandLogo
            variant="crown-wordmark"
            height={48}
            className="page-head-logo"
          />
        ) : null}
        <h1 className="display-l">{title}</h1>
        {intro ? <p className="page-intro">{intro}</p> : null}
      </header>

      {page ? (
        <div className="container page-body">
          <div className="rte" dangerouslySetInnerHTML={{__html: page.body}} />
        </div>
      ) : handle === 'contact' ? (
        <ContactPage />
      ) : handle === 'faq' ? (
        <FaqPage />
      ) : handle === 'guide-des-tailles' ? (
        <SizeGuidePage sections={builtin!.sections} />
      ) : (
        <div className="container page-body">
          {builtin!.sections.map((s) => (
            <section key={s.title} className="page-section" data-reveal>
              <h2 className="display-s">{s.title}</h2>
              <div className="rte">
                {s.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          ))}
          {handle === 'authenticite' ? (
            <div className="page-cta">
              <Link to="/collections/all" className="btn">
                Voir les paires <IconArrow width={16} height={16} />
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function ContactPage() {
  return (
    <div className="container contact">
      <div className="contact-grid">
        <a
          className="contact-card contact-card--wa"
          href={whatsappLink('Salam ! J’ai une question.')}
          target="_blank"
          rel="noreferrer"
        >
          <IconWhatsApp width={28} height={28} />
          <span className="contact-card-title">WhatsApp</span>
          <span className="contact-card-copy">
            Réponse en quelques minutes, 7j/7.
          </span>
          <span className="link-arrow">
            Écrire maintenant <IconArrow width={16} height={16} />
          </span>
        </a>
        <a className="contact-card" href={`mailto:${BRAND.email}`}>
          <IconMail width={28} height={28} />
          <span className="contact-card-title">E-mail</span>
          <span className="contact-card-copy">{BRAND.email}</span>
          <span className="link-arrow">
            Envoyer un e-mail <IconArrow width={16} height={16} />
          </span>
        </a>
        <div className="contact-card">
          <IconPin width={28} height={28} />
          <span className="contact-card-title">Où nous trouver</span>
          <span className="contact-card-copy">{SITE.address}</span>
          <span className="contact-card-copy">
            <IconClock width={14} height={14} /> {SITE.hours}
          </span>
        </div>
      </div>

      <section className="contact-form-wrap" data-reveal>
        <h2 className="display-s">Une question précise ?</h2>
        <p className="muted">
          Remplis ce formulaire : il s’ouvre directement dans WhatsApp avec ton
          message prêt à envoyer.
        </p>
        <form
          className="contact-form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const msg = `Salam ! Je m'appelle ${f.get('name')}.\nSujet : ${f.get('subject')}\n\n${f.get('message')}`;
            window.open(whatsappLink(msg), '_blank');
          }}
        >
          <label>
            <span>Nom</span>
            <input name="name" required autoComplete="name" />
          </label>
          <label>
            <span>Sujet</span>
            <select name="subject" defaultValue="Question sur une paire">
              <option>Question sur une paire</option>
              <option>Pointure & conseils</option>
              <option>Suivi de commande</option>
              <option>Échange ou retour</option>
              <option>Autre</option>
            </select>
          </label>
          <label className="span-2">
            <span>Message</span>
            <textarea name="message" rows={5} required />
          </label>
          <button type="submit" className="btn btn--lg">
            <IconWhatsApp /> Envoyer sur WhatsApp
          </button>
        </form>
      </section>
    </div>
  );
}

function FaqPage() {
  return (
    <div className="container faq">
      <div className="faq-list">
        {FAQ.map((item, i) => (
          <details key={item.q} className="accordion" open={i === 0}>
            <summary>
              {item.q}
              <IconChevron width={18} height={18} />
            </summary>
            <div className="accordion-body">
              <p>{item.a}</p>
            </div>
          </details>
        ))}
      </div>
      <aside className="faq-side">
        <div className="faq-card">
          <p className="eyebrow">Livraison</p>
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
            Offerte dès {SHIPPING.freeShippingThreshold} DH d’achat.
          </p>
        </div>
        <div className="faq-card faq-card--ink">
          <p className="eyebrow eyebrow--light">Toujours une question ?</p>
          <p>On répond vite sur WhatsApp.</p>
          <a
            className="btn btn--light"
            href={whatsappLink('Salam ! J’ai une question.')}
            target="_blank"
            rel="noreferrer"
          >
            <IconWhatsApp /> Nous écrire
          </a>
        </div>
      </aside>
    </div>
  );
}

function SizeGuidePage({
  sections,
}: {
  sections: {title: string; body: string[]}[];
}) {
  return (
    <div className="container sizeguide">
      <div className="sizeguide-table" data-reveal>
        <SizeTable />
      </div>
      <div className="page-body">
        {sections.map((s) => (
          <section key={s.title} className="page-section" data-reveal>
            <h2 className="display-s">{s.title}</h2>
            <div className="rte">
              {s.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}
        <div className="page-cta">
          <a
            className="btn btn--ghost"
            href={whatsappLink(
              'Salam ! Ma longueur de pied est de … cm. Quelle pointure me conseillez-vous ?',
            )}
            target="_blank"
            rel="noreferrer"
          >
            <IconWhatsApp /> Demander conseil
          </a>
        </div>
      </div>
    </div>
  );
}

const PAGE_QUERY = `#graphql
  query Page(
    $language: LanguageCode,
    $country: CountryCode,
    $handle: String!
  )
  @inContext(language: $language, country: $country) {
    page(handle: $handle) {
      handle
      id
      title
      body
      seo {
        description
        title
      }
    }
  }
` as const;
