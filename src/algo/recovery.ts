import type { Session, ExerciseEntry } from '../data/constants'

export function daysSinceLastSession(sessions: Session[]): number {
  const completed = sessions.filter(s => s.completed)
  if (completed.length === 0) return Infinity
  const last = completed.reduce((acc, s) => {
    const t = new Date(s.date).getTime()
    return t > acc ? t : acc
  }, 0)
  return (Date.now() - last) / (24 * 60 * 60 * 1000)
}

export type RecoveryStatus = 'good' | 'medium' | 'poor'

/**
 * Bug critique #1 — Reprise progressive
 *
 * Rules (cumulative — duration overrides status when stricter):
 *   3–7 days  : honour user's recovery choice (good/medium/poor), no weight change
 *   7–21 days : min vol ×0.8, weight suggestion ×0.85 regardless of status
 *   >21 days  : vol ×0.6, weight suggestion ×0.60 (treat as fresh start)
 */
export function applyRecoveryAdjustment(
  exercises: ExerciseEntry[],
  recoveryStatus: RecoveryStatus,
  daysSince = 0,
): ExerciseEntry[] {
  // No previous sessions at all — new user, skip duration-based adjustment
  if (!isFinite(daysSince)) return exercises

  const statusVolMult = recoveryStatus === 'poor' ? 0.7 : recoveryStatus === 'medium' ? 0.8 : 1.0

  // Duration-based overrides (stricter than status when applicable)
  const durationVolMult = daysSince > 21 ? 0.6 : daysSince > 7 ? 0.8 : 1.0
  const weightMult      = daysSince > 21 ? 0.6 : daysSince > 7 ? 0.85 : 1.0

  const volMult = Math.min(statusVolMult, durationVolMult)

  // No change for good recovery within a week
  if (volMult === 1.0 && weightMult === 1.0) return exercises

  const durationNote =
    daysSince > 21
      ? `⚠ Reprise après ${Math.round(daysSince)}j — poids -40%`
      : daysSince > 7
        ? `↓ Reprise après ${Math.round(daysSince)}j — poids -15%`
        : ''

  return exercises.map(ex => {
    const newWeight =
      ex.suggestedWeight && weightMult < 1
        ? Math.round((ex.suggestedWeight * weightMult) / 2.5) * 2.5
        : ex.suggestedWeight

    return {
      ...ex,
      sets: Math.max(2, Math.round(ex.sets * volMult)),
      suggestedWeight: newWeight,
      progressionNote: durationNote || ex.progressionNote,
      recoveryAdjusted: true,
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
//  ONBOARDING RAMP
//  Post-processor scientifique pour les N premières séances.
//  Sources : ACSM 2009/2026, Israetel/RP MEV, Helms 2016, Rhea 2003, Schoenfeld.
// ─────────────────────────────────────────────────────────────────────────────

const ONBOARDING_TOTAL = 12
const PHASE_SIZE = 3

/** Max sets autorisés par phase et par tier.
 *  Phase 0 = séances 1-3 | Phase 3 = séances 10-12 */
const MAX_SETS_BY_PHASE: Record<'primary' | 'secondary' | 'accessory', readonly number[]> = {
  primary:   [2, 2, 3, 4],
  secondary: [2, 2, 3, 3],
  accessory: [2, 2, 3, 3],
}

/** Réduction RPE par phase (Helms 2016 — débutant RPE peu fiable) */
const RPE_REDUCTION_BY_PHASE: readonly number[] = [2.5, 2.0, 1.0, 0.5]

/** Floor RPE = 5.5 "comfortably hard" (ACSM) */
const RPE_FLOOR = 5.5

/** Overrides reps heavy en phases 0-1 (Rhea 2003 : ~60% 1RM optimal débutant) */
const HEAVY_REPS_OVERRIDE: Record<string, string> = {
  '5-6': '8-10',
  '6-8': '8-12',
}

const PHASE_LABELS: readonly string[] = [
  'volume allégé — technique prioritaire',
  'montée progressive',
  'approche du volume cible',
  'paramètres quasi-nominaux',
]

/**
 * Adapte volume/RPE/reps des premières séances pour un débutant.
 * À appeler AVANT applyRecoveryAdjustment dans la chaîne de post-processing.
 */
export function applyOnboardingRamp(
  exercises: ExerciseEntry[],
  completedCount: number,
): ExerciseEntry[] {
  if (completedCount >= ONBOARDING_TOTAL) return exercises

  const phase = Math.min(Math.floor(completedCount / PHASE_SIZE), 3)
  const sessionNumber = completedCount + 1
  const rpeReduction  = RPE_REDUCTION_BY_PHASE[phase]
  const phaseLabel    = PHASE_LABELS[phase]

  return exercises.map((ex): ExerciseEntry => {
    const tier = (ex.tier === 'accessory' ? 'secondary' : ex.tier) as 'primary' | 'secondary'
    const maxSets     = MAX_SETS_BY_PHASE[tier][phase]
    const adjustedSets = Math.min(ex.sets, maxSets)
    const adjustedRpe  = Math.max(RPE_FLOOR, ex.rpeTarget - rpeReduction)

    const adjustedReps =
      ex.style === 'heavy' && phase <= 1
        ? (HEAVY_REPS_OVERRIDE[ex.repsTarget] ?? ex.repsTarget)
        : ex.repsTarget

    const setsDiff = ex.sets - adjustedSets
    const rpeDiff  = (ex.rpeTarget - adjustedRpe).toFixed(1)
    const setNote  = setsDiff > 0 ? ` · ${adjustedSets}×${ex.sets} sets` : ''
    const repNote  = adjustedReps !== ex.repsTarget ? ` · ${adjustedReps} reps` : ''

    const progressionNote =
      `↗ Séance ${sessionNumber}/${ONBOARDING_TOTAL} · Phase ${phase + 1}/4 — ${phaseLabel}` +
      ` (RPE -${rpeDiff}${setNote}${repNote})`

    return {
      ...ex,
      sets: adjustedSets,
      rpeTarget: adjustedRpe,
      repsTarget: adjustedReps,
      progressionNote,
      onboardingAdjusted: true,
    }
  })
}

/** Retourne true si la séance est encore en période d'onboarding. */
export function isOnboarding(completedCount: number): boolean {
  return completedCount < ONBOARDING_TOTAL
}

/** Retourne le numéro de phase (0-3) ou null si hors rampe. */
export function getOnboardingPhase(completedCount: number): number | null {
  if (!isOnboarding(completedCount)) return null
  return Math.min(Math.floor(completedCount / PHASE_SIZE), 3)
}

/** Retourne le pourcentage de progression dans la rampe (0-100). */
export function getOnboardingProgress(completedCount: number): number {
  return Math.min(100, Math.round((completedCount / ONBOARDING_TOTAL) * 100))
}

export function applyDeloadAdjustment(exercises: ExerciseEntry[]): ExerciseEntry[] {
  return exercises.map(ex => ({
    ...ex,
    sets: Math.max(2, Math.round(ex.sets * 0.6)),
    deloadAdjusted: true,
    suggestedWeight: ex.suggestedWeight ? Math.round(ex.suggestedWeight * 0.8 / 2.5) * 2.5 : null,
    progressionNote: '🔄 Deload — -40% vol, -20% poids',
  }))
}
