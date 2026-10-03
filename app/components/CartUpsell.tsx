import {useEffect} from 'react';
import {Link, useFetcher} from 'react-router';
import {useAside} from './Aside';
import {Price} from './Price';
import type {CardProduct} from './ProductItem';

/** "Complète ta commande" — small recommendations list inside the cart drawer. */
export function CartUpsell({
  handle,
  exclude,
}: {
  handle?: string;
  exclude: string[];
}) {
  const fetcher = useFetcher<{products: CardProduct[]}>();
  const {close} = useAside();
  useEffect(() => {
    if (handle)
      fetcher.load(`/api/recommend?handle=${encodeURIComponent(handle)}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle]);
  const products = (fetcher.data?.products ?? [])
    .filter((p) => !exclude.includes(p.handle))
    .slice(0, 4);
  if (!products.length) return null;
  return (
    <div className="upsell">
      <p className="eyebrow">Complète ta commande</p>
      <ul className="upsell-list">
        {products.map((p) => (
          <li key={p.id}>
            <Link
              to={`/products/${p.handle}`}
              onClick={close}
              className="upsell-item"
            >
              {p.featuredImage ? (
                <img src={p.featuredImage.url} alt="" loading="lazy" />
              ) : (
                <span />
              )}
              <span className="upsell-body">
                <span className="card-vendor">{p.vendor}</span>
                <span className="upsell-title">{p.title}</span>
                <Price price={p.priceRange.minVariantPrice} className="small" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
