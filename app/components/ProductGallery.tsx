import {useEffect, useRef, useState} from 'react';
import {Image} from '@shopify/hydrogen';
import {IconClose, IconPlus} from './Icons';

type Img = {
  id?: string | null;
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

/**
 * Desktop: editorial 2-column image grid (first image spans full width).
 * Mobile: swipeable, snapping carousel with counter.
 * Click any image to open a full-screen zoom viewer.
 */
export function ProductGallery({
  images,
  title,
}: {
  images: Img[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () =>
      setActive(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener('scroll', onScroll, {passive: true});
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (zoom === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoom(null);
      if (e.key === 'ArrowRight')
        setZoom((z) => (z === null ? z : (z + 1) % images.length));
      if (e.key === 'ArrowLeft')
        setZoom((z) =>
          z === null ? z : (z - 1 + images.length) % images.length,
        );
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [zoom, images.length]);

  if (!images.length) return <div className="gallery gallery--empty" />;

  return (
    <div className="gallery">
      <div className="gallery-track" ref={trackRef}>
        {images.map((img, i) => (
          <button
            key={img.id ?? img.url}
            className={`gallery-item ${i === 0 ? 'is-lead' : ''}`}
            onClick={() => setZoom(i)}
            aria-label={`Agrandir l’image ${i + 1}`}
          >
            <Image
              data={img}
              alt={img.altText || `${title} — vue ${i + 1}`}
              aspectRatio="1/1"
              sizes="(min-width: 64em) 30vw, 100vw"
              loading={i < 2 ? 'eager' : 'lazy'}
            />
            <span className="gallery-zoom" aria-hidden>
              <IconPlus width={16} height={16} />
            </span>
          </button>
        ))}
      </div>
      <div className="gallery-dots" aria-hidden>
        <span>
          {String(active + 1).padStart(2, '0')} /{' '}
          {String(images.length).padStart(2, '0')}
        </span>
        <div className="gallery-dots-bar">
          <span style={{width: `${((active + 1) / images.length) * 100}%`}} />
        </div>
      </div>

      {zoom !== null ? (
        <div className="lightbox" role="dialog" aria-modal aria-label="Zoom">
          <button
            className="lightbox-close icon-btn"
            onClick={() => setZoom(null)}
            aria-label="Fermer"
          >
            <IconClose />
          </button>
          <div
            className="lightbox-stage"
            onClick={() => setZoom(null)}
            role="presentation"
          >
            <Image
              data={images[zoom]}
              alt={images[zoom].altText || title}
              sizes="100vw"
              className="lightbox-img"
            />
          </div>
          <div className="lightbox-thumbs">
            {images.map((img, i) => (
              <button
                key={img.id ?? img.url}
                className={i === zoom ? 'is-active' : ''}
                onClick={() => setZoom(i)}
                aria-label={`Image ${i + 1}`}
              >
                <Image
                  data={img}
                  alt=""
                  width={72}
                  height={72}
                  aspectRatio="1/1"
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
