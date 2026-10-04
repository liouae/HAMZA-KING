import {useEffect, useRef} from 'react';
import {TRUST} from '~/lib/config';

declare global {
  interface Window {
    Trustpilot?: {loadFromElement: (el: HTMLElement, force?: boolean) => void};
  }
}

const SCRIPT =
  'https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js';

/**
 * Trustpilot TrustBox. Renders nothing until `TRUST.trustpilot.businessUnitId`
 * is set in config (a plain link is shown when only the URL is set).
 */
export function TrustpilotBox({
  height = 24,
  className,
}: {
  height?: number;
  className?: string;
}) {
  const tp = TRUST.trustpilot;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tp.businessUnitId || !ref.current) return;
    const el = ref.current;
    if (window.Trustpilot) {
      window.Trustpilot.loadFromElement(el, true);
      return;
    }
    if (!document.querySelector(`script[src="${SCRIPT}"]`)) {
      const s = document.createElement('script');
      s.src = SCRIPT;
      s.async = true;
      document.head.appendChild(s);
    }
  }, [tp.businessUnitId]);

  if (!tp.businessUnitId) {
    return tp.url ? (
      <a
        className={className ?? 'trust-link'}
        href={tp.url}
        target="_blank"
        rel="noreferrer"
      >
        Nos avis sur Trustpilot
      </a>
    ) : null;
  }

  return (
    <div
      ref={ref}
      className={`trustpilot-widget ${className ?? ''}`}
      data-locale="fr-FR"
      data-template-id={tp.templateId}
      data-businessunit-id={tp.businessUnitId}
      data-style-height={`${height}px`}
      data-style-width="100%"
      data-theme="light"
    >
      <a
        href={tp.url || 'https://fr.trustpilot.com'}
        target="_blank"
        rel="noreferrer"
      >
        Trustpilot
      </a>
    </div>
  );
}

/** External places where customers can read and leave reviews. */
export function reviewPlatforms() {
  return [
    TRUST.trustpilot.url
      ? {
          name: 'Trustpilot',
          url: TRUST.trustpilot.url,
          cta: 'Lire sur Trustpilot',
        }
      : null,
    TRUST.googleMapsUrl
      ? {name: 'Google', url: TRUST.googleMapsUrl, cta: 'Lire sur Google'}
      : null,
  ].filter(Boolean) as {name: string; url: string; cta: string}[];
}
