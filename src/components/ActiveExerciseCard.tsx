import { useState } from 'react'
import { ConfirmModal } from './ConfirmModal'
import type { ExerciseEntry } from '../data/constants'

const BODYWEIGHT_IDS = ['plank', 'side_plank', 'dead_bug', 'bird_dog', 'pallof']

interface Props {
  ex: ExerciseEntry
  idx: number
  expanded: boolean
  onExpand: () => void
  onToggleSetDone: (exIdx: number, setIdx: number) => void
  onLogSet: (exIdx: number, setIdx: number, field: string, value: number | null) => void
  onMarkLogged: (exIdx: number) => void
  onRequestSwap: (idx: number) => void
  onSkip: (idx: number) => void
}

export function ActiveExerciseCard({
  ex, idx, expanded, onExpand,
  onToggleSetDone, onLogSet, onMarkLogged, onRequestSwap, onSkip,
}: Props) {
  const [confirmSkip, setConfirmSkip] = useState(false)
  const actualSets = ex.actualSets || Array.from({ length: ex.sets }, () => ({ weight: null, reps: null, rpe: null, done: false }))
  const doneCount = actualSets.filter(s => s.done).length
  const unit = ex.repUnit || 'reps'
  const isBodyweight = ex.group === 'Core' || BODYWEIGHT_IDS.includes(ex.id)

  return (
    <div className={`card ${expanded ? 'border-[var(--ink-dim)]' : ''} ${ex.swapped ? 'border-l-2 border-l-[var(--info)]' : ''}`}>
      <button onClick={onExpand} className="w-full p-3 flex items-center gap-3 text-left">
        <div className="font-display text-2xl text-[var(--ink-low)] w-8 flex-shrink-0">{String(idx + 1).padStart(2, '0')}</div>
        <div className="flex-1 min-w-0">
          <div className="font-display text-sm truncate">
            {ex.name}
            {ex.swapped && <span className="font-mono text-[9px] text-[var(--info)] ml-2">SWAP</span>}
          </div>
          <div className="font-mono text-[10px] text-[var(--ink-dim)] mt-0.5">
            {doneCount}/{ex.sets} sets · {ex.sets}×{ex.repsTarget}{unit === 'sec' ? 's' : ''} · RPE {ex.rpeTarget}
          </div>
        </div>
        <div className="font-mono text-[10px] text-[var(--ink-dim)]">{expanded ? '▲' : '▼'}</div>
      </button>

      {expanded && (
        <div className="border-t border-[var(--line)] p-3 anim-fade-up">
          {ex.lastSession && (
            <div className="font-mono text-[10px] text-[var(--ink-dim)] mb-3">
              → Dernière fois : {ex.lastSession.weight ? `${ex.lastSession.weight}kg × ` : ''}[{ex.lastSession.reps?.join(', ') || '?'}] · RPE {ex.lastSession.rpe?.toFixed(1) || '?'}
            </div>
          )}
          {ex.progressionNote && (
            <div className="font-mono text-[10px] text-[var(--accent)] mb-3">→ {ex.progressionNote}</div>
          )}

          <div className="flex gap-2 mb-3">
            <button onClick={() => onRequestSwap(idx)} className="btn btn-ghost flex-1 text-[10px] py-2">⇄ REMPLACER</button>
            <button onClick={() => setConfirmSkip(true)} className="btn btn-ghost flex-1 text-[10px] py-2">→ SKIP</button>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 font-mono text-[9px] text-[var(--ink-low)] tracking-widest px-1">
              <div className="col-span-1"></div>
              <div className="col-span-2">SET</div>
              {!isBodyweight && <div className="col-span-4">KG</div>}
              <div className={isBodyweight ? 'col-span-7' : 'col-span-3'}>{unit === 'sec' ? 'SEC' : 'REPS'}</div>
              <div className="col-span-2">RPE</div>
            </div>

            {actualSets.map((s, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-1">
                  <div className={`set-check ${s.done ? 'done' : ''}`} onClick={() => onToggleSetDone(idx, i)}></div>
                </div>
                <div className="col-span-2 font-mono text-sm">{i + 1}</div>
                {!isBodyweight && (
                  <div className="col-span-4">
                    <input
                      type="number" step="0.5" inputMode="decimal"
                      value={s.weight ?? ''}
                      onChange={e => onLogSet(idx, i, 'weight', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder={ex.suggestedWeight ? String(ex.suggestedWeight) : '-'}
                      className="w-full px-2 py-1.5 text-sm"
                    />
                  </div>
                )}
                <div className={isBodyweight ? 'col-span-7' : 'col-span-3'}>
                  <input
                    type="number" step="1" inputMode="numeric"
                    value={s.reps ?? ''}
                    onChange={e => onLogSet(idx, i, 'reps', e.target.value ? parseInt(e.target.value, 10) : null)}
                    placeholder={ex.repsTarget}
                    className="w-full px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number" step="0.5" min="1" max="10" inputMode="decimal"
                    value={s.rpe ?? ''}
                    onChange={e => onLogSet(idx, i, 'rpe', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder={String(ex.rpeTarget)}
                    className="w-full px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <NoteInput exIdx={idx} value={ex.notes || ''} onLogSet={onLogSet} />
          </div>

          <button onClick={() => onMarkLogged(idx)} className="btn btn-primary w-full mt-3 text-xs">
            → EXO SUIVANT
          </button>
        </div>
      )}

      {confirmSkip && (
        <ConfirmModal
          title="Passer cet exercice ?"
          body="Il sera marqué comme non fait et n'apparaîtra pas dans l'historique."
          confirmLabel="SKIP"
          onConfirm={() => { setConfirmSkip(false); onSkip(idx) }}
          onCancel={() => setConfirmSkip(false)}
        />
      )}
    </div>
  )
}

function NoteInput({ exIdx, value, onLogSet }: { exIdx: number; value: string; onLogSet: (exIdx: number, setIdx: number, field: string, value: any) => void }) {
  const [local, setLocal] = useState(value)
  return (
    <input
      type="text"
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => onLogSet(exIdx, -1, 'notes', local)}
      placeholder="Note technique..."
      className="w-full px-2 py-1.5 text-xs"
    />
  )
}
