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

/**
 * Bug critique #1 — Reprise progressive
 *
 * Rules (cumulative — duration overrides status when stricter):
 *   3–7 days  : honour user's recovery choice (good/medium/poor), no weight change
 *   7–21 days : min vol ×0.8, weight suggestion ×0.85 regardless of status
 *   >21 days  : vol ×0.6, weight suggestion ×0.60 (treat as fresh start)
 */
export function applyRecoveryAdjustment(
  exercises: ExerciseEntry[],
  recoveryStatus: RecoveryStatus,
  daysSince = 0,
): ExerciseEntry[] {
  const statusVolMult = recoveryStatus === 'poor' ? 0.7 : recoveryStatus === 'medium' ? 0.8 : 1.0

  // Duration-based overrides (stricter than status when applicable)
  const durationVolMult = daysSince > 21 ? 0.6 : daysSince > 7 ? 0.8 : 1.0
  const weightMult      = daysSince > 21 ? 0.6 : daysSince > 7 ? 0.85 : 1.0

  const volMult = Math.min(statusVolMult, durationVolMult)

  // No change for good recovery within a week
  if (volMult === 1.0 && weightMult === 1.0) return exercises

  const durationNote =
    daysSince > 21
      ? `⚠ Reprise après ${Math.round(daysSince)}j — poids -40%`
      : daysSince > 7
        ? `↓ Reprise après ${Math.round(daysSince)}j — poids -15%`
        : ''

  return exercises.map(ex => {
    const newWeight =
      ex.suggestedWeight && weightMult < 1
        ? Math.round((ex.suggestedWeight * weightMult) / 2.5) * 2.5
        : ex.suggestedWeight

    return {
      ...ex,
      sets: Math.max(2, Math.round(ex.sets * volMult)),
      suggestedWeight: newWeight,
      progressionNote: durationNote || ex.progressionNote,
      recoveryAdjusted: true,
    }
  })
}

export function applyDeloadAdjustment(exercises: ExerciseEntry[]): ExerciseEntry[] {
  return exercises.map(ex => ({
    ...ex,
    sets: Math.max(2, Math.round(ex.sets * 0.6)),
    deloadAdjusted: true,
    suggestedWeight: ex.suggestedWeight ? Math.round(ex.suggestedWeight * 0.8 / 2.5) * 2.5 : null,
    progressionNote: '🔄 Deload — -40% vol, -20% poids',
  }))
}
