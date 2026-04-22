// tests/algo/recovery.onboarding.test.ts
//
// Tests unitaires pour applyOnboardingRamp.
// Framework : Vitest

import { describe, it, expect } from 'vitest'
import {
  applyOnboardingRamp,
  isOnboarding,
  getOnboardingPhase,
  getOnboardingProgress,
} from '../../src/algo/recovery'
import type { ExerciseEntry } from '../../src/data/constants'

// ─────────────────────────────────────────────────────────────────
//  FIXTURE
// ─────────────────────────────────────────────────────────────────

const makeExercise = (overrides: Partial<ExerciseEntry> = {}): ExerciseEntry => ({
  id:            'bb_squat',
  name:          'Barbell Squat',
  group:         'Quads',
  role:          'compound',
  tier:          'primary',
  equipment:     'barbell',
  style:         'heavy',
  sets:          4,
  repsTarget:    '5-6',
  repUnit:       'reps',
  restSeconds:   180,
  rpeTarget:     8.5,
  suggestedWeight: null,
  lastSession:   null,
  notes:         '',
  ...overrides,
})

// ─────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────

describe('isOnboarding', () => {
  it('returns true for sessions 0–11', () => {
    for (let i = 0; i < 12; i++) expect(isOnboarding(i)).toBe(true)
  })

  it('returns false at session 12 and beyond', () => {
    expect(isOnboarding(12)).toBe(false)
    expect(isOnboarding(50)).toBe(false)
  })
})

describe('getOnboardingPhase', () => {
  it('returns phase 0 for sessions 0-2', () => {
    expect(getOnboardingPhase(0)).toBe(0)
    expect(getOnboardingPhase(2)).toBe(0)
  })

  it('returns phase 1 for sessions 3-5', () => {
    expect(getOnboardingPhase(3)).toBe(1)
    expect(getOnboardingPhase(5)).toBe(1)
  })

  it('returns phase 2 for sessions 6-8', () => {
    expect(getOnboardingPhase(6)).toBe(2)
  })

  it('returns phase 3 for sessions 9-11', () => {
    expect(getOnboardingPhase(9)).toBe(3)
    expect(getOnboardingPhase(11)).toBe(3)
  })

  it('returns null beyond onboarding', () => {
    expect(getOnboardingPhase(12)).toBeNull()
  })
})

describe('getOnboardingProgress', () => {
  it('returns 0 at session 0', () => {
    expect(getOnboardingProgress(0)).toBe(0)
  })

  it('returns 50 at session 6', () => {
    expect(getOnboardingProgress(6)).toBe(50)
  })

  it('caps at 100', () => {
    expect(getOnboardingProgress(99)).toBe(100)
  })
})

// ─────────────────────────────────────────────────────────────────
//  CORE LOGIC
// ─────────────────────────────────────────────────────────────────

describe('applyOnboardingRamp — no-op beyond onboarding', () => {
  it('returns exercises unchanged at completedCount >= 12', () => {
    const exercises = [makeExercise()]
    const result    = applyOnboardingRamp(exercises, 12)
    expect(result[0].sets).toBe(4)
    expect(result[0].rpeTarget).toBe(8.5)
    expect(result[0].repsTarget).toBe('5-6')
    expect(result[0].progressionNote).toBeUndefined()
  })
})

describe('applyOnboardingRamp — Phase 0 (sessions 1-3, completedCount 0-2)', () => {
  it('caps primary sets at 2', () => {
    const result = applyOnboardingRamp([makeExercise({ tier: 'primary', sets: 4 })], 0)
    expect(result[0].sets).toBe(2)
  })

  it('reduces RPE by 2.5 (heavy 8.5 → 6.0)', () => {
    const result = applyOnboardingRamp([makeExercise({ rpeTarget: 8.5 })], 0)
    expect(result[0].rpeTarget).toBe(6.0)
  })

  it('overrides heavy reps 5-6 → 8-10', () => {
    const result = applyOnboardingRamp([makeExercise({ style: 'heavy', repsTarget: '5-6' })], 0)
    expect(result[0].repsTarget).toBe('8-10')
  })

  it('overrides heavy reps 6-8 → 8-12', () => {
    const result = applyOnboardingRamp([makeExercise({ style: 'heavy', repsTarget: '6-8' })], 0)
    expect(result[0].repsTarget).toBe('8-12')
  })

  it('does NOT override reps for hyper style', () => {
    const result = applyOnboardingRamp(
      [makeExercise({ style: 'hyper', repsTarget: '8-12', rpeTarget: 8.0 })], 0
    )
    expect(result[0].repsTarget).toBe('8-12')
  })

  it('does not go below RPE floor 5.5', () => {
    const result = applyOnboardingRamp([makeExercise({ rpeTarget: 6.0 })], 0)
    expect(result[0].rpeTarget).toBeGreaterThanOrEqual(5.5)
  })

  it('attaches a progressionNote mentioning séance 1/12', () => {
    const result = applyOnboardingRamp([makeExercise()], 0)
    expect(result[0].progressionNote).toMatch(/Séance 1\/12/)
    expect(result[0].progressionNote).toMatch(/Phase 1\/4/)
  })

  it('sets onboardingAdjusted flag', () => {
    const result = applyOnboardingRamp([makeExercise()], 0)
    expect(result[0].onboardingAdjusted).toBe(true)
  })
})

describe('applyOnboardingRamp — Phase 1 (sessions 4-6, completedCount 3-5)', () => {
  it('still overrides heavy reps in phase 1', () => {
    const result = applyOnboardingRamp([makeExercise({ style: 'heavy', repsTarget: '5-6' })], 3)
    expect(result[0].repsTarget).toBe('8-10')
  })

  it('reduces RPE by 2.0', () => {
    const result = applyOnboardingRamp([makeExercise({ rpeTarget: 8.5 })], 3)
    expect(result[0].rpeTarget).toBeCloseTo(6.5)
  })
})

describe('applyOnboardingRamp — Phase 2 (sessions 7-9, completedCount 6-8)', () => {
  it('allows up to 3 sets for primary', () => {
    const result = applyOnboardingRamp([makeExercise({ tier: 'primary', sets: 4 })], 6)
    expect(result[0].sets).toBe(3)
  })

  it('does NOT override heavy reps anymore in phase 2+', () => {
    const result = applyOnboardingRamp([makeExercise({ style: 'heavy', repsTarget: '5-6' })], 6)
    expect(result[0].repsTarget).toBe('5-6')
  })

  it('reduces RPE by 1.0 (8.5 → 7.5)', () => {
    const result = applyOnboardingRamp([makeExercise({ rpeTarget: 8.5 })], 6)
    expect(result[0].rpeTarget).toBeCloseTo(7.5)
  })
})

describe('applyOnboardingRamp — Phase 3 (sessions 10-12, completedCount 9-11)', () => {
  it('allows up to 4 sets for primary (nominal)', () => {
    const result = applyOnboardingRamp([makeExercise({ tier: 'primary', sets: 4 })], 9)
    expect(result[0].sets).toBe(4)
  })

  it('reduces RPE by only 0.5 (8.5 → 8.0)', () => {
    const result = applyOnboardingRamp([makeExercise({ rpeTarget: 8.5 })], 9)
    expect(result[0].rpeTarget).toBeCloseTo(8.0)
  })

  it('attaches a progressionNote mentioning Phase 4/4', () => {
    const result = applyOnboardingRamp([makeExercise()], 9)
    expect(result[0].progressionNote).toMatch(/Phase 4\/4/)
  })
})

describe('applyOnboardingRamp — secondary tier', () => {
  it('caps secondary sets at 2 in phase 0 and 1', () => {
    const ex = makeExercise({ tier: 'secondary', sets: 3, rpeTarget: 8.0 })
    expect(applyOnboardingRamp([ex], 0)[0].sets).toBe(2)
    expect(applyOnboardingRamp([ex], 3)[0].sets).toBe(2)
  })

  it('allows 3 sets secondary from phase 2', () => {
    const ex = makeExercise({ tier: 'secondary', sets: 3, rpeTarget: 8.0 })
    expect(applyOnboardingRamp([ex], 6)[0].sets).toBe(3)
  })

  it('caps secondary at 3 even in phase 3 (not 4)', () => {
    const ex = makeExercise({ tier: 'secondary', sets: 4, rpeTarget: 8.0 })
    expect(applyOnboardingRamp([ex], 9)[0].sets).toBe(3)
  })
})

describe('applyOnboardingRamp — multiple exercises', () => {
  it('processes all exercises independently', () => {
    const exercises = [
      makeExercise({ tier: 'primary', sets: 4, repsTarget: '5-6', style: 'heavy' }),
      makeExercise({ tier: 'secondary', sets: 3, style: 'hyper', repsTarget: '8-12', rpeTarget: 8.0 }),
    ]
    const result = applyOnboardingRamp(exercises, 0)
    expect(result[0].sets).toBe(2)
    expect(result[0].repsTarget).toBe('8-10')
    expect(result[1].sets).toBe(2)
    expect(result[1].repsTarget).toBe('8-12') // hyper: unchanged
  })
})
