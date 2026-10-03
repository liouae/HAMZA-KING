import {useToast, useWishlist, type WishItem} from '~/lib/ui';
import {IconHeart} from './Icons';

export function WishlistButton({
  item,
  className = '',
  label = false,
}: {
  item: Omit<WishItem, 'addedAt'>;
  className?: string;
  label?: boolean;
}) {
  const {has, toggle} = useWishlist();
  const {push} = useToast();
  const active = has(item.handle);
  return (
    <button
      type="button"
      className={`wish ${active ? 'is-active' : ''} ${className}`}
      aria-pressed={active}
      aria-label={active ? 'Retirer de la wishlist' : 'Ajouter à la wishlist'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const added = toggle(item);
        push({
          title: added ? 'Ajouté à ta wishlist' : 'Retiré de ta wishlist',
          copy: item.title,
          image: item.image,
        });
      }}
    >
      <IconHeart filled={active} />
      {label ? (
        <span>{active ? 'Dans ta wishlist' : 'Ajouter à la wishlist'}</span>
      ) : null}
    </button>
  );
}
