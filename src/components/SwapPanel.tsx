import { useState } from 'react'
import { SPLITS } from '../data/constants'
import { SESSION_TYPES } from '../data/sessionTypes'

interface Props {
  currentSplit: string
  currentKey?: string
  onForceSplit: (split: string) => void
  onForceSession: (key: string) => void
  onReset: () => void
}

export function SwapPanel({ currentSplit, currentKey, onForceSplit, onForceSession, onReset }: Props) {
  const [open, setOpen] = useState(false)

  const availableSessions = Object.entries(SESSION_TYPES)
    .filter(([k, v]) => v.split === currentSplit && k !== currentKey)

  return (
    <div className="mt-3">
      <button onClick={() => setOpen(!open)} className="btn btn-ghost w-full text-[11px]">
        {open ? '▲ FERMER' : '▼ CHANGER / RÉGÉNÉRER'}
      </button>

      {open && (
        <div className="card p-4 mt-2 anim-fade-up">
          {availableSessions.length > 0 && (
            <>
              <div className="font-mono text-[10px] text-[var(--ink-dim)] tracking-widest mb-2">
                AUTRE SÉANCE / {currentSplit.toUpperCase()}
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {availableSessions.map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => { onForceSession(k); setOpen(false) }}
                    className="p-3 card text-left hover:border-[var(--ink-dim)]"
                  >
                    <div className="font-display text-sm">{v.name}</div>
                    <div className="font-mono text-[9px] text-[var(--ink-dim)] mt-0.5 tracking-widest">{v.style.toUpperCase()}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="font-mono text-[10px] text-[var(--ink-dim)] tracking-widest mb-2">FORCER UN AUTRE SPLIT</div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[SPLITS.UPPER_LOWER, SPLITS.PPL, SPLITS.FULL_BODY]
              .filter(s => s !== currentSplit)
              .map(s => (
                <button
                  key={s}
                  onClick={() => { onForceSplit(s); setOpen(false) }}
                  className="p-2 card text-center hover:border-[var(--ink-dim)]"
                >
                  <div className="font-mono text-[10px]">{s.toUpperCase()}</div>
                </button>
              ))}
          </div>

          <button onClick={() => { onReset(); setOpen(false) }} className="btn btn-ghost w-full text-[10px] btn-danger">
            ↻ RESET COMPLET
          </button>
          <div className="font-mono text-[9px] text-[var(--ink-dim)] mt-2 text-center">
            Reset = efface tous les overrides locaux et re-propose depuis l'algo
          </div>
        </div>
      )}
    </div>
  )
}
