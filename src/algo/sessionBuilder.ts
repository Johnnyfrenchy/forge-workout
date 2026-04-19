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

  if (split === SPLITS.MAINTENANCE) {
    return {
      id: `${new Date().toISOString().slice(0, 10)}_maintenance`,
      date: new Date().toISOString(),
      type: 'maintenance',
      name: 'Maintenance / Light',
      split,
      muscleGroups: [],
      exercises: [],
      completed: false,
      note: 'Fréquence <2/sem — reprends doucement. Pas de séance imposée.',
    } as any
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
  if (daysSinceLastSession(sessions) > 3 && recovery !== 'good') {
    exercises = applyRecoveryAdjustment(exercises, recovery)
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
    note: picked.restOK ? null : '⚠ Certains groupes <48h de récup, propose reste ou alternative',
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
  let exs = buildExercises(t.focus, t.style, sessions)
  if (daysSinceLastSession(sessions) > 3 && recovery !== 'good') {
    exs = applyRecoveryAdjustment(exs, recovery)
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
