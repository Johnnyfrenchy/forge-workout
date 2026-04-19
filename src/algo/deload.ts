import type { Session, Settings } from '../data/constants'

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export function groupSessionsByWeek(sessions: Session[]): Record<string, Session[]> {
  const map: Record<string, Session[]> = {}
  for (const s of sessions) {
    if (!s.completed) continue
    const d = new Date(s.date)
    const key = `${d.getFullYear()}-W${getWeekNumber(d)}`
    ;(map[key] = map[key] || []).push(s)
  }
  return map
}

export function getWeekNumber2(d: Date): number {
  return getWeekNumber(d)
}

function weekScore(weekSessions: Session[]): number {
  const validSessions = weekSessions.filter(s => {
    const exs = s.loggedExercises || []
    return exs.some(e => e.rpe !== null)
  })
  if (validSessions.length === 0) return 0
  const avgRpe = validSessions.reduce((sum, s) => {
    const exs = s.loggedExercises || []
    const rpes = exs.map(e => e.rpe).filter((r): r is number => r !== null)
    const sessionAvg = rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : 0
    return sum + sessionAvg
  }, 0) / validSessions.length
  return validSessions.length * avgRpe
}

export function shouldProposeDeload(sessions: Session[], settings: Settings): boolean {
  if (!settings.adaptiveDeload) return false
  const byWeek = groupSessionsByWeek(sessions)
  const weeks = Object.values(byWeek).slice(-4)
  if (weeks.length < 3) return false

  const lastThree = weeks.slice(-3)
  const highLoadWeeks = lastThree.filter(w => {
    const validSessions = w.filter(s => (s.loggedExercises || []).some(e => e.rpe !== null))
    if (validSessions.length < 3) return false
    const avgRpe = validSessions.reduce((sum, s) => {
      const exs = s.loggedExercises || []
      const rpes = exs.map(e => e.rpe).filter((r): r is number => r !== null)
      return sum + (rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : 0)
    }, 0) / validSessions.length
    return avgRpe >= 8
  })

  return highLoadWeeks.length >= 3
}

export function weekVolume(weekSessions: Session[]): number {
  return weekSessions.reduce((sum, s) => {
    const exs = s.loggedExercises || []
    return sum + exs.reduce((a, e) => a + (e.reps || []).reduce((x, r) => x + r, 0) * (e.weight || 0), 0)
  }, 0)
}
