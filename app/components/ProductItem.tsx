import {Link} from 'react-router';
import {CartForm, Image} from '@shopify/hydrogen';
import type {FetcherWithComponents} from 'react-router';
import {useVariantUrl} from '~/lib/variants';
import {isColorOption, isSizeOption} from '~/lib/config';
import {Price} from './Price';
import {useAside} from './Aside';
import {WishlistButton} from './WishlistButton';

type Money = {amount: string; currencyCode: string};
type Img = {
  id?: string | null;
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

/**
 * Loose product shape so the card works with every query in the app
 * (collections, search, recommendations). Richer fields unlock
 * hover-image, quick-add sizes and badges.
 */
export type CardProduct = {
  id: string;
  handle: string;
  title: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  publishedAt?: string;
  featuredImage?: Img | null;
  images?: {nodes: Img[]};
  priceRange: {minVariantPrice: Money; maxVariantPrice?: Money};
  compareAtPriceRange?: {maxVariantPrice: Money};
  options?: {
    name: string;
    optionValues: {name: string; swatch?: {color?: string | null} | null}[];
  }[];
  variants?: {
    nodes: {
      id: string;
      availableForSale: boolean;
      selectedOptions: {name: string; value: string}[];
      price?: Money;
      compareAtPrice?: Money | null;
    }[];
  };
};

const NEW_DAYS = 30;

function getBadge(product: CardProduct) {
  const tags = (product.tags ?? []).map((t) => t.toLowerCase());
  if (tags.includes('exclusif') || tags.includes('limited'))
    return {label: 'Exclusif', tone: 'ink'};
  const soldOut = product.variants?.nodes?.length
    ? product.variants.nodes.every((v) => !v.availableForSale)
    : false;
  if (soldOut) return {label: 'Épuisé', tone: 'muted'};
  const price = Number(product.priceRange.minVariantPrice.amount);
  const compare = Number(
    product.compareAtPriceRange?.maxVariantPrice?.amount ?? 0,
  );
  if (compare > price) return {label: 'Promo', tone: 'clay'};
  if (
    tags.includes('new') ||
    tags.includes('nouveau') ||
    (product.publishedAt &&
      Date.now() - new Date(product.publishedAt).getTime() < NEW_DAYS * 864e5)
  )
    return {label: 'Nouveau', tone: 'ink'};
  return null;
}

const GENDER_LABELS: Record<string, string> = {
  homme: 'Homme',
  femme: 'Femme',
  enfant: 'Enfant',
  junior: 'Junior',
  bebe: 'Bébé',
};

/** "Sneakers · Homme" style subtitle built from product type + gender tags. */
export function productSubtitle(product: CardProduct) {
  const tags = (product.tags ?? []).map((t) => t.toLowerCase());
  const genders = Object.keys(GENDER_LABELS).filter((g) => tags.includes(g));
  const gender =
    genders.length > 1
      ? 'Unisexe'
      : genders.length === 1
        ? GENDER_LABELS[genders[0]]
        : '';
  const type = product.productType || 'Sneakers';
  return [type, gender].filter(Boolean).join(' · ');
}

const COLOR_WORDS: Record<string, string> = {
  noir: '#141210',
  black: '#141210',
  blanc: '#f7f5f2',
  white: '#f7f5f2',
  gris: '#9a958f',
  grey: '#9a958f',
  gray: '#9a958f',
  rouge: '#c2321f',
  red: '#c2321f',
  bleu: '#2b4fa8',
  blue: '#2b4fa8',
  navy: '#1f2a44',
  vert: '#3d6b45',
  green: '#3d6b45',
  beige: '#d9cbb3',
  sable: '#d9cbb3',
  sand: '#d9cbb3',
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
  argent: '#c9c9cc',
  silver: '#c9c9cc',
  or: '#d4af37',
  gold: '#d4af37',
  kaki: '#7a7a4f',
  olive: '#7a7a4f',
};
export function colorFromName(name: string) {
  const key = name.toLowerCase().split(/[\s/,-]+/)[0];
  return COLOR_WORDS[key] ?? 'linear-gradient(135deg,#e2ded8,#9a958f)';
}

export function ProductItem({
  product,
  loading,
}: {
  product: CardProduct;
  loading?: 'eager' | 'lazy';
}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage ?? product.images?.nodes?.[0];
  const hoverImage = product.images?.nodes?.[1];
  const badge = getBadge(product);
  const colorOpt = product.options?.find((o) => isColorOption(o.name));
  const colorValues = colorOpt?.optionValues ?? [];
  const colors = colorValues.length;
  const subtitle = productSubtitle(product);
  const firstVariant = product.variants?.nodes?.[0];
  const compareAt =
    firstVariant?.compareAtPrice ??
    product.compareAtPriceRange?.maxVariantPrice;
  const price = firstVariant?.price ?? product.priceRange.minVariantPrice;
  const hasRange =
    product.priceRange.maxVariantPrice &&
    product.priceRange.maxVariantPrice.amount !==
      product.priceRange.minVariantPrice.amount;

  return (
    <article className="card">
      <div className="card-frame">
        <Link
          className="card-media"
          prefetch="intent"
          to={variantUrl}
          aria-label={product.title}
        >
          {image ? (
            <Image
              className="card-img"
              alt={image.altText || product.title}
              aspectRatio="1/1"
              data={image}
              loading={loading}
              sizes="(min-width: 64em) 25vw, (min-width: 45em) 33vw, 50vw"
            />
          ) : (
            <span className="card-img card-img--empty" />
          )}
          {hoverImage ? (
            <Image
              className="card-img card-img--hover"
              alt=""
              aspectRatio="1/1"
              data={hoverImage}
              loading="lazy"
              sizes="(min-width: 64em) 25vw, (min-width: 45em) 33vw, 50vw"
            />
          ) : null}
          {badge ? (
            <span className={`badge badge--${badge.tone}`}>{badge.label}</span>
          ) : null}
        </Link>
        <WishlistButton
          className="card-wish"
          item={{
            handle: product.handle,
            title: product.title,
            vendor: product.vendor,
            image: image?.url,
            price: product.priceRange.minVariantPrice,
          }}
        />
        <QuickAdd product={product} />
      </div>
      <Link className="card-body" prefetch="intent" to={variantUrl}>
        {product.vendor ? (
          <p className="card-vendor">{product.vendor}</p>
        ) : null}
        <h3 className="card-title">{product.title}</h3>
        <p className="card-meta">
          {subtitle}
          {colors > 1 ? ` · ${colors} coloris` : ''}
        </p>
        {colors > 1 ? (
          <span className="card-dots" aria-hidden>
            {colorValues.slice(0, 6).map((v) => (
              <i
                key={v.name}
                style={{background: v.swatch?.color || colorFromName(v.name)}}
              />
            ))}
            {colors > 6 ? <em>+{colors - 6}</em> : null}
          </span>
        ) : null}
        <Price
          price={price}
          compareAtPrice={hasRange ? undefined : compareAt}
          from={Boolean(hasRange)}
          className="card-price"
        />
      </Link>
    </article>
  );
}

/** Size chips revealed on hover: one tap adds the pair to the cart. */
function QuickAdd({product}: {product: CardProduct}) {
  const {open} = useAside();
  const variants = product.variants?.nodes;
  const sizeOpt = product.options?.find((o) => isSizeOption(o.name));
  if (!variants?.length || !sizeOpt) return null;

  const sizes = sizeOpt.optionValues.map(({name}) => {
    const variant =
      variants.find(
        (v) =>
          v.availableForSale &&
          v.selectedOptions.some(
            (o) => o.name === sizeOpt.name && o.value === name,
          ),
      ) ??
      variants.find((v) =>
        v.selectedOptions.some(
          (o) => o.name === sizeOpt.name && o.value === name,
        ),
      );
    return {name, variant};
  });

  return (
    <div className="quickadd" aria-label="Ajout rapide">
      <p className="quickadd-label">Ajout rapide — choisis ta taille</p>
      <div className="quickadd-sizes">
        {sizes.map(({name, variant}) =>
          variant?.availableForSale ? (
            <CartForm
              key={name}
              route="/cart"
              action={CartForm.ACTIONS.LinesAdd}
              inputs={{lines: [{merchandiseId: variant.id, quantity: 1}]}}
            >
              {(fetcher: FetcherWithComponents<unknown>) => (
                <button
                  type="submit"
                  className="quickadd-size"
                  disabled={fetcher.state !== 'idle'}
                  onClick={() => open('cart')}
                >
                  {name}
                </button>
              )}
            </CartForm>
          ) : (
            <span key={name} className="quickadd-size is-out" aria-disabled>
              {name}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

export const PRODUCT_CARD_FRAGMENT = `#graphql
  fragment CardMoney on MoneyV2 {
    amount
    currencyCode
  }
  fragment CardImage on Image {
    id
    url
    altText
    width
    height
  }
  fragment ProductCard on Product {
    id
    handle
    title
    vendor
    productType
    tags
    publishedAt
    featuredImage {
      ...CardImage
    }
    images(first: 2) {
      nodes {
        ...CardImage
      }
    }
    priceRange {
      minVariantPrice {
        ...CardMoney
      }
      maxVariantPrice {
        ...CardMoney
      }
    }
    compareAtPriceRange {
      maxVariantPrice {
        ...CardMoney
      }
    }
    options(first: 3) {
      name
      optionValues {
        name
        swatch {
          color
        }
      }
    }
    variants(first: 40) {
      nodes {
        id
        availableForSale
        selectedOptions {
          name
          value
        }
        price {
          ...CardMoney
        }
        compareAtPrice {
          ...CardMoney
        }
      }
    }
  }
` as const;
