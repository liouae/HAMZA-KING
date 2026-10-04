import type {Benefit} from '~/lib/content';

type ShowcaseImage = {url: string; altText?: string | null};

/**
 * Editorial "feature" block, product page.
 * Left: name, story, reference and a short spec table.
 * Right: the product photo split into three panels, each captioned with one
 * benefit (from the `custom.benefits` metafield or the category defaults).
 */
export function ProductShowcase({
  title,
  intro,
  reference,
  specs,
  benefits,
  image,
}: {
  title: string;
  intro: string;
  reference?: string;
  specs: {label: string; value: string}[];
  benefits: Benefit[];
  image?: ShowcaseImage | null;
}) {
  const panels = benefits.slice(0, 3);
  if (!image || panels.length === 0) return null;

  return (
    <section className="showcase" aria-labelledby="showcase-title" data-reveal>
      <div className="showcase-inner">
        <div className="showcase-copy">
          <h2 id="showcase-title" className="showcase-title">
            {title}
          </h2>
          {intro ? <p className="showcase-intro">{intro}</p> : null}
          {reference ? (
            <p className="showcase-ref">Article réf. {reference}</p>
          ) : null}
          {specs.length ? (
            <dl className="showcase-specs">
              {specs.map((s) => (
                <div key={s.label}>
                  <dt>{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        <div className="showcase-visual">
          <div
            className={`showcase-panels showcase-panels--${panels.length}`}
            aria-hidden
          >
            <img
              src={withWidth(image.url, 1800)}
              alt=""
              loading="lazy"
              decoding="async"
            />
            {panels.slice(1).map((_, i) => (
              <span
                key={i}
                className="showcase-gap"
                style={{left: `${((i + 1) * 100) / panels.length}%`}}
              />
            ))}
          </div>
          <ul
            className={`showcase-features showcase-features--${panels.length}`}
          >
            {panels.map((b) => (
              <li key={b.title}>
                <h3>{b.title}</h3>
                <p>{b.copy}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** Ask the Shopify CDN for a sized image (no-op for other URLs). */
function withWidth(url: string, width: number) {
  if (!url.includes('cdn.shopify.com')) return url;
  return `${url}${url.includes('?') ? '&' : '?'}width=${width}`;
}
