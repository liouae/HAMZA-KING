import {useState} from 'react';
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
} from 'react-router';
import type {Route} from './+types/avis';
import {
  ReviewCard,
  ReviewSummary,
  Stars,
  reviewStats,
} from '~/components/ProductReviews';
import {TrustpilotBox, reviewPlatforms} from '~/components/Trustpilot';
import {IconCheck, IconStar, IconWhatsApp} from '~/components/Icons';
import {BRAND, SOCIALS, whatsappLink} from '~/lib/config';
import {SITE} from '~/lib/content';
import {loadStoreReviews} from '~/lib/reviews';
import {seoMeta} from '~/lib/seo';
import {adminCreds, adminGraphql} from '~/lib/admin.server';

export const meta: Route.MetaFunction = ({data, matches, location}) => {
  const s = data?.stats;
  return seoMeta({
    matches,
    location,
    path: '/avis',
    title: 'Avis clients — livraisons, pointures, service',
    description: s?.count
      ? `${s.average.toFixed(1).replace('.', ',')}/5 sur ${s.count} avis de clients ${BRAND.name} au Maroc : livraison, pointures, paires reçues.`
      : `Les avis des clients ${BRAND.name} : livraison, pointures, paires reçues. Commandé chez nous ? Laisse ton avis.`,
  });
};

export async function loader({context, request}: Route.LoaderArgs) {
  const url = new URL(request.url);
  const [reviews, productsData] = await Promise.all([
    loadStoreReviews(context.storefront),
    context.storefront
      .query(REVIEW_PRODUCTS_QUERY, {cache: context.storefront.CacheShort()})
      .catch(() => null),
  ]);
  return {
    reviews,
    stats: reviewStats(reviews),
    products: (productsData?.products.nodes ?? []).map((p) => ({
      handle: p.handle,
      title: p.title,
    })),
    preset: {
      product: url.searchParams.get('produit') ?? '',
      order: url.searchParams.get('commande') ?? '',
    },
    canSave: Boolean(adminCreds(context.env)),
  };
}

type ActionResult =
  | {ok: true; saved: boolean; verified: boolean; whatsapp: string}
  | {ok: false; error: string};

const clean = (v: FormDataEntryValue | null, max: number) =>
  String(v ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
const digits = (v: string) => v.replace(/\D/g, '').slice(-9);

export async function action({
  request,
  context,
}: Route.ActionArgs): Promise<ActionResult> {
  const f = await request.formData();
  // Honeypot: real visitors never see this field.
  if (clean(f.get('website'), 100)) {
    return {ok: true, saved: false, verified: false, whatsapp: ''};
  }
  const author = clean(f.get('author'), 60);
  const city = clean(f.get('city'), 40);
  const title = clean(f.get('title'), 80);
  const body = String(f.get('body') ?? '')
    .trim()
    .slice(0, 1500);
  const size = clean(f.get('size'), 8);
  const productHandle = clean(f.get('product'), 120);
  const order = clean(f.get('order'), 20).replace(/^#/, '');
  const phone = clean(f.get('phone'), 20);
  const rating = Math.round(Number(f.get('rating')));

  if (author.length < 2) return {ok: false, error: 'Indique ton prénom.'};
  if (!(rating >= 1 && rating <= 5))
    return {ok: false, error: 'Choisis une note de 1 à 5 étoiles.'};
  if (body.length < 10)
    return {ok: false, error: 'Ton avis doit faire au moins 10 caractères.'};

  const productTitle =
    productHandle &&
    (
      await context.storefront
        .query(REVIEW_PRODUCT_QUERY, {variables: {handle: productHandle}})
        .catch(() => null)
    )?.product;

  // A WhatsApp copy, so the team sees the review (and the customer can add a photo).
  const whatsapp = whatsappLink(
    [
      `Salam ${BRAND.name} 👋`,
      'Je viens de laisser un avis sur le site :',
      '',
      `${'⭐'.repeat(rating)} (${rating}/5)`,
      productTitle ? `👟 ${productTitle.title}` : '',
      order ? `🧾 Commande #${order}` : '',
      '',
      body,
      '',
      `— ${author}${city ? `, ${city}` : ''}`,
      '',
      '📸 Je vous envoie aussi une photo de ma paire :',
    ]
      .filter((l, i, a) => l !== '' || a[i - 1] !== '')
      .join('\n'),
  );

  const creds = adminCreds(context.env);
  if (!creds) return {ok: true, saved: false, verified: false, whatsapp};

  try {
    // "Achat vérifié": the order number exists and the phone matches it.
    let verified = false;
    let productId = productTitle ? productTitle.id : '';
    if (order && digits(phone).length === 9) {
      const data = await adminGraphql<{
        orders: {
          nodes: {
            phone: string | null;
            shippingAddress: {phone: string | null} | null;
            billingAddress: {phone: string | null} | null;
            lineItems: {nodes: {product: {id: string} | null}[]};
          }[];
        };
      }>(creds, ORDER_QUERY, {q: `name:#${order}`});
      const o = data.orders.nodes[0];
      if (o) {
        const phones = [
          o.phone,
          o.shippingAddress?.phone,
          o.billingAddress?.phone,
        ]
          .filter(Boolean)
          .map((p) => digits(p!));
        verified = phones.includes(digits(phone));
        if (verified && !productId) {
          productId =
            o.lineItems.nodes.find((l) => l.product)?.product?.id ?? '';
        }
      }
    }

    const fields = [
      {key: 'author', value: author},
      {
        key: 'rating',
        value: JSON.stringify({
          value: `${rating}.0`,
          scale_min: '1.0',
          scale_max: '5.0',
        }),
      },
      {key: 'body', value: body},
      {key: 'date', value: new Date().toISOString().slice(0, 10)},
      {key: 'verified', value: String(verified)},
      {key: 'source', value: 'site'},
      city && {key: 'city', value: city},
      title && {key: 'title', value: title},
      size && {key: 'size', value: size},
      productId && {key: 'product', value: productId},
      order && {key: 'order_ref', value: `#${order}`},
    ].filter(Boolean);

    const res = await adminGraphql<{
      metaobjectCreate: {userErrors: {message: string}[]};
    }>(creds, CREATE_REVIEW_MUTATION, {
      m: {
        type: 'hk_review',
        capabilities: {publishable: {status: 'DRAFT'}},
        fields,
      },
    });
    if (res.metaobjectCreate.userErrors.length) {
      throw new Error(JSON.stringify(res.metaobjectCreate.userErrors));
    }
    return {ok: true, saved: true, verified, whatsapp};
  } catch (error) {
    console.error(error);
    // Never lose a review: fall back to WhatsApp.
    return {ok: true, saved: false, verified: false, whatsapp};
  }
}

export default function ReviewsPage() {
  const {reviews, stats, products, preset} = useLoaderData<typeof loader>();
  const [shown, setShown] = useState(12);
  const [onlyPhotos, setOnlyPhotos] = useState(false);
  const withPhotos = reviews.filter((r) => r.photo);
  const list = onlyPhotos ? withPhotos : reviews;
  const platforms = reviewPlatforms();
  const instagram = SOCIALS.find((s) => s.network === 'instagram');

  return (
    <div className="avis">
      <header className="avis-hero container">
        <p className="eyebrow">Avis clients</p>
        <h1 className="display-l">
          Ce que nos clients
          <br />
          disent de nous.
        </h1>
        <p className="avis-intro">
          Chaque avis publié ici vient d’un client qui a commandé chez{' '}
          {BRAND.name}. On ne modifie pas les avis, et on répond à chacun, y
          compris quand quelque chose ne s’est pas bien passé.
        </p>
        {stats.count ? (
          <a href="#liste" className="avis-score">
            <Stars value={stats.average} size={20} />
            <strong>{stats.average.toFixed(1).replace('.', ',')}/5</strong>
            <span>{stats.count} avis</span>
          </a>
        ) : null}
        <div className="avis-platforms">
          <TrustpilotBox height={24} />
          {platforms
            .filter((p) => p.name !== 'Trustpilot')
            .map((p) => (
              <a
                key={p.name}
                className="btn btn--ghost btn--sm"
                href={p.url}
                target="_blank"
                rel="noreferrer"
              >
                {p.cta}
              </a>
            ))}
          {instagram ? (
            <a
              className="btn btn--ghost btn--sm"
              href={instagram.url}
              target="_blank"
              rel="noreferrer"
            >
              Nos livraisons sur Instagram
            </a>
          ) : null}
          <a className="btn btn--sm" href="#ecrire">
            Laisser un avis
          </a>
        </div>
      </header>

      <section className="container" aria-label="Comment on gère les avis">
        <div className="avis-how">
          <div>
            <IconCheck width={18} height={18} />
            <h2>Achat vérifié</h2>
            <p>
              Le badge apparaît quand le numéro de commande et le téléphone
              correspondent à une vraie commande livrée par nos soins.
            </p>
          </div>
          <div>
            <IconStar width={18} height={18} />
            <h2>Tous les avis comptent</h2>
            <p>
              On publie les avis tels qu’ils sont écrits, bons ou moins bons.
              Seuls les messages insultants ou hors sujet sont refusés.
            </p>
          </div>
          <div>
            <IconWhatsApp width={18} height={18} />
            <h2>On répond à chacun</h2>
            <p>
              Un souci de pointure, de livraison ? On le règle sur WhatsApp et
              on répond publiquement sous l’avis.
            </p>
          </div>
        </div>
      </section>

      {withPhotos.length >= 3 ? (
        <section
          className="avis-photos container"
          aria-labelledby="photos-title"
        >
          <h2 id="photos-title" className="display-s">
            Reçues par nos clients.
          </h2>
          <div className="avis-photo-strip">
            {withPhotos.slice(0, 12).map((r) => (
              <figure key={r.id}>
                <img
                  src={`${r.photo!.url}${r.photo!.url.includes('?') ? '&' : '?'}width=600`}
                  alt={r.photo!.altText || `Paire reçue par ${r.author}`}
                  loading="lazy"
                  width={300}
                  height={300}
                />
                <figcaption>
                  {r.author}
                  {r.city ? ` · ${r.city}` : ''}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <section className="reviews container" id="liste">
        {stats.count === 0 ? (
          <div className="reviews-empty avis-empty">
            <h2 className="display-s">Les premiers avis arrivent.</h2>
            <p>
              Tu as reçu ta paire ? Ton avis sera l’un des premiers publiés ici,
              et il aide vraiment les prochains clients à choisir.
            </p>
            <a className="btn" href="#ecrire">
              Laisser le premier avis
            </a>
          </div>
        ) : (
          <div className="reviews-body">
            <ReviewSummary reviews={reviews} />
            <div className="reviews-list">
              {withPhotos.length ? (
                <div className="avis-filters">
                  <button
                    type="button"
                    className={`chip ${!onlyPhotos ? 'chip--active' : ''}`}
                    onClick={() => setOnlyPhotos(false)}
                  >
                    Tous ({reviews.length})
                  </button>
                  <button
                    type="button"
                    className={`chip ${onlyPhotos ? 'chip--active' : ''}`}
                    onClick={() => setOnlyPhotos(true)}
                  >
                    Avec photo ({withPhotos.length})
                  </button>
                </div>
              ) : null}
              {list.slice(0, shown).map((r) => (
                <ReviewCard key={r.id} review={r} showProduct />
              ))}
              {shown < list.length ? (
                <button
                  type="button"
                  className="btn btn--ghost reviews-more"
                  onClick={() => setShown((n) => n + 12)}
                >
                  Voir plus d’avis ({list.length - shown})
                </button>
              ) : null}
            </div>
          </div>
        )}
      </section>

      <ReviewForm products={products} preset={preset} />
    </div>
  );
}

function ReviewForm({
  products,
  preset,
}: {
  products: {handle: string; title: string}[];
  preset: {product: string; order: string};
}) {
  const result = useActionData<typeof action>();
  const nav = useNavigation();
  const busy = nav.state !== 'idle';
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  if (result?.ok) {
    return (
      <section className="avis-form-wrap container" id="ecrire">
        <div className="avis-thanks">
          <IconCheck width={28} height={28} />
          <h2 className="display-s">Merci pour ton avis !</h2>
          {result.saved ? (
            <p>
              Il sera publié après une rapide relecture
              {result.verified ? ', avec le badge « Achat vérifié »' : ''}.
              Envoie-nous une photo de ta paire sur WhatsApp, on l’ajoutera à
              ton avis.
            </p>
          ) : (
            <p>
              Dernière étape : envoie-le nous sur WhatsApp (avec une photo de ta
              paire si tu veux), on le publie après relecture.
            </p>
          )}
          {result.whatsapp ? (
            <a
              className="btn btn--lg btn--wa"
              href={result.whatsapp}
              target="_blank"
              rel="noreferrer"
            >
              <IconWhatsApp />{' '}
              {result.saved ? 'Envoyer ma photo' : 'Envoyer sur WhatsApp'}
            </a>
          ) : null}
          <Link to="/" className="link-arrow">
            Retour à la boutique
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      className="avis-form-wrap container"
      id="ecrire"
      aria-labelledby="ecrire-title"
    >
      <div className="avis-form-head">
        <p className="eyebrow">Tu as commandé chez nous ?</p>
        <h2 id="ecrire-title" className="display-s">
          Laisse ton avis.
        </h2>
        <p className="muted">
          2 minutes. Ton numéro de commande et ton téléphone servent uniquement
          à vérifier l’achat : ils ne sont jamais affichés.
        </p>
      </div>
      <Form method="post" className="contact-form avis-form" preventScrollReset>
        <fieldset className="span-2 avis-stars">
          <legend>Ta note</legend>
          <div onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} onMouseEnter={() => setHover(n)}>
                <input
                  type="radio"
                  name="rating"
                  value={n}
                  required
                  checked={rating === n}
                  onChange={() => setRating(n)}
                />
                <IconStar
                  width={30}
                  height={30}
                  filled={(hover || rating) >= n}
                />
                <span className="sr-only">
                  {n} étoile{n > 1 ? 's' : ''}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <label>
          <span>Prénom (et initiale)</span>
          <input
            name="author"
            required
            minLength={2}
            maxLength={60}
            autoComplete="given-name"
            placeholder="Yassine B."
          />
        </label>
        <label>
          <span>Ville</span>
          <input
            name="city"
            maxLength={40}
            autoComplete="address-level2"
            placeholder="Casablanca"
          />
        </label>
        <label>
          <span>Paire achetée</span>
          <select name="product" defaultValue={preset.product}>
            <option value="">— Avis sur la boutique —</option>
            {products.map((p) => (
              <option key={p.handle} value={p.handle}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Pointure reçue</span>
          <input
            name="size"
            maxLength={8}
            inputMode="decimal"
            placeholder="42"
          />
        </label>
        <label className="span-2">
          <span>Titre (optionnel)</span>
          <input
            name="title"
            maxLength={80}
            placeholder="Livrée en 24h, pointure parfaite"
          />
        </label>
        <label className="span-2">
          <span>Ton avis</span>
          <textarea
            name="body"
            rows={5}
            required
            minLength={10}
            maxLength={1500}
            placeholder="La paire, la pointure, la livraison, l’appel de confirmation…"
          />
        </label>
        <label>
          <span>N° de commande (pour « Achat vérifié »)</span>
          <input
            name="order"
            maxLength={20}
            defaultValue={preset.order}
            placeholder="1001"
          />
        </label>
        <label>
          <span>Téléphone utilisé pour la commande</span>
          <input
            name="phone"
            type="tel"
            maxLength={20}
            autoComplete="tel"
            placeholder="06 12 34 56 78"
          />
        </label>
        <label className="avis-hp" aria-hidden>
          <span>Site web</span>
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
        {result && !result.ok ? (
          <p className="form-error span-2" role="alert">
            {result.error}
          </p>
        ) : null}
        <button type="submit" className="btn btn--lg" disabled={busy}>
          {busy ? 'Envoi…' : 'Publier mon avis'}
        </button>
      </Form>
    </section>
  );
}

const REVIEW_PRODUCTS_QUERY = `#graphql
  query ReviewProducts($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    products(first: 100, sortKey: TITLE) {
      nodes {
        handle
        title
      }
    }
  }
` as const;

const REVIEW_PRODUCT_QUERY = `#graphql
  query ReviewProduct($handle: String!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      title
    }
  }
` as const;

const ORDER_QUERY = `
  query ReviewOrder($q: String!) {
    orders(first: 1, query: $q) {
      nodes {
        phone
        shippingAddress { phone }
        billingAddress { phone }
        lineItems(first: 10) { nodes { product { id } } }
      }
    }
  }
`;

const CREATE_REVIEW_MUTATION = `
  mutation CreateReview($m: MetaobjectCreateInput!) {
    metaobjectCreate(metaobject: $m) {
      metaobject { id }
      userErrors { field message code }
    }
  }
`;
