import {useEffect} from 'react';
import {IconClose} from './Icons';

/** Generic sneaker conversion chart (EU / US / UK / cm). Adjust to your brands. */
const ROWS: [string, string, string, string, string][] = [
  ['36', '4', '5.5', '3.5', '22.5'],
  ['37', '5', '6.5', '4', '23.5'],
  ['38', '5.5', '7', '5', '24'],
  ['39', '6.5', '8', '6', '25'],
  ['40', '7', '8.5', '6', '25.5'],
  ['41', '8', '9.5', '7', '26'],
  ['42', '8.5', '10', '7.5', '26.5'],
  ['43', '9.5', '11', '8.5', '27.5'],
  ['44', '10', '11.5', '9', '28'],
  ['45', '11', '12.5', '10', '29'],
  ['46', '12', '13.5', '11', '30'],
];

export function SizeTable() {
  return (
    <table className="size-table">
      <thead>
        <tr>
          <th>EU</th>
          <th>US H</th>
          <th>US F</th>
          <th>UK</th>
          <th>CM</th>
        </tr>
      </thead>
      <tbody>
        {ROWS.map((r) => (
          <tr key={r[0]}>
            {r.map((c, i) => (
              <td key={i}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function SizeGuide({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div
      className={`drawer drawer--right ${open ? 'is-open' : ''}`}
      role="dialog"
      aria-modal
      aria-hidden={!open}
      aria-label="Guide des tailles"
    >
      <button
        className="drawer-scrim"
        onClick={onClose}
        aria-label="Fermer"
        tabIndex={-1}
      />
      <aside className="drawer-panel">
        <header className="drawer-head">
          <h2 className="drawer-title">Guide des tailles</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer">
            <IconClose />
          </button>
        </header>
        <div className="drawer-body size-guide">
          <p className="muted">
            Mesure ton pied du talon au plus long orteil, en fin de journée.
            Entre deux tailles, prends la plus grande.
          </p>
          <SizeTable />
          <p className="small muted">
            Les tailles peuvent varier légèrement selon la marque et le modèle.
            Un doute ? Écris-nous sur WhatsApp avec ta longueur de pied en cm.
          </p>
        </div>
      </aside>
    </div>
  );
}
