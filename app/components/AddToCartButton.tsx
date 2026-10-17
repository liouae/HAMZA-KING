import {useEffect, useRef, useState} from 'react';
import {type FetcherWithComponents} from 'react-router';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';

type AddToCartProps = {
  analytics?: unknown;
  children: React.ReactNode;
  disabled?: boolean;
  lines: Array<OptimisticCartLineInput>;
  /** Runs immediately when a valid add-to-cart request is submitted. */
  onClick?: () => void;
  /** Runs only after Shopify confirms the requested variant is in the cart. */
  onAdded?: () => void;
  className?: string;
};

type CartAddResponse = {
  cart?: {
    lines?: {
      nodes?: Array<{merchandise?: {id?: string}}>;
    };
  } | null;
  errors?: Array<{message?: string}>;
};

export function AddToCartButton({
  analytics,
  children,
  disabled,
  lines,
  onClick,
  onAdded,
  className = 'btn',
}: AddToCartProps) {
  return (
    <CartForm route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher: FetcherWithComponents<unknown>) => (
        <CartSubmitButton
          fetcher={fetcher}
          analytics={analytics}
          disabled={disabled}
          lines={lines}
          onClick={onClick}
          onAdded={onAdded}
          className={className}
        >
          {children}
        </CartSubmitButton>
      )}
    </CartForm>
  );
}

/**
 * Wait for the addLines response before opening the cart or tracking the event.
 * An in-flight guard also blocks rapid double taps while the request starts.
 */
function CartSubmitButton({
  fetcher,
  analytics,
  children,
  disabled,
  lines,
  onClick,
  onAdded,
  className,
}: AddToCartProps & {fetcher: FetcherWithComponents<unknown>; className: string}) {
  const requestedVariant = useRef<string | null>(null);
  const submittedCallback = useRef<(() => void) | undefined>(undefined);
  const [isPending, setIsPending] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const requestStarted = useRef(false);

  useEffect(() => {
    if (fetcher.state !== 'idle') {
      requestStarted.current = true;
      return;
    }
    // A request can fail or be interrupted without returning fetcher.data.
    // Never leave "Ajout…" disabled permanently after that transition.
    if (!requestedVariant.current || !requestStarted.current) return;

    const requestedId = requestedVariant.current;
    requestedVariant.current = null;
    requestStarted.current = false;
    const onSuccess = submittedCallback.current;
    submittedCallback.current = undefined;
    setIsPending(false);

    const result = fetcher.data as CartAddResponse | undefined;
    const wasAdded = result?.cart?.lines?.nodes?.some(
      (line) => line.merchandise?.id === requestedId,
    );
    if ((result?.errors?.length ?? 0) > 0 || !wasAdded) {
      setErrorMessage(
        result?.errors?.[0]?.message ||
          "Impossible de confirmer l'ajout. Vérifie ton panier avant de réessayer.",
      );
      return;
    }

    setErrorMessage('');
    onSuccess?.();
  }, [fetcher.state, fetcher.data]);

  useEffect(() => {
    if (!isPending) return;
    // Particularly in Instagram's in-app browser, stalled requests must
    // have an exit. Do not silently retry: Shopify may have added the item.
    const timer = window.setTimeout(() => {
      if (!requestedVariant.current) return;
      requestedVariant.current = null;
      submittedCallback.current = undefined;
      requestStarted.current = false;
      setIsPending(false);
      setTimedOut(true);
      setErrorMessage(
        "La connexion prend trop de temps. Vérifie ton panier avant de réessayer.",
      );
    }, 15000);
    return () => window.clearTimeout(timer);
  }, [isPending]);

  return (
    <>
      <input
        name="analytics"
        type="hidden"
        value={JSON.stringify(analytics)}
      />
      <button
        type="submit"
        className={`${className} ${isPending || fetcher.state !== 'idle' ? 'is-busy' : ''}`}
        disabled={Boolean(disabled) || isPending || timedOut || fetcher.state !== 'idle'}
        onClick={(event) => {
          if (requestedVariant.current || fetcher.state !== 'idle') {
            event.preventDefault();
            return;
          }
          const variantId = lines[0]?.merchandiseId;
          if (!variantId) {
            event.preventDefault();
            setErrorMessage('Choisis une pointure avant de continuer.');
            return;
          }
          requestedVariant.current = variantId;
          submittedCallback.current = onAdded;
          setIsPending(true);
          setTimedOut(false);
          setErrorMessage('');
          onClick?.();
        }}
      >
        {isPending || fetcher.state !== 'idle' ? 'Ajout…' : children}
      </button>
      {errorMessage ? (
        <div role="alert" className="opt-nudge">
          <p>{errorMessage}</p>
          <a href="/cart" className="link-btn">Voir mon panier</a>
        </div>
      ) : null}
    </>
  );
}
