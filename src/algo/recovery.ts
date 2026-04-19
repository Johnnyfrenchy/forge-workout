import type { Session, ExerciseEntry } from '../data/constants'

export function daysSinceLastSession(sessions: Session[]): number {
  const completed = sessions.filter(s => s.completed)
  if (completed.length === 0) return Infinity
  const last = completed.reduce((acc, s) => {
    const t = new Date(s.date).getTime()
    return t > acc ? t : acc
  }, 0)
  return (Date.now() - last) / (24 * 60 * 60 * 1000)
}

export type RecoveryStatus = 'good' | 'medium' | 'poor'

export function applyRecoveryAdjustment(exercises: ExerciseEntry[], recoveryStatus: RecoveryStatus): ExerciseEntry[] {
  if (recoveryStatus === 'good') return exercises
  const volMultiplier = recoveryStatus === 'medium' ? 0.8 : 0.7
  return exercises.map(ex => ({
    ...ex,
    sets: Math.max(2, Math.round(ex.sets * volMultiplier)),
    recoveryAdjusted: true,
  }))
}

export function applyDeloadAdjustment(exercises: ExerciseEntry[]): ExerciseEntry[] {
  return exercises.map(ex => ({
    ...ex,
    sets: Math.max(2, Math.round(ex.sets * 0.6)),
    deloadAdjusted: true,
    suggestedWeight: ex.suggestedWeight ? Math.round(ex.suggestedWeight * 0.8 / 2.5) * 2.5 : null,
  }))
}
