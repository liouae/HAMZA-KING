/**
 * HAMZA KING — one tracking layer for every platform.
 *
 * Pages and components call `track()` with a GA4-style event; this module
 * fans it out to Google Analytics 4, the Meta Pixel and the TikTok Pixel —
 * only for the platforms that are configured AND accepted in the cookie
 * banner. Product IDs are written so they match the catalogues that the
 * Shopify "Facebook & Instagram" and "TikTok" apps sync:
 *   Meta   → shopify_MA_<productId>_<variantId>
 *   TikTok → <variantId>
 *   GA4    → <variantId> (+ item_group_id = productId)
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    ttq?: {
      track: (
        event: string,
        params?: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => void;
      page: () => void;
      load: (id: string) => void;
      [k: string]: unknown;
    };
    clarity?: (...args: unknown[]) => void;
  }
}

export type TrackItem = {
  productId: string; // gid or numeric
  variantId?: string; // gid or numeric
  title: string;
  brand?: string;
  variant?: string;
  category?: string;
  price: number;
  quantity?: number;
};

export type TrackEvent =
  | {name: 'page_view'; path: string; title?: string}
  | {name: 'view_item'; item: TrackItem}
  | {
      name: 'view_item_list';
      listId: string;
      listName: string;
      items?: TrackItem[];
    }
  | {name: 'search'; term: string}
  | {name: 'add_to_cart'; item: TrackItem}
  | {name: 'view_cart'; value: number; items: TrackItem[]}
  | {name: 'begin_checkout'; value: number; items: TrackItem[]}
  | {
      name: 'whatsapp_click';
      intent: 'question' | 'order';
      context: string; // product / collection / cart / …
      value?: number;
      items?: TrackItem[];
    };

export const CURRENCY = 'MAD';
export const META_CATALOG_COUNTRY = 'MA';

export const numericId = (gid?: string | null) =>
  (gid ?? '').split('/').pop()?.split('?')[0] ?? '';

export const metaContentId = (item: TrackItem) =>
  item.variantId
    ? `shopify_${META_CATALOG_COUNTRY}_${numericId(item.productId)}_${numericId(item.variantId)}`
    : numericId(item.productId);

const eventId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const ga4Item = (i: TrackItem) => ({
  item_id: numericId(i.variantId) || numericId(i.productId),
  item_group_id: numericId(i.productId),
  item_name: i.title,
  item_brand: i.brand,
  item_variant: i.variant,
  item_category: i.category,
  price: i.price,
  quantity: i.quantity ?? 1,
});

const metaParams = (items: TrackItem[], value: number) => ({
  content_ids: items.map(metaContentId),
  contents: items.map((i) => ({
    id: metaContentId(i),
    quantity: i.quantity ?? 1,
    item_price: i.price,
  })),
  content_type: 'product',
  num_items: items.reduce((n, i) => n + (i.quantity ?? 1), 0),
  value,
  currency: CURRENCY,
});

const ttParams = (items: TrackItem[], value: number) => ({
  contents: items.map((i) => ({
    content_id: numericId(i.variantId) || numericId(i.productId),
    content_type: 'product',
    content_name: i.title,
    quantity: i.quantity ?? 1,
    price: i.price,
  })),
  value,
  currency: CURRENCY,
});

const sum = (items: TrackItem[]) =>
  items.reduce((s, i) => s + i.price * (i.quantity ?? 1), 0);

/** Send one event to every loaded platform. Safe to call anywhere. */
export function track(e: TrackEvent) {
  if (typeof window === 'undefined') return;
  const gtag = window.gtag;
  const fbq = window.fbq;
  const ttq = window.ttq;
  const id = eventId();

  switch (e.name) {
    case 'page_view':
      gtag?.('event', 'page_view', {
        page_path: e.path,
        page_title: e.title,
        page_location: window.location.href,
      });
      fbq?.('track', 'PageView', {}, {eventID: id});
      ttq?.page();
      return;

    case 'view_item': {
      const v = e.item.price;
      gtag?.('event', 'view_item', {
        currency: CURRENCY,
        value: v,
        items: [ga4Item(e.item)],
      });
      fbq?.(
        'track',
        'ViewContent',
        {
          ...metaParams([e.item], v),
          content_name: e.item.title,
          content_category: e.item.category,
        },
        {eventID: id},
      );
      ttq?.track('ViewContent', ttParams([e.item], v), {event_id: id});
      return;
    }

    case 'view_item_list':
      gtag?.('event', 'view_item_list', {
        item_list_id: e.listId,
        item_list_name: e.listName,
        items: (e.items ?? []).map(ga4Item),
      });
      fbq?.(
        'trackCustom',
        'ViewCategory',
        {content_category: e.listName},
        {eventID: id},
      );
      return;

    case 'search':
      gtag?.('event', 'search', {search_term: e.term});
      fbq?.('track', 'Search', {search_string: e.term}, {eventID: id});
      ttq?.track('Search', {query: e.term}, {event_id: id});
      return;

    case 'add_to_cart': {
      const v = e.item.price * (e.item.quantity ?? 1);
      gtag?.('event', 'add_to_cart', {
        currency: CURRENCY,
        value: v,
        items: [ga4Item(e.item)],
      });
      fbq?.(
        'track',
        'AddToCart',
        {...metaParams([e.item], v), content_name: e.item.title},
        {eventID: id},
      );
      ttq?.track('AddToCart', ttParams([e.item], v), {event_id: id});
      return;
    }

    case 'view_cart':
      gtag?.('event', 'view_cart', {
        currency: CURRENCY,
        value: e.value,
        items: e.items.map(ga4Item),
      });
      return;

    case 'begin_checkout':
      gtag?.('event', 'begin_checkout', {
        currency: CURRENCY,
        value: e.value,
        items: e.items.map(ga4Item),
      });
      fbq?.('track', 'InitiateCheckout', metaParams(e.items, e.value), {
        eventID: id,
      });
      ttq?.track('InitiateCheckout', ttParams(e.items, e.value), {
        event_id: id,
      });
      return;

    case 'whatsapp_click': {
      const items = e.items ?? [];
      const value = e.value ?? sum(items);
      // GA4: a lead, flagged by intent and page context.
      gtag?.('event', 'generate_lead', {
        currency: CURRENCY,
        value,
        lead_source: 'whatsapp',
        lead_intent: e.intent,
        lead_context: e.context,
        items: items.map(ga4Item),
      });
      // Meta: "Contact" for every chat; "Lead" when it's an order.
      fbq?.(
        'track',
        'Contact',
        {content_category: e.context},
        {eventID: `${id}-c`},
      );
      if (e.intent === 'order') {
        fbq?.(
          'track',
          'Lead',
          {...metaParams(items, value), content_category: 'whatsapp_order'},
          {eventID: id},
        );
      }
      ttq?.track(
        e.intent === 'order' ? 'PlaceAnOrder' : 'Contact',
        ttParams(items, value),
        {event_id: id},
      );
      window.clarity?.('event', `whatsapp_${e.intent}`);
      return;
    }
  }
}
