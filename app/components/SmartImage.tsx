import {Image} from '@shopify/hydrogen';
import {editorialAssetUrl, editorialSrcSet} from '~/lib/responsiveImages';

export type SmartImageData = {
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

/**
 * Renders a Shopify CDN image through Hydrogen's <Image> (responsive srcset),
 * and local editorial photos with AVIF sources and the original WebP fallback.
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
    const avifSrcSet = editorialSrcSet(data.url);
    const image = (
      <img
        src={editorialAssetUrl(data.url)}
        srcSet={
          hasVariant
            ? `${editorialAssetUrl(small)} 800w, ${editorialAssetUrl(data.url)} ${data.width ?? 1600}w`
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
    return avifSrcSet ? (
      <picture className="editorial-picture">
        <source
          type="image/avif"
          srcSet={avifSrcSet}
          sizes={sizes ?? '100vw'}
        />
        {image}
      </picture>
    ) : (
      image
    );
  }
  return (
    <Image
      data={data}
      alt={alt}
      className={className}
      sizes={sizes}
      loading={priority ? 'eager' : loading}
      fetchPriority={priority ? 'high' : undefined}
      aspectRatio={aspectRatio}
    />
  );
}
