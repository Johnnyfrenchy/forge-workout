import { describe, it, expect } from 'vitest'
import { computeFrequency, pickSplit } from '../../src/algo/frequency'
import { SPLITS } from '../../src/data/constants'
import { makeSession, daysAgoISO, DEFAULT_SETTINGS } from '../helpers'

describe('computeFrequency', () => {
  it('returns 0 when no sessions', () => {
    expect(computeFrequency([])).toBe(0)
  })

  it('counts only completed sessions within window', () => {
    const sessions = [
      makeSession({ date: daysAgoISO(1), completed: true }),
      makeSession({ date: daysAgoISO(3), completed: true }),
      makeSession({ date: daysAgoISO(5), completed: true }),
      makeSession({ date: daysAgoISO(8), completed: true }),
      makeSession({ date: daysAgoISO(20), completed: true }), // outside 14d
      makeSession({ date: daysAgoISO(2),  completed: false }), // uncompleted
    ]
    expect(computeFrequency(sessions, 14)).toBe(2) // 4 sessions / 2 weeks
  })
})

describe('pickSplit', () => {
  it('bootstraps from seedTarget when history < 14 days', () => {
    const sessions = [makeSession({ date: daysAgoISO(3) })]
    expect(pickSplit(sessions, 4, DEFAULT_SETTINGS)).toBe(SPLITS.UPPER_LOWER)
    expect(pickSplit(sessions, 3, DEFAULT_SETTINGS)).toBe(SPLITS.PPL)
    expect(pickSplit(sessions, 2, DEFAULT_SETTINGS)).toBe(SPLITS.FULL_BODY)
    expect(pickSplit(sessions, 1, DEFAULT_SETTINGS)).toBe(SPLITS.MAINTENANCE)
  })

  it('uses computed frequency when history >= 14 days', () => {
    const sessions = [
      ...Array.from({ length: 8 }, (_, i) => makeSession({ date: daysAgoISO(i + 1) })),
      makeSession({ date: daysAgoISO(30) }),
    ]
    expect(pickSplit(sessions, 2, DEFAULT_SETTINGS)).toBe(SPLITS.UPPER_LOWER) // 4/wk
  })

  it('falls back to MAINTENANCE when freq < 1.5', () => {
    const sessions = [
      makeSession({ date: daysAgoISO(10) }),
      makeSession({ date: daysAgoISO(30) }),
    ]
    expect(pickSplit(sessions, 0, DEFAULT_SETTINGS)).toBe(SPLITS.MAINTENANCE)
  })
})
