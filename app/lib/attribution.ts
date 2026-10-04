/**
 * First-party attribution: where did this visitor come from?
 *
 * Captured on landing (utm_*, fbclid, ttclid, gclid, referrer, landing page),
 * kept as first touch + last touch in localStorage, and written onto the
 * cart as hidden attributes (keys start with "_") so every Shopify order
 * shows its source in Orders → order → "Additional details".
 * That is what lets us compute cost per DELIVERED order per campaign.
 */

export type Touch = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  fbclid?: string;
  ttclid?: string;
  gclid?: string;
  referrer?: string;
  landing?: string;
  at: string;
};

const FIRST = 'hk:attr:first';
const LAST = 'hk:attr:last';

function read(key: string): Touch | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Touch) : null;
  } catch {
    return null;
  }
}
function write(key: string, t: Touch) {
  try {
    window.localStorage.setItem(key, JSON.stringify(t));
  } catch {
    /* storage blocked */
  }
}

function referrerSource(ref: string) {
  try {
    const host = new URL(ref).hostname.replace(/^www\./, '');
    if (host.includes(window.location.hostname)) return null;
    if (/facebook|fb\.com|messenger/.test(host))
      return {source: 'facebook', medium: 'referral'};
    if (/instagram/.test(host))
      return {source: 'instagram', medium: 'referral'};
    if (/tiktok/.test(host)) return {source: 'tiktok', medium: 'referral'};
    if (/whatsapp|wa\.me/.test(host))
      return {source: 'whatsapp', medium: 'referral'};
    if (/google\./.test(host)) return {source: 'google', medium: 'organic'};
    if (/bing\.|yahoo\.|duckduckgo/.test(host))
      return {source: host.split('.')[0], medium: 'organic'};
    return {source: host, medium: 'referral'};
  } catch {
    return null;
  }
}

/** Call once per page load. Records a new touch when the visit carries a source. */
export function captureAttribution() {
  if (typeof window === 'undefined') return;
  const q = new URLSearchParams(window.location.search);
  const pick = (k: string) => q.get(k)?.slice(0, 120) || undefined;
  const touch: Touch = {
    source: pick('utm_source'),
    medium: pick('utm_medium'),
    campaign: pick('utm_campaign'),
    content: pick('utm_content'),
    term: pick('utm_term'),
    fbclid: pick('fbclid'),
    ttclid: pick('ttclid'),
    gclid: pick('gclid'),
    landing: window.location.pathname,
    at: new Date().toISOString(),
  };
  if (!touch.source) {
    if (touch.fbclid) Object.assign(touch, {source: 'meta', medium: 'paid'});
    else if (touch.ttclid)
      Object.assign(touch, {source: 'tiktok', medium: 'paid'});
    else if (touch.gclid)
      Object.assign(touch, {source: 'google', medium: 'paid'});
  }
  if (!touch.source && document.referrer) {
    const r = referrerSource(document.referrer);
    if (r) Object.assign(touch, r, {referrer: document.referrer.slice(0, 200)});
  }
  if (!read(FIRST)) {
    write(
      FIRST,
      touch.source ? touch : {...touch, source: 'direct', medium: 'none'},
    );
  }
  if (touch.source) write(LAST, touch);
}

/** Cart attributes describing first + last touch (hidden keys, start with "_"). */
export function attributionAttributes(): {key: string; value: string}[] {
  if (typeof window === 'undefined') return [];
  const first = read(FIRST);
  const last = read(LAST) ?? first;
  if (!first && !last) return [];
  const fmt = (t: Touch | null) =>
    t
      ? [t.source, t.medium, t.campaign, t.content].filter(Boolean).join(' / ')
      : '';
  const out: {key: string; value: string}[] = [
    {key: '_source_last', value: fmt(last)},
    {key: '_source_first', value: fmt(first)},
    {key: '_landing', value: last?.landing ?? first?.landing ?? ''},
  ];
  if (last?.fbclid) out.push({key: '_fbclid', value: last.fbclid});
  if (last?.ttclid) out.push({key: '_ttclid', value: last.ttclid});
  if (last?.gclid) out.push({key: '_gclid', value: last.gclid});
  return out.filter((a) => a.value);
}

/** Short tag for WhatsApp messages, e.g. "meta/2610-sales-broad". */
export function attributionRef(): string {
  if (typeof window === 'undefined') return '';
  const last = read(LAST);
  if (!last?.source || last.source === 'direct') return '';
  return [last.source, last.campaign].filter(Boolean).join('/');
}
