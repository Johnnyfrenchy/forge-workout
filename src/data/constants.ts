export const STORAGE_KEY = 'forge_workout_v1'

export const SPLITS = {
  UPPER_LOWER: 'Upper/Lower',
  PPL: 'PPL',
  FULL_BODY: 'Full Body',
  MAINTENANCE: 'Maintenance',
} as const

export const MUSCLE_GROUPS = {
  CHEST: 'Chest',
  BACK: 'Back',
  SHOULDERS: 'Shoulders',
  TRICEPS: 'Triceps',
  BICEPS: 'Biceps',
  QUADS: 'Quads',
  HAMSTRINGS: 'Hamstrings',
  GLUTES: 'Glutes',
  CALVES: 'Calves',
  CORE: 'Core',
} as const

export const SPLIT_GROUPS = {
  UPPER: ['Chest', 'Back', 'Shoulders', 'Triceps', 'Biceps'],
  LOWER: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
  PUSH:  ['Chest', 'Shoulders', 'Triceps'],
  PULL:  ['Back', 'Biceps'],
  LEGS:  ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
  FULL:  ['Chest', 'Back', 'Quads', 'Hamstrings', 'Shoulders'],
} as const

// ---- Types ----------------------------------------------------------------

export type SplitValue = typeof SPLITS[keyof typeof SPLITS]
export type MuscleGroup = typeof MUSCLE_GROUPS[keyof typeof MUSCLE_GROUPS]

export interface Exercise {
  id: string
  name: string
  group: string
  role: 'compound' | 'isolation'
  tier: 'primary' | 'secondary' | 'accessory'
}

export interface ActualSet {
  weight: number | null
  reps: number | null
  rpe: number | null
  done: boolean
}

export interface ExerciseEntry extends Exercise {
  sets: number
  repsTarget: string
  repUnit: 'reps' | 'sec'
  restSeconds: number
  rpeTarget: number
  suggestedWeight: number | null
  progressionNote: string
  lastSession: { weight: number | null; reps: number[]; rpe: number | null } | null
  notes: string
  logged?: boolean
  skipped?: boolean
  swapped?: boolean
  actualSets?: ActualSet[]
  recoveryAdjusted?: boolean
  deloadAdjusted?: boolean
}

export interface LoggedExercise {
  id: string
  name: string
  group: string
  weight: number | null
  reps: number[]
  rpe: number | null
  notes: string
}

export interface Session {
  id: string
  date: string
  type: string
  sessionKey?: string
  split: string
  focus?: string
  style?: string
  muscleGroups: string[]
  plannedVolume?: number
  exercises: ExerciseEntry[]
  completed: boolean
  completedAt?: string
  loggedExercises?: LoggedExercise[]
  sentiment?: string
  sessionNote?: string
  restOK?: boolean
  note?: string | null
  _docId?: string
}

export interface Settings {
  name?: string
  weeklyTarget: number
  adaptiveDeload: boolean
  strictRest: boolean
  createdAt: string
  excludedGroups?: string[]  // Bug modéré #3
}

export interface AppData {
  sessions: Session[]
  settings: Settings | null
  currentSession: Session | null
}
