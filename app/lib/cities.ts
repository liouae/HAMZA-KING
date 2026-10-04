import {SHIPPING} from './config';

/**
 * Delivery cities with their own page (/livraison/<handle>). Delays must stay
 * in line with DELIVERY_ROWS and the shipping policy.
 */
export type City = {
  handle: string;
  name: string;
  /** "à Casablanca" / "à Fès" … */
  at: string;
  delay: string;
  region: string;
  quartiers: string[];
  nearby: string[];
};

const BIG = '48h';
const REST = SHIPPING.deliveryMorocco;

export const CITIES: City[] = [
  {
    handle: 'casablanca',
    name: 'Casablanca',
    at: 'à Casablanca',
    delay: SHIPPING.deliveryCasablanca,
    region: 'Casablanca-Settat',
    quartiers: [
      'Maârif',
      'Gauthier',
      'Anfa',
      'Aïn Diab',
      'Bourgogne',
      'Hay Hassani',
      'Oulfa',
      'Sidi Maârouf',
      'Derb Sultan',
      'Hay Mohammadi',
      'Aïn Sebaâ',
      'Sidi Moumen',
    ],
    nearby: ['Mohammedia', 'Bouskoura', 'Dar Bouazza', 'Médiouna', 'Berrechid'],
  },
  {
    handle: 'rabat',
    name: 'Rabat',
    at: 'à Rabat',
    delay: BIG,
    region: 'Rabat-Salé-Kénitra',
    quartiers: [
      'Agdal',
      'Hassan',
      'Hay Riad',
      'Souissi',
      'L’Océan',
      'Yacoub El Mansour',
      'Akkari',
    ],
    nearby: ['Salé', 'Témara', 'Harhoura', 'Skhirat'],
  },
  {
    handle: 'marrakech',
    name: 'Marrakech',
    at: 'à Marrakech',
    delay: BIG,
    region: 'Marrakech-Safi',
    quartiers: [
      'Guéliz',
      'Hivernage',
      'Médina',
      'Daoudiate',
      'Massira',
      'Targa',
      'M’hamid',
      'Sidi Youssef Ben Ali',
    ],
    nearby: ['Tamansourt', 'Tahannaout', 'Aït Ourir'],
  },
  {
    handle: 'tanger',
    name: 'Tanger',
    at: 'à Tanger',
    delay: BIG,
    region: 'Tanger-Tétouan-Al Hoceïma',
    quartiers: [
      'Malabata',
      'Iberia',
      'Marshan',
      'Val Fleuri',
      'Branes',
      'Mesnana',
      'Beni Makada',
    ],
    nearby: ['Asilah', 'Gzenaya', 'Ksar Sghir'],
  },
  {
    handle: 'agadir',
    name: 'Agadir',
    at: 'à Agadir',
    delay: BIG,
    region: 'Souss-Massa',
    quartiers: [
      'Talborjt',
      'Founty',
      'Dakhla',
      'Charaf',
      'Les Amicales',
      'Tikiouine',
      'Hay Mohammadi',
    ],
    nearby: ['Inezgane', 'Aït Melloul', 'Dcheira', 'Taghazout'],
  },
  {
    handle: 'fes',
    name: 'Fès',
    at: 'à Fès',
    delay: REST,
    region: 'Fès-Meknès',
    quartiers: [
      'Ville Nouvelle',
      'Atlas',
      'Narjiss',
      'Saïss',
      'Zouagha',
      'Bensouda',
      'Fès el-Bali',
    ],
    nearby: ['Sefrou', 'Bhalil', 'Moulay Yacoub'],
  },
  {
    handle: 'meknes',
    name: 'Meknès',
    at: 'à Meknès',
    delay: REST,
    region: 'Fès-Meknès',
    quartiers: [
      'Hamria',
      'Ville Nouvelle',
      'Marjane',
      'Bassatine',
      'Zitoune',
      'Wislane',
    ],
    nearby: ['El Hajeb', 'Boufakrane'],
  },
  {
    handle: 'oujda',
    name: 'Oujda',
    at: 'à Oujda',
    delay: REST,
    region: 'Oriental',
    quartiers: ['Al Qods', 'Lazaret', 'Sidi Yahya', 'Hay Al Andalous'],
    nearby: ['Berkane', 'Ahfir', 'Jerada'],
  },
  {
    handle: 'kenitra',
    name: 'Kénitra',
    at: 'à Kénitra',
    delay: REST,
    region: 'Rabat-Salé-Kénitra',
    quartiers: ['Bir Rami', 'Ouled Oujih', 'Mimosas', 'Maâmora', 'La Cigogne'],
    nearby: ['Mehdia', 'Sidi Taïbi', 'Sidi Slimane'],
  },
  {
    handle: 'tetouan',
    name: 'Tétouan',
    at: 'à Tétouan',
    delay: REST,
    region: 'Tanger-Tétouan-Al Hoceïma',
    quartiers: ['Médina', 'Touabel', 'M’hannech', 'Sania Ramel'],
    nearby: ['Martil', 'M’diq', 'Fnideq', 'Cabo Negro'],
  },
  {
    handle: 'el-jadida',
    name: 'El Jadida',
    at: 'à El Jadida',
    delay: REST,
    region: 'Casablanca-Settat',
    quartiers: [],
    nearby: ['Azemmour', 'Haouzia', 'Sidi Bouzid'],
  },
];

export const cityByHandle = (h: string) => CITIES.find((c) => c.handle === h);
