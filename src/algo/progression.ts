import type { LoggedExercise } from '../data/constants'

export interface ProgressionResult {
  suggestedWeight: number | null
  note: string
}

export function computeProgression(lastLog: LoggedExercise | null, repsTarget: string, _sets: number): ProgressionResult {
  if (!lastLog) {
    return { suggestedWeight: null, note: 'Première fois — choisis charge technique' }
  }

  const parts = repsTarget.split('-').map(Number)
  const high = parts[1] ?? parts[0]
  const reps = lastLog.reps || []
  const allHitHigh = reps.length > 0 && reps.every(r => r >= high)
  const avgRpe = lastLog.rpe ?? 7

  const weightIncrement = (lastLog.weight ?? 0) >= 60 ? 2.5 : 1.25

  if (allHitHigh && avgRpe <= 8) {
    return {
      suggestedWeight: (lastLog.weight ?? 0) + weightIncrement,
      note: `+${weightIncrement}kg (top du range atteint, RPE OK)`,
    }
  }
  if (avgRpe > 8.5) {
    return {
      suggestedWeight: lastLog.weight,
      note: 'Hold charge (RPE élevé dernière séance)',
    }
  }
  return {
    suggestedWeight: lastLog.weight,
    note: 'Hold charge, vise +1 rep cette séance',
  }
}
