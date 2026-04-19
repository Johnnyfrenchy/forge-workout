import { useState, useEffect, useMemo } from 'react'
import { useApp } from '../hooks/useApp'
import { buildNextSession, buildSessionFromType, estimateDuration } from '../algo/sessionBuilder'
import { daysSinceLastSession } from '../algo/recovery'
import { shouldProposeDeload } from '../algo/deload'
import { computeFrequency, detectMesocycle } from '../algo/frequency'
import { ConfirmModal } from '../components/ConfirmModal'
import { ExercisePreviewCard } from '../components/ExercisePreviewCard'
import { SwapPanel } from '../components/SwapPanel'
import { MetaBlock } from '../components/MetaBlock'

export function TodayScreen() {
  const { sessions, settings, currentSession, startSession, setTab, discardCurrentSession } = useApp()
  const [recovery, setRecovery] = useState<'good' | 'medium' | 'poor' | null>(null)
  const [needsRecoveryPrompt, setNeedsRecoveryPrompt] = useState(false)
  const [useDeload, setUseDeload] = useState(false)
  const [deloadAvailable, setDeloadAvailable] = useState(false)
  const [forcedSplit, setForcedSplit] = useState<string | null>(null)
  const [forcedSessionKey, setForcedSessionKey] = useState<string | null>(null)
  const [regenNonce, setRegenNonce] = useState(0)
  const [showAbandonModal, setShowAbandonModal] = useState(false)
  const [dismissDoubleSession, setDismissDoubleSession] = useState(false)
  const [dismissMesocycle, setDismissMesocycle] = useState(false)

  useEffect(() => {
    const days = daysSinceLastSession(sessions)
    if (days > 3 && days < 999) setNeedsRecoveryPrompt(true)
    else setRecovery('good')
    setDeloadAvailable(shouldProposeDeload(sessions, settings!))
  }, [sessions, settings])

  const proposedSession = useMemo(() => {
    if (!recovery && needsRecoveryPrompt) return null
    if (!settings) return null

    if (forcedSessionKey) {
      return buildSessionFromType(forcedSessionKey, sessions, recovery || 'good', useDeload, forcedSplit || '')
    }

    return buildNextSession(sessions, settings, {
      recovery: recovery || 'good',
      deload: useDeload,
      acceptDeload: useDeload,
      split: forcedSplit || undefined,
    })
  }, [sessions, settings, recovery, needsRecoveryPrompt, useDeload, forcedSplit, forcedSessionKey, regenNonce])

  const resetProposal = () => {
    setRecovery(null)
    setNeedsRecoveryPrompt(false)
    setUseDeload(false)
    setForcedSplit(null)
    setForcedSessionKey(null)
    setRegenNonce(n => n + 1)
    const days = daysSinceLastSession(sessions)
    if (days > 3 && days < 999) setNeedsRecoveryPrompt(true)
    else setRecovery('good')
  }

  if (currentSession) {
    return (
      <div className="p-4 max-w-screen-md mx-auto">
        <div className="card p-5 anim-fade-up border-[var(--accent)]">
          <div className="font-mono text-[10px] text-[var(--accent)] tracking-widest">SESSION ACTIVE</div>
          <div className="font-display text-2xl mt-2">{currentSession.type}</div>
          <div className="font-mono text-xs text-[var(--ink-dim)] mt-1">
            En cours — {currentSession.exercises?.filter(e => e.logged).length || 0}/{currentSession.exercises?.length || 0} exos loggés
          </div>
          <button onClick={() => setTab('active')} className="btn btn-primary w-full mt-4">→ REPRENDRE LA SÉANCE</button>
          <button onClick={() => setShowAbandonModal(true)} className="btn btn-ghost w-full mt-2 text-[10px] btn-danger">
            ✕ ABANDONNER LA SÉANCE
          </button>
        </div>
        {showAbandonModal && (
          <ConfirmModal
            title="Abandonner la séance ?"
            body="Rien ne sera enregistré dans l'historique."
            confirmLabel="ABANDONNER"
            onConfirm={async () => { setShowAbandonModal(false); await discardCurrentSession() }}
            onCancel={() => setShowAbandonModal(false)}
          />
        )}
      </div>
    )
  }

  if (needsRecoveryPrompt && !recovery) {
    return (
      <div className="p-4 max-w-screen-md mx-auto">
        <div className="card p-6 anim-fade-up">
          <div className="font-mono text-[10px] text-[var(--warn)] tracking-widest">PAUSE DÉTECTÉE</div>
          <div className="font-display text-2xl mt-2 leading-tight">
            {Math.round(daysSinceLastSession(sessions))} jours depuis la dernière séance.
          </div>
          <div className="text-sm text-[var(--ink-dim)] mt-2">Comment va la récup ?</div>
          <div className="mt-5 space-y-2">
            {[
              { key: 'good',   label: 'Impeccable', sub: 'Aucune réduction de volume',     color: 'var(--accent)' },
              { key: 'medium', label: 'Bof',         sub: 'Volume -20%, accessoires allégés', color: 'var(--warn)' },
              { key: 'poor',   label: 'Pas ouf',     sub: 'Volume -30%, focus technique',     color: 'var(--danger)' },
            ].map(o => (
              <button
                key={o.key}
                onClick={() => { setRecovery(o.key as any); setNeedsRecoveryPrompt(false) }}
                className="w-full p-4 card text-left hover:border-[var(--ink-dim)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-display text-lg">{o.label}</div>
                    <div className="font-mono text-[11px] text-[var(--ink-dim)] mt-0.5">{o.sub}</div>
                  </div>
                  <div className="w-2 h-8" style={{ background: o.color }}></div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!proposedSession) return null

  if ((proposedSession as any).type === 'rest') {
    return (
      <div className="p-4 max-w-screen-md mx-auto">
        <div className="card p-6 anim-fade-up">
          <div className="font-mono text-[10px] text-[var(--ink-dim)] tracking-widest">REPOS</div>
          <div className="font-display text-3xl mt-2 leading-tight">Récupération</div>
          <div className="text-sm text-[var(--ink-dim)] mt-3">{proposedSession.note}</div>
        </div>
      </div>
    )
  }

  const lastSession = sessions.filter(s => s.completed).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  const hoursSinceLast = lastSession ? ((Date.now() - new Date(lastSession.date).getTime()) / (60 * 60 * 1000)) : null

  // Bug modéré #4 — Double session même jour
  const today = new Date().toISOString().slice(0, 10)
  const trainedToday = sessions.some(s => s.completed && s.date.slice(0, 10) === today)

  // Bug modéré #5 — Split transition
  const lastSplit = lastSession?.split ?? null
  const splitChanged = lastSplit && lastSplit !== proposedSession.split

  // Bug modéré #1 — Mésocycle
  const mesocycle = detectMesocycle(sessions)

  return (
    <div className="p-4 max-w-screen-md mx-auto pb-with-action">
      <div className="flex items-center justify-between mb-4 font-mono text-[10px] text-[var(--ink-dim)] tracking-widest">
        <div>PROTOCOL / {proposedSession.split.toUpperCase()}</div>
        <div>{new Date().toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase()}</div>
      </div>

      <div className="card-accent relative anim-fade-up">
        <div className="absolute top-0 right-0 w-16 h-1.5 bg-[var(--accent)]"></div>
        <div className="absolute top-0 right-16 w-8 h-1.5 stripes"></div>
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-[10px] text-[var(--accent)] tracking-widest">SESSION #{sessions.filter(s => s.completed).length + 1}</div>
              <h2 className="font-display text-4xl mt-1 leading-none">{proposedSession.type}</h2>
            </div>
            <div className="text-right">
              <div className="font-display text-3xl">{proposedSession.exercises.length}</div>
              <div className="font-mono text-[10px] text-[var(--ink-dim)] tracking-widest">EXOS</div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <MetaBlock label="VOLUME" value={proposedSession.plannedVolume || 0} unit="SETS" />
            <MetaBlock label="STYLE" value={proposedSession.style === 'heavy' ? 'LOURD' : 'HYPER'} />
            <MetaBlock label="DURÉE~" value={estimateDuration(proposedSession)} unit="MIN" />
          </div>

          <div className="mt-5 pt-4 border-t border-[var(--line)]">
            <div className="font-mono text-[10px] text-[var(--ink-dim)] tracking-widest mb-2">GROUPES CIBLÉS</div>
            <div className="flex flex-wrap gap-2">
              {proposedSession.muscleGroups.map(g => (
                <span key={g} className="font-mono text-[11px] px-2 py-1 bg-[var(--bg-3)] border border-[var(--line-bright)]">
                  {g.toUpperCase()}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 font-mono text-[11px] text-[var(--ink-dim)]">
            {lastSession
              ? `→ Dernier entraînement : il y a ${Math.round(hoursSinceLast!)}h (${lastSession.type})`
              : '→ Première séance'}
          </div>
        </div>
      </div>

      {/* Bug #4 — Double session */}
      {trainedToday && !dismissDoubleSession && (
        <div className="mt-3 card p-3 border-[var(--warn)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] text-[var(--warn)] tracking-widest">DÉJÀ ENTRAÎNÉ AUJOURD'HUI</div>
              <div className="text-xs text-[var(--ink-dim)] mt-1">Tu as déjà complété une séance ce jour. Une 2ème peut nuire à la récupération.</div>
            </div>
            <button onClick={() => setDismissDoubleSession(true)} className="btn btn-ghost text-[10px] shrink-0">OK</button>
          </div>
        </div>
      )}

      {/* Bug #5 — Split transition */}
      {splitChanged && (
        <div className="mt-3 card p-3 border-[var(--info)]">
          <div className="font-mono text-[10px] text-[var(--info)] tracking-widest">CHANGEMENT DE SPLIT</div>
          <div className="text-xs text-[var(--ink-dim)] mt-1">{lastSplit} → {proposedSession.split} — ta fréquence a changé, le protocole s'adapte.</div>
        </div>
      )}

      {/* Bug #1 — Mésocycle */}
      {mesocycle.active && !dismissMesocycle && (
        <div className="mt-3 card p-3 border-[var(--info)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] text-[var(--info)] tracking-widest">MÉSOCYCLE {mesocycle.weeks} SEMAINES</div>
              <div className="text-xs text-[var(--ink-dim)] mt-1">{mesocycle.weeks} semaines sur {mesocycle.split}. Envisage une semaine de variation ou un deload actif.</div>
            </div>
            <button onClick={() => setDismissMesocycle(true)} className="btn btn-ghost text-[10px] shrink-0">OK</button>
          </div>
        </div>
      )}

      {proposedSession.note && (
        <div className="mt-3 card p-3 border-[var(--warn)]">
          <div className="font-mono text-[10px] text-[var(--warn)] tracking-widest mb-1">REPRISE PROGRESSIVE</div>
          <div className="text-xs text-[var(--ink-dim)]">{proposedSession.note}</div>
        </div>
      )}

      {deloadAvailable && !useDeload && (
        <div className="mt-3 card p-3 border-[var(--warn)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] text-[var(--warn)] tracking-widest">DELOAD RECOMMANDÉE</div>
              <div className="text-xs text-[var(--ink-dim)] mt-1">3 semaines consécutives RPE élevé. -40% volume, -20% poids.</div>
            </div>
            <button onClick={() => setUseDeload(true)} className="btn btn-ghost text-[10px]">ACCEPT</button>
          </div>
        </div>
      )}
      {useDeload && (
        <div className="mt-3 card p-3 border-[var(--info)]">
          <div className="font-mono text-[10px] text-[var(--info)] tracking-widest">🔄 DELOAD ACTIVE</div>
          <div className="text-xs text-[var(--ink-dim)] mt-1">Volume -40%, poids -20%. <button onClick={() => setUseDeload(false)} className="underline">Annuler</button></div>
        </div>
      )}

      <div className="mt-5">
        <div className="font-mono text-[10px] text-[var(--ink-dim)] tracking-widest mb-3">SEQUENCE / {proposedSession.exercises.length} EXOS</div>
        <div className="space-y-2">
          {proposedSession.exercises.map((ex, i) => (
            <ExercisePreviewCard key={ex.id + i} ex={ex} idx={i} />
          ))}
        </div>
      </div>

      <SwapPanel
        currentSplit={proposedSession.split}
        currentKey={proposedSession.sessionKey}
        onForceSplit={s => { setForcedSplit(s); setForcedSessionKey(null); setRegenNonce(n => n + 1) }}
        onForceSession={k => { setForcedSessionKey(k); setRegenNonce(n => n + 1) }}
        onReset={resetProposal}
      />

      <div
        className="fixed left-0 right-0 border-t border-[var(--line-bright)]"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 64px)', background: 'var(--bg)', zIndex: 25 }}
      >
        <div className="max-w-screen-md mx-auto px-4 py-3">
          <button onClick={() => startSession(proposedSession)} className="btn btn-primary w-full text-base py-4">
            → DÉMARRER LA SÉANCE
          </button>
        </div>
      </div>
    </div>
  )
}
