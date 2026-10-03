import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router';
import {ProductItem, type CardProduct} from './ProductItem';
import {IconArrow} from './Icons';

/** Horizontal, scroll-snapping product carousel with arrows + progress. */
export function ProductRail({
  eyebrow,
  title,
  to,
  products,
}: {
  eyebrow?: string;
  title: string;
  to?: string;
  products: CardProduct[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [edges, setEdges] = useState({start: true, end: false});

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollWidth - el.clientWidth;
      setProgress(max > 0 ? el.scrollLeft / max : 0);
      setEdges({start: el.scrollLeft < 4, end: el.scrollLeft > max - 4});
    };
    onScroll();
    el.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', onScroll);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({left: dir * el.clientWidth * 0.8, behavior: 'smooth'});
  };

  if (!products.length) return null;

  return (
    <section className="rail" aria-label={title}>
      <header className="section-head container">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2 className="display-m">{title}</h2>
        </div>
        <div className="rail-controls">
          {to ? (
            <Link to={to} className="link-arrow hide-sm">
              Tout voir <IconArrow width={16} height={16} />
            </Link>
          ) : null}
          <button
            className="round-btn"
            onClick={() => scroll(-1)}
            disabled={edges.start}
            aria-label="Précédent"
          >
            <IconArrow style={{transform: 'scaleX(-1)'}} />
          </button>
          <button
            className="round-btn"
            onClick={() => scroll(1)}
            disabled={edges.end}
            aria-label="Suivant"
          >
            <IconArrow />
          </button>
        </div>
      </header>
      <div className="rail-track" ref={ref}>
        {products.map((p, i) => (
          <div className="rail-cell" key={p.id}>
            <ProductItem product={p} loading={i < 4 ? 'eager' : 'lazy'} />
          </div>
        ))}
      </div>
      <div className="container">
        <div className="rail-progress" aria-hidden>
          <span style={{transform: `scaleX(${Math.max(0.12, progress)})`}} />
        </div>
      </div>
    </section>
  );
}
