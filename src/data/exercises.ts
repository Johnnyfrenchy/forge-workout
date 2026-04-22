import type { Exercise } from './constants'

export const EXERCISES: Exercise[] = [
  // Chest
  { id: 'bb_bench',    name: 'Barbell Bench Press',     group: 'Chest',      role: 'compound',  tier: 'primary',   equipment: 'barbell'    },
  { id: 'db_bench',    name: 'Dumbbell Bench Press',    group: 'Chest',      role: 'compound',  tier: 'primary',   equipment: 'dumbbell'   },
  { id: 'incl_db',     name: 'Incline DB Press',        group: 'Chest',      role: 'compound',  tier: 'secondary', equipment: 'dumbbell'   },
  { id: 'dip',         name: 'Weighted Dips',           group: 'Chest',      role: 'compound',  tier: 'secondary', equipment: 'bodyweight' },
  { id: 'cable_fly',   name: 'Cable Fly',               group: 'Chest',      role: 'isolation', tier: 'accessory', equipment: 'cable'      },
  { id: 'pec_deck',    name: 'Pec Deck',                group: 'Chest',      role: 'isolation', tier: 'accessory', equipment: 'machine'    },

  // Back
  { id: 'pullup',      name: 'Weighted Pull-up',        group: 'Back',       role: 'compound',  tier: 'primary',   equipment: 'bodyweight' },
  { id: 'bb_row',      name: 'Barbell Row',             group: 'Back',       role: 'compound',  tier: 'primary',   equipment: 'barbell'    },
  { id: 'tbar_row',    name: 'T-Bar Row',               group: 'Back',       role: 'compound',  tier: 'secondary', equipment: 'machine'    },
  { id: 'lat_pull',    name: 'Lat Pulldown',            group: 'Back',       role: 'compound',  tier: 'secondary', equipment: 'machine'    },
  { id: 'cable_row',   name: 'Cable Seated Row',        group: 'Back',       role: 'compound',  tier: 'secondary', equipment: 'cable'      },
  { id: 'face_pull',   name: 'Face Pull',               group: 'Back',       role: 'isolation', tier: 'accessory', equipment: 'cable'      },
  { id: 'pullover',    name: 'Cable Pullover',          group: 'Back',       role: 'isolation', tier: 'accessory', equipment: 'cable'      },

  // Shoulders
  { id: 'ohp',         name: 'Overhead Press',          group: 'Shoulders',  role: 'compound',  tier: 'primary',   equipment: 'barbell'    },
  { id: 'db_ohp',      name: 'Seated DB Press',         group: 'Shoulders',  role: 'compound',  tier: 'primary',   equipment: 'dumbbell'   },
  { id: 'lat_raise',   name: 'Lateral Raise',           group: 'Shoulders',  role: 'isolation', tier: 'secondary', equipment: 'dumbbell'   },
  { id: 'cable_lat',   name: 'Cable Lateral Raise',     group: 'Shoulders',  role: 'isolation', tier: 'accessory', equipment: 'cable'      },
  { id: 'rear_delt',   name: 'Rear Delt Fly',           group: 'Shoulders',  role: 'isolation', tier: 'accessory', equipment: 'dumbbell'   },

  // Triceps
  { id: 'close_bench', name: 'Close-Grip Bench',        group: 'Triceps',    role: 'compound',  tier: 'secondary', equipment: 'barbell'    },
  { id: 'skull',       name: 'Skullcrushers',           group: 'Triceps',    role: 'isolation', tier: 'secondary', equipment: 'barbell'    },
  { id: 'tri_push',    name: 'Cable Pushdown',          group: 'Triceps',    role: 'isolation', tier: 'accessory', equipment: 'cable'      },
  { id: 'overhead_ext',name: 'Overhead Tricep Ext.',    group: 'Triceps',    role: 'isolation', tier: 'accessory', equipment: 'dumbbell'   },

  // Biceps
  { id: 'bb_curl',     name: 'Barbell Curl',            group: 'Biceps',     role: 'isolation', tier: 'secondary', equipment: 'barbell'    },
  { id: 'incl_curl',   name: 'Incline DB Curl',         group: 'Biceps',     role: 'isolation', tier: 'secondary', equipment: 'dumbbell'   },
  { id: 'hammer',      name: 'Hammer Curl',             group: 'Biceps',     role: 'isolation', tier: 'accessory', equipment: 'dumbbell'   },
  { id: 'cable_curl',  name: 'Cable Curl',              group: 'Biceps',     role: 'isolation', tier: 'accessory', equipment: 'cable'      },

  // Quads
  { id: 'bb_squat',    name: 'Back Squat',              group: 'Quads',      role: 'compound',  tier: 'primary',   equipment: 'barbell'    },
  { id: 'front_sq',    name: 'Front Squat',             group: 'Quads',      role: 'compound',  tier: 'primary',   equipment: 'barbell'    },
  { id: 'hack_sq',     name: 'Hack Squat',              group: 'Quads',      role: 'compound',  tier: 'secondary', equipment: 'machine'    },
  { id: 'leg_press',   name: 'Leg Press',               group: 'Quads',      role: 'compound',  tier: 'secondary', equipment: 'machine'    },
  { id: 'lunge',       name: 'Walking Lunge',           group: 'Quads',      role: 'compound',  tier: 'secondary', equipment: 'dumbbell'   },
  { id: 'leg_ext',     name: 'Leg Extension',           group: 'Quads',      role: 'isolation', tier: 'accessory', equipment: 'machine'    },

  // Hamstrings
  { id: 'rdl',         name: 'Romanian Deadlift',       group: 'Hamstrings', role: 'compound',  tier: 'primary',   equipment: 'barbell'    },
  { id: 'sl_rdl',      name: 'Single-Leg RDL',          group: 'Hamstrings', role: 'compound',  tier: 'secondary', equipment: 'dumbbell'   },
  { id: 'leg_curl',    name: 'Lying Leg Curl',          group: 'Hamstrings', role: 'isolation', tier: 'secondary', equipment: 'machine'    },
  { id: 'seat_curl',   name: 'Seated Leg Curl',         group: 'Hamstrings', role: 'isolation', tier: 'accessory', equipment: 'machine'    },

  // Glutes
  { id: 'hip_thrust',  name: 'Barbell Hip Thrust',      group: 'Glutes',     role: 'compound',  tier: 'primary',   equipment: 'barbell'    },
  { id: 'bulg_sq',     name: 'Bulgarian Split Squat',   group: 'Glutes',     role: 'compound',  tier: 'secondary', equipment: 'dumbbell'   },
  { id: 'cable_kick',  name: 'Cable Kickback',          group: 'Glutes',     role: 'isolation', tier: 'accessory', equipment: 'cable'      },
  { id: 'abd_mach',    name: 'Hip Abduction',           group: 'Glutes',     role: 'isolation', tier: 'accessory', equipment: 'machine'    },

  // Calves
  { id: 'stand_calf',  name: 'Standing Calf Raise',     group: 'Calves',     role: 'isolation', tier: 'secondary', equipment: 'machine'    },
  { id: 'seat_calf',   name: 'Seated Calf Raise',       group: 'Calves',     role: 'isolation', tier: 'accessory', equipment: 'machine'    },

  // Core
  { id: 'plank',        name: 'Plank',                  group: 'Core',       role: 'isolation', tier: 'primary',   equipment: 'bodyweight' },
  { id: 'hang_leg',     name: 'Hanging Leg Raise',      group: 'Core',       role: 'isolation', tier: 'primary',   equipment: 'bodyweight' },
  { id: 'ab_wheel',     name: 'Ab Wheel Rollout',       group: 'Core',       role: 'isolation', tier: 'primary',   equipment: 'bodyweight' },
  { id: 'cable_crunch', name: 'Cable Crunch',           group: 'Core',       role: 'isolation', tier: 'secondary', equipment: 'cable'      },
  { id: 'dead_bug',     name: 'Dead Bug',               group: 'Core',       role: 'isolation', tier: 'secondary', equipment: 'bodyweight' },
  { id: 'pallof',       name: 'Pallof Press',           group: 'Core',       role: 'isolation', tier: 'secondary', equipment: 'cable'      },
  { id: 'side_plank',   name: 'Side Plank',             group: 'Core',       role: 'isolation', tier: 'accessory', equipment: 'bodyweight' },
  { id: 'russian_t',    name: 'Russian Twist',          group: 'Core',       role: 'isolation', tier: 'accessory', equipment: 'bodyweight' },
  { id: 'bird_dog',     name: 'Bird Dog',               group: 'Core',       role: 'isolation', tier: 'accessory', equipment: 'bodyweight' },
]
