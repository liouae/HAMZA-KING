import homeImages from './homeImages.json';

const images: Record<string, {url: string; width: number}[]> = homeImages;

/** Shared by the picture and its preload so the browser downloads one image. */
export function editorialSrcSet(url: string): string | undefined {
  return images[url]?.map((image) => `${image.url} ${image.width}w`).join(', ');
}
