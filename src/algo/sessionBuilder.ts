import { SPLITS } from '../data/constants'
import { SESSION_TYPES } from '../data/sessionTypes'
import { pickSplit } from './frequency'
import { pickNextSessionType } from './sessionPicker'
import { buildExercises } from './exerciseSelector'
import { daysSinceLastSession, applyRecoveryAdjustment, applyDeloadAdjustment } from './recovery'
import { shouldProposeDeload } from './deload'
import type { Session, Settings } from '../data/constants'

export interface SessionOverrides {
  split?: string
  recovery?: 'good' | 'medium' | 'poor'
  deload?: boolean
  acceptDeload?: boolean
}

export function buildNextSession(sessions: Session[], settings: Settings, overrides: SessionOverrides = {}): Session {
  const split = overrides.split || pickSplit(sessions, settings.weeklyTarget, settings)
  const daysSince = daysSinceLastSession(sessions)

  // Bug critique #4 — Maintenance dead-end → propose reprise séance
  if (split === SPLITS.MAINTENANCE) {
    const repriseExs = buildExercises('full', 'hyper', sessions).slice(0, 5)
    const adjusted = applyRecoveryAdjustment(repriseExs, 'medium', daysSince)
    const muscleGroups = [...new Set(adjusted.map(e => e.group))]
    return {
      id: `${new Date().toISOString().slice(0, 10)}_reprise`,
      date: new Date().toISOString(),
      type: 'Reprise Full Body',
      sessionKey: 'FULL_A',
      split: SPLITS.FULL_BODY,
      focus: 'full',
      style: 'hyper',
      muscleGroups,
      plannedVolume: adjusted.reduce((s, e) => s + e.sets, 0),
      exercises: adjusted,
      completed: false,
      restOK: true,
      note: '⚠ Fréquence <1.5/sem — reprise progressive. Volume allégé, focus technique.',
    }
  }

  const picked = pickNextSessionType(sessions, split)
  if (!picked) {
    return {
      id: `${new Date().toISOString().slice(0, 10)}_rest`,
      date: new Date().toISOString(),
      type: 'rest',
      name: 'Repos',
      split,
      muscleGroups: [],
      exercises: [],
      completed: false,
      note: 'Tous les groupes sont en récupération (<48h). Repos recommandé.',
    } as any
  }

  let exercises = buildExercises(picked.focus, picked.style, sessions)

  const recovery = overrides.recovery || 'good'

  // Bug critique #1 — Reprise progressive (passe daysSince pour réduction poids/volume durée-dépendante)
  if (daysSince > 3) {
    exercises = applyRecoveryAdjustment(exercises, recovery, daysSince)
  }

  if (overrides.deload || (shouldProposeDeload(sessions, settings) && overrides.acceptDeload)) {
    exercises = applyDeloadAdjustment(exercises)
  }

  const muscleGroups = [...new Set(exercises.map(e => e.group))]
  const plannedVolume = exercises.reduce((sum, e) => sum + e.sets, 0)

  return {
    id: `${new Date().toISOString().slice(0, 10)}_${picked.key}`,
    date: new Date().toISOString(),
    type: picked.name,
    sessionKey: picked.key,
    split,
    focus: picked.focus,
    style: picked.style,
    muscleGroups,
    plannedVolume,
    exercises,
    completed: false,
    restOK: picked.restOK,
    note: picked.restOK ? null : '⚠ Certains groupes <48h de récup',
  }
}

export function buildSessionFromType(
  sessionKey: string,
  sessions: Session[],
  recovery: 'good' | 'medium' | 'poor',
  useDeload: boolean,
  baseSplit: string,
): Session {
  const t = SESSION_TYPES[sessionKey]
  const daysSince = daysSinceLastSession(sessions)
  let exs = buildExercises(t.focus, t.style, sessions)
  if (daysSince > 3) {
    exs = applyRecoveryAdjustment(exs, recovery, daysSince)
  }
  if (useDeload) exs = applyDeloadAdjustment(exs)
  const muscleGroups = [...new Set(exs.map(e => e.group))]
  return {
    id: `${new Date().toISOString().slice(0, 10)}_${sessionKey}_${Date.now()}`,
    date: new Date().toISOString(),
    type: t.name,
    sessionKey,
    split: t.split,
    focus: t.focus,
    style: t.style,
    muscleGroups,
    plannedVolume: exs.reduce((s, e) => s + e.sets, 0),
    exercises: exs,
    completed: false,
    restOK: true,
    note: null,
  }
}

export function estimateDuration(session: Session): number {
  let total = 0
  for (const ex of session.exercises) {
    total += ex.sets * (ex.restSeconds + 30)
  }
  return Math.round(total / 60)
}
