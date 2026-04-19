import { describe, it, expect } from 'vitest'
import { applyRecoveryAdjustment, applyDeloadAdjustment } from '../../src/algo/recovery'
import type { ExerciseEntry } from '../../src/data/constants'

function makeEx(overrides: Partial<ExerciseEntry> = {}): ExerciseEntry {
  return {
    id: 'bb_bench', name: 'Bench', group: 'Chest',
    role: 'compound', tier: 'primary',
    sets: 4, repsTarget: '5-6', repUnit: 'reps',
    restSeconds: 180, rpeTarget: 8,
    suggestedWeight: 80, progressionNote: '', lastSession: null, notes: '',
    ...overrides,
  }
}

describe('applyRecoveryAdjustment', () => {
  it('no change when good recovery within 7 days', () => {
    const res = applyRecoveryAdjustment([makeEx()], 'good', 4)
    expect(res[0].sets).toBe(4)
    expect(res[0].suggestedWeight).toBe(80)
  })

  it('reduces volume for medium recovery (3–7 days)', () => {
    const res = applyRecoveryAdjustment([makeEx()], 'medium', 4)
    expect(res[0].sets).toBe(3) // 4 × 0.8
    expect(res[0].suggestedWeight).toBe(80) // weight unchanged <7 days
  })

  it('reduces volume for poor recovery', () => {
    const res = applyRecoveryAdjustment([makeEx()], 'poor', 4)
    expect(res[0].sets).toBe(3) // 4 × 0.7 → 2.8 → 3
  })

  it('reduces weight after 7+ days even on good recovery', () => {
    const res = applyRecoveryAdjustment([makeEx()], 'good', 10)
    expect(res[0].suggestedWeight).toBe(67.5) // 80 × 0.85 rounded to nearest 2.5
    expect(res[0].sets).toBe(3)               // 4 × 0.8
  })

  it('resets weight heavily after 21+ days', () => {
    const res = applyRecoveryAdjustment([makeEx()], 'good', 25)
    expect(res[0].suggestedWeight).toBe(47.5) // 80 × 0.6 = 48 → 47.5 (nearest 2.5)
    expect(res[0].sets).toBe(2)               // 4 × 0.6 → 2.4 → max(2, 2)
  })

  it('uses stricter of status vs duration (21 days + poor)', () => {
    const res = applyRecoveryAdjustment([makeEx()], 'poor', 25)
    expect(res[0].sets).toBe(2) // min(0.7, 0.6) × 4 = 2.4 → max(2,2)
  })

  it('sets recoveryAdjusted flag', () => {
    const res = applyRecoveryAdjustment([makeEx()], 'medium', 5)
    expect(res[0].recoveryAdjusted).toBe(true)
  })
})

describe('applyDeloadAdjustment', () => {
  it('reduces sets by 40% and weight by 20%', () => {
    const res = applyDeloadAdjustment([makeEx()])
    expect(res[0].sets).toBe(2)              // 4 × 0.6 = 2.4 → max(2, 2)
    expect(res[0].suggestedWeight).toBe(65) // 80 × 0.8 = 64 → rounded to 65 (nearest 2.5)
  })

  it('sets deloadAdjusted flag', () => {
    const res = applyDeloadAdjustment([makeEx()])
    expect(res[0].deloadAdjusted).toBe(true)
  })
})
