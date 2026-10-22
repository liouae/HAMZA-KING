import {Image} from '@shopify/hydrogen';
import {productPhotoStyle} from '~/lib/productPhoto';

type Photo = {
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

/** Frame the shoe itself rather than the source file's uneven empty margins. */
export function ProductPhoto({
  data,
  alt,
  className = '',
  sizes,
  loading = 'lazy',
  aspectRatio = 1,
}: {
  data: Photo;
  alt: string;
  className?: string;
  sizes?: string;
  loading?: 'eager' | 'lazy';
  aspectRatio?: number;
}) {
  return (
    <span className={`product-photo ${className}`} style={{aspectRatio}}>
      <Image
        data={data}
        alt={alt}
        sizes={sizes}
        loading={loading}
        style={productPhotoStyle(data.url, aspectRatio)}
      />
    </span>
  );
}
