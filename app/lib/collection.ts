import type {
  ProductCollectionSortKeys,
  ProductFilter,
  ProductSortKeys,
} from '@shopify/hydrogen/storefront-api-types';

export const SORT_OPTIONS = [
  {value: 'featured', label: 'Recommandés'},
  {value: 'newest', label: 'Nouveautés'},
  {value: 'best-selling', label: 'Meilleures ventes'},
  {value: 'price-asc', label: 'Prix croissant'},
  {value: 'price-desc', label: 'Prix décroissant'},
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]['value'];

export function getSort(searchParams: URLSearchParams): SortValue {
  const v = searchParams.get('sort');
  return (SORT_OPTIONS.find((o) => o.value === v)?.value ??
    'featured') as SortValue;
}

export function collectionSortVars(sort: SortValue): {
  sortKey: ProductCollectionSortKeys;
  reverse: boolean;
} {
  switch (sort) {
    case 'newest':
      return {sortKey: 'CREATED', reverse: true};
    case 'best-selling':
      return {sortKey: 'BEST_SELLING', reverse: false};
    case 'price-asc':
      return {sortKey: 'PRICE', reverse: false};
    case 'price-desc':
      return {sortKey: 'PRICE', reverse: true};
    default:
      return {sortKey: 'COLLECTION_DEFAULT', reverse: false};
  }
}

export function productSortVars(sort: SortValue): {
  sortKey: ProductSortKeys;
  reverse: boolean;
} {
  switch (sort) {
    case 'best-selling':
      return {sortKey: 'BEST_SELLING', reverse: false};
    case 'price-asc':
      return {sortKey: 'PRICE', reverse: false};
    case 'price-desc':
      return {sortKey: 'PRICE', reverse: true};
    default:
      return {sortKey: 'CREATED_AT', reverse: true};
  }
}

export const FILTER_PARAM = 'filter';

/** Reads `?filter=<json>` params (repeatable) into Storefront API filters. */
export function getFilters(searchParams: URLSearchParams): ProductFilter[] {
  const filters: ProductFilter[] = [];
  for (const raw of searchParams.getAll(FILTER_PARAM)) {
    try {
      filters.push(JSON.parse(raw) as ProductFilter);
    } catch {
      // ignore malformed filter
    }
  }
  const min = searchParams.get('price.min');
  const max = searchParams.get('price.max');
  if (min || max) {
    filters.push({
      price: {
        ...(min ? {min: Number(min)} : {}),
        ...(max ? {max: Number(max)} : {}),
      },
    });
  }
  return filters;
}

/** Returns a new search string with a filter toggled on/off. */
export function toggleFilter(searchParams: URLSearchParams, input: string) {
  const next = new URLSearchParams(searchParams);
  const current = next.getAll(FILTER_PARAM);
  next.delete(FILTER_PARAM);
  const normalized = normalize(input);
  const exists = current.some((c) => normalize(c) === normalized);
  for (const c of current) {
    if (normalize(c) !== normalized) next.append(FILTER_PARAM, c);
  }
  if (!exists) next.append(FILTER_PARAM, input);
  next.delete('cursor');
  next.delete('direction');
  return `?${next.toString()}`;
}

export function isFilterActive(searchParams: URLSearchParams, input: string) {
  const normalized = normalize(input);
  return searchParams
    .getAll(FILTER_PARAM)
    .some((c) => normalize(c) === normalized);
}

export function clearFilters(searchParams: URLSearchParams) {
  const next = new URLSearchParams(searchParams);
  next.delete(FILTER_PARAM);
  next.delete('price.min');
  next.delete('price.max');
  next.delete('cursor');
  next.delete('direction');
  return `?${next.toString()}`;
}

function normalize(json: string) {
  try {
    return JSON.stringify(JSON.parse(json));
  } catch {
    return json;
  }
}

/** Shared selection set for collection grids. */
export const FILTERS_SELECTION = `#graphql
  fragment CollectionFilters on Filter {
    id
    label
    type
    values {
      id
      label
      count
      input
      swatch {
        color
      }
    }
  }
` as const;
