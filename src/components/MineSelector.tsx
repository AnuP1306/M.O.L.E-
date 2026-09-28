import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Pickaxe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSession } from '../state/SessionContext';
import type { Mine } from '../types';

const statusTone = (mine: Mine) =>
  mine.status === 'OPERATIONAL' ? 'safe'
    : mine.status === 'ADVISORY' ? 'critical'
      : 'warning';

export function MineSelector({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const { mines, selectedMine, selectMine } = useSession();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!selectedMine) return null;

  const canSwitch = mines.length > 1;
  const shortName = selectedMine.name.replace(' Underground Mine', '');
  const displayStatus = (status: string) =>
    t(`setupOptions.${status}`, { defaultValue: status });

  return (
    <div className={`mine-select ${compact ? 'compact' : ''}`} ref={rootRef}>
      <button
        className={`mine-select-btn ${open ? 'open' : ''}`}
        onClick={() => canSwitch && setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={t('mineSelector.currentMineTitle', { name: selectedMine.name })}
      >
        <Pickaxe size={compact ? 13 : 15} />
        <span className="mine-select-text">
          {!compact && <small>{t('mineSelector.currentMine')}</small>}
          <b>{compact ? shortName.toUpperCase() : selectedMine.name}</b>
        </span>
        {canSwitch && <ChevronDown size={13} className="mine-select-caret" />}
      </button>

      {open && (
        <div className="mine-select-menu" role="listbox">
          <div className="mine-select-menu-head">{t('mineSelector.selectMine')}</div>
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
              <span className={`badge ${statusTone(mine)}`}>
                {displayStatus(mine.status)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}