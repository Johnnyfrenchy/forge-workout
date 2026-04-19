import { useApp } from '../hooks/useApp'

const TABS = [
  { id: 'today',    label: 'TODAY', letter: 'T' },
  { id: 'active',   label: 'LIVE',  letter: 'L', badge: true },
  { id: 'history',  label: 'HIST',  letter: 'H' },
  { id: 'stats',    label: 'STAT',  letter: 'S' },
  { id: 'settings', label: 'CFG',   letter: 'C' },
]

export function BottomNav() {
  const { tab, setTab, currentSession } = useApp()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[var(--bg-2)] border-t border-[var(--line-bright)]">
      <div className="max-w-screen-md mx-auto flex">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-3 border-t-2 ${tab === t.id ? 'tab-active' : 'border-transparent text-[var(--ink-dim)]'} relative`}
          >
            <div className="font-display text-sm">{t.letter}</div>
            <div className="font-mono text-[9px] mt-0.5 tracking-widest">{t.label}</div>
            {t.badge && currentSession && (
              <span className="absolute top-1.5 right-1/3 w-1.5 h-1.5 bg-[var(--accent)] pulse-accent"></span>
            )}
          </button>
        ))}
      </div>
      <div style={{ height: 'env(safe-area-inset-bottom)' }}></div>
    </nav>
  )
}
