import type { Session, Settings, LoggedExercise } from '../src/data/constants'

export function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

export function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: overrides.id || `s_${Math.random().toString(36).slice(2)}`,
    date: overrides.date || daysAgoISO(1),
    type: overrides.type || 'Upper Heavy',
    split: overrides.split || 'Upper/Lower',
    focus: overrides.focus || 'upper',
    style: overrides.style || 'heavy',
    muscleGroups: overrides.muscleGroups || ['Chest', 'Back', 'Shoulders'],
    exercises: overrides.exercises || [],
    completed: overrides.completed ?? true,
    loggedExercises: overrides.loggedExercises,
    ...overrides,
  }
}

export function makeLoggedEx(overrides: Partial<LoggedExercise> = {}): LoggedExercise {
  return {
    id: overrides.id || 'bb_bench',
    name: overrides.name || 'Barbell Bench Press',
    group: overrides.group || 'Chest',
    weight: overrides.weight ?? 80,
    reps: overrides.reps || [5, 5, 5, 5],
    rpe: overrides.rpe ?? 8,
    notes: overrides.notes || '',
  }
}

export const DEFAULT_SETTINGS: Settings = {
  weeklyTarget: 4,
  adaptiveDeload: true,
  strictRest: true,
  createdAt: daysAgoISO(60),
}
