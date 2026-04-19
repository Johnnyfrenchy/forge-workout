import { EXERCISES } from '../data/exercises'
import { computeProgression } from './progression'
import type { Session, ExerciseEntry, LoggedExercise } from '../data/constants'

const TIMED_ISOS = ['plank', 'side_plank', 'dead_bug', 'bird_dog', 'pallof']

const MAIN_GROUPS_BY_FOCUS: Record<string, string[]> = {
  upper: ['Chest', 'Back', 'Shoulders'],
  lower: ['Quads', 'Hamstrings', 'Glutes'],
  push:  ['Chest', 'Shoulders'],
  pull:  ['Back'],
  legs:  ['Quads', 'Hamstrings', 'Glutes'],
  full:  ['Chest', 'Back', 'Quads'],
}

const GROUPS_BY_FOCUS: Record<string, string[]> = {
  upper: ['Chest', 'Back', 'Shoulders', 'Triceps', 'Biceps'],
  lower: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
  push:  ['Chest', 'Shoulders', 'Triceps'],
  pull:  ['Back', 'Biceps'],
  legs:  ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
  full:  ['Chest', 'Back', 'Quads', 'Hamstrings', 'Shoulders'],
}

export function getGroupsForFocus(focus: string): string[] {
  return GROUPS_BY_FOCUS[focus] || []
}

export function pickRotating(
  pool: typeof EXERCISES,
  group: string,
  sessions: Session[],
  tier: string,
): typeof EXERCISES[0] | null {
  if (pool.length === 0) return null
  if (pool.length === 1) return pool[0]
  const recentSessions = sessions.filter(s => s.completed).slice(-5)
  const recentIds = new Set<string>()
  for (const s of recentSessions) {
    for (const ex of (s.exercises || [])) {
      const def = EXERCISES.find(e => e.id === ex.id)
      if (def && def.group === group && def.tier === tier) recentIds.add(ex.id)
    }
  }
  const unused = pool.filter(e => !recentIds.has(e.id))
  return unused.length > 0 ? unused[0] : pool[0]
}

export function findLastExerciseLog(sessions: Session[], exerciseId: string): LoggedExercise | null {
  const completed = sessions.filter(s => s.completed).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  for (const s of completed) {
    const ex = (s.loggedExercises || []).find(e => e.id === exerciseId)
    if (ex) return ex
  }
  return null
}

export function buildExerciseEntry(
  exerciseDef: typeof EXERCISES[0],
  style: 'heavy' | 'hyper',
  sessions: Session[],
  focus: string,
): ExerciseEntry {
  const lastLog = findLastExerciseLog(sessions, exerciseDef.id)

  let sets: number, repsTarget: string, restSeconds: number, rpeTarget: number, repUnit: 'reps' | 'sec'

  if (exerciseDef.group === 'Core') {
    if (TIMED_ISOS.includes(exerciseDef.id)) {
      sets = 3
      repsTarget = exerciseDef.id === 'plank' ? '30-60' : '20-40'
      restSeconds = 45
      rpeTarget = 8
      repUnit = 'sec'
    } else {
      sets = 3; repsTarget = '10-15'; restSeconds = 60; rpeTarget = 8; repUnit = 'reps'
    }
  } else if (style === 'heavy') {
    if (exerciseDef.tier === 'primary') {
      sets = 4; repsTarget = '5-6'; restSeconds = 180; rpeTarget = 8.5
    } else {
      sets = 4; repsTarget = '6-8'; restSeconds = 150; rpeTarget = 8
    }
    repUnit = 'reps'
  } else {
    if (exerciseDef.tier === 'secondary') {
      sets = 3; repsTarget = '8-12'; restSeconds = 90; rpeTarget = 8
    } else {
      sets = 3
      repsTarget = (focus === 'lower' || focus === 'legs') ? '10-15' : '10-12'
      restSeconds = 60; rpeTarget = 7.5
    }
    repUnit = 'reps'
  }

  const progression = computeProgression(lastLog, repsTarget, sets)

  return {
    id: exerciseDef.id,
    name: exerciseDef.name,
    group: exerciseDef.group,
    role: exerciseDef.role,
    tier: exerciseDef.tier,
    sets,
    repsTarget,
    repUnit,
    restSeconds,
    rpeTarget,
    suggestedWeight: progression.suggestedWeight,
    progressionNote: progression.note,
    lastSession: lastLog ? {
      weight: lastLog.weight,
      reps: lastLog.reps,
      rpe: lastLog.rpe,
    } : null,
    notes: '',
  }
}

export function buildExercises(focus: string, style: 'heavy' | 'hyper', sessions: Session[], excludedGroups: string[] = []): ExerciseEntry[] {
  const groups = getGroupsForFocus(focus).filter(g => !excludedGroups.includes(g))
  const mainGroups = (MAIN_GROUPS_BY_FOCUS[focus] || []).filter(g => !excludedGroups.includes(g))
  const result: ExerciseEntry[] = []

  for (const group of groups) {
    const pool = EXERCISES.filter(e => e.group === group)
    if (pool.length === 0) continue

    const byTier = (t: string) => pool.filter(e => e.tier === t)

    if (style === 'heavy') {
      const first = pickRotating(byTier('primary'), group, sessions, 'primary')
                 ?? pickRotating(byTier('secondary'), group, sessions, 'secondary')
                 ?? pickRotating(byTier('accessory'), group, sessions, 'accessory')
      if (first) result.push(buildExerciseEntry(first, style, sessions, focus))

      if (mainGroups.includes(group)) {
        const candidates = [
          ...byTier('secondary').filter(e => e.id !== first?.id),
          ...byTier('accessory').filter(e => e.id !== first?.id),
        ]
        if (candidates.length > 0) {
          const second = pickRotating(candidates, group, sessions, 'secondary')
          if (second) result.push(buildExerciseEntry(second, style, sessions, focus))
        }
      }
    } else {
      const secondary = pickRotating(byTier('secondary'), group, sessions, 'secondary')
      const accessory  = pickRotating(byTier('accessory'), group, sessions, 'accessory')
      if (secondary) result.push(buildExerciseEntry(secondary, style, sessions, focus))
      if (accessory && accessory.id !== secondary?.id) result.push(buildExerciseEntry(accessory, style, sessions, focus))
      if (!secondary && !accessory) {
        const primary = pickRotating(byTier('primary'), group, sessions, 'primary')
        if (primary) result.push(buildExerciseEntry(primary, style, sessions, focus))
      }
    }
  }

  const maxExos = focus === 'full' ? 8 : (focus === 'lower' || focus === 'legs') ? 7 : 8
  const capped = result.slice(0, maxExos)

  // Core finisher
  const corePool = EXERCISES.filter(e => e.group === 'Core')
  const coreTier = style === 'heavy' ? 'primary' : 'secondary'
  const coreEx = pickRotating(corePool.filter(e => e.tier === coreTier), 'Core', sessions, coreTier) ?? corePool[0]
  if (coreEx) capped.push(buildExerciseEntry(coreEx, 'hyper', sessions, focus))

  return capped
}
