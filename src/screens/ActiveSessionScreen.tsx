import { useState, useEffect } from 'react'
import { useApp } from '../hooks/useApp'
import { buildExerciseEntry } from '../algo/exerciseSelector'
import { EXERCISES } from '../data/exercises'
import { ConfirmModal } from '../components/ConfirmModal'
import { ActiveExerciseCard } from '../components/ActiveExerciseCard'
import { SwapExerciseModal } from '../components/SwapExerciseModal'
import type { Exercise } from '../data/constants'

export function ActiveSessionScreen() {
  const { currentSession, updateCurrentSession, finishSession, discardCurrentSession, sessions } = useApp()
  const [currentExIdx, setCurrentExIdx] = useState(0)
  const [restTimer, setRestTimer] = useState<number | null>(null)
  const [restRemaining, setRestRemaining] = useState(0)
  const [sentiment, setSentiment] = useState<string | null>(null)
  const [sessionNote, setSessionNote] = useState('')
  const [confirmFinish, setConfirmFinish] = useState(false)
  const [showAbandonModal, setShowAbandonModal] = useState(false)
  const [swapTargetIdx, setSwapTargetIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!restTimer) return
    const i = setInterval(() => {
      const remain = Math.max(0, Math.round((restTimer - Date.now()) / 1000))
      setRestRemaining(remain)
      if (remain <= 0) {
        clearInterval(i)
        setRestTimer(null)
        try { navigator.vibrate && navigator.vibrate([100, 50, 100]) } catch {}
      }
    }, 200)
    return () => clearInterval(i)
  }, [restTimer])

  if (!currentSession) {
    return (
      <div className="p-6 text-center">
        <div className="font-mono text-xs text-[var(--ink-dim)] tracking-widest">PAS DE SESSION ACTIVE</div>
      </div>
    )
  }

  const exercises = currentSession.exercises || []
  const currentEx = exercises[currentExIdx]
  const allLogged = exercises.every(ex => ex.logged)

  const logSet = async (exIdx: number, setIdx: number, field: string, value: any) => {
    await updateCurrentSession(cs => {
      const next = { ...cs, exercises: [...cs.exercises] }
      const ex = { ...next.exercises[exIdx] }
      if (field === 'notes') {
        ex.notes = value
      } else {
        ex.actualSets = ex.actualSets || Array.from({ length: ex.sets }, () => ({ weight: null, reps: null, rpe: null, done: false }))
        ex.actualSets = [...ex.actualSets]
        ex.actualSets[setIdx] = { ...ex.actualSets[setIdx], [field]: value }
      }
      next.exercises[exIdx] = ex
      return next
    })
  }

  const toggleSetDone = async (exIdx: number, setIdx: number) => {
    const ex = exercises[exIdx]
    const wasDone = ex.actualSets?.[setIdx]?.done
    await updateCurrentSession(cs => {
      const next = { ...cs, exercises: [...cs.exercises] }
      const exCopy = { ...next.exercises[exIdx] }
      exCopy.actualSets = exCopy.actualSets || Array.from({ length: exCopy.sets }, () => ({ weight: null, reps: null, rpe: null, done: false }))
      exCopy.actualSets = [...exCopy.actualSets]
      exCopy.actualSets[setIdx] = { ...exCopy.actualSets[setIdx], done: !wasDone }
      next.exercises[exIdx] = exCopy
      return next
    })
    if (!wasDone) {
      setRestTimer(Date.now() + ex.restSeconds * 1000)
      setRestRemaining(ex.restSeconds)
    }
  }

  const markExerciseLogged = async (exIdx: number) => {
    await updateCurrentSession(cs => {
      const next = { ...cs, exercises: [...cs.exercises] }
      next.exercises[exIdx] = { ...next.exercises[exIdx], logged: true }
      return next
    })
    if (exIdx < exercises.length - 1) setCurrentExIdx(exIdx + 1)
  }

  const handleSkip = async (exIdx: number) => {
    await updateCurrentSession(cs => {
      const next = { ...cs, exercises: [...cs.exercises] }
      next.exercises[exIdx] = { ...next.exercises[exIdx], logged: true, skipped: true }
      return next
    })
    if (exIdx < exercises.length - 1) setCurrentExIdx(exIdx + 1)
  }

  const handleSwap = async (exIdx: number, replacementDef: Exercise) => {
    const newEntry = buildExerciseEntry(replacementDef, currentSession.style as 'heavy' | 'hyper' || 'hyper', sessions, currentSession.focus || 'upper')
    await updateCurrentSession(cs => {
      const next = { ...cs, exercises: [...cs.exercises] }
      next.exercises[exIdx] = { ...newEntry, swapped: true }
      next.muscleGroups = [...new Set(next.exercises.map(e => e.group))]
      return next
    })
    setSwapTargetIdx(null)
  }

  const finishWholeSession = async () => {
    const loggedExercises = exercises
      .filter(ex => !ex.skipped)
      .map(ex => {
        const sets = ex.actualSets || []
        const weights = sets.map(s => s.weight).filter((v): v is number => v != null)
        const reps = sets.map(s => s.reps).filter((v): v is number => v != null)
        const rpes = sets.map(s => s.rpe).filter((v): v is number => v != null)
        const avgRpe = rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : null
        return {
          id: ex.id, name: ex.name, group: ex.group,
          weight: weights.length ? Math.max(...weights) : null,
          reps, rpe: avgRpe, notes: ex.notes || '',
        }
      })
    await finishSession({ ...currentSession, loggedExercises, sentiment: sentiment || undefined, sessionNote })
  }

  return (
    <div className="p-4 max-w-screen-md mx-auto pb-safe anim-fade-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-mono text-[10px] text-[var(--accent)] tracking-widest">LIVE</div>
          <div className="font-display text-xl">{currentSession.type}</div>
        </div>
        <button onClick={() => setShowAbandonModal(true)} className="btn btn-ghost text-[10px] px-2 py-1 btn-danger">✕ ABANDON</button>
      </div>

      {restTimer !== null && restRemaining > 0 && (
        <div className="card p-3 mb-3 border-[var(--accent)] bg-[var(--bg-3)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] text-[var(--accent)] tracking-widest">REPOS</div>
              <div className="font-display text-3xl leading-none">
                {String(Math.floor(restRemaining / 60)).padStart(2, '0')}:{String(restRemaining % 60).padStart(2, '0')}
              </div>
            </div>
            <button onClick={() => { setRestTimer(null); setRestRemaining(0) }} className="btn btn-ghost text-[10px]">SKIP</button>
          </div>
          <div className="mt-2 h-1 bg-[var(--bg)] relative">
            <div
              className="absolute top-0 left-0 h-1 bg-[var(--accent)]"
              style={{ width: `${100 - (restRemaining / (currentEx?.restSeconds || 60)) * 100}%`, transition: 'width 0.2s linear' }}
            ></div>
          </div>
        </div>
      )}

      <div className="flex gap-1 mb-4">
        {exercises.map((ex, i) => (
          <button
            key={i}
            onClick={() => setCurrentExIdx(i)}
            className={`flex-1 h-1.5 ${ex.logged ? 'bg-[var(--accent)]' : i === currentExIdx ? 'bg-[var(--ink)]' : 'bg-[var(--line)]'}`}
          />
        ))}
      </div>

      <div className="space-y-3">
        {exercises.map((ex, i) => (
          <ActiveExerciseCard
            key={ex.id + i}
            ex={ex} idx={i}
            expanded={i === currentExIdx}
            onExpand={() => setCurrentExIdx(i)}
            onToggleSetDone={toggleSetDone}
            onLogSet={logSet}
            onMarkLogged={markExerciseLogged}
            onRequestSwap={idx => setSwapTargetIdx(idx)}
            onSkip={handleSkip}
          />
        ))}
      </div>

      {allLogged && !confirmFinish && (
        <button onClick={() => setConfirmFinish(true)} className="btn btn-primary w-full mt-6 py-4">
          → TERMINER LA SÉANCE
        </button>
      )}

      {confirmFinish && (
        <div className="card p-5 mt-6 anim-fade-up">
          <div className="font-mono text-[10px] text-[var(--accent)] tracking-widest">DEBRIEF</div>
          <div className="font-display text-2xl mt-1">Comment c'était ?</div>
          <div className="mt-4 flex gap-2 justify-between">
            {[
              { emoji: '😤', key: 'angry',  label: 'ÉNERVÉ' },
              { emoji: '😌', key: 'zen',    label: 'ZEN' },
              { emoji: '💪', key: 'strong', label: 'FORT' },
              { emoji: '🥴', key: 'flat',   label: 'FLAT' },
            ].map(s => (
              <button
                key={s.key}
                onClick={() => setSentiment(s.key)}
                className={`flex-1 p-3 card text-center ${sentiment === s.key ? 'border-[var(--accent)]' : ''}`}
              >
                <div className="text-2xl">{s.emoji}</div>
                <div className="font-mono text-[9px] text-[var(--ink-dim)] tracking-widest mt-1">{s.label}</div>
              </button>
            ))}
          </div>
          <div className="mt-4">
            <div className="font-mono text-[10px] text-[var(--ink-dim)] tracking-widest mb-2">NOTES</div>
            <textarea
              value={sessionNote}
              onChange={e => setSessionNote(e.target.value)}
              rows={3}
              placeholder="Sensations, blessures, contexte..."
              className="w-full p-3 text-sm"
            />
          </div>
          <button onClick={finishWholeSession} className="btn btn-primary w-full mt-4">→ VALIDER & ENREGISTRER</button>
          <button onClick={() => setConfirmFinish(false)} className="btn btn-ghost w-full mt-2 text-[11px]">RETOUR</button>
        </div>
      )}

      {showAbandonModal && (
        <ConfirmModal
          title="Abandonner la séance ?"
          body="Aucune donnée ne sera enregistrée."
          confirmLabel="ABANDONNER"
          onConfirm={async () => { setShowAbandonModal(false); await discardCurrentSession() }}
          onCancel={() => setShowAbandonModal(false)}
        />
      )}

      {swapTargetIdx !== null && (
        <SwapExerciseModal
          currentExercise={exercises[swapTargetIdx]}
          onSelect={replacement => handleSwap(swapTargetIdx, replacement)}
          onCancel={() => setSwapTargetIdx(null)}
        />
      )}
    </div>
  )
}
