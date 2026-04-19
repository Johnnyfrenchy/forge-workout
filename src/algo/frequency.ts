import { SPLITS } from '../data/constants'
import { groupSessionsByWeek } from './deload'
import type { Session, Settings } from '../data/constants'

export function computeFrequency(sessions: Session[], days = 14): number {
  if (!sessions || sessions.length === 0) return 0
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const recent = sessions.filter(s => new Date(s.date).getTime() >= cutoff && s.completed)
  return recent.length / (days / 7)
}

export function pickSplit(sessions: Session[], seedTarget: number, _settings?: Settings): string {
  const oldestSession = sessions.reduce<number | null>((acc, s) => {
    const t = new Date(s.date).getTime()
    return acc === null || t < acc ? t : acc
  }, null)
  const historyDays = oldestSession ? (Date.now() - oldestSession) / (24 * 60 * 60 * 1000) : 0

  const effectiveFreq = historyDays < 14 && seedTarget
    ? seedTarget
    : computeFrequency(sessions, 14)

  if (effectiveFreq >= 3.5) return SPLITS.UPPER_LOWER
  if (effectiveFreq >= 2.5) return SPLITS.PPL
  if (effectiveFreq >= 1.5) return SPLITS.FULL_BODY
  return SPLITS.MAINTENANCE
}

/**
 * Bug modéré #1 — Détection de mésocycle
 * Retourne le nombre de semaines consécutives sur le même split.
 * active = true si ≥ 4 semaines (signal de renouvellement).
 */
export function detectMesocycle(sessions: Session[]): { active: boolean; weeks: number; split: string | null } {
  const byWeek = groupSessionsByWeek(sessions)
  const weekEntries = Object.entries(byWeek).sort((a, b) => b[0].localeCompare(a[0])) // recent first

  if (weekEntries.length === 0) return { active: false, weeks: 0, split: null }

  const recentSplit = weekEntries[0][1][0]?.split ?? null
  if (!recentSplit) return { active: false, weeks: 0, split: null }

  let count = 0
  for (const [, wSessions] of weekEntries) {
    if (wSessions.every(s => s.split === recentSplit)) count++
    else break
  }

  return { active: count >= 4, weeks: count, split: recentSplit }
}
