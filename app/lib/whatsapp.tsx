import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import {useLocation} from 'react-router';
import {BRAND, BRANDS, whatsappLink} from './config';
import {attributionRef} from './attribution';
import {track} from './tracking';

/**
 * Context-aware WhatsApp messages.
 *
 * Pages describe what the visitor is looking at with `useWhatsAppTopic()`;
 * every WhatsApp button on the site (floating button, top bar, menus, cart,
 * product page…) then opens a message written for that page: the exact pair,
 * colour, size and price, the collection and filters, the search, the cart…
 * Without a topic, a message is still derived from the current URL.
 */

export type WaLine = {
  title: string;
  variant?: string;
  quantity?: number;
  price?: string;
};

export type WaTopic =
  | {
      kind: 'product';
      title: string;
      vendor?: string;
      color?: string;
      size?: string;
      price?: string;
      /** For tracking only (never shown in the message). */
      productId?: string;
      variantId?: string;
      amount?: number;
    }
  | {kind: 'collection'; title: string; handle: string}
  | {kind: 'search'; query: string; count?: number}
  | {kind: 'cart'; lines: WaLine[]; total?: string; amount?: number}
  | {kind: 'wishlist'; items: WaLine[]};

export type WaIntent = 'question' | 'order';

const HELLO = `Salam ${BRAND.name} 👋`;

/* ---------- message builders ---------- */

function productLines(t: Extract<WaTopic, {kind: 'product'}>) {
  return [
    `👟 ${t.title}`,
    t.color ? `🎨 Coloris : ${t.color}` : '',
    `📏 Pointure : ${t.size || 'à confirmer'}`,
    t.price ? `💰 Prix : ${t.price}` : '',
  ].filter(Boolean);
}

function lineText(l: WaLine) {
  return `• ${l.title}${l.variant ? ` — ${l.variant}` : ''}${
    l.quantity && l.quantity > 1 ? ` ×${l.quantity}` : ''
  }${l.price ? ` (${l.price})` : ''}`;
}

/** Human-readable active filters from a collection/search URL. */
export function describeFilters(search: string) {
  const params = new URLSearchParams(search);
  const out: string[] = [];
  for (const raw of params.getAll('filter')) {
    try {
      const f = JSON.parse(raw) as Record<string, unknown>;
      const opt = f.variantOption as
        {name?: string; value?: string} | undefined;
      if (opt?.value) out.push(`${opt.name ?? 'Option'} ${opt.value}`);
      else if (typeof f.productVendor === 'string') out.push(f.productVendor);
      else if (typeof f.productType === 'string') out.push(f.productType);
      else if (f.available === true) out.push('en stock');
    } catch {
      /* ignore malformed filter */
    }
  }
  const min = params.get('price.min');
  const max = params.get('price.max');
  if (min || max)
    out.push(
      `budget ${min ? `${min} DH` : ''}${min && max ? ' – ' : ''}${max ? `${max} DH` : ''}`.trim(),
    );
  return out;
}

export function buildWhatsAppMessage(args: {
  intent?: WaIntent;
  topic?: WaTopic | null;
  pathname: string;
  search?: string;
  url?: string;
  /** Ad reference shown at the end, e.g. "meta/2610-sales-broad". */
  adRef?: string;
}): string {
  const msg = buildMessageBody(args);
  if (!args.adRef) return msg;
  // Put the reference under the link (or under the greeting), never after
  // the lines the customer is meant to fill in.
  const lines = msg.split('\n');
  const at = lines.findIndex((l) => l.startsWith('🔗 '));
  lines.splice(at >= 0 ? at + 1 : 1, 0, `🏷️ Réf. : ${args.adRef}`);
  return lines.join('\n');
}

function buildMessageBody({
  intent = 'question',
  topic,
  pathname,
  search = '',
  url,
}: {
  intent?: WaIntent;
  topic?: WaTopic | null;
  pathname: string;
  search?: string;
  url?: string;
}): string {
  const link = url ? `\n\n🔗 ${url}` : '';

  if (topic?.kind === 'product') {
    if (intent === 'order') {
      return `${HELLO}\nJe souhaite commander cette paire :\n\n${productLines(topic).join('\n')}${link}\n\nVous pouvez me confirmer la disponibilité ? Merci !`;
    }
    return `${HELLO}\nJ’ai une question sur cette paire :\n\n${productLines(
      topic,
    )
      .filter((l) => !l.startsWith('📏') || topic.size)
      .join('\n')}${link}\n\nMa question : `;
  }

  if (topic?.kind === 'cart') {
    if (!topic.lines.length) {
      return `${HELLO}\nJe veux passer une commande, vous pouvez m’aider ?`;
    }
    return `${HELLO}\nJe souhaite commander :\n\n${topic.lines.map(lineText).join('\n')}${
      topic.total ? `\n\n💰 Total : ${topic.total}` : ''
    }\n🚚 Livraison gratuite · paiement à la livraison\n\nNom : \nVille : \nAdresse : `;
  }

  if (topic?.kind === 'wishlist') {
    return `${HELLO}\nVoici les paires de ma wishlist :\n\n${topic.items
      .map(lineText)
      .join('\n')}\n\nLesquelles sont disponibles dans ma pointure ( ) ?`;
  }

  if (topic?.kind === 'search') {
    return topic.count === 0
      ? `${HELLO}\nJe cherche « ${topic.query} » mais je ne l’ai pas trouvé sur le site. Vous pouvez l’avoir pour moi ?`
      : `${HELLO}\nJe cherche « ${topic.query} » sur votre site. Qu’est-ce que vous avez en stock ?${link}`;
  }

  if (topic?.kind === 'collection') {
    const brand = BRANDS.find((b) => b.handle === topic.handle);
    const filters = describeFilters(search);
    const filterLine = filters.length
      ? `\nMes critères : ${filters.join(' · ')}`
      : '';
    if (brand) {
      return `${HELLO}\nJe cherche une paire ${brand.name}.${filterLine}\nQuels modèles avez-vous en ce moment ?${link}`;
    }
    return `${HELLO}\nJe regarde la sélection « ${topic.title} » sur votre site.${filterLine}\nVous pouvez me conseiller une paire ?${link}`;
  }

  // No topic: derive from the URL.
  if (pathname.startsWith('/pages/guide-des-tailles')) {
    return `${HELLO}\nJ’hésite sur ma pointure.\nLongueur de mon pied : … cm\nModèle qui m’intéresse : `;
  }
  if (
    pathname.startsWith('/account/orders') ||
    pathname.startsWith('/account')
  ) {
    return `${HELLO}\nJe voudrais des nouvelles de ma commande.\nN° de commande : \nNom : `;
  }
  if (pathname.startsWith('/pages/faq') || pathname.startsWith('/policies')) {
    return `${HELLO}\nJ’ai une question sur la livraison / le paiement à la livraison : `;
  }
  if (pathname.startsWith('/marques')) {
    return `${HELLO}\nJe cherche une marque en particulier : `;
  }
  if (pathname.startsWith('/products/')) {
    return `${HELLO}\nJ’ai une question sur cette paire :${link}\n\n`;
  }
  if (pathname.startsWith('/collections/')) {
    return `${HELLO}\nVous pouvez me conseiller une paire de cette sélection ?${link}`;
  }
  if (pathname.startsWith('/cart')) {
    return `${HELLO}\nJ’ai une question sur ma commande.`;
  }
  return `${HELLO}\nJe cherche une paire, vous pouvez me conseiller ?\nStyle : \nPointure : `;
}

/* ---------- context ---------- */

type Ctx = {
  topic: WaTopic | null;
  setTopic: (t: WaTopic | null) => void;
};
const WhatsAppContext = createContext<Ctx>({topic: null, setTopic: () => {}});

export function WhatsAppProvider({children}: {children: ReactNode}) {
  const [topic, setTopic] = useState<WaTopic | null>(null);
  const value = useMemo(() => ({topic, setTopic}), [topic]);
  return (
    <WhatsAppContext.Provider value={value}>
      {children}
    </WhatsAppContext.Provider>
  );
}

/** Declare what this page is about. Cleared when the page unmounts. */
export function useWhatsAppTopic(topic: WaTopic | null) {
  const {setTopic} = useContext(WhatsAppContext);
  const key = JSON.stringify(topic);
  useEffect(() => {
    setTopic(topic);
    return () => setTopic(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, setTopic]);
}

export function useWhatsAppTopicValue() {
  return useContext(WhatsAppContext).topic;
}

/**
 * WhatsApp link props for the current page: spread them on an <a>.
 * The href is contextual after mount, and is rebuilt again at click time so
 * it always carries the exact colour, size and URL the visitor sees.
 */
export function useWhatsAppLink(
  intent: WaIntent = 'question',
  override?: WaTopic | null,
) {
  const location = useLocation();
  const ctxTopic = useWhatsAppTopicValue();
  const topic = override ?? ctxTopic;
  const build = () =>
    whatsappLink(
      buildWhatsAppMessage({
        intent,
        topic,
        pathname: window.location.pathname,
        search: window.location.search,
        url: window.location.href,
        adRef: attributionRef(),
      }),
    );
  const [href, setHref] = useState(() =>
    whatsappLink(`${HELLO}\nJ’ai une question.`),
  );
  const key = JSON.stringify(topic);
  useEffect(() => {
    setHref(build());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent, key, location.pathname, location.search]);
  return {
    href,
    onClick: (e: ReactMouseEvent<HTMLAnchorElement>) => {
      e.currentTarget.href = build();
      trackWhatsApp(intent, topic, location.pathname);
    },
  };
}

/** Report a WhatsApp click to GA4 / Meta / TikTok as a lead. */
function trackWhatsApp(
  intent: WaIntent,
  topic: WaTopic | null | undefined,
  pathname: string,
) {
  const context =
    topic?.kind ??
    (pathname === '/' ? 'home' : pathname.split('/')[1] || 'page');
  if (topic?.kind === 'product') {
    const amount = topic.amount ?? 0;
    track({
      name: 'whatsapp_click',
      intent,
      context,
      value: amount,
      items: topic.productId
        ? [
            {
              productId: topic.productId,
              variantId: topic.variantId,
              title: topic.title,
              brand: topic.vendor,
              variant: [topic.color, topic.size].filter(Boolean).join(' / '),
              price: amount,
            },
          ]
        : [],
    });
    return;
  }
  if (topic?.kind === 'cart') {
    track({name: 'whatsapp_click', intent, context, value: topic.amount ?? 0});
    return;
  }
  track({name: 'whatsapp_click', intent, context});
}
