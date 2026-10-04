import {useState} from 'react';
import {IconStar, IconWhatsApp} from './Icons';
import {whatsappLink} from '~/lib/config';

export type Review = {
  id: string;
  author: string;
  city?: string;
  rating: number;
  title?: string;
  body: string;
  size?: string;
  date?: string;
  verified?: boolean;
};

type MetaobjectNode = {
  id: string;
  fields: {key: string; value?: string | null}[];
};

/** Turn `custom.reviews` metaobject references into plain reviews, newest first. */
export function parseReviews(nodes: MetaobjectNode[] | null | undefined) {
  const list: Review[] = (nodes ?? []).map((n) => {
    const f = (k: string) => n.fields.find((x) => x.key === k)?.value ?? '';
    let rating = 0;
    try {
      const raw = f('rating');
      const parsed = raw ? (JSON.parse(raw) as {value?: string} | number) : 0;
      rating = Number(typeof parsed === 'object' ? parsed.value : parsed);
    } catch {
      rating = Number(f('rating')) || 0;
    }
    return {
      id: n.id,
      author: f('author'),
      city: f('city') || undefined,
      rating: Math.max(0, Math.min(5, rating)),
      title: f('title') || undefined,
      body: f('body'),
      size: f('size') || undefined,
      date: f('date') || undefined,
      verified: f('verified') === 'true',
    };
  });
  return list
    .filter((r) => r.body && r.rating)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}

export function reviewStats(reviews: Review[]) {
  const count = reviews.length;
  const average = count
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / count
    : 0;
  const bars = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));
  return {count, average, bars};
}

export function Stars({value, size = 14}: {value: number; size?: number}) {
  return (
    <span className="stars" aria-label={`${value.toFixed(1)} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <IconStar
          key={i}
          width={size}
          height={size}
          filled={value >= i - 0.25}
        />
      ))}
    </span>
  );
}

const PAGE = 6;

export function ProductReviews({
  reviews,
  productTitle,
}: {
  reviews: Review[];
  productTitle: string;
}) {
  const [shown, setShown] = useState(PAGE);
  const {count, average, bars} = reviewStats(reviews);
  const askReview = whatsappLink(
    `Salam ! Je veux laisser un avis sur : ${productTitle}\nNote (1 à 5) : \nMon avis : `,
  );

  return (
    <section
      className="reviews container"
      id="avis"
      aria-labelledby="reviews-title"
      data-reveal
    >
      <div className="reviews-head">
        <div>
          <p className="eyebrow">Avis clients</p>
          <h2 id="reviews-title" className="display-s">
            Ce qu’en disent les clients.
          </h2>
        </div>
        <a
          className="btn btn--ghost"
          href={askReview}
          target="_blank"
          rel="noreferrer"
        >
          <IconWhatsApp /> Donner mon avis
        </a>
      </div>

      {count === 0 ? (
        <div className="reviews-empty">
          <p>
            Pas encore d’avis sur ce modèle. Tu l’as reçu ? Partage ton
            expérience, elle aide les autres à choisir.
          </p>
        </div>
      ) : (
        <div className="reviews-body">
          <aside className="reviews-summary">
            <p className="reviews-score">
              {average.toFixed(1).replace('.', ',')}
              <span>/5</span>
            </p>
            <Stars value={average} size={18} />
            <p className="reviews-count">
              {count} avis {count > 1 ? 'vérifiés' : 'vérifié'}
            </p>
            <ul className="reviews-bars">
              {bars.map((b) => (
                <li key={b.star}>
                  <span>{b.star}★</span>
                  <span className="reviews-bar" aria-hidden>
                    <span
                      style={{
                        width: `${count ? (b.count / count) * 100 : 0}%`,
                      }}
                    />
                  </span>
                  <span>{b.count}</span>
                </li>
              ))}
            </ul>
          </aside>

          <div className="reviews-list">
            {reviews.slice(0, shown).map((r) => (
              <article key={r.id} className="review">
                <header className="review-head">
                  <Stars value={r.rating} />
                  {r.date ? (
                    <time dateTime={r.date}>{formatDate(r.date)}</time>
                  ) : null}
                </header>
                {r.title ? <h3 className="review-title">{r.title}</h3> : null}
                <p className="review-body">{r.body}</p>
                <footer className="review-meta">
                  <strong>{r.author}</strong>
                  {r.city ? <span>{r.city}</span> : null}
                  {r.size ? <span>Pointure {r.size}</span> : null}
                  {r.verified ? (
                    <span className="review-verified">Achat vérifié</span>
                  ) : null}
                </footer>
              </article>
            ))}
            {shown < count ? (
              <button
                type="button"
                className="btn btn--ghost reviews-more"
                onClick={() => setShown((n) => n + PAGE)}
              >
                Voir plus d’avis ({count - shown})
              </button>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return iso;
  }
}
