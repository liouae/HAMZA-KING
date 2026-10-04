import {Suspense, useEffect, useRef, useState} from 'react';
import {useWhatsAppLink} from '~/lib/whatsapp';
import {SmartImage} from '~/components/SmartImage';
import {localPhoto} from '~/lib/content';
import {Await, Link, NavLink, useAsyncValue, useLocation} from 'react-router';
import {Image, useOptimisticCart, useAnalytics} from '@shopify/hydrogen';
import type {CartApiQueryFragment, HeaderQuery} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {ANNOUNCEMENTS, BRAND} from '~/lib/config';
import {useLive} from '~/lib/live';
import {brandLinks, type NavFeature, type NavItem} from '~/lib/navigation';
import {useWishlist} from '~/lib/ui';
import {BrandLogo} from './BrandLogo';
import {
  IconBag,
  IconHeart,
  IconMenu,
  IconSearch,
  IconUser,
  IconArrow,
  IconWhatsApp,
} from './Icons';

type Img = {
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};
export type MenuImages = Record<string, Img>;

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
  menuImages: Promise<MenuImages>;
}

export function Header({cart, menuImages}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const lastY = useRef(0);
  const closeTimer = useRef<number | null>(null);
  const location = useLocation();
  const {nav: NAVIGATION} = useLive();

  useEffect(() => {
    setOpenIndex(null);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      setHidden(y > 240 && y > lastY.current + 4);
      if (y < lastY.current - 4 || y < 240) setHidden(false);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openPanel = (i: number | null) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpenIndex(i);
  };
  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenIndex(null), 140);
  };

  return (
    <div
      className={`site-top ${scrolled ? 'is-scrolled' : ''} ${
        hidden && openIndex === null ? 'is-hidden' : ''
      } ${openIndex !== null ? 'has-mega' : ''}`}
      onMouseLeave={scheduleClose}
    >
      <AnnouncementBar />
      <header className="header">
        <div className="header-inner">
          <div className="header-left">
            <MobileToggle />
            <Link
              prefetch="intent"
              to="/"
              className="wordmark"
              aria-label={BRAND.name}
            >
              <BrandLogo
                variant="lockup"
                height={34}
                eager
                className="wordmark-logo"
              />
            </Link>
          </div>

          <nav className="mainnav" aria-label="Navigation principale">
            {NAVIGATION.map((item, i) => (
              <div
                key={item.label}
                className={`mainnav-item ${openIndex === i ? 'is-open' : ''}`}
                onMouseEnter={() => openPanel(item.columns ? i : null)}
              >
                <NavLink
                  to={item.to}
                  prefetch="intent"
                  className={`mainnav-link ${item.accent ? 'is-accent' : ''}`}
                  onFocus={() => openPanel(item.columns ? i : null)}
                  end
                >
                  {item.label}
                </NavLink>
              </div>
            ))}
          </nav>

          <div className="header-actions">
            <SearchToggle />
            <WishlistLink />
            <Link
              to="/account"
              className="icon-btn hide-sm"
              aria-label="Mon compte"
            >
              <IconUser />
            </Link>
            <CartToggle cart={cart} />
          </div>
        </div>

        {NAVIGATION.map((item, i) =>
          item.kind === 'brands' ? (
            <BrandMegaPanel
              key={item.label}
              open={openIndex === i}
              onClose={() => setOpenIndex(null)}
              onEnter={() => openPanel(i)}
              menuImages={menuImages}
            />
          ) : item.columns ? (
            <MegaPanel
              key={item.label}
              item={item}
              open={openIndex === i}
              onClose={() => setOpenIndex(null)}
              onEnter={() => openPanel(i)}
              menuImages={menuImages}
            />
          ) : null,
        )}
      </header>
      <div
        className={`mega-scrim ${openIndex !== null ? 'is-open' : ''}`}
        onMouseEnter={() => setOpenIndex(null)}
        aria-hidden
      />
    </div>
  );
}

function BrandMegaPanel({
  open,
  onClose,
  onEnter,
  menuImages,
}: {
  open: boolean;
  onClose: () => void;
  onEnter: () => void;
  menuImages: Promise<MenuImages>;
}) {
  const {brands: BRANDS, isLive} = useLive();
  const [active, setActive] = useState(BRANDS[0]?.handle ?? '');
  const brand = BRANDS.find((b) => b.handle === active) ?? BRANDS[0];
  if (!brand) return null;
  const links = brandLinks(brand.handle).filter((l) => isLive(l.to));
  return (
    <div
      className={`mega mega--brands ${open ? 'is-open' : ''}`}
      aria-hidden={!open}
      onMouseEnter={onEnter}
    >
      <div className="bmega">
        <div className="bmega-grid-wrap">
          <div className="bmega-head">
            <p className="mega-title">Nos marques</p>
            <Link
              to="/marques"
              className="link-arrow"
              onClick={onClose}
              tabIndex={open ? 0 : -1}
            >
              Toutes les marques <IconArrow width={16} height={16} />
            </Link>
          </div>
          <ul className="bmega-grid" role="list">
            {BRANDS.map((b) => (
              <li key={b.handle}>
                <Link
                  to={`/collections/${b.handle}`}
                  className={`bmega-tile ${b.handle === brand.handle ? 'is-active' : ''}`}
                  onMouseEnter={() => setActive(b.handle)}
                  onFocus={() => setActive(b.handle)}
                  onClick={onClose}
                  tabIndex={open ? 0 : -1}
                  aria-label={b.name}
                >
                  {b.logo ? (
                    <img
                      src={b.logo}
                      alt=""
                      loading="lazy"
                      className="bmega-logo"
                    />
                  ) : (
                    <span className="bmega-word">{b.name}</span>
                  )}
                  <span className="bmega-name">{b.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="bmega-preview" aria-live="polite">
          <Link
            to={`/collections/${brand.handle}`}
            className="bmega-visual"
            onClick={onClose}
            tabIndex={open ? 0 : -1}
          >
            <Suspense fallback={null}>
              <Await resolve={menuImages}>
                {(imgs) =>
                  imgs[brand.handle] ? (
                    <SmartImage
                      key={brand.handle}
                      data={imgs[brand.handle]}
                      alt=""
                      className="bmega-visual-img"
                      sizes="380px"
                      loading="lazy"
                    />
                  ) : (
                    <span className="bmega-visual-empty">
                      {brand.logo ? (
                        <img src={brand.logo} alt="" />
                      ) : (
                        brand.name
                      )}
                    </span>
                  )
                }
              </Await>
            </Suspense>
            <span className="bmega-visual-cta">
              Voir {brand.name} <IconArrow width={16} height={16} />
            </span>
          </Link>
          <div className="bmega-info">
            <p className="bmega-info-name">{brand.name}</p>
            {brand.tagline ? (
              <p className="bmega-info-tag">{brand.tagline}</p>
            ) : null}
            <ul className="bmega-links">
              {links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} onClick={onClose} tabIndex={open ? 0 : -1}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function MegaPanel({
  item,
  open,
  onClose,
  onEnter,
  menuImages,
}: {
  item: NavItem;
  open: boolean;
  onClose: () => void;
  onEnter: () => void;
  menuImages: Promise<MenuImages>;
}) {
  const features = [item.feature, item.feature2].filter(
    Boolean,
  ) as NavFeature[];
  return (
    <div
      className={`mega ${open ? 'is-open' : ''}`}
      aria-hidden={!open}
      onMouseEnter={onEnter}
    >
      <div className="mega-inner">
        <div className="mega-cols">
          {item.columns?.map((col, ci) => (
            <div key={`${col.title}-${ci}`} className="mega-col">
              <p className="mega-title">{col.title}</p>
              <ul>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      prefetch="intent"
                      onClick={onClose}
                      tabIndex={open ? 0 : -1}
                    >
                      {link.label}
                      {link.badge ? (
                        <em className="tag">{link.badge}</em>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="mega-col mega-col--all">
            <Link
              to={item.to}
              className="link-arrow"
              onClick={onClose}
              tabIndex={open ? 0 : -1}
            >
              Tout {item.label.toLowerCase()}{' '}
              <IconArrow width={16} height={16} />
            </Link>
          </div>
        </div>
        <div className={`mega-features mega-features--${features.length}`}>
          {features.map((f) => (
            <Link
              key={f.title}
              to={f.to}
              className="mega-feature"
              onClick={onClose}
              tabIndex={open ? 0 : -1}
            >
              <Suspense fallback={null}>
                <Await resolve={menuImages}>
                  {(imgs) => {
                    const img = f.image
                      ? localPhoto(f.image)
                      : f.handle
                        ? imgs[f.handle]
                        : undefined;
                    return img ? (
                      <SmartImage
                        data={img}
                        alt=""
                        className="mega-feature-img"
                        sizes="420px"
                        loading="lazy"
                      />
                    ) : null;
                  }}
                </Await>
              </Suspense>
              <span className="mega-feature-title">{f.title}</span>
              <span className="mega-feature-copy">{f.copy}</span>
              <span className="mega-feature-cta">
                Explorer <IconArrow width={16} height={16} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnnouncementBar() {
  const waLink = useWhatsAppLink();
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setIndex((i) => (i + 1) % ANNOUNCEMENTS.length),
      4200,
    );
    return () => clearInterval(t);
  }, []);
  return (
    <div className="announce" role="region" aria-label="Annonces">
      <div className="announce-inner">
        <div className="announce-side hide-md">
          <a {...waLink} target="_blank" rel="noreferrer">
            <IconWhatsApp width={14} height={14} /> WhatsApp
          </a>
        </div>
        <div className="announce-track">
          {ANNOUNCEMENTS.map((msg, i) => (
            <p
              key={msg}
              className={`announce-msg ${i === index ? 'is-active' : ''}`}
              aria-hidden={i !== index}
            >
              {msg}
            </p>
          ))}
        </div>
        <div className="announce-side announce-side--right hide-md">
          <Link to="/avis">Avis clients</Link>
          <Link to="/pages/faq">Aide</Link>
          <Link to="/suivi">Suivre ma commande</Link>
        </div>
      </div>
    </div>
  );
}

function MobileToggle() {
  const {open} = useAside();
  return (
    <button
      className="icon-btn show-md"
      onClick={() => open('mobile')}
      aria-label="Ouvrir le menu"
    >
      <IconMenu />
    </button>
  );
}

function SearchToggle() {
  const {open} = useAside();
  return (
    <button
      className="search-pill"
      onClick={() => open('search')}
      aria-label="Rechercher"
    >
      <IconSearch />
      <span className="hide-sm">Rechercher</span>
    </button>
  );
}

function WishlistLink() {
  const {count} = useWishlist();
  return (
    <Link
      to="/wishlist"
      className="icon-btn hide-sm"
      aria-label={`Wishlist, ${count} article(s)`}
    >
      <IconHeart filled={count > 0} />
      {count ? <span className="cart-count">{count}</span> : null}
    </Link>
  );
}

function CartBadge({count}: {count: number | null}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();
  return (
    <button
      className="icon-btn cart-btn"
      aria-label={`Panier, ${count ?? 0} article(s)`}
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        });
      }}
    >
      <IconBag />
      {count ? <span className="cart-count">{count}</span> : null}
    </button>
  );
}

function CartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={null} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}
