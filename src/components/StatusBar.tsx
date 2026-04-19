import { useApp } from '../hooks/useApp'
import { computeFrequency } from '../algo/frequency'

export function StatusBar() {
  const { sessions, isFirebase } = useApp()
  const freq = computeFrequency(sessions, 14)
  return (
    <div className="font-mono text-[10px] text-[var(--ink-dim)] flex items-center gap-3 flex-wrap">
      <span className="flex items-center gap-1">
        <span className={`w-1.5 h-1.5 ${isFirebase ? 'bg-[var(--accent)]' : 'bg-[var(--warn)]'}`}></span>
        {isFirebase ? 'SYNC' : 'LOCAL'}
      </span>
      <span>FREQ {freq.toFixed(1)}/WK</span>
      <span>SESS {sessions.filter(s => s.completed).length}</span>
    </div>
  )
}
