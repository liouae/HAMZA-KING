import type {CSSProperties} from 'react';
import measuredFrames from './productPhotoFrames.json';

// Source-relative x, y, width, height, and source width/height ratio.
const frames: Record<string, number[] | null> = measuredFrames;

// These older gallery assets are close-ups without a descriptive filename.
const legacyCloseUps = new Set([
  'noir-07.jpg',
  'noir-08.jpg',
  'noir-blanc-07.jpg',
  'noir-blanc-08.jpg',
]);

// This historical filename describes a complete pair, not a cropped detail.
const completeSubjectExceptions = new Set([
  'adidas-campus-bad-bunny-noir-blanc-paire-detail.jpg',
]);

export function productPhotoStyle(
  url: string,
  canvasAspect = 1,
): CSSProperties | undefined {
  const key = url.split('/files/').pop()?.split('?')[0];
  // Detail photos are already composed crops: keep their entire frame filled.
  // Applying the complete-shoe safe area would create an inset rectangle.
  const isCloseUp =
    key &&
    !completeSubjectExceptions.has(key) &&
    (legacyCloseUps.has(key) ||
      /(?:^|[-_])(?:details?|zoom|lacets|gros[-_]plan|close[-_]up)(?:[-_.]|$)/i.test(key));
  if (isCloseUp) {
    return {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      maxWidth: 'none',
      maxHeight: 'none',
      objectFit: 'cover',
      objectPosition: 'center',
    };
  }
  const frame = key ? frames[key] : undefined;
  if (!frame || frame.length !== 5) return undefined;
  const [x, y, width, height, aspect] = frame;
  // The complete subject stays within an 88% × 78% safe area. Tall views
  // (top, rear, outsole) fit by height; lateral views share the same width.
  const scale = Math.min(
    0.88 / width,
    (0.78 * aspect) / (height * canvasAspect),
  );
  const percent = (value: number) => `${(value * 100).toFixed(4)}%`;
  return {
    position: 'absolute',
    width: percent(scale),
    height: 'auto',
    maxWidth: 'none',
    maxHeight: 'none',
    left: percent(0.5 - (x + width / 2) * scale),
    top: percent(0.5 - ((y + height / 2) * scale * canvasAspect) / aspect),
    aspectRatio: String(aspect),
  };
}
