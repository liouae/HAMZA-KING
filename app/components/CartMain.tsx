import {useOptimisticCart} from '@shopify/hydrogen';
import {Link} from 'react-router';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {CartLineItem, type CartLine} from '~/components/CartLineItem';
import {CartSummary} from './CartSummary';
import {CartUpsell} from './CartUpsell';
import {IconArrow} from './Icons';
import {BrandLogo} from './BrandLogo';

export type CartLayout = 'page' | 'aside';

export type CartMainProps = {
  cart: CartApiQueryFragment | null;
  layout: CartLayout;
};

export type LineItemChildrenMap = {[parentId: string]: CartLine[]};

function getLineItemChildrenMap(lines: CartLine[]): LineItemChildrenMap {
  const children: LineItemChildrenMap = {};
  for (const line of lines) {
    if ('parentRelationship' in line && line.parentRelationship?.parent) {
      const parentId = line.parentRelationship.parent.id;
      if (!children[parentId]) children[parentId] = [];
      children[parentId].push(line);
    }
    if ('lineComponents' in line) {
      const lineChildren = getLineItemChildrenMap(line.lineComponents);
      for (const [parentId, childIds] of Object.entries(lineChildren)) {
        if (!children[parentId]) children[parentId] = [];
        children[parentId].push(...childIds);
      }
    }
  }
  return children;
}

export function CartMain({layout, cart: originalCart}: CartMainProps) {
  const cart = useOptimisticCart(originalCart);
  const hasLines = Boolean(cart?.lines?.nodes?.length);
  const cartHasItems = cart?.totalQuantity ? cart.totalQuantity > 0 : false;
  const childrenMap = getLineItemChildrenMap(cart?.lines?.nodes ?? []);

  return (
    <section
      className={`cart cart--${layout}`}
      aria-label={layout === 'page' ? 'Panier' : 'Panier (tiroir)'}
    >
      {!hasLines ? (
        <CartEmpty layout={layout} />
      ) : (
        <>
          <FreeShippingMeter subtotal={cart?.cost?.subtotalAmount} />
          <ul className="cart-lines" aria-label="Articles">
            {(cart?.lines?.nodes ?? []).map((line) => {
              if (
                'parentRelationship' in line &&
                line.parentRelationship?.parent
              ) {
                return null;
              }
              return (
                <CartLineItem
                  key={line.id}
                  line={line}
                  layout={layout}
                  childrenMap={childrenMap}
                />
              );
            })}
          </ul>
          {layout === 'aside' && cartHasItems ? (
            <CartUpsell
              handle={cart?.lines?.nodes?.[0]?.merchandise?.product?.handle}
              exclude={(cart?.lines?.nodes ?? []).map(
                (l) => l.merchandise.product.handle,
              )}
            />
          ) : null}
          {cartHasItems && <CartSummary cart={cart} layout={layout} />}
        </>
      )}
    </section>
  );
}

function FreeShippingMeter({
  subtotal,
}: {
  subtotal?: {amount?: string | null; currencyCode?: string | null} | null;
}) {
  if (!subtotal?.amount) return null;
  return (
    <div className="ship-meter ship-meter--free">
      <p>
        <strong>Livraison gratuite</strong> · Paiement à la livraison
      </p>
      <div className="ship-meter-bar" aria-hidden>
        <span style={{width: '100%'}} />
      </div>
    </div>
  );
}

function CartEmpty({layout}: {layout?: CartMainProps['layout']}) {
  const {close} = useAside();
  return (
    <div className="cart-empty">
      <span className="cart-empty-icon">
        <BrandLogo variant="crown" height={22} decorative />
      </span>
      <p className="cart-empty-title">Ton panier est vide</p>
      <p className="cart-empty-copy">
        Les meilleures paires partent vite. Commence par les nouveautés.
      </p>
      <Link
        to="/collections/all?sort=newest"
        onClick={layout === 'aside' ? close : undefined}
        prefetch="viewport"
        className="btn"
      >
        Voir les nouveautés <IconArrow width={16} height={16} />
      </Link>
    </div>
  );
}
