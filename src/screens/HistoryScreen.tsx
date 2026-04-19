import { useState } from 'react'
import { useApp } from '../hooks/useApp'
import { ConfirmModal } from '../components/ConfirmModal'
import type { Session } from '../data/constants'

export function HistoryScreen() {
  const { sessions, deleteSession } = useApp()
  const completed = sessions.filter(s => s.completed).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (completed.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="font-display text-xl">Aucune séance</div>
        <div className="font-mono text-xs text-[var(--ink-dim)] mt-2">Complète ta première séance pour voir ton historique.</div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-screen-md mx-auto pb-safe">
      <div className="font-mono text-[10px] text-[var(--ink-dim)] tracking-widest mb-3">HISTORY / {completed.length} SESSIONS</div>
      <div className="space-y-2">
        {completed.map(s => <HistoryCard key={s.id} session={s} onDelete={deleteSession} />)}
      </div>
    </div>
  )
}

function HistoryCard({ session, onDelete }: { session: Session; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const totalVolume = (session.loggedExercises || []).reduce((sum, ex) => {
    return sum + (ex.reps || []).reduce((a, b) => a + b, 0) * (ex.weight || 0)
  }, 0)
  const date = new Date(session.date)

  return (
    <div className="card">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-3 text-left">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display text-base">{session.type}</div>
            <div className="font-mono text-[10px] text-[var(--ink-dim)] mt-0.5">
              {date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })} · {session.muscleGroups?.join(' / ')}
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-sm">{totalVolume >= 1000 ? `${(totalVolume/1000).toFixed(1)}K` : Math.round(totalVolume)}<span className="font-mono text-[9px] text-[var(--ink-dim)]">KG·R</span></div>
            <div className="font-mono text-[9px] text-[var(--ink-dim)]">{expanded ? '▲' : '▼'}</div>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[var(--line)] p-3 anim-fade-up">
          <div className="space-y-2">
            {(session.loggedExercises || []).map((ex, i) => (
              <div key={i} className="flex items-start justify-between text-xs gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-display truncate">{ex.name}</div>
                  <div className="font-mono text-[10px] text-[var(--ink-dim)]">
                    {ex.weight}kg × [{(ex.reps || []).join(', ')}]
                  </div>
                </div>
                <div className="font-mono text-[10px] text-[var(--ink-dim)]">RPE {ex.rpe?.toFixed(1) || '-'}</div>
              </div>
            ))}
          </div>
          {session.sessionNote && (
            <div className="mt-3 p-2 bg-[var(--bg-3)] border-l-2 border-[var(--accent)]">
              <div className="font-mono text-[9px] text-[var(--ink-dim)] tracking-widest">NOTE</div>
              <div className="text-xs mt-1">{session.sessionNote}</div>
            </div>
          )}
          <button onClick={() => setConfirmDelete(true)} className="btn btn-ghost btn-danger text-[10px] mt-3">
            SUPPRIMER
          </button>
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Supprimer cette séance ?"
          body="Cette action est irréversible."
          confirmLabel="SUPPRIMER"
          onConfirm={() => { setConfirmDelete(false); onDelete(session.id) }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
