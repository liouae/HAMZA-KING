import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {useLocation} from 'react-router';

/* =========================================================================
   Tiny persistent store (localStorage) with cross-tab sync.
   Safe on the server: the server snapshot is always the initial value.
   ========================================================================= */
function createLocalStore<T>(key: string, initial: T) {
  let cache: T = initial;
  let loaded = false;
  const listeners = new Set<() => void>();

  const read = (): T => {
    if (typeof window === 'undefined') return initial;
    if (!loaded) {
      try {
        const raw = window.localStorage.getItem(key);
        cache = raw ? (JSON.parse(raw) as T) : initial;
      } catch {
        cache = initial;
      }
      loaded = true;
    }
    return cache;
  };
  const write = (next: T) => {
    cache = next;
    loaded = true;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* private mode */
    }
    listeners.forEach((l) => l());
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        loaded = false;
        l();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(l);
      window.removeEventListener('storage', onStorage);
    };
  };
  return {read, write, subscribe, initial};
}

/* ---------- Wishlist ---------- */
export type WishItem = {
  handle: string;
  title: string;
  vendor?: string;
  image?: string;
  price?: {amount: string; currencyCode: string};
  addedAt: number;
};
const wishStore = createLocalStore<WishItem[]>('hk:wishlist', []);
const EMPTY: WishItem[] = [];

export function useWishlist() {
  const items = useSyncExternalStore(
    wishStore.subscribe,
    wishStore.read,
    () => EMPTY,
  );
  const has = useCallback(
    (handle: string) => items.some((i) => i.handle === handle),
    [items],
  );
  const toggle = useCallback((item: Omit<WishItem, 'addedAt'>) => {
    const cur = wishStore.read();
    const exists = cur.some((i) => i.handle === item.handle);
    wishStore.write(
      exists
        ? cur.filter((i) => i.handle !== item.handle)
        : [{...item, addedAt: Date.now()}, ...cur].slice(0, 60),
    );
    return !exists;
  }, []);
  const remove = useCallback((handle: string) => {
    wishStore.write(wishStore.read().filter((i) => i.handle !== handle));
  }, []);
  return {items, has, toggle, remove, count: items.length};
}

/* ---------- Recently viewed ---------- */
const recentStore = createLocalStore<string[]>('hk:recent', []);
export function useRecentlyViewed() {
  return useSyncExternalStore(
    recentStore.subscribe,
    recentStore.read,
    () => EMPTY as unknown as string[],
  );
}
export function pushRecentlyViewed(handle: string) {
  const cur = recentStore.read().filter((h) => h !== handle);
  recentStore.write([handle, ...cur].slice(0, 12));
}

/* ---------- Cookie consent ---------- */
export type Consent = 'unknown' | 'accepted' | 'refused';
const consentStore = createLocalStore<Consent>('hk:consent', 'unknown');
/** Synchronous read, for places that can't use hooks (analytics gate). */
export const hasTrackingConsent = () => consentStore.read() === 'accepted';

export function useConsent() {
  const consent = useSyncExternalStore(
    consentStore.subscribe,
    consentStore.read,
    () => 'unknown' as Consent,
  );
  return {consent, set: consentStore.write};
}

/* ---------- Recent searches ---------- */
const searchStore = createLocalStore<string[]>('hk:searches', []);
export function useRecentSearches() {
  const items = useSyncExternalStore(
    searchStore.subscribe,
    searchStore.read,
    () => EMPTY as unknown as string[],
  );
  const push = useCallback((term: string) => {
    const t = term.trim();
    if (!t) return;
    searchStore.write(
      [
        t,
        ...searchStore
          .read()
          .filter((x) => x.toLowerCase() !== t.toLowerCase()),
      ].slice(0, 6),
    );
  }, []);
  const clear = useCallback(() => searchStore.write([]), []);
  return {items, push, clear};
}

/* =========================================================================
   Toasts
   ========================================================================= */
type Toast = {
  id: number;
  title: string;
  copy?: string;
  image?: string;
  action?: {label: string; onClick: () => void};
};
type ToastCtx = {push: (t: Omit<Toast, 'id'>) => void};
const ToastContext = createContext<ToastCtx | null>(null);

export function ToastProvider({children}: {children: ReactNode}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++idRef.current;
    setToasts((cur) => [...cur.slice(-2), {...t, id}]);
    setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== id)), 3800);
  }, []);
  const value = useMemo(() => ({push}), [push]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            {t.image ? <img src={t.image} alt="" /> : null}
            <div className="toast-body">
              <p className="toast-title">{t.title}</p>
              {t.copy ? <p className="toast-copy">{t.copy}</p> : null}
            </div>
            {t.action ? (
              <button className="toast-action" onClick={t.action.onClick}>
                {t.action.label}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

/* =========================================================================
   Reveal-on-scroll: add data-reveal to any element; it gets .is-in when visible.
   Re-scans on route change so new pages animate too.
   ========================================================================= */
export function useRevealOnScroll() {
  const location = useLocation();
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const show = (el: Element) => el.classList.add('is-in');
    // Reduced motion: CSS already shows everything, nothing to do.
    if (reduce) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            show(e.target);
            io.unobserve(e.target);
          }
        }
      },
      {rootMargin: '0px 0px 0px 0px', threshold: 0},
    );
    const attach = (root: Document | HTMLElement) => {
      const els = root.querySelectorAll
        ? Array.from(
            root.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)'),
          )
        : [];
      if ((root as HTMLElement).matches?.('[data-reveal]:not(.is-in)'))
        els.push(root as HTMLElement);
      // Always go through the observer (async) so we never touch the DOM
      // before React has hydrated a streamed section.
      els.forEach((el) => io.observe(el));
    };
    attach(document);
    // Elements rendered later (deferred data, client-only content) are picked up here.
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === 1) setTimeout(() => attach(n as HTMLElement), 80);
        });
      }
    });
    mo.observe(document.body, {childList: true, subtree: true});
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [location.pathname, location.search]);
}

/* Smooth page transition: fade main on navigation */
export function usePageTransition() {
  const location = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const main = document.getElementById('main');
    if (!main) return;
    main.classList.remove('page-enter');
    void main.offsetWidth;
    main.classList.add('page-enter');
  }, [location.pathname]);
}
