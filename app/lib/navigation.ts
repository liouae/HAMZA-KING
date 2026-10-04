import {BRANDS} from './config';
import {GUIDES, ICON_MODELS} from './content';

/**
 * Mega-menu structure. Every `to` is a normal storefront URL,
 * so you can point links at any Shopify collection handle.
 */
export type NavLink = {label: string; to: string; badge?: string};
export type NavColumn = {title: string; links: NavLink[]};
export type NavFeature = {
  title: string;
  copy: string;
  to: string;
  /** Collection handle whose image is used as the card background. */
  handle?: string;
  image?: string;
};
export type NavItem = {
  label: string;
  to: string;
  accent?: boolean;
  /** 'brands' renders the logo-driven brand panel instead of link columns. */
  kind?: 'brands';
  columns?: NavColumn[];
  feature?: NavFeature;
  /** Optional second feature card. */
  feature2?: NavFeature;
};

export const NAVIGATION: NavItem[] = [
  {
    label: 'Nouveautés',
    to: '/collections/all?sort=newest',
    columns: [
      {
        title: 'À la une',
        links: [
          {
            label: 'Derniers arrivages',
            to: '/collections/all?sort=newest',
            badge: 'New',
          },
          {label: 'Best-sellers', to: '/collections/all?sort=best-selling'},
          {label: 'Retour en stock', to: '/collections/restock'},
          {label: 'Éditions limitées', to: '/collections/limited'},
          {label: 'Luxe & designer', to: '/collections/luxe'},
        ],
      },
      {
        title: 'Par usage',
        links: [
          {label: 'Running', to: '/collections/running'},
          {label: 'Lifestyle', to: '/collections/lifestyle'},
          {label: 'Basketball', to: '/collections/basketball'},
          {label: 'Outdoor', to: '/collections/outdoor'},
        ],
      },
    ],
    feature: {
      title: 'Le drop de la semaine',
      copy: 'Les paires qui viennent d’arriver en boutique.',
      to: '/collections/all?sort=newest',
      handle: 'all',
    },
    feature2: {
      title: 'Éditions limitées',
      copy: 'Rares, numérotées, vite parties.',
      to: '/collections/limited',
      handle: 'limited',
    },
  },
  {
    label: 'Homme',
    to: '/collections/homme',
    columns: [
      {
        title: 'Chaussures',
        links: [
          {label: 'Toutes les sneakers', to: '/collections/homme'},
          {label: 'Running', to: '/collections/homme-running'},
          {label: 'Lifestyle', to: '/collections/homme-lifestyle'},
          {label: 'Basketball', to: '/collections/homme-basketball'},
          {label: 'Outdoor & trail', to: '/collections/homme-outdoor'},
        ],
      },
      {
        title: 'Marques',
        links: BRANDS.slice(0, 6).map((b) => ({
          label: b.name,
          to: `/collections/${b.handle}`,
        })),
      },
    ],
    feature: {
      title: 'Homme — Sélection',
      copy: 'Les silhouettes incontournables du moment.',
      to: '/collections/homme',
      handle: 'homme',
    },
    feature2: {
      title: 'Running homme',
      copy: 'Amorti, rebond, vitesse.',
      to: '/collections/homme-running',
      handle: 'running',
    },
  },
  {
    label: 'Femme',
    to: '/collections/femme',
    columns: [
      {
        title: 'Chaussures',
        links: [
          {label: 'Toutes les sneakers', to: '/collections/femme'},
          {label: 'Running', to: '/collections/femme-running'},
          {label: 'Lifestyle', to: '/collections/femme-lifestyle'},
          {label: 'Plateformes', to: '/collections/femme-plateformes'},
        ],
      },
      {
        title: 'Marques',
        links: BRANDS.slice(0, 6).map((b) => ({
          label: b.name,
          to: `/collections/${b.handle}`,
        })),
      },
    ],
    feature: {
      title: 'Femme — Sélection',
      copy: 'Légères, nettes, faites pour durer.',
      to: '/collections/femme',
      handle: 'femme',
    },
    feature2: {
      title: 'Plateformes',
      copy: 'Quelques centimètres, zéro compromis.',
      to: '/collections/femme-plateformes',
      handle: 'femme-plateformes',
    },
  },
  {
    label: 'Enfant',
    to: '/collections/enfant',
    columns: [
      {
        title: 'Par âge',
        links: [
          {label: 'Bébé (16 – 27)', to: '/collections/bebe'},
          {label: 'Enfant (28 – 35)', to: '/collections/enfant'},
          {label: 'Junior (36 – 40)', to: '/collections/junior'},
        ],
      },
      {
        title: 'Par usage',
        links: [
          {label: 'École & quotidien', to: '/collections/enfant'},
          {label: 'Sport', to: '/collections/enfant'},
        ],
      },
    ],
    feature: {
      title: 'Enfant',
      copy: 'Les mêmes icônes, en petites pointures.',
      to: '/collections/enfant',
      handle: 'enfant',
    },
  },
  {
    label: 'Icônes',
    to: '/collections/all?sort=best-selling',
    columns: [
      {
        title: 'Les modèles cultes',
        links: ICON_MODELS.slice(0, 6).map((m) => ({
          label: m.name,
          to: `/search?q=${encodeURIComponent(m.query)}`,
        })),
      },
      {
        title: 'Running',
        links: ICON_MODELS.slice(6).map((m) => ({
          label: m.name,
          to: `/search?q=${encodeURIComponent(m.query)}`,
        })),
      },
      {
        title: 'Guides',
        links: GUIDES,
      },
    ],
    feature: {
      title: 'Les icônes',
      copy: 'Les silhouettes qui ont écrit l’histoire de la sneaker.',
      to: '/collections/all?sort=best-selling',
      handle: 'lifestyle',
    },
  },
  {
    label: 'Marques',
    to: '/marques',
    kind: 'brands',
    columns: [
      {
        title: 'Toutes les marques',
        links: BRANDS.map((b) => ({
          label: b.name,
          to: `/collections/${b.handle}`,
        })),
      },
    ],
  },
  {label: 'Promos', to: '/collections/promo', accent: true},
];

export const FOOTER_COLUMNS: NavColumn[] = [
  {
    title: 'Boutique',
    links: [
      {label: 'Nouveautés', to: '/collections/all?sort=newest'},
      {label: 'Homme', to: '/collections/homme'},
      {label: 'Femme', to: '/collections/femme'},
      {label: 'Enfant', to: '/collections/enfant'},
      {label: 'Toutes les marques', to: '/marques'},
      {label: 'Promos', to: '/collections/promo'},
    ],
  },
  {
    title: 'Aide',
    links: [
      {label: 'Avis clients', to: '/avis'},
      {label: 'Livraison', to: '/policies/shipping-policy'},
      {label: 'Retours & échanges', to: '/policies/refund-policy'},
      {label: 'Guide des tailles', to: '/pages/guide-des-tailles'},
      {label: 'FAQ', to: '/pages/faq'},
      {label: 'Suivre ma commande', to: '/account/orders'},
      {label: 'Ma wishlist', to: '/wishlist'},
      {label: 'Contact', to: '/pages/contact'},
    ],
  },
  {
    title: 'La maison',
    links: [
      {label: 'Notre histoire', to: '/pages/a-propos'},
      {label: 'Journal', to: '/blogs/journal'},
      {label: 'Conditions générales', to: '/policies/terms-of-service'},
      {label: 'Confidentialité', to: '/policies/privacy-policy'},
    ],
  },
];

/** Chips shown under a collection title: children of the matching nav item, or gender variants. */
export function subChips(handle: string): NavLink[] {
  const item = NAVIGATION.find((n) => n.to === `/collections/${handle}`);
  if (item?.columns?.length) {
    return item.columns[0].links.filter((l) => l.to !== item.to).slice(0, 8);
  }
  const categories = ['running', 'lifestyle', 'basketball', 'outdoor'];
  if (categories.includes(handle)) {
    return [
      {label: 'Homme', to: `/collections/homme-${handle}`},
      {label: 'Femme', to: `/collections/femme-${handle}`},
      {label: 'Promos', to: '/collections/promo'},
    ];
  }
  const m = /^(homme|femme)-(.+)$/.exec(handle);
  if (m) {
    return categories
      .filter((c) => c !== m[2])
      .map((c) => ({
        label: c[0].toUpperCase() + c.slice(1),
        to: `/collections/${m[1]}-${c}`,
      }));
  }
  if (BRANDS.some((b) => b.handle === handle)) {
    return [
      {label: 'Homme', to: '/collections/homme'},
      {label: 'Femme', to: '/collections/femme'},
      {label: 'Nouveautés', to: '/collections/all?sort=newest'},
      {label: 'Promos', to: '/collections/promo'},
    ];
  }
  return [];
}

const FOCUS_LABELS = {
  running: 'Running',
  lifestyle: 'Lifestyle',
  basketball: 'Basketball',
  outdoor: 'Outdoor',
} as const;

/** Quick links shown for a brand in the menu and on /marques. */
export function brandLinks(handle: string): NavLink[] {
  const brand = BRANDS.find((b) => b.handle === handle);
  const base = `/collections/${handle}`;
  return [
    {label: 'Toute la collection', to: base},
    {label: 'Nouveautés', to: `${base}?sort=newest`},
    {label: 'Meilleures ventes', to: `${base}?sort=best-selling`},
    {label: 'Prix croissant', to: `${base}?sort=price-asc`},
    ...(brand?.focus ?? []).map((f) => ({
      label: FOCUS_LABELS[f],
      to: `/collections/${f}`,
    })),
  ];
}
