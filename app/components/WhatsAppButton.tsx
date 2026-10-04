import {useEffect, useState} from 'react';
import {useLocation} from 'react-router';
import {WHATSAPP_DISPLAY} from '~/lib/config';
import {useWhatsAppLink, useWhatsAppTopicValue} from '~/lib/whatsapp';
import {IconWhatsApp} from './Icons';

/**
 * Floating WhatsApp contact. The message it opens is written for the page the
 * visitor is on (see ~/lib/whatsapp). On the homepage it opens as a labelled
 * card and folds into a round button on scroll; elsewhere it stays round so it
 * never covers buy buttons. Hover unfolds it.
 */
export function WhatsAppFloat() {
  const {pathname} = useLocation();
  const topic = useWhatsAppTopicValue();
  const waLink = useWhatsAppLink('question');
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 320);
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const compact = !isHome || scrolled;

  const [title, sub] =
    topic?.kind === 'product'
      ? ['Une question sur cette paire ?', 'Pointure, stock, livraison']
      : topic?.kind === 'cart'
        ? ['Commander sur WhatsApp', 'On confirme avec toi en direct']
        : topic?.kind === 'collection'
          ? ['Besoin d’un conseil ?', 'On t’aide à choisir']
          : ['Une question ?', 'Conseil pointure · Réponse rapide'];

  return (
    <a
      className={`wa-float ${compact ? 'is-compact' : ''}`}
      {...waLink}
      target="_blank"
      rel="noreferrer"
      aria-label={`${title} Écrire sur WhatsApp (${WHATSAPP_DISPLAY})`}
    >
      <span className="wa-float-icon" aria-hidden>
        <IconWhatsApp width={22} height={22} />
        <span className="wa-float-dot" />
      </span>
      <span className="wa-float-text" aria-hidden>
        <strong>{title}</strong>
        <span>{sub}</span>
      </span>
    </a>
  );
}
