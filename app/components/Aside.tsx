import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import {IconClose} from './Icons';

type AsideType = 'search' | 'cart' | 'mobile' | 'closed';
type AsideContextValue = {
  type: AsideType;
  open: (mode: AsideType) => void;
  close: () => void;
};

/**
 * Slide-in drawer with overlay. `side` controls which edge it enters from.
 */
export function Aside({
  children,
  heading,
  type,
  side = 'right',
  footer,
}: {
  children?: React.ReactNode;
  type: AsideType;
  heading: React.ReactNode;
  side?: 'left' | 'right' | 'top';
  footer?: React.ReactNode;
}) {
  const {type: activeType, close} = useAside();
  const expanded = type === activeType;
  const id = useId();

  useEffect(() => {
    if (!expanded) return;
    const controller = new AbortController();
    document.addEventListener(
      'keydown',
      (event: KeyboardEvent) => {
        if (event.key === 'Escape') close();
      },
      {signal: controller.signal},
    );
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      controller.abort();
      document.body.style.overflow = prev;
    };
  }, [close, expanded]);

  return (
    <div
      aria-modal
      aria-hidden={!expanded}
      className={`drawer drawer--${side} ${expanded ? 'is-open' : ''}`}
      role="dialog"
      aria-labelledby={id}
    >
      <button
        className="drawer-scrim"
        onClick={close}
        aria-label="Fermer"
        tabIndex={-1}
      />
      <aside className="drawer-panel">
        <header className="drawer-head">
          <h2 id={id} className="drawer-title">
            {heading}
          </h2>
          <button className="icon-btn" onClick={close} aria-label="Fermer">
            <IconClose />
          </button>
        </header>
        <div className="drawer-body">{children}</div>
        {footer ? <div className="drawer-foot">{footer}</div> : null}
      </aside>
    </div>
  );
}

const AsideContext = createContext<AsideContextValue | null>(null);

Aside.Provider = function AsideProvider({children}: {children: ReactNode}) {
  const [type, setType] = useState<AsideType>('closed');
  const close = useCallback(() => setType('closed'), []);
  const value = useMemo(() => ({type, open: setType, close}), [type, close]);
  return (
    <AsideContext.Provider value={value}>{children}</AsideContext.Provider>
  );
};

export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) {
    throw new Error('useAside must be used within an AsideProvider');
  }
  return aside;
}
