import {Image} from '@shopify/hydrogen';

export type SmartImageData = {
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

/**
 * Renders a Shopify CDN image through Hydrogen's <Image> (responsive srcset),
 * and a local /public photo as a plain <img> using the "-800" variant we ship
 * next to every file in /public/home/ (see scripts in the README).
 */
export function SmartImage({
  data,
  alt = '',
  className,
  sizes,
  loading = 'lazy',
  aspectRatio,
  priority = false,
}: {
  data: SmartImageData;
  alt?: string;
  className?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  aspectRatio?: string;
  priority?: boolean;
}) {
  if (data.url.startsWith('/')) {
    const small = data.url.replace(/\.(webp|jpe?g|png)$/, '-800.$1');
    const hasVariant = small !== data.url && data.url.startsWith('/home/');
    return (
      <img
        src={data.url}
        srcSet={
          hasVariant
            ? `${small} 800w, ${data.url} ${data.width ?? 1600}w`
            : undefined
        }
        sizes={hasVariant ? sizes : undefined}
        alt={alt || data.altText || ''}
        width={data.width ?? undefined}
        height={data.height ?? undefined}
        className={className}
        loading={priority ? 'eager' : loading}
        decoding="async"
        {...(priority ? {fetchPriority: 'high' as const} : {})}
        style={aspectRatio ? {aspectRatio} : undefined}
      />
    );
  }
  return (
    <Image
      data={data}
      alt={alt}
      className={className}
      sizes={sizes}
      loading={priority ? 'eager' : loading}
      aspectRatio={aspectRatio}
    />
  );
}
