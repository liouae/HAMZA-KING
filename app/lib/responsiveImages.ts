import homeImages from './homeImages.json';

const images: Record<string, {url: string; width: number}[]> = homeImages;

/** Oxygen publishes public assets at Vite's base URL. Use that CDN directly
 * so the original AVIF is delivered without the storefront host's conversion. */
export function editorialAssetUrl(url: string): string {
  return url.startsWith('/')
    ? `${import.meta.env.BASE_URL.replace(/\/$/, '')}${url}`
    : url;
}

/** Shared by the picture and its preload so the browser downloads one image. */
export function editorialSrcSet(url: string): string | undefined {
  return images[url]
    ?.map((image) => `${editorialAssetUrl(image.url)} ${image.width}w`)
    .join(', ');
}
