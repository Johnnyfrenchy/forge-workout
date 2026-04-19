import { useState } from 'react'
import { useApp } from '../hooks/useApp'

export function SettingsScreen() {
  const { settings, updateSettings, sessions, isFirebase } = useApp()
  const [showDebug, setShowDebug] = useState(false)

  if (!settings) return null

  const exportData = () => {
    const data = { settings, sessions, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `forge_export_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 max-w-screen-md mx-auto pb-safe">
      <div className="font-mono text-[10px] text-[var(--ink-dim)] tracking-widest mb-4">CONFIGURATION</div>

      <div className="card p-4 mb-4">
        <div className="font-display text-sm mb-3">Objectif hebdomadaire</div>
        <div className="grid grid-cols-4 gap-2">
          {[2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => updateSettings({ weeklyTarget: n })}
              className={`p-3 border ${settings.weeklyTarget === n ? 'border-[var(--accent)] bg-[var(--bg-3)]' : 'border-[var(--line)]'}`}
            >
              <div className="font-display text-xl">{n}</div>
              <div className="font-mono text-[9px] text-[var(--ink-dim)] mt-1">/WK</div>
            </button>
          ))}
        </div>
      </div>

      <div className="card p-4 mb-4">
        <div className="font-display text-sm mb-3">Règles du protocole</div>
        <label className="flex items-center justify-between py-3 border-b border-[var(--line)]">
          <div className="flex-1 pr-4">
            <div className="text-sm">Deload adaptative</div>
            <div className="font-mono text-[10px] text-[var(--ink-dim)] mt-0.5">Propose deload si 3 sem. RPE élevé</div>
          </div>
          <input
            type="checkbox"
            checked={settings.adaptiveDeload}
            onChange={e => updateSettings({ adaptiveDeload: e.target.checked })}
            className="accent-[var(--accent)] w-5 h-5"
          />
        </label>
        <label className="flex items-center justify-between py-3">
          <div className="flex-1 pr-4">
            <div className="text-sm">Repos 48h strict</div>
            <div className="font-mono text-[10px] text-[var(--ink-dim)] mt-0.5">Refuse groupes &lt;48h</div>
          </div>
          <input
            type="checkbox"
            checked={settings.strictRest}
            onChange={e => updateSettings({ strictRest: e.target.checked })}
            className="accent-[var(--accent)] w-5 h-5"
          />
        </label>
      </div>

      <div className="card p-4 mb-4">
        <div className="font-display text-sm mb-3">Données</div>
        <div className="font-mono text-[10px] text-[var(--ink-dim)] tracking-widest mb-3">
          <div>STORAGE · {isFirebase ? 'FIREBASE + LOCAL' : 'LOCAL ONLY'}</div>
          <div className="mt-0.5">SESSIONS · {sessions.filter(s => s.completed).length}</div>
        </div>
        <button onClick={exportData} className="btn btn-ghost w-full mb-2 text-xs">EXPORT JSON</button>
        <button onClick={() => setShowDebug(!showDebug)} className="btn btn-ghost w-full text-xs">
          {showDebug ? 'HIDE' : 'SHOW'} DEBUG
        </button>
      </div>

      {showDebug && (
        <div className="card p-3 mb-4 font-mono text-[10px] overflow-auto">
          <pre className="whitespace-pre-wrap break-all">{JSON.stringify({ settings, sessions: sessions.slice(0, 3) }, null, 2)}</pre>
        </div>
      )}

      <div className="text-center font-mono text-[10px] text-[var(--ink-low)] tracking-widest mt-8">
        FORGE / WORKOUT PROTOCOL / v1.5
      </div>
    </div>
  )
}
