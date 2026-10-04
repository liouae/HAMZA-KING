/**
 * HAMZAKINGSTORE — central store configuration.
 * Edit this file to change brand copy, contact details, shipping rules
 * and homepage merchandising without touching component code.
 */

export const BRAND = {
  name: 'HAMZA KING',
  legalName: 'HAMZAKINGSTORE',
  tagline: 'Sneakers. Livraison gratuite partout au Maroc.',
  instagram: 'https://www.instagram.com/hamza__king07__/',
  tiktok: 'https://www.tiktok.com/@brahmi.hamza4',
  /** Leave empty to hide the link. */
  facebook: '',
  email: 'hamza20king00@gmail.com',
};

/** Social profiles shown in the footer and on the contact page (empty URL = hidden). */
export const SOCIALS = [
  {
    network: 'instagram',
    name: 'Instagram',
    handle: '@hamza__king07__',
    url: BRAND.instagram,
  },
  {
    network: 'tiktok',
    name: 'TikTok',
    handle: '@brahmi.hamza4',
    url: BRAND.tiktok,
  },
  {
    network: 'facebook',
    name: 'Facebook',
    handle: 'HAMZA KING',
    url: BRAND.facebook,
  },
].filter((s) => s.url) as {
  network: 'instagram' | 'tiktok' | 'facebook';
  name: string;
  handle: string;
  url: string;
}[];

/** WhatsApp number in international format, digits only (e.g. 2126XXXXXXXX). */
export const WHATSAPP_NUMBER = '212614719446';
/** Same number, formatted for display. */
export const WHATSAPP_DISPLAY = '+212 614-719446';

export const SHIPPING = {
  /** Delivery is free for every order, everywhere in Morocco. */
  free: true,
  /** Payment: cash on delivery only. */
  cashOnDeliveryOnly: true,
  /** Shown on product pages and in the cart. */
  deliveryCasablanca: '24h',
  deliveryMorocco: '48h – 72h',
  returnDays: 7,
};

/** Rotating messages in the announcement bar. */
export const ANNOUNCEMENTS = [
  'Livraison gratuite partout au Maroc',
  'Paiement à la livraison',
  `Échange de pointure sous ${SHIPPING.returnDays} jours`,
];

/**
 * Brands shown in the "Marques" mega-menu, the scrolling strip and the brand index.
 * `handle` must match a Shopify collection handle.
 * `logo` (optional): path to the brand's OFFICIAL logo file in /public/brands/
 * (SVG or transparent PNG from the brand's press kit or your authorised supplier).
 * When a logo is missing, the brand name is shown in the site's typography.
 */
export type Brand = {
  name: string;
  handle: string;
  logo?: string;
  /** Short line shown in the brand menu and on /marques. */
  tagline?: string;
  /** Which shopper journeys this brand is strongest in (used as quick links). */
  focus?: ('running' | 'lifestyle' | 'basketball' | 'outdoor')[];
};

export const BRANDS: Brand[] = [
  {
    name: 'Nike',
    handle: 'nike',
    logo: '/brands/nike.png',
    tagline: 'Running, basket et icônes de la rue.',
    focus: ['running', 'lifestyle', 'basketball'],
  },
  {
    name: 'Jordan',
    handle: 'jordan',
    logo: '/brands/jordan.png',
    tagline: 'L’héritage du basket, du parquet au bitume.',
    focus: ['basketball', 'lifestyle'],
  },
  {
    name: 'Adidas',
    handle: 'adidas',
    logo: '/brands/adidas.png',
    tagline: 'Performance et terrains de sport.',
    focus: ['running', 'lifestyle'],
  },
  {
    name: 'Adidas Originals',
    handle: 'adidas-originals',
    logo: '/brands/adidas-originals.png',
    tagline: 'Les classiques rétro, portés au quotidien.',
    focus: ['lifestyle'],
  },
  {
    name: 'New Balance',
    handle: 'new-balance',
    logo: '/brands/new-balance.png',
    tagline: 'Confort et silhouettes rétro-running.',
    focus: ['lifestyle', 'running'],
  },
  {
    name: 'Asics',
    handle: 'asics',
    logo: '/brands/asics.png',
    tagline: 'Running technique et rééditions des années 2000.',
    focus: ['running', 'lifestyle'],
  },
  {
    name: 'Puma',
    handle: 'puma',
    logo: '/brands/puma.png',
    tagline: 'Sport, lifestyle et collaborations.',
    focus: ['lifestyle', 'running'],
  },
  {
    name: 'On',
    handle: 'on',
    logo: '/brands/on.png',
    tagline: 'Running suisse, léger et amorti.',
    focus: ['running'],
  },
  {
    name: 'Hoka',
    handle: 'hoka',
    logo: '/brands/hoka.png',
    tagline: 'Amorti maximal pour la route et le trail.',
    focus: ['running', 'outdoor'],
  },
  {
    name: 'Converse',
    handle: 'converse',
    logo: '/brands/converse.png',
    tagline: 'La toile intemporelle.',
    focus: ['lifestyle'],
  },
  {
    name: 'Vans',
    handle: 'vans',
    logo: '/brands/vans.png',
    tagline: 'Skate et culture de la rue.',
    focus: ['lifestyle'],
  },
  {
    name: 'Reebok',
    handle: 'reebok',
    logo: '/brands/reebok.png',
    tagline: 'Classiques du fitness et icônes rétro.',
    focus: ['lifestyle', 'running'],
  },
  {
    name: 'Lacoste',
    handle: 'lacoste',
    logo: '/brands/lacoste.png',
    tagline: 'L’élégance du court, en version sneaker.',
    focus: ['lifestyle'],
  },
  {
    name: 'The North Face',
    handle: 'the-north-face',
    logo: '/brands/the-north-face.png',
    tagline: 'Trail, randonnée et grand air.',
    focus: ['outdoor', 'running'],
  },
  {
    name: 'Dior',
    handle: 'dior',
    logo: '/brands/dior.png',
    tagline: 'Sneakers de luxe, signées couture.',
    focus: ['lifestyle'],
  },
  {
    name: 'Louis Vuitton',
    handle: 'louis-vuitton',
    logo: '/brands/louis-vuitton.png',
    tagline: 'Le luxe parisien, du trainer au runner.',
    focus: ['lifestyle'],
  },
];

/**
 * Homepage "univers" tiles. `handle` = Shopify collection handle.
 * `image` (optional): your own photo in /public/home/ (e.g. '/home/running.jpg').
 * When empty, the tile uses the collection image or its first product photo.
 */
export const CATEGORIES = [
  {
    title: 'Running',
    kicker: '01',
    copy: 'Amorti, rebond, vitesse.',
    handle: 'running',
    image: '/home/tile-running.webp',
  },
  {
    title: 'Lifestyle',
    kicker: '02',
    copy: 'Les silhouettes de la rue.',
    handle: 'lifestyle',
    image: '/home/tile-lifestyle.webp',
  },
  {
    title: 'Basketball',
    kicker: '03',
    copy: 'Né sur le parquet.',
    handle: 'basketball',
    image: '/home/tile-basketball.webp',
  },
  {
    title: 'Outdoor',
    kicker: '04',
    copy: 'Grip et protection, partout.',
    handle: 'outdoor',
    image: '/home/tile-outdoor.webp',
  },
];

/**
 * Optional hero media. Drop a file in /public (e.g. /hero.mp4 or /hero.jpg)
 * and set the path here. When empty, the hero is built from your newest product.
 */
export const HERO = {
  eyebrow: 'Nouvelle saison',
  title: ['Marche', 'sur ton', 'propre', 'rythme.'],
  copy: 'Les modèles les plus recherchés, sélectionnés pour toi.',
  primaryCta: {
    label: 'Découvrir les nouveautés',
    to: '/collections/all?sort=newest',
  },
  secondaryCta: {label: 'Voir les marques', to: '/collections'},
  image: '',
  video: '',
};

/** Names Shopify may use for the size option. */
export const SIZE_OPTION_NAMES = [
  'size',
  'taille',
  'pointure',
  'eu',
  'size (eu)',
];
/** Names Shopify may use for the color option. */
export const COLOR_OPTION_NAMES = ['color', 'colour', 'couleur', 'coloris'];

export function isSizeOption(name: string) {
  return SIZE_OPTION_NAMES.includes(name.trim().toLowerCase());
}
export function isColorOption(name: string) {
  return COLOR_OPTION_NAMES.includes(name.trim().toLowerCase());
}

export function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
