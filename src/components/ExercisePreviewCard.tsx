import type { ExerciseEntry } from '../data/constants'

export function ExercisePreviewCard({ ex, idx }: { ex: ExerciseEntry; idx: number }) {
  return (
    <div className="card p-3 flex items-center gap-3 hover:border-[var(--ink-dim)] transition-colors">
      <div className="font-display text-2xl text-[var(--ink-low)] w-8">{String(idx + 1).padStart(2, '0')}</div>
      <div className="flex-1 min-w-0">
        <div className="font-display text-sm truncate">{ex.name}</div>
        <div className="font-mono text-[10px] text-[var(--ink-dim)] mt-0.5">
          {ex.sets}×{ex.repsTarget} · RPE {ex.rpeTarget} · REST {Math.round(ex.restSeconds / 60)}′{ex.restSeconds % 60 ? String(ex.restSeconds % 60).padStart(2, '0') : ''}
        </div>
      </div>
      <div className="text-right">
        {ex.suggestedWeight ? (
          <div className="font-display text-base">{ex.suggestedWeight}<span className="text-[10px] font-mono text-[var(--ink-dim)]">KG</span></div>
        ) : (
          <div className="font-mono text-[10px] text-[var(--ink-low)]">NEW</div>
        )}
        <div className="font-mono text-[9px] text-[var(--ink-dim)] tracking-widest">{ex.tier.slice(0, 3).toUpperCase()}</div>
      </div>
    </div>
  )
}
