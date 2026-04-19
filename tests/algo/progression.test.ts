import { describe, it, expect } from 'vitest'
import { computeProgression } from '../../src/algo/progression'
import { makeLoggedEx } from '../helpers'

describe('computeProgression', () => {
  it('returns no weight suggestion for first time', () => {
    const res = computeProgression(null, '5-6', 4)
    expect(res.suggestedWeight).toBeNull()
    expect(res.note).toMatch(/première/i)
  })

  it('increments weight when all reps hit top + RPE ok', () => {
    const last = makeLoggedEx({ weight: 80, reps: [6, 6, 6, 6], rpe: 8 })
    const res = computeProgression(last, '5-6', 4)
    expect(res.suggestedWeight).toBe(82.5)
    expect(res.note).toMatch(/\+2\.5/)
  })

  it('uses 1.25kg step when weight < 60kg', () => {
    const last = makeLoggedEx({ weight: 40, reps: [6, 6, 6, 6], rpe: 7 })
    const res = computeProgression(last, '5-6', 4)
    expect(res.suggestedWeight).toBe(41.25)
  })

  it('holds weight when RPE too high', () => {
    const last = makeLoggedEx({ weight: 80, reps: [6, 6, 6, 6], rpe: 9 })
    const res = computeProgression(last, '5-6', 4)
    expect(res.suggestedWeight).toBe(80)
    expect(res.note).toMatch(/hold/i)
  })

  it('holds weight when reps below top', () => {
    const last = makeLoggedEx({ weight: 80, reps: [5, 5, 5, 5], rpe: 8 })
    const res = computeProgression(last, '5-6', 4)
    expect(res.suggestedWeight).toBe(80)
    expect(res.note).toMatch(/\+1 rep/i)
  })
})
