import {useEffect, useRef} from 'react';
import {useFetcher} from 'react-router';
import {CartForm} from '@shopify/hydrogen';
import {attributionAttributes} from '~/lib/attribution';

/**
 * Keeps the cart's hidden attribution attributes (_source_last, _source_first,
 * _landing, _fbclid…) in sync, so the Shopify order shows where it came from.
 * Only writes when something changed.
 */
export function AttributionSync({
  cartId,
  attributes,
}: {
  cartId?: string | null;
  attributes?: {key: string; value?: string | null}[] | null;
}) {
  const fetcher = useFetcher();
  const sent = useRef('');
  useEffect(() => {
    if (!cartId) return;
    const wanted = attributionAttributes();
    if (!wanted.length) return;
    const current = new Map(
      (attributes ?? []).map((a) => [a.key, a.value ?? '']),
    );
    const changed = wanted.some((a) => current.get(a.key) !== a.value);
    const sig = cartId + JSON.stringify(wanted);
    if (!changed || sent.current === sig) return;
    sent.current = sig;
    const keep = (attributes ?? [])
      .filter((a) => !a.key.startsWith('_'))
      .map((a) => ({key: a.key, value: a.value ?? ''}));
    void fetcher.submit(
      {
        cartFormInput: JSON.stringify({
          action: CartForm.ACTIONS.AttributesUpdateInput,
          inputs: {attributes: [...keep, ...wanted]},
        }),
      },
      {method: 'POST', action: '/cart'},
    );
  }, [cartId, attributes, fetcher]);
  return null;
}
