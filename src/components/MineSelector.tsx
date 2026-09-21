import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Pickaxe } from 'lucide-react';
import { useSession } from '../state/SessionContext';
import type { Mine } from '../types';

const statusTone = (mine: Mine) => (mine.status === 'OPERATIONAL' ? 'safe' : mine.status === 'ADVISORY' ? 'critical' : 'warning');

/**
 * Reusable "CURRENT MINE" selector.
 *  - full   : label + full mine name (workspace headers)
 *  - compact: short name only (inside the rescue dashboard top bar)
 * Selection is stored in the session (and localStorage) so it persists across pages.
 */
export function MineSelector({ compact = false }: { compact?: boolean }) {
  const { mines, selectedMine, selectMine } = useSession();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onPointer); document.removeEventListener('keydown', onKey); };
  }, [open]);

  if (!selectedMine) return null;
  const canSwitch = mines.length > 1;
  const shortName = selectedMine.name.replace(' Underground Mine', '');

  return (
    <div className={`mine-select ${compact ? 'compact' : ''}`} ref={rootRef}>
      <button
        className={`mine-select-btn ${open ? 'open' : ''}`}
        onClick={() => canSwitch && setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={`Current mine: ${selectedMine.name}`}
      >
        <Pickaxe size={compact ? 13 : 15} />
        <span className="mine-select-text">
          {!compact && <small>CURRENT MINE</small>}
          <b>{compact ? shortName.toUpperCase() : selectedMine.name}</b>
        </span>
        {canSwitch && <ChevronDown size={13} className="mine-select-caret" />}
      </button>

      {open && (
        <div className="mine-select-menu" role="listbox">
          <div className="mine-select-menu-head">SELECT MINE</div>
          {mines.map((mine) => (
            <button
              key={mine.id}
              role="option"
              aria-selected={mine.id === selectedMine.id}
              className={mine.id === selectedMine.id ? 'selected' : ''}
              onClick={() => { selectMine(mine.id); setOpen(false); }}
            >
              <span>
                <b>{mine.name}</b>
                <small>{mine.officialMineCode} · {mine.district}</small>
              </span>
              <span className={`badge ${statusTone(mine)}`}>{mine.status}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
