import {whatsappLink} from '~/lib/config';
import {IconWhatsApp} from './Icons';

export function WhatsAppFloat() {
  return (
    <a
      className="wa-float"
      href={whatsappLink('Salam ! J’ai une question sur une paire.')}
      target="_blank"
      rel="noreferrer"
      aria-label="Nous écrire sur WhatsApp"
    >
      <IconWhatsApp />
      <span className="wa-float-label">Une question ?</span>
    </a>
  );
}
