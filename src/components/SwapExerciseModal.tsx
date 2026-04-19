import { useState, useEffect } from 'react'
import { EXERCISES } from '../data/exercises'
import type { ExerciseEntry, Exercise } from '../data/constants'

interface Props {
  currentExercise: ExerciseEntry | null
  onSelect: (ex: Exercise) => void
  onCancel: () => void
}

export function SwapExerciseModal({ currentExercise, onSelect, onCancel }: Props) {
  const [filterGroup, setFilterGroup] = useState(currentExercise?.group || 'all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const allGroups = ['all', ...new Set(EXERCISES.map(e => e.group))]
  const filtered = EXERCISES.filter(e => {
    if (e.id === currentExercise?.id) return false
    if (filterGroup !== 'all' && e.group !== filterGroup) return false
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{
        background: 'rgba(0,0,0,0.85)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)',
        paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
      }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md card-accent anim-fade-up flex flex-col"
        style={{ maxHeight: '100%' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[var(--line)]">
          <div className="flex items-center justify-between mb-2">
            <div className="font-mono text-[10px] text-[var(--info)] tracking-widest">REMPLACER</div>
            <button onClick={onCancel} className="font-mono text-xs text-[var(--ink-dim)]">✕</button>
          </div>
          <div className="font-display text-lg leading-tight">{currentExercise?.name}</div>
          <div className="font-mono text-[10px] text-[var(--ink-dim)] mt-1">→ par :</div>

          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Chercher un exo..."
            className="w-full mt-3 px-3 py-2 text-sm"
          />

          <div className="flex gap-1 mt-2 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: 'touch' } as any}>
            {allGroups.map(g => (
              <button
                key={g}
                onClick={() => setFilterGroup(g)}
                className={`font-mono text-[10px] px-2 py-1 whitespace-nowrap border ${filterGroup === g ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--line)] text-[var(--ink-dim)]'}`}
              >
                {g === 'all' ? 'TOUS' : g.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {filtered.length === 0 && (
            <div className="text-center py-8 font-mono text-xs text-[var(--ink-dim)]">Aucun exo trouvé</div>
          )}
          <div className="space-y-1">
            {filtered.map(ex => (
              <button
                key={ex.id}
                onClick={() => onSelect(ex)}
                className="w-full p-3 card text-left hover:border-[var(--ink-dim)] transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-sm truncate">{ex.name}</div>
                    <div className="font-mono text-[10px] text-[var(--ink-dim)] mt-0.5">
                      {ex.group.toUpperCase()} · {ex.tier.toUpperCase()} · {ex.role === 'compound' ? 'POLY' : 'ISO'}
                    </div>
                  </div>
                  <div className="font-mono text-[10px] text-[var(--accent)]">→</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
