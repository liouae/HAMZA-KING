import type {CSSProperties} from 'react';
import measuredFrames from './productPhotoFrames.json';

// Source-relative x, y, width, height, and source width/height ratio.
const frames: Record<string, number[] | null> = measuredFrames;

export function productPhotoStyle(url: string): CSSProperties | undefined {
  const key = url.split('/files/').pop()?.split('?')[0];
  const frame = key ? frames[key] : undefined;
  if (!frame || frame.length !== 5) return undefined;
  const [x, y, width, height, aspect] = frame;
  // The complete subject stays within an 88% × 78% safe area. Tall views
  // (top, rear, outsole) fit by height; lateral views share the same width.
  const scale = Math.min(0.88 / width, (0.78 * aspect) / height);
  const percent = (value: number) => `${(value * 100).toFixed(4)}%`;
  return {
    position: 'absolute',
    width: percent(scale),
    height: 'auto',
    maxWidth: 'none',
    maxHeight: 'none',
    left: percent(0.5 - (x + width / 2) * scale),
    top: percent(0.5 - ((y + height / 2) * scale) / aspect),
    aspectRatio: String(aspect),
  };
}
