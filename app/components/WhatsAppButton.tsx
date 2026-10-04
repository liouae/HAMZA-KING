import {useEffect, useState} from 'react';
import {useLocation} from 'react-router';
import {WHATSAPP_DISPLAY, whatsappLink} from '~/lib/config';
import {IconWhatsApp} from './Icons';

/**
 * Floating WhatsApp contact. On the homepage it opens as a labelled card and
 * folds into a round button once the visitor scrolls; elsewhere it stays
 * round so it never covers buy buttons. Hover unfolds it.
 */
export function WhatsAppFloat() {
  const {pathname} = useLocation();
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 320);
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const compact = !isHome || scrolled;

  return (
    <a
      className={`wa-float ${compact ? 'is-compact' : ''}`}
      href={whatsappLink('Salam ! J’ai une question sur une paire.')}
      target="_blank"
      rel="noreferrer"
      aria-label={`Nous écrire sur WhatsApp (${WHATSAPP_DISPLAY})`}
    >
      <span className="wa-float-icon" aria-hidden>
        <IconWhatsApp width={22} height={22} />
        <span className="wa-float-dot" />
      </span>
      <span className="wa-float-text" aria-hidden>
        <strong>Une question ?</strong>
        <span>Conseil pointure · Réponse rapide</span>
      </span>
    </a>
  );
}
