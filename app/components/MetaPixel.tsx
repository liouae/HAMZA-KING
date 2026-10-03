import {useEffect} from 'react';
import {useAnalytics, useNonce} from '@shopify/hydrogen';
import {useConsent} from '~/lib/ui';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

/**
 * Meta (Facebook / Instagram) Pixel for Hydrogen.
 * Set PUBLIC_META_PIXEL_ID in your Oxygen environment variables to enable it.
 * Purchase events are tracked by Shopify checkout via the Facebook & Instagram app.
 */
export function MetaPixel({pixelId}: {pixelId?: string}) {
  const nonce = useNonce();
  const {subscribe, register} = useAnalytics();
  const {ready} = register('Meta Pixel');
  const {consent} = useConsent();
  const enabled = Boolean(pixelId) && consent === 'accepted';

  // Load the pixel script only after consent.
  useEffect(() => {
    if (!enabled || window.fbq) return;
    const id = pixelId!.replace(/[^0-9]/g, '');
    /* eslint-disable */
    const f: any = window;
    const n: any = (f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    const t = document.createElement('script');
    t.async = true;
    t.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(t);
    f.fbq('init', id);
    f.fbq('track', 'PageView');
    /* eslint-enable */
  }, [enabled, pixelId]);

  useEffect(() => {
    if (!enabled) {
      ready();
      return;
    }

    const fbq = (...args: unknown[]) => window.fbq?.(...args);

    // PageView is fired on init; route changes:
    subscribe('page_viewed', () => fbq('track', 'PageView'));

    subscribe('product_viewed', (data) => {
      const p = data.products?.[0];
      if (!p) return;
      fbq('track', 'ViewContent', {
        content_ids: [p.variantId || p.id],
        content_name: p.title,
        content_type: 'product',
        value: Number(p.price),
        currency: 'MAD',
      });
    });

    subscribe('collection_viewed', (data) => {
      fbq('trackCustom', 'ViewCategory', {
        content_category: data.collection?.handle,
      });
    });

    subscribe('search_viewed', (data) => {
      fbq('track', 'Search', {search_string: data.searchTerm});
    });

    subscribe('product_added_to_cart', (data) => {
      const line = data.currentLine;
      if (!line) return;
      fbq('track', 'AddToCart', {
        content_ids: [line.merchandise.id],
        content_name: line.merchandise.product.title,
        content_type: 'product',
        value: Number(line.cost?.amountPerQuantity?.amount ?? 0),
        currency: line.cost?.amountPerQuantity?.currencyCode ?? 'MAD',
      });
    });

    subscribe('cart_viewed', (data) => {
      if (!data.cart?.totalQuantity) return;
      fbq('trackCustom', 'CartViewed', {
        value: Number(data.cart.cost?.totalAmount?.amount ?? 0),
        currency: data.cart.cost?.totalAmount?.currencyCode ?? 'MAD',
      });
    });

    ready();
  }, [pixelId, subscribe, ready]);

  void nonce;
  return null;
}

/**
 * Sends a "Lead" event when a customer clicks to order on WhatsApp.
 */
export function trackLead(params: Record<string, unknown>) {
  if (typeof window !== 'undefined') window.fbq?.('track', 'Lead', params);
}
