/**
 * Model landing pages (Shopify smart collections, filled automatically by
 * product title or by the tag `modele-<handle>`). Used for internal links:
 * menu "Icônes", brand pages, product pages. Empty ones are hidden by the
 * live-catalogue filter, so add models here freely.
 */
export type Model = {
  handle: string;
  name: string;
  /** Brand collection handle. */
  brand: string;
  /** Matches a product title (keep in sync with the collection rules). */
  match: RegExp;
};

export const MODELS: Model[] = [
  {
    handle: 'nike-air-force-1',
    name: 'Air Force 1',
    brand: 'nike',
    match: /air force 1/i,
  },
  {
    handle: 'nike-dunk-low',
    name: 'Dunk Low',
    brand: 'nike',
    match: /dunk low/i,
  },
  {
    handle: 'nike-air-max-plus-tn',
    name: 'Air Max Plus (TN)',
    brand: 'nike',
    match: /air max plus/i,
  },
  {
    handle: 'nike-air-max-90',
    name: 'Air Max 90',
    brand: 'nike',
    match: /air max 90/i,
  },
  {handle: 'nike-vomero', name: 'Vomero', brand: 'nike', match: /vomero/i},
  {handle: 'nike-pegasus', name: 'Pegasus', brand: 'nike', match: /pegasus/i},
  {
    handle: 'air-jordan-1',
    name: 'Air Jordan 1',
    brand: 'jordan',
    match: /jordan 1 (low|mid|high|retro)/i,
  },
  {
    handle: 'air-jordan-4',
    name: 'Air Jordan 4',
    brand: 'jordan',
    match: /jordan 4/i,
  },
  {handle: 'adidas-samba', name: 'Samba', brand: 'adidas', match: /samba/i},
  {
    handle: 'adidas-gazelle',
    name: 'Gazelle',
    brand: 'adidas',
    match: /gazelle/i,
  },
  {handle: 'adidas-campus', name: 'Campus', brand: 'adidas', match: /campus/i},
  {
    handle: 'new-balance-530',
    name: '530',
    brand: 'new-balance',
    match: /balance 530/i,
  },
  {
    handle: 'new-balance-9060',
    name: '9060',
    brand: 'new-balance',
    match: /9060/i,
  },
  {
    handle: 'new-balance-550',
    name: '550',
    brand: 'new-balance',
    match: /balance 550/i,
  },
  {
    handle: 'new-balance-2002r',
    name: '2002R',
    brand: 'new-balance',
    match: /2002r/i,
  },
  {
    handle: 'asics-gel-kayano-14',
    name: 'Gel-Kayano 14',
    brand: 'asics',
    match: /kayano 14/i,
  },
  {handle: 'asics-gel-1130', name: 'Gel-1130', brand: 'asics', match: /1130/i},
  {
    handle: 'asics-gel-nimbus',
    name: 'Gel-Nimbus',
    brand: 'asics',
    match: /nimbus/i,
  },
  {handle: 'on-cloud', name: 'Cloud', brand: 'on', match: /\bcloud/i},
  {handle: 'hoka-clifton', name: 'Clifton', brand: 'hoka', match: /clifton/i},
  {handle: 'hoka-bondi', name: 'Bondi', brand: 'hoka', match: /bondi/i},
  {
    handle: 'converse-chuck-taylor',
    name: 'Chuck Taylor',
    brand: 'converse',
    match: /chuck taylor|chuck 70|all star/i,
  },
  {
    handle: 'vans-old-skool',
    name: 'Old Skool',
    brand: 'vans',
    match: /old skool/i,
  },
  {
    handle: 'puma-speedcat',
    name: 'Speedcat',
    brand: 'puma',
    match: /speedcat/i,
  },
];

export const modelByHandle = (h: string) => MODELS.find((m) => m.handle === h);

/** The model page a product belongs to (by title + vendor). */
export function modelForProduct(title: string, vendor?: string) {
  const v = (vendor ?? '').toLowerCase().replace(/\s+/g, '-');
  return MODELS.find(
    (m) => m.match.test(title) && (m.brand !== 'on' || v === 'on'),
  );
}

export const modelsOfBrand = (brand: string) =>
  MODELS.filter((m) => m.brand === brand);
