import {useEffect} from 'react';
import {useFetcher} from 'react-router';
import {useRecentlyViewed} from '~/lib/ui';
import {ProductRail} from './ProductRail';
import type {CardProduct} from './ProductItem';

export function RecentlyViewed({exclude}: {exclude?: string}) {
  const handles = useRecentlyViewed()
    .filter((h) => h !== exclude)
    .slice(0, 8);
  const fetcher = useFetcher<{products: CardProduct[]}>();
  const key = handles.join(',');

  useEffect(() => {
    if (!key) return;
    fetcher.load(`/api/products?handles=${encodeURIComponent(key)}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const products = fetcher.data?.products ?? [];
  if (!products.length) return null;
  return (
    <ProductRail
      eyebrow="Tu as vu"
      title="Récemment consultés"
      products={products}
    />
  );
}
