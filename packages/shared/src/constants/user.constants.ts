export const USER_TYPES = {
  RELOCATION_EXPLORER: 'relocation_explorer',
  WEEKEND_TRAVELER: 'weekend_traveler',
  OUTDOOR_ADVENTURER: 'outdoor_adventurer',
} as const;

export const EXPLORATION_TIMELINES = {
  SHORT: '1-3 months',
  MEDIUM: '3-6 months',
  LONG: '6-12 months',
  EXTENDED: '1+ years',
} as const;

export const INTEREST_CATEGORIES = {
  WORK: ['remote work', 'tech hubs', 'startup scene', 'job market', 'coworking spaces'],
  LIFESTYLE: ['nightlife', 'food scene', 'arts & culture', 'fitness', 'shopping', 'nature'],
  CLIMATE: ['tropical', 'mediterranean', 'continental', 'desert', 'mountain', 'coastal'],
} as const;