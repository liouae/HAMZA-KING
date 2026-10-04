import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
} from 'react-router';
import type {Route} from './+types/suivi';
import {IconCheck, IconTruck, IconWhatsApp} from '~/components/Icons';
import {BRAND, whatsappLink} from '~/lib/config';
import {SITE} from '~/lib/content';
import {adminCreds, adminGraphql} from '~/lib/admin.server';

/**
 * Order tracking without an account: order number + phone used for the order.
 * Reads the order with the Admin API (server side only) and never shows it
 * unless the phone matches. Status comes from the order tags the team sets
 * (à-confirmer → confirmé → expédié → livré | refusé | injoignable | échange)
 * and from Shopify fulfillments (carrier + tracking number).
 */

export const meta: Route.MetaFunction = () => [
  {title: `Suivre ma commande | ${BRAND.name}`},
  {
    name: 'description',
    content:
      'Suis ta commande HAMZA KING avec ton numéro de commande et ton téléphone : confirmation, expédition, livraison.',
  },
  {tagName: 'link', rel: 'canonical', href: `${SITE.url}/suivi`},
  {name: 'robots', content: 'noindex, follow'},
];

export function loader({request, context}: Route.LoaderArgs) {
  const url = new URL(request.url);
  return {
    order: url.searchParams.get('commande') ?? '',
    canLookup: Boolean(adminCreds(context.env)),
  };
}

type Step = {key: string; label: string; done: boolean; current: boolean};
type Found = {
  ok: true;
  name: string;
  date: string;
  city?: string | null;
  firstName?: string | null;
  total?: string;
  items: {
    title: string;
    variant?: string | null;
    qty: number;
    image?: string;
  }[];
  steps: Step[];
  alert?: {tone: 'warn' | 'info'; text: string};
  tracking?: {
    company?: string | null;
    number?: string | null;
    url?: string | null;
  };
  eta?: string | null;
  delivered: boolean;
  help: string;
};
type ActionResult = Found | {ok: false; error: string; whatsapp?: string};

const digits = (v: string) => v.replace(/\D/g, '').slice(-9);
const norm = (t: string) =>
  t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

export async function action({
  request,
  context,
}: Route.ActionArgs): Promise<ActionResult> {
  const f = await request.formData();
  const order = String(f.get('order') ?? '')
    .replace(/[^0-9a-zA-Z-]/g, '')
    .slice(0, 20);
  const phone = String(f.get('phone') ?? '').slice(0, 25);

  const whatsapp = whatsappLink(
    `Salam ${BRAND.name} 👋\nJe voudrais suivre ma commande.\n🧾 N° de commande : ${order ? `#${order}` : ''}\n📞 Téléphone : ${phone}`,
  );

  if (!order) return {ok: false, error: 'Indique ton numéro de commande.'};
  if (digits(phone).length < 9)
    return {ok: false, error: 'Indique le téléphone utilisé pour la commande.'};

  const creds = adminCreds(context.env);
  if (!creds) {
    return {
      ok: false,
      error:
        'Le suivi en ligne arrive très bientôt. En attendant, envoie-nous ces informations sur WhatsApp : on te répond tout de suite.',
      whatsapp,
    };
  }

  try {
    const data = await adminGraphql<{orders: {nodes: OrderNode[]}}>(
      creds,
      TRACK_ORDER_QUERY,
      {q: `name:#${order}`},
    );
    const o = data.orders.nodes[0];
    const phones = o
      ? [o.phone, o.shippingAddress?.phone, o.billingAddress?.phone]
          .filter(Boolean)
          .map((p) => digits(p!))
      : [];
    if (!o || !phones.includes(digits(phone))) {
      return {
        ok: false,
        error:
          'Aucune commande ne correspond à ce numéro et ce téléphone. Vérifie le numéro (il commence souvent par #10…) ou écris-nous sur WhatsApp.',
        whatsapp,
      };
    }
    return describe(o);
  } catch (error) {
    console.error(error);
    return {
      ok: false,
      error:
        'Le suivi est momentanément indisponible. Écris-nous sur WhatsApp, on te répond tout de suite.',
      whatsapp,
    };
  }
}

type OrderNode = {
  name: string;
  createdAt: string;
  cancelledAt: string | null;
  displayFulfillmentStatus: string;
  tags: string[];
  phone: string | null;
  shippingAddress: {
    phone: string | null;
    city: string | null;
    firstName: string | null;
  } | null;
  billingAddress: {phone: string | null} | null;
  totalPriceSet: {shopMoney: {amount: string; currencyCode: string}};
  lineItems: {
    nodes: {
      title: string;
      variantTitle: string | null;
      quantity: number;
      image: {url: string} | null;
    }[];
  };
  fulfillments: {
    status: string;
    displayStatus: string | null;
    createdAt: string;
    deliveredAt: string | null;
    estimatedDeliveryAt: string | null;
    trackingInfo: {
      company: string | null;
      number: string | null;
      url: string | null;
    }[];
  }[];
};

function describe(o: OrderNode): Found {
  const tags = o.tags.map(norm);
  const has = (...t: string[]) => t.some((x) => tags.includes(x));
  const f = o.fulfillments.find((x) => x.status !== 'CANCELLED');
  const delivered =
    has('livre') || f?.displayStatus === 'DELIVERED' || Boolean(f?.deliveredAt);
  const shipped =
    delivered ||
    has('expedie', 'en-livraison') ||
    Boolean(f) ||
    o.displayFulfillmentStatus === 'FULFILLED';
  const confirmed = shipped || has('confirme');

  const keys = [
    {key: 'recue', label: 'Commande reçue', done: true},
    {key: 'confirmee', label: 'Confirmée par téléphone', done: confirmed},
    {key: 'expediee', label: 'Expédiée', done: shipped},
    {key: 'livree', label: 'Livrée', done: delivered},
  ];
  const lastDone = keys.map((k) => k.done).lastIndexOf(true);
  const steps = keys.map((k, i) => ({...k, current: i === lastDone}));

  let alert: Found['alert'];
  if (o.cancelledAt) {
    alert = {
      tone: 'warn',
      text: 'Cette commande a été annulée. Une question ? Écris-nous sur WhatsApp.',
    };
  } else if (has('injoignable')) {
    alert = {
      tone: 'warn',
      text: 'On n’arrive pas à te joindre pour confirmer ta commande. Réponds-nous sur WhatsApp pour qu’on puisse l’expédier.',
    };
  } else if (has('echange')) {
    alert = {
      tone: 'info',
      text: 'Échange en cours : on récupère ta paire et on t’envoie la bonne, à nos frais.',
    };
  } else if (has('refuse')) {
    alert = {
      tone: 'warn',
      text: 'Le colis nous a été retourné. Écris-nous sur WhatsApp si tu veux le recevoir à nouveau.',
    };
  } else if (!confirmed) {
    alert = {
      tone: 'info',
      text: 'On t’appelle (ou on t’écrit sur WhatsApp) pour confirmer ta pointure et ton adresse, puis ta paire part.',
    };
  }

  const t = f?.trackingInfo[0];
  const money = o.totalPriceSet.shopMoney;
  return {
    ok: true,
    name: o.name,
    date: new Date(o.createdAt).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    city: o.shippingAddress?.city,
    firstName: o.shippingAddress?.firstName,
    total: `${Math.round(Number(money.amount)).toLocaleString('fr-FR')} DH`,
    items: o.lineItems.nodes.map((l) => ({
      title: l.title,
      variant: l.variantTitle,
      qty: l.quantity,
      image: l.image?.url,
    })),
    steps,
    alert,
    tracking: t && (t.number || t.url) ? t : undefined,
    eta: f?.estimatedDeliveryAt
      ? new Date(f.estimatedDeliveryAt).toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })
      : null,
    delivered,
    help: whatsappLink(
      `Salam ${BRAND.name} 👋\nJ’ai une question sur ma commande ${o.name}.`,
    ),
  };
}

export default function TrackPage() {
  const {order} = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const busy = useNavigation().state !== 'idle';

  return (
    <div className="track container">
      <header className="page-head page-head--tight">
        <p className="eyebrow">Suivi de commande</p>
        <h1 className="display-l">Où est ma paire ?</h1>
        <p className="muted track-intro">
          Entre ton numéro de commande et le téléphone utilisé pour commander.
          Pas besoin de compte.
        </p>
      </header>

      {result?.ok ? (
        <OrderStatus r={result} />
      ) : (
        <Form method="post" className="contact-form track-form">
          <label>
            <span>N° de commande</span>
            <input
              name="order"
              required
              defaultValue={order}
              placeholder="1001"
              inputMode="numeric"
              autoComplete="off"
            />
          </label>
          <label>
            <span>Téléphone</span>
            <input
              name="phone"
              type="tel"
              required
              placeholder="06 12 34 56 78"
              autoComplete="tel"
            />
          </label>
          {result && !result.ok ? (
            <div className="track-error span-2" role="alert">
              <p>{result.error}</p>
              {result.whatsapp ? (
                <a
                  className="btn btn--wa"
                  href={result.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                >
                  <IconWhatsApp /> Demander sur WhatsApp
                </a>
              ) : null}
            </div>
          ) : null}
          <button type="submit" className="btn btn--lg" disabled={busy}>
            {busy ? 'Recherche…' : 'Suivre ma commande'}
          </button>
          <p className="muted track-hint span-2">
            Ton numéro de commande est dans le message de confirmation (SMS,
            WhatsApp ou e-mail). Tu ne le retrouves pas ?{' '}
            <a
              href={whatsappLink(
                `Salam ${BRAND.name} 👋\nJe voudrais suivre ma commande mais je n’ai pas le numéro.\nNom : \nTéléphone : `,
              )}
              target="_blank"
              rel="noreferrer"
            >
              Écris-nous sur WhatsApp
            </a>
            . Tu as un compte ? <Link to="/account/orders">Connecte-toi</Link>.
          </p>
        </Form>
      )}
    </div>
  );
}

function OrderStatus({r}: {r: Found}) {
  return (
    <section className="track-result" aria-live="polite">
      <div className="track-head">
        <div>
          <p className="eyebrow">Commande {r.name}</p>
          <h2 className="display-s">
            {r.delivered
              ? 'Livrée.'
              : r.steps[2].done
                ? 'En route vers toi.'
                : r.steps[1].done
                  ? 'Confirmée, bientôt expédiée.'
                  : 'Bien reçue.'}
          </h2>
          <p className="muted">
            Passée le {r.date}
            {r.city ? ` · livraison à ${r.city}` : ''}
            {r.total ? ` · ${r.total} à payer à la livraison` : ''}
          </p>
        </div>
      </div>

      <ol className="track-steps">
        {r.steps.map((s) => (
          <li
            key={s.key}
            className={`${s.done ? 'is-done' : ''} ${s.current ? 'is-current' : ''}`}
          >
            <span className="track-dot" aria-hidden>
              {s.done ? <IconCheck width={14} height={14} /> : null}
            </span>
            <span>{s.label}</span>
          </li>
        ))}
      </ol>

      {r.alert ? (
        <p className={`track-alert track-alert--${r.alert.tone}`}>
          {r.alert.text}
        </p>
      ) : null}

      {r.tracking || r.eta ? (
        <div className="track-ship">
          <IconTruck width={20} height={20} />
          <div>
            {r.tracking?.company ? <strong>{r.tracking.company}</strong> : null}
            {r.tracking?.number ? (
              <p>N° de suivi : {r.tracking.number}</p>
            ) : null}
            {r.eta ? <p>Livraison prévue : {r.eta}</p> : null}
          </div>
          {r.tracking?.url ? (
            <a
              className="btn btn--sm"
              href={r.tracking.url}
              target="_blank"
              rel="noreferrer"
            >
              Suivre le colis
            </a>
          ) : null}
        </div>
      ) : null}

      <ul className="track-items">
        {r.items.map((i, n) => (
          <li key={n}>
            {i.image ? (
              <img
                src={`${i.image}${i.image.includes('?') ? '&' : '?'}width=160`}
                alt=""
                width={80}
                height={80}
                loading="lazy"
              />
            ) : null}
            <span>
              <strong>{i.title}</strong>
              {i.variant ? <span>{i.variant}</span> : null}
              {i.qty > 1 ? <span>× {i.qty}</span> : null}
            </span>
          </li>
        ))}
      </ul>

      <div className="track-actions">
        <a
          className="btn btn--wa"
          href={r.help}
          target="_blank"
          rel="noreferrer"
        >
          <IconWhatsApp /> Une question sur ma commande
        </a>
        {r.delivered ? (
          <Link
            className="btn btn--ghost"
            to={`/avis?commande=${encodeURIComponent(r.name.replace('#', ''))}#ecrire`}
          >
            Donner mon avis
          </Link>
        ) : null}
        <Link className="link-arrow" to="/suivi">
          Suivre une autre commande
        </Link>
      </div>
    </section>
  );
}

const TRACK_ORDER_QUERY = `
  query TrackOrder($q: String!) {
    orders(first: 1, query: $q) {
      nodes {
        name
        createdAt
        cancelledAt
        displayFulfillmentStatus
        tags
        phone
        shippingAddress { phone city firstName }
        billingAddress { phone }
        totalPriceSet { shopMoney { amount currencyCode } }
        lineItems(first: 10) {
          nodes { title variantTitle quantity image { url } }
        }
        fulfillments(first: 5) {
          status
          displayStatus
          createdAt
          deliveredAt
          estimatedDeliveryAt
          trackingInfo(first: 1) { company number url }
        }
      }
    }
  }
`;
