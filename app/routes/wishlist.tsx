import {Link} from 'react-router';
import type {Route} from './+types/wishlist';
import {useEffect, useState} from 'react';
import {useWishlist} from '~/lib/ui';
import {formatMoney} from '~/components/Price';
import {IconArrow, IconClose, IconHeart} from '~/components/Icons';
import {useWhatsAppLink, useWhatsAppTopic, type WaTopic} from '~/lib/whatsapp';
import {RecentlyViewed} from '~/components/RecentlyViewed';

export const meta: Route.MetaFunction = () => [
  {title: 'HAMZA KING | Ma wishlist'},
];

export default function WishlistPage() {
  const {items, remove} = useWishlist();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const waTopic: WaTopic | null = items.length
    ? {
        kind: 'wishlist',
        items: items.map((i) => ({
          title: i.title,
          price: i.price ? formatMoney(i.price) : undefined,
        })),
      }
    : null;
  useWhatsAppTopic(waTopic);
  const waLink = useWhatsAppLink('question', waTopic);

  return (
    <div className="wishlist">
      <header className="container wishlist-head">
        <p className="eyebrow">Sauvegardées</p>
        <h1 className="display-l">Ma wishlist.</h1>
        <p className="muted">
          Tes paires sont enregistrées sur cet appareil. Partage-les ou
          commande-les quand tu veux.
        </p>
      </header>

      <div className="container">
        {!mounted ? null : items.length ? (
          <>
            <div className="wishlist-actions">
              <a
                {...waLink}
                target="_blank"
                rel="noreferrer"
                className="btn btn--ghost"
              >
                Demander la disponibilité sur WhatsApp
              </a>
            </div>
            <ul className="grid wishlist-grid">
              {items.map((i) => (
                <li key={i.handle} className="card">
                  <div className="card-frame">
                    <Link to={`/products/${i.handle}`} className="card-media">
                      {i.image ? (
                        <img
                          className="card-img"
                          src={i.image}
                          alt={i.title}
                          loading="lazy"
                        />
                      ) : (
                        <span className="card-img card-img--empty" />
                      )}
                    </Link>
                    <button
                      className="wish is-active card-wish"
                      onClick={() => remove(i.handle)}
                      aria-label="Retirer"
                    >
                      <IconClose />
                    </button>
                  </div>
                  <Link to={`/products/${i.handle}`} className="card-body">
                    {i.vendor ? (
                      <p className="card-vendor">{i.vendor}</p>
                    ) : null}
                    <h3 className="card-title">{i.title}</h3>
                    {i.price ? (
                      <p className="card-price price">{formatMoney(i.price)}</p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="wishlist-empty">
            <span className="cart-empty-icon">
              <IconHeart width={28} height={28} />
            </span>
            <p className="display-s">Ta wishlist est vide.</p>
            <p className="muted">
              Touche le cœur sur une paire pour la garder ici.
            </p>
            <Link to="/collections/all?sort=newest" className="btn">
              Voir les nouveautés <IconArrow width={16} height={16} />
            </Link>
          </div>
        )}
      </div>
      <RecentlyViewed />
    </div>
  );
}
