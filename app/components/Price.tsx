type MoneyLike =
  {amount?: string | null; currencyCode?: string | null} | null | undefined;

/** Formats money the Moroccan way: "1 299 DH". Other currencies use fr-FR. */
export function formatMoney(money: MoneyLike) {
  if (!money || money.amount == null) return '';
  const value = Number(money.amount);
  if (money.currencyCode === 'MAD') {
    const hasCents = Math.round(value * 100) % 100 !== 0;
    const n = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(value);
    return `${n} DH`;
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: money.currencyCode || 'MAD',
  }).format(value);
}

export function discountPercent(price: MoneyLike, compareAt: MoneyLike) {
  if (!price || !compareAt) return 0;
  const p = Number(price.amount);
  const c = Number(compareAt.amount);
  if (!c || c <= p) return 0;
  return Math.round(((c - p) / c) * 100);
}

export function Price({
  price,
  compareAtPrice,
  className = '',
  from = false,
}: {
  price: MoneyLike;
  compareAtPrice?: MoneyLike;
  className?: string;
  from?: boolean;
}) {
  if (!price) return null;
  const off = discountPercent(price, compareAtPrice);
  return (
    <span className={`price ${off ? 'is-sale' : ''} ${className}`}>
      {from ? <span className="price-from">Dès </span> : null}
      <span className="price-now">{formatMoney(price)}</span>
      {off ? (
        <>
          <s className="price-was">{formatMoney(compareAtPrice)}</s>
          <span className="price-off">−{off}%</span>
        </>
      ) : null}
    </span>
  );
}
