import { describe, it, expect } from 'vitest'
import { pickNextSessionType, hoursSinceGroupTrained, deriveFocus } from '../../src/algo/sessionPicker'
import { SPLITS } from '../../src/data/constants'
import { makeSession, daysAgoISO } from '../helpers'

describe('hoursSinceGroupTrained', () => {
  it('returns Infinity for never-trained group', () => {
    expect(hoursSinceGroupTrained([], 'Chest')).toBe(Infinity)
  })

  it('finds most recent occurrence', () => {
    const sessions = [
      makeSession({ date: daysAgoISO(2), muscleGroups: ['Chest'], completed: true }),
      makeSession({ date: daysAgoISO(5), muscleGroups: ['Chest'], completed: true }),
    ]
    const h = hoursSinceGroupTrained(sessions, 'Chest')
    expect(h).toBeGreaterThanOrEqual(47)
    expect(h).toBeLessThanOrEqual(49)
  })
})

describe('deriveFocus', () => {
  it('returns lower when only lower groups', () => {
    expect(deriveFocus(makeSession({ muscleGroups: ['Quads', 'Hamstrings'] }))).toBe('lower')
  })
  it('returns full when mixed upper + lower', () => {
    expect(deriveFocus(makeSession({ muscleGroups: ['Chest', 'Quads'] }))).toBe('full')
  })
  it('returns push when only push groups', () => {
    expect(deriveFocus(makeSession({ muscleGroups: ['Chest', 'Shoulders', 'Triceps'] }))).toBe('push')
  })
  it('returns pull when only pull groups', () => {
    expect(deriveFocus(makeSession({ muscleGroups: ['Back', 'Biceps'] }))).toBe('pull')
  })
})

describe('pickNextSessionType', () => {
  it('picks a session from the given split', () => {
    const pick = pickNextSessionType([], SPLITS.UPPER_LOWER)
    expect(['Upper Heavy', 'Upper Hyper', 'Lower Power', 'Lower Hyper']).toContain(pick.name)
  })

  it('alternates focus after last session', () => {
    const sessions = [
      makeSession({ date: daysAgoISO(1), type: 'Upper Heavy', muscleGroups: ['Chest', 'Back'], focus: 'upper' }),
    ]
    const pick = pickNextSessionType(sessions, SPLITS.UPPER_LOWER)
    // 48h rest on upper groups blocks Upper candidates → should pick Lower
    expect(pick.focus).toBe('lower')
  })

  it('respects 48h rest constraint', () => {
    const sessions = [
      makeSession({ date: daysAgoISO(1), muscleGroups: ['Chest', 'Back', 'Shoulders'], focus: 'upper' }),
      makeSession({ date: daysAgoISO(1), muscleGroups: ['Quads', 'Hamstrings', 'Glutes'], focus: 'lower' }),
    ]
    const pick = pickNextSessionType(sessions, SPLITS.UPPER_LOWER)
    expect(pick.restOK).toBe(false)
  })
})
