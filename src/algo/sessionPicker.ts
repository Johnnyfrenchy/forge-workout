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

export function pickNextSessionType(sessions: Session[], split: string): ScoredSession {
  const completed = sessions.filter(s => s.completed).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const last = completed[0]
  const lastStyle = last?.type || null
  const lastFocus = last ? deriveFocus(last) : null

  const candidates = Object.entries(SESSION_TYPES)
    .filter(([, v]) => v.split === split)
    .map(([k, v]) => ({ key: k, ...v }))

  const freqMap = groupFrequencyMap(sessions, 30)

  const scored: ScoredSession[] = candidates.map(c => {
    const groups = groupsForFocus(c.focus)
    const minHours = Math.min(...groups.map(g => hoursSinceGroupTrained(sessions, g)))
    const restOK = minHours >= 48

    const avgFreq = groups.reduce((sum, g) => sum + (freqMap[g] || 0), 0) / Math.max(1, groups.length)

    const alternationBonus = (lastFocus === c.focus && lastStyle === c.style) ? -10 : 5
    const focusBonus = (lastFocus === c.focus) ? -5 : 10

    let score = 0
    if (!restOK) score -= 1000
    score -= avgFreq * 2
    score += alternationBonus
    score += focusBonus

    return { ...c, score, restOK, avgFreq }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored[0]
}
