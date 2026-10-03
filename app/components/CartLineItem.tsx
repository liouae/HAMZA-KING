import type {CartLineUpdateInput} from '@shopify/hydrogen/storefront-api-types';
import type {CartLayout, LineItemChildrenMap} from '~/components/CartMain';
import {CartForm, Image, type OptimisticCartLine} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {Link} from 'react-router';
import {Price} from './Price';
import {useAside} from './Aside';
import {IconMinus, IconPlus} from './Icons';
import type {CartApiQueryFragment} from 'storefrontapi.generated';

export type CartLine = OptimisticCartLine<CartApiQueryFragment>;

export function CartLineItem({
  layout,
  line,
  childrenMap,
}: {
  layout: CartLayout;
  line: CartLine;
  childrenMap: LineItemChildrenMap;
}) {
  const {id, merchandise} = line;
  const {product, title, image, selectedOptions} = merchandise;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);
  const {close} = useAside();
  const lineItemChildren = childrenMap[id];

  return (
    <li className={`cart-line ${line.isOptimistic ? 'is-pending' : ''}`}>
      <div className="cart-line-inner">
        <Link
          to={lineItemUrl}
          className="cart-line-media"
          onClick={() => layout === 'aside' && close()}
        >
          {image && (
            <Image
              alt={title}
              aspectRatio="1/1"
              data={image}
              width={120}
              height={120}
              loading="lazy"
            />
          )}
        </Link>
        <div className="cart-line-info">
          <div className="cart-line-top">
            <div>
              {product.vendor ? (
                <p className="card-vendor">{product.vendor}</p>
              ) : null}
              <Link
                prefetch="intent"
                to={lineItemUrl}
                className="cart-line-title"
                onClick={() => layout === 'aside' && close()}
              >
                {product.title}
              </Link>
              <p className="cart-line-opts">
                {selectedOptions
                  .filter((o) => o.value !== 'Default Title')
                  .map((o) => `${o.name} : ${o.value}`)
                  .join(' · ')}
              </p>
            </div>
            <Price
              price={line?.cost?.totalAmount}
              compareAtPrice={
                line?.cost?.compareAtAmountPerQuantity
                  ? {
                      amount: String(
                        Number(line.cost.compareAtAmountPerQuantity.amount) *
                          line.quantity,
                      ),
                      currencyCode:
                        line.cost.compareAtAmountPerQuantity.currencyCode,
                    }
                  : undefined
              }
              className="cart-line-price"
            />
          </div>
          <CartLineQuantity line={line} />
        </div>
      </div>

      {lineItemChildren ? (
        <ul className="cart-line-children">
          {lineItemChildren.map((childLine) => (
            <CartLineItem
              childrenMap={childrenMap}
              key={childLine.id}
              line={childLine}
              layout={layout}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function CartLineQuantity({line}: {line: CartLine}) {
  if (!line || typeof line?.quantity === 'undefined') return null;
  const {id: lineId, quantity, isOptimistic} = line;
  const prevQuantity = Number(Math.max(0, quantity - 1).toFixed(0));
  const nextQuantity = Number((quantity + 1).toFixed(0));

  return (
    <div className="cart-line-qty">
      <div className="stepper" role="group" aria-label="Quantité">
        <CartLineUpdateButton lines={[{id: lineId, quantity: prevQuantity}]}>
          <button
            aria-label="Diminuer la quantité"
            disabled={quantity <= 1 || !!isOptimistic}
            name="decrease-quantity"
            value={prevQuantity}
          >
            <IconMinus width={14} height={14} />
          </button>
        </CartLineUpdateButton>
        <span aria-live="polite">{quantity}</span>
        <CartLineUpdateButton lines={[{id: lineId, quantity: nextQuantity}]}>
          <button
            aria-label="Augmenter la quantité"
            name="increase-quantity"
            value={nextQuantity}
            disabled={!!isOptimistic}
          >
            <IconPlus width={14} height={14} />
          </button>
        </CartLineUpdateButton>
      </div>
      <CartLineRemoveButton lineIds={[lineId]} disabled={!!isOptimistic} />
    </div>
  );
}

function CartLineRemoveButton({
  lineIds,
  disabled,
}: {
  lineIds: string[];
  disabled: boolean;
}) {
  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{lineIds}}
    >
      <button disabled={disabled} type="submit" className="link-btn">
        Retirer
      </button>
    </CartForm>
  );
}

function CartLineUpdateButton({
  children,
  lines,
}: {
  children: React.ReactNode;
  lines: CartLineUpdateInput[];
}) {
  const lineIds = lines.map((line) => line.id);
  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{lines}}
    >
      {children}
    </CartForm>
  );
}

function getUpdateKey(lineIds: string[]) {
  return [CartForm.ACTIONS.LinesUpdate, ...lineIds].join('-');
}
