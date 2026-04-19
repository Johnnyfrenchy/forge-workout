export interface SessionType {
  name: string
  split: string
  focus: string
  style: 'heavy' | 'hyper'
}

export const SESSION_TYPES: Record<string, SessionType> = {
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
