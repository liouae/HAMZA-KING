import {useEffect, useState} from 'react';
import {useWhatsAppTopic} from '~/lib/whatsapp';
import {SmartImage} from '~/components/SmartImage';
import {
  Form,
  Link,
  useLocation,
  useNavigate,
  useNavigation,
} from 'react-router';
import {Image} from '@shopify/hydrogen';
import {subChips} from '~/lib/navigation';
import {BRANDS} from '~/lib/config';
import {PaginatedResourceSection} from './PaginatedResourceSection';
import {ProductItem, type CardProduct} from './ProductItem';
import {
  IconClose,
  IconFilter,
  IconChevron,
  IconGrid2,
  IconGrid4,
} from './Icons';
import {
  SORT_OPTIONS,
  clearFilters,
  isFilterActive,
  toggleFilter,
  type SortValue,
} from '~/lib/collection';
import {isColorOption, isSizeOption} from '~/lib/config';

export type FilterValue = {
  id: string;
  label: string;
  count: number;
  input: unknown;
  swatch?: {color?: string | null} | null;
};
export type Filter = {
  id: string;
  label: string;
  type: string;
  values: FilterValue[];
};

type Connection = {
  nodes: CardProduct[];
  pageInfo: {
    hasPreviousPage: boolean;
    hasNextPage: boolean;
    startCursor?: string | null;
    endCursor?: string | null;
  };
};

type HeroImage = {
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

export function CollectionView({
  title,
  description,
  eyebrow = 'Collection',
  products,
  filters,
  sort,
  handle = '',
  image,
}: {
  title: string;
  description?: string | null;
  eyebrow?: string;
  products: Connection;
  filters: Filter[];
  sort: SortValue;
  handle?: string;
  image?: HeroImage | null;
}) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [density, setDensity] = useState<'cozy' | 'compact'>('cozy');
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('hk:density');
      if (saved === 'compact' || saved === 'cozy') setDensity(saved);
    } catch {
      /* ignore */
    }
  }, []);
  const toggleDensity = () => {
    const next = density === 'cozy' ? 'compact' : 'cozy';
    setDensity(next);
    try {
      window.localStorage.setItem('hk:density', next);
    } catch {
      /* ignore */
    }
  };
  const chips = subChips(handle);
  useWhatsAppTopic({kind: 'collection', title, handle});
  const brand = BRANDS.find((b) => b.handle === handle);
  const location = useLocation();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const params = new URLSearchParams(location.search);
  const activeCount =
    params.getAll('filter').length +
    (params.get('price.min') || params.get('price.max') ? 1 : 0);
  const isLoading =
    navigation.state === 'loading' &&
    navigation.location?.pathname === location.pathname;

  useEffect(() => {
    setMobileOpen(false);
  }, [location.search]);

  return (
    <div className="plp">
      <header className={`plp-hero ${image ? 'plp-hero--image' : ''}`}>
        {image ? (
          <div className="plp-hero-media" aria-hidden>
            <SmartImage data={image} alt="" sizes="100vw" loading="eager" />
          </div>
        ) : null}
        <div className="container plp-hero-inner">
          <nav className="crumbs" aria-label="Fil d’Ariane">
            <Link to="/">Accueil</Link>
            <span>/</span>
            <Link to={brand ? '/marques' : '/collections'}>
              {brand ? 'Marques' : 'Collections'}
            </Link>
            <span>/</span>
            <span aria-current="page">{title}</span>
          </nav>
          <div className="plp-hero-row">
            <div>
              {brand?.logo ? (
                <img src={brand.logo} alt="" className="plp-brand-logo" />
              ) : null}
              <p className="eyebrow">{brand ? 'Marque' : eyebrow}</p>
              <h1 className="display-xl">{title}</h1>
            </div>
            {description || brand?.tagline ? (
              <p className="plp-desc">{description || brand?.tagline}</p>
            ) : null}
          </div>
          {chips.length ? (
            <div className="chip-row plp-chips">
              {chips.map((c) => (
                <Link key={c.to} to={c.to} className="chip" prefetch="intent">
                  {c.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <div className="plp-toolbar">
        <div className="container plp-toolbar-inner">
          <button
            className="toolbar-btn"
            onClick={() => {
              if (window.matchMedia('(max-width: 63.99em)').matches)
                setMobileOpen(true);
              else setPanelOpen((v) => !v);
            }}
            aria-expanded={panelOpen}
          >
            <IconFilter />
            <span>
              {panelOpen ? 'Masquer les filtres' : 'Afficher les filtres'}
            </span>
            {activeCount ? (
              <span className="toolbar-count">{activeCount}</span>
            ) : null}
          </button>
          <p className="plp-count">
            {products.nodes.length}
            {products.pageInfo.hasNextPage ? '+' : ''} produits
          </p>
          <button
            className="toolbar-btn toolbar-btn--density hide-sm"
            onClick={toggleDensity}
            aria-label={
              density === 'cozy'
                ? 'Passer en vue compacte'
                : 'Passer en vue étendue'
            }
            title={density === 'cozy' ? 'Vue compacte' : 'Vue étendue'}
          >
            {density === 'cozy' ? <IconGrid4 /> : <IconGrid2 />}
          </button>
          <label className="sort">
            <span className="sr-only">Trier par</span>
            <span className="sort-label hide-sm">Trier :</span>
            <select
              value={sort}
              onChange={(e) => {
                const next = new URLSearchParams(location.search);
                next.set('sort', e.target.value);
                next.delete('cursor');
                next.delete('direction');
                void navigate(`?${next.toString()}`, {
                  preventScrollReset: true,
                });
              }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <IconChevron width={16} height={16} />
          </label>
        </div>
        <ActiveFilters filters={filters} params={params} />
      </div>

      <div
        className={`container plp-body ${panelOpen ? '' : 'is-collapsed'} plp-body--${density}`}
      >
        <aside
          className={`filters ${mobileOpen ? 'is-open' : ''}`}
          aria-label="Filtres"
        >
          <div className="filters-head">
            <p className="drawer-title">Filtres</p>
            <button
              className="icon-btn"
              onClick={() => setMobileOpen(false)}
              aria-label="Fermer"
            >
              <IconClose />
            </button>
          </div>
          <div className="filters-scroll">
            {filters.length ? (
              filters.map((f) => (
                <FilterGroup key={f.id} filter={f} params={params} />
              ))
            ) : (
              <p className="muted small">
                Aucun filtre disponible pour cette sélection.
              </p>
            )}
          </div>
          <div className="filters-foot">
            <Link
              to={clearFilters(params)}
              preventScrollReset
              className="btn btn--ghost btn--block"
            >
              Tout effacer
            </Link>
            <button
              className="btn btn--block"
              onClick={() => setMobileOpen(false)}
            >
              Voir les produits
            </button>
          </div>
        </aside>
        <button
          className={`filters-scrim ${mobileOpen ? 'is-open' : ''}`}
          onClick={() => setMobileOpen(false)}
          aria-label="Fermer les filtres"
          tabIndex={-1}
        />

        <div className={`plp-grid-wrap ${isLoading ? 'is-loading' : ''}`}>
          {products.nodes.length ? (
            <PaginatedResourceSection<CardProduct>
              connection={products}
              resourcesClassName="grid"
            >
              {({node: product, index}) => (
                <ProductItem
                  key={product.id}
                  product={product}
                  loading={index < 8 ? 'eager' : undefined}
                />
              )}
            </PaginatedResourceSection>
          ) : (
            <div className="plp-empty">
              <p className="display-s">Aucune paire ne correspond.</p>
              <p className="muted">Essaie d’enlever un filtre.</p>
              <Link to={clearFilters(params)} className="btn">
                Effacer les filtres
              </Link>
            </div>
          )}
        </div>
      </div>
      {description && description.length > 160 ? (
        <section className="container plp-seo">
          <p className="eyebrow">À propos</p>
          <p>{description}</p>
        </section>
      ) : null}
    </div>
  );
}

function ActiveFilters({
  filters,
  params,
}: {
  filters: Filter[];
  params: URLSearchParams;
}) {
  const chips: {label: string; to: string}[] = [];
  for (const f of filters) {
    for (const v of f.values) {
      const input =
        typeof v.input === 'string' ? v.input : JSON.stringify(v.input);
      if (isFilterActive(params, input))
        chips.push({label: v.label, to: toggleFilter(params, input)});
    }
  }
  const min = params.get('price.min');
  const max = params.get('price.max');
  if (min || max) {
    const next = new URLSearchParams(params);
    next.delete('price.min');
    next.delete('price.max');
    chips.push({
      label: `${min || 0} – ${max || '∞'} DH`,
      to: `?${next.toString()}`,
    });
  }
  if (!chips.length) return null;
  return (
    <div className="container active-filters">
      {chips.map((c) => (
        <Link
          key={c.label}
          to={c.to}
          preventScrollReset
          className="chip chip--active"
        >
          {c.label} <IconClose width={14} height={14} />
        </Link>
      ))}
      <Link to={clearFilters(params)} preventScrollReset className="link-btn">
        Tout effacer
      </Link>
    </div>
  );
}

function FilterGroup({
  filter,
  params,
}: {
  filter: Filter;
  params: URLSearchParams;
}) {
  const isSize =
    isSizeOption(filter.label) || /taille|pointure|size/i.test(filter.label);
  const isColor =
    isColorOption(filter.label) || /couleur|color/i.test(filter.label);
  const activeInGroup = filter.values.some((v) =>
    isFilterActive(
      params,
      typeof v.input === 'string' ? v.input : JSON.stringify(v.input),
    ),
  );

  if (filter.type === 'PRICE_RANGE') {
    return (
      <details className="fgroup" open>
        <summary>
          {filter.label === 'Price' ? 'Prix' : filter.label}
          <IconChevron width={16} height={16} />
        </summary>
        <PriceRange params={params} />
      </details>
    );
  }

  return (
    <details
      className="fgroup"
      open={activeInGroup || isSize || filter.values.length < 7}
    >
      <summary>
        {translateLabel(filter.label)}
        <IconChevron width={16} height={16} />
      </summary>
      <div
        className={`fvalues ${isSize ? 'fvalues--sizes' : ''} ${isColor ? 'fvalues--colors' : ''}`}
      >
        {filter.values.map((v) => {
          const input =
            typeof v.input === 'string' ? v.input : JSON.stringify(v.input);
          const active = isFilterActive(params, input);
          const disabled = v.count === 0 && !active;
          const to = toggleFilter(params, input);
          if (isSize) {
            return (
              <Link
                key={v.id}
                to={to}
                preventScrollReset
                className={`size-chip ${active ? 'is-active' : ''} ${disabled ? 'is-out' : ''}`}
                aria-pressed={active}
              >
                {v.label}
              </Link>
            );
          }
          return (
            <Link
              key={v.id}
              to={to}
              preventScrollReset
              className={`fcheck ${active ? 'is-active' : ''} ${disabled ? 'is-out' : ''}`}
              aria-pressed={active}
            >
              {isColor ? (
                <span
                  className="fswatch"
                  style={{background: v.swatch?.color || cssColor(v.label)}}
                />
              ) : (
                <span className="fbox" />
              )}
              <span className="flabel">{v.label}</span>
              <span className="fcount">{v.count}</span>
            </Link>
          );
        })}
      </div>
    </details>
  );
}

function PriceRange({params}: {params: URLSearchParams}) {
  const location = useLocation();
  const hidden: [string, string][] = [];
  params.forEach((value, key) => {
    if (!['price.min', 'price.max', 'cursor', 'direction'].includes(key))
      hidden.push([key, value]);
  });
  return (
    <Form
      method="get"
      action={location.pathname}
      preventScrollReset
      className="price-range"
    >
      {hidden.map(([k, v], i) => (
        <input key={`${k}-${i}`} type="hidden" name={k} value={v} />
      ))}
      <label>
        <span>Min</span>
        <input
          type="number"
          name="price.min"
          min={0}
          placeholder="0"
          defaultValue={params.get('price.min') ?? ''}
        />
      </label>
      <label>
        <span>Max</span>
        <input
          type="number"
          name="price.max"
          min={0}
          placeholder="5000"
          defaultValue={params.get('price.max') ?? ''}
        />
      </label>
      <button type="submit" className="btn btn--sm">
        OK
      </button>
    </Form>
  );
}

const LABELS: Record<string, string> = {
  Availability: 'Disponibilité',
  'Product type': 'Type',
  Brand: 'Marque',
  Vendor: 'Marque',
  Size: 'Pointure',
  Color: 'Couleur',
  Gender: 'Genre',
};
function translateLabel(label: string) {
  return LABELS[label] ?? label;
}

const COLOR_WORDS: Record<string, string> = {
  noir: '#141210',
  black: '#141210',
  blanc: '#fff',
  white: '#fff',
  gris: '#9a958f',
  grey: '#9a958f',
  gray: '#9a958f',
  rouge: '#c2321f',
  red: '#c2321f',
  bleu: '#2b4fa8',
  blue: '#2b4fa8',
  vert: '#3d6b45',
  green: '#3d6b45',
  beige: '#d9cbb3',
  marron: '#6b4a32',
  brown: '#6b4a32',
  rose: '#e7a7b4',
  pink: '#e7a7b4',
  jaune: '#e8c547',
  yellow: '#e8c547',
  orange: '#e2742a',
  violet: '#6a4c93',
  purple: '#6a4c93',
  crème: '#efe7d6',
  cream: '#efe7d6',
};
function cssColor(label: string) {
  const key = label.toLowerCase().split(/[\s/]+/)[0];
  return (
    COLOR_WORDS[key] ??
    'conic-gradient(#c2321f, #e8c547, #3d6b45, #2b4fa8, #c2321f)'
  );
}
