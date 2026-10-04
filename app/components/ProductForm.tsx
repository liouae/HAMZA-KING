import {useState} from 'react';
import {Link, useNavigate} from 'react-router';
import {type MappedProductOptions} from '@shopify/hydrogen';
import type {
  Maybe,
  ProductOptionValueSwatch,
} from '@shopify/hydrogen/storefront-api-types';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';
import {IconRuler, IconWhatsApp} from './Icons';
import {SizeGuide} from './SizeGuide';
import {isColorOption, isSizeOption} from '~/lib/config';
import {useWhatsAppLink, useWhatsAppTopic, type WaTopic} from '~/lib/whatsapp';
import {formatMoney} from './Price';
import {trackLead} from './MetaPixel';
import type {ProductFragment} from 'storefrontapi.generated';

export function ProductForm({
  productOptions,
  selectedVariant,
  productTitle,
  fitNote,
  stockMessage,
  colorImages = {},
}: {
  productOptions: MappedProductOptions[];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  productTitle: string;
  fitNote?: string;
  stockMessage?: string;
  /** Colour name → photo for the swatch tiles. */
  colorImages?: Record<string, string>;
}) {
  const navigate = useNavigate();
  const {open} = useAside();
  const [guideOpen, setGuideOpen] = useState(false);
  const [sizeTouched, setSizeTouched] = useState(false);
  const [nudge, setNudge] = useState(false);
  const sizeOption = productOptions.find((o) => isSizeOption(o.name));
  const needsSize = Boolean(
    sizeOption && sizeOption.optionValues.length > 1 && !sizeTouched,
  );
  const available = Boolean(selectedVariant?.availableForSale);

  // Tell every WhatsApp button on the page which pair, colour and size the
  // visitor is looking at (size only once they actually picked one).
  const opts = selectedVariant?.selectedOptions ?? [];
  const color = opts.find((o) => isColorOption(o.name))?.value;
  const sizeValue = opts.find((o) => isSizeOption(o.name))?.value;
  const topic: WaTopic = {
    kind: 'product',
    title: productTitle,
    color,
    size:
      sizeValue && (!needsSize || sizeTouched) && sizeValue !== 'Default Title'
        ? `EU ${sizeValue}`
        : undefined,
    price: selectedVariant?.price ? formatMoney(selectedVariant.price) : '',
  };
  useWhatsAppTopic(topic);
  const orderLink = useWhatsAppLink('order', topic);

  return (
    <div className="pdp-form">
      {productOptions.map((option) => {
        if (option.optionValues.length === 1) return null;
        const isSize = isSizeOption(option.name);
        const isColor = isColorOption(option.name);
        const current = option.optionValues.find((v) => v.selected)?.name;

        return (
          <fieldset
            className={`opt ${isSize ? 'opt--size' : ''} ${isColor ? 'opt--color' : ''} ${
              isSize && nudge ? 'is-nudged' : ''
            }`}
            key={option.name}
          >
            <legend className="opt-head">
              <span>
                {isSize ? 'Pointure (EU)' : isColor ? 'Coloris' : option.name}
                {isSize && !sizeTouched ? null : (
                  <strong className="opt-current"> — {current}</strong>
                )}
              </span>
              {isSize ? (
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setGuideOpen(true)}
                >
                  <IconRuler width={16} height={16} /> Guide des tailles
                </button>
              ) : null}
            </legend>
            <div className={`opt-grid ${isSize ? 'opt-grid--size' : ''}`}>
              {option.optionValues.map((value) => {
                const {
                  name,
                  handle,
                  variantUriQuery,
                  selected,
                  available,
                  exists,
                  isDifferentProduct,
                  swatch,
                } = value;
                const showSelected = selected && (!isSize || sizeTouched);
                const cls = `opt-item ${showSelected ? 'is-selected' : ''} ${
                  !available ? 'is-out' : ''
                } ${isColor ? 'opt-item--swatch' : ''}`;

                if (isDifferentProduct) {
                  return (
                    <Link
                      className={cls}
                      key={option.name + name}
                      prefetch="intent"
                      preventScrollReset
                      replace
                      to={`/products/${handle}?${variantUriQuery}`}
                      title={name}
                    >
                      <OptionSwatch
                        swatch={swatch}
                        name={name}
                        image={isColor ? colorImages[name] : undefined}
                        label={isColor ? name : undefined}
                      />
                    </Link>
                  );
                }
                return (
                  <button
                    type="button"
                    className={cls}
                    key={option.name + name}
                    disabled={!exists}
                    title={available ? name : `${name} — épuisé`}
                    aria-pressed={showSelected}
                    onClick={() => {
                      if (isSize) {
                        setSizeTouched(true);
                        setNudge(false);
                      }
                      if (!selected) {
                        void navigate(`?${variantUriQuery}`, {
                          replace: true,
                          preventScrollReset: true,
                        });
                      }
                    }}
                  >
                    <OptionSwatch
                      swatch={swatch}
                      name={name}
                      image={isColor ? colorImages[name] : undefined}
                      label={isColor ? name : undefined}
                    />
                  </button>
                );
              })}
            </div>
            {isSize && fitNote ? <p className="opt-fit">{fitNote}</p> : null}
            {isSize && nudge ? (
              <p className="opt-nudge">Choisis ta pointure pour continuer.</p>
            ) : null}
          </fieldset>
        );
      })}

      {stockMessage ? (
        <p
          className={`stock-msg ${selectedVariant?.availableForSale ? 'is-low' : 'is-out'}`}
        >
          {stockMessage}
        </p>
      ) : null}
      <div className="pdp-buy">
        {needsSize ? (
          <button
            type="button"
            className="btn btn--block btn--xl"
            onClick={() => setNudge(true)}
          >
            Choisir une pointure
          </button>
        ) : (
          <AddToCartButton
            disabled={!selectedVariant || !available}
            onClick={() => open('cart')}
            className="btn btn--block btn--xl"
            lines={
              selectedVariant
                ? [
                    {
                      merchandiseId: selectedVariant.id,
                      quantity: 1,
                      selectedVariant,
                    },
                  ]
                : []
            }
          >
            {available ? 'Ajouter au panier' : 'Épuisé'}
          </AddToCartButton>
        )}
        <a
          className="btn btn--block btn--wa"
          href={orderLink.href}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => {
            orderLink.onClick(e);
            trackLead({
              content_name: productTitle,
              value: Number(selectedVariant?.price?.amount ?? 0),
              currency: selectedVariant?.price?.currencyCode ?? 'MAD',
            });
          }}
        >
          <IconWhatsApp /> Commander sur WhatsApp
        </a>
      </div>

      <SizeGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}

function OptionSwatch({
  swatch,
  name,
  image: photo,
  label,
}: {
  swatch?: Maybe<ProductOptionValueSwatch> | undefined;
  name: string;
  image?: string;
  label?: string;
}) {
  const image = photo || swatch?.image?.previewImage?.url;
  const color = swatch?.color;
  if (!image && !color) return <span className="opt-text">{name}</span>;
  return (
    <>
      <span
        aria-label={name}
        className="opt-swatch"
        style={{backgroundColor: color || undefined}}
      >
        {image ? (
          <img
            src={sized(image, 240)}
            alt={name}
            loading="lazy"
            decoding="async"
          />
        ) : null}
      </span>
      {label ? <span className="opt-swatch-label">{label}</span> : null}
    </>
  );
}

function sized(url: string, width: number) {
  if (!url.includes('cdn.shopify.com')) return url;
  return `${url}${url.includes('?') ? '&' : '?'}width=${width}`;
}
