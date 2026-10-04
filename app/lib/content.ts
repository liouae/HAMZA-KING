/**
 * Editorial content for the storefront. Everything here is plain data so you
 * can change campaigns, stories and pages without touching components.
 * Image paths point to /public (e.g. '/home/story-1.jpg'); leave '' to use the
 * automatic fallback (product or collection photos from Shopify).
 */
import {SHIPPING} from './config';

export const SITE = {
  /** Your public domain once connected (no trailing slash). */
  url: 'https://hamzaking.ma',
  locale: 'fr_MA',
  city: 'Casablanca',
  /** Opening hours shown on the contact page. */
  hours: 'Lun – Sam · 10h – 20h',
  address: 'Casablanca, Maroc',
};

/* ---------- Campaign hero (homepage) ---------- */
export type Campaign = {
  eyebrow: string;
  title: string[];
  copy: string;
  primary: {label: string; to: string};
  secondary?: {label: string; to: string};
  image?: string;
  video?: string;
  /** Optional poster for the video. */
  poster?: string;
  /** Light text over dark media. */
  theme?: 'light' | 'dark';
};

export const CAMPAIGN: Campaign = {
  eyebrow: 'Nouvelle saison',
  title: ['Marche', 'sur ton', 'propre', 'rythme.'],
  copy: 'Les modèles les plus recherchés, sélectionnés pour toi. Livraison gratuite partout au Maroc, paiement à la livraison.',
  primary: {
    label: 'Découvrir les nouveautés',
    to: '/collections/all?sort=newest',
  },
  secondary: {label: 'Voir les marques', to: '/marques'},
  image: '/home/hero.webp',
  video: '',
  theme: 'dark',
};

/* ---------- Stories: split image + copy blocks ---------- */
export type Story = {
  kicker: string;
  title: string;
  copy: string;
  image?: string;
  /** Collection handle used for the fallback image + "voir" link. */
  handle: string;
  ctas: {label: string; to: string}[];
  align?: 'left' | 'right';
  theme?: 'paper' | 'ink' | 'stone';
};

export const STORIES: Story[] = [
  {
    kicker: 'Collection',
    title: 'Running, du premier au dernier kilomètre.',
    copy: 'Amorti réactif, tiges respirantes et semelles qui accrochent. Les paires pensées pour tes sorties du matin comme pour la course du dimanche.',
    handle: 'running',
    image: '/home/story-running.webp',
    ctas: [
      {label: 'Modèle homme', to: '/collections/homme-running'},
      {label: 'Modèle femme', to: '/collections/femme-running'},
    ],
    align: 'left',
    theme: 'stone',
  },
  {
    kicker: 'Lifestyle',
    title: 'Ose quitter le bitume.',
    copy: 'Les silhouettes rétro et les icônes de la rue, dans les coloris que tout le monde cherche.',
    handle: 'lifestyle',
    image: '/home/story-lifestyle.webp',
    ctas: [{label: 'Découvrir le lifestyle', to: '/collections/lifestyle'}],
    align: 'right',
    theme: 'ink',
  },
];

/* ---------- Full-bleed editorial banner ---------- */
export const EDITORIAL = {
  kicker: 'Comment ça marche',
  title: 'Tu commandes. Tu payes à la livraison.',
  copy: 'Pas de carte, pas de paiement en ligne. Tu reçois ta paire chez toi, tu l’essaies, et tu payes le livreur. La livraison est gratuite partout au Maroc.',
  cta: {label: 'Questions fréquentes', to: '/pages/faq'},
  image: '/home/band-authenticite.webp',
};

/* ---------- Icon models: families shown in the mega-menu & on the home ---------- */
export type IconModel = {
  name: string;
  brand: string;
  query: string;
  image?: string;
};
export const ICON_MODELS: IconModel[] = [
  {name: 'Air Force 1', brand: 'Nike', query: 'Air Force 1'},
  {name: 'Dunk Low', brand: 'Nike', query: 'Dunk'},
  {name: 'Air Jordan 1', brand: 'Jordan', query: 'Jordan 1'},
  {name: 'Samba', brand: 'Adidas', query: 'Samba'},
  {name: 'Gazelle', brand: 'Adidas', query: 'Gazelle'},
  {name: '9060', brand: 'New Balance', query: '9060'},
  {name: '530', brand: 'New Balance', query: '530'},
  {name: 'Gel-Kayano 14', brand: 'Asics', query: 'Gel-Kayano'},
  {name: 'Cloudmonster', brand: 'On', query: 'Cloudmonster'},
  {name: 'Clifton 9', brand: 'Hoka', query: 'Clifton'},
];

/* ---------- Guides (blog articles) linked from the menu ---------- */
export const GUIDES = [
  {label: 'Comment choisir sa pointure ?', to: '/pages/guide-des-tailles'},
  {label: 'Livraison et paiement à la livraison', to: '/pages/faq'},
  {label: 'Entretenir ses sneakers', to: '/blogs/journal'},
  {label: 'Quelle paire pour courir au Maroc ?', to: '/blogs/journal'},
];

/* ---------- Popular categories (SEO grid at the bottom of the home) ---------- */
export const POPULAR_CATEGORIES = [
  {label: 'Sneakers homme', to: '/collections/homme'},
  {label: 'Sneakers femme', to: '/collections/femme'},
  {label: 'Chaussures de running homme', to: '/collections/homme-running'},
  {label: 'Chaussures de running femme', to: '/collections/femme-running'},
  {label: 'Sneakers lifestyle homme', to: '/collections/homme-lifestyle'},
  {label: 'Sneakers lifestyle femme', to: '/collections/femme-lifestyle'},
  {label: 'Chaussures de basketball', to: '/collections/basketball'},
  {label: 'Chaussures outdoor & trail', to: '/collections/outdoor'},
  {label: 'Sneakers enfant', to: '/collections/enfant'},
  {label: 'Sneakers Nike Maroc', to: '/collections/nike'},
  {label: 'Sneakers Adidas Maroc', to: '/collections/adidas'},
  {label: 'New Balance Maroc', to: '/collections/new-balance'},
  {label: 'Jordan Maroc', to: '/collections/jordan'},
  {label: 'Asics Maroc', to: '/collections/asics'},
  {label: 'Lacoste Maroc', to: '/collections/lacoste'},
  {label: 'The North Face Maroc', to: '/collections/the-north-face'},
  {label: 'Sneakers de luxe Dior & Louis Vuitton', to: '/collections/luxe'},
  {label: 'Reebok Maroc', to: '/collections/reebok'},
  {label: 'Promos sneakers', to: '/collections/promo'},
  {label: 'Éditions limitées', to: '/collections/limited'},
];

/* ---------- Delivery table (PDP + FAQ) ---------- */
export const DELIVERY_ROWS = [
  {
    zone: 'Casablanca',
    delay: SHIPPING.deliveryCasablanca,
    price: 'Gratuite',
    note: 'Paiement à la livraison',
  },
  {
    zone: 'Rabat · Marrakech · Tanger · Agadir',
    delay: '48h',
    price: 'Gratuite',
    note: 'Paiement à la livraison',
  },
  {
    zone: 'Autres villes',
    delay: SHIPPING.deliveryMorocco,
    price: 'Gratuite',
    note: 'Paiement à la livraison',
  },
];

/* ---------- Product benefits by type (fallback when no metafield) ---------- */
export type Benefit = {
  icon: 'cushion' | 'grip' | 'feather' | 'drop' | 'bolt' | 'shield';
  title: string;
  copy: string;
};
export const BENEFITS_BY_TAG: Record<string, Benefit[]> = {
  running: [
    {
      icon: 'cushion',
      title: 'Amorti',
      copy: 'Une mousse réactive qui absorbe les chocs et renvoie l’énergie.',
    },
    {
      icon: 'feather',
      title: 'Légèreté',
      copy: 'Tige en mesh aéré, pour courir sans lourdeur.',
    },
    {
      icon: 'grip',
      title: 'Adhérence',
      copy: 'Semelle en caoutchouc à motif multidirectionnel.',
    },
  ],
  lifestyle: [
    {
      icon: 'shield',
      title: 'Durabilité',
      copy: 'Matières premium, coutures renforcées, finitions soignées.',
    },
    {
      icon: 'cushion',
      title: 'Confort',
      copy: 'Semelle intérieure moelleuse pour les longues journées.',
    },
    {
      icon: 'bolt',
      title: 'Style',
      copy: 'Une silhouette iconique qui va avec tout.',
    },
  ],
  basketball: [
    {
      icon: 'cushion',
      title: 'Amorti',
      copy: 'Protection à l’impact, réception après réception.',
    },
    {
      icon: 'shield',
      title: 'Maintien',
      copy: 'Tige montante et verrouillage de la cheville.',
    },
    {
      icon: 'grip',
      title: 'Traction',
      copy: 'Motif de semelle pensé pour les changements d’appui.',
    },
  ],
  outdoor: [
    {
      icon: 'grip',
      title: 'Grip',
      copy: 'Crampons profonds pour la terre, la roche et le sable.',
    },
    {
      icon: 'drop',
      title: 'Protection',
      copy: 'Pare-pierres et tige résistante aux abrasions.',
    },
    {
      icon: 'shield',
      title: 'Stabilité',
      copy: 'Châssis conçu pour les terrains irréguliers.',
    },
  ],
  default: [
    {
      icon: 'shield',
      title: 'Finitions soignées',
      copy: 'Chaque paire est contrôlée avant de partir : coutures, semelle, boîte.',
    },
    {
      icon: 'cushion',
      title: 'Confort',
      copy: 'Sélectionnée pour être portée toute la journée.',
    },
    {
      icon: 'bolt',
      title: 'Livraison rapide',
      copy: `${SHIPPING.deliveryCasablanca} à Casablanca, ${SHIPPING.deliveryMorocco} ailleurs.`,
    },
  ],
};

/* ---------- FAQ ---------- */
export const FAQ: {q: string; a: string}[] = [
  {
    q: 'Comment se passe une commande ?',
    a: 'Tu commandes sur le site ou sur WhatsApp. On te contacte pour confirmer la pointure et l’adresse, puis ta paire part. Tu la reçois, tu la vérifies, et tu payes le livreur en espèces. La livraison est gratuite.',
  },
  {
    q: 'Comment payer ?',
    a: 'Uniquement en espèces, à la livraison. Tu reçois ta paire, tu la vérifies, puis tu payes le livreur. Aucun paiement en ligne, aucune carte demandée. Tu peux aussi commander directement sur WhatsApp.',
  },
  {
    q: 'Combien de temps prend la livraison ?',
    a: `${SHIPPING.deliveryCasablanca} à Casablanca, 48h dans les grandes villes et ${SHIPPING.deliveryMorocco} dans le reste du Maroc. La livraison est gratuite pour toutes les commandes, sans minimum d’achat.`,
  },
  {
    q: 'Puis-je échanger si la pointure ne va pas ?',
    a: `Oui. Tu as ${SHIPPING.returnDays} jours après réception pour échanger ta paire, non portée et dans sa boîte d’origine. Écris-nous sur WhatsApp, on organise la récupération et l’envoi de la bonne pointure, à nos frais : l’échange est gratuit.`,
  },
  {
    q: 'Comment choisir ma pointure ?',
    a: 'Mesure ton pied du talon au plus long orteil, en fin de journée, et compare avec notre guide des tailles. Entre deux tailles, prends la plus grande. En cas de doute, envoie-nous ta mesure en cm sur WhatsApp.',
  },
  {
    q: 'Puis-je suivre ma commande ?',
    a: 'Oui. Tu reçois un message avec le numéro de suivi dès l’expédition, et tu peux suivre ta commande depuis ton compte.',
  },
  {
    q: 'Avez-vous une boutique physique ?',
    a: 'Nous sommes basés à Casablanca. Contacte-nous sur WhatsApp pour un essayage ou un retrait sur place.',
  },
];

/* ---------- Built-in pages (used when the page doesn't exist in Shopify) ---------- */
export const PAGES: Record<
  string,
  {title: string; intro: string; sections: {title: string; body: string[]}[]}
> = {
  'a-propos': {
    title: 'Notre histoire',
    intro:
      'HAMZA KING est né d’une obsession : trouver les bonnes paires et les rendre accessibles partout au Maroc.',
    sections: [
      {
        title: 'Pourquoi nous',
        body: [
          'On a tous connu la déception d’une paire commandée en ligne qui arrive en retard, dans une boîte abîmée ou dans la mauvaise taille. On a construit HAMZA KING pour que ça n’arrive plus.',
          'Chaque modèle est choisi pour son style et son confort, contrôlé avant de partir, et livré gratuitement. Tu payes seulement quand tu l’as entre les mains.',
        ],
      },
      {
        title: 'Ce qu’on sélectionne',
        body: [
          'Les icônes qui traversent les saisons, les modèles de running qui font vraiment la différence, et les éditions limitées qu’on ne trouve pas au coin de la rue.',
        ],
      },
      {
        title: 'Casablanca, puis tout le Maroc',
        body: [
          'Basés à Casablanca, nous livrons dans tout le Royaume avec paiement à la livraison. Tu vérifies ta paire, puis tu payes.',
        ],
      },
    ],
  },
  'guide-des-tailles': {
    title: 'Guide des tailles',
    intro:
      'Mesure ton pied, compare, choisis. En cas de doute, prends la taille au-dessus.',
    sections: [
      {
        title: 'Comment mesurer',
        body: [
          'Pose une feuille contre un mur, mets ton talon contre le mur et marque l’extrémité de ton plus long orteil. Mesure la distance en cm. Fais-le en fin de journée, quand le pied est légèrement gonflé.',
          'Ajoute 0,5 à 1 cm pour le running, 0,5 cm pour le lifestyle.',
        ],
      },
      {
        title: 'Les marques taillent différemment',
        body: [
          'Nike et Jordan taillent souvent un peu petit sur les modèles étroits. Adidas Samba et Gazelle : prends ta taille habituelle, voire une demi-taille au-dessus. New Balance et Asics taillent juste. Converse taille grand : une demi-taille en dessous.',
        ],
      },
    ],
  },
  contact: {
    title: 'Nous contacter',
    intro:
      'Une question sur une paire, une pointure, une commande ? On répond vite, surtout sur WhatsApp.',
    sections: [],
  },
  faq: {
    title: 'Questions fréquentes',
    intro: 'Tout ce qu’il faut savoir avant de commander.',
    sections: [],
  },
};

/* ---------- Site photography (files in /public/home/) ----------
 * Every photo ships as name.webp (full) + name-800.webp (mobile/cards).
 * To swap a photo: replace both files and keep the name.
 */
export type Photo = {url: string; width: number; height: number};
const photo = (name: string, width: number, height: number): Photo => ({
  url: `/home/${name}.webp`,
  width,
  height,
});

export const PHOTOS = {
  hero: photo('hero', 1254, 1254),
  tileRunning: photo('tile-running', 1122, 1402),
  tileLifestyle: photo('tile-lifestyle', 1122, 1402),
  tileBasketball: photo('tile-basketball', 1122, 1402),
  tileOutdoor: photo('tile-outdoor', 1122, 1402),
  storyRunning: photo('story-running', 1536, 1024),
  storyLifestyle: photo('story-lifestyle', 1536, 1024),
  band: photo('band-authenticite', 1600, 685),
  colAll: photo('col-nouveautes', 1536, 1024),
  colLimited: photo('col-limited', 1536, 1024),
  colHomme: photo('col-homme', 1536, 1024),
  colFemme: photo('col-femme', 1536, 1024),
  colPlateformes: photo('col-plateformes', 1536, 1024),
  colEnfant: photo('col-enfant', 1536, 1024),
  colRunning: photo('col-running', 1536, 1024),
  colBasketball: photo('col-basketball', 1536, 1024),
  colOutdoor: photo('col-outdoor', 1536, 1024),
} satisfies Record<string, Photo>;

/**
 * Collection handle → photo. Used by the mega-menu cards, the Marques panel,
 * /marques and the collection page hero. A collection image set in Shopify
 * admin always wins over these; product photos are the last fallback.
 */
export const COLLECTION_IMAGES: Record<string, Photo> = {
  all: PHOTOS.colAll,
  nouveautes: PHOTOS.colAll,
  limited: PHOTOS.colLimited,
  homme: PHOTOS.colHomme,
  femme: PHOTOS.colFemme,
  'femme-plateformes': PHOTOS.colPlateformes,
  enfant: PHOTOS.colEnfant,
  running: PHOTOS.colRunning,
  'homme-running': PHOTOS.storyRunning,
  'femme-running': PHOTOS.storyRunning,
  lifestyle: PHOTOS.storyLifestyle,
  'homme-lifestyle': PHOTOS.colHomme,
  'femme-lifestyle': PHOTOS.tileLifestyle,
  basketball: PHOTOS.colBasketball,
  outdoor: PHOTOS.colOutdoor,
  promo: PHOTOS.colAll,
  // Brands: photos that feature a model from that brand
  jordan: PHOTOS.colBasketball,
  nike: PHOTOS.tileBasketball,
  converse: PHOTOS.colPlateformes,
  vans: PHOTOS.colEnfant,
  on: PHOTOS.colHomme,
  hoka: PHOTOS.colRunning,
  puma: PHOTOS.tileLifestyle,
  adidas: PHOTOS.storyLifestyle,
  'adidas-originals': PHOTOS.storyLifestyle,
  asics: PHOTOS.storyLifestyle,
  'new-balance': PHOTOS.band,
  lacoste: PHOTOS.colFemme,
  'the-north-face': PHOTOS.colOutdoor,
  'louis-vuitton': PHOTOS.colLimited,
  dior: PHOTOS.colAll,
  luxe: PHOTOS.colLimited,
};

/** Resolve a /public path to its known dimensions (for width/height attrs). */
export function localPhoto(url: string): Photo | {url: string} {
  return Object.values(PHOTOS).find((p) => p.url === url) ?? {url};
}
