/**
 * FORGE — Algorithme de programmation musculaire
 * ================================================
 * Fichier autonome (pas d'imports externes).
 * Sources : ACSM 2009/2026 · Israetel/RP · Schoenfeld · Helms 2016 · Rhea 2003
 */

// ─────────────────────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Equipment  = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight'
type Tier       = 'primary' | 'secondary' | 'accessory'
type Role       = 'compound' | 'isolation'
type Style      = 'heavy' | 'hyper'
type Recovery   = 'good' | 'medium' | 'poor'

interface Exercise {
  id: string; name: string; group: string
  role: Role; tier: Tier; equipment: Equipment
}

interface ExerciseEntry extends Exercise {
  style?: Style
  sets: number; repsTarget: string; repUnit: 'reps' | 'sec'
  restSeconds: number; rpeTarget: number
  suggestedWeight: number | null
  progressionNote?: string
  lastSession: { weight: number | null; reps: number[]; rpe: number | null } | null
  notes: string
  recoveryAdjusted?: boolean; deloadAdjusted?: boolean; onboardingAdjusted?: boolean
}

interface LoggedExercise {
  id: string; name: string; group: string
  weight: number | null; reps: number[]; rpe: number | null; notes: string
}

interface Session {
  id: string; date: string; type: string; sessionKey?: string
  split: string; focus?: string; style?: string
  muscleGroups: string[]; plannedVolume?: number
  exercises: ExerciseEntry[]; completed: boolean
  loggedExercises?: LoggedExercise[]
  restOK?: boolean; note?: string | null
}

interface Settings {
  weeklyTarget: number
  adaptiveDeload: boolean; strictRest: boolean
  machineOnly?: boolean; excludedGroups?: string[]
}


// ─────────────────────────────────────────────────────────────────────────────
//  DONNÉES — SPLITS & SESSION TYPES
// ─────────────────────────────────────────────────────────────────────────────

const SPLITS = {
  UPPER_LOWER: 'Upper/Lower',
  PPL:         'PPL',
  FULL_BODY:   'Full Body',
  MAINTENANCE: 'Maintenance',
} as const

const SPLIT_GROUPS = {
  UPPER: ['Chest', 'Back', 'Shoulders', 'Triceps', 'Biceps'],
  LOWER: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
  PUSH:  ['Chest', 'Shoulders', 'Triceps'],
  PULL:  ['Back', 'Biceps'],
  LEGS:  ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
  FULL:  ['Chest', 'Back', 'Quads', 'Hamstrings', 'Shoulders'],
} as const

interface SessionType { name: string; split: string; focus: string; style: Style }

const SESSION_TYPES: Record<string, SessionType> = {
  UPPER_HEAVY: { name: 'Upper Heavy', split: 'Upper/Lower', focus: 'upper', style: 'heavy' },
  UPPER_HYPER: { name: 'Upper Hyper', split: 'Upper/Lower', focus: 'upper', style: 'hyper' },
  LOWER_POWER: { name: 'Lower Power', split: 'Upper/Lower', focus: 'lower', style: 'heavy' },
  LOWER_HYPER: { name: 'Lower Hyper', split: 'Upper/Lower', focus: 'lower', style: 'hyper' },
  PUSH_HEAVY:  { name: 'Push Heavy',  split: 'PPL',         focus: 'push',  style: 'heavy' },
  PUSH_HYPER:  { name: 'Push Hyper',  split: 'PPL',         focus: 'push',  style: 'hyper' },
  PULL_HEAVY:  { name: 'Pull Heavy',  split: 'PPL',         focus: 'pull',  style: 'heavy' },
  PULL_HYPER:  { name: 'Pull Hyper',  split: 'PPL',         focus: 'pull',  style: 'hyper' },
  LEGS_POWER:  { name: 'Legs Power',  split: 'PPL',         focus: 'legs',  style: 'heavy' },
  LEGS_HYPER:  { name: 'Legs Hyper',  split: 'PPL',         focus: 'legs',  style: 'hyper' },
  FULL_A:      { name: 'Full Body A', split: 'Full Body',   focus: 'full',  style: 'heavy' },
  FULL_B:      { name: 'Full Body B', split: 'Full Body',   focus: 'full',  style: 'hyper' },
}


// ─────────────────────────────────────────────────────────────────────────────
//  1. FRÉQUENCE & SPLIT  (frequency.ts)
//     Décide quel split programmer selon la fréquence des 14 derniers jours.
// ─────────────────────────────────────────────────────────────────────────────

function computeFrequency(sessions: Session[], days = 14): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const recent = sessions.filter(s => new Date(s.date).getTime() >= cutoff && s.completed)
  return recent.length / (days / 7)
}

/**
 * Seuils de fréquence hebdo → split
 *   ≥ 3.5 / sem  → Upper/Lower
 *   ≥ 2.5        → PPL
 *   ≥ 1.5        → Full Body
 *   < 1.5        → Maintenance (reprise forcée)
 */
function pickSplit(sessions: Session[], seedTarget: number): string {
  const oldest = sessions.reduce<number | null>((acc, s) => {
    const t = new Date(s.date).getTime(); return acc === null || t < acc ? t : acc
  }, null)
  const historyDays = oldest ? (Date.now() - oldest) / (24 * 60 * 60 * 1000) : 0
  const freq = historyDays < 14 && seedTarget ? seedTarget : computeFrequency(sessions, 14)

  if (freq >= 3.5) return SPLITS.UPPER_LOWER
  if (freq >= 2.5) return SPLITS.PPL
  if (freq >= 1.5) return SPLITS.FULL_BODY
  return SPLITS.MAINTENANCE
}

/** Détecte mésocycle : ≥ 4 semaines consécutives sur le même split. */
function detectMesocycle(sessions: Session[]): { active: boolean; weeks: number; split: string | null } {
  const byWeek = groupSessionsByWeek(sessions)
  const entries = Object.entries(byWeek).sort((a, b) => b[0].localeCompare(a[0]))
  if (!entries.length) return { active: false, weeks: 0, split: null }
  const recentSplit = entries[0][1][0]?.split ?? null
  if (!recentSplit) return { active: false, weeks: 0, split: null }
  let count = 0
  for (const [, w] of entries) { if (w.every(s => s.split === recentSplit)) count++; else break }
  return { active: count >= 4, weeks: count, split: recentSplit }
}


// ─────────────────────────────────────────────────────────────────────────────
//  2. DÉLOAD  (deload.ts)
//     Propose une semaine de décharge après 3 sem. consécutives RPE ≥ 8.
// ─────────────────────────────────────────────────────────────────────────────

function getWeekKey(d: Date): string {
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = utc.getUTCDay() || 7
  utc.setUTCDate(utc.getUTCDate() + 4 - day)
  const y = utc.getUTCFullYear()
  const yearStart = new Date(Date.UTC(y, 0, 1))
  const w = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${y}-W${w}`
}

function groupSessionsByWeek(sessions: Session[]): Record<string, Session[]> {
  const map: Record<string, Session[]> = {}
  for (const s of sessions) {
    if (!s.completed) continue
    const key = getWeekKey(new Date(s.date))
    ;(map[key] = map[key] || []).push(s)
  }
  return map
}

/**
 * Déload recommandée si :
 *  - adaptiveDeload activé dans les settings
 *  - 3 des 4 dernières semaines : ≥ 3 séances ET RPE moyen ≥ 8
 */
function shouldProposeDeload(sessions: Session[], settings: Settings): boolean {
  if (!settings.adaptiveDeload) return false
  const weeks = Object.values(groupSessionsByWeek(sessions)).slice(-4)
  if (weeks.length < 3) return false
  const highLoad = weeks.slice(-3).filter(w => {
    const valid = w.filter(s => (s.loggedExercises || []).some(e => e.rpe !== null))
    if (valid.length < 3) return false
    const avg = valid.reduce((sum, s) => {
      const rpes = (s.loggedExercises || []).map(e => e.rpe).filter((r): r is number => r !== null)
      return sum + (rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : 0)
    }, 0) / valid.length
    return avg >= 8
  })
  return highLoad.length >= 3
}


// ─────────────────────────────────────────────────────────────────────────────
//  3. SÉLECTION DE SESSION  (sessionPicker.ts)
//     Choisit le type de séance (UPPER_HEAVY, PUSH_HYPER…) par scoring.
// ─────────────────────────────────────────────────────────────────────────────

function hoursSinceGroupTrained(sessions: Session[], group: string): number {
  const completed = sessions.filter(s => s.completed)
  let mostRecent = 0
  for (const s of completed) {
    if ((s.muscleGroups || []).includes(group)) {
      const t = new Date(s.date).getTime()
      if (t > mostRecent) mostRecent = t
    }
  }
  return mostRecent === 0 ? Infinity : (Date.now() - mostRecent) / (60 * 60 * 1000)
}

function groupsForFocus(focus: string): readonly string[] {
  const map: Record<string, readonly string[]> = {
    upper: SPLIT_GROUPS.UPPER, lower: SPLIT_GROUPS.LOWER,
    push: SPLIT_GROUPS.PUSH,   pull:  SPLIT_GROUPS.PULL,
    legs: SPLIT_GROUPS.LEGS,   full:  SPLIT_GROUPS.FULL,
  }
  return map[focus] ?? []
}

function deriveFocus(session: Session): string {
  const g = session.muscleGroups || []
  if (g.some(x => (SPLIT_GROUPS.LOWER as readonly string[]).includes(x))) {
    return g.some(x => (SPLIT_GROUPS.UPPER as readonly string[]).includes(x)) ? 'full' : 'lower'
  }
  const hasPush = g.some(x => (SPLIT_GROUPS.PUSH as readonly string[]).includes(x))
  const hasPull = g.some(x => (SPLIT_GROUPS.PULL as readonly string[]).includes(x))
  if (hasPush && !hasPull) return 'push'
  if (hasPull && !hasPush) return 'pull'
  return 'upper'
}

/**
 * Score par candidat :
 *   Repos < 48h      →  -1000  (bloquant)
 *   Fréquence élevée →  -2 × avgFreq
 *   Alternance style :
 *     même focus + même style  →  -10
 *     même focus + style diff  →  +2
 *     focus différent          →  +12
 *   RPE ≥ 9 dernière séance :
 *     même focus               →  -20 (fatigue)
 *     focus différent          →  +10 (récompense switch)
 */
function pickNextSessionType(sessions: Session[], split: string) {
  const completed = sessions.filter(s => s.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const last = completed[0]
  const lastFocus = last ? deriveFocus(last) : null
  const lastStyle = last?.type ?? null
  const lastRpes  = (last?.loggedExercises || []).map(e => e.rpe).filter((r): r is number => r !== null)
  const lastAvgRpe = lastRpes.length ? lastRpes.reduce((a, b) => a + b, 0) / lastRpes.length : null
  const lastHighRpe = lastAvgRpe !== null && lastAvgRpe >= 9

  const freqMap: Record<string, number> = {}
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
  for (const s of sessions) {
    if (!s.completed || new Date(s.date).getTime() < cutoff) continue
    for (const g of (s.muscleGroups || [])) freqMap[g] = (freqMap[g] || 0) + 1
  }

  const candidates = Object.entries(SESSION_TYPES)
    .filter(([, v]) => v.split === split)
    .map(([k, v]) => {
      const groups = groupsForFocus(v.focus)
      const minHours = Math.min(...groups.map(g => hoursSinceGroupTrained(sessions, g)))
      const restOK   = minHours >= 48
      const avgFreq  = groups.reduce((s, g) => s + (freqMap[g] || 0), 0) / Math.max(1, groups.length)
      const altBonus = lastFocus === v.focus && lastStyle === v.style ? -10
                     : lastFocus === v.focus ? 2 : 12
      let score = 0
      if (!restOK) score -= 1000
      score -= avgFreq * 2
      score += altBonus
      score += lastHighRpe && lastFocus === v.focus ? -20 : 0
      score += lastHighRpe && lastFocus !== v.focus ? 10  : 0
      return { key: k, ...v, score, restOK, avgFreq }
    })

  return candidates.sort((a, b) => b.score - a.score)[0]
}


// ─────────────────────────────────────────────────────────────────────────────
//  4. PROGRESSION  (progression.ts)
//     Suggestion de charge pour la prochaine séance.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Règles :
 *   Toutes les reps ≥ borne haute du range ET RPE ≤ 8  →  +1.25 ou +2.5 kg
 *   RPE > 8.5  →  tenir la charge
 *   Sinon      →  tenir la charge, viser +1 rep
 */
function computeProgression(lastLog: LoggedExercise | null, repsTarget: string) {
  if (!lastLog) return { suggestedWeight: null, note: 'Première fois — choisis charge technique' }
  const high = Number(repsTarget.split('-')[1] ?? repsTarget.split('-')[0])
  const reps = lastLog.reps || []
  const allHit = reps.length > 0 && reps.every(r => r >= high)
  const rpe    = lastLog.rpe ?? 7
  const inc    = (lastLog.weight ?? 0) >= 60 ? 2.5 : 1.25
  if (allHit && rpe <= 8) return { suggestedWeight: (lastLog.weight ?? 0) + inc, note: `+${inc}kg (top range atteint, RPE OK)` }
  if (rpe > 8.5)          return { suggestedWeight: lastLog.weight, note: 'Hold charge (RPE élevé)' }
  return                         { suggestedWeight: lastLog.weight, note: 'Hold charge, vise +1 rep' }
}


// ─────────────────────────────────────────────────────────────────────────────
//  5. SÉLECTION D'EXERCICES  (exerciseSelector.ts)
//     Construit la liste des exercices pour une séance.
// ─────────────────────────────────────────────────────────────────────────────

const TIMED_ISOS = ['plank', 'side_plank', 'dead_bug', 'bird_dog', 'pallof']

const MAIN_GROUPS: Record<string, string[]> = {
  upper: ['Chest', 'Back', 'Shoulders'],
  lower: ['Quads', 'Hamstrings', 'Glutes'],
  push:  ['Chest', 'Shoulders'],
  pull:  ['Back'],
  legs:  ['Quads', 'Hamstrings', 'Glutes'],
  full:  ['Chest', 'Back', 'Quads'],
}

const ALL_GROUPS: Record<string, string[]> = {
  upper: ['Chest', 'Back', 'Shoulders', 'Triceps', 'Biceps'],
  lower: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
  push:  ['Chest', 'Shoulders', 'Triceps'],
  pull:  ['Back', 'Biceps'],
  legs:  ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
  full:  ['Chest', 'Back', 'Quads', 'Hamstrings', 'Shoulders'],
}

/**
 * Rotation anti-répétition : évite les exercices des 5 dernières séances
 * pour le même groupe + tier. Retourne le premier "inutilisé" ou pool[0].
 */
function pickRotating(pool: Exercise[], group: string, sessions: Session[], tier: string): Exercise | null {
  if (!pool.length) return null
  if (pool.length === 1) return pool[0]
  const recent = new Set<string>()
  for (const s of sessions.filter(s => s.completed).slice(-5))
    for (const ex of (s.exercises || []))
      if (ex.group === group && ex.tier === tier) recent.add(ex.id)
  return pool.find(e => !recent.has(e.id)) ?? pool[0]
}

/**
 * Paramètres d'un exercice selon style et tier :
 *
 *  Heavy primary    → 4×5-6  RPE 8.5  repos 3min
 *  Heavy secondary  → 4×6-8  RPE 8.0  repos 2.5min
 *  Hyper secondary  → 3×8-12 RPE 8.0  repos 1.5min
 *  Hyper accessory  → 3×10-12 RPE 7.5 repos 1min  (lower: 10-15)
 *  Core (timed)     → 3×30-60s / 20-40s  RPE 8  repos 45s
 *  Core (reps)      → 3×10-15  RPE 8  repos 60s
 */
function buildEntry(ex: Exercise, style: Style, sessions: Session[], focus: string): ExerciseEntry {
  const lastLog = (() => {
    for (const s of sessions.filter(s => s.completed).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
      { const e = (s.loggedExercises || []).find(e => e.id === ex.id); if (e) return e }
    return null
  })()

  let sets: number, repsTarget: string, restSeconds: number, rpeTarget: number, repUnit: 'reps' | 'sec'

  if (ex.group === 'Core') {
    if (TIMED_ISOS.includes(ex.id)) {
      sets = 3; repsTarget = ex.id === 'plank' ? '30-60' : '20-40'; restSeconds = 45; rpeTarget = 8; repUnit = 'sec'
    } else {
      sets = 3; repsTarget = '10-15'; restSeconds = 60; rpeTarget = 8; repUnit = 'reps'
    }
  } else if (style === 'heavy') {
    if (ex.tier === 'primary') { sets = 4; repsTarget = '5-6'; restSeconds = 180; rpeTarget = 8.5 }
    else                       { sets = 4; repsTarget = '6-8'; restSeconds = 150; rpeTarget = 8.0 }
    repUnit = 'reps'
  } else {
    if (ex.tier === 'secondary') { sets = 3; repsTarget = '8-12'; restSeconds = 90; rpeTarget = 8.0 }
    else { sets = 3; repsTarget = (focus === 'lower' || focus === 'legs') ? '10-15' : '10-12'; restSeconds = 60; rpeTarget = 7.5 }
    repUnit = 'reps'
  }

  const prog = computeProgression(lastLog, repsTarget)
  return {
    id: ex.id, name: ex.name, group: ex.group, role: ex.role,
    tier: ex.tier, equipment: ex.equipment, style,
    sets, repsTarget, repUnit, restSeconds, rpeTarget,
    suggestedWeight: prog.suggestedWeight, progressionNote: prog.note,
    lastSession: lastLog ? { weight: lastLog.weight, reps: lastLog.reps, rpe: lastLog.rpe } : null,
    notes: '',
  }
}

/**
 * Sélection complète pour une séance :
 *
 *  Heavy :
 *    - 1 exercise primary par groupe (fallback secondary → accessory)
 *    - + 1 secondary pour les groupes "main" (Chest, Back, Quads…)
 *  Hyper :
 *    - 1 secondary + 1 accessory par groupe
 *  Core finisher ajouté en fin de séance (primary si heavy, secondary si hyper)
 *  Plafond : 8 exos (7 pour lower/legs)
 *
 *  machineOnly = true → retire les exercices barbell du pool
 *  (fallback full pool si le groupe devient vide)
 */
function buildExercises(
  exercises: Exercise[],
  focus: string,
  style: Style,
  sessions: Session[],
  excludedGroups: string[] = [],
  machineOnly = false,
): ExerciseEntry[] {
  const groups     = (ALL_GROUPS[focus]  || []).filter(g => !excludedGroups.includes(g))
  const mainGroups = (MAIN_GROUPS[focus] || []).filter(g => !excludedGroups.includes(g))
  const result: ExerciseEntry[] = []

  for (const group of groups) {
    let pool = exercises.filter(e => e.group === group)
    if (machineOnly) {
      const safe = pool.filter(e => e.equipment !== 'barbell')
      if (safe.length > 0) pool = safe
    }
    if (!pool.length) continue

    const byTier = (t: string) => pool.filter(e => e.tier === t)

    if (style === 'heavy') {
      const first = pickRotating(byTier('primary'),   group, sessions, 'primary')
                 ?? pickRotating(byTier('secondary'), group, sessions, 'secondary')
                 ?? pickRotating(byTier('accessory'), group, sessions, 'accessory')
      if (first) result.push(buildEntry(first, style, sessions, focus))
      if (mainGroups.includes(group)) {
        const rest = [...byTier('secondary'), ...byTier('accessory')].filter(e => e.id !== first?.id)
        const second = pickRotating(rest, group, sessions, 'secondary')
        if (second) result.push(buildEntry(second, style, sessions, focus))
      }
    } else {
      const sec = pickRotating(byTier('secondary'), group, sessions, 'secondary')
      const acc = pickRotating(byTier('accessory'), group, sessions, 'accessory')
      if (sec) result.push(buildEntry(sec, style, sessions, focus))
      if (acc && acc.id !== sec?.id) result.push(buildEntry(acc, style, sessions, focus))
      if (!sec && !acc) {
        const pri = pickRotating(byTier('primary'), group, sessions, 'primary')
        if (pri) result.push(buildEntry(pri, style, sessions, focus))
      }
    }
  }

  const max    = (focus === 'lower' || focus === 'legs') ? 7 : 8
  const capped = result.slice(0, max)

  const corePool = exercises.filter(e => e.group === 'Core')
  const coreTier = style === 'heavy' ? 'primary' : 'secondary'
  const coreEx   = pickRotating(corePool.filter(e => e.tier === coreTier), 'Core', sessions, coreTier) ?? corePool[0]
  if (coreEx) capped.push(buildEntry(coreEx, 'hyper', sessions, focus))

  return capped
}


// ─────────────────────────────────────────────────────────────────────────────
//  6. POST-PROCESSORS  (recovery.ts)
//     Appliqués dans l'ordre : onboarding → recovery → deload
// ─────────────────────────────────────────────────────────────────────────────

/** Jours depuis la dernière séance complétée (Infinity si aucune). */
function daysSinceLastSession(sessions: Session[]): number {
  const completed = sessions.filter(s => s.completed)
  if (!completed.length) return Infinity
  const last = completed.reduce((acc, s) => Math.max(acc, new Date(s.date).getTime()), 0)
  return (Date.now() - last) / (24 * 60 * 60 * 1000)
}

/**
 * POST-PROCESSOR 1 — Rampe d'onboarding (séances 1-12)
 *
 * ┌────────┬──────────┬──────────────┬───────────────┬───────────┬──────────────────────────────┐
 * │ Phase  │ Séances  │ Sets primary │ Sets secondary│ RPE delta │ Reps heavy                   │
 * ├────────┼──────────┼──────────────┼───────────────┼───────────┼──────────────────────────────┤
 * │  1/4   │   1–3    │      2       │      2        │   -2.5    │ 5-6→8-10  6-8→8-12           │
 * │  2/4   │   4–6    │      2       │      2        │   -2.0    │ 5-6→8-10  6-8→8-12           │
 * │  3/4   │   7–9    │      3       │      3        │   -1.0    │ nominal                      │
 * │  4/4   │  10–12   │      4       │      3        │   -0.5    │ nominal                      │
 * │  ∞     │  13+     │   nominal    │   nominal     │    0      │ nominal                      │
 * └────────┴──────────┴──────────────┴───────────────┴───────────┴──────────────────────────────┘
 * Floor RPE = 5.5 (ACSM "comfortably hard")
 */
function applyOnboardingRamp(exercises: ExerciseEntry[], completedCount: number): ExerciseEntry[] {
  const TOTAL = 12
  if (completedCount >= TOTAL) return exercises

  const phase = Math.min(Math.floor(completedCount / 3), 3)
  const MAX_SETS: Record<string, readonly number[]> = { primary: [2,2,3,4], secondary: [2,2,3,3], accessory: [2,2,3,3] }
  const RPE_DELTA = [2.5, 2.0, 1.0, 0.5]
  const REP_OVERRIDE: Record<string, string> = { '5-6': '8-10', '6-8': '8-12' }
  const LABELS = ['volume allégé — technique prioritaire','montée progressive','approche du volume cible','paramètres quasi-nominaux']

  return exercises.map(ex => {
    const maxSets = MAX_SETS[ex.tier][phase]
    const sets    = Math.min(ex.sets, maxSets)
    const rpe     = Math.max(5.5, ex.rpeTarget - RPE_DELTA[phase])
    const reps    = ex.style === 'heavy' && phase <= 1 ? (REP_OVERRIDE[ex.repsTarget] ?? ex.repsTarget) : ex.repsTarget
    const setNote = ex.sets - sets > 0 ? ` · ${sets}×${ex.sets} sets` : ''
    const repNote = reps !== ex.repsTarget ? ` · ${reps} reps` : ''
    const note    = `↗ Séance ${completedCount+1}/${TOTAL} · Phase ${phase+1}/4 — ${LABELS[phase]} (RPE -${(ex.rpeTarget - rpe).toFixed(1)}${setNote}${repNote})`
    return { ...ex, sets, rpeTarget: rpe, repsTarget: reps, progressionNote: note, onboardingAdjusted: true }
  })
}

/**
 * POST-PROCESSOR 2 — Reprise progressive
 *
 *   3–7j  : ajustement selon choix utilisateur (good/medium/poor)
 *   7–21j : vol ×0.8  poids ×0.85
 *   >21j  : vol ×0.6  poids ×0.60  (traité comme fresh start)
 */
function applyRecoveryAdjustment(exercises: ExerciseEntry[], status: Recovery, daysSince = 0): ExerciseEntry[] {
  if (!isFinite(daysSince)) return exercises
  const statusVol  = status === 'poor' ? 0.7 : status === 'medium' ? 0.8 : 1.0
  const durVol     = daysSince > 21 ? 0.6 : daysSince > 7 ? 0.8 : 1.0
  const weightMult = daysSince > 21 ? 0.6 : daysSince > 7 ? 0.85 : 1.0
  const volMult    = Math.min(statusVol, durVol)
  if (volMult === 1.0 && weightMult === 1.0) return exercises
  const note = daysSince > 21 ? `⚠ Reprise après ${Math.round(daysSince)}j — poids -40%`
             : daysSince > 7  ? `↓ Reprise après ${Math.round(daysSince)}j — poids -15%` : ''
  return exercises.map(ex => ({
    ...ex,
    sets: Math.max(2, Math.round(ex.sets * volMult)),
    suggestedWeight: ex.suggestedWeight && weightMult < 1
      ? Math.round((ex.suggestedWeight * weightMult) / 2.5) * 2.5 : ex.suggestedWeight,
    progressionNote: note || ex.progressionNote,
    recoveryAdjusted: true,
  }))
}

/**
 * POST-PROCESSOR 3 — Déload
 *   Volume ×0.6  Poids ×0.8
 */
function applyDeloadAdjustment(exercises: ExerciseEntry[]): ExerciseEntry[] {
  return exercises.map(ex => ({
    ...ex,
    sets: Math.max(2, Math.round(ex.sets * 0.6)),
    suggestedWeight: ex.suggestedWeight ? Math.round(ex.suggestedWeight * 0.8 / 2.5) * 2.5 : null,
    progressionNote: '🔄 Deload — -40% vol, -20% poids',
    deloadAdjusted: true,
  }))
}


// ─────────────────────────────────────────────────────────────────────────────
//  7. POINT D'ENTRÉE  (sessionBuilder.ts)
//     Assemble le tout pour produire une Session prête à démarrer.
// ─────────────────────────────────────────────────────────────────────────────

interface BuildOptions {
  recovery?: Recovery; deload?: boolean; split?: string
}

/**
 * buildNextSession
 *
 * Chaîne complète :
 *   pickSplit → pickNextSessionType → buildExercises
 *   → applyOnboardingRamp → applyRecoveryAdjustment → applyDeloadAdjustment
 *
 * Cas particulier MAINTENANCE : retourne une séance de reprise Full Body
 * allégée si la fréquence est < 1.5/sem.
 */
function buildNextSession(
  exercises: Exercise[],
  sessions: Session[],
  settings: Settings,
  opts: BuildOptions = {},
): Session {
  const split   = opts.split || pickSplit(sessions, settings.weeklyTarget)
  const daysSince = daysSinceLastSession(sessions)

  if (split === SPLITS.MAINTENANCE) {
    let exs = buildExercises(exercises, 'full', 'hyper', sessions, [], settings.machineOnly).slice(0, 5)
    exs = applyRecoveryAdjustment(exs, 'medium', daysSince)
    return {
      id: `${new Date().toISOString().slice(0,10)}_reprise`, date: new Date().toISOString(),
      type: 'Reprise Full Body', sessionKey: 'FULL_A', split: SPLITS.FULL_BODY,
      focus: 'full', style: 'hyper', muscleGroups: [...new Set(exs.map(e => e.group))],
      plannedVolume: exs.reduce((s, e) => s + e.sets, 0), exercises: exs, completed: false,
      restOK: true, note: '⚠ Fréquence <1.5/sem — reprise progressive.',
    }
  }

  const picked = pickNextSessionType(sessions, split)
  if (!picked) return {
    id: `${new Date().toISOString().slice(0,10)}_rest`, date: new Date().toISOString(),
    type: 'rest', split, muscleGroups: [], exercises: [], completed: false,
    note: 'Tous les groupes en récup (<48h). Repos recommandé.',
  } as any

  const completedCount = sessions.filter(s => s.completed).length
  let exs = buildExercises(exercises, picked.focus, picked.style, sessions, settings.excludedGroups || [], settings.machineOnly)
  exs = applyOnboardingRamp(exs, completedCount)
  if (daysSince > 3) exs = applyRecoveryAdjustment(exs, opts.recovery || 'good', daysSince)
  if (opts.deload || shouldProposeDeload(sessions, settings)) exs = applyDeloadAdjustment(exs)

  return {
    id: `${new Date().toISOString().slice(0,10)}_${picked.key}`, date: new Date().toISOString(),
    type: picked.name, sessionKey: picked.key, split, focus: picked.focus, style: picked.style,
    muscleGroups: [...new Set(exs.map(e => e.group))],
    plannedVolume: exs.reduce((s, e) => s + e.sets, 0),
    exercises: exs, completed: false, restOK: picked.restOK,
    note: picked.restOK ? null : '⚠ Certains groupes <48h de récup',
  }
}

/** Durée estimée en minutes (sets × (repos + 30s exécution)). */
function estimateDuration(session: Session): number {
  return Math.round(session.exercises.reduce((t, ex) => t + ex.sets * (ex.restSeconds + 30), 0) / 60)
}


// ─────────────────────────────────────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export {
  // Entrée principale
  buildNextSession, estimateDuration,
  // Helpers réutilisables
  pickSplit, computeFrequency, detectMesocycle,
  shouldProposeDeload, pickNextSessionType,
  buildExercises, computeProgression,
  applyOnboardingRamp, applyRecoveryAdjustment, applyDeloadAdjustment,
  daysSinceLastSession,
  // Types
  type Exercise, type ExerciseEntry, type Session, type Settings,
  type Style, type Recovery, type Equipment, type Tier,
  // Constantes
  SPLITS, SESSION_TYPES, SPLIT_GROUPS,
}
