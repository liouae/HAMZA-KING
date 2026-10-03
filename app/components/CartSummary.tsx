import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from '~/components/CartMain';
import {CartForm, type OptimisticCart} from '@shopify/hydrogen';
import {formatMoney} from './Price';
import {IconArrow, IconCash, IconShield, IconWhatsApp} from './Icons';
import {whatsappLink} from '~/lib/config';
import {useEffect, useId, useRef, useState} from 'react';
import {useFetcher} from 'react-router';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

export function CartSummary({cart, layout}: CartSummaryProps) {
  const className =
    layout === 'page' ? 'cart-summary-page' : 'cart-summary-aside';
  const summaryId = useId();
  const discountsHeadingId = useId();
  const discountCodeInputId = useId();
  const giftCardHeadingId = useId();
  const giftCardInputId = useId();

  return (
    <div aria-labelledby={summaryId} className={`cart-summary ${className}`}>
      <h3 id={summaryId} className="sr-only">
        Récapitulatif
      </h3>
      <details className="cart-codes">
        <summary>Code promo ou carte cadeau</summary>
        <CartDiscounts
          discountCodes={cart?.discountCodes}
          discountsHeadingId={discountsHeadingId}
          discountCodeInputId={discountCodeInputId}
        />
        <CartGiftCard
          giftCardCodes={cart?.appliedGiftCards}
          giftCardHeadingId={giftCardHeadingId}
          giftCardInputId={giftCardInputId}
        />
      </details>
      <dl className="cart-totals">
        <div>
          <dt>Sous-total</dt>
          <dd>
            {cart?.cost?.subtotalAmount?.amount
              ? formatMoney(cart.cost.subtotalAmount)
              : '–'}
          </dd>
        </div>
        <div>
          <dt>Livraison</dt>
          <dd className="muted">Calculée à l’étape suivante</dd>
        </div>
      </dl>
      <CartNote note={cart?.note ?? ''} />
      <CartCheckoutActions checkoutUrl={cart?.checkoutUrl} />
      <a
        className="btn btn--block btn--wa"
        href={whatsappLink(
          `Salam ! Je veux commander :\n${(cart?.lines?.nodes ?? [])
            .map(
              (l) =>
                `• ${l.merchandise.product.title} — ${l.merchandise.title} ×${l.quantity}`,
            )
            .join('\n')}`,
        )}
        target="_blank"
        rel="noreferrer"
      >
        <IconWhatsApp /> Commander sur WhatsApp
      </a>
      <ul className="cart-assurances">
        <li>
          <IconCash width={16} height={16} /> Paiement à la livraison disponible
        </li>
        <li>
          <IconShield width={16} height={16} /> Paires 100% authentiques
        </li>
      </ul>
    </div>
  );
}

function CartNote({note}: {note: string}) {
  const id = useId();
  return (
    <details className="cart-codes" open={Boolean(note)}>
      <summary>Ajouter une note à ma commande</summary>
      <CartForm route="/cart" action={CartForm.ACTIONS.NoteUpdate}>
        <div>
          <label htmlFor={id} className="sr-only">
            Note
          </label>
          <input
            id={id}
            name="note"
            defaultValue={note}
            placeholder="Ex. : appeler avant la livraison"
          />
          <button type="submit">OK</button>
        </div>
      </CartForm>
    </details>
  );
}

function CartCheckoutActions({checkoutUrl}: {checkoutUrl?: string}) {
  if (!checkoutUrl) return null;
  return (
    <a href={checkoutUrl} target="_self" className="btn btn--block btn--lg">
      Commander <IconArrow width={18} height={18} />
    </a>
  );
}

function CartDiscounts({
  discountCodes,
  discountsHeadingId,
  discountCodeInputId,
}: {
  discountCodes?: CartApiQueryFragment['discountCodes'];
  discountsHeadingId: string;
  discountCodeInputId: string;
}) {
  const codes: string[] =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({code}) => code) || [];

  return (
    <section aria-label="Discounts">
      {/* Have existing discount, display it with a remove option */}
      <dl hidden={!codes.length}>
        <div>
          <dt id={discountsHeadingId}>Codes promo</dt>
          <UpdateDiscountForm>
            <div
              className="cart-discount"
              role="group"
              aria-labelledby={discountsHeadingId}
            >
              <code>{codes?.join(', ')}</code>

              <button type="submit" aria-label="Remove discount">
                Retirer
              </button>
            </div>
          </UpdateDiscountForm>
        </div>
      </dl>

      {/* Show an input to apply a discount */}
      <UpdateDiscountForm discountCodes={codes}>
        <div>
          <label htmlFor={discountCodeInputId} className="sr-only">
            Discount code
          </label>
          <input
            id={discountCodeInputId}
            type="text"
            name="discountCode"
            placeholder="Code promo"
          />

          <button type="submit" aria-label="Apply discount code">
            Appliquer
          </button>
        </div>
      </UpdateDiscountForm>
    </section>
  );
}

function UpdateDiscountForm({
  discountCodes,
  children,
}: {
  discountCodes?: string[];
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{
        discountCodes: discountCodes || [],
      }}
    >
      {children}
    </CartForm>
  );
}

function CartGiftCard({
  giftCardCodes,
  giftCardHeadingId,
  giftCardInputId,
}: {
  giftCardCodes: CartApiQueryFragment['appliedGiftCards'] | undefined;
  giftCardHeadingId: string;
  giftCardInputId: string;
}) {
  const giftCardCodeInput = useRef<HTMLInputElement>(null);
  const removeButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const previousCardIdsRef = useRef<string[]>([]);
  const giftCardAddFetcher = useFetcher({key: 'gift-card-add'});
  const [removedCardIndex, setRemovedCardIndex] = useState<number | null>(null);

  useEffect(() => {
    if (giftCardAddFetcher.data) {
      if (giftCardCodeInput.current !== null) {
        giftCardCodeInput.current.value = '';
      }
    }
  }, [giftCardAddFetcher.data]);

  useEffect(() => {
    const currentCardIds = giftCardCodes?.map((card) => card.id) || [];

    if (removedCardIndex !== null && giftCardCodes) {
      const focusTargetIndex = Math.min(
        removedCardIndex,
        giftCardCodes.length - 1,
      );
      const focusTargetCard = giftCardCodes[focusTargetIndex];
      const focusButton = focusTargetCard
        ? removeButtonRefs.current.get(focusTargetCard.id)
        : null;

      if (focusButton) {
        focusButton.focus();
      } else if (giftCardCodeInput.current) {
        giftCardCodeInput.current.focus();
      }

      setRemovedCardIndex(null);
    }

    previousCardIdsRef.current = currentCardIds;
  }, [giftCardCodes, removedCardIndex]);

  const handleRemoveClick = (cardId: string) => {
    const index = previousCardIdsRef.current.indexOf(cardId);
    if (index !== -1) {
      setRemovedCardIndex(index);
    }
  };

  return (
    <section aria-label="Gift cards">
      {giftCardCodes && giftCardCodes.length > 0 && (
        <dl>
          <dt id={giftCardHeadingId}>Cartes cadeaux</dt>
          {giftCardCodes.map((giftCard) => (
            <dd key={giftCard.id} className="cart-discount">
              <RemoveGiftCardForm
                giftCardId={giftCard.id}
                lastCharacters={giftCard.lastCharacters}
                onRemoveClick={() => handleRemoveClick(giftCard.id)}
                buttonRef={(el: HTMLButtonElement | null) => {
                  if (el) {
                    removeButtonRefs.current.set(giftCard.id, el);
                  } else {
                    removeButtonRefs.current.delete(giftCard.id);
                  }
                }}
              >
                <code>***{giftCard.lastCharacters}</code>

                {formatMoney(giftCard.amountUsed)}
              </RemoveGiftCardForm>
            </dd>
          ))}
        </dl>
      )}

      <AddGiftCardForm fetcherKey="gift-card-add">
        <div>
          <label htmlFor={giftCardInputId} className="sr-only">
            Gift card code
          </label>
          <input
            id={giftCardInputId}
            type="text"
            name="giftCardCode"
            placeholder="Carte cadeau"
            ref={giftCardCodeInput}
          />

          <button
            type="submit"
            disabled={giftCardAddFetcher.state !== 'idle'}
            aria-label="Apply gift card code"
          >
            Appliquer
          </button>
        </div>
      </AddGiftCardForm>
    </section>
  );
}

function AddGiftCardForm({
  fetcherKey,
  children,
}: {
  fetcherKey?: string;
  children: React.ReactNode;
}) {
  return (
    <CartForm
      fetcherKey={fetcherKey}
      route="/cart"
      action={CartForm.ACTIONS.GiftCardCodesAdd}
    >
      {children}
    </CartForm>
  );
}

function RemoveGiftCardForm({
  giftCardId,
  lastCharacters,
  children,
  onRemoveClick,
  buttonRef,
}: {
  giftCardId: string;
  lastCharacters: string;
  children: React.ReactNode;
  onRemoveClick?: () => void;
  buttonRef?: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.GiftCardCodesRemove}
      inputs={{
        giftCardCodes: [giftCardId],
      }}
    >
      {children}

      <button
        type="submit"
        aria-label={`Remove gift card ending in ${lastCharacters}`}
        onClick={onRemoveClick}
        ref={buttonRef}
      >
        Retirer
      </button>
    </CartForm>
  );
}
