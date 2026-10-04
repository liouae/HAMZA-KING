import {Await, Link, useRouteLoaderData} from 'react-router';
import {SmartImage} from '~/components/SmartImage';
import {Suspense, useMemo, useState} from 'react';
import {Image} from '@shopify/hydrogen';
import type {Route} from './+types/marques';
import type {RootLoader} from '~/root';
import type {MenuImages} from '~/components/Header';
import {BRAND, BRANDS} from '~/lib/config';
import {brandLinks} from '~/lib/navigation';
import {IconArrow, IconSearch} from '~/components/Icons';

export const meta: Route.MetaFunction = () => [
  {title: `Toutes les marques | ${BRAND.name}`},
  {
    name: 'description',
    content:
      'Nike, Jordan, Adidas, New Balance, Asics, Puma, On, Hoka, Converse, Vans : toutes les marques disponibles au Maroc.',
  },
];

export default function BrandsPage() {
  const root = useRouteLoaderData<RootLoader>('root');
  const menuImages = root?.menuImages ?? Promise.resolve({} as MenuImages);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? BRANDS.filter((b) => b.name.toLowerCase().includes(t)) : BRANDS;
  }, [q]);

  const alpha = useMemo(() => {
    const groups: Record<string, typeof BRANDS> = {};
    [...BRANDS]
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
      .forEach((b) => {
        const k = b.name[0].toUpperCase();
        (groups[k] ||= []).push(b);
      });
    return Object.entries(groups);
  }, []);

  return (
    <div className="brands-page">
      <header className="container page-head">
        <nav className="crumbs" aria-label="Fil d’Ariane">
          <Link to="/">Accueil</Link>
          <span>/</span>
          <span aria-current="page">Marques</span>
        </nav>
        <div className="brands-head-row">
          <div>
            <p className="eyebrow">{BRANDS.length} marques</p>
            <h1 className="display-xl">Les marques.</h1>
          </div>
          <label className="brands-search">
            <IconSearch />
            <span className="sr-only">Chercher une marque</span>
            <input
              type="search"
              placeholder="Chercher une marque…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoComplete="off"
            />
          </label>
        </div>
      </header>

      <section className="container" aria-label="Toutes les marques">
        {filtered.length ? (
          <ul className="brand-cards" role="list">
            {filtered.map((b, i) => (
              <li
                key={b.handle}
                data-reveal
                style={{['--d' as string]: `${(i % 4) * 60}ms`}}
              >
                <article className="brand-card">
                  <Link
                    to={`/collections/${b.handle}`}
                    className="brand-card-visual"
                    aria-label={b.name}
                  >
                    <Suspense fallback={null}>
                      <Await resolve={menuImages}>
                        {(imgs) =>
                          imgs[b.handle] ? (
                            <SmartImage
                              data={imgs[b.handle]}
                              alt=""
                              className="brand-card-img"
                              sizes="(min-width: 64em) 25vw, 50vw"
                              loading="lazy"
                            />
                          ) : null
                        }
                      </Await>
                    </Suspense>
                    <span className="brand-card-logo">
                      {b.logo ? (
                        <img src={b.logo} alt="" loading="lazy" />
                      ) : (
                        <span>{b.name}</span>
                      )}
                    </span>
                  </Link>
                  <div className="brand-card-body">
                    <h2 className="brand-card-name">
                      <Link to={`/collections/${b.handle}`}>{b.name}</Link>
                    </h2>
                    {b.tagline ? (
                      <p className="brand-card-tag">{b.tagline}</p>
                    ) : null}
                    <ul className="brand-card-links" role="list">
                      {brandLinks(b.handle)
                        .slice(1, 4)
                        .map((l) => (
                          <li key={l.label}>
                            <Link to={l.to} className="chip">
                              {l.label}
                            </Link>
                          </li>
                        ))}
                    </ul>
                    <Link
                      to={`/collections/${b.handle}`}
                      className="link-arrow"
                    >
                      Voir la collection <IconArrow width={16} height={16} />
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <div className="brands-empty">
            <p className="display-s">Aucune marque ne correspond à « {q} ».</p>
            <button className="btn btn--ghost" onClick={() => setQ('')}>
              Voir toutes les marques
            </button>
          </div>
        )}
      </section>

      <section className="container brands-az" aria-labelledby="az-title">
        <h2 id="az-title" className="popular-title">
          De A à Z
        </h2>
        <div className="brands-az-grid">
          {alpha.map(([letter, list]) => (
            <div key={letter} className="brands-az-group">
              <span className="brands-az-letter">{letter}</span>
              <ul role="list">
                {list.map((b) => (
                  <li key={b.handle}>
                    <Link to={`/collections/${b.handle}`}>{b.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
