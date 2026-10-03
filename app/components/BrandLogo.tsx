import {BRAND} from '~/lib/config';

/**
 * HAMZA KING logo system. Files live in /public/brand/ in black and white.
 *
 * - lockup:          HK mark + stacked wordmark  → header, mobile menu
 * - hk:              HK monogram only             → small marks, footer bar, icons
 * - wordmark:        stacked "HAMZA KING"         → footer signature
 * - crown-wordmark:  crown + italic wordmark      → error page, about, social image
 * - crown:           crown only                   → empty states, small accents
 */
export type LogoVariant =
  'lockup' | 'hk' | 'wordmark' | 'crown-wordmark' | 'crown';

const FILES: Record<LogoVariant, {file: string; ratio: number}> = {
  lockup: {file: 'hk-lockup', ratio: 3.559},
  hk: {file: 'hk', ratio: 1.282},
  wordmark: {file: 'wordmark', ratio: 3.0},
  'crown-wordmark': {file: 'crown-wordmark', ratio: 4.464},
  crown: {file: 'crown', ratio: 1.904},
};

export function BrandLogo({
  variant = 'lockup',
  tone = 'black',
  height = 28,
  className = '',
  decorative = false,
  eager = false,
}: {
  variant?: LogoVariant;
  tone?: 'black' | 'white';
  height?: number;
  className?: string;
  /** true when the logo sits next to visible brand text (alt="" then). */
  decorative?: boolean;
  eager?: boolean;
}) {
  const {file, ratio} = FILES[variant];
  return (
    <img
      src={`/brand/${file}-${tone}.png`}
      alt={decorative ? '' : BRAND.name}
      width={Math.round(height * ratio)}
      height={height}
      className={`brand-logo-img brand-logo-img--${variant} ${className}`}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
    />
  );
}
