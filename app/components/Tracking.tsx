import {useEffect, useRef} from 'react';
import {useLocation} from 'react-router';
import {useConsent} from '~/lib/ui';
import {track, type TrackItem} from '~/lib/tracking';
import {captureAttribution} from '~/lib/attribution';

export type TrackingIds = {
  ga4?: string;
  metaPixel?: string;
  tiktokPixel?: string;
  clarity?: string;
};

/**
 * Loads Google Analytics 4, Meta Pixel, TikTok Pixel and Microsoft Clarity
 * only after the visitor accepts cookies, tells Shopify about the choice
 * (so Shopify Analytics and the checkout pixels respect it), and forwards
 * Hydrogen's analytics events to `track()`.
 */
export function Tracking({ids}: {ids: TrackingIds}) {
  const {consent} = useConsent();
  const accepted = consent === 'accepted';
  const loaded = useRef(false);

  // Remember where the visitor came from (UTM, fbclid, ttclid) — no cookies
  // needed for this first-party note, it only travels with the order.
  useEffect(() => {
    captureAttribution();
  }, []);

  // Tell Shopify (Customer Privacy API) about the visitor's choice.
  useEffect(() => {
    if (consent === 'unknown') return;
    const granted = consent === 'accepted';
    const apply = () => {
      const cp = (
        window as unknown as {
          Shopify?: {
            customerPrivacy?: {
              setTrackingConsent?: (
                c: Record<string, boolean>,
                cb: () => void,
              ) => void;
            };
          };
        }
      ).Shopify?.customerPrivacy;
      cp?.setTrackingConsent?.(
        {
          analytics: granted,
          marketing: granted,
          preferences: granted,
          sale_of_data: granted,
        },
        () => {},
      );
    };
    apply();
    document.addEventListener('visitorConsentCollected', apply, {once: true});
    const t = setTimeout(apply, 2500);
    return () => clearTimeout(t);
  }, [consent]);

  // Load the scripts once, after consent.
  useEffect(() => {
    if (!accepted || loaded.current) return;
    loaded.current = true;
    if (ids.ga4) loadGa4(ids.ga4);
    if (ids.metaPixel) loadMeta(ids.metaPixel);
    if (ids.tiktokPixel) loadTikTok(ids.tiktokPixel);
    if (ids.clarity) loadClarity(ids.clarity);
    track({
      name: 'page_view',
      path: window.location.pathname,
      title: document.title,
    });
  }, [accepted, ids.ga4, ids.metaPixel, ids.tiktokPixel, ids.clarity]);

  // Page views on every route change (single-page navigation).
  const location = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!loaded.current) return;
    const t = setTimeout(
      () =>
        track({
          name: 'page_view',
          path: location.pathname,
          title: document.title,
        }),
      50,
    );
    return () => clearTimeout(t);
    // Pathname only: picking a colour or size updates ?query, not the page.
  }, [location.pathname]);

  return null;
}

type CartLineLike = {
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    product: {id: string; title: string; vendor?: string};
  };
  cost?: {amountPerQuantity?: {amount: string} | null} | null;
};
export function cartLineItem(l: CartLineLike): TrackItem {
  return {
    productId: l.merchandise.product.id,
    variantId: l.merchandise.id,
    title: l.merchandise.product.title,
    brand: l.merchandise.product.vendor,
    variant: l.merchandise.title,
    price: Number(l.cost?.amountPerQuantity?.amount ?? 0),
    quantity: l.quantity,
  };
}

/* ---------- loaders ---------- */

function addScript(src: string) {
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

function loadGa4(id: string) {
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('consent', 'default', {
    ad_storage: 'granted',
    analytics_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
  });
  window.gtag('js', new Date());
  // Page views are sent by us on every route change (single-page app).
  window.gtag('config', id, {send_page_view: false, currency: 'MAD'});
  addScript(
    `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`,
  );
}

function loadMeta(pixelId: string) {
  const id = pixelId.replace(/[^0-9]/g, '');
  if (!id || window.fbq) return;
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
  /* eslint-enable */
  addScript('https://connect.facebook.net/en_US/fbevents.js');
  window.fbq!('init', id);
}

function loadTikTok(pixelId: string) {
  if (window.ttq) return;
  /* eslint-disable */
  const w: any = window;
  const t = 'ttq';
  w.TiktokAnalyticsObject = t;
  const ttq: any = (w[t] = w[t] || []);
  ttq.methods = [
    'page',
    'track',
    'identify',
    'instances',
    'debug',
    'on',
    'off',
    'once',
    'ready',
    'alias',
    'group',
    'enableCookie',
    'disableCookie',
    'holdConsent',
    'revokeConsent',
    'grantConsent',
  ];
  ttq.setAndDefer = (o: any, m: string) => {
    o[m] = function () {
      o.push([m].concat(Array.prototype.slice.call(arguments, 0)));
    };
  };
  for (const m of ttq.methods) ttq.setAndDefer(ttq, m);
  ttq.load = (id: string) => {
    const u = 'https://analytics.tiktok.com/i18n/pixel/events.js';
    ttq._i = ttq._i || {};
    ttq._i[id] = [];
    ttq._i[id]._u = u;
    ttq._t = ttq._t || {};
    ttq._t[id] = +new Date();
    ttq._o = ttq._o || {};
    ttq._o[id] = {};
    addScript(`${u}?sdkid=${id}&lib=${t}`);
  };
  /* eslint-enable */
  ttq.load(pixelId.trim());
}

function loadClarity(projectId: string) {
  if (window.clarity) return;
  /* eslint-disable */
  const w: any = window;
  w.clarity =
    w.clarity ||
    function () {
      (w.clarity.q = w.clarity.q || []).push(arguments);
    };
  /* eslint-enable */
  addScript(
    `https://www.clarity.ms/tag/${encodeURIComponent(projectId.trim())}`,
  );
}
