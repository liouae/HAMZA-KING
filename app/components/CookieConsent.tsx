import {useEffect, useState} from 'react';
import {Link} from 'react-router';
import {useConsent} from '~/lib/ui';

/**
 * Minimal consent bar (Moroccan law 09-08 / GDPR style).
 * Analytics & ads scripts (Meta Pixel) only load once accepted.
 */
export function CookieConsent() {
  const {consent, set} = useConsent();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || consent !== 'unknown') return null;

  return (
    <div className="consent" role="dialog" aria-label="Cookies" data-reveal>
      <div className="consent-inner">
        <div>
          <p className="consent-title">Votre confidentialité</p>
          <p className="consent-copy">
            Nous utilisons des cookies pour mesurer l’audience et personnaliser
            nos publicités. Les cookies strictement nécessaires au
            fonctionnement du site sont toujours actifs.{' '}
            <Link to="/policies/privacy-policy">En savoir plus</Link>
          </p>
        </div>
        <div className="consent-actions">
          <button className="btn btn--sm" onClick={() => set('accepted')}>
            Accepter
          </button>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => set('refused')}
          >
            Continuer sans accepter
          </button>
        </div>
      </div>
    </div>
  );
}
