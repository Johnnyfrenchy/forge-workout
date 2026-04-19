import type { Exercise } from './constants'

export const EXERCISES: Exercise[] = [
  // Chest
  { id: 'bb_bench',    name: 'Barbell Bench Press',     group: 'Chest',      role: 'compound',  tier: 'primary' },
  { id: 'db_bench',    name: 'Dumbbell Bench Press',    group: 'Chest',      role: 'compound',  tier: 'primary' },
  { id: 'incl_db',     name: 'Incline DB Press',        group: 'Chest',      role: 'compound',  tier: 'secondary' },
  { id: 'dip',         name: 'Weighted Dips',           group: 'Chest',      role: 'compound',  tier: 'secondary' },
  { id: 'cable_fly',   name: 'Cable Fly',               group: 'Chest',      role: 'isolation', tier: 'accessory' },
  { id: 'pec_deck',    name: 'Pec Deck',                group: 'Chest',      role: 'isolation', tier: 'accessory' },

  // Back
  { id: 'pullup',      name: 'Weighted Pull-up',        group: 'Back',       role: 'compound',  tier: 'primary' },
  { id: 'bb_row',      name: 'Barbell Row',             group: 'Back',       role: 'compound',  tier: 'primary' },
  { id: 'tbar_row',    name: 'T-Bar Row',               group: 'Back',       role: 'compound',  tier: 'secondary' },
  { id: 'lat_pull',    name: 'Lat Pulldown',            group: 'Back',       role: 'compound',  tier: 'secondary' },
  { id: 'cable_row',   name: 'Cable Seated Row',        group: 'Back',       role: 'compound',  tier: 'secondary' },
  { id: 'face_pull',   name: 'Face Pull',               group: 'Back',       role: 'isolation', tier: 'accessory' },
  { id: 'pullover',    name: 'Cable Pullover',          group: 'Back',       role: 'isolation', tier: 'accessory' },

  // Shoulders
  { id: 'ohp',         name: 'Overhead Press',          group: 'Shoulders',  role: 'compound',  tier: 'primary' },
  { id: 'db_ohp',      name: 'Seated DB Press',         group: 'Shoulders',  role: 'compound',  tier: 'primary' },
  { id: 'lat_raise',   name: 'Lateral Raise',           group: 'Shoulders',  role: 'isolation', tier: 'secondary' },
  { id: 'cable_lat',   name: 'Cable Lateral Raise',     group: 'Shoulders',  role: 'isolation', tier: 'accessory' },
  { id: 'rear_delt',   name: 'Rear Delt Fly',           group: 'Shoulders',  role: 'isolation', tier: 'accessory' },

  // Triceps
  { id: 'close_bench', name: 'Close-Grip Bench',        group: 'Triceps',    role: 'compound',  tier: 'secondary' },
  { id: 'skull',       name: 'Skullcrushers',           group: 'Triceps',    role: 'isolation', tier: 'secondary' },
  { id: 'tri_push',    name: 'Cable Pushdown',          group: 'Triceps',    role: 'isolation', tier: 'accessory' },
  { id: 'overhead_ext',name: 'Overhead Tricep Ext.',    group: 'Triceps',    role: 'isolation', tier: 'accessory' },

  // Biceps
  { id: 'bb_curl',     name: 'Barbell Curl',            group: 'Biceps',     role: 'isolation', tier: 'secondary' },
  { id: 'incl_curl',   name: 'Incline DB Curl',         group: 'Biceps',     role: 'isolation', tier: 'secondary' },
  { id: 'hammer',      name: 'Hammer Curl',             group: 'Biceps',     role: 'isolation', tier: 'accessory' },
  { id: 'cable_curl',  name: 'Cable Curl',              group: 'Biceps',     role: 'isolation', tier: 'accessory' },

  // Quads
  { id: 'bb_squat',    name: 'Back Squat',              group: 'Quads',      role: 'compound',  tier: 'primary' },
  { id: 'front_sq',    name: 'Front Squat',             group: 'Quads',      role: 'compound',  tier: 'primary' },
  { id: 'hack_sq',     name: 'Hack Squat',              group: 'Quads',      role: 'compound',  tier: 'secondary' },
  { id: 'leg_press',   name: 'Leg Press',               group: 'Quads',      role: 'compound',  tier: 'secondary' },
  { id: 'lunge',       name: 'Walking Lunge',           group: 'Quads',      role: 'compound',  tier: 'secondary' },
  { id: 'leg_ext',     name: 'Leg Extension',           group: 'Quads',      role: 'isolation', tier: 'accessory' },

  // Hamstrings
  { id: 'rdl',         name: 'Romanian Deadlift',       group: 'Hamstrings', role: 'compound',  tier: 'primary' },
  { id: 'sl_rdl',      name: 'Single-Leg RDL',          group: 'Hamstrings', role: 'compound',  tier: 'secondary' },
  { id: 'leg_curl',    name: 'Lying Leg Curl',          group: 'Hamstrings', role: 'isolation', tier: 'secondary' },
  { id: 'seat_curl',   name: 'Seated Leg Curl',         group: 'Hamstrings', role: 'isolation', tier: 'accessory' },

  // Glutes
  { id: 'hip_thrust',  name: 'Barbell Hip Thrust',      group: 'Glutes',     role: 'compound',  tier: 'primary' },
  { id: 'bulg_sq',     name: 'Bulgarian Split Squat',   group: 'Glutes',     role: 'compound',  tier: 'secondary' },
  { id: 'cable_kick',  name: 'Cable Kickback',          group: 'Glutes',     role: 'isolation', tier: 'accessory' },
  { id: 'abd_mach',    name: 'Hip Abduction',           group: 'Glutes',     role: 'isolation', tier: 'accessory' },

  // Calves
  { id: 'stand_calf',  name: 'Standing Calf Raise',     group: 'Calves',     role: 'isolation', tier: 'secondary' },
  { id: 'seat_calf',   name: 'Seated Calf Raise',       group: 'Calves',     role: 'isolation', tier: 'accessory' },

  // Core
  { id: 'plank',        name: 'Plank',                  group: 'Core',       role: 'isolation', tier: 'primary' },
  { id: 'hang_leg',     name: 'Hanging Leg Raise',      group: 'Core',       role: 'isolation', tier: 'primary' },
  { id: 'ab_wheel',     name: 'Ab Wheel Rollout',       group: 'Core',       role: 'isolation', tier: 'primary' },
  { id: 'cable_crunch', name: 'Cable Crunch',           group: 'Core',       role: 'isolation', tier: 'secondary' },
  { id: 'dead_bug',     name: 'Dead Bug',               group: 'Core',       role: 'isolation', tier: 'secondary' },
  { id: 'pallof',       name: 'Pallof Press',           group: 'Core',       role: 'isolation', tier: 'secondary' },
  { id: 'side_plank',   name: 'Side Plank',             group: 'Core',       role: 'isolation', tier: 'accessory' },
  { id: 'russian_t',    name: 'Russian Twist',          group: 'Core',       role: 'isolation', tier: 'accessory' },
  { id: 'bird_dog',     name: 'Bird Dog',               group: 'Core',       role: 'isolation', tier: 'accessory' },
]
