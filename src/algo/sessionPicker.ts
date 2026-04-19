import { SPLIT_GROUPS } from '../data/constants'
import { SESSION_TYPES } from '../data/sessionTypes'
import type { Session } from '../data/constants'

export function hoursSinceGroupTrained(sessions: Session[], group: string): number {
  const completed = sessions.filter(s => s.completed)
  let mostRecent = 0
  for (const s of completed) {
    if ((s.muscleGroups || []).includes(group)) {
      const t = new Date(s.date).getTime()
      if (t > mostRecent) mostRecent = t
    }
  }
  if (mostRecent === 0) return Infinity
  return (Date.now() - mostRecent) / (60 * 60 * 1000)
}

export function groupFrequencyMap(sessions: Session[], days = 30): Record<string, number> {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const map: Record<string, number> = {}
  for (const g of [...SPLIT_GROUPS.UPPER, ...SPLIT_GROUPS.LOWER, 'Core']) map[g] = 0
  for (const s of sessions) {
    if (!s.completed) continue
    if (new Date(s.date).getTime() < cutoff) continue
    for (const g of (s.muscleGroups || [])) {
      map[g] = (map[g] || 0) + 1
    }
  }
  return map
}

export function groupsForFocus(focus: string): readonly string[] {
  switch (focus) {
    case 'upper': return SPLIT_GROUPS.UPPER
    case 'lower': return SPLIT_GROUPS.LOWER
    case 'push':  return SPLIT_GROUPS.PUSH
    case 'pull':  return SPLIT_GROUPS.PULL
    case 'legs':  return SPLIT_GROUPS.LEGS
    case 'full':  return SPLIT_GROUPS.FULL
    default: return []
  }
}

export function deriveFocus(session: Session): string {
  const groups = session.muscleGroups || []
  if (groups.some(g => (SPLIT_GROUPS.LOWER as readonly string[]).includes(g))) {
    if (groups.some(g => (SPLIT_GROUPS.UPPER as readonly string[]).includes(g))) return 'full'
    return 'lower'
  }
  if (groups.some(g => (SPLIT_GROUPS.PUSH as readonly string[]).includes(g)) && !groups.some(g => (SPLIT_GROUPS.PULL as readonly string[]).includes(g))) return 'push'
  if (groups.some(g => (SPLIT_GROUPS.PULL as readonly string[]).includes(g)) && !groups.some(g => (SPLIT_GROUPS.PUSH as readonly string[]).includes(g))) return 'pull'
  return 'upper'
}

/** Average RPE across all logged exercises of a session */
function sessionAvgRpe(session: Session | undefined): number | null {
  if (!session) return null
  const exs = session.loggedExercises || []
  const rpes = exs.map(e => e.rpe).filter((r): r is number => r !== null)
  return rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : null
}

export interface ScoredSession {
  key: string
  name: string
  split: string
  focus: string
  style: 'heavy' | 'hyper'
  score: number
  restOK: boolean
  avgFreq: number
}

/**
 * Bug critique #2 — RPE scoring
 *
 * Added:
 * - lastAvgRpe from last session's loggedExercises
 * - If lastAvgRpe ≥ 9 AND same focus → extra -20 penalty (fatigue same group)
 * - If lastAvgRpe ≥ 9 overall → boost rest (preferring different focus) by +10
 * - Style alternation bonus corrected: same focus+style = -10, same focus diff style = +2, diff focus = +12
 */
export function pickNextSessionType(sessions: Session[], split: string): ScoredSession {
  const completed = sessions
    .filter(s => s.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const last = completed[0]
  const lastStyle = last?.type || null
  const lastFocus = last ? deriveFocus(last) : null
  const lastAvgRpe = sessionAvgRpe(last)
  const lastHighRpe = lastAvgRpe !== null && lastAvgRpe >= 9

  const candidates = Object.entries(SESSION_TYPES)
    .filter(([, v]) => v.split === split)
    .map(([k, v]) => ({ key: k, ...v }))

  const freqMap = groupFrequencyMap(sessions, 30)

  const scored: ScoredSession[] = candidates.map(c => {
    const groups = groupsForFocus(c.focus)
    const minHours = Math.min(...groups.map(g => hoursSinceGroupTrained(sessions, g)))
    const restOK = minHours >= 48

    const avgFreq = groups.reduce((sum, g) => sum + (freqMap[g] || 0), 0) / Math.max(1, groups.length)

    // Style alternation scoring
    const sameFocusSameStyle = lastFocus === c.focus && lastStyle === c.style
    const sameFocusDiffStyle = lastFocus === c.focus && lastStyle !== c.style
    const alternationBonus = sameFocusSameStyle ? -10 : sameFocusDiffStyle ? 2 : 12

    // RPE fatigue penalty — if last session was brutal on same focus, back off
    const rpeFatiguePenalty = lastHighRpe && lastFocus === c.focus ? -20 : 0
    // If globally high RPE, reward switching focus
    const rpeAlternationReward = lastHighRpe && lastFocus !== c.focus ? 10 : 0

    let score = 0
    if (!restOK) score -= 1000
    score -= avgFreq * 2
    score += alternationBonus
    score += rpeFatiguePenalty
    score += rpeAlternationReward

    return { ...c, score, restOK, avgFreq }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored[0]
}
